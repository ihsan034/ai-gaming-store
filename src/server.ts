import 'dotenv/config';
import path from 'node:path';
import express, { Request, Response } from 'express';
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, ThinkingLevel } from '@google/genai';

import { products } from './products';
import { recommendLimiter, LIMITS } from './rateLimit';
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
// gemini-2.5-flash yeni API anahtarlarına kapatıldı
const GEMINI_MODEL = 'gemini-3.8-flash';
// Fiyat araması basit bir "bul ve yaz" işi: LOW ile ~10 sn, varsayılanla ~18 sn (ölçüm 26.10.2026).
// Öneri çağrısında düşünme kısılmaz: LOW'da 4 sistemin 4'ü bütçeyi aştı, varsayılanda hepsi doğruydu.
const PRICE_SEARCH_THINKING = ThinkingLevel.LOW;

// Yapay zekâya sadece piyasada bulunan ürünler gösterilir (stok 0 = artık satılmıyor)
const availableProducts = products.filter(p => p.stock > 0);

// Render'da istek kullanıcı → Cloudflare → Render iç ağı → sunucu yolunu izler (loglarla doğrulandı:
// x-forwarded-for = "kullanıcı, cloudflare, 10.x"). 3 adıma güvenince req.ip Cloudflare'in yazdığı
// gerçek kullanıcı IP'si olur; kullanıcının başlığa eklediği sahte IP'ler dikkate alınmaz.
app.set('trust proxy', 3);
// Arayüz ve API aynı adreste olduğu için CORS açılmaz: başka siteler API'yi tarayıcıdan çağıramaz
app.use(express.json({ limit: '10kb' }));
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
// Canlı fiyat katalog fiyatının yarısından düşükse reddedilir (taksit tutarı, ikinci el ilan).
// Üst sınır yok: katalog eski ve SSD/RAM fiyatları katlandı (ör. 32GB DDR5 katalogda 4.100 TL,
// Akakçe'de 36.000 TL); yanlış fiyatlara karşı asıl koruma kaynağın arama sonucu olması.
const MIN_PRICE_RATIO = 0.5;

// Bulunan fiyat 24 saat önbellekte tutulur; aynı ürünün fiyatı her istekte zıplamaz
const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPrice {
    price: number;
    source?: string;
    expiresAt: number;
}

const priceCache = new Map<number, CachedPrice>();

// Google aramasının döndürdüğü bağlantılar bu adresle başlar. Modelin kendi yazdığı
// adresler (ör. hepsiburada.com/...) uydurma olabildiği için kaynak sayılmaz.
const GROUNDING_REDIRECT_PREFIX = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/';

function isSearchSource(source: string | undefined, groundingUris: Set<string>): boolean {
    if (!source) return false;
    return source.startsWith(GROUNDING_REDIRECT_PREFIX) || groundingUris.has(source);
}

// Modelin cevabındaki JSON nesnesini çıkar (```json bloğu veya açıklama metni içinde olabilir)
function extractJsonObject(text: string): Record<string, unknown> | null {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
        const parsed: unknown = JSON.parse(text.slice(start, end + 1));
        return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
        return null;
    }
}

// Bir ürünün değeri { "price": 5499, "source": "https://..." } veya düz sayı olarak gelebilir
function readPriceEntry(entry: unknown): { price: number; source?: string } | null {
    if (typeof entry === 'object' && entry !== null && 'price' in entry) {
        const price = Number(entry.price);
        const source = 'source' in entry && typeof entry.source === 'string' ? entry.source : undefined;
        return Number.isFinite(price) && price > 0 ? { price, source } : null;
    }
    const price = Number(entry);
    return Number.isFinite(price) && price > 0 ? { price } : null;
}

// Bir grup ürünün fiyatını tek bir Gemini isteğiyle arar; kabul edilen fiyatları `prices`'a ve
// önbelleğe yazar, fiyatı bulunamayan veya reddedilen ürünleri döndürür.
async function searchPricesOnce(toSearch: Product[], prices: LivePrices, now: number): Promise<Product[]> {
    const productList = toSearch
        .map(p => `ID${p.id}: ${p.brand} ${p.model}`)
        .join('\n');

    const missing: Product[] = [];

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL,
            contents: `Türkiye'de şu PC bileşenlerinin güncel, sıfır ürün satış fiyatlarını ara. Her ürün için ayrı arama yap; fiyat karşılaştırma sitelerini (Akakçe, Cimri) ve e-ticaret sitelerini (Hepsiburada, Trendyol, İtopya) kullan:

${productList}

Kurallar:
- Fiyat, ürünün tek seferde ödenen TL fiyatı olmalı; taksit tutarı, ikinci el veya farklı model fiyatı kullanma.
- Her fiyat için o fiyatı gördüğün Google arama sonucunun bağlantısını "source" alanına olduğu gibi kopyala; adres uydurma veya kendin yazma.
- Fiyatı bu aramada gördüğün sonuçlardan al, kendi bilgine dayanarak fiyat yazma.
- Güvenilir bir fiyat bulamadığın ürün için null yaz.

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"ID1": {"price": 4200, "source": "https://..."}, "ID11": null}`,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: PRICE_SEARCH_THINKING }
            }
        });

        const grounding = response.candidates?.[0]?.groundingMetadata;
        const groundingUris = new Set(
            (grounding?.groundingChunks ?? [])
                .map(chunk => chunk.web?.uri)
                .filter((uri): uri is string => typeof uri === 'string')
        );
        const parsed = extractJsonObject(response.text || "");

        if (!parsed) {
            console.warn("⚠️ Fiyat cevabında JSON bulunamadı.");
            return toSearch;
        }

        toSearch.forEach(p => {
            const entry = readPriceEntry(parsed[`ID${p.id}`]);
            const label = `ID${p.id} ${p.brand} ${p.model}`;

            if (!entry) {
                console.log(`   ➖ ${label}: bulunamadı`);
                missing.push(p);
                return;
            }

            const price = Math.round(entry.price);

            if (!isSearchSource(entry.source, groundingUris)) {
                console.log(`   ❌ ${label}: ${price} TL reddedildi, kaynak arama sonucu değil: ${entry.source ?? "yok"}`);
                missing.push(p);
                return;
            }

            const ratio = price / p.price;
            if (ratio < MIN_PRICE_RATIO) {
                console.log(`   ❌ ${label}: ${price} TL reddedildi (katalog ${p.price} TL), kaynak: ${entry.source ?? "yok"}`);
                missing.push(p);
                return;
            }

            prices[`ID${p.id}`] = price;
            priceCache.set(p.id, { price, source: entry.source, expiresAt: now + PRICE_CACHE_TTL_MS });
            console.log(`   ✅ ${label}: ${price} TL, kaynak: ${entry.source ?? "yok"}`);
        });

        return missing;
    } catch (err) {
        console.warn("⚠️ Fiyat araması başarısız:", getErrorMessage(err));
        return toSearch;
    }
}

async function fetchRealPricesForProducts(selectedProducts: Product[]): Promise<LivePrices> {
    const prices: LivePrices = {};
    const now = Date.now();

    // Önbellekte geçerli fiyatı olan ürünleri tekrar arama
    const toSearch = selectedProducts.filter(p => {
        const cached = priceCache.get(p.id);
        if (cached && cached.expiresAt > now) {
            prices[`ID${p.id}`] = cached.price;
            return false;
        }
        return true;
    });

    if (selectedProducts.length > toSearch.length) {
        console.log(`💾 ${selectedProducts.length - toSearch.length} ürünün fiyatı önbellekten alındı.`);
    }
    if (toSearch.length === 0) return prices;

    console.log(`🔍 ${toSearch.length} ürün için gerçek fiyat aranıyor...`);
    let missing = await searchPricesOnce(toSearch, prices, now);

    // Bulunamayanlar için tek bir ikinci deneme (kota için ürün başına ayrı istek atılmaz)
    if (missing.length > 0) {
        console.log(`🔁 ${missing.length} ürün için ikinci deneme...`);
        missing = await searchPricesOnce(missing, prices, now);
    }

    const found = toSearch.length - missing.length;
    console.log(`✅ Fiyat araması bitti: ${found}/${toSearch.length} canlı fiyat, ${missing.length} ürün katalog fiyatında.`);
    return prices;
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

app.post('/api/recommend-pc', recommendLimiter, async (
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
        ${JSON.stringify(availableProducts, null, 2)}

        UYULMASI ZORUNLU KURALLAR:
        1. Toplam sistem fiyatı kullanıcının belirttiği bütçeyi kesinlikle AŞMAMALIDIR.
        2. Seçtiğin parçalar birbiriyle uyumlu olmalıdır (AM4↔AM4↔DDR4, AM5↔AM5↔DDR5, LGA1700↔LGA1700).
        3. Kullanıcı komple bir bilgisayar toplamak istiyorsa sistemde mutlaka en az 1 adet CPU, 1 adet GPU, 1 adet Motherboard, 1 adet RAM, 1 adet Power (PSU), 1 adet SSD, 1 adet Case ve 1 adet Cooler (işlemci soğutucu) bulunmalıdır. Katalogdaki işlemciler soğutucusuz satılır.
        4. Kullanıcı sadece belirli bir parça istiyorsa (Örn: "sadece ekran kartı göster") sadece o kategorileri listele.
        5. Soğutucu işlemcinin gücüne uygun olmalıdır: 65W işlemciye herhangi bir soğutucu; 105W-120W işlemciye en az "Hava - tek kule"; 125W işlemciye (i5-14600K, i7-14700K) "Hava - çift kule" veya sıvı; i9-14900K'ya sıvı soğutucu (tercihen 360mm).
        6. Güç kaynağının gücü, ekran kartının power_recommendation değerinden düşük olmamalıdır.
        7. Isınma endişesi varsa açıklamada belirt.

        YANIT FORMATI (sadece JSON, markdown yok):
        {
          "recommended_product_ids": [1, 11, 22, 32, 41, 51, 57, 61],
          "total_price": 22400,
          "ai_explanation": "Kullanıcıya sistemin neden seçildiğini açıklayan kısa ve profesyonel bir Türkçe mesaj."
        }`;

        // 1. AŞAMA: Gemini'den ürün önerisi al
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL,
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
            const product = availableProducts.find(p => p.id === Number(id));
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
    console.log(`🛡️ Sınırlar: IP başına ${LIMITS.perIpPerMinute}/dk ve ${LIMITS.perIpPerDay}/gün, toplam ${LIMITS.globalPerDay}/gün, mesaj ${LIMITS.maxPromptLength} karakter.`);
});
