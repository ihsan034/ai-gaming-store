import type { Product } from '../types';
import type { PriceMap, PricingStrategy } from './PricingStrategy';

// [Kalıp: STRATEGY — Concrete Strategy #1] Kataloğa yazılı fiyatı olduğu gibi kullanır.
export class CatalogPricing implements PricingStrategy {
    readonly name = 'catalog';

    async getPrices(products: Product[]): Promise<PriceMap> {
        const prices: PriceMap = {};
        for (const product of products) prices[product.id] = product.price;
        return prices;
    }
}
