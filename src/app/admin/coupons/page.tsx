'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Check, Ticket, Calendar, Percent, DollarSign } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumAmount: number;
  maximumDiscount: number;
  usageLimit: number;
  usageCount: number;
  expiresAt: string;
  active: boolean;
}

const EMPTY_FORM = {
  code: '', description: '', discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  discountValue: '', minimumAmount: '', maximumDiscount: '', usageLimit: '', expiresAt: '',
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/api/coupons')
      .then(res => setCoupons(res.data || []))
      .catch(() => toast.error('Coupons load nahi hue'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) { toast.error('Code aur discount value zaroor bharein!'); return; }
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minimumAmount: Number(form.minimumAmount) || 0,
      maximumDiscount: Number(form.maximumDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 100,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      const res = await api.post('/api/coupons', payload);
      setCoupons(prev => [res.data, ...prev]);
      toast.success('Coupon create ho gaya!');
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Coupon nahi bana');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yeh coupon delete karein?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon delete ho gaya!');
    } catch {
      toast.error('Delete nahi hua');
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (expiresAt: string) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm">{coupons.length} coupons</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 btn-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus size={16} /> Naya Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">Naya Coupon Banayein</h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Coupon Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="EID2026" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 uppercase font-mono font-bold tracking-widest" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type *</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Discount Value * {form.discountType === 'PERCENTAGE' ? '(%)' : '(Rs.)'}
                </label>
                <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'PERCENTAGE' ? '20' : '500'} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Order Amount (Rs.)</label>
                <input type="number" value={form.minimumAmount} onChange={e => setForm(f => ({ ...f, minimumAmount: e.target.value }))}
                  placeholder="1000" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Max Discount (Rs.) — Percentage ke liye</label>
                <input type="number" value={form.maximumDiscount} onChange={e => setForm(f => ({ ...f, maximumDiscount: e.target.value }))}
                  placeholder="2000" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="100" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="EID sale - 20% off on all products" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                <Check size={15} /> {saving ? 'Bana raha hai...' : 'Coupon Banayein'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border-2 border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Koi coupon nahi hai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(coupon => {
            const expired = isExpired(coupon.expiresAt);
            return (
              <div key={coupon.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${expired ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-gray-900 text-lg font-mono tracking-widest">{coupon.code}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${coupon.discountType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {coupon.discountType === 'PERCENTAGE' ? <Percent size={11} /> : <DollarSign size={11} />}
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `Rs. ${coupon.discountValue} OFF`}
                        </span>
                        {expired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Expired</span>}
                      </div>
                      {coupon.description && <p className="text-xs text-gray-500 mb-2">{coupon.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {coupon.minimumAmount > 0 && <span>Min order: Rs. {coupon.minimumAmount.toLocaleString()}</span>}
                        {coupon.maximumDiscount > 0 && <span>Max discount: Rs. {coupon.maximumDiscount.toLocaleString()}</span>}
                        <span className="flex items-center gap-1"><Ticket size={11} /> {coupon.usageCount || 0}/{coupon.usageLimit} used</span>
                        {coupon.expiresAt && (
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(coupon.expiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(coupon.id)} disabled={deletingId === coupon.id} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
