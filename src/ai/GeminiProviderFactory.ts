import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { AIProviderFactory } from './AIProviderFactory';
import { GeminiClientAdapter } from './GeminiClientAdapter';
import { RetryingLLMClient } from './RetryingLLMClient';
import { LoggingLLMClient } from './LoggingLLMClient';
import type { LLMClient } from './LLMClient';

// ============================================================
// [Kalıp: ABSTRACT FACTORY — Concrete Factory (Gemini ailesi)]
// ============================================================
// gemini-2.5-flash yeni API anahtarlarına kapatıldı
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export class GeminiProviderFactory extends AIProviderFactory {
    private readonly gemini: GoogleGenAI;

    constructor(apiKey: string, private readonly model: string = DEFAULT_GEMINI_MODEL) {
        super();
        this.gemini = new GoogleGenAI({ apiKey });
    }

    createRecommendationClient(): LLMClient {
        // Öneri çağrısında düşünme kısılmaz: LOW'da 4 sistemin 4'ü bütçeyi aştı, varsayılanda hepsi doğruydu.
        const adapter = new GeminiClientAdapter(this.gemini, { model: this.model, jsonResponse: true });
        return this.decorate(adapter, 'öneri');
    }

    createPriceSearchClient(): LLMClient {
        // Fiyat araması basit bir "bul ve yaz" işi: LOW ile ~10 sn, varsayılanla ~18 sn (ölçüm 26.10.2026).
        const adapter = new GeminiClientAdapter(this.gemini, {
            model: this.model,
            googleSearch: true,
            thinkingLevel: ThinkingLevel.LOW
        });
        return this.decorate(adapter, 'fiyat araması');
    }

    // Decorator zinciri: Logging(Retrying(Adapter)). Log, yeniden denemeler dahil toplam süreyi gösterir.
    private decorate(adapter: LLMClient, label: string): LLMClient {
        return new LoggingLLMClient(new RetryingLLMClient(adapter), label);
    }
}
