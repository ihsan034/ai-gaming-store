import 'dotenv/config';
import path from 'node:path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';

import { products } from './products';
import type {
    Product,
    LivePrices,
    RecommendRequest,
    RecommendResponse,
    ErrorResponse,
    AiRecommendation
} from './types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY tanımlı değil. .env dosyasına ekleyin.");
    process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(cors());
app.use(express.json());
// src/ (tsx) ve dist/ (derlenmiş) klasörlerinden aynı public/ klasörünü bul
app.use(express.static(path.join(__dirname, '..', 'public')));

// Hata nesnesinden HTTP durum kodunu güvenli şekilde oku (Gemini SDK hataları .status taşır)
function getErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        return error.status;
    }
    return undefined;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// ============================================================
// RETRY MEKANİZMASI
// ============================================================
async function callGeminiWithRetry(requestOptions: GenerateContentParameters, maxRetries = 3): Promise<GenerateContentResponse> {
    const baseDelay = 2000;

    for (let attempt = 0; ; attempt++) {
        try {
            const response = await ai.models.generateContent(requestOptions);
            if (attempt > 0) console.log(`✅ Gemini ${attempt + 1}. denemede başarılı.`);
            return response;
        } catch (error) {
            const isRetryable = getErrorStatus(error) === 503;
            const isLastAttempt = attempt === maxRetries;

            if (!isRetryable) throw error;
            if (isLastAttempt) {
                console.error(`❌ Gemini ${maxRetries + 1} deneme sonrasında başarısız.`);
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`⚠️ 503 hatası. ${delay / 1000}s sonra tekrar denenecek...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ============================================================
// SADECE ÖNERİLEN ÜRÜNLERİN GERÇEK FİYATINI ÇEKEN FONKSİYON
// ============================================================
async function fetchRealPricesForProducts(selectedProducts: Product[]): Promise<LivePrices> {
    if (selectedProducts.length === 0) return {};

    const productList = selectedProducts
        .map(p => `ID${p.id}: ${p.brand} ${p.model}`)
        .join('\n');

    console.log(`🔍 ${selectedProducts.length} ürün için gerçek fiyat aranıyor...`);

    try {
        const response = await callGeminiWithRetry({
            model: 'gemini-2.5-flash',
            contents: `Türkiye e-ticaret sitelerinde (Hepsiburada, Trendyol, İtopya) şu PC bileşenlerinin güncel ortalama fiyatlarını ara:

${productList}

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"ID1": 4200, "ID11": 9500}`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\{[^{}]+\}/);

        if (jsonMatch) {
            const parsed: Record<string, unknown> = JSON.parse(jsonMatch[0]);

            // Sadece seçilen ürünlere ait, pozitif sayı olan fiyatları kabul et
            // ("4.200 TL" gibi metinler veya 0/negatif değerler katalog fiyatına düşer)
            const prices: LivePrices = {};
            selectedProducts.forEach(p => {
                const value = Number(parsed[`ID${p.id}`]);
                if (Number.isFinite(value) && value > 0) prices[`ID${p.id}`] = Math.round(value);
            });

            console.log("✅ Gerçek fiyatlar alındı:", prices);
            return prices;
        }
    } catch (err) {
        console.warn("⚠️ Gerçek fiyat alınamadı, veritabanı fiyatları kullanılıyor:", getErrorMessage(err));
    }

    return {};
}

// ============================================================
// ROTALAR
// ============================================================

app.get('/', (req: Request, res: Response) => {
    res.send('AI-Powered PC Store Backend Çalışıyor!');
});

app.get('/api/products', (req: Request, res: Response<Product[]>) => {
    res.json(products);
});

app.post('/api/recommend-pc', async (
    req: Request<{}, RecommendResponse | ErrorResponse, RecommendRequest>,
    res: Response<RecommendResponse | ErrorResponse>
) => {
    try {
        const { userPrompt } = req.body ?? {};

        if (!userPrompt) {
            return res.status(400).json({ error: "Lütfen yapay zekaya bir mesaj gönderin." });
        }

        const systemInstruction = `
        Sen bir bilgisayar donanımı uzmanısın ve bir e-ticaret sitesinin akıllı sistem toplama asistanısın.
        Görevin, kullanıcının isteklerine (bütçe, oyun/program tercihleri, özel istekler) en uygun bilgisayar sistemini oluşturmaktır.

        AŞAĞIDAKİ ÜRÜN HAVUZUNU KULLANMAK ZORUNDASIN. Havuzda olmayan hiçbir ürünü listeye ekleme:
        ${JSON.stringify(products, null, 2)}

        UYULMASI ZORUNLU KURALLAR:
        1. Toplam sistem fiyatı kullanıcının belirttiği bütçeyi kesinlikle AŞMAMALIDIR.
        2. Seçtiğin parçalar birbiriyle uyumlu olmalıdır (AM4↔AM4↔DDR4, AM5↔AM5↔DDR5, LGA1700↔LGA1700).
        3. Kullanıcı komple bir bilgisayar toplamak istiyorsa sistemde mutlaka en az 1 adet CPU, 1 adet GPU, 1 adet Motherboard, 1 adet RAM, 1 adet Power (PSU), 1 adet SSD ve 1 adet Case bulunmalıdır.
        4. Kullanıcı sadece belirli bir parça istiyorsa (Örn: "sadece ekran kartı göster") sadece o kategorileri listele.
        5. Isınma endişesi varsa açıklamada belirt.

        YANIT FORMATI (sadece JSON, markdown yok):
        {
          "recommended_product_ids": [1, 11, 22, 32, 41, 51, 56],
          "total_price": 22400,
          "ai_explanation": "Kullanıcıya sistemin neden seçildiğini açıklayan kısa ve profesyonel bir Türkçe mesaj."
        }`;

        // 1. AŞAMA: Gemini'den ürün önerisi al
        const response = await callGeminiWithRetry({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        let aiResponseText = response.text?.trim() || "";
        if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        let resultJson: AiRecommendation;
        try {
            resultJson = JSON.parse(aiResponseText);
        } catch (parseError) {
            console.error("JSON Parse Hatası:", parseError, "Ham metin:", aiResponseText);
            return res.status(500).json({ error: "Yapay zeka geçersiz JSON döndü. Lütfen tekrar deneyin." });
        }

        if (!resultJson || typeof resultJson !== 'object') {
            return res.status(500).json({ error: "Geçersiz yanıt formatı alındı." });
        }

        const recommendedIds: unknown[] = Array.isArray(resultJson.recommended_product_ids)
            ? resultJson.recommended_product_ids
            : [];
        const aiExplanation = typeof resultJson.ai_explanation === 'string' && resultJson.ai_explanation
            ? resultJson.ai_explanation
            : "Sisteminiz başarıyla oluşturuldu.";

        // Ürün ID'lerini veritabanına göre doğrula
        const selectedProducts: Product[] = [];
        recommendedIds.forEach(id => {
            const product = products.find(p => p.id === Number(id));
            if (product) {
                selectedProducts.push(product);
            } else {
                console.warn(`⚠️ Geçersiz ürün ID'si önerildi: ${id}`);
            }
        });

        // 2. AŞAMA: Sadece önerilen ürünler için gerçek fiyat ara
        const realPrices = await fetchRealPricesForProducts(selectedProducts);

        // Gerçek fiyatlarla toplam fiyatı ve override map'i oluştur
        let calculatedTotalPrice = 0;
        const priceOverrides: Record<number, number> = {};

        selectedProducts.forEach(p => {
            const realPrice = realPrices[`ID${p.id}`] || p.price;
            calculatedTotalPrice += realPrice;
            priceOverrides[p.id] = realPrice;
        });

        return res.json({
            recommended_product_ids: selectedProducts.map(p => p.id),
            total_price: calculatedTotalPrice,
            ai_explanation: aiExplanation,
            price_overrides: priceOverrides
        });

    } catch (error) {
        console.error("AI Hatası:", error);

        let errorMessage = "Yapay zeka yanıt oluştururken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.";
        let statusCode = 500;

        const status = getErrorStatus(error);
        if (status === 429) {
            errorMessage = "Yapay zeka kullanım kotası sınırına ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
            statusCode = 429;
        } else if (status === 503) {
            errorMessage = "Yapay zeka sunucuları şu anda aşırı yoğun. Tüm yeniden deneme girişimleri başarısız oldu.";
            statusCode = 503;
        } else if (status === 400) {
            errorMessage = "Yapay zekaya gönderilen istek geçersiz veya çok uzun. Lütfen daha kısa ve net yazın.";
            statusCode = 400;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});
