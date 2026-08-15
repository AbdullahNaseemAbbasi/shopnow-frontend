// Canonical public origin + identity for SEO (sitemap, robots, canonical URLs, structured data).
// Override with NEXT_PUBLIC_SITE_URL in production; defaults to the local dev origin so links
// resolve while running the store locally.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "ShopNow";
export const SITE_DESCRIPTION =
  "Shop the latest electronics, fashion, home appliances and more at the best prices. Fast delivery all over Pakistan — cash on delivery, easy returns.";
