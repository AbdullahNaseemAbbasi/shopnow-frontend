'use client';
import { useEffect, useState, useRef } from 'react';
import NextImage from 'next/image';
import { Plus, Pencil, Trash2, Search, X, Check, PackageSearch, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';
import { invalidate } from '@/lib/cache';
import { formatPrice } from '@/lib/utils';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', slug: '', sku: '', description: '', price: '', salePrice: '', stock: '', imageUrl: '', categoryId: '', featured: false, active: true, sizes: '', colors: '' };

const PRESET_COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Grey', 'Navy', 'Brown', 'Pink', 'Purple', 'Yellow', 'Orange', 'Beige', 'Maroon', 'Teal', 'Olive'];

// One editable row in the admin variant editor. salePrice has no field in the UI (rare for a clothing
// store) but is still round-tripped so an override set via the API isn't lost on save.
type VariantRow = { id?: number; sku: string; size: string; color: string; price: string; salePrice: string; stock: string; stockBaseline?: number };
const BLANK_VARIANT: VariantRow = { sku: '', size: '', color: '', price: '', salePrice: '', stock: '0' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/api/products?page=${page}&size=10`)
      .then(res => {
        setProducts(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    api.get('/api/categories').then(res => {
      const data = res.data?.content || res.data;
      setCategories(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, [page]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setImageUrls([]);
    setVariants([]);
    setShowForm(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, slug: p.slug, sku: p.sku || '', description: p.description || '',
      price: String(p.price), salePrice: p.salePrice ? String(p.salePrice) : '',
      stock: String(p.stock), imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId), featured: p.featured, active: p.active,
      sizes: p.sizes || '', colors: p.colors || '',
    });
    setImageUrls(p.imageUrls || []);
    // Pre-fill the variant editor from the raw overrides (blank = inherit), active variants only.
    setVariants((p.variants ?? []).filter(v => v.active !== false).map(v => ({
      id: v.id,
      sku: v.sku ?? '',
      size: v.size ?? '',
      color: v.color ?? '',
      price: v.priceOverride != null ? String(v.priceOverride) : '',
      salePrice: v.salePriceOverride != null ? String(v.salePriceOverride) : '',
      stock: String(v.stock ?? 0),
      // Remember the loaded stock so the backend applies only the admin's intended change as a delta.
      stockBaseline: v.stock ?? 0,
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addVariant = () => setVariants(prev => [...prev, { ...BLANK_VARIANT }]);
  const updateVariant = (i: number, field: keyof VariantRow, value: string) =>
    setVariants(prev => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.categoryId) {
      toast.error('Please fill all required fields!');
      return;
    }
    setSaving(true);
    // Only rows with at least a size, colour or SKU are real variants; blank rows are dropped.
    const variantsPayload = variants
      .filter(v => v.size.trim() || v.color.trim() || v.sku.trim())
      .map(v => ({
        id: v.id,
        sku: v.sku.trim() || null,
        size: v.size.trim() || null,
        color: v.color.trim() || null,
        price: v.price.trim() ? Number(v.price) : null,
        salePrice: v.salePrice.trim() ? Number(v.salePrice) : null,
        stock: v.stock.trim() ? Math.max(0, Number(v.stock)) : 0,
        // Baseline for existing variants → backend applies (stock − baseline) atomically. Null for new.
        stockBaseline: v.stockBaseline ?? null,
      }));
    const payload = {
      name: form.name, slug: form.slug || generateSlug(form.name),
      sku: form.sku.trim() || null,
      description: form.description, price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock), imageUrl: form.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : ''),
      categoryId: Number(form.categoryId), featured: form.featured, active: form.active,
      sizes: form.sizes, colors: form.colors,
      imageUrls: imageUrls,
      // Always the full desired set (empty = no variants). The backend upserts + soft-deletes.
      variants: variantsPayload,
    };
    try {
      if (editId) {
        const res = await api.put(`/api/products/${editId}`, payload);
        setProducts(prev => prev.map(p => p.id === editId ? res.data : p));
        toast.success('Product updated successfully!');
      } else {
        const res = await api.post('/api/products', payload);
        setProducts(prev => [res.data, ...prev]);
        toast.success('Product added successfully!');
      }
      invalidate('products:');
      invalidate('product:slug:');
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      setImageUrls([]);
      setVariants([]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      invalidate('products:');
      invalidate('product:slug:');
      toast.success('Product deleted!');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        newUrls.push(res.data.url);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (newUrls.length > 0) {
      setImageUrls(prev => [...prev, ...newUrls]);
      if (!form.imageUrl) setForm(f => ({ ...f, imageUrl: newUrls[0] }));
      toast.success(`${newUrls.length} image(s) uploaded!`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleColor = (color: string) => {
    const current = form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
    if (current.includes(color)) {
      setForm(f => ({ ...f, colors: current.filter(c => c !== color).join(', ') }));
    } else {
      setForm(f => ({ ...f, colors: [...current, color].join(', ') }));
    }
  };

  const selectedColors = form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [];

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
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
          <Plus size={16} /> New Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900">{editId ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label htmlFor="product-name" className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                <input id="product-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                  placeholder="Samsung Galaxy S24" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="product-slug" className="block text-xs font-semibold text-gray-600 mb-1">Slug (auto-generated)</label>
                <input id="product-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 font-mono text-xs" />
              </div>
              <div>
                <label htmlFor="product-category" className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <select id="product-category" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" required>
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="product-price" className="block text-xs font-semibold text-gray-600 mb-1">Price (Rs.) *</label>
                <input id="product-price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="29999" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="product-saleprice" className="block text-xs font-semibold text-gray-600 mb-1">Sale Price (optional)</label>
                <input id="product-saleprice" type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                  placeholder="24999" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="product-stock" className="block text-xs font-semibold text-gray-600 mb-1">Stock *</label>
                <input id="product-stock" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="100" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" required />
                {variants.length > 0 && <p className="text-[11px] text-gray-400 mt-1">Ignored at checkout — variant stock applies.</p>}
              </div>
              <div>
                <label htmlFor="product-sku" className="block text-xs font-semibold text-gray-600 mb-1">Base SKU (optional)</label>
                <input id="product-sku" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="TSHIRT-001" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-xs" />
              </div>

              {/* MULTI IMAGE UPLOAD */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Images (up to 15)</label>
                <div className="flex gap-2 mb-3">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleMultiImageUpload} className="hidden" />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleMultiImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || imageUrls.length >= 15}
                    className="flex items-center gap-2 flex-1 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-60">
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Images'}
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={uploading || imageUrls.length >= 15}
                    className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-60">
                    <Camera size={16} /> Take Photo
                  </button>
                </div>
                {imageUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20">
                        <NextImage src={url} alt={`img-${i}`} width={80} height={80} className="w-full h-full object-cover rounded-xl border-2 border-gray-200" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="absolute bottom-0.5 left-0.5 bg-blue-600 text-white text-[9px] px-1 rounded font-bold">Main</span>}
                      </div>
                    ))}
                    {imageUrls.length < 15 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors">
                        <ImageIcon size={20} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">{imageUrls.length}/15 images uploaded</p>
              </div>

              {/* SIZES */}
              <div className="sm:col-span-2">
                <label htmlFor="product-sizes" className="block text-xs font-semibold text-gray-600 mb-1">Sizes (comma separated)</label>
                <input id="product-sizes" value={form.sizes} onChange={e => setForm(f => ({ ...f, sizes: e.target.value }))}
                  placeholder="S, M, L, XL, XXL"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                <div className="flex gap-2 mt-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                    const current = form.sizes ? form.sizes.split(',').map(s => s.trim()) : [];
                    const isSelected = current.includes(size);
                    return (
                      <button key={size} type="button"
                        onClick={() => {
                          if (isSelected) {
                            setForm(f => ({ ...f, sizes: current.filter(s => s !== size).join(', ') }));
                          } else {
                            setForm(f => ({ ...f, sizes: [...current, size].filter(Boolean).join(', ') }));
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLORS */}
              <div className="sm:col-span-2">
                <label htmlFor="product-colors" className="block text-xs font-semibold text-gray-600 mb-1">Colors (click to select or type custom)</label>
                <input id="product-colors" value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))}
                  placeholder="Red, Blue, Green, Black, White..."
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 mb-2" />
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => toggleColor(color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-all ${selectedColors.includes(color) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color.toLowerCase() }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* VARIANTS — per size/colour SKU + stock */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Variants (own SKU &amp; stock per size/colour)</label>
                  <button type="button" onClick={addVariant}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                    <Plus size={13} /> Add variant
                  </button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-xs text-gray-400">No variants — simple product using the price &amp; stock above. Add variants to track stock per size/colour.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase px-1">
                      <span className="col-span-3">Size</span>
                      <span className="col-span-3">Colour</span>
                      <span className="col-span-3">SKU</span>
                      <span className="col-span-1">Price</span>
                      <span className="col-span-1">Stock</span>
                      <span className="col-span-1" />
                    </div>
                    {variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input aria-label={`Variant ${i + 1} size`} value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} placeholder="M"
                          className="col-span-6 sm:col-span-3 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                        <input aria-label={`Variant ${i + 1} colour`} value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} placeholder="Black"
                          className="col-span-6 sm:col-span-3 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                        <input aria-label={`Variant ${i + 1} SKU`} value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} placeholder="SKU (optional)"
                          className="col-span-5 sm:col-span-3 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 font-mono" />
                        <input aria-label={`Variant ${i + 1} price`} type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} placeholder="—"
                          title="Leave blank to inherit the product price"
                          className="col-span-3 sm:col-span-1 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                        <input aria-label={`Variant ${i + 1} stock`} type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} placeholder="0"
                          className="col-span-3 sm:col-span-1 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                        <button type="button" onClick={() => removeVariant(i)} aria-label={`Remove variant ${i + 1}`}
                          className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-400">Blank price inherits the product price. Variant stock replaces the base stock at checkout.</p>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-description" className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea id="product-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="flex-1 text-sm outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageSearch size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Stock</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {product.imageUrl ? <NextImage src={product.imageUrl} alt={product.name} width={40} height={40} className="w-full h-full object-cover rounded-xl" /> : '📦'}
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
                      <p className="font-bold text-gray-900 text-sm">{formatPrice(product.salePrice || product.price)}</p>
                      {product.salePrice && <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.stock === 0 ? 'bg-red-50 text-red-600' : product.stock <= 10 ? 'bg-gray-200 text-gray-700' : 'bg-blue-50 text-blue-700'}`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1.5">
                        {product.active && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Active</span>}
                        {product.featured && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">Featured</span>}
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

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-200">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition-colors">Prev</button>
            <span className="px-3 py-1.5 text-xs font-bold text-gray-600">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
