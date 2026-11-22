import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CatalogPricing } from '../src/pricing/CatalogPricing';
import { LivePricing, MIN_PRICE_RATIO, PRICE_CACHE_TTL_MS } from '../src/pricing/LivePricing';
import { GROUNDING_REDIRECT_PREFIX, extractJsonObject, readPriceEntry, isSearchSource } from '../src/pricing/priceParsing';
import { MockLLMClient } from '../src/ai/MockProviderFactory';
import type { LLMResponse } from '../src/ai/LLMClient';
import { byId, byIds, muteConsole } from './helpers';

// Strategy kalıbı testi: aynı arayüzün (PricingStrategy) iki farklı fiyat kaynağı

muteConsole();

const GROUNDED = `${GROUNDING_REDIRECT_PREFIX}test`;

// Her ürün için verilen fiyatı ve kaynağı döndüren sahte arama istemcisi
function priceClient(price: (id: number) => number | null, source: string = GROUNDED, groundingUris: string[] = []) {
    return new MockLLMClient(request => {
        const ids = [...request.prompt.matchAll(/ID(\d+):/g)].map(m => Number(m[1]));
        const body: Record<string, unknown> = {};
        for (const id of ids) {
            const value = price(id);
            body[`ID${id}`] = value === null ? null : { price: value, source };
        }
        return { text: JSON.stringify(body), groundingUris } satisfies LLMResponse;
    });
}

test('CatalogPricing kataloğa yazılı fiyatı döndürür', async () => {
    const prices = await new CatalogPricing().getPrices(byIds([1, 11]));

    assert.deepEqual(prices, { 1: byId(1).price, 11: byId(11).price });
});

test('LivePricing: kaynağı arama sonucu olan canlı fiyatı kabul eder', async () => {
    const pricing = new LivePricing(priceClient(id => byId(id).price + 100));

    assert.deepEqual(await pricing.getPrices(byIds([1])), { 1: byId(1).price + 100 });
});

test('LivePricing: kaynağı arama sonucu olmayan (uydurma) fiyatı reddedip katalog fiyatına düşer', async () => {
    const pricing = new LivePricing(priceClient(id => byId(id).price + 100, 'https://uydurma-site.example/urun'));

    assert.deepEqual(await pricing.getPrices(byIds([1])), { 1: byId(1).price });
});

test('LivePricing: kaynak yanıtın arama kaynakları listesinde varsa kabul edilir', async () => {
    const url = 'https://www.akakce.com/urun';
    const pricing = new LivePricing(priceClient(id => byId(id).price + 5, url, [url]));

    assert.deepEqual(await pricing.getPrices(byIds([1])), { 1: byId(1).price + 5 });
});

test('LivePricing: katalog fiyatının yarısından düşük fiyat (taksit gibi) reddedilir', async () => {
    const tooLow = Math.floor(byId(1).price * MIN_PRICE_RATIO) - 1;
    const pricing = new LivePricing(priceClient(() => tooLow));

    assert.deepEqual(await pricing.getPrices(byIds([1])), { 1: byId(1).price });
});

test('LivePricing: üst sınır yoktur, katlanmış gerçek fiyat kabul edilir', async () => {
    // Örnek: 32 GB DDR5 katalogda 4.100 TL iken Akakçe'de 36.000 TL oldu
    const pricing = new LivePricing(priceClient(id => byId(id).price * 9));

    assert.deepEqual(await pricing.getPrices(byIds([1])), { 1: byId(1).price * 9 });
});

test('LivePricing: bulunan fiyat önbellekten gelir, ikinci istek yapay zekâya gitmez', async () => {
    const client = priceClient(id => byId(id).price + 1);
    const pricing = new LivePricing(client);

    await pricing.getPrices(byIds([1]));
    const second = await pricing.getPrices(byIds([1]));

    assert.equal(client.calls.length, 1);
    assert.deepEqual(second, { 1: byId(1).price + 1 });
});

test('LivePricing: önbellek 24 saat sonra geçersiz olur', async () => {
    let now = 1_000_000;
    const client = priceClient(id => byId(id).price + 1);
    const pricing = new LivePricing(client, { now: () => now });

    await pricing.getPrices(byIds([1]));
    now += PRICE_CACHE_TTL_MS + 1;
    await pricing.getPrices(byIds([1]));

    assert.equal(client.calls.length, 2);
});

test('LivePricing: fiyatı bulunamayan ürün için bir kez daha arar, yine yoksa katalog fiyatını kullanır', async () => {
    const client = priceClient(id => (id === 1 ? null : byId(id).price + 7));
    const prices = await new LivePricing(client).getPrices(byIds([1, 11]));

    assert.equal(client.calls.length, 2);
    assert.deepEqual(prices, { 1: byId(1).price, 11: byId(11).price + 7 });
});

test('LivePricing: arama hata verirse sistem çökmez, katalog fiyatı kullanılır', async () => {
    const failing = new MockLLMClient(() => { throw new Error('ağ hatası'); });

    assert.deepEqual(await new LivePricing(failing).getPrices(byIds([1])), { 1: byId(1).price });
});

test('LivePricing: JSON içermeyen yanıt katalog fiyatına düşer', async () => {
    const client = new MockLLMClient(() => 'üzgünüm, fiyat bulamadım');

    assert.deepEqual(await new LivePricing(client).getPrices(byIds([1])), { 1: byId(1).price });
});

test('priceParsing: JSON kod bloğu ve açıklama metni içinden çıkarılır', () => {
    assert.deepEqual(extractJsonObject('```json\n{"a": 1}\n```'), { a: 1 });
    assert.deepEqual(extractJsonObject('İşte sonuç: {"a": 2} umarım yardımcı olur'), { a: 2 });
    assert.equal(extractJsonObject('JSON yok'), null);
    assert.equal(extractJsonObject('{bozuk'), null);
});

test('priceParsing: fiyat girdisi nesne veya düz sayı olabilir, geçersizler reddedilir', () => {
    assert.deepEqual(readPriceEntry({ price: 4200, source: 's' }), { price: 4200, source: 's' });
    assert.deepEqual(readPriceEntry(4200), { price: 4200 });
    assert.equal(readPriceEntry(null), null);
    assert.equal(readPriceEntry({ price: -5 }), null);
    assert.equal(readPriceEntry('abc'), null);
});

test('priceParsing: kaynak yalnızca Google yönlendirmesi veya yanıttaki kaynaklarsa geçerlidir', () => {
    assert.equal(isSearchSource(undefined, new Set()), false);
    assert.equal(isSearchSource('https://hepsiburada.com/x', new Set()), false);
    assert.equal(isSearchSource(`${GROUNDING_REDIRECT_PREFIX}abc`, new Set()), true);
    assert.equal(isSearchSource('https://a.example', new Set(['https://a.example'])), true);
});
