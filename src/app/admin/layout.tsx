'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BarChart3, Package, ShoppingBag, Boxes, Tag, Ticket, RotateCcw, Star, Users, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { useRealtimeEvent } from '@/lib/useRealtime';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/admin',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/admin/products',   label: 'Products',    icon: ShoppingBag },
  { href: '/admin/inventory',  label: 'Inventory',   icon: Boxes },
  { href: '/admin/orders',     label: 'Orders',      icon: Package },
  { href: '/admin/reviews',    label: 'Reviews',     icon: Star },
  { href: '/admin/returns',    label: 'Returns',     icon: RotateCcw },
  { href: '/admin/customers',  label: 'Customers',   icon: Users },
  { href: '/admin/categories', label: 'Categories',  icon: Tag },
  { href: '/admin/coupons',    label: 'Coupons',     icon: Ticket },
];

// Defined at module scope, NOT inside AdminLayout. A component declared in a render body is a
// brand-new type on every render, so React unmounts and remounts the whole subtree each time —
// losing focus, restarting transitions, and churning the DOM on every sidebar toggle.
function Sidebar({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string | null;
  user: { firstName?: string; email?: string } | null;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <span className="text-white font-black text-sm">ShopNow</span>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.firstName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.firstName}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-red-400 hover:bg-gray-800 text-sm font-semibold transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    if (user?.role !== 'ADMIN') {
      toast.error('Admin access required!');
      router.push('/');
    }
  }, [isLoggedIn, user, router, mounted]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    router.push('/');
  };

  // Global live alert for admins: fires once on any admin page when a customer places an order.
  // The server only pushes order.created to admin streams, so no role check is needed here.
  useRealtimeEvent('order.created', (data) => {
    const amount = typeof data.totalAmount === 'number' ? ` · ${formatPrice(data.totalAmount)}` : '';
    toast.success(`New order ${data.orderNumber ?? ''}${amount}`, { icon: '🛒', duration: 6000 });
  });

  // Live alert when a customer opens a return/exchange request.
  useRealtimeEvent('return.created', (data) => {
    toast(`New ${String(data.type ?? '').toLowerCase()} request · ${data.orderNumber ?? ''}`, { icon: '↩️', duration: 6000 });
  });

  if (!mounted) return null;
  if (!isLoggedIn || user?.role !== 'ADMIN') return null;

  const sidebar = (
    <Sidebar
      pathname={pathname}
      user={user}
      onNavigate={() => setSidebarOpen(false)}
      onLogout={handleLogout}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 fixed top-0 left-0 h-full z-40">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-gray-900 flex flex-col">
            {sidebar}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <span className="font-black text-gray-900">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)} className={sidebarOpen ? 'p-2' : 'hidden'}>
            <X size={20} />
          </button>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
