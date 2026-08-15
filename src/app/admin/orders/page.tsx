'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, RefreshCw, FileText } from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRealtimeEvent } from '@/lib/useRealtime';
import LiveIndicator from '@/components/ui/LiveIndicator';
import { ORDER_STATUS_META, ALLOWED_NEXT } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types';

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  trackingNumber?: string;
  courier?: string;
  internalNote?: string;
}

const FILTERS = ['ALL', ...Object.keys(ORDER_STATUS_META)];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fulfill, setFulfill] = useState({ trackingNumber: '', courier: '', internalNote: '' });
  const [savingFulfill, setSavingFulfill] = useState(false);

  const toggleExpand = (order: AdminOrder) => {
    if (expandedId === order.id) { setExpandedId(null); return; }
    setExpandedId(order.id);
    setFulfill({
      trackingNumber: order.trackingNumber || '',
      courier: order.courier || '',
      internalNote: order.internalNote || '',
    });
  };

  const saveFulfillment = async (orderId: number) => {
    setSavingFulfill(true);
    try {
      await api.patch(`/api/orders/${orderId}/fulfillment`, fulfill);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...fulfill } : o));
      toast.success('Fulfilment details saved');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not save');
    } finally {
      setSavingFulfill(false);
    }
  };

  const fetchOrders = () => {
    setLoading(true);
    api.get('/api/admin/orders')
      .then(res => setOrders(res.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  // Live: a customer placing an order pushes order.created to every admin, and a status change
  // pushes order.updated. Pull the fresh list in on both. The global "new order" toast lives in
  // the admin layout so it fires once regardless of which admin page is open.
  useRealtimeEvent('order.created', () => fetchOrders());
  useRealtimeEvent('order.updated', () => fetchOrders());

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${ORDER_STATUS_META[newStatus as OrderStatus]?.label || newStatus}!`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 text-sm">Manage all orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand'}`}>
            {s === 'ALL' ? `All (${orders.length})` : `${ORDER_STATUS_META[s as OrderStatus]?.label || s}${counts[s] ? ` (${counts[s]})` : ''}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <p className="text-gray-500 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const meta = ORDER_STATUS_META[order.status as OrderStatus] ?? ORDER_STATUS_META.PENDING;
            const StatusIcon = meta.Icon;
            const nextStatuses = ALLOWED_NEXT[order.status as OrderStatus] || [];
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-brand-200 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <button onClick={() => toggleExpand(order)} className="flex items-center gap-1">
                          <span className="font-black text-gray-900 text-sm">{order.orderNumber}</span>
                          <ChevronDown size={13} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                          <StatusIcon size={11} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.createdAt}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-black text-gray-900">{formatPrice(order.totalAmount)}</span>
                      {nextStatuses.length > 0 && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          {nextStatuses.map(ns => (
                            <button key={ns} onClick={() => handleStatusUpdate(order.id, ns)}
                              disabled={updatingId === order.id}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60 ${ns === 'CANCELLED' ? 'bg-danger-light text-danger hover:brightness-95 border border-danger/20' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                              {updatingId === order.id ? '…' : `→ ${ORDER_STATUS_META[ns].label}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">Order ID: #{order.id}</p>
                      <Link href={`/admin/orders/${order.id}/invoice`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
                        <FileText size={13} /> Invoice / Packing slip
                      </Link>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Fulfilment</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={fulfill.courier} onChange={(e) => setFulfill(f => ({ ...f, courier: e.target.value }))}
                        placeholder="Courier (e.g. TCS, Leopards)" aria-label="Courier"
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand bg-white" />
                      <input value={fulfill.trackingNumber} onChange={(e) => setFulfill(f => ({ ...f, trackingNumber: e.target.value }))}
                        placeholder="Tracking number" aria-label="Tracking number"
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand bg-white" />
                    </div>
                    <textarea value={fulfill.internalNote} onChange={(e) => setFulfill(f => ({ ...f, internalNote: e.target.value }))}
                      placeholder="Internal note (not visible to the customer)" rows={2} aria-label="Internal note"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand resize-none bg-white" />
                    <div className="flex justify-end">
                      <button onClick={() => saveFulfillment(order.id)} disabled={savingFulfill}
                        className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-60 transition-colors">
                        {savingFulfill ? 'Saving…' : 'Save fulfilment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
