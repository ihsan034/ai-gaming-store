import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ThinkingLevel, type GoogleGenAI } from '@google/genai';
import { GeminiClientAdapter } from '../src/ai/GeminiClientAdapter';

// Adapter kalıbı testi: SDK'ya özgü biçim ile uygulamanın LLMClient arayüzü arasındaki çeviri

function fakeGemini(response: unknown) {
    const calls: any[] = [];
    const gemini = {
        models: { generateContent: async (params: unknown) => { calls.push(params); return response; } }
    } as unknown as Pick<GoogleGenAI, 'models'>;
    return { gemini, calls };
}

test('istek SDK biçimine çevrilir: model, prompt, sistem talimatı ve JSON yanıt', async () => {
    const { gemini, calls } = fakeGemini({ text: '{"a":1}', candidates: [] });
    const adapter = new GeminiClientAdapter(gemini, { model: 'test-model', jsonResponse: true });

    await adapter.generate({ prompt: 'merhaba', systemInstruction: 'kurallar' });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, 'test-model');
    assert.equal(calls[0].contents, 'merhaba');
    assert.equal(calls[0].config.systemInstruction, 'kurallar');
    assert.equal(calls[0].config.responseMimeType, 'application/json');
});

test('arama aracı ve düşünme seviyesi yalnızca istenirse eklenir', async () => {
    const withSearch = fakeGemini({ text: '', candidates: [] });
    await new GeminiClientAdapter(withSearch.gemini, {
        model: 'm', googleSearch: true, thinkingLevel: ThinkingLevel.LOW
    }).generate({ prompt: 'x' });

    assert.deepEqual(withSearch.calls[0].config.tools, [{ googleSearch: {} }]);
    assert.equal(withSearch.calls[0].config.thinkingConfig.thinkingLevel, ThinkingLevel.LOW);

    const plain = fakeGemini({ text: '', candidates: [] });
    await new GeminiClientAdapter(plain.gemini, { model: 'm' }).generate({ prompt: 'x' });

    assert.equal(plain.calls[0].config.tools, undefined);
    assert.equal(plain.calls[0].config.thinkingConfig, undefined);
    assert.equal(plain.calls[0].config.responseMimeType, undefined);
});

test('yanıt çevrilir: metin ve arama kaynakları alınır, adresi olmayanlar atlanır', async () => {
    const { gemini } = fakeGemini({
        text: 'yanıt',
        candidates: [{ groundingMetadata: { groundingChunks: [{ web: { uri: 'https://a.example' } }, { web: {} }, {}] } }]
    });
    const result = await new GeminiClientAdapter(gemini, { model: 'm' }).generate({ prompt: 'x' });

    assert.equal(result.text, 'yanıt');
    assert.deepEqual(result.groundingUris, ['https://a.example']);
});

test('SDK metin döndürmezse boş metin kullanılır', async () => {
    const { gemini } = fakeGemini({ candidates: [] });
    const result = await new GeminiClientAdapter(gemini, { model: 'm' }).generate({ prompt: 'x' });

    assert.equal(result.text, '');
    assert.deepEqual(result.groundingUris, []);
});
