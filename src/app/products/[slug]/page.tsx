import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/serverFetch";
import type { Metadata } from "next";
import type { Product, Review } from "@/types";
import ProductDetailClient from "./ProductDetailClient";

// ISR: page is server-rendered with data, then re-generated every 60s on access.
// First visit per slug = fresh fetch; subsequent visits in the 60s window = cached HTML.
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverFetch<Product>(`/api/products/slug/${slug}`, { revalidate: 60 });
  if (!product) {
    return { title: "Product not found — ShopNow" };
  }
  return {
    title: `${product.name} — ShopNow`,
    description: product.description?.slice(0, 160) || `Shop ${product.name} at ShopNow. Best prices, fast delivery across Pakistan.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await serverFetch<Product>(`/api/products/slug/${slug}`, { revalidate: 60 });
  if (!product) notFound();

  const reviews = await serverFetch<Review[]>(`/api/reviews/product/${product.id}`, { revalidate: 60 }) ?? [];

  return <ProductDetailClient initialProduct={product} initialReviews={reviews} />;
}
