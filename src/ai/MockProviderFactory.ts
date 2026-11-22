import { AIProviderFactory } from './AIProviderFactory';
import type { LLMClient, LLMRequest, LLMResponse } from './LLMClient';
import { products } from '../products';
import { GROUNDING_REDIRECT_PREFIX } from '../pricing/priceParsing';

// ============================================================
// [Kalıp: ABSTRACT FACTORY — Concrete Factory (Mock ailesi)]
// ============================================================
// Gerçek yapay zekâ çağrısı yapmaz, kredi harcamaz. İki amaçla kullanılır:
//  1) Otomatik testlerde istenen yanıtı vermek (handler'lar dışarıdan verilir)
//  2) AI_PROVIDER=mock ile sunucuyu anahtarsız ve ücretsiz çalıştırmak (demo)

export type MockHandler = (request: LLMRequest) => string | LLMResponse | Promise<string | LLMResponse>;

export class MockLLMClient implements LLMClient {
    // Testlerde "hangi istek gönderildi?" sorusunu cevaplamak için
    readonly calls: LLMRequest[] = [];

    constructor(private readonly handler: MockHandler) {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        this.calls.push(request);
        const result = await this.handler(request);
        return typeof result === 'string' ? { text: result, groundingUris: [] } : result;
    }
}

// Demo yanıtı: uyumlu, 8 parçalık sabit bir sistem (AM4 / DDR4)
export const DEMO_RECOMMENDATION = JSON.stringify({
    recommended_product_ids: [1, 11, 22, 32, 41, 51, 57, 61],
    total_price: 53846,
    ai_explanation: "Demo modu: bu öneri gerçek yapay zekâdan değil, sahte sağlayıcıdan geliyor. Ryzen 5 5600 ve RX 6600 ile dengeli bir AM4 sistemi.",
    budget_tl: null
});

// Demo fiyat yanıtı: istenen her ürünün katalog fiyatını "arama sonucu" kaynağıyla döndürür
export function demoPriceResponse(request: LLMRequest): string {
    const ids = [...request.prompt.matchAll(/ID(\d+):/g)].map(match => Number(match[1]));
    const result: Record<string, { price: number; source: string } | null> = {};
    for (const id of ids) {
        const product = products.find(p => p.id === id);
        result[`ID${id}`] = product ? { price: product.price, source: `${GROUNDING_REDIRECT_PREFIX}mock-${id}` } : null;
    }
    return JSON.stringify(result);
}

export interface MockProviderOptions {
    recommendation?: MockHandler;
    priceSearch?: MockHandler;
}

export class MockProviderFactory extends AIProviderFactory {
    readonly recommendationClient: MockLLMClient;
    readonly priceSearchClient: MockLLMClient;

    constructor(options: MockProviderOptions = {}) {
        super();
        this.recommendationClient = new MockLLMClient(options.recommendation ?? (() => DEMO_RECOMMENDATION));
        this.priceSearchClient = new MockLLMClient(options.priceSearch ?? demoPriceResponse);
    }

    createRecommendationClient(): LLMClient {
        return this.recommendationClient;
    }

    createPriceSearchClient(): LLMClient {
        return this.priceSearchClient;
    }
}
