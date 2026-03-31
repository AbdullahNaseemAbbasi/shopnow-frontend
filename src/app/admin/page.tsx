'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Users, Package, TrendingUp, Clock, DollarSign, LayoutDashboard, Tag, List, CheckCircle, Truck, XCircle, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/axios';

interface BestSeller {
  productId: number;
  productName: string;
  imageUrl: string;
  price: number;
  stock: number;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  bestSellers: BestSeller[];
  recentOrders: RecentOrder[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-gray-100 text-gray-600',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPED:   'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-gray-200 text-gray-800',
  CANCELLED: 'bg-red-50 text-red-600',
};

export default function AdminPage() {
  const { user, isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    api.get('/api/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, user, router]);

  if (!isLoggedIn || user?.role !== 'ADMIN') return null;

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!stats) return (
    <div className="text-center py-20 text-gray-400">Failed to load stats. Please check the backend.</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.firstName}!</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 font-black px-3 py-1.5 rounded-full border border-blue-200">ADMIN</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-300" />
            <span className="text-gray-300 text-xs font-semibold uppercase tracking-wide">Today&apos;s Orders</span>
          </div>
          <p className="text-3xl font-black">{stats.todayOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-200" />
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Today&apos;s Revenue</span>
          </div>
          <p className="text-3xl font-black">{formatPrice(stats.todayRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: formatPrice(stats.totalRevenue),  icon: DollarSign,  color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Orders',   value: stats.totalOrders,                icon: Package,     color: 'bg-gray-100 text-gray-700' },
          { label: 'Total Users',    value: stats.totalUsers,                 icon: Users,       color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Products', value: stats.totalProducts,              icon: ShoppingBag, color: 'bg-gray-100 text-gray-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" /> Order Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending',   value: stats.pendingOrders,   icon: Clock,         color: 'bg-gray-50 text-gray-700 border-gray-200' },
            { label: 'Confirmed', value: stats.confirmedOrders, icon: CheckCircle,   color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Shipped',   value: stats.shippedOrders,   icon: Truck,         color: 'bg-blue-50 text-blue-800 border-blue-200' },
            { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle,   color: 'bg-gray-100 text-gray-800 border-gray-300' },
            { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle,       color: 'bg-red-50 text-red-600 border-red-200' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`border rounded-xl p-3 text-center ${color}`}>
              <Icon size={18} className="mx-auto mb-1 opacity-70" />
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs font-semibold opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <List size={16} className="text-blue-600" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-blue-600 text-xs font-semibold hover:underline">View All</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{order.orderNumber}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{order.customerName} · {order.customerEmail}</p>
                    <p className="text-xs text-gray-400">{order.createdAt}</p>
                  </div>
                  <span className="font-black text-gray-900 text-sm ml-3 flex-shrink-0">{formatPrice(order.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Star size={16} className="text-blue-600" /> Best Sellers
            </h2>
            <Link href="/admin/products" className="text-blue-600 text-xs font-semibold hover:underline">View All</Link>
          </div>
          {stats.bestSellers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data available yet</p>
          ) : (
            <div className="space-y-3">
              {stats.bestSellers.map((product, i) => (
                <div key={product.productId} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-gray-900 text-white' : i === 1 ? 'bg-gray-600 text-white' : i === 2 ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                    {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs line-clamp-1">{product.productName}</p>
                    <p className="text-xs text-gray-400">{product.stock} units in stock</p>
                  </div>
                  <span className="font-black text-gray-900 text-sm flex-shrink-0">{formatPrice(product.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-black text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/admin/products',   icon: ShoppingBag, label: 'Products',   desc: 'Add, edit, delete' },
            { href: '/admin/orders',     icon: Package,     label: 'Orders',     desc: 'Update status' },
            { href: '/admin/categories', icon: Tag,         label: 'Categories', desc: 'Manage categories' },
            { href: '/admin/coupons',    icon: LayoutDashboard, label: 'Coupons', desc: 'Create discounts' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                <Icon size={22} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
