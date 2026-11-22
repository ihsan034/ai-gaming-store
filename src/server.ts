import 'dotenv/config';

import { products } from './products';
import { LIMITS } from './rateLimit';
import { createApp } from './app';
import { createRecommendationService } from './composition';

// Giriş noktası: yalnızca ortamı okuyup uygulamayı ayağa kaldırır. İş mantığı src/ altındaki
// sınıflardadır (bkz. TASARIM-KALIPLARI.md).
let service;
try {
    service = createRecommendationService(process.env);
} catch (error) {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exit(1);
}

const PORT = Number(process.env.PORT) || 5000;
const app = createApp({ service, products });

app.listen(PORT, () => {
    console.log(`✅ Sunucu ${PORT} portunda başarıyla başlatıldı.`);
    console.log(`🤖 Yapay zekâ sağlayıcısı: ${process.env.AI_PROVIDER ?? 'gemini'}, fiyat modu: ${process.env.PRICING_MODE ?? 'live'}.`);
    console.log(`🛡️ Sınırlar: IP başına ${LIMITS.perIpPerMinute}/dk ve ${LIMITS.perIpPerDay}/gün, toplam ${LIMITS.globalPerDay}/gün, mesaj ${LIMITS.maxPromptLength} karakter.`);
});
