// Two-layer cache for API responses:
//   Layer 1: in-memory Map (survives client-side navigations)
//   Layer 2: sessionStorage (survives full-page refresh within the tab)
// Plus: in-flight request map so 3 components asking for the same data hit the network once.

type CacheEntry<T = unknown> = { data: T; timestamp: number };

const memCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const STORAGE_PREFIX = "shopnow_cache_";
export const DEFAULT_TTL = 5 * 60 * 1000;

function readStorage<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota exceeded — silently drop
  }
}

export function getCached<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const mem = memCache.get(key) as CacheEntry<T> | undefined;
  if (mem && Date.now() - mem.timestamp < ttl) return mem.data;

  const stored = readStorage<T>(key);
  if (stored && Date.now() - stored.timestamp < ttl) {
    memCache.set(key, stored);
    return stored.data;
  }
  return null;
}

export function setCached<T>(key: string, data: T) {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memCache.set(key, entry);
  writeStorage(key, entry);
}

export function getInflight<T>(key: string): Promise<T> | undefined {
  return inflight.get(key) as Promise<T> | undefined;
}

export function setInflight<T>(key: string, promise: Promise<T>) {
  inflight.set(key, promise);
  promise.finally(() => inflight.delete(key));
}

export function invalidate(prefix?: string) {
  if (!prefix) {
    memCache.clear();
    if (typeof window !== "undefined") {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    }
    return;
  }
  for (const key of Array.from(memCache.keys())) {
    if (key.startsWith(prefix)) memCache.delete(key);
  }
  if (typeof window !== "undefined") {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX + prefix))
      .forEach((k) => sessionStorage.removeItem(k));
  }
}
