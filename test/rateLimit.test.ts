import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { recommendLimiter, LIMITS } from '../src/rateLimit';
import { muteConsole } from './helpers';

// Sınırlayıcının kendi davranışları (tasarım kalıbı değil, maliyet koruması)

muteConsole();

function run(prompt: unknown, ip: string) {
    const result = { next: false, status: 200, body: undefined as unknown };
    const req = { body: { userPrompt: prompt }, ip, get: () => undefined } as unknown as Request;
    const res = {
        status(code: number) { result.status = code; return this; },
        json(body: unknown) { result.body = body; return this; }
    } as unknown as Response;
    recommendLimiter(req, res, () => { result.next = true; });
    return result;
}

test('geçerli istek geçer', () => {
    assert.equal(run('40 bin TL oyun bilgisayarı', 'ip-gecerli').next, true);
});

test('boş, boşluk dolu veya metin olmayan mesaj 400 alır', () => {
    for (const bad of ['', '   ', undefined, null, 42, ['liste'], { a: 1 }]) {
        const result = run(bad, 'ip-gecersiz');
        assert.equal(result.status, 400, `mesaj: ${JSON.stringify(bad)}`);
        assert.equal(result.next, false);
    }
});

test('geçersiz istekler günlük hakkı tüketmez', () => {
    for (let i = 0; i < LIMITS.perIpPerMinute + 3; i++) run('', 'ip-tuketmez');

    assert.equal(run('merhaba', 'ip-tuketmez').next, true);
});

test('çok uzun mesaj 400 alır', () => {
    const result = run('a'.repeat(LIMITS.maxPromptLength + 1), 'ip-uzun');

    assert.equal(result.status, 400);
    assert.equal(result.next, false);
});

test('aynı IP dakikalık sınırı aşınca 429 alır, başka IP etkilenmez', () => {
    for (let i = 0; i < LIMITS.perIpPerMinute; i++) assert.equal(run('x', 'ip-hizli').next, true);

    const blocked = run('x', 'ip-hizli');
    assert.equal(blocked.status, 429);
    assert.equal(blocked.next, false);
    assert.equal(run('x', 'ip-baska').next, true);
});
