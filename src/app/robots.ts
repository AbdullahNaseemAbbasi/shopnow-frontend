import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt (doc §30). Crawlers may index the storefront but not account, checkout or admin
// surfaces (no SEO value, and admin must never be crawled). Points to the XML sitemap. Served at
// /robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/checkout",
        "/cart",
        "/wishlist",
        "/profile",
        "/dashboard",
        "/orders",
        "/returns",
        "/auth",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
