// Server-side fetch helpers for Next.js Server Components.
// Uses native fetch with Next.js cache + revalidate options.
// Returns null on failure so pages can render with empty/fallback states
// rather than crashing when the backend is briefly unavailable.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
}

export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const revalidate = options.revalidate ?? 60;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate, tags: options.tags },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
