'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart, User, Menu, X, ChevronDown, LogOut, Package, LayoutDashboard, UserCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { Category } from '@/types';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();

  const isAdmin = user?.role === 'ADMIN';
  const { data: categoriesData } = useCachedFetch<Category[]>(
    isAdmin ? null : 'categories',
    isAdmin ? null : '/api/categories'
  );
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !isAdmin) fetchCart();
  }, [isLoggedIn, isAdmin, fetchCart]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    setMobileOpen(false);
    toast.success('Logged out successfully!');
    router.push('/');
  };

  const count = itemCount();

  return (
    <>
      {!isAdmin && (
        <div className="bg-gray-900 text-white text-xs py-2 hidden md:block">
          <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
            <span>Free delivery on orders above Rs. 2,000</span>
            <div className="flex gap-4"> 
              <Link href="/orders" className="hover:text-blue-400 transition-colors">Track Order</Link>
            </div>
          </div>
        </div>
      )}

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white shadow-sm'}`}>
        <div className="max-w-[1600px] mx-auto px-8"> 
          <div className="flex items-center justify-between h-16 gap-4"> 

            <Link href={isAdmin ? '/admin' : '/'} className="flex items-center gap-1 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-xl font-black text-gray-900">Shop<span className="text-blue-600">Now</span></span>
            </Link>

            {!isAdmin && (  
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
                <div className="flex w-full rounded-xl overflow-hidden border-2 border-blue-600 focus-within:shadow-lg transition-shadow"> 
                  <input
                    type="text" 
                    placeholder="Search products, brands, categories..." 
                    className="flex-1 px-4 py-2.5 text-sm outline-none"
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                  /> 
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-5 text-white transition-colors"> 
                    <Search size={18} /> 
                  </button>
                </div>
              </form>
            )}

            {isAdmin && ( 
              <div className="hidden md:flex items-center gap-3 ml-auto">
                <Link href="/admin" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                  <LayoutDashboard size={16} /> Admin Panel
                </Link>
                <div className="relative">  
                  <button onClick={() => setAccountOpen(!accountOpen)}
                    className="flex items-center gap-2 p-2 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.[0]} 
                    </div> 
                    <ChevronDown size={14} className="text-gray-400" />  
                  </button>
                  {accountOpen && ( 
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm">{user?.firstName}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                      </div>
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 w-full text-left">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/wishlist" className="flex flex-col items-center p-2 hover:text-blue-600 transition-colors group">
                  <Heart size={22} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs mt-0.5">Wishlist</span>
                </Link>

                <div className="relative">
                  <button onClick={() => setAccountOpen(!accountOpen)}
                    className="flex flex-col items-center p-2 hover:text-blue-600 transition-colors group">
                    <User size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs mt-0.5">{isLoggedIn ? user?.firstName : 'Account'}</span>
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      {isLoggedIn ? (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="font-semibold text-sm">{user?.firstName}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                          </div>
                          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                            <UserCircle size={15} /> My Dashboard
                          </Link>
                          <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                            <Package size={15} /> My Orders
                          </Link>
                          <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                            <Heart size={15} /> Wishlist
                          </Link>
                          <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                            <MapPin size={15} /> My Addresses
                          </Link>
                          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 w-full text-left">
                            <LogOut size={15} /> Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600 font-medium" onClick={() => setAccountOpen(false)}>
                            Login
                          </Link>
                          <Link href="/auth/register" className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-blue-600" onClick={() => setAccountOpen(false)}>
                            Create Account
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Link href="/cart" className="flex flex-col items-center p-2 hover:text-blue-600 transition-colors group relative">
                  <div className="relative">
                    <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce-in">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-0.5">Cart</span>
                </Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="flex md:hidden p-2 hover:text-blue-600">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {!isAdmin && (
            <div className="hidden md:flex items-center py-2 border-t border-gray-100 text-sm relative">
              <div className="relative flex-shrink-0 pr-6 border-r border-gray-200 mr-6">
                <button
                  onClick={() => setCategoriesOpen(o => !o)}
                  className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  <Menu size={16} /> All Categories
                  <ChevronDown size={14} className={`transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                    <Link
                      href="/products"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      <Menu size={14} /> All Products
                    </Link>
                    <div className="border-t border-gray-50 my-1" />
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
                {categories.slice(0, 9).map((cat) => (
                  <Link key={cat.id} href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`}
                    className="text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap font-medium text-sm">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="max-w-[1600px] mx-auto px-8 py-4 space-y-1">

              {isAdmin ? (
                <>
                  <div className="flex items-center gap-3 py-2 px-2 bg-blue-50 rounded-xl mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user?.firstName}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                    </div>
                  </div>
                  <Link href="/admin" className="flex items-center gap-3 py-2 px-2 text-blue-600 font-semibold text-sm" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard size={18} /> Admin Panel
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 py-2 px-2 text-blue-600 text-sm w-full text-left">
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden border-2 border-blue-600 mb-3">
                    <input type="text" placeholder="Search..." className="flex-1 px-4 py-2 text-sm outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="submit" className="bg-blue-600 px-4 text-white"><Search size={18} /></button>
                  </form>

                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-3 py-2 px-2 bg-blue-50 rounded-xl mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user?.firstName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user?.firstName}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-3 py-2 px-2 hover:text-blue-600 text-sm" onClick={() => setMobileOpen(false)}><UserCircle size={18} /> My Dashboard</Link>
                      <Link href="/orders" className="flex items-center gap-3 py-2 px-2 hover:text-blue-600 text-sm" onClick={() => setMobileOpen(false)}><Package size={18} /> My Orders</Link>
                      <Link href="/wishlist" className="flex items-center gap-3 py-2 px-2 hover:text-blue-600 text-sm" onClick={() => setMobileOpen(false)}><Heart size={18} /> Wishlist</Link>
                      <Link href="/profile" className="flex items-center gap-3 py-2 px-2 hover:text-blue-600 text-sm" onClick={() => setMobileOpen(false)}><MapPin size={18} /> My Addresses</Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 py-2 px-2 text-blue-600 text-sm w-full text-left">
                        <LogOut size={18} /> Logout
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2 mb-2">
                      <Link href="/auth/login" className="flex-1 bg-blue-600 text-white text-center py-2 rounded-xl text-sm font-medium" onClick={() => setMobileOpen(false)}>Login</Link>
                      <Link href="/auth/register" className="flex-1 border border-blue-600 text-blue-600 text-center py-2 rounded-xl text-sm font-medium" onClick={() => setMobileOpen(false)}>Register</Link>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-2 px-2">Categories</p>
                    {categories.map((cat) => (
                      <Link key={cat.id} href={`/products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`} className="block py-2 px-2 text-gray-600 hover:text-blue-600 text-sm" onClick={() => setMobileOpen(false)}>
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {(accountOpen || categoriesOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setAccountOpen(false); setCategoriesOpen(false); }} />
      )}
    </>
  );
}
