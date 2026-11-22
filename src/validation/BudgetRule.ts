import type { PCBuild } from '../builder/PCBuild';
import { CompatibilityRule, type ValidationContext, type Violation } from './CompatibilityRule';

// [Kalıp: CHAIN OF RESPONSIBILITY — Concrete Handler]
// Gerçek (canlı) fiyatlarla hesaplanan toplam, kullanıcının bütçesini aşmamalı. Bütçe belirtilmediyse denetlenmez.
export class BudgetRule extends CompatibilityRule {
    protected check(build: PCBuild, context: ValidationContext): Violation[] {
        if (context.budget === null || build.totalPrice <= context.budget) return [];

        const total = build.totalPrice.toLocaleString('tr-TR');
        const budget = context.budget.toLocaleString('tr-TR');
        return [{
            rule: 'BudgetRule',
            message: `Toplam fiyat ${total} TL, belirtilen bütçe olan ${budget} TL'yi aşıyor.`
        }];
    }
}
