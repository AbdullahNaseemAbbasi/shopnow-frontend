'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, CheckCircle, Tag, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Address } from '@/types';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

// Mirrors the server-side rule (OrderService). The server is authoritative; this is preview only.
const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_FEE = 200;

export default function CheckoutPage() {
  const { cart, fetchCart, clearCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = cart?.totalAmount || 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount) + shipping;

  // Preview a coupon against the current subtotal (non-consuming). The server re-validates and
  // re-computes on order placement — this only shows the shopper the real payable amount up front.
  const previewCoupon = useCallback(async (code: string, amount: number, silent = false) => {
    if (!code.trim() || amount <= 0) return;
    setApplyingCoupon(true);
    try {
      const res = await api.post('/api/coupons/apply', null, { params: { code: code.trim(), amount } });
      setAppliedCoupon(res.data.couponCode);
      setDiscount(Number(res.data.discountAmount) || 0);
      sessionStorage.setItem('shopnow_coupon', res.data.couponCode);
      if (!silent) toast.success(`Coupon applied — you save ${formatPrice(Number(res.data.discountAmount) || 0)}`);
    } catch (err: unknown) {
      setAppliedCoupon(null);
      setDiscount(0);
      sessionStorage.removeItem('shopnow_coupon');
      if (!silent) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e?.response?.data?.message || 'Invalid or expired coupon');
      }
    } finally {
      setApplyingCoupon(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchCart();
    api.get('/api/addresses').then(res => {
      setAddresses(res.data || []);
      const def = res.data?.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    }).catch(() => {});
    const saved = sessionStorage.getItem('shopnow_coupon');
    if (saved) setCouponInput(saved);
  }, [isLoggedIn, fetchCart, router]);

  // Re-preview the saved coupon once the cart subtotal is known (and re-run if the subtotal changes,
  // e.g. min-order rules), silently so a now-invalid saved code doesn't nag on load.
  useEffect(() => {
    const saved = sessionStorage.getItem('shopnow_coupon');
    if (saved && subtotal > 0) previewCoupon(saved, subtotal, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, previewCoupon]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponInput('');
    sessionStorage.removeItem('shopnow_coupon');
  };

  const handlePlaceOrder = async () => {
    const shippingAddress = useCustom
      ? customAddress
      : addresses.find(a => a.id === selectedAddress)?.fullAddress;

    if (!shippingAddress) { toast.error('Please select a delivery address!'); return; }
    if (!cart || cart.items.length === 0) { toast.error('Your cart is empty!'); return; }

    setPlacing(true);
    try {
      const payload: { shippingAddress: string; couponCode?: string } = { shippingAddress };
      if (appliedCoupon) payload.couponCode = appliedCoupon;
      const res = await api.post('/api/orders', payload);
      // The order is now committed on the server. Everything after this point is cleanup that
      // must NOT be able to surface an "order failed" error.
      setOrderNumber(res.data.orderNumber);
      setPlaced(true);
      sessionStorage.removeItem('shopnow_coupon');
      toast.success('Order placed successfully! Please check your email.');
      try {
        await clearCart();
      } catch {
        // Order already succeeded; the backend also empties the cart on checkout.
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Order could not be placed, please try again!');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-1">Order Number:</p>
          <p className="text-xl font-black text-brand mb-4">{orderNumber}</p>
          <p className="text-gray-500 text-sm mb-6">A confirmation has been sent to your email. Your order will be processed shortly.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/orders')} className="flex-1 btn-primary text-white py-3 rounded-xl font-bold text-sm">
              View Orders
            </button>
            <button onClick={() => router.push('/products')} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:border-brand hover:text-brand transition-colors">
              Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-brand" /> Delivery Address
              </h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id && !useCustom ? 'border-brand bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={selectedAddress === addr.id && !useCustom}
                        onChange={() => { setSelectedAddress(addr.id); setUseCustom(false); }} className="mt-1 accent-brand" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{addr.fullName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.fullAddress}</p>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                        {addr.isDefault && <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${useCustom ? 'border-brand bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" checked={useCustom} onChange={() => setUseCustom(true)} className="mt-1 accent-brand" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-1"><Plus size={14} /> New Address</p>
                  {useCustom && (
                    <textarea value={customAddress} onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Enter full address (house number, street, area, city)"
                      rows={3} className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand resize-none" />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
            <h2 className="font-black text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart?.items.map(item => (
                <div key={item.cartItemId} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 flex-1">{item.productName} ×{item.quantity}</span>
                  <span className="font-semibold ml-2 flex-shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t pt-3 mb-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                    <Tag size={14} /> {appliedCoupon}
                    <span className="text-xs font-normal">(−{formatPrice(discount)})</span>
                  </span>
                  <button onClick={removeCoupon} aria-label="Remove coupon" className="text-green-700 hover:text-green-900">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') previewCoupon(couponInput, subtotal); }}
                    placeholder="Coupon code"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand uppercase"
                  />
                  <button
                    onClick={() => previewCoupon(couponInput, subtotal)}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {applyingCoupon ? '…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount</span><span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-black text-lg">
                <span>Total</span>
                <span className="text-brand">{formatPrice(total)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 pt-1">Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free delivery.</p>
              )}
            </div>
            <button onClick={handlePlaceOrder} disabled={placing}
              className="w-full btn-primary text-white py-4 rounded-xl font-bold text-sm mt-4 disabled:opacity-60 flex items-center justify-center gap-2">
              {placing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</>
              ) : `Place Order · ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
