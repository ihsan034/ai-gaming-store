// Fiyat aramasının yanıtını okuyan ve doğrulayan saf fonksiyonlar (yan etkisiz, kolay test edilir).

// Google aramasının döndürdüğü bağlantılar bu adresle başlar. Modelin kendi yazdığı
// adresler (ör. hepsiburada.com/...) uydurma olabildiği için kaynak sayılmaz.
export const GROUNDING_REDIRECT_PREFIX = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/';

export function isSearchSource(source: string | undefined, groundingUris: Set<string>): boolean {
    if (!source) return false;
    return source.startsWith(GROUNDING_REDIRECT_PREFIX) || groundingUris.has(source);
}

// Modelin cevabındaki JSON nesnesini çıkar (```json bloğu veya açıklama metni içinde olabilir)
export function extractJsonObject(text: string): Record<string, unknown> | null {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
        const parsed: unknown = JSON.parse(text.slice(start, end + 1));
        return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
        return null;
    }
}

// Bir ürünün değeri { "price": 5499, "source": "https://..." } veya düz sayı olarak gelebilir
export function readPriceEntry(entry: unknown): { price: number; source?: string } | null {
    if (typeof entry === 'object' && entry !== null && 'price' in entry) {
        const price = Number(entry.price);
        const source = 'source' in entry && typeof entry.source === 'string' ? entry.source : undefined;
        return Number.isFinite(price) && price > 0 ? { price, source } : null;
    }
    const price = Number(entry);
    return Number.isFinite(price) && price > 0 ? { price } : null;
}
