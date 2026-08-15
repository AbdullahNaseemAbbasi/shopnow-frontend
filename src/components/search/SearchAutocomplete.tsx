"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import type { ProductSuggestion } from "@/types";
import ProductImage from "@/components/ui/ProductImage";

const RECENT_KEY = "shopnow_recent_searches";
const MAX_RECENT = 6;

interface Props {
  className?: string;
  onNavigate?: () => void; // e.g. close the mobile drawer after navigating
  autoFocus?: boolean;
}

export default function SearchAutocomplete({ className = "", onNavigate, autoFocus }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // -1/0 = "search all" row, 1..N = product rows
  const [recent, setRecent] = useState<string[]>([]);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  // Load recent searches once (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Debounced, race-safe suggestion fetch. Stale responses are ignored via a request id.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(() => {
      api.get<ProductSuggestion[]>("/api/products/suggest", { params: { q } })
        .then((res) => { if (id === reqId.current) { setSuggestions(res.data || []); setActive(-1); } })
        .catch(() => { if (id === reqId.current) setSuggestions([]); })
        .finally(() => { if (id === reqId.current) setLoading(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const saveRecent = (q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const runSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    saveRecent(q);
    setQuery(q);
    setOpen(false);
    onNavigate?.();
    router.push(`/products?keyword=${encodeURIComponent(q)}`);
  };

  const goToProduct = (s: ProductSuggestion) => {
    setOpen(false);
    onNavigate?.();
    router.push(`/products/${s.slug}`);
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  const q = query.trim();
  const showSuggestions = q.length >= 1;
  const rowCount = showSuggestions ? 1 + suggestions.length : 0; // "search all" + products

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault(); setOpen(true);
      setActive((i) => Math.min(rowCount - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && active >= 1 && suggestions[active - 1]) goToProduct(suggestions[active - 1]);
      else runSearch(query);
    } else if (e.key === "Escape") {
      setOpen(false); setActive(-1);
    }
  };

  const dropdownOpen = open && (showSuggestions || recent.length > 0);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
        className="flex w-full rounded-xl overflow-hidden border-2 border-brand focus-within:shadow-lg transition-shadow"
      >
        <input
          type="text"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          placeholder="Search products, brands, categories..."
          className="flex-1 px-4 py-2.5 text-sm outline-none min-w-0"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
        />
        <button type="submit" aria-label="Search" className="bg-brand hover:bg-brand-700 px-5 text-white transition-colors">
          <Search size={18} />
        </button>
      </form>

      {dropdownOpen && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto"
        >
          {showSuggestions ? (
            <>
              <button
                type="button"
                onMouseEnter={() => setActive(0)}
                onClick={() => runSearch(query)}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm ${active <= 0 ? "bg-brand-50" : "hover:bg-gray-50"}`}
              >
                <Search size={15} className="text-brand flex-shrink-0" />
                <span className="text-gray-700">Search for <span className="font-bold text-gray-900">“{q}”</span></span>
                {loading && <Loader2 size={14} className="animate-spin text-gray-300 ml-auto" />}
              </button>

              {suggestions.length > 0 && <div className="border-t border-gray-50 my-1" />}

              {suggestions.map((s, i) => {
                const price = s.salePrice || s.price;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setActive(i + 1)}
                    onClick={() => goToProduct(s)}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left ${active === i + 1 ? "bg-brand-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
                      <ProductImage src={s.imageUrl} alt={s.name} sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 truncate">{s.categoryName}</p>
                    </div>
                    <span className="text-sm font-bold text-brand flex-shrink-0">{formatPrice(price)}</span>
                  </button>
                );
              })}

              {!loading && suggestions.length === 0 && q.length >= 2 && (
                <p className="px-4 py-3 text-sm text-gray-400">No products match — press Enter to search everything.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Recent searches</span>
                <button type="button" onClick={clearRecent} className="text-xs text-gray-400 hover:text-brand">Clear</button>
              </div>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => runSearch(term)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Clock size={14} className="text-gray-300 flex-shrink-0" />
                  <span className="truncate">{term}</span>
                  <X
                    size={13}
                    className="ml-auto text-gray-300 hover:text-gray-600 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecent((prev) => {
                        const next = prev.filter((x) => x !== term);
                        try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                        return next;
                      });
                    }}
                  />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
