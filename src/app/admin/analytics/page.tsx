"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, Minus, Activity,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/orderStatus";
import type { OrderStatus } from "@/types";
import { useRealtimeEvent, useRealtimeStatus } from "@/lib/useRealtime";
import api from "@/lib/axios";
import TrendChart, { type TrendPoint } from "@/components/admin/TrendChart";

interface CategorySlice { category: string; revenue: number; orders: number; }
interface StatusCount { status: OrderStatus; count: number; }

interface Analytics {
  days: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  newCustomers: number;
  revenuePrev: number;
  ordersPrev: number;
  revenueGrowthPct: number;
  ordersGrowthPct: number;
  timeSeries: TrendPoint[];
  revenueByCategory: CategorySlice[];
  statusBreakdown: StatusCount[];
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const BRAND = "#E40046";
const SLATE = "#334155";

// Growth pill — green up / red down / muted flat.
function Delta({ pct }: { pct: number }) {
  const flat = Math.abs(pct) < 0.05;
  const up = pct > 0;
  const cls = flat ? "bg-gray-100 text-gray-500" : up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={12} />
      {flat ? "0%" : `${up ? "+" : ""}${pct}%`}
    </span>
  );
}

export default function AnalyticsPage() {
  const { user, isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const live = useRealtimeStatus();

  // Keep the latest range in a ref so the debounced live-refetch always uses the current window
  // without re-subscribing the SSE handlers on every range change.
  const daysRef = useRef(days);
  daysRef.current = days;

  const load = useCallback((d: number, silent = false) => {
    if (!silent) setLoading(true);
    api
      .get("/api/admin/analytics", { params: { days: d } })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    load(days);
  }, [isLoggedIn, user, router, days, load]);

  // Live refresh: when an order is created or advances, silently re-pull the current window.
  // Debounced so a burst of events collapses into a single refetch.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => load(daysRef.current, true), 800);
  }, [load]);
  useRealtimeEvent("order.created", scheduleRefetch);
  useRealtimeEvent("order.updated", scheduleRefetch);
  useEffect(() => () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); }, []);

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  if (loading && !data) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-gray-400">Failed to load analytics. Please check the backend.</div>
  );

  const kpis = [
    { label: "Revenue", value: formatPrice(data.revenue), delta: data.revenueGrowthPct, icon: DollarSign, tint: "bg-brand-50 text-brand" },
    { label: "Orders", value: String(data.orders), delta: data.ordersGrowthPct, icon: Package, tint: "bg-slate-100 text-slate-700" },
    { label: "Avg Order Value", value: formatPrice(data.avgOrderValue), delta: null, icon: ShoppingCart, tint: "bg-brand-50 text-brand" },
    { label: "New Customers", value: String(data.newCustomers), delta: null, icon: Users, tint: "bg-slate-100 text-slate-700" },
  ];

  const maxCat = Math.max(1, ...data.revenueByCategory.map((c) => c.revenue));
  const maxStatus = Math.max(1, ...data.statusBreakdown.map((s) => s.count));
  const hasActivity = data.orders > 0 || data.revenueByCategory.length > 0;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Analytics
            {live && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Sales performance over the last {data.days} days</p>
        </div>
        <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                days === r.days ? "bg-brand text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, delta, icon: Icon, tint }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                <Icon size={20} />
              </div>
              {delta !== null && <Delta pct={delta} />}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* trend chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Activity size={18} className="text-brand" /> {metric === "revenue" ? "Revenue" : "Orders"} trend
          </h2>
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            {(["revenue", "orders"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  metric === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {hasActivity ? (
          <TrendChart
            points={data.timeSeries}
            metric={metric}
            color={metric === "revenue" ? BRAND : SLATE}
            formatCurrency={formatPrice}
          />
        ) : (
          <p className="text-gray-400 text-sm text-center py-16">No orders in this period yet.</p>
        )}
      </div>

      {/* category + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-black text-gray-900 mb-4">Revenue by category</h2>
          {data.revenueByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales in this period.</p>
          ) : (
            <div className="space-y-3">
              {data.revenueByCategory.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 truncate">{c.category}</span>
                    <span className="font-black text-gray-900 flex-shrink-0 ml-2">{formatPrice(c.revenue)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(c.revenue / maxCat) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.orders} order{c.orders === 1 ? "" : "s"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-black text-gray-900 mb-4">Order status distribution</h2>
          {data.statusBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders in this period.</p>
          ) : (
            <div className="space-y-3">
              {data.statusBreakdown.map((s) => {
                const meta = ORDER_STATUS_META[s.status];
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700">{meta?.label ?? s.status}</span>
                      <span className="font-black text-gray-900">{s.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${meta?.dot ?? "bg-gray-400"}`} style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
