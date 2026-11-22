import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import { MockProviderFactory, MockLLMClient, DEMO_RECOMMENDATION } from '../src/ai/MockProviderFactory';
import { LivePricing } from '../src/pricing/LivePricing';
import { CatalogPricing } from '../src/pricing/CatalogPricing';
import { createValidationChain } from '../src/validation/createValidationChain';
import { RecommendationService, RecommendationError } from '../src/RecommendationService';
import { createApp, mapAiError } from '../src/app';
import { createPricingStrategy } from '../src/composition';
import { products } from '../src/products';
import { byId, GOOD_SYSTEM_IDS, muteConsole } from './helpers';

// Tüm kalıpların birlikte çalıştığı uçtan uca testler (gerçek yapay zekâ yok, hepsi sahte sağlayıcıyla)

muteConsole();

const catalog = products.filter(p => p.stock > 0);

function recommendation(ids: unknown[], extra: Record<string, unknown> = {}): string {
    return JSON.stringify({ recommended_product_ids: ids, ai_explanation: 'açıklama', ...extra });
}

function makeService(recommend: (prompt: string) => string, options: { catalogPricing?: boolean } = {}) {
    const provider = new MockProviderFactory({ recommendation: request => recommend(request.prompt) });
    const service = new RecommendationService({
        recommender: provider.createRecommendationClient(),
        pricing: options.catalogPricing ? new CatalogPricing() : new LivePricing(provider.createPriceSearchClient()),
        validation: createValidationChain(),
        catalog
    });
    return { service, provider };
}

test('Servis: komple sistem önerisi tüm alanlarla döner', async () => {
    const { service } = makeService(() => recommendation(GOOD_SYSTEM_IDS, { budget_tl: 100_000 }));

    const result = await service.recommend('100 bin TL oyun bilgisayarı');

    assert.deepEqual(result.recommended_product_ids, GOOD_SYSTEM_IDS);
    assert.equal(result.total_price, GOOD_SYSTEM_IDS.reduce((sum, id) => sum + byId(id).price, 0));
    assert.equal(result.ai_explanation, 'açıklama');
    assert.equal(result.is_full_system, true);
    assert.deepEqual(result.missing_categories, []);
    assert.deepEqual(result.warnings, []);
    assert.equal(result.price_overrides[1], byId(1).price);
});

test('Servis: sistem talimatı kataloğu ve kuralları içerir, stok alanı içermez', async () => {
    const { service, provider } = makeService(() => recommendation([11]));

    await service.recommend('sadece ekran kartı');
    const request = provider.recommendationClient.calls[0];

    assert.equal(request?.prompt, 'sadece ekran kartı');
    assert.match(request?.systemInstruction ?? '', /UYULMASI ZORUNLU KURALLAR/);
    assert.match(request?.systemInstruction ?? '', /RTX 5070 Dual OC 12GB/);
    assert.doesNotMatch(request?.systemInstruction ?? '', /"stock"/);
});

test('Servis: katalogda olmayan ID atılır, tekrar eden ürün bir kez sayılır', async () => {
    const { service } = makeService(() => recommendation([11, 11, 99999, '11', 'abc']), { catalogPricing: true });

    const result = await service.recommend('ekran kartı');

    assert.deepEqual(result.recommended_product_ids, [11]);
    assert.equal(result.total_price, byId(11).price);
});

test('Servis: stoğu olmayan ürünler önerilemez', async () => {
    const discontinued = products.find(p => p.stock === 0);
    if (!discontinued) return; // katalogda stoğu 0 olan ürün yoksa test anlamsız
    const { service } = makeService(() => recommendation([discontinued.id]));

    assert.deepEqual((await service.recommend('x')).recommended_product_ids, []);
});

test('Servis: tek parça isteği tam sistem sayılmaz', async () => {
    const { service } = makeService(() => recommendation([11]), { catalogPricing: true });

    const result = await service.recommend('sadece ekran kartı');

    assert.equal(result.is_full_system, false);
    assert.deepEqual(result.missing_categories, []);
});

test('Servis: eksik parçalı sistem raporlanır', async () => {
    const { service } = makeService(() => recommendation(GOOD_SYSTEM_IDS.filter(id => id !== 41)), { catalogPricing: true });

    const result = await service.recommend('sistem');

    assert.equal(result.is_full_system, false);
    assert.deepEqual(result.missing_categories, ['Power']);
});

test('Servis: bütçeyi aşan öneri için uyarı üretir', async () => {
    const { service } = makeService(() => recommendation(GOOD_SYSTEM_IDS, { budget_tl: 10_000 }), { catalogPricing: true });

    const result = await service.recommend('10 bin TL');

    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0] ?? '', /bütçe/);
});

test('Servis: uyumsuz parçalar için uyarı üretir', async () => {
    // AM4 işlemci + AM5 anakart
    const { service } = makeService(() => recommendation([1, 25, 32, 41, 51, 57, 61]), { catalogPricing: true });

    const result = await service.recommend('sistem');

    assert.ok(result.warnings.some(w => /soket/i.test(w)));
});

test('Servis: bütçe geçerli bir sayı değilse bütçe denetlenmez', async () => {
    for (const budget of [null, 'çok', 0, -5, undefined]) {
        const { service } = makeService(() => recommendation(GOOD_SYSTEM_IDS, { budget_tl: budget }), { catalogPricing: true });
        assert.deepEqual((await service.recommend('x')).warnings, [], `bütçe: ${String(budget)}`);
    }
});

test('Servis: kod bloğuna sarılı JSON yanıt işlenir', async () => {
    const { service } = makeService(() => '```json\n' + recommendation([11]) + '\n```', { catalogPricing: true });

    assert.deepEqual((await service.recommend('x')).recommended_product_ids, [11]);
});

test('Servis: açıklama yoksa varsayılan mesaj kullanılır', async () => {
    const { service } = makeService(() => JSON.stringify({ recommended_product_ids: [11] }), { catalogPricing: true });

    assert.equal((await service.recommend('x')).ai_explanation, 'Sisteminiz başarıyla oluşturuldu.');
});

test('Servis: geçersiz JSON 500 hatası verir', async () => {
    const { service } = makeService(() => 'bu JSON değil');

    await assert.rejects(() => service.recommend('x'), (error: unknown) =>
        error instanceof RecommendationError && error.status === 500 && /geçersiz JSON/.test(error.message));
});

test('Servis: JSON ama nesne olmayan yanıt 500 hatası verir', async () => {
    const { service } = makeService(() => '123');

    await assert.rejects(() => service.recommend('x'), (error: unknown) =>
        error instanceof RecommendationError && error.status === 500);
});

test('Servis: fiyat araması çökerse katalog fiyatıyla yine de cevap verir', async () => {
    const provider = new MockProviderFactory({
        recommendation: () => recommendation([11]),
        priceSearch: () => { throw new Error('arama çöktü'); }
    });
    const service = new RecommendationService({
        recommender: provider.createRecommendationClient(),
        pricing: new LivePricing(provider.createPriceSearchClient()),
        validation: createValidationChain(),
        catalog
    });

    assert.equal((await service.recommend('x')).total_price, byId(11).price);
});

test('Servis: öneri istemcisinin hatası olduğu gibi yukarı iletilir', async () => {
    const service = new RecommendationService({
        recommender: new MockLLMClient(() => { throw Object.assign(new Error('kota'), { status: 429 }); }),
        pricing: new CatalogPricing(),
        validation: createValidationChain(),
        catalog
    });

    await assert.rejects(() => service.recommend('x'), (error: any) => error.status === 429);
});

test('mapAiError: SDK hata kodları kullanıcıya anlatılabilir mesajlara çevrilir', () => {
    assert.equal(mapAiError(Object.assign(new Error('x'), { status: 429 })).status, 429);
    assert.equal(mapAiError(Object.assign(new Error('x'), { status: 503 })).status, 503);
    assert.equal(mapAiError(Object.assign(new Error('x'), { status: 400 })).status, 400);
    assert.equal(mapAiError(new Error('bilinmeyen')).status, 500);
    assert.deepEqual(mapAiError(new RecommendationError(500, 'özel')), { status: 500, message: 'özel' });
});

test('createPricingStrategy: PRICING_MODE ile Strategy çalışma zamanında seçilir', () => {
    const provider = new MockProviderFactory();

    assert.ok(createPricingStrategy({}, provider) instanceof LivePricing);
    assert.ok(createPricingStrategy({ PRICING_MODE: 'live' }, provider) instanceof LivePricing);
    assert.ok(createPricingStrategy({ PRICING_MODE: 'catalog' }, provider) instanceof CatalogPricing);
    assert.throws(() => createPricingStrategy({ PRICING_MODE: 'x' }, provider), /Bilinmeyen PRICING_MODE/);
});

// --- HTTP katmanı: gerçek Express uygulaması, geçici porta bağlanır ---

async function withServer(
    service: RecommendationService,
    run: (baseUrl: string) => Promise<void>,
    limiter: RequestHandler = (_req, _res, next) => next()
): Promise<void> {
    const server = createApp({ service, products, limiter }).listen(0);
    await once(server, 'listening');
    try {
        await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    } finally {
        server.close();
    }
}

async function post(baseUrl: string, body: unknown) {
    const response = await fetch(`${baseUrl}/api/recommend-pc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return { status: response.status, json: await response.json() as any };
}

test('HTTP: POST /api/recommend-pc önerinin tüm alanlarını döndürür', async () => {
    const { service } = makeService(() => DEMO_RECOMMENDATION);

    await withServer(service, async baseUrl => {
        const { status, json } = await post(baseUrl, { userPrompt: 'oyun bilgisayarı' });

        assert.equal(status, 200);
        assert.deepEqual(json.recommended_product_ids, [1, 11, 22, 32, 41, 51, 57, 61]);
        assert.equal(json.is_full_system, true);
        assert.deepEqual(json.warnings, []);
        assert.equal(typeof json.total_price, 'number');
    });
});

test('HTTP: boş mesaj 400 alır ve yapay zekâya gitmez', async () => {
    const { service, provider } = makeService(() => DEMO_RECOMMENDATION);

    await withServer(service, async baseUrl => {
        const { status, json } = await post(baseUrl, {});

        assert.equal(status, 400);
        assert.match(json.error, /mesaj/);
        assert.equal(provider.recommendationClient.calls.length, 0);
    });
});

test('HTTP: yapay zekâ kotası dolunca 429 ve anlaşılır mesaj döner', async () => {
    const service = new RecommendationService({
        recommender: new MockLLMClient(() => { throw Object.assign(new Error('kota'), { status: 429 }); }),
        pricing: new CatalogPricing(),
        validation: createValidationChain(),
        catalog
    });

    await withServer(service, async baseUrl => {
        const { status, json } = await post(baseUrl, { userPrompt: 'x' });

        assert.equal(status, 429);
        assert.match(json.error, /kota/);
    });
});

test('HTTP: GET /api/products katalogun tamamını döndürür', async () => {
    const { service } = makeService(() => DEMO_RECOMMENDATION);

    await withServer(service, async baseUrl => {
        const list = await (await fetch(`${baseUrl}/api/products`)).json() as unknown[];

        assert.equal(list.length, products.length);
    });
});

test('HTTP: ana sayfa arayüz dosyasını sunar', async () => {
    const { service } = makeService(() => DEMO_RECOMMENDATION);

    await withServer(service, async baseUrl => {
        const response = await fetch(`${baseUrl}/`);

        assert.equal(response.status, 200);
        assert.match(await response.text(), /AI Powered PC Store/);
    });
});
