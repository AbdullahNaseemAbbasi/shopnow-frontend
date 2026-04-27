'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Category } from '@/types';

const GRADIENTS = [
  'from-slate-900 via-blue-950 to-slate-900',
  'from-blue-900 via-indigo-900 to-slate-900',
  'from-slate-900 via-blue-900 to-indigo-900',
  'from-indigo-900 via-blue-900 to-slate-900',
  'from-slate-900 via-indigo-950 to-blue-900',
];
const ACCENTS = ['bg-blue-600', 'bg-indigo-600', 'bg-blue-700', 'bg-indigo-700', 'bg-blue-600'];
const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗',
  'Gents Fashion': '👘', 'Beauty': '💄', 'Home & Living': '🏠',
  'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};
const BADGES = ['Mega Sale', 'New Collection', 'Best Deals', 'Hot Picks', 'Top Rated'];
const TAGS = ['Up to 50% OFF', 'Shop Now', 'Explore Collection', 'View Deals', 'Discover More'];
export default function HeroBanner({ initialData }: { initialData?: Category[] }) {
  const [current, setCurrent] = useState(0);
  const { data: allCategories, loading } = useCachedFetch<Category[]>(
    'categories',
    '/api/categories',
    { initialData }
  );
  const categories = Array.isArray(allCategories) ? allCategories.slice(0, 5) : [];
  useEffect(() => {
    if (categories.length === 0) return;
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % categories.length), 5000);
    return () => clearInterval(timer);
  }, [categories.length]);
  const prev = () => setCurrent(prev => (prev - 1 + categories.length) % categories.length);
  const next = () => setCurrent(prev => (prev + 1) % categories.length);
  if (loading) {
    return (
      <div className="h-64 md:h-80 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 animate-pulse" />
    );
  }
  if (categories.length === 0) return null;
  const cat = categories[current];
  const emoji = EMOJIS[cat.name] || '🛍️';
  const bg = GRADIENTS[current % GRADIENTS.length];
  const accent = ACCENTS[current % ACCENTS.length];
  const badge = BADGES[current % BADGES.length];
  const tag = TAGS[current % TAGS.length];
  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden transition-all duration-700`}>
      <div className="max-w-[1600px] mx-auto px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white space-y-4 md:w-1/2 animate-fade-in-up">
            <span className={`inline-block ${accent} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
              {badge}
            </span>
            <h1 className="text-2xl md:text-4xl font-black leading-tight">
              {cat.name}
              {cat.description && (
                <span className="block text-blue-300 text-sm md:text-base font-light mt-2 leading-relaxed max-w-md">
                  {cat.description}
                </span>
              )}
            </h1>
            {!cat.description && (
              <p className="text-gray-300 text-sm max-w-md">
                Best quality products at the best prices. Shop now!
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                <ShoppingBag size={14} /> {tag}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`}
                className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform inline-block"
              >
                Shop {cat.name}
              </Link>
              <Link href="/products" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all inline-block">
                View All
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {cat.imageUrl ? (
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="max-h-64 md:max-h-80 object-contain rounded-2xl animate-float"
              />
            ) : (
              <div className="text-[120px] md:text-[200px] animate-float select-none">{emoji}</div>
            )}
          </div>
        </div>
      </div>
      {categories.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all">
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {categories.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`transition-all rounded-full ${i === current ? 'w-8 h-2 bg-blue-400' : 'w-2 h-2 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}
