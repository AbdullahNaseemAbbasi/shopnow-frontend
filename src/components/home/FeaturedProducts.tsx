'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCachedFetch } from '@/lib/useCachedFetch';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { formatPrice, getDiscountPercent } from '@/lib/utils';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👟', 'Ladies Fashion': '👗',
  'Gents Fashion': '👘', 'Beauty': '✨', 'Home & Living': '🏠',
  'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

function ProductImage({ imageUrl, emoji, name }: { imageUrl?: string; emoji: string; name: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  return (
    <>
      {(!imgLoaded || imgError) && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-50">
          <span className="text-6xl select-none">{emoji}</span>
        </div>
      )}
      {imageUrl && !imgError && (
        <img
          src={imageUrl}
          alt={name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </>
  );
}

export default function FeaturedProducts() {
  const { data: productsData, loading } = useCachedFetch<Product[]>('products:featured', '/api/products/featured');
  const products = Array.isArray(productsData) ? productsData : [];
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    if (product.stock === 0) { toast.error('Out of stock!'); return; }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Please try again');
    } finally {
      setAddingId(null);
    }
  };

  const handleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    try {
      await api.post(`/api/wishlist/${id}`);
      setWishlisted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      toast.success(wishlisted.includes(id) ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch { toast.error('Please try again'); }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={20} className="text-blue-600" fill="currentColor" />
              <span className="text-blue-600 font-bold text-sm uppercase tracking-wide">Featured</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Top Picks For You</h2>
          </div>
          <Link href="/products" className="text-blue-600 font-semibold text-sm hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
            <div className="col-span-4 text-center py-12 text-gray-400">
              <p>No featured products yet</p>
            </div>
          ) : (
            products.map((product) => {
              const disc = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
              const emoji = EMOJIS[product.categoryName] || '🛍️';
              const isWished = wishlisted.includes(product.id);
              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="block h-full">
                  <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-blue-200">
                    <div className="relative w-full bg-slate-50 overflow-hidden" style={{ paddingBottom: '60%' }}>
                      <div className="absolute inset-0">
                        <ProductImage imageUrl={product.imageUrl} emoji={emoji} name={product.name} />
                      </div>
                      {disc > 0 && (
                        <span className="absolute top-2.5 left-2.5 z-10 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">-{disc}%</span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute top-2.5 left-2.5 z-10 bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Out of Stock</span>
                      )}
                      <button onClick={(e) => handleWishlist(e, product.id)}
                        className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 ${isWished ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600'}`}>
                        <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs text-slate-400 mb-1 truncate">{product.categoryName}</p>
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 flex-1 mb-2">{product.name}</h3>
                      {product.totalReviews > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold">{product.averageRating}</span>
                          <span className="text-xs text-slate-400">({product.totalReviews})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-blue-600 text-sm">{formatPrice(product.salePrice || product.price)}</span>
                        {product.salePrice && <span className="text-slate-400 line-through text-xs">{formatPrice(product.price)}</span>}
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={addingId === product.id || product.stock === 0}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-gray-200 transition-all duration-200 disabled:opacity-50">
                        <ShoppingCart size={14} />
                        {addingId === product.id ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
