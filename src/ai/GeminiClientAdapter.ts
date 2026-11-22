import type { GoogleGenAI, GenerateContentConfig, ThinkingLevel } from '@google/genai';
import type { LLMClient, LLMRequest, LLMResponse } from './LLMClient';

// ============================================================
// [Kalıp: ADAPTER — Adapter sınıfı]
// ============================================================
// Adaptee: Google'ın GoogleGenAI SDK'sı (generateContent, groundingMetadata...). Bu sınıf SDK'nın
// istek ve yanıt biçimini uygulamanın LLMClient arayüzüne çevirir. SDK'ya özgü ayarlar (JSON yanıt,
// Google arama aracı, düşünme seviyesi) burada, istemci oluşturulurken verilir.

export interface GeminiOptions {
    model: string;
    jsonResponse?: boolean;
    googleSearch?: boolean;
    thinkingLevel?: ThinkingLevel;
}

export class GeminiClientAdapter implements LLMClient {
    constructor(
        private readonly gemini: Pick<GoogleGenAI, 'models'>,
        private readonly options: GeminiOptions
    ) {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const config: GenerateContentConfig = {};
        if (request.systemInstruction) config.systemInstruction = request.systemInstruction;
        if (this.options.jsonResponse) config.responseMimeType = 'application/json';
        if (this.options.googleSearch) config.tools = [{ googleSearch: {} }];
        if (this.options.thinkingLevel) config.thinkingConfig = { thinkingLevel: this.options.thinkingLevel };

        const response = await this.gemini.models.generateContent({
            model: this.options.model,
            contents: request.prompt,
            config
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const groundingUris = groundingChunks
            .map(chunk => chunk.web?.uri)
            .filter((uri): uri is string => typeof uri === 'string');

        return { text: response.text ?? '', groundingUris };
    }
}
