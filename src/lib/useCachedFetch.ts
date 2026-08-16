"use client";
import { useEffect, useState } from "react";
import api from "./axios";
import { getCached, setCached, getInflight, setInflight, DEFAULT_TTL } from "./cache";

interface Options<T> {
  ttl?: number;
  // Server-rendered seed data. Used as initial state when cache is empty;
  // also written to cache so other components on the same key benefit.
  initialData?: T;
}

// Stale-while-revalidate: returns cached data immediately if present,
// fires a background fetch to refresh, dedupes concurrent requests by key.
export function useCachedFetch<T>(
  key: string | null,
  url: string | null,
  options: Options<T> = {}
) {
  const ttl = options.ttl ?? DEFAULT_TTL;
  // Initial state must be identical on server and client. Module-level memCache
  // leaks state across server requests, so we never read it during initial render —
  // only inside useEffect (client-only).
  const [data, setData] = useState<T | null>(options.initialData ?? null);
  const [loading, setLoading] = useState(
    options.initialData === undefined && !!key && !!url
  );
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!key || !url) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const cached = getCached<T>(key, ttl);
    // True when we already hold data that is fresh within the TTL window: either a still-valid
    // cache entry, or the server seed we write below (its timestamp is "now").
    let haveFreshData = cached !== null;
    if (cached) {
      setData(cached);
      setLoading(false);
    } else if (options.initialData !== undefined) {
      // Seed the client cache so other components on the same key benefit.
      setCached(key, options.initialData);
      haveFreshData = true;
    }

    // When the caller supplied server-rendered seed data AND we're holding fresh (<TTL) data,
    // skip the redundant on-mount network revalidate — it would just re-fetch what the server
    // already embedded. Later runs (key/url/ttl change) still revalidate normally, and callers
    // without initialData keep their usual stale-while-revalidate behaviour.
    if (options.initialData !== undefined && haveFreshData) {
      return () => {
        cancelled = true;
      };
    }

    let promise = getInflight<T>(key);
    if (!promise) {
      promise = api.get<T>(url).then((res) => {
        const result = res.data;
        setCached(key, result);
        return result;
      });
      setInflight(key, promise);
    }

    promise
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        if (!cached && options.initialData === undefined) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, url, ttl, options.initialData]);

  return { data, loading, error };
}

// Fire-and-forget warming of cache. Use for hover-prefetch or route prefetch.
export function prefetch<T>(key: string, url: string, ttl: number = DEFAULT_TTL) {
  if (typeof window === "undefined") return;
  if (getCached<T>(key, ttl)) return;
  if (getInflight<T>(key)) return;
  const promise = api.get<T>(url).then((res) => {
    setCached(key, res.data);
    return res.data;
  });
  setInflight(key, promise);
}
