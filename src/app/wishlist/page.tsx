'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { WishlistItem } from '@/types';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    api.get('/api/wishlist')
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  const handleRemove = async (productId: number) => {
    try {
      await api.post(`/api/wishlist/${productId}`);
      setItems(prev => prev.filter(item => item.productId !== productId));
      toast.success('Wishlist se hata diya');
    } catch { toast.error('Dobara try karein'); }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.inStock) { toast.error('Out of stock!'); return; }
    setAddingId(item.productId);
    try {
      await addToCart(item.productId, 1);
      toast.success('Cart mein add ho gaya! 🛒');
    } catch { toast.error('Dobara try karein'); }
    finally { setAddingId(null); }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Heart size={24} className="text-red-600 fill-red-600" /> Meri Wishlist
          {items.length > 0 && <span className="text-sm font-normal text-gray-500 ml-1">({items.length} items)</span>}
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-7xl mb-4">❤️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Wishlist khali hai!</h3>
            <p className="text-gray-400 mb-8">Products pe dil ka button dabao wishlist mein add karne ke liye</p>
            <Link href="/products" className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm inline-block">
              Products Dekhein
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <Link href={item.productSlug ? `/products/${item.productSlug}` : '/products'}>
                  <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl">🛍️</span>
                    )}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={item.productSlug ? `/products/${item.productSlug}` : '/products'}>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-red-600 transition-colors mb-2">{item.productName}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-black text-red-600 text-sm">{formatPrice(item.salePrice || item.price)}</span>
                    {item.salePrice && <span className="text-gray-400 line-through text-xs">{formatPrice(item.price)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddToCart(item)} disabled={addingId === item.productId || !item.inStock}
                      className="flex-1 btn-primary text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-60">
                      <ShoppingCart size={13} />
                      {addingId === item.productId ? '...' : 'Add'}
                    </button>
                    <button onClick={() => handleRemove(item.productId)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
