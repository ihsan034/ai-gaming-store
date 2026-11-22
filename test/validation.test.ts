import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SocketMatchRule } from '../src/validation/SocketMatchRule';
import { MemoryTypeRule } from '../src/validation/MemoryTypeRule';
import { PsuWattageRule } from '../src/validation/PsuWattageRule';
import { CoolerRule } from '../src/validation/CoolerRule';
import { BudgetRule } from '../src/validation/BudgetRule';
import { createValidationChain } from '../src/validation/createValidationChain';
import { CompatibilityRule, type ValidationContext, type Violation } from '../src/validation/CompatibilityRule';
import type { PCBuild } from '../src/builder/PCBuild';
import { GOOD_SYSTEM_IDS, makeBuild } from './helpers';

// Chain of Responsibility kalıbı testi: her halka tek bir kuralı denetler, zincir hepsini toplar

const NO_BUDGET: ValidationContext = { budget: null };

function rules(rule: CompatibilityRule, ids: number[], context: ValidationContext = NO_BUDGET): string[] {
    return rule.validate(makeBuild(ids), context).map(v => v.rule);
}

test('SocketMatchRule: soketler uyuşmuyorsa ihlal bildirir', () => {
    // Ryzen 5 5600 (AM4) + Asus Prime B650M-R (AM5)
    assert.deepEqual(rules(new SocketMatchRule(), [1, 25]), ['SocketMatchRule']);
    assert.deepEqual(rules(new SocketMatchRule(), [1, 22]), []);
});

test('SocketMatchRule: işlemci veya anakart yoksa denetlenecek bir şey yoktur', () => {
    assert.deepEqual(rules(new SocketMatchRule(), [1]), []);
    assert.deepEqual(rules(new SocketMatchRule(), [22]), []);
});

test('MemoryTypeRule: anakartla ve işlemciyle uyumsuz bellek tipi bildirilir', () => {
    // AM4 / DDR4 anakart ve işlemci + DDR5 bellek (id 36): iki ayrı ihlal
    assert.deepEqual(rules(new MemoryTypeRule(), [1, 22, 36]), ['MemoryTypeRule', 'MemoryTypeRule']);
    assert.deepEqual(rules(new MemoryTypeRule(), [1, 22, 32]), []);
});

test('MemoryTypeRule: hem DDR4 hem DDR5 destekleyen işlemci (i5-13400F) her ikisiyle de uyumludur', () => {
    assert.deepEqual(rules(new MemoryTypeRule(), [3, 26, 36]), []);
});

test('PsuWattageRule: güç kaynağı ekran kartının önerdiği değerden düşükse ihlal bildirir', () => {
    // RTX 5070 (650W önerilir) + Frisby 500W
    assert.deepEqual(rules(new PsuWattageRule(), [17, 41]), ['PsuWattageRule']);
    // RX 6600 (500W önerilir) + Frisby 500W
    assert.deepEqual(rules(new PsuWattageRule(), [11, 41]), []);
});

test('CoolerRule: 65W işlemcide her soğutucu yeterlidir', () => {
    assert.deepEqual(rules(new CoolerRule(), [1, 61]), []);
});

test('CoolerRule: 105-120W işlemci tek kule hava soğutucuyla yetinir', () => {
    // Ryzen 7 7700X (105W) + DeepCool AK400 (tek kule)
    assert.deepEqual(rules(new CoolerRule(), [7, 62]), []);
});

test('CoolerRule: 125W işlemci çift kule ya da sıvı ister, tek kule yetmez', () => {
    // i5-14600K (125W)
    assert.deepEqual(rules(new CoolerRule(), [6, 62]), ['CoolerRule']);
    assert.deepEqual(rules(new CoolerRule(), [6, 63]), []);
    assert.deepEqual(rules(new CoolerRule(), [6, 65]), []);
});

test('CoolerRule: i9-14900K yalnızca sıvı soğutucuyla yeterlidir', () => {
    assert.deepEqual(rules(new CoolerRule(), [10, 63]), ['CoolerRule']);
    assert.deepEqual(rules(new CoolerRule(), [10, 65]), []);
});

test('BudgetRule: toplam bütçeyi aşıyorsa ihlal bildirir, eşitlik ve bütçesizlik sorun değildir', () => {
    const build = makeBuild(GOOD_SYSTEM_IDS);
    const total = build.totalPrice;
    const rule = new BudgetRule();

    assert.equal(rule.validate(build, { budget: total - 1 }).length, 1);
    assert.equal(rule.validate(build, { budget: total }).length, 0);
    assert.equal(rule.validate(build, { budget: null }).length, 0);
});

test('BudgetRule: canlı fiyatla hesaplanan toplam kullanılır', () => {
    const cheapBudget = makeBuild(GOOD_SYSTEM_IDS).totalPrice;
    const expensive = makeBuild(GOOD_SYSTEM_IDS, { 1: 99_999 });

    assert.equal(new BudgetRule().validate(expensive, { budget: cheapBudget }).length, 1);
});

test('Zincir: uyumlu bir sistemde hiçbir uyarı çıkmaz', () => {
    assert.deepEqual(createValidationChain().validate(makeBuild(GOOD_SYSTEM_IDS), { budget: 100_000 }), []);
});

test('Zincir: tüm halkalar çalışır ve ihlaller birlikte raporlanır', () => {
    // i9-14900K (LGA1700) + AM5 anakart: soket uyuşmaz; DDR4 bellek: AM5 anakartla uyuşmaz;
    // RTX 5070 + 500W güç kaynağı: yetersiz; tek kule soğutucu: i9 için yetersiz; bütçe: 1 TL
    const broken = makeBuild([10, 25, 32, 17, 41, 62]);
    const found = createValidationChain().validate(broken, { budget: 1 }).map(v => v.rule);

    assert.deepEqual([...new Set(found)].sort(), [
        'BudgetRule', 'CoolerRule', 'MemoryTypeRule', 'PsuWattageRule', 'SocketMatchRule'
    ]);
});

test('Zincir genişletilebilir: yeni kural yeni bir halka eklemekle gelir', () => {
    class AlwaysFailRule extends CompatibilityRule {
        protected check(_build: PCBuild): Violation[] {
            return [{ rule: 'AlwaysFailRule', message: 'yeni kural çalıştı' }];
        }
    }

    const chain = new SocketMatchRule();
    chain.setNext(new AlwaysFailRule());

    assert.deepEqual(chain.validate(makeBuild([1, 22]), NO_BUDGET).map(v => v.rule), ['AlwaysFailRule']);
});
