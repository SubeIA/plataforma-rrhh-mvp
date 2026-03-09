import { auth } from '../config/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Authenticated fetch wrapper.
 * Now injects the Firebase Auth ID Token automatically.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${path}`;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    // Si hay un usuario logueado en Firebase, adjuntamos su token
    if (auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        } catch (err) {
            console.error('Error obteniendo token de Firebase:', err);
        }
    }

    return fetch(url, {
        ...options,
        headers,
        // credentials: 'omit' ya que ahora usamos headers puros en lugar de cookies
    });
}
