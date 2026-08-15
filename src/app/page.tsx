import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ProductRail from "@/components/home/ProductRail";
import PromoStrip from "@/components/home/PromoStrip";
import { serverFetch } from "@/lib/serverFetch";
import type { Category, Product } from "@/types";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, newArrivals, bestSellers] = await Promise.all([
    serverFetch<Category[]>("/api/categories", { revalidate: 300 }),
    serverFetch<Product[]>("/api/products/featured", { revalidate: 120 }),
    serverFetch<Product[]>("/api/products/new-arrivals?limit=8", { revalidate: 120 }),
    serverFetch<Product[]>("/api/products/best-sellers?limit=8", { revalidate: 120 }),
  ]);

  return (
    <div className="min-h-screen">
      <HeroBanner initialData={categories ?? undefined} />
      <PromoStrip />
      <CategorySection initialData={categories ?? undefined} />
      <FeaturedProducts initialData={featured ?? undefined} />
      <ProductRail
        title="New Arrivals"
        eyebrow="Just In"
        icon="sparkles"
        cacheKey="products:new-arrivals"
        url="/api/products/new-arrivals?limit=8"
        initialData={newArrivals ?? undefined}
        viewAllHref="/products"
        altBg
      />
      <ProductRail
        title="Best Sellers"
        eyebrow="Trending Now"
        icon="flame"
        cacheKey="products:best-sellers"
        url="/api/products/best-sellers?limit=8"
        initialData={bestSellers ?? undefined}
        viewAllHref="/products"
      />
    </div>
  );
}
