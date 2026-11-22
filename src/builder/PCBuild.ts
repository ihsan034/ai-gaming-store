import type { Category, Product } from '../types';
import type { PriceMap } from '../pricing/PricingStrategy';

// ============================================================
// [Kalıp: BUILDER — Product (inşa edilen nesne)]
// ============================================================
// Seçilen parçalar, fiyatları ve "tam sistem mi?" bilgisi tek bir değişmez nesnede toplanır.
// Doğrulama zinciri (validation/) ve HTTP yanıtı bu nesneden okur; Türkçe kategori adı
// eşleştirmesine dayanan eski arayüz mantığına gerek kalmaz.

export class PCBuild {
    constructor(
        readonly parts: readonly Product[],
        private readonly prices: Readonly<PriceMap>,
        readonly isFullSystem: boolean,
        readonly missingCategories: readonly Category[]
    ) {}

    priceOf(part: Product): number {
        return this.prices[part.id] ?? part.price;
    }

    get totalPrice(): number {
        return this.parts.reduce((sum, part) => sum + this.priceOf(part), 0);
    }

    // Kategorideki ilk parça (sistemde genelde tektir)
    first(category: Category): Product | undefined {
        return this.parts.find(part => part.category === category);
    }

    priceMap(): PriceMap {
        const map: PriceMap = {};
        for (const part of this.parts) map[part.id] = this.priceOf(part);
        return map;
    }
}
