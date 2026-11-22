import path from 'node:path';
import express, { type Express, type Request, type RequestHandler, type Response } from 'express';

import { recommendLimiter } from './rateLimit';
import { getErrorStatus } from './ai/errors';
import { RecommendationError, type RecommendationService } from './RecommendationService';
import type { ErrorResponse, Product, RecommendRequest, RecommendResponse } from './types';

export interface AppOptions {
    service: RecommendationService;
    products: Product[];
    // Testlerde IP sınırını devre dışı bırakmak için değiştirilebilir
    limiter?: RequestHandler;
}

// Gemini/SDK hatalarını kullanıcıya anlatılabilir mesaj ve HTTP koduna çevirir
export function mapAiError(error: unknown): { status: number; message: string } {
    if (error instanceof RecommendationError) return { status: error.status, message: error.message };

    switch (getErrorStatus(error)) {
        case 429:
            return { status: 429, message: "Yapay zeka kullanım kotası sınırına ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin." };
        case 503:
            return { status: 503, message: "Yapay zeka sunucuları şu anda aşırı yoğun. Tüm yeniden deneme girişimleri başarısız oldu." };
        case 400:
            return { status: 400, message: "Yapay zekaya gönderilen istek geçersiz veya çok uzun. Lütfen daha kısa ve net yazın." };
        default:
            return { status: 500, message: "Yapay zeka yanıt oluştururken beklenmedik bir hata oluştu. Lütfen tekrar deneyin." };
    }
}

export function createApp({ service, products, limiter = recommendLimiter }: AppOptions): Express {
    const app = express();

    // Render'da istek kullanıcı → Cloudflare → Render iç ağı → sunucu yolunu izler (loglarla doğrulandı:
    // x-forwarded-for = "kullanıcı, cloudflare, 10.x"). 3 adıma güvenince req.ip Cloudflare'in yazdığı
    // gerçek kullanıcı IP'si olur; kullanıcının başlığa eklediği sahte IP'ler dikkate alınmaz.
    app.set('trust proxy', 3);
    // Arayüz ve API aynı adreste olduğu için CORS açılmaz: başka siteler API'yi tarayıcıdan çağıramaz
    app.use(express.json({ limit: '10kb' }));
    // src/ (tsx) ve dist/ (derlenmiş) klasörlerinden aynı public/ klasörünü bul
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/api/products', (req: Request, res: Response<Product[]>) => {
        res.json(products);
    });

    app.post('/api/recommend-pc', limiter, async (
        req: Request<{}, RecommendResponse | ErrorResponse, RecommendRequest>,
        res: Response<RecommendResponse | ErrorResponse>
    ) => {
        const { userPrompt } = req.body ?? {};
        if (!userPrompt) {
            return res.status(400).json({ error: "Lütfen yapay zekaya bir mesaj gönderin." });
        }

        try {
            return res.json(await service.recommend(userPrompt));
        } catch (error) {
            console.error("AI Hatası:", error);
            const { status, message } = mapAiError(error);
            return res.status(status).json({ error: message });
        }
    });

    return app;
}
