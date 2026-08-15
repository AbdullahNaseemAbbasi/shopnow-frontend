"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import type { Order } from "@/types";
import Invoice from "@/components/orders/Invoice";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isLoggedIn } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    api.get<Order>(`/api/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="no-print mb-4">
          <Link href={`/orders/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand">
            <ArrowLeft size={15} /> Back to order
          </Link>
        </div>

        {loading ? (
          <div className="skeleton h-96 rounded-2xl" />
        ) : !order ? (
          <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 text-gray-400">Order not found.</div>
        ) : (
          <Invoice order={order} />
        )}
      </div>
    </div>
  );
}
