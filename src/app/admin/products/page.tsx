'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Check, PackageSearch } from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/utils';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', slug: '', description: '', price: '', salePrice: '', stock: '', imageUrl: '', categoryId: '', featured: false, active: true };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchProducts();
    api.get('/api/categories').then(res => {
      const data = res.data?.content || res.data;
      setCategories(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, [page]);

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/api/products?page=${page}&size=10`)
      .then(res => {
        setProducts(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .catch(() => toast.error('Products load nahi hue'))
      .finally(() => setLoading(false));
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : '',
      stock: String(p.stock), imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId), featured: p.featured, active: p.active,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.categoryId) {
      toast.error('Sab zaruri fields bharein!');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug || generateSlug(form.name),
      description: form.description, price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock), imageUrl: form.imageUrl,
      categoryId: Number(form.categoryId), featured: form.featured, active: form.active,
    };
    try {
      if (editId) {
        const res = await api.put(`/api/products/${editId}`, payload);
        setProducts(prev => prev.map(p => p.id === editId ? res.data : p));
        toast.success('Product update ho gaya!');
      } else {
        const res = await api.post('/api/products', payload);
        setProducts(prev => [res.data, ...prev]);
        toast.success('Naya product add ho gaya!');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yeh product delete karein?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product delete ho gaya!');
    } catch {
      toast.error('Delete nahi hua');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 btn-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus size={16} /> Naya Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">{editId ? 'Product Edit Karein' : 'Naya Product Add Karein'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                  placeholder="Samsung Galaxy S24" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (auto-generated)</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" required>
                  <option value="">Category chunein</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price (Rs.) *</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="29999" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sale Price (optional)</label>
                <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                  placeholder="24999" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Stock *</label>
                <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="100" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..." className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 resize-none" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-semibold text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                <Check size={15} /> {saving ? 'Save ho raha hai...' : 'Save Karein'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="border-2 border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-red-400">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-red-500 transition-colors">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Product search karein..."
            className="flex-1 text-sm outline-none" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageSearch size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Koi product nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Stock</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : '📦'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{product.categoryName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-red-600 text-sm">{formatPrice(product.salePrice || product.price)}</p>
                      {product.salePrice && <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-600' : product.stock <= 10 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1.5">
                        {product.active && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Active</span>}
                        {product.featured && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(product)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-red-500 hover:text-red-600">Prev</button>
            <span className="px-3 py-1.5 text-xs font-bold text-gray-600">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-red-500 hover:text-red-600">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
