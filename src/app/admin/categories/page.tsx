'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag, Upload, Link } from 'lucide-react';
import api from '@/lib/axios';
import { invalidate } from '@/lib/cache';
import { Category } from '@/types';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', imageUrl: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    setLoading(true);
    api.get('/api/categories')
      .then(res => {
        const data = res.data?.content || res.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '' });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter a category name!'); return; }
    setSaving(true);
    try {
      if (editId) {
        const res = await api.put(`/api/categories/${editId}`, form);
        setCategories(prev => prev.map(c => c.id === editId ? res.data : c));
        toast.success('Category updated successfully!');
      } else {
        const res = await api.post('/api/categories', form);
        setCategories(prev => [...prev, res.data]);
        toast.success('Category added successfully!');
      }
      invalidate('categories');
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be smaller than 10MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, imageUrl: res.data.url }));
      toast.success('Image uploaded successfully!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Linked products may be affected.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      invalidate('categories');
      toast.success('Category deleted!');
    } catch {
      toast.error('Delete failed — products may be linked to this category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
          <Plus size={16} /> New Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">{editId ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Electronics" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Image</label>
                <div className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-xl border-2 border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <Tag size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-60">
                      <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <div className="flex items-center gap-2">
                      <Link size={12} className="text-gray-400 flex-shrink-0" />
                      <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="or paste URL here..." className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Category description..." className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-colors">
                <Check size={15} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="border-2 border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Tag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-3 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Tag size={20} className="text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>}
                  <p className="text-xs text-gray-300 font-mono mt-0.5">{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleOpenEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(cat.id)} disabled={deletingId === cat.id} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
