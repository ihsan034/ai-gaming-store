import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RetryingLLMClient } from '../src/ai/RetryingLLMClient';
import { LoggingLLMClient } from '../src/ai/LoggingLLMClient';
import { FlakyClient, muteConsole } from './helpers';

// Decorator kalıbı testi: sarmalayıcılar aynı arayüzü sunar ve iç istemciyi değiştirmeden davranış ekler

muteConsole();

function recordingSleep() {
    const delays: number[] = [];
    return { delays, sleep: async (ms: number) => { delays.push(ms); } };
}

test('RetryingLLMClient: ilk denemede başarılıysa beklemez', async () => {
    const inner = new FlakyClient(0);
    const { delays, sleep } = recordingSleep();

    const result = await new RetryingLLMClient(inner, { sleep }).generate({ prompt: 'x' });

    assert.equal(result.text, 'ok');
    assert.equal(inner.calls, 1);
    assert.deepEqual(delays, []);
});

test('RetryingLLMClient: 503 hatasında bekleme süresi ikiye katlanarak yeniden dener', async () => {
    const inner = new FlakyClient(2);
    const { delays, sleep } = recordingSleep();

    const result = await new RetryingLLMClient(inner, { sleep }).generate({ prompt: 'x' });

    assert.equal(result.text, 'ok');
    assert.equal(inner.calls, 3);
    assert.deepEqual(delays, [2000, 4000]);
});

test('RetryingLLMClient: deneme hakkı bitince hatayı olduğu gibi fırlatır', async () => {
    const inner = new FlakyClient(99);
    const { delays, sleep } = recordingSleep();

    await assert.rejects(
        () => new RetryingLLMClient(inner, { sleep, maxRetries: 3 }).generate({ prompt: 'x' }),
        (error: any) => error.status === 503
    );
    assert.equal(inner.calls, 4);
    assert.deepEqual(delays, [2000, 4000, 8000]);
});

test('RetryingLLMClient: 503 dışındaki hatalar yeniden denenmez', async () => {
    const inner = new FlakyClient(99, 400);
    const { delays, sleep } = recordingSleep();

    await assert.rejects(
        () => new RetryingLLMClient(inner, { sleep }).generate({ prompt: 'x' }),
        (error: any) => error.status === 400
    );
    assert.equal(inner.calls, 1);
    assert.deepEqual(delays, []);
});

test('LoggingLLMClient: yanıtı değiştirmeden geçirir', async () => {
    const result = await new LoggingLLMClient(new FlakyClient(0, 503, 'merhaba'), 'test').generate({ prompt: 'x' });

    assert.equal(result.text, 'merhaba');
});

test('LoggingLLMClient: hatayı yutmadan yeniden fırlatır', async () => {
    await assert.rejects(
        () => new LoggingLLMClient(new FlakyClient(99, 500), 'test').generate({ prompt: 'x' }),
        (error: any) => error.status === 500
    );
});

test('Decorator zinciri: Logging(Retrying(istemci)) birlikte çalışır', async () => {
    const inner = new FlakyClient(1);
    const { sleep } = recordingSleep();
    const chain = new LoggingLLMClient(new RetryingLLMClient(inner, { sleep }), 'zincir');

    const result = await chain.generate({ prompt: 'x' });

    assert.equal(result.text, 'ok');
    assert.equal(inner.calls, 2);
});
