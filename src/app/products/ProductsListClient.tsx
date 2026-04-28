'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Star, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { Product, PageResponse } from '@/types';
import toast from 'react-hot-toast';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗', 'Gents Fashion': '👘',
  'Beauty': '✨', 'Home & Living': '🏠', 'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

function ProductItem({
  product, isWished, addingId, onAddToCart, onWishlist,
}: {
  product: Product;
  isWished: boolean;
  addingId: number | null;
  onAddToCart: (e: React.MouseEvent, p: Product) => void;
  onWishlist: (e: React.MouseEvent, id: number) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const disc = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
  const emoji = EMOJIS[product.categoryName] || '🛍️';

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-blue-200">
        <div className="relative w-full bg-slate-50 overflow-hidden" style={{ paddingBottom: '60%' }}>
          <div className="absolute inset-0">
            {(!imgLoaded || imgError) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <span className="text-5xl select-none">{emoji}</span>
              </div>
            )}
            {product.imageUrl && !imgError && (
              <img
                src={product.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </div>
          {disc > 0 && <span className="absolute top-2.5 left-2.5 z-10 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">-{disc}%</span>}
          {product.stock === 0 && <span className="absolute top-2.5 left-2.5 z-10 bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Out of Stock</span>}
          <button onClick={(e) => onWishlist(e, product.id)}
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
            onClick={(e) => onAddToCart(e, product)}
            disabled={addingId === product.id || product.stock === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-gray-200 transition-all duration-200 disabled:opacity-50">
            <ShoppingCart size={14} />
            {addingId === product.id ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}

interface Props {
  initialData: PageResponse<Product> | null;
  initialKeyword: string;
  initialCategoryId: string;
  initialCategoryName: string;
}

export default function ProductsListClient({
  initialData, initialKeyword, initialCategoryId, initialCategoryName,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL is the source of truth; we mirror it in state for input controls.
  const urlKeyword = searchParams.get('keyword') || '';
  const urlCategoryId = searchParams.get('categoryId') || '';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(urlKeyword);
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  const { url, cacheKey } = (() => {
    if (search) {
      return {
        url: `/api/products/search?keyword=${encodeURIComponent(search)}&page=${page}&size=12`,
        cacheKey: `products:search:${search}:p${page}`,
      };
    }
    if (urlCategoryId) {
      return {
        url: `/api/products/category/${urlCategoryId}?page=${page}&size=12`,
        cacheKey: `products:cat:${urlCategoryId}:p${page}`,
      };
    }
    return {
      url: `/api/products?page=${page}&size=12`,
      cacheKey: `products:list:p${page}`,
    };
  })();

  // Use server-fetched data only when filters/page match the SSR'd initial state.
  const ssrMatches =
    page === 0 &&
    search === initialKeyword &&
    urlCategoryId === initialCategoryId;

  const { data: pageData, loading } = useCachedFetch<PageResponse<Product>>(
    cacheKey,
    url,
    ssrMatches && initialData ? { initialData } : {}
  );

  const products = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  // Reset page on URL filter change
  useEffect(() => { setSearch(urlKeyword); setPage(0); }, [urlKeyword]);
  useEffect(() => { setPage(0); }, [urlCategoryId]);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch { toast.error('Please try again'); }
    finally { setAddingId(null); }
  };

  const handleWishlist = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    try {
      await api.post(`/api/wishlist/${id}`);
      setWishlisted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } catch { toast.error('Please try again'); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      router.push(`/products?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/products');
    }
  };

  const pageTitle = search
    ? `Results for "${search}"`
    : initialCategoryName
      ? initialCategoryName
      : 'All Products';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">{pageTitle}</h1>
            {!loading && <p className="text-sm text-gray-500">{totalElements} products found</p>}
          </div>
          <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-blue-500 transition-colors w-full md:w-72">
            <input type="text" placeholder="Search products..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm outline-none" />
            <button type="submit" className="bg-blue-600 px-4 text-white"><Search size={16} /></button>
          </form>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {loading && products.length === 0 ? (
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
            <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-400 mb-6">Try different keywords</p>
            <button onClick={() => { setSearch(''); setPage(0); router.push('/products'); }}
              className="btn-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
              View All Products
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  isWished={wishlisted.includes(product.id)}
                  addingId={addingId}
                  onAddToCart={handleAddToCart}
                  onWishlist={handleWishlist}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600'}`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
