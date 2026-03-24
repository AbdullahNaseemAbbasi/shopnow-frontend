'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, fetchCart, updateItem, removeItem, loading } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchCart();
  }, [isLoggedIn, fetchCart, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const total = cart?.totalAmount || 0;
      const res = await api.post(`/api/coupons/apply?code=${couponCode.toUpperCase()}&amount=${total}`);
      setDiscount(res.data.discountAmount);
      setCouponApplied(couponCode.toUpperCase());
      toast.success(res.data.message || `Rs. ${res.data.discountAmount} ki discount mili!`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Invalid coupon code!');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) { toast.error('Cart khali hai!'); return; }
    router.push('/checkout');
  };

  if (!isLoggedIn) return null;

  const total = cart?.totalAmount || 0;
  const finalAmount = Math.max(0, total - discount);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingBag size={24} className="text-red-600" /> Meri Cart
          {cart && cart.items.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({cart.totalItems} items)</span>
          )}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-7xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Cart khali hai!</h3>
            <p className="text-gray-400 mb-8">Kuch products add karein</p>
            <Link href="/products" className="btn-primary text-white px-8 py-3 rounded-xl font-bold text-sm inline-block">
              Shopping Karein
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-xl" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productSlug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm hover:text-red-600 transition-colors line-clamp-2">{item.productName}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-red-600 text-sm">{formatPrice(item.salePrice || item.price)}</span>
                      {item.salePrice && <span className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => { if (item.quantity <= 1) removeItem(item.cartItemId); else updateItem(item.cartItemId, item.quantity - 1); }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateItem(item.cartItemId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">{formatPrice(item.subtotal)}</span>
                        <button onClick={() => removeItem(item.cartItemId)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} className="text-red-600" /> Coupon Code</h3>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-green-700">{couponApplied}</p>
                      <p className="text-xs text-green-600">-{formatPrice(discount)} discount</p>
                    </div>
                    <button onClick={() => { setCouponApplied(''); setDiscount(0); setCouponCode(''); }} className="text-xs text-red-600 font-semibold">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="EID2026" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-500 uppercase" />
                    <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}
                      className="btn-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60">
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-semibold">{total >= 2000 ? 'Free' : formatPrice(200)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-black text-lg">
                    <span>Total</span>
                    <span className="text-red-600">{formatPrice(finalAmount + (total < 2000 ? 200 : 0))}</span>
                  </div>
                </div>
                {total < 2000 && (
                  <p className="text-xs text-orange-500 mt-2 text-center">
                    Rs. {formatPrice(2000 - total)} aur add karein — Free delivery!
                  </p>
                )}
                <button onClick={handleCheckout}
                  className="w-full btn-primary text-white py-4 rounded-xl font-bold text-sm mt-4 flex items-center justify-center gap-2">
                  Checkout Karein <ArrowRight size={16} />
                </button>
                <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-red-600 mt-3 font-medium">
                  Shopping Continue Karein
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
