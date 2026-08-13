'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import api from '@/lib/axios';
import { ORDER_STATUS_META, FULFILLMENT_STEPS, isTerminalNonDelivered } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    api.get('/api/orders')
      .then(res => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Package size={24} className="text-blue-600" /> My Orders
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
                <div className="skeleton h-4 w-1/3 mb-3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-7xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-8">Start shopping now!</p>
            <Link href="/products" className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.PENDING;
              const StatusIcon = meta.Icon;
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-gray-900">{order.orderNumber}</h3>
                          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                            <StatusIcon size={12} /> {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-blue-600">{formatPrice(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400">{order.totalItems} item{order.totalItems > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 flex items-start gap-1">
                        <Package size={12} className="mt-0.5 flex-shrink-0" />
                        {order.shippingAddress}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {order.items.slice(0, 2).map(item => (
                          <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                            {item.productName} ×{item.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                            +{order.items.length - 2} more
                          </span>
                        )}
                      </div>
                      <Link href={`/orders/${order.id}`} className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {!isTerminalNonDelivered(order.status) && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-1">
                        {FULFILLMENT_STEPS.map((s, i) => {
                          const currentIdx = FULFILLMENT_STEPS.indexOf(order.status);
                          const active = i <= currentIdx;
                          return (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-brand' : 'bg-gray-200'}`} />
                              {i < FULFILLMENT_STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-brand' : 'bg-gray-200'}`} />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Placed</span>
                        <span className="text-xs text-gray-400">Delivered</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
