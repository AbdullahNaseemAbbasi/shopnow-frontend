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

  let url: string;
  if (keyword) {
    url = `/api/products/search?keyword=${encodeURIComponent(keyword)}&page=0&size=12`;
  } else if (categoryId) {
    url = `/api/products/category/${categoryId}?page=0&size=12`;
  } else {
    url = `/api/products?page=0&size=12`;
  }

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
