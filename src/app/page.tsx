import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoStrip from "@/components/home/PromoStrip";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <PromoStrip />
      <CategorySection />
      <FeaturedProducts />
    </div>
  );
}
