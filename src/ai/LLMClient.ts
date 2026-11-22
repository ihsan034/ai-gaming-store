// ============================================================
// [Kalıp: ADAPTER — Target (hedef arayüz)]
// ============================================================
// Uygulamanın geri kalanı yapay zekâ sağlayıcısını bu arayüz üzerinden tanır. Sağlayıcının SDK'sı
// (şu an Google Gemini) sadece GeminiClientAdapter içinde bilinir; SDK değişirse tek sınıf değişir.
// Retry ve loglama bu arayüzü sarmalayan Decorator'lardır (RetryingLLMClient, LoggingLLMClient).

export interface LLMRequest {
    prompt: string;
    systemInstruction?: string;
}

export interface LLMResponse {
    text: string;
    // Sağlayıcının arama aracıyla gerçekten ziyaret ettiği adresler (fiyat doğrulaması bunları kullanır)
    groundingUris: string[];
}

export interface LLMClient {
    generate(request: LLMRequest): Promise<LLMResponse>;
}
