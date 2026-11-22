import type { LLMClient } from './LLMClient';

// ============================================================
// [Kalıp: ABSTRACT FACTORY — Abstract Factory]
// ============================================================
// Birbiriyle ilişkili iki ürünü (öneri istemcisi ve fiyat arama istemcisi) tek bir sağlayıcıdan,
// bir "aile" olarak üretir. Concrete factory'ler: GeminiProviderFactory (gerçek) ve
// MockProviderFactory (testler ve kredisiz demo). Sağlayıcıyı değiştirmek tek satırdır
// (AI_PROVIDER ortam değişkeni, bkz. createProviderFromEnv); öneri ve fiyat istemcileri asla
// farklı sağlayıcılardan karışmaz.

export abstract class AIProviderFactory {
    // Ürün A: katalogdan parça seçen ve JSON döndüren istemci
    abstract createRecommendationClient(): LLMClient;
    // Ürün B: seçilen parçaların güncel fiyatını arama aracıyla bulan istemci
    abstract createPriceSearchClient(): LLMClient;
}
