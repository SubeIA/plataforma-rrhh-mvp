import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Generic fetch hook with auth token injection and AbortController cancellation.
 * @param url - API endpoint (e.g. '/api/users')
 * @param options - Optional fetch init options (method, body, headers, etc.)
 * @param deps - Extra dependencies that trigger a refetch when changed
 */
export function useFetch<T>(
    url: string,
    options?: RequestInit,
    deps: unknown[] = []
): UseFetchResult<T> {
    const { token } = useAuth();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refetchCounter = useRef(0);

    const refetch = useCallback(() => {
        refetchCounter.current += 1;
        setLoading(true);
        setError(null);
    }, []);

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        ...(options?.headers ?? {}),
                    },
                });

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody?.message ?? `HTTP ${res.status}`);
                }

                const json: T = await res.json();
                if (!controller.signal.aborted) {
                    setData(json);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, token, refetchCounter.current, ...deps]);

    return { data, loading, error, refetch };
}
