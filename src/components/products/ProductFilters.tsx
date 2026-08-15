"use client";

import { Star, X } from "lucide-react";
import type { Category } from "@/types";
import { formatPrice } from "@/lib/utils";

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  minRating: number | null;
  inStock: boolean;
}

interface Props {
  categories: Category[];
  activeCategoryId: string;
  onCategory: (id: string) => void;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  bounds: { min: number; max: number } | null;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const RATINGS = [4, 3, 2];

export default function ProductFilters({
  categories, activeCategoryId, onCategory, filters, onChange, bounds, onClear, hasActiveFilters,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Category</h3>
        <div className="space-y-0.5">
          <button
            onClick={() => onCategory("")}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategoryId === "" ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategory(String(c.id))}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategoryId === String(c.id) ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Price range</h3>
        {bounds && (
          <p className="text-[11px] text-gray-400 mb-2">
            {formatPrice(bounds.min)} – {formatPrice(bounds.max)}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={bounds ? String(bounds.min) : "Min"}
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
            aria-label="Minimum price"
          />
          <span className="text-gray-300">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={bounds ? String(bounds.max) : "Max"}
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Rating</h3>
        <div className="space-y-0.5">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => onChange({ minRating: filters.minRating === r ? null : r })}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.minRating === r ? "bg-brand-50 text-brand font-semibold" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} className={s <= r ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
              </span>
              <span>&amp; up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Availability</h3>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand accent-brand"
          />
          In stock only
        </label>
      </div>
    </div>
  );
}
