// ============================================================
// ORTAK TİPLER
// ============================================================

export type Category = 'CPU' | 'GPU' | 'Motherboard' | 'RAM' | 'Power' | 'SSD' | 'Case' | 'Cooler';

export interface Product {
    id: number;
    category: Category;
    brand: string;
    model: string;
    price: number;
    stock: number;
    specs: Record<string, string | number>;
}

// --- /api/recommend-pc ---

export interface RecommendRequest {
    userPrompt?: string;
}

export interface RecommendResponse {
    recommended_product_ids: number[];
    total_price: number;
    ai_explanation: string;
    price_overrides: Record<number, number>;
    // PCBuild'den (Builder kalıbı) gelir: arayüz artık Türkçe kategori adı eşleştirmesi yapmaz
    is_full_system: boolean;
    missing_categories: Category[];
    // Doğrulama zincirinin (Chain of Responsibility) bulduğu uyumsuzluk ve bütçe uyarıları
    warnings: string[];
}

export interface ErrorResponse {
    error: string;
}

// Gemini'den beklediğimiz JSON (alanlar eksik veya yanlış tipte gelebilir)
export interface AiRecommendation {
    recommended_product_ids?: unknown;
    total_price?: unknown;
    ai_explanation?: unknown;
    budget_tl?: unknown;
}
