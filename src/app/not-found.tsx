import Link from "next/link";
import { Home, ShoppingBag } from "lucide-react";

// Custom branded 404 (doc §30). Replaces Next's bare default; keeps the user inside the store with
// clear ways back. Rendered inside the normal layout (navbar/footer stay).
export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <p className="text-8xl sm:text-9xl font-black text-brand tracking-tight leading-none">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl font-black text-ink">Page not found</h1>
      <p className="mt-2 text-ink-muted max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand text-white font-bold px-5 py-2.5 rounded-full hover:bg-brand-700 transition-colors shadow-brand"
        >
          <Home size={18} /> Back to home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-white border border-line text-ink font-bold px-5 py-2.5 rounded-full hover:border-brand-300 hover:text-brand transition-colors"
        >
          <ShoppingBag size={18} /> Browse products
        </Link>
      </div>
    </div>
  );
}
