'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Address } from '@/types';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

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
  const [couponCode, setCouponCode] = useState<string>('');

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchCart();
    api.get('/api/addresses').then(res => {
      setAddresses(res.data || []);
      const def = res.data?.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    }).catch(() => {});
    const savedCoupon = sessionStorage.getItem('shopnow_coupon');
    if (savedCoupon) setCouponCode(savedCoupon);
  }, [isLoggedIn, fetchCart, router]);

  const handlePlaceOrder = async () => {
    const shippingAddress = useCustom
      ? customAddress
      : addresses.find(a => a.id === selectedAddress)?.fullAddress;

    if (!shippingAddress) { toast.error('Please select a delivery address!'); return; }
    if (!cart || cart.items.length === 0) { toast.error('Your cart is empty!'); return; }

    setPlacing(true);
    try {
      const payload: { shippingAddress: string; couponCode?: string } = { shippingAddress };
      if (couponCode) payload.couponCode = couponCode;
      const res = await api.post('/api/orders', payload);
      setOrderNumber(res.data.orderNumber);
      setPlaced(true);
      sessionStorage.removeItem('shopnow_coupon');
      await clearCart();
      toast.success('Order placed successfully! Please check your email.');
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
          <p className="text-xl font-black text-blue-600 mb-4">{orderNumber}</p>
          <p className="text-gray-500 text-sm mb-6">A confirmation has been sent to your email. Your order will be processed shortly.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/orders')} className="flex-1 btn-primary text-white py-3 rounded-xl font-bold text-sm">
              View Orders
            </button>
            <button onClick={() => router.push('/products')} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition-colors">
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
                <MapPin size={18} className="text-blue-600" /> Delivery Address
              </h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id && !useCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={selectedAddress === addr.id && !useCustom}
                        onChange={() => { setSelectedAddress(addr.id); setUseCustom(false); }} className="mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{addr.fullName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.fullAddress}</p>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                        {addr.isDefault && <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${useCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" checked={useCustom} onChange={() => setUseCustom(true)} className="mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-1"><Plus size={14} /> New Address</p>
                  {useCustom && (
                    <textarea value={customAddress} onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Enter full address (house number, street, area, city)"
                      rows={3} className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none" />
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
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(cart?.totalAmount || 0)}</span>
              </div>
              {couponCode && (
                <div className="flex justify-between text-green-600 font-semibold items-center">
                  <span className="flex items-center gap-1.5">
                    Coupon
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{couponCode}</span>
                  </span>
                  <span className="text-xs">applied at checkout</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={cart && cart.totalAmount >= 2000 ? 'text-green-600 font-semibold' : ''}>
                  {cart && cart.totalAmount >= 2000 ? 'Free' : formatPrice(200)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-black text-lg">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice((cart?.totalAmount || 0) + (cart && cart.totalAmount >= 2000 ? 0 : 200))}</span>
              </div>
              {couponCode && (
                <p className="text-xs text-gray-400 pt-1">Final amount will reflect coupon discount.</p>
              )}
            </div>
            <button onClick={handlePlaceOrder} disabled={placing}
              className="w-full btn-primary text-white py-4 rounded-xl font-bold text-sm mt-4 disabled:opacity-60 flex items-center justify-center gap-2">
              {placing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</>
              ) : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
