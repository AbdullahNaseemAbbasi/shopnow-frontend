'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Product, PageResponse } from '@/types';
import ProductCard from '@/components/products/ProductCard';

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
                <ProductCard key={product.id} product={product} />
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
