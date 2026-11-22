import type { LLMClient, LLMRequest, LLMResponse } from './LLMClient';
import { getErrorStatus } from './errors';

// ============================================================
// [Kalıp: DECORATOR — Concrete Decorator #1]
// ============================================================
// Başka bir LLMClient'ı sarmalar ve aynı arayüzü sunar; iş mantığına dokunmadan yeniden deneme
// davranışı ekler. Sadece 503 (sunucu yoğun) hatası yeniden denenir; bekleme süresi her denemede ikiye katlanır.

export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    // Testlerde gerçekten beklememek için değiştirilebilir
    sleep?: (ms: number) => Promise<void>;
    isRetryable?: (error: unknown) => boolean;
}

export class RetryingLLMClient implements LLMClient {
    private readonly maxRetries: number;
    private readonly baseDelayMs: number;
    private readonly sleep: (ms: number) => Promise<void>;
    private readonly isRetryable: (error: unknown) => boolean;

    constructor(private readonly inner: LLMClient, options: RetryOptions = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 2000;
        this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
        this.isRetryable = options.isRetryable ?? (error => getErrorStatus(error) === 503);
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        for (let attempt = 0; ; attempt++) {
            try {
                const response = await this.inner.generate(request);
                if (attempt > 0) console.log(`✅ Yapay zekâ çağrısı ${attempt + 1}. denemede başarılı.`);
                return response;
            } catch (error) {
                if (!this.isRetryable(error)) throw error;
                if (attempt === this.maxRetries) {
                    console.error(`❌ Yapay zekâ çağrısı ${this.maxRetries + 1} deneme sonrasında başarısız.`);
                    throw error;
                }

                const delay = this.baseDelayMs * Math.pow(2, attempt);
                console.warn(`⚠️ 503 hatası. ${delay / 1000}s sonra tekrar denenecek...`);
                await this.sleep(delay);
            }
        }
    }
}
