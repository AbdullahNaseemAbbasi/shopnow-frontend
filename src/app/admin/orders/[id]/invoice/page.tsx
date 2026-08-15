"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import type { Order } from "@/types";
import Invoice from "@/components/orders/Invoice";

export default function AdminInvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isLoggedIn } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"invoice" | "packing">("invoice");

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "ADMIN") return;
    api.get<Order>(`/api/orders/admin/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, isLoggedIn, user]);

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-5">
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand">
          <ArrowLeft size={15} /> Back to orders
        </Link>
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {(["invoice", "packing"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              {m === "packing" ? "Packing slip" : "Invoice"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : !order ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 text-gray-400">Order not found.</div>
      ) : (
        <Invoice order={order} mode={mode} />
      )}
    </div>
  );
}
