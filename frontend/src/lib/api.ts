const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Authenticated fetch wrapper. Sends credentials (httpOnly cookies) automatically.
 * Falls back to Authorization header if a token exists in localStorage (migration support).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${path}`;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
}
