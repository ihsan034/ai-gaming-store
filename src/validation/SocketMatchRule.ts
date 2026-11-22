import type { PCBuild } from '../builder/PCBuild';
import { CompatibilityRule, type Violation } from './CompatibilityRule';
import { productLabel, specText } from './specs';

// [Kalıp: CHAIN OF RESPONSIBILITY — Concrete Handler] İşlemci soketi anakart soketiyle aynı olmalı.
export class SocketMatchRule extends CompatibilityRule {
    protected check(build: PCBuild): Violation[] {
        const cpu = build.first('CPU');
        const board = build.first('Motherboard');
        if (!cpu || !board) return [];

        const cpuSocket = specText(cpu, 'socket');
        const boardSocket = specText(board, 'socket');
        if (!cpuSocket || !boardSocket || cpuSocket === boardSocket) return [];

        return [{
            rule: 'SocketMatchRule',
            message: `İşlemci (${productLabel(cpu)}) soketi ${cpuSocket}, anakart (${productLabel(board)}) soketi ${boardSocket}: uyumsuz.`
        }];
    }
}
