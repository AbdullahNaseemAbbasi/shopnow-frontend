'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Crown, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/utils';
import type { CustomerSummary } from '@/types';
import toast from 'react-hot-toast';

const VIP_THRESHOLD = 50000;

type Segment = { label: string; badge: string };
function segmentOf(c: CustomerSummary): Segment {
  if (c.totalSpend >= VIP_THRESHOLD) return { label: 'VIP', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (c.orderCount >= 2) return { label: 'Repeat', badge: 'bg-green-50 text-green-700 border-green-200' };
  if (c.orderCount === 1) return { label: 'New', badge: 'bg-brand-50 text-brand-700 border-brand-200' };
  return { label: 'Prospect', badge: 'bg-gray-100 text-gray-500 border-gray-200' };
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const SORTS = [
  { value: 'spend', label: 'Top spenders' },
  { value: 'orders', label: 'Most orders' },
  { value: 'recent', label: 'Newest signups' },
  { value: 'name', label: 'Name A–Z' },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('spend');

  const fetchCustomers = () => {
    setLoading(true);
    api.get<CustomerSummary[]>('/api/admin/customers')
      .then((res) => setCustomers(res.data || []))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      : customers;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'orders': return b.orderCount - a.orderCount;
        case 'recent': return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'spend':
        default: return b.totalSpend - a.totalSpend;
      }
    });
    return sorted;
  }, [customers, query, sortBy]);

  const kpis = useMemo(() => {
    const active = customers.filter((c) => c.orderCount > 0).length;
    const revenue = customers.reduce((s, c) => s + (c.totalSpend || 0), 0);
    const vip = customers.filter((c) => c.totalSpend >= VIP_THRESHOLD).length;
    return { total: customers.length, active, revenue, vip };
  }, [customers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">Your customers, ranked by lifetime value</p>
        </div>
        <button onClick={fetchCustomers} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total customers', value: String(kpis.total), icon: Users, tint: 'bg-slate-100 text-slate-700' },
          { label: 'With orders', value: String(kpis.active), icon: Users, tint: 'bg-green-50 text-green-700' },
          { label: 'Lifetime revenue', value: formatPrice(kpis.revenue), icon: Users, tint: 'bg-brand-50 text-brand' },
          { label: 'VIP customers', value: String(kpis.vip), icon: Crown, tint: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tint}`}><Icon size={18} /></div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3">
          <Search size={16} className="text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…"
            className="flex-1 py-2.5 text-sm outline-none bg-transparent" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-brand cursor-pointer">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : view.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 text-gray-400">No customers found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Segment</th>
                <th className="px-4 py-3 font-bold">Joined</th>
                <th className="px-4 py-3 font-bold text-right">Orders</th>
                <th className="px-4 py-3 font-bold text-right">Total spend</th>
                <th className="px-4 py-3 font-bold text-right">Avg order</th>
                <th className="px-4 py-3 font-bold">Last order</th>
              </tr>
            </thead>
            <tbody>
              {view.map((c) => {
                const seg = segmentOf(c);
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${seg.badge}`}>{seg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(c.registeredAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatPrice(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.orderCount > 0 ? formatPrice(c.avgOrderValue) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(c.lastOrderAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
