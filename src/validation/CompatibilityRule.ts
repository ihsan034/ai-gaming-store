import type { PCBuild } from '../builder/PCBuild';

// ============================================================
// [Kalıp: CHAIN OF RESPONSIBILITY — Handler]
// ============================================================
// Doğrulama kuralları zincir halkalarıdır. Her halka yalnızca kendi kuralını denetler, bulduğu
// uyumsuzlukları rapora ekler ve isteği zincirdeki bir sonraki halkaya devreder. Yeni bir kural
// eklemek yeni bir halka yazıp zincire eklemektir (createValidationChain.ts); mevcut halkalar değişmez.
// Halkalar bağımsız olduğu için sıraları sonucu etkilemez.

export interface Violation {
    rule: string;
    message: string;
}

export interface ValidationContext {
    // Kullanıcının belirttiği bütçe (TL); belirtmediyse null
    budget: number | null;
}

export abstract class CompatibilityRule {
    private next: CompatibilityRule | undefined;

    // Zincir kurmayı kolaylaştırmak için bir sonraki halkayı döndürür: a.setNext(b).setNext(c)
    setNext(next: CompatibilityRule): CompatibilityRule {
        this.next = next;
        return next;
    }

    validate(build: PCBuild, context: ValidationContext, report: Violation[] = []): Violation[] {
        report.push(...this.check(build, context));
        return this.next ? this.next.validate(build, context, report) : report;
    }

    // Her somut halka yalnızca kendi kuralını burada uygular
    protected abstract check(build: PCBuild, context: ValidationContext): Violation[];
}
