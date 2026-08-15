'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Megaphone, Plus, Pencil, Trash2, X, Upload, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import type { Banner } from '@/types';
import toast from 'react-hot-toast';

type FormState = {
  title: string; subtitle: string; imageUrl: string; ctaText: string; ctaLink: string;
  active: boolean; sortOrder: number; startsAt: string; endsAt: string;
};

const EMPTY: FormState = {
  title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '',
  active: true, sortOrder: 0, startsAt: '', endsAt: '',
};

const dtLocal = (iso?: string) => (iso ? iso.slice(0, 16) : '');
const fmtWindow = (b: Banner) => {
  const f = (s?: string) => (s ? new Date(s).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : null);
  const from = f(b.startsAt), to = f(b.endsAt);
  if (!from && !to) return 'Always';
  return `${from || '…'} → ${to || '…'}`;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null); // null = closed
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBanners = () => {
    setLoading(true);
    api.get<Banner[]>('/api/banners/admin')
      .then((res) => setBanners(res.data || []))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchBanners(); }, []);

  const openNew = () => { setForm(EMPTY); setEditingId(null); setIsNew(true); };
  const openEdit = (b: Banner) => {
    setForm({
      title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl || '',
      ctaText: b.ctaText || '', ctaLink: b.ctaLink || '', active: b.active,
      sortOrder: b.sortOrder, startsAt: dtLocal(b.startsAt), endsAt: dtLocal(b.endsAt),
    });
    setEditingId(b.id); setIsNew(false);
  };
  const closeForm = () => { setIsNew(false); setEditingId(null); setForm(EMPTY); };
  const formOpen = isNew || editingId !== null;

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<{ url: string }>('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) setForm((f) => ({ ...f, imageUrl: res.data.url }));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle || null,
      imageUrl: form.imageUrl || null,
      ctaText: form.ctaText || null,
      ctaLink: form.ctaLink || null,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };
    try {
      if (isNew) await api.post('/api/banners', payload);
      else await api.put(`/api/banners/${editingId}`, payload);
      toast.success('Banner saved');
      closeForm();
      fetchBanners();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not save');
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await api.delete(`/api/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Megaphone size={22} className="text-brand" /> Hero Banners
          </h1>
          <p className="text-gray-500 text-sm">Control the homepage hero — no developer needed</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> New banner
        </button>
      </div>

      {formOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">{isNew ? 'New banner' : 'Edit banner'}</h2>
            <button onClick={closeForm} aria-label="Close" className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CTA text</label>
              <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CTA link</label>
              <input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/products"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Starts at</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ends at</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sort order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 accent-brand" />
              Active
            </label>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Background image</label>
              <div className="flex items-center gap-3">
                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {form.imageUrl ? <Image src={form.imageUrl} alt="Banner" fill sizes="112px" className="object-cover" /> : null}
                </div>
                <label className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:border-brand cursor-pointer">
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }} />
                </label>
                {form.imageUrl && <button onClick={() => setForm({ ...form, imageUrl: '' })} className="text-xs text-gray-400 hover:text-danger">Remove</button>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={closeForm} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save banner'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No banners yet. The homepage shows a category hero until you add one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 flex-wrap">
              <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {b.imageUrl ? <Image src={b.imageUrl} alt={b.title} fill sizes="112px" className="object-cover" /> : <div className="w-full h-full hero-gradient" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${b.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {b.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {b.subtitle && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{b.subtitle}</p>}
                <p className="text-[11px] text-gray-400 mt-1">Order {b.sortOrder} · {fmtWindow(b)}{b.ctaText ? ` · CTA: ${b.ctaText}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(b)} aria-label="Edit banner" className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-brand hover:border-brand transition-colors"><Pencil size={15} /></button>
                <button onClick={() => remove(b.id)} aria-label="Delete banner" className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-danger hover:border-danger/40 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
