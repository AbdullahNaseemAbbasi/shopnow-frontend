'use client';
import Link from 'next/link';
import { Sparkles, Flame, Zap } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

// Icons are resolved from a string key so this client component can be rendered from a Server
// Component (a lucide component itself can't be passed as a prop across the RSC boundary).
const ICONS = { sparkles: Sparkles, flame: Flame, zap: Zap } as const;

interface Props {
  title: string;
  eyebrow: string;
  icon: keyof typeof ICONS;
  cacheKey: string;
  url: string;
  initialData?: Product[];
  viewAllHref?: string;
  altBg?: boolean; // subtle alternating background between rails
}

// Generic homepage product rail (New Arrivals / Best Sellers). Fetches a small product list,
// renders a ProductCard grid with a skeleton while loading, and hides itself entirely once loaded
// with nothing to show (e.g. Best Sellers before any sales exist).
export default function ProductRail({
  title, eyebrow, icon, cacheKey, url, initialData, viewAllHref, altBg,
}: Props) {
  const { data, loading } = useCachedFetch<Product[]>(cacheKey, url, { initialData });
  const products = Array.isArray(data) ? data : [];
  const Icon = ICONS[icon] ?? Sparkles;

  if (!loading && products.length === 0) return null;

  return (
    <section className={`py-12 ${altBg ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={20} className="text-brand" fill="currentColor" />
              <span className="text-brand font-bold text-sm uppercase tracking-wide">{eyebrow}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-ink">{title}</h2>
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-brand font-semibold text-sm hover:underline">View All</Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading && products.length === 0
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-line overflow-hidden">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-8 w-full rounded-xl" />
                  </div>
                </div>
              ))
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
