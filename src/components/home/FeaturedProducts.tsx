'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { formatPrice, getDiscountPercent } from '@/lib/utils';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👟', 'Ladies Fashion': '👗',
  'Gents Fashion': '👘', 'Beauty': '✨', 'Home & Living': '🏠',
  'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  useEffect(() => {
    api.get('/api/products/featured')
      .then(res => {
        const data = res.data?.content || res.data;
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Pehle login karein!'); return; }
    if (product.stock === 0) { toast.error('Out of stock!'); return; }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success('Cart mein add ho gaya! 🛒');
    } catch {
      toast.error('Dobara try karein');
    } finally {
      setAddingId(null);
    }
  };

  const handleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Pehle login karein!'); return; }
    try {
      await api.post(`/api/wishlist/${id}`);
      setWishlisted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      toast.success(wishlisted.includes(id) ? 'Wishlist se hata diya' : 'Wishlist mein add! ❤️');
    } catch { toast.error('Dobara try karein'); }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={20} className="text-red-600" fill="currentColor" />
              <span className="text-red-600 font-bold text-sm uppercase tracking-wide">Featured</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Top Picks For You</h2>
          </div>
          <Link href="/products" className="text-red-600 font-semibold text-sm hover:underline">View All</Link>
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
              <p>Koi featured product nahi hai abhi</p>
            </div>
          ) : (
            products.map((product) => {
              const disc = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
              const emoji = EMOJIS[product.categoryName] || '🛍️';
              const isWished = wishlisted.includes(product.id);
              return (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden group cursor-pointer h-full flex flex-col">
                    <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-500 select-none">{emoji}</span>
                      )}
                      {disc > 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2 py-1 rounded-lg">-{disc}%</span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute top-3 left-3 bg-gray-700 text-white text-xs font-black px-2 py-1 rounded-lg">Out of Stock</span>
                      )}
                      <button onClick={(e) => handleWishlist(e, product.id)}
                        className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 ${isWished ? 'bg-red-600 text-white' : 'bg-white text-gray-400 hover:text-red-600'}`}>
                        <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs text-gray-400 mb-1">{product.categoryName}</p>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 flex-1 mb-2">{product.name}</h3>
                      {product.totalReviews > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold">{product.averageRating}</span>
                          <span className="text-xs text-gray-400">({product.totalReviews})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-black text-red-600 text-sm">{formatPrice(product.salePrice || product.price)}</span>
                        {product.salePrice && <span className="text-gray-400 line-through text-xs">{formatPrice(product.price)}</span>}
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={addingId === product.id || product.stock === 0}
                        className="w-full btn-primary text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <ShoppingCart size={14} />
                        {addingId === product.id ? 'Adding...' : 'Add to Cart'}
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
