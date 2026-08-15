"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

interface Props {
  excludeId?: number;   // e.g. the product currently being viewed
  title?: string;
  altBg?: boolean;
}

// Reads the client-side history after mount (localStorage isn't available on the server, so this
// renders nothing until hydrated — avoids any SSR mismatch).
export default function RecentlyViewed({ excludeId, title = "Recently viewed", altBg }: Props) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((p) => p.id !== excludeId).slice(0, 8));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className={altBg ? "bg-slate-50" : ""}>
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <h2 className="text-2xl md:text-3xl font-black text-ink mb-6 flex items-center gap-2">
          <Clock size={22} className="text-brand" /> {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
