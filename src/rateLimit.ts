import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from './types';

// ============================================================
// İSTEK SINIRLARI (Gemini kredisini botlara ve kötüye kullanıma karşı korur)
// ============================================================

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function envNumber(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Ayarlar Render'daki ortam değişkenlerinden değiştirilebilir
export const LIMITS = {
    perIpPerMinute: envNumber('LIMIT_PER_IP_PER_MINUTE', 3),
    perIpPerDay: envNumber('LIMIT_PER_IP_PER_DAY', 10),
    globalPerDay: envNumber('DAILY_RECOMMEND_LIMIT', 30),
    maxPromptLength: envNumber('MAX_PROMPT_LENGTH', 500)
};

interface Window {
    count: number;
    resetAt: number;
}

// Sabit pencereli sayaç: her anahtar (IP veya "global") için pencere başına en fazla `limit` istek
class FixedWindowCounter {
    private windows = new Map<string, Window>();

    constructor(private readonly limit: number, private readonly windowMs: number) {}

    canHit(key: string, now: number): boolean {
        const window = this.windows.get(key);
        return !window || window.resetAt <= now || window.count < this.limit;
    }

    hit(key: string, now: number): void {
        const window = this.windows.get(key);
        if (!window || window.resetAt <= now) {
            this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
        } else {
            window.count++;
        }
        if (this.windows.size > 10_000) this.prune(now);
    }

    // Süresi dolmuş pencereleri sil (çok sayıda farklı IP belleği şişirmesin)
    private prune(now: number): void {
        for (const [key, window] of this.windows) {
            if (window.resetAt <= now) this.windows.delete(key);
        }
    }
}

const perIpMinute = new FixedWindowCounter(LIMITS.perIpPerMinute, MINUTE_MS);
const perIpDay = new FixedWindowCounter(LIMITS.perIpPerDay, DAY_MS);
const globalDay = new FixedWindowCounter(LIMITS.globalPerDay, DAY_MS);

export function recommendLimiter(req: Request, res: Response<ErrorResponse>, next: NextFunction) {
    const prompt: unknown = req.body?.userPrompt;
    if (typeof prompt === 'string' && prompt.length > LIMITS.maxPromptLength) {
        return res.status(400).json({ error: `Mesajınız en fazla ${LIMITS.maxPromptLength} karakter olabilir.` });
    }

    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    // 'trust proxy' ayarının doğru IP'yi seçtiğini Render loglarında doğrulamak için
    console.log(`📨 Öneri isteği: ip=${ip}, x-forwarded-for=${req.get('x-forwarded-for') ?? '-'}`);

    if (!globalDay.canHit('global', now)) {
        console.warn("⛔ Günlük toplam öneri sınırına ulaşıldı.");
        return res.status(429).json({ error: "Sistem bugünkü öneri sınırına ulaştı. Lütfen yarın tekrar deneyin." });
    }
    if (!perIpMinute.canHit(ip, now)) {
        return res.status(429).json({ error: "Çok hızlı istek gönderiyorsunuz. Lütfen bir dakika bekleyin." });
    }
    if (!perIpDay.canHit(ip, now)) {
        return res.status(429).json({ error: "Bugünkü öneri hakkınızı doldurdunuz. Lütfen yarın tekrar deneyin." });
    }

    perIpMinute.hit(ip, now);
    perIpDay.hit(ip, now);
    globalDay.hit('global', now);
    next();
}
