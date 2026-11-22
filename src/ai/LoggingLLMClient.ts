import type { LLMClient, LLMRequest, LLMResponse } from './LLMClient';
import { getErrorMessage } from './errors';

// ============================================================
// [Kalıp: DECORATOR — Concrete Decorator #2]
// ============================================================
// Her çağrının süresini ve sonucunu loglar. RetryingLLMClient ile birlikte
// new LoggingLLMClient(new RetryingLLMClient(adapter), 'öneri') şeklinde istenen sırayla üst üste
// takılır; kalıtımla "LoggingRetryingClient" gibi sınıflar türetmek gerekmez.

export class LoggingLLMClient implements LLMClient {
    constructor(private readonly inner: LLMClient, private readonly label: string) {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const startedAt = Date.now();
        try {
            const response = await this.inner.generate(request);
            console.log(`🤖 [${this.label}] ${Date.now() - startedAt} ms, ${response.text.length} karakter yanıt`);
            return response;
        } catch (error) {
            console.error(`🤖 [${this.label}] ${Date.now() - startedAt} ms sonra hata: ${getErrorMessage(error)}`);
            throw error;
        }
    }
}
