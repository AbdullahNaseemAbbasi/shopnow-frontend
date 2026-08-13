'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Heart, MapPin, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Order, WishlistItem } from '@/types';
import api from '@/lib/axios';
import { ORDER_STATUS_META } from '@/lib/orderStatus';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    // allSettled, not all: with Promise.all a single failing endpoint both rejects (an
    // unhandled rejection, since there is no .catch) and leaves the other list unset. Settling
    // each independently lets orders load even if wishlist 500s, and vice versa.
    Promise.allSettled([
      api.get('/api/orders'),
      api.get('/api/wishlist'),
    ]).then(([ordersRes, wishlistRes]) => {
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (wishlistRes.status === 'fulfilled') setWishlist(wishlistRes.value.data || []);
    }).finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const totalSpent = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
  const recentOrders = orders.slice(0, 3);

  const stats = [
    { label: 'Total Orders',  value: orders.length,    icon: Package,    color: 'bg-blue-50 text-blue-600',   href: '/orders' },
    { label: 'Total Spent',   value: formatPrice(totalSpent), icon: ShoppingBag, color: 'bg-green-50 text-green-600', href: '/orders' },
    { label: 'Wishlist Items', value: wishlist.length,  icon: Heart,      color: 'bg-blue-50 text-blue-600',   href: '/wishlist' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black">Welcome back, {user?.firstName}!</h1>
              <p className="text-red-100 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
          ) : (
            stats.map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} href={href} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </Link>
            ))
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { href: '/products',  label: 'Shop Now',     icon: ShoppingBag, bg: 'bg-blue-600 text-white' },
            { href: '/orders',    label: 'My Orders',    icon: Package,     bg: 'bg-white border border-gray-100' },
            { href: '/wishlist',  label: 'Wishlist',     icon: Heart,       bg: 'bg-white border border-gray-100' },
            { href: '/profile',   label: 'My Addresses', icon: MapPin,      bg: 'bg-white border border-gray-100' },
          ].map(({ href, label, icon: Icon, bg }) => (
            <Link key={href} href={href}
              className={`${bg} rounded-2xl p-4 flex flex-col items-center text-center gap-2 shadow-sm hover:shadow-md transition-shadow`}>
              <Icon size={22} className={bg.includes('blue-600') ? 'text-white' : 'text-blue-600'} />
              <span className={`text-xs font-bold ${bg.includes('blue-600') ? 'text-white' : 'text-gray-700'}`}>{label}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-blue-600" /> Recent Orders
            </h2>
            <Link href="/orders" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link href="/products" className="btn-primary text-white px-5 py-2 rounded-xl text-sm font-bold inline-block mt-3">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => {
                const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.PENDING;
                const StatusIcon = meta.Icon;
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Package size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{order.totalItems} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${meta.badge}`}>
                        <StatusIcon size={10} /> {meta.label}
                      </span>
                      <span className="font-black text-blue-600 text-sm">{formatPrice(order.totalAmount)}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
