'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Star, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { Product, PageResponse } from '@/types';
import toast from 'react-hot-toast';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗', 'Gents Fashion': '👘',
  'Beauty': '✨', 'Home & Living': '🏠', 'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const categoryName = searchParams.get('categoryName') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState(keyword);
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;
      if (search) {
        url = `/api/products/search?keyword=${encodeURIComponent(search)}&page=${page}&size=12`;
      } else if (categoryId) {
        url = `/api/products/category/${categoryId}?page=${page}&size=12`;
      } else {
        url = `/api/products?page=${page}&size=12`;
      }
      const res = await api.get(url);
      const data: PageResponse<Product> = res.data;
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, categoryId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setSearch(keyword); setPage(0); }, [keyword]);
  useEffect(() => { setPage(0); }, [categoryId]);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Pehle login karein!'); return; }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success('Cart mein add ho gaya!');
    } catch { toast.error('Dobara try karein'); }
    finally { setAddingId(null); }
  };

  const handleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Pehle login karein!'); return; }
    try {
      await api.post(`/api/wishlist/${id}`);
      setWishlisted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } catch { toast.error('Dobara try karein'); }
  };

  const pageTitle = search
    ? `"${search}" ke results`
    : categoryName
      ? `${categoryName}`
      : 'Saare Products';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">{pageTitle}</h1>
            {!loading && <p className="text-sm text-gray-500">{totalElements} products mile</p>}
          </div>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-red-500 transition-colors w-full md:w-72">
            <input type="text" placeholder="Search karein..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="flex-1 px-4 py-2.5 text-sm outline-none" />
            <button className="bg-red-600 px-4 text-white"><Search size={16} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Koi product nahi mila</h3>
            <p className="text-gray-400 mb-6">Alag keywords try karein</p>
            <button onClick={() => { setSearch(''); setPage(0); }}
              className="btn-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
              Saare Products Dekhein
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => {
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
                          <span className="text-5xl group-hover:scale-110 transition-transform duration-500 select-none">{emoji}</span>
                        )}
                        {disc > 0 && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
                        {product.stock === 0 && <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-black px-2 py-0.5 rounded-full">Out of Stock</span>}
                        <button onClick={(e) => handleWishlist(e, product.id)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 ${isWished ? 'bg-red-600 text-white' : 'bg-white text-gray-400'}`}>
                          <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={(e) => handleAddToCart(e, product)} disabled={addingId === product.id || product.stock === 0}
                          className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1 translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:opacity-60">
                          <ShoppingCart size={14} /> {addingId === product.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-xs text-gray-400 mb-1">{product.categoryName}</p>
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1 mb-2">{product.name}</h3>
                        {product.totalReviews > 0 && (
                          <div className="flex items-center gap-1 mb-1.5">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold">{product.averageRating}</span>
                            <span className="text-xs text-gray-400">({product.totalReviews})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-black text-red-600 text-sm">{formatPrice(product.salePrice || product.price)}</span>
                          {product.salePrice && <span className="text-gray-400 line-through text-xs">{formatPrice(product.price)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-red-500 hover:text-red-600 transition-colors">
                  Pehle
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${page === pageNum ? 'bg-red-600 text-white' : 'border-2 border-gray-200 hover:border-red-500 hover:text-red-600'}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-red-500 hover:text-red-600 transition-colors">
                  Agla
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
