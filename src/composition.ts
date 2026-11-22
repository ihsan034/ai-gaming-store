import { products } from './products';
import { createProviderFromEnv } from './ai/createProviderFromEnv';
import type { AIProviderFactory } from './ai/AIProviderFactory';
import { CatalogPricing } from './pricing/CatalogPricing';
import { LivePricing } from './pricing/LivePricing';
import type { PricingStrategy } from './pricing/PricingStrategy';
import { createValidationChain } from './validation/createValidationChain';
import { RecommendationService } from './RecommendationService';

// Strategy'nin çalışma zamanında seçildiği yer:
//   PRICING_MODE=live (varsayılan) → Google aramasıyla canlı fiyat
//   PRICING_MODE=catalog           → kataloğa yazılı fiyat (hızlı ve ücretsiz)
export function createPricingStrategy(env: NodeJS.ProcessEnv, provider: AIProviderFactory): PricingStrategy {
    const mode = (env.PRICING_MODE ?? 'live').toLowerCase();

    if (mode === 'catalog') return new CatalogPricing();
    if (mode === 'live') return new LivePricing(provider.createPriceSearchClient());

    throw new Error(`Bilinmeyen PRICING_MODE değeri: "${mode}" (live veya catalog olmalı).`);
}

// Tüm parçaların birbirine bağlandığı tek yer (composition root)
export function createRecommendationService(env: NodeJS.ProcessEnv = process.env): RecommendationService {
    const provider = createProviderFromEnv(env);

    return new RecommendationService({
        recommender: provider.createRecommendationClient(),
        pricing: createPricingStrategy(env, provider),
        validation: createValidationChain(),
        // Yapay zekâya sadece piyasada bulunan ürünler gösterilir (stok 0 = artık satılmıyor)
        catalog: products.filter(p => p.stock > 0)
    });
}
