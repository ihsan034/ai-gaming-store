import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIProviderFactory } from '../src/ai/AIProviderFactory';
import { GeminiProviderFactory } from '../src/ai/GeminiProviderFactory';
import { MockProviderFactory, DEMO_RECOMMENDATION } from '../src/ai/MockProviderFactory';
import { LoggingLLMClient } from '../src/ai/LoggingLLMClient';
import { createProviderFromEnv } from '../src/ai/createProviderFromEnv';
import { extractJsonObject, readPriceEntry, isSearchSource } from '../src/pricing/priceParsing';
import { byId } from './helpers';

// Abstract Factory kalıbı testi: her fabrika, aynı sağlayıcıdan iki ürünü (öneri + fiyat istemcisi) üretir

test('MockProviderFactory bir AIProviderFactory ailesidir ve iki ayrı istemci üretir', () => {
    const factory = new MockProviderFactory();

    assert.ok(factory instanceof AIProviderFactory);
    assert.notEqual(factory.createRecommendationClient(), factory.createPriceSearchClient());
});

test('Mock öneri istemcisi uyumlu ve ayrıştırılabilir bir demo yanıtı verir', async () => {
    const response = await new MockProviderFactory().createRecommendationClient().generate({ prompt: 'x' });

    assert.equal(response.text, DEMO_RECOMMENDATION);
    assert.deepEqual(JSON.parse(response.text).recommended_product_ids, [1, 11, 22, 32, 41, 51, 57, 61]);
});

test('Mock fiyat istemcisi istenen her ürün için katalog fiyatını arama kaynağıyla döndürür', async () => {
    const client = new MockProviderFactory().createPriceSearchClient();
    const response = await client.generate({ prompt: 'ID1: AMD Ryzen 5 5600\nID11: AMD Radeon RX 6600' });
    const parsed = extractJsonObject(response.text);

    assert.ok(parsed);
    assert.equal(readPriceEntry(parsed['ID1'])?.price, byId(1).price);
    assert.equal(readPriceEntry(parsed['ID11'])?.price, byId(11).price);
    assert.ok(isSearchSource(readPriceEntry(parsed['ID1'])?.source, new Set()));
});

test('Mock fabrikasına özel yanıtlar verilebilir ve çağrılar kaydedilir', async () => {
    const factory = new MockProviderFactory({ recommendation: () => '{"ozel": true}' });

    const response = await factory.createRecommendationClient().generate({ prompt: 'merhaba' });

    assert.equal(response.text, '{"ozel": true}');
    assert.equal(factory.recommendationClient.calls[0]?.prompt, 'merhaba');
});

test('GeminiProviderFactory iki ayrı, Decorator ile sarılmış istemci üretir', () => {
    const factory = new GeminiProviderFactory('sahte-anahtar');
    const recommender = factory.createRecommendationClient();
    const priceSearcher = factory.createPriceSearchClient();

    assert.ok(factory instanceof AIProviderFactory);
    assert.ok(recommender instanceof LoggingLLMClient);
    assert.ok(priceSearcher instanceof LoggingLLMClient);
    assert.notEqual(recommender, priceSearcher);
});

test('createProviderFromEnv: AI_PROVIDER=mock anahtarsız çalışır', () => {
    assert.ok(createProviderFromEnv({ AI_PROVIDER: 'mock' }) instanceof MockProviderFactory);
});

test('createProviderFromEnv: varsayılan sağlayıcı Gemini, anahtar gerekir', () => {
    assert.ok(createProviderFromEnv({ GEMINI_API_KEY: 'anahtar' }) instanceof GeminiProviderFactory);
    assert.throws(() => createProviderFromEnv({}), /GEMINI_API_KEY/);
});

test('createProviderFromEnv: bilinmeyen sağlayıcı reddedilir', () => {
    assert.throws(() => createProviderFromEnv({ AI_PROVIDER: 'baska' }), /Bilinmeyen AI_PROVIDER/);
});
