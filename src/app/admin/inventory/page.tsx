'use client';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, PackageX, RefreshCw, Boxes } from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import ProductImage from '@/components/ui/ProductImage';
import toast from 'react-hot-toast';

const THRESHOLDS = [5, 10, 20];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(5);
  const [values, setValues] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchLowStock = (t = threshold) => {
    setLoading(true);
    api.get<Product[]>('/api/products/low-stock', { params: { threshold: t } })
      .then((res) => { setItems(res.data || []); setValues({}); })
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLowStock(threshold); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [threshold]);

  const kpis = useMemo(() => ({
    out: items.filter((p) => p.stock === 0).length,
    low: items.filter((p) => p.stock > 0).length,
  }), [items]);

  const restock = async (p: Product) => {
    const raw = values[p.id] ?? String(p.stock);
    const qty = parseInt(raw, 10);
    if (isNaN(qty) || qty < 0) { toast.error('Enter a valid quantity'); return; }
    setSavingId(p.id);
    try {
      await api.patch(`/api/products/${p.id}/stock?quantity=${qty}`);
      toast.success(`${p.name} stock set to ${qty}`);
      fetchLowStock(threshold); // item drops off once it's back above the threshold
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Boxes size={22} className="text-brand" /> Inventory
          </h1>
          <p className="text-gray-500 text-sm">Products running low — restock before they sell out</p>
        </div>
        <button onClick={() => fetchLowStock(threshold)} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><PackageX size={18} /></div>
          <div><p className="text-xl font-black text-gray-900">{kpis.out}</p><p className="text-xs text-gray-500">Out of stock</p></div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle size={18} /></div>
          <div><p className="text-xl font-black text-gray-900">{kpis.low}</p><p className="text-xs text-gray-500">Low stock</p></div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Threshold ≤</span>
          <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1">
            {THRESHOLDS.map((t) => (
              <button key={t} onClick={() => setThreshold(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${threshold === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Boxes size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">All good — no products at or below {threshold} in stock.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const out = p.stock === 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 flex-wrap">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                  <ProductImage src={p.imageUrl} alt={p.name} sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.categoryName} · {formatPrice(p.salePrice || p.price)}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${out ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {out ? 'Out of stock' : `${p.stock} left`}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number" min={0} inputMode="numeric"
                    value={values[p.id] ?? String(p.stock)}
                    onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    aria-label={`Set stock for ${p.name}`}
                    className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand"
                  />
                  <button onClick={() => restock(p)} disabled={savingId === p.id}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    {savingId === p.id ? '…' : 'Update'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
