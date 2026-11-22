import type { PCBuild } from '../builder/PCBuild';
import type { Product } from '../types';
import { CompatibilityRule, type Violation } from './CompatibilityRule';
import { productLabel, specNumber, specText } from './specs';

// [Kalıp: CHAIN OF RESPONSIBILITY — Concrete Handler]
// Soğutucu işlemcinin gücüne uygun olmalı (katalogdaki işlemciler soğutucusuz satılır):
//   65W işlemci → herhangi bir soğutucu; 105-120W → en az tek kule hava; 125W → çift kule veya sıvı;
//   i9-14900K → sıvı soğutucu.
const TIER_NAMES = ['herhangi bir soğutucu', 'tek kule hava soğutucu veya daha güçlüsü', 'çift kule hava ya da sıvı soğutucu', 'sıvı soğutucu'];

function requiredTier(cpu: Product): number {
    if (/i9-14900K/i.test(cpu.model)) return 3;
    const power = specNumber(cpu, 'power') ?? 0;
    if (power <= 65) return 0;
    if (power <= 120) return 1;
    return 2;
}

function coolerTier(cooler: Product): number {
    const type = (specText(cooler, 'type') ?? '').toLowerCase();
    if (type.includes('sıvı')) return 3;
    if (type.includes('çift')) return 2;
    return 1;
}

export class CoolerRule extends CompatibilityRule {
    protected check(build: PCBuild): Violation[] {
        const cpu = build.first('CPU');
        const cooler = build.first('Cooler');
        if (!cpu || !cooler) return [];

        const needed = requiredTier(cpu);
        if (coolerTier(cooler) >= needed) return [];

        return [{
            rule: 'CoolerRule',
            message: `İşlemci (${productLabel(cpu)}) için ${TIER_NAMES[needed]} gerekir, seçilen soğutucu (${productLabel(cooler)}) yetersiz.`
        }];
    }
}
