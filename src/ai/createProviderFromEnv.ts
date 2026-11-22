import type { AIProviderFactory } from './AIProviderFactory';
import { GeminiProviderFactory } from './GeminiProviderFactory';
import { MockProviderFactory } from './MockProviderFactory';

// Hangi concrete factory'nin kullanılacağı tek bir yerde, ortam değişkeninden seçilir:
//   AI_PROVIDER=gemini (varsayılan) → GEMINI_API_KEY gerekir
//   AI_PROVIDER=mock               → anahtar gerekmez, kredi harcanmaz
export function createProviderFromEnv(env: NodeJS.ProcessEnv): AIProviderFactory {
    const provider = (env.AI_PROVIDER ?? 'gemini').toLowerCase();

    if (provider === 'mock') return new MockProviderFactory();

    if (provider === 'gemini') {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil. .env dosyasına ekleyin veya AI_PROVIDER=mock kullanın.");
        return new GeminiProviderFactory(apiKey);
    }

    throw new Error(`Bilinmeyen AI_PROVIDER değeri: "${provider}" (gemini veya mock olmalı).`);
}
