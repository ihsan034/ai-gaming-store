import type { PCBuild } from '../builder/PCBuild';
import { CompatibilityRule, type Violation } from './CompatibilityRule';
import { productLabel, specText } from './specs';

// [Kalıp: CHAIN OF RESPONSIBILITY — Concrete Handler]
// Bellek tipi (DDR4/DDR5) anakartla ve işlemciyle uyumlu olmalı. İşlemcinin "DDR4/DDR5"
// gibi birden çok tipi destekleyebildiği katalogda "/" ile ayrılmış yazılır.
export class MemoryTypeRule extends CompatibilityRule {
    protected check(build: PCBuild): Violation[] {
        const ram = build.first('RAM');
        if (!ram) return [];
        const ramType = specText(ram, 'ram_type');
        if (!ramType) return [];

        const violations: Violation[] = [];

        const board = build.first('Motherboard');
        const boardType = board ? specText(board, 'ram_type') : undefined;
        if (board && boardType && boardType !== ramType) {
            violations.push({
                rule: 'MemoryTypeRule',
                message: `Anakart (${productLabel(board)}) ${boardType} belleği destekliyor, seçilen bellek (${productLabel(ram)}) ${ramType}.`
            });
        }

        const cpu = build.first('CPU');
        const cpuTypes = cpu ? specText(cpu, 'ram_type')?.split('/') : undefined;
        if (cpu && cpuTypes && !cpuTypes.includes(ramType)) {
            violations.push({
                rule: 'MemoryTypeRule',
                message: `İşlemci (${productLabel(cpu)}) ${cpuTypes.join('/')} belleği destekliyor, seçilen bellek (${productLabel(ram)}) ${ramType}.`
            });
        }

        return violations;
    }
}
