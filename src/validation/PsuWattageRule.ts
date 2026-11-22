import type { PCBuild } from '../builder/PCBuild';
import { CompatibilityRule, type Violation } from './CompatibilityRule';
import { productLabel, specNumber } from './specs';

// [Kalıp: CHAIN OF RESPONSIBILITY — Concrete Handler]
// Güç kaynağının gücü, ekran kartının önerilen güç değerinden (power_recommendation) düşük olmamalı.
export class PsuWattageRule extends CompatibilityRule {
    protected check(build: PCBuild): Violation[] {
        const gpu = build.first('GPU');
        const psu = build.first('Power');
        if (!gpu || !psu) return [];

        const required = specNumber(gpu, 'power_recommendation');
        const available = specNumber(psu, 'wattage');
        if (required === undefined || available === undefined || available >= required) return [];

        return [{
            rule: 'PsuWattageRule',
            message: `Güç kaynağı (${productLabel(psu)}) ${available}W, ekran kartı (${productLabel(gpu)}) için önerilen ${required}W değerinden düşük.`
        }];
    }
}
