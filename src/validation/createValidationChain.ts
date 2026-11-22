import type { CompatibilityRule } from './CompatibilityRule';
import { SocketMatchRule } from './SocketMatchRule';
import { MemoryTypeRule } from './MemoryTypeRule';
import { PsuWattageRule } from './PsuWattageRule';
import { CoolerRule } from './CoolerRule';
import { BudgetRule } from './BudgetRule';

// Zinciri kurar ve ilk halkayı döndürür. Yeni kural = yeni halka: tek satır eklemek yeter.
export function createValidationChain(): CompatibilityRule {
    const first = new SocketMatchRule();
    first
        .setNext(new MemoryTypeRule())
        .setNext(new PsuWattageRule())
        .setNext(new CoolerRule())
        .setNext(new BudgetRule());
    return first;
}
