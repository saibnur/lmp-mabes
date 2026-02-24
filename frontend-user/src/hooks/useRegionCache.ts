import { useState, useEffect, useRef } from 'react';
import { memberApi } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Client-side sessionStorage cache for region data.
// Key: region_{type}_{parentId}
// TTL: session-scoped (cleared when tab closes).
// This prevents re-fetching when the user navigates back to a previous step.
// ─────────────────────────────────────────────────────────────────────────────

type RegionType = 'provinces' | 'regencies' | 'districts' | 'villages';

interface Region {
    id: string;
    name: string;
}

interface UseRegionCacheResult {
    data: Region[];
    loading: boolean;
    error: string | null;
}

function buildKey(type: RegionType, parentId?: string): string {
    return `region_${type}${parentId ? `_${parentId}` : ''}`;
}

function readCache(key: string): Region[] | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as Region[];
    } catch {
        return null;
    }
}

function writeCache(key: string, data: Region[]): void {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // sessionStorage quota exceeded or disabled — fail silently
    }
}

/**
 * Fetches region data with sessionStorage caching and built-in error handling.
 *
 * @param type   - 'provinces' | 'regencies' | 'districts' | 'villages'
 * @param parentId - required for regencies, districts, villages
 * @param enabled  - set to false to skip the fetch (e.g. when parentId is not yet selected)
 */
export function useRegionCache(
    type: RegionType,
    parentId?: string,
    enabled: boolean = true
): UseRegionCacheResult {
    const [data, setData] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track the last fetched key to avoid stale state on rapid parent changes
    const lastKeyRef = useRef<string>('');

    useEffect(() => {
        if (!enabled) {
            setData([]);
            setLoading(false);
            setError(null);
            return;
        }

        const key = buildKey(type, parentId);
        lastKeyRef.current = key;

        // 1. Check sessionStorage cache first
        const cached = readCache(key);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError(null);
            return;
        }

        // 2. Fetch from backend
        setLoading(true);
        setError(null);
        setData([]);

        memberApi
            .getRegions(type, parentId)
            .then(({ data: res }) => {
                // Guard: ignore if a newer key was triggered while this was in-flight
                if (lastKeyRef.current !== key) return;

                if (res.success && Array.isArray(res.data)) {
                    writeCache(key, res.data);
                    setData(res.data);
                } else {
                    setError('Data wilayah tidak valid. Coba lagi.');
                }
            })
            .catch((err) => {
                if (lastKeyRef.current !== key) return;

                const isNetworkError =
                    !navigator.onLine ||
                    err?.code === 'ECONNABORTED' ||
                    err?.message?.toLowerCase().includes('network') ||
                    err?.message?.toLowerCase().includes('timeout');

                if (isNetworkError) {
                    setError('Koneksi internet bermasalah. Periksa jaringan Anda lalu coba lagi.');
                } else {
                    setError('Server wilayah tidak merespons. Coba beberapa saat lagi.');
                }
            })
            .finally(() => {
                if (lastKeyRef.current === key) {
                    setLoading(false);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, parentId, enabled]);

    return { data, loading, error };
}
