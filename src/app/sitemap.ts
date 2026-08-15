import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/serverFetch";
import { SITE_URL } from "@/lib/site";
import type { PageResponse, Product, Category } from "@/types";

// XML sitemap (doc §30), regenerated hourly. Lists the crawlable storefront: static pages, each
// category filter view, and every active product. Private/account routes are intentionally left out
// (see robots.ts). Served at /sitemap.xml.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsPage, categories] = await Promise.all([
    serverFetch<PageResponse<Product>>("/api/products?page=0&size=1000", { revalidate: 3600 }),
    serverFetch<Category[]>("/api/categories", { revalidate: 3600 }),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/shipping-returns`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/products?categoryId=${c.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = (productsPage?.content ?? []).map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
