'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Category } from '@/types';

const CATEGORY_STYLES: Record<string, { color: string; emoji: string }> = {
  'Electronics':    { color: 'from-blue-500 to-blue-700',     emoji: '📱' },
  'Fashion':        { color: 'from-pink-500 to-rose-600',     emoji: '👗' },
  'Home & Living':  { color: 'from-amber-500 to-orange-600',  emoji: '🏠' },
  'Beauty':         { color: 'from-purple-500 to-violet-600', emoji: '💄' },
  'Sports':         { color: 'from-green-500 to-emerald-600', emoji: '⚽' },
  'Books':          { color: 'from-indigo-500 to-indigo-700', emoji: '📚' },
  'Kids':           { color: 'from-yellow-500 to-amber-600',  emoji: '🧸' },
  'Groceries':      { color: 'from-teal-500 to-cyan-600',     emoji: '🛒' },
};

const DEFAULT_COLORS = [
  'from-red-500 to-rose-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-500',
  'from-cyan-500 to-teal-600',
];

const DEFAULT_EMOJIS = ['🛍️', '🎁', '✨', '🔥', '💫', '🎯'];

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/categories')
      .then(res => {
        const data = res.data?.content || res.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Find exactly what you are looking for</p>
          </div>
          <Link href="/products" className="text-blue-600 font-semibold text-sm hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3">
                <div className="skeleton w-14 h-14 rounded-2xl" />
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-2 w-12" />
              </div>
            ))
          ) : (
            categories.map((cat, i) => {
              const style = CATEGORY_STYLES[cat.name] || {
                color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                emoji: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
              };
              return (
                <Link key={cat.id} href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`}
                  className="category-card bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${style.color} rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      style.emoji
                    )}
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
