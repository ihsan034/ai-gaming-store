import type { Product } from '../types';

// ============================================================
// [Kalıp: STRATEGY — Strategy arayüzü]
// ============================================================
// "Bir ürünün bugünkü fiyatı nedir?" sorusunun cevabı çalışma zamanında seçilebilir:
//   CatalogPricing → kataloğa yazılı fiyat (hızlı, ücretsiz, eskimiş olabilir)
//   LivePricing    → Google aramasıyla doğrulanmış güncel fiyat
// Sepet, toplam ve öneri aynı stratejiyi kullanır. Yeni bir kaynak (ör. kampanya fiyatı) eklemek
// yeni bir sınıf yazmaktır; mevcut koda dokunulmaz.

// ürün id → TL
export type PriceMap = Record<number, number>;

export interface PricingStrategy {
    readonly name: string;
    // Her ürün için mutlaka bir fiyat döndürür (bulunamazsa strateji kendi yedeğine düşer)
    getPrices(products: Product[]): Promise<PriceMap>;
}
