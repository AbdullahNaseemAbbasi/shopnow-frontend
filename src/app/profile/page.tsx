'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, MapPin, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Address } from '@/types';

const EMPTY_FORM = { fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'Pakistan' };

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAddresses = () => {
    setLoading(true);
    api.get('/api/addresses')
      .then(res => setAddresses(res.data || []))
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchAddresses();
  }, [isLoggedIn, router]);

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({ fullName: addr.fullName, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.street || !form.city) {
      toast.error('Please fill all required fields!');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const res = await api.put(`/api/addresses/${editId}`, form);
        setAddresses(prev => prev.map(a => a.id === editId ? res.data : a));
        toast.success('Address updated successfully!');
      } else {
        const res = await api.post('/api/addresses', form);
        setAddresses(prev => [...prev, res.data]);
        toast.success('New address added successfully!');
      }
      handleCancel();
    } catch {
      toast.error('Failed to save address, please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address deleted successfully!');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/api/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      toast.success('Default address updated!');
    } catch {
      toast.error('Please try again');
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{user?.firstName}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${user?.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-brand-600" /> My Addresses
            </h2>
            {!showForm && (
              <button onClick={handleOpenAdd} className="flex items-center gap-1.5 btn-primary text-white px-4 py-2 rounded-xl text-sm font-bold">
                <Plus size={15} /> New Address
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSave} className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">{editId ? 'Edit Address' : 'Add New Address'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="Muhammad Ali" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="03001234567" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address *</label>
                  <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                    placeholder="House #123, Street 4, Block B" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Karachi" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State / Province</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="Punjab" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Postal Code</label>
                  <input value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    placeholder="54000" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                  <Check size={15} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-1.5 border-2 border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-brand-400">
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No addresses saved yet</p>
              <p className="text-gray-400 text-sm">Add a new address above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr.id} className={`border-2 rounded-2xl p-4 transition-colors ${addr.isDefault ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-sm">{addr.fullName}</p>
                        {addr.isDefault && (
                          <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{addr.phone}</p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{addr.fullAddress || `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-gray-500 hover:text-brand-600 font-semibold border border-gray-200 px-2 py-1 rounded-lg hover:border-brand-400 transition-colors">
                          Set Default
                        </button>
                      )}
                      <button onClick={() => handleOpenEdit(addr)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(addr.id)} disabled={deletingId === addr.id} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-40">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
