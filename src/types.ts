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

// Gerçek fiyat haritası: { "ID1": 4200, "ID11": 9500 }
export type LivePrices = Record<string, number>;

// --- /api/recommend-pc ---

export interface RecommendRequest {
    userPrompt?: string;
}

export interface RecommendResponse {
    recommended_product_ids: number[];
    total_price: number;
    ai_explanation: string;
    price_overrides: Record<number, number>;
}

export interface ErrorResponse {
    error: string;
}

// Gemini'den beklediğimiz JSON (alanlar eksik veya yanlış tipte gelebilir)
export interface AiRecommendation {
    recommended_product_ids?: unknown;
    total_price?: unknown;
    ai_explanation?: unknown;
}
