'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Category, Banner } from '@/types';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗',
  'Gents Fashion': '👘', 'Beauty': '💄', 'Home & Living': '🏠',
  'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

interface Props {
  initialData?: Category[];
  initialBanners?: Banner[];
}

export default function HeroBanner({ initialData, initialBanners }: Props) {
  // CMS banners take precedence; fall back to a category-driven hero when none are configured.
  const { data: bannerData } = useCachedFetch<Banner[]>('banners', '/api/banners',
    initialBanners ? { initialData: initialBanners } : {});
  const banners = Array.isArray(bannerData) ? bannerData : [];
  const useBanners = banners.length > 0;

  const { data: allCategories, loading } = useCachedFetch<Category[]>('categories', '/api/categories',
    initialData ? { initialData } : {});
  const categories = Array.isArray(allCategories) ? allCategories.slice(0, 5) : [];

  const count = useBanners ? banners.length : categories.length;
  const [current, setCurrent] = useState(0);

  useEffect(() => { setCurrent(0); }, [useBanners]);
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % count), 5500);
    return () => clearInterval(timer);
  }, [count]);

  const prev = () => setCurrent((p) => (p - 1 + count) % count);
  const next = () => setCurrent((p) => (p + 1) % count);

  if (loading && !useBanners) return <div className="h-64 md:h-80 hero-gradient animate-pulse" />;
  if (count === 0) return null;

  const Arrows = count > 1 ? (
    <>
      <button onClick={prev} aria-label="Previous slide" className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all z-10">
        <ChevronLeft size={24} />
      </button>
      <button onClick={next} aria-label="Next slide" className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all z-10">
        <ChevronRight size={24} />
      </button>
    </>
  ) : null;

  const Dots = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
          className={`transition-all rounded-full ${i === current ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
      ))}
    </div>
  );

  // ===== CMS banners =====
  if (useBanners) {
    const b = banners[current];
    return (
      <div className="relative hero-gradient overflow-hidden">
        {b.imageUrl && (
          <>
            <Image src={b.imageUrl} alt={b.title} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
          </>
        )}
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28">
          <div className="text-white space-y-4 max-w-xl animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-black leading-tight">{b.title}</h1>
            {b.subtitle && <p className="text-white/90 text-base md:text-lg font-light leading-relaxed">{b.subtitle}</p>}
            {b.ctaText && b.ctaLink && (
              <div className="pt-2">
                <Link href={b.ctaLink} className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform inline-block">
                  {b.ctaText}
                </Link>
              </div>
            )}
          </div>
        </div>
        {Arrows}
        {Dots}
      </div>
    );
  }

  // ===== Category fallback =====
  const cat = categories[current];
  const emoji = EMOJIS[cat.name] || '🛍️';
  return (
    <div className="relative hero-gradient overflow-hidden transition-all duration-700">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white space-y-4 md:w-1/2 animate-fade-in-up">
            <span className="inline-block bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Shop by category
            </span>
            <h1 className="text-2xl md:text-4xl font-black leading-tight">
              {cat.name}
              {cat.description && (
                <span className="block text-white/90 text-sm md:text-base font-light mt-2 leading-relaxed max-w-md">
                  {cat.description}
                </span>
              )}
            </h1>
            {!cat.description && (
              <p className="text-white/80 text-sm max-w-md">Quality products at the best prices. Shop now!</p>
            )}
            <div className="flex gap-3 pt-2">
              <Link href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`}
                className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform inline-block">
                Shop {cat.name}
              </Link>
              <Link href="/products" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all inline-block">
                View All
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {cat.imageUrl ? (
              <div className="relative w-full h-64 md:h-80 animate-float">
                <Image src={cat.imageUrl} alt={cat.name} fill sizes="(max-width: 768px) 100vw, 50vw" priority className="object-contain rounded-2xl" />
              </div>
            ) : (
              <div className="text-[120px] md:text-[200px] animate-float select-none">{emoji}</div>
            )}
          </div>
        </div>
      </div>
      {Arrows}
      {Dots}
    </div>
  );
}
