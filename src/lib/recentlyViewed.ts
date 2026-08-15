import type { Product } from "@/types";

// Client-side "recently viewed" history in localStorage. Personal, no backend — most-recent first,
// de-duplicated, capped. We store a trimmed Product so the ProductCard can render it fully offline.
const KEY = "shopnow_recently_viewed";
const MAX = 12;

export function recordView(product: Product) {
  if (typeof window === "undefined" || !product?.id) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: Product[] = raw ? JSON.parse(raw) : [];
    const next = [product, ...list.filter((p) => p.id !== product.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / parse errors */
  }
}

export function getRecentlyViewed(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
