"use client";

import { useCachedFetch } from "@/lib/useCachedFetch";
import type { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";

// "You may also like" — same-category products for the product detail page (doc §5).
export default function RelatedProducts({ productId }: { productId: number }) {
  const { data, loading } = useCachedFetch<Product[]>(
    `related:${productId}`,
    `/api/products/${productId}/related`
  );
  const products = Array.isArray(data) ? data : [];

  // Nothing to show once loaded → render nothing (no empty heading).
  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 pb-12">
      <h2 className="text-xl font-black text-gray-900 mb-4">You may also like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading && products.length === 0
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
