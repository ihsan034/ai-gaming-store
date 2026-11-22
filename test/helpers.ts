import { after, before, mock } from 'node:test';
import { products } from '../src/products';
import type { Product } from '../src/types';
import type { LLMClient, LLMRequest, LLMResponse } from '../src/ai/LLMClient';
import { FullSystemDirector } from '../src/builder/directors';
import type { PCBuild } from '../src/builder/PCBuild';
import type { PriceMap } from '../src/pricing/PricingStrategy';

// Katalogdan ID ile ürün al (yoksa test hemen hata verir)
export function byId(id: number): Product {
    const product = products.find(p => p.id === id);
    if (!product) throw new Error(`Katalogda ${id} numaralı ürün yok`);
    return product;
}

export function byIds(ids: number[]): Product[] {
    return ids.map(byId);
}

// Komple sistem isteği gibi kurulmuş bir PCBuild
export function makeBuild(ids: number[], prices: PriceMap = {}): PCBuild {
    const parts = byIds(ids);
    return new FullSystemDirector().construct(parts, prices);
}

// Test çıktısını kirleten log satırlarını susturur (kodun kendi logları çalışmaya devam eder, sadece yazılmaz)
export function muteConsole(): void {
    before(() => {
        mock.method(console, 'log', () => {});
        mock.method(console, 'warn', () => {});
        mock.method(console, 'error', () => {});
    });
    after(() => mock.restoreAll());
}

// Belirli sayıda başarısız olduktan sonra başarılı olan sahte istemci (retry testleri için)
export class FlakyClient implements LLMClient {
    calls = 0;

    constructor(
        private readonly failures: number,
        private readonly status: number = 503,
        private readonly text: string = 'ok'
    ) {}

    async generate(_request: LLMRequest): Promise<LLMResponse> {
        this.calls++;
        if (this.calls <= this.failures) {
            throw Object.assign(new Error(`Sahte hata ${this.status}`), { status: this.status });
        }
        return { text: this.text, groundingUris: [] };
    }
}

// Düzgün çalışan, uyumlu 8 parçalık AM4 / DDR4 sistem
export const GOOD_SYSTEM_IDS = [1, 11, 22, 32, 41, 51, 57, 61];
