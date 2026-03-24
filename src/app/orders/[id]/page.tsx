'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, Clock, CheckCircle, Truck, XCircle, MapPin, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import api from '@/lib/axios';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle },
  SHIPPED:   { label: 'Shipped',   color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-blue-100 text-blue-700 border-blue-200',          icon: XCircle },
};

const PAYMENT_CONFIG = {
  UNPAID:   { label: 'Unpaid',   color: 'text-orange-600 bg-orange-50' },
  PAID:     { label: 'Paid',     color: 'text-green-600 bg-green-50' },
  REFUNDED: { label: 'Refunded', color: 'text-blue-600 bg-blue-50' },
};

const STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;
const STEP_LABELS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    api.get(`/api/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => toast_error())
      .finally(() => setLoading(false));
  }, [isLoggedIn, id, router]);

  const toast_error = () => {
    import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to load order'));
  };

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

  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const payment = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.UNPAID;
  const currentStep = STEPS.indexOf(order.status as typeof STEPS[number]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package size={20} className="text-blue-600" />
                <h1 className="text-xl font-black text-gray-900">{order.orderNumber}</h1>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border ${status.color}`}>
                <StatusIcon size={14} /> {status.label}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${payment.color}`}>
                <CreditCard size={11} className="inline mr-1" />{payment.label}
              </span>
            </div>
          </div>

          {order.status !== 'CANCELLED' && (
            <div className="mt-6">
              <div className="flex items-center">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${i <= currentStep ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                        {i < currentStep ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs mt-1 font-medium whitespace-nowrap ${i <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                        {STEP_LABELS[i]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
