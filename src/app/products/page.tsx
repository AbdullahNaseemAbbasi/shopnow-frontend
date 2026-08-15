import { Suspense } from "react";
import { serverFetch } from "@/lib/serverFetch";
import type { PageResponse, Product } from "@/types";
import ProductsListClient from "./ProductsListClient";

// ISR: re-render every 2 minutes per unique URL.
export const revalidate = 120;

interface PageProps {
  searchParams: Promise<{ keyword?: string; categoryId?: string; categoryName?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyword = params.keyword || "";
  const categoryId = params.categoryId || "";
  const categoryName = params.categoryName || "";

  // Mirror the client's default filter query (no facets, newest-first) so the SSR'd first page
  // hydrates cleanly. The client swaps to a live request the moment any facet/sort is applied.
  const query = new URLSearchParams({ page: "0", size: "12", sort: "newest" });
  if (keyword) query.set("keyword", keyword);
  if (categoryId) query.set("categoryId", categoryId);
  const url = `/api/products/filter?${query.toString()}`;

  const initialData = await serverFetch<PageResponse<Product>>(url, { revalidate: 120 });

  return (
    <Suspense fallback={null}>
      <ProductsListClient
        initialData={initialData}
        initialKeyword={keyword}
        initialCategoryId={categoryId}
        initialCategoryName={categoryName}
      />
    </Suspense>
  );
}
