/**
 * In-memory client-side cache with sessionStorage persistence and SWR (stale-while-revalidate).
 * Powers instant 0ms section switches and master data retrieval across Quickserves CRM.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Synchronously retrieves cached data if still within fresh threshold.
 */
export function getCachedData<T = any>(url: string, maxAgeMs = 3 * 60 * 1000): T | null {
  // Check memory cache first (instant)
  const entry = memoryCache.get(url);
  if (entry && Date.now() - entry.timestamp < maxAgeMs) {
    return entry.data;
  }

  // Fallback to sessionStorage if in browser
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`qs_cache_${url}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < maxAgeMs) {
          memoryCache.set(url, parsed);
          return parsed.data;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Stores data into memory and sessionStorage cache.
 */
export function setCachedData<T = any>(url: string, data: T) {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(url, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`qs_cache_${url}`, JSON.stringify(entry));
    } catch {
      // ignore storage quota limits gracefully
    }
  }
}

/**
 * Invalidates cache by exact key, prefix, or all.
 */
export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('qs_cache_'));
        keys.forEach((k) => sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(urlPrefix) || key.includes(urlPrefix)) {
      memoryCache.delete(key);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(sessionStorage).filter(
        (k) => k.startsWith('qs_cache_') && (k.includes(urlPrefix) || k.startsWith(`qs_cache_${urlPrefix}`))
      );
      keys.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}

/**
 * Performs cached fetch with SWR:
 * - If cached, immediately returns cached data and revalidates in the background if older than 30s.
 * - If not cached, fetches from network and updates cache.
 */
export async function fetchWithCache<T = any>(
  url: string,
  options?: RequestInit & { maxAgeMs?: number; forceRefresh?: boolean }
): Promise<T> {
  const maxAgeMs = options?.maxAgeMs ?? 3 * 60 * 1000; // 3 minutes default
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh) {
    const cached = getCachedData<T>(url, maxAgeMs);
    if (cached !== null) {
      // Background silent revalidation if older than 30s
      const entry = memoryCache.get(url);
      if (entry && Date.now() - entry.timestamp > 30 * 1000) {
        fetch(url, options)
          .then((r) => r.json())
          .then((fresh) => {
            if (fresh && fresh.success) {
              setCachedData(url, fresh);
            }
          })
          .catch(() => {});
      }
      return cached;
    }
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (data && data.success) {
    setCachedData(url, data);
  }
  return data;
}

/**
 * Pre-warms cache for primary masters in background so clicks on sidebar are 0ms instant.
 */
export function prefetchCommonMasters() {
  const commonUrls = [
    '/api/masters/branches',
    '/api/masters/franchises',
    '/api/masters/technicians',
    '/api/masters/brands',
    '/api/masters/categories',
    '/api/masters/clients',
    '/api/masters/products',
    '/api/masters/models',
    '/api/masters/symptoms',
    '/api/masters/freelancers',
    '/api/masters/dynamic?type=franchise_*',
    '/api/masters/dynamic?type=call_reg_*',
  ];

  commonUrls.forEach((url) => {
    if (!getCachedData(url, 3 * 60 * 1000)) {
      fetch(url)
        .then((r) => r.json())
        .then((json) => {
          if (json && json.success) {
            setCachedData(url, json);
          }
        })
        .catch(() => {});
    }
  });
}

