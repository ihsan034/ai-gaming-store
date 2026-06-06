const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const products = require('./products');

const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Retry (Yeniden Deneme) Mekanizması ---
// Gemini API çağrısını exponential backoff ile yeniden deneyen yardımcı fonksiyon.
// 503 hatasında otomatik olarak tekrar dener, 429 gibi kota hatalarında denemez.
async function callGeminiWithRetry(requestOptions, maxRetries = 3) {
    const baseDelay = 2000; // İlk bekleme süresi: 2 saniye

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent(requestOptions);
            // Başarılı yanıt döndü
            if (attempt > 0) {
                console.log(`✅ Gemini API ${attempt + 1}. denemede başarılı oldu.`);
            }
            return response;
        } catch (error) {
            const isRetryable = error && error.status === 503;
            const isLastAttempt = attempt === maxRetries;

            // 503 dışındaki hatalar (429, 400 vb.) için retry yapma, hatayı direkt fırlat
            if (!isRetryable) {
                throw error;
            }

            // Son deneme de başarısız olduysa hatayı fırlat
            if (isLastAttempt) {
                console.error(`❌ Gemini API ${maxRetries + 1} deneme sonrasında da başarısız oldu (503). Vazgeçiliyor.`);
                throw error;
            }

            // Exponential backoff: 2s, 4s, 8s
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`⚠️ Gemini API 503 hatası verdi. ${attempt + 1}/${maxRetries + 1}. deneme başarısız. ${delay / 1000} saniye sonra tekrar denenecek...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

app.get('/', (req, res) => {
    res.send('AI-Powered PC Store Backend Çalışıyor!');
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/recommend-pc', async (req, res) => {
    try {
        const { userPrompt } = req.body;

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
        2. Seçtiğin parçalar birbiriyle uyumlu olmalıdır (Örn: AM4 işlemci seçtiysen AM4 anakart ve DDR4 RAM seçmelisiniz. AM5 seçtiysen AM5 anakart ve DDR5 RAM seçmelisin).
        3. Kullanıcı komple bir bilgisayar toplamak istiyorsa sistemde mutlaka en az 1 adet CPU, 1 adet GPU, 1 adet Motherboard, 1 adet RAM, 1 adet Power (PSU), 1 adet SSD ve 1 adet Case bulunmalıdır. Ancak kullanıcı sadece belirli bir parça veya grup istiyorsa (Örn: "sadece ekran kartı göster", "SSD öner"), sadece kullanıcının istediği parça kategorilerini listelemelisin.
        4. Kullanıcının oyunlarda termal throttling (aşırı ısınma) yaşama endişesi varsa veya iyi soğutma istiyorsa bunu açıklama kısmında tatlı dille belirt.
        
        YANIT FORMATI:
        Yanıtı KESİNLİKLE sadece ve sadece aşağıdaki JSON formatında dönmelisin. Markdown etiketleri (\`\`\`json vb.) içermesin. Direkt süslü parantezle başlasın ve bitsin.
        
        {
          "recommended_product_ids": [1, 11, 22, 32, 41, 51, 56],
          "total_price": 22400,
          "ai_explanation": "Kullanıcıya sistemin neden seçildiğini, performansını ve uyumluluğunu açıklayan kısa ve profesyonel bir Türkçe mesaj."
        }
        `;

        // Gemini API çağrısı - retry mekanizması ile
        const response = await callGeminiWithRetry({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            }
        });

        let aiResponseText = response.text ? response.text.trim() : "";
        
        if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        let resultJson;
        try {
            resultJson = JSON.parse(aiResponseText);
        } catch (parseError) {
            console.error("JSON Parse Hatası:", parseError, "Gelen Ham Metin:", aiResponseText);
            return res.status(500).json({ 
                error: "Yapay zeka geçersiz bir JSON formatı döndü. Lütfen tekrar deneyin." 
            });
        }

        if (!resultJson || typeof resultJson !== 'object') {
            return res.status(500).json({ error: "Yapay zekadan geçersiz yanıt formatı alındı." });
        }

        let { recommended_product_ids, total_price, ai_explanation } = resultJson;

        if (!Array.isArray(recommended_product_ids)) {
            recommended_product_ids = [];
        }

        if (!ai_explanation || typeof ai_explanation !== 'string') {
            ai_explanation = "Sisteminiz başarıyla oluşturuldu.";
        }

        let validProductIds = [];
        let calculatedTotalPrice = 0;
        let categoriesFound = new Set();

        recommended_product_ids.forEach(id => {
            const product = products.find(p => p.id === Number(id));
            if (product) {
                validProductIds.push(product.id);
                calculatedTotalPrice += product.price;
                categoriesFound.add(product.category);
            } else {
                console.warn(`Veritabanında bulunmayan ürün ID'si yapay zeka tarafından önerildi: ${id}`);
            }
        });

        res.json({
            recommended_product_ids: validProductIds,
            total_price: calculatedTotalPrice,
            ai_explanation: ai_explanation
        });

    } catch (error) {
        console.error("AI Hatası:", error);
        
        let errorMessage = "Yapay zeka yanıt oluştururken beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.";
        let statusCode = 500;

        if (error && error.status) {
            if (error.status === 429) {
                errorMessage = "Yapay zeka kullanım kotası sınırına ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
                statusCode = 429;
            } else if (error.status === 503) {
                errorMessage = "Yapay zeka sunucuları şu anda aşırı yoğun. Tüm yeniden deneme girişimleri başarısız oldu. Lütfen birkaç dakika sonra tekrar deneyin.";
                statusCode = 503;
            } else if (error.status === 400) {
                errorMessage = "Yapay zekaya gönderilen istek geçersiz veya çok uzun. Lütfen daha kısa ve net yazın.";
                statusCode = 400;
            }
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});
