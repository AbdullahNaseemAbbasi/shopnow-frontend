import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoStrip from "@/components/home/PromoStrip";
import { serverFetch } from "@/lib/serverFetch";
import type { Category, Product } from "@/types";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    serverFetch<Category[]>("/api/categories", { revalidate: 300 }),
    serverFetch<Product[]>("/api/products/featured", { revalidate: 120 }),
  ]);

  return ( 
    <div className="min-h-screen">  
      <HeroBanner initialData={categories ?? undefined} />
      <PromoStrip />
      <CategorySection initialData={categories ?? undefined} />
      <FeaturedProducts initialData={featured ?? undefined} />
    </div>
  );
}
