import type { Product } from '../types';
import type { LLMClient } from '../ai/LLMClient';
import { getErrorMessage } from '../ai/errors';
import type { PriceMap, PricingStrategy } from './PricingStrategy';
import { CatalogPricing } from './CatalogPricing';
import { extractJsonObject, readPriceEntry, isSearchSource } from './priceParsing';

// ============================================================
// [Kalıp: STRATEGY — Concrete Strategy #2]
// ============================================================
// Canlı fiyat katalog fiyatının yarısından düşükse reddedilir (taksit tutarı, ikinci el ilan).
// Üst sınır yok: katalog eski ve SSD/RAM fiyatları katlandı (ör. 32GB DDR5 katalogda 4.100 TL,
// Akakçe'de 36.000 TL); yanlış fiyatlara karşı asıl koruma kaynağın arama sonucu olması.
export const MIN_PRICE_RATIO = 0.5;

// Bulunan fiyat 24 saat önbellekte tutulur; aynı ürünün fiyatı her istekte zıplamaz
export const PRICE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPrice {
    price: number;
    source?: string;
    expiresAt: number;
}

export interface LivePricingOptions {
    // Canlı fiyat bulunamayan ürünler için yedek strateji (varsayılan: katalog fiyatı)
    fallback?: PricingStrategy;
    // Testlerde zamanı kontrol etmek için
    now?: () => number;
    cacheTtlMs?: number;
}

export function buildPriceSearchPrompt(products: Product[]): string {
    const productList = products
        .map(p => `ID${p.id}: ${p.brand} ${p.model}`)
        .join('\n');

    return `Türkiye'de şu PC bileşenlerinin güncel, sıfır ürün satış fiyatlarını ara. Her ürün için ayrı arama yap; fiyat karşılaştırma sitelerini (Akakçe, Cimri) ve e-ticaret sitelerini (Hepsiburada, Trendyol, İtopya) kullan:

${productList}

Kurallar:
- Fiyat, ürünün tek seferde ödenen TL fiyatı olmalı; taksit tutarı, ikinci el veya farklı model fiyatı kullanma.
- Her fiyat için o fiyatı gördüğün Google arama sonucunun bağlantısını "source" alanına olduğu gibi kopyala; adres uydurma veya kendin yazma.
- Fiyatı bu aramada gördüğün sonuçlardan al, kendi bilgine dayanarak fiyat yazma.
- Güvenilir bir fiyat bulamadığın ürün için null yaz.

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"ID1": {"price": 4200, "source": "https://..."}, "ID11": null}`;
}

export class LivePricing implements PricingStrategy {
    readonly name = 'live';

    private readonly cache = new Map<number, CachedPrice>();
    private readonly fallback: PricingStrategy;
    private readonly now: () => number;
    private readonly cacheTtlMs: number;

    constructor(private readonly client: LLMClient, options: LivePricingOptions = {}) {
        this.fallback = options.fallback ?? new CatalogPricing();
        this.now = options.now ?? Date.now;
        this.cacheTtlMs = options.cacheTtlMs ?? PRICE_CACHE_TTL_MS;
    }

    async getPrices(products: Product[]): Promise<PriceMap> {
        const prices: PriceMap = {};
        const now = this.now();

        // Önbellekte geçerli fiyatı olan ürünleri tekrar arama
        const toSearch = products.filter(p => {
            const cached = this.cache.get(p.id);
            if (cached && cached.expiresAt > now) {
                prices[p.id] = cached.price;
                return false;
            }
            return true;
        });

        if (products.length > toSearch.length) {
            console.log(`💾 ${products.length - toSearch.length} ürünün fiyatı önbellekten alındı.`);
        }

        if (toSearch.length > 0) {
            console.log(`🔍 ${toSearch.length} ürün için gerçek fiyat aranıyor...`);
            let missing = await this.searchOnce(toSearch, prices, now);

            // Bulunamayanlar için tek bir ikinci deneme (kota için ürün başına ayrı istek atılmaz)
            if (missing.length > 0) {
                console.log(`🔁 ${missing.length} ürün için ikinci deneme...`);
                missing = await this.searchOnce(missing, prices, now);
            }

            const found = toSearch.length - missing.length;
            console.log(`✅ Fiyat araması bitti: ${found}/${toSearch.length} canlı fiyat, ${missing.length} ürün katalog fiyatında.`);
        }

        // Canlı fiyatı bulunamayanlar yedek stratejiye düşer
        const unresolved = products.filter(p => prices[p.id] === undefined);
        if (unresolved.length > 0) Object.assign(prices, await this.fallback.getPrices(unresolved));

        return prices;
    }

    // Bir grup ürünün fiyatını tek bir istekle arar; kabul edilen fiyatları `prices`'a ve
    // önbelleğe yazar, fiyatı bulunamayan veya reddedilen ürünleri döndürür.
    private async searchOnce(toSearch: Product[], prices: PriceMap, now: number): Promise<Product[]> {
        const missing: Product[] = [];

        try {
            const response = await this.client.generate({ prompt: buildPriceSearchPrompt(toSearch) });
            const groundingUris = new Set(response.groundingUris);
            const parsed = extractJsonObject(response.text);

            if (!parsed) {
                console.warn("⚠️ Fiyat cevabında JSON bulunamadı.");
                return toSearch;
            }

            toSearch.forEach(p => {
                const entry = readPriceEntry(parsed[`ID${p.id}`]);
                const label = `ID${p.id} ${p.brand} ${p.model}`;

                if (!entry) {
                    console.log(`   ➖ ${label}: bulunamadı`);
                    missing.push(p);
                    return;
                }

                const price = Math.round(entry.price);

                if (!isSearchSource(entry.source, groundingUris)) {
                    console.log(`   ❌ ${label}: ${price} TL reddedildi, kaynak arama sonucu değil: ${entry.source ?? "yok"}`);
                    missing.push(p);
                    return;
                }

                if (price / p.price < MIN_PRICE_RATIO) {
                    console.log(`   ❌ ${label}: ${price} TL reddedildi (katalog ${p.price} TL), kaynak: ${entry.source ?? "yok"}`);
                    missing.push(p);
                    return;
                }

                prices[p.id] = price;
                this.cache.set(p.id, { price, source: entry.source, expiresAt: now + this.cacheTtlMs });
                console.log(`   ✅ ${label}: ${price} TL, kaynak: ${entry.source ?? "yok"}`);
            });

            return missing;
        } catch (err) {
            console.warn("⚠️ Fiyat araması başarısız:", getErrorMessage(err));
            return toSearch;
        }
    }
}
