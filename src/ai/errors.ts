// Hata nesnesinden HTTP durum kodunu güvenli şekilde oku (Gemini SDK hataları .status taşır)
export function getErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        return error.status;
    }
    return undefined;
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
