'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Product, PageResponse, Category } from '@/types';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters, { type FilterState } from '@/components/products/ProductFilters';

interface Props {
  initialData: PageResponse<Product> | null;
  initialKeyword: string;
  initialCategoryId: string;
  initialCategoryName: string;
}

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A–Z' },
];

const EMPTY_FILTERS: FilterState = { minPrice: '', maxPrice: '', minRating: null, inStock: false };

export default function ProductsListClient({
  initialData, initialKeyword, initialCategoryId, initialCategoryName,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL is the source of truth for keyword + category (shareable, set by navbar links).
  const urlKeyword = searchParams.get('keyword') || '';
  const urlCategoryId = searchParams.get('categoryId') || '';
  const urlCategoryName = searchParams.get('categoryName') || initialCategoryName;

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState(urlKeyword);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  // Price inputs are debounced into `applied` so typing does not fire a request per keystroke.
  const [appliedPrice, setAppliedPrice] = useState({ min: '', max: '' });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: categoriesData } = useCachedFetch<Category[]>('categories', '/api/categories');
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const { data: priceRange } = useCachedFetch<{ minPrice: number; maxPrice: number }>(
    'products:price-range', '/api/products/price-range'
  );
  const bounds = priceRange ? { min: Number(priceRange.minPrice), max: Number(priceRange.maxPrice) } : null;

  // Debounce price inputs → applied.
  useEffect(() => {
    const t = setTimeout(() => setAppliedPrice({ min: filters.minPrice, max: filters.maxPrice }), 450);
    return () => clearTimeout(t);
  }, [filters.minPrice, filters.maxPrice]);

  // Any facet / sort / keyword / category change returns to the first page.
  useEffect(() => {
    setPage(0);
  }, [urlKeyword, urlCategoryId, sort, appliedPrice.min, appliedPrice.max, filters.minRating, filters.inStock]);

  // Reset transient filter state when the URL keyword/category changes (e.g. navbar navigation).
  useEffect(() => {
    setSearchInput(urlKeyword);
    setFilters(EMPTY_FILTERS);
    setAppliedPrice({ min: '', max: '' });
    setSort('newest');
  }, [urlKeyword, urlCategoryId]);

  const query = new URLSearchParams({ page: String(page), size: '12', sort });
  if (urlKeyword) query.set('keyword', urlKeyword);
  if (urlCategoryId) query.set('categoryId', urlCategoryId);
  if (appliedPrice.min) query.set('minPrice', appliedPrice.min);
  if (appliedPrice.max) query.set('maxPrice', appliedPrice.max);
  if (filters.minRating) query.set('minRating', String(filters.minRating));
  if (filters.inStock) query.set('inStock', 'true');

  const qs = query.toString();
  const url = `/api/products/filter?${qs}`;
  const cacheKey = `products:filter:${qs}`;

  // Reuse the server-rendered first page only when nothing has been narrowed beyond the SSR'd URL.
  const ssrMatches =
    page === 0 && sort === 'newest' &&
    !appliedPrice.min && !appliedPrice.max && filters.minRating === null && !filters.inStock &&
    urlKeyword === initialKeyword && urlCategoryId === initialCategoryId;

  const { data: pageData, loading } = useCachedFetch<PageResponse<Product>>(
    cacheKey, url, ssrMatches && initialData ? { initialData } : {}
  );

  const products = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    router.push(trimmed ? `/products?keyword=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleCategory = (id: string) => {
    setShowMobileFilters(false);
    if (!id) { router.push('/products'); return; }
    const name = categories.find((c) => String(c.id) === id)?.name || '';
    router.push(`/products?categoryId=${id}&categoryName=${encodeURIComponent(name)}`);
  };

  const patchFilters = (patch: Partial<FilterState>) => setFilters((f) => ({ ...f, ...patch }));

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedPrice({ min: '', max: '' });
    setSort('newest');
    setShowMobileFilters(false);
    router.push('/products');
  };

  const hasActiveFilters =
    !!urlKeyword || !!urlCategoryId || !!appliedPrice.min || !!appliedPrice.max ||
    filters.minRating !== null || filters.inStock;

  const pageTitle = urlKeyword
    ? `Results for "${urlKeyword}"`
    : urlCategoryName || 'All Products';

  const filtersPanel = (
    <ProductFilters
      categories={categories}
      activeCategoryId={urlCategoryId}
      onCategory={handleCategory}
      filters={filters}
      onChange={patchFilters}
      bounds={bounds}
      onClear={clearAll}
      hasActiveFilters={hasActiveFilters}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">{pageTitle}</h1>
            {!loading && <p className="text-sm text-gray-500">{totalElements} products found</p>}
          </div>
          <form onSubmit={handleSearchSubmit} className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-brand transition-colors w-full md:w-72">
            <input type="text" placeholder="Search products..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm outline-none" />
            <button type="submit" className="bg-brand px-4 text-white"><Search size={16} /></button>
          </form>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {filtersPanel}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <button
              onClick={() => setShowMobileFilters((s) => !s)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"
            >
              <SlidersHorizontal size={15} /> Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="sort" className="text-sm text-gray-500 hidden sm:block">Sort by</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-brand cursor-pointer"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showMobileFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative">
              <button onClick={() => setShowMobileFilters(false)} aria-label="Close filters" className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
              {filtersPanel}
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <p className="text-gray-400 mb-6">Try adjusting your filters or search</p>
              <button onClick={clearAll}
                className="btn-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, i) => (
                  // First row (up to 4 cols) is above the fold — eager-load for a faster LCP.
                  <ProductCard key={product.id} product={product} priority={i < 4} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-brand hover:text-brand transition-colors">
                    Previous
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                    return (
                      <button key={pageNum} onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${page === pageNum ? 'bg-brand text-white' : 'border-2 border-gray-200 hover:border-brand hover:text-brand'}`}>
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-brand hover:text-brand transition-colors">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
