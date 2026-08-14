'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, MapPin, CreditCard, Ban } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRealtimeEvent } from '@/lib/useRealtime';
import LiveIndicator from '@/components/ui/LiveIndicator';
import ReturnSection from '@/components/orders/ReturnSection';
import {
  ORDER_STATUS_META, FULFILLMENT_STEPS, CUSTOMER_CANCELLABLE, isTerminalNonDelivered,
} from '@/lib/orderStatus';

const PAYMENT_CONFIG = {
  UNPAID:   { label: 'Unpaid',   color: 'text-orange-600 bg-orange-50' },
  PAID:     { label: 'Paid',     color: 'text-green-600 bg-green-50' },
  REFUNDED: { label: 'Refunded', color: 'text-green-700 bg-green-50' },
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order || !confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const res = await api.post(`/api/orders/${order.id}/cancel`);
      setOrder(res.data);
      toast.success('Order cancelled');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const fetchOrder = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return api.get(`/api/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => { if (!silent) toast.error('Failed to load order'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchOrder();
  }, [isLoggedIn, router, fetchOrder]);

  // Live: when an admin advances this order's status, the backend pushes order.updated over SSE.
  // Silently refetch so the timeline and badge move without a page reload, and toast the change.
  useRealtimeEvent('order.updated', (data) => {
    if (Number(data.orderId) !== Number(id)) return;
    fetchOrder(true);
    toast.success(`Order status: ${String(data.status ?? '').toLowerCase()}`, { icon: '📦' });
  });

  if (!isLoggedIn) return null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Order not found</h3>
        <Link href="/orders" className="btn-primary text-white px-6 py-3 rounded-xl font-bold text-sm inline-block mt-4">
          View Orders
        </Link>
      </div>
    </div>
  );

  const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.PENDING;
  const StatusIcon = meta.Icon;
  const payment = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.UNPAID;
  const terminal = isTerminalNonDelivered(order.status);
  const currentStep = FULFILLMENT_STEPS.indexOf(order.status);
  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
  const history = order.statusHistory ?? [];
  const reachedAt = new Map(history.map(h => [h.status, h.createdAt]));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-brand mb-6 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package size={20} className="text-brand" />
                <h1 className="text-xl font-black text-gray-900">{order.orderNumber}</h1>
                <LiveIndicator className="ml-1" />
              </div>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border ${meta.badge}`}>
                <StatusIcon size={14} /> {meta.label}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${payment.color}`}>
                <CreditCard size={11} className="inline mr-1" />{payment.label}
              </span>
            </div>
          </div>

          {terminal ? (
            <div className={`mt-6 flex items-center gap-3 rounded-xl border p-4 ${meta.badge}`}>
              <StatusIcon size={20} />
              <div>
                <p className="font-bold text-sm">This order was {meta.label.toLowerCase()}.</p>
                {reachedAt.get(order.status) && (
                  <p className="text-xs opacity-80">{fmtDateTime(reachedAt.get(order.status)!)}</p>
                )}
              </div>
            </div>
          ) : (
            <ol className="mt-6 ml-2 border-l-2 border-gray-100">
              {FULFILLMENT_STEPS.map((s, i) => {
                const m = ORDER_STATUS_META[s];
                const reached = i <= currentStep;
                const isCurrent = i === currentStep;
                const ts = reachedAt.get(s);
                return (
                  <li key={s} className="relative pl-6 pb-5 last:pb-0">
                    <span className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full ring-4 ring-white ${reached ? m.dot : 'bg-gray-200'}`} />
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-brand' : reached ? 'text-ink' : 'text-gray-400'}`}>
                      {m.label}{isCurrent && ' • current'}
                    </p>
                    {ts && <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(ts)}</p>}
                  </li>
                );
              })}
            </ol>
          )}

          {canCancel && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <button onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-2 text-sm font-semibold text-danger border border-danger/30 hover:bg-danger-light px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                <Ban size={15} /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="font-black text-gray-900 mb-4">Status History</h2>
            <ol className="ml-2 border-l-2 border-gray-100">
              {history.map((h, i) => {
                const m = ORDER_STATUS_META[h.status] ?? ORDER_STATUS_META.PENDING;
                return (
                  <li key={i} className="relative pl-6 pb-4 last:pb-0">
                    <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${m.dot}`} />
                    <p className="text-sm font-semibold text-ink">{m.label}</p>
                    {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                    <p className="text-xs text-gray-400">{fmtDateTime(h.createdAt)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="font-black text-gray-900 mb-4">Order Items ({order.totalItems})</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📦
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-400">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                </div>
                <span className="font-black text-gray-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <ReturnSection orderId={order.id} orderStatus={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600 font-semibold">{order.totalAmount >= 2000 ? 'Free' : formatPrice(200)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(order.totalAmount + (order.totalAmount < 2000 ? 200 : 0))}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" /> Shipping Address
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{order.shippingAddress}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/orders" className="text-blue-600 font-semibold text-sm hover:underline">
            ← View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
