import type { Category, Product } from '../types';
import type { PriceMap } from '../pricing/PricingStrategy';
import { PCBuild } from './PCBuild';

// ============================================================
// [Kalıp: BUILDER — Builder]
// ============================================================
// Bir PCBuild adım adım kurulur: parçalar eklenir, fiyatlar yazılır, istenirse "komple sistem"
// kontrolü açılır. Hangi adımların hangi sırayla uygulanacağını Director'lar (directors.ts) belirler;
// aynı builder hem komple sistem hem tek parça isteklerini kurar.

// Komple bir sistemde bulunması gereken kategoriler
export const REQUIRED_CATEGORIES: readonly Category[] =
    ['CPU', 'GPU', 'Motherboard', 'RAM', 'Power', 'SSD', 'Case', 'Cooler'];

export class PCBuildBuilder {
    private parts: Product[] = [];
    private prices: PriceMap = {};
    private checkRequiredParts = false;

    // Aynı ürün iki kez eklenirse yok sayılır (toplam fiyata iki kez yazılmasın)
    addPart(part: Product): this {
        if (!this.parts.some(existing => existing.id === part.id)) this.parts.push(part);
        return this;
    }

    addParts(parts: Iterable<Product>): this {
        for (const part of parts) this.addPart(part);
        return this;
    }

    setPrices(prices: PriceMap): this {
        this.prices = { ...prices };
        return this;
    }

    // "Bu bir komple sistem" adımı: eksik kategoriler hesaplanır ve isFullSystem buna göre belirlenir
    requireCompleteSystem(): this {
        this.checkRequiredParts = true;
        return this;
    }

    build(): PCBuild {
        const missing = this.checkRequiredParts ? this.findMissingCategories() : [];
        const isFullSystem = this.checkRequiredParts && missing.length === 0;
        return new PCBuild([...this.parts], { ...this.prices }, isFullSystem, missing);
    }

    private findMissingCategories(): Category[] {
        const present = new Set(this.parts.map(part => part.category));
        // Dahili grafikli işlemcisi (specs.integrated_graphics) olan sistemde ekran kartı zorunlu değildir
        const hasIntegratedGraphics = this.parts.some(
            part => part.category === 'CPU' && part.specs['integrated_graphics'] !== undefined
        );

        return REQUIRED_CATEGORIES.filter(category =>
            !present.has(category) && !(category === 'GPU' && hasIntegratedGraphics)
        );
    }
}
