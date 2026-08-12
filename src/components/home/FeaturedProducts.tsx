'use client';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

export default function FeaturedProducts({ initialData }: { initialData?: Product[] }) {
  const { data: productsData, loading } = useCachedFetch<Product[]>(
    'products:featured',
    '/api/products/featured',
    { initialData }
  );
  const products = Array.isArray(productsData) ? productsData : [];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={20} className="text-brand" fill="currentColor" />
              <span className="text-brand font-bold text-sm uppercase tracking-wide">Featured</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-ink">Top Picks For You</h2>
          </div>
          <Link href="/products" className="text-brand font-semibold text-sm hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
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
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-ink-muted">
              <p>No featured products yet</p>
            </div>
          ) : (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          )}
        </div>
      </div>
    </section>
  );
}
