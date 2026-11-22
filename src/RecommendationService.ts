import type { AiRecommendation, Product, RecommendResponse } from './types';
import type { LLMClient } from './ai/LLMClient';
import type { PricingStrategy } from './pricing/PricingStrategy';
import type { CompatibilityRule } from './validation/CompatibilityRule';
import { selectDirector } from './builder/directors';
import { buildSystemInstruction } from './prompt';

// Öneri akışında beklenen, kullanıcıya anlatılabilir hata (HTTP durum koduyla birlikte)
export class RecommendationError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
        this.name = 'RecommendationError';
    }
}

export interface RecommendationDeps {
    // Abstract Factory'den gelen, Decorator'larla sarılmış öneri istemcisi
    recommender: LLMClient;
    // Strategy: fiyat kaynağı
    pricing: PricingStrategy;
    // Chain of Responsibility: doğrulama zincirinin ilk halkası
    validation: CompatibilityRule;
    // Yapay zekâya gösterilen ürünler (piyasada olmayanlar çıkarılmış)
    catalog: Product[];
}

// Tüm öneri akışını yönetir. Eskiden tek bir rota işleyicisine gömülü olan fiyatlama, doğrulama ve
// parsing işleri artık kendi sınıflarına devredilir; bu sınıf yalnızca sırayı yönetir.
export class RecommendationService {
    private readonly systemInstruction: string;

    constructor(private readonly deps: RecommendationDeps) {
        this.systemInstruction = buildSystemInstruction(deps.catalog);
    }

    async recommend(userPrompt: string): Promise<RecommendResponse> {
        // 1. AŞAMA: yapay zekâdan ürün önerisi al
        const response = await this.deps.recommender.generate({
            prompt: userPrompt,
            systemInstruction: this.systemInstruction
        });
        const result = this.parseRecommendation(response.text);

        const recommendedIds: unknown[] = Array.isArray(result.recommended_product_ids)
            ? result.recommended_product_ids
            : [];
        const aiExplanation = typeof result.ai_explanation === 'string' && result.ai_explanation
            ? result.ai_explanation
            : "Sisteminiz başarıyla oluşturuldu.";

        // Ürün ID'lerini kataloğa göre doğrula; Builder tekrar edenleri zaten atar
        const selected: Product[] = [];
        for (const id of recommendedIds) {
            const product = this.deps.catalog.find(p => p.id === Number(id));
            if (product) selected.push(product);
            else console.warn(`⚠️ Geçersiz ürün ID'si önerildi: ${id}`);
        }

        // 2. AŞAMA: sadece önerilen ürünler için fiyat (Strategy)
        const prices = await this.deps.pricing.getPrices(selected);

        // Builder: seçilen parçalar ve fiyatlardan sistemi kur
        const build = selectDirector(selected).construct(selected, prices);

        // Chain of Responsibility: uyumluluk ve bütçe kuralları
        const violations = this.deps.validation.validate(build, { budget: this.readBudget(result.budget_tl) });
        if (violations.length > 0) {
            console.warn(`⚠️ Doğrulama uyarıları: ${violations.map(v => v.message).join(' | ')}`);
        }

        return {
            recommended_product_ids: build.parts.map(p => p.id),
            total_price: build.totalPrice,
            ai_explanation: aiExplanation,
            price_overrides: build.priceMap(),
            is_full_system: build.isFullSystem,
            missing_categories: [...build.missingCategories],
            warnings: violations.map(v => v.message)
        };
    }

    private parseRecommendation(rawText: string): AiRecommendation {
        let text = rawText.trim();
        if (text.startsWith("```")) {
            text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch (parseError) {
            console.error("JSON Parse Hatası:", parseError, "Ham metin:", text);
            throw new RecommendationError(500, "Yapay zeka geçersiz JSON döndü. Lütfen tekrar deneyin.");
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new RecommendationError(500, "Geçersiz yanıt formatı alındı.");
        }
        return parsed as AiRecommendation;
    }

    // Bütçe pozitif bir sayı değilse (null, yazı, 0...) bütçe kontrolü yapılmaz
    private readBudget(value: unknown): number | null {
        const budget = Number(value);
        return value !== null && value !== undefined && Number.isFinite(budget) && budget > 0 ? budget : null;
    }
}
