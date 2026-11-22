import type { Product } from '../types';

// Ürünün specs alanından metin okur (ör. socket → "AM5")
export function specText(product: Product, key: string): string | undefined {
    const value = product.specs[key];
    return value === undefined ? undefined : String(value);
}

// Ürünün specs alanından sayı okur; "550W" gibi birimli değerlerde baştaki sayıyı alır
export function specNumber(product: Product, key: string): number | undefined {
    const text = specText(product, key);
    if (text === undefined) return undefined;
    const value = parseInt(text, 10);
    return Number.isFinite(value) ? value : undefined;
}

export function productLabel(product: Product): string {
    return `${product.brand} ${product.model}`;
}
