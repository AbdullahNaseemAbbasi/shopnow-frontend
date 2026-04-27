"use client";
import { useEffect, useState } from "react";
import api from "./axios";
import { getCached, setCached, getInflight, setInflight, DEFAULT_TTL } from "./cache";

interface Options {
  ttl?: number;
}

// Stale-while-revalidate: returns cached data immediately if present,
// fires a background fetch to refresh, dedupes concurrent requests by key.
export function useCachedFetch<T>(
  key: string | null,
  url: string | null,
  options: Options = {}
) {
  const ttl = options.ttl ?? DEFAULT_TTL;
  const initial = key ? getCached<T>(key, ttl) : null;
  const [data, setData] = useState<T | null>(initial);
  const [loading, setLoading] = useState(!initial && !!key && !!url);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!key || !url) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const cached = getCached<T>(key, ttl);
    if (cached) {
      setData(cached);
      setLoading(false);
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
        if (!cached) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, url, ttl]);

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
