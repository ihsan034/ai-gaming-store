import type { Product } from '../types';
import type { PriceMap } from '../pricing/PricingStrategy';
import { PCBuildBuilder } from './PCBuildBuilder';
import type { PCBuild } from './PCBuild';

// ============================================================
// [Kalıp: BUILDER — Director'lar]
// ============================================================
// Director, Builder'ın adımlarını belirli bir sırayla çağırır. İki farklı istek türü, aynı builder'la
// farklı adım listeleriyle kurulur.

export interface BuildDirector {
    construct(parts: Product[], prices: PriceMap): PCBuild;
}

// Komple sistem isteği: parçalar + fiyatlar + "tüm kategoriler var mı?" kontrolü
export class FullSystemDirector implements BuildDirector {
    construct(parts: Product[], prices: PriceMap): PCBuild {
        return new PCBuildBuilder()
            .addParts(parts)
            .setPrices(prices)
            .requireCompleteSystem()
            .build();
    }
}

// Tek parça isteği (ör. "sadece ekran kartı göster"): eksik kategori aranmaz, sistem asla "tam" sayılmaz
export class PartsOnlyDirector implements BuildDirector {
    construct(parts: Product[], prices: PriceMap): PCBuild {
        return new PCBuildBuilder()
            .addParts(parts)
            .setPrices(prices)
            .build();
    }
}

// İşlemci ve anakart birlikte öneriliyorsa bir sistem kuruluyordur; değilse yalnızca parça isteği.
export function selectDirector(parts: readonly Product[]): BuildDirector {
    const isSystemRequest =
        parts.some(part => part.category === 'CPU') && parts.some(part => part.category === 'Motherboard');
    return isSystemRequest ? new FullSystemDirector() : new PartsOnlyDirector();
}
