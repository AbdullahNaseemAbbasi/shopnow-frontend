import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/serverFetch";
import type { Metadata } from "next";
import type { Product, Review } from "@/types";
import { SITE_URL } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
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
    return { title: "Product not found" };
  }
  const description =
    product.description?.slice(0, 160) ||
    `Shop ${product.name} at ShopNow. Best prices, fast delivery across Pakistan.`;
  const images = product.imageUrl ? [product.imageUrl] : [];
  return {
    // Root layout supplies the "%s — ShopNow" template, so the title is just the product name.
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      images,
    },
    twitter: { card: "summary_large_image", title: product.name, description, images },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await serverFetch<Product>(`/api/products/slug/${slug}`, { revalidate: 60 });
  if (!product) notFound();

  const reviews = await serverFetch<Review[]>(`/api/reviews/product/${product.id}`, { revalidate: 60 }) ?? [];

  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;
  const effectivePrice = product.salePrice ?? product.price;

  // Product rich result: Offer priced in PKR, availability from live stock, plus the review
  // aggregate when the product has ratings — this is what powers price + star snippets in search.
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description?.slice(0, 500) || product.name,
    image: product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
    sku: String(product.id),
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: Number(effectivePrice).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
    ...(product.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.averageRating).toFixed(1),
            reviewCount: product.totalReviews,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.categoryName,
        item: `${SITE_URL}/products?categoryId=${product.categoryId}`,
      },
      { "@type": "ListItem", position: 4, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetailClient initialProduct={product} initialReviews={reviews} />
    </>
  );
}
