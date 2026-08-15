'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star, ArrowLeft, Minus, Plus, Package, Shield, Truck, RotateCcw, Flame, MessageCircle, BadgeCheck, ImagePlus, X, Loader2, Ruler } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { Product, Review, ReviewSummary } from '@/types';
import api from '@/lib/axios';
import { setCached } from '@/lib/cache';
import RelatedProducts from '@/components/products/RelatedProducts';
import RecentlyViewed from '@/components/products/RecentlyViewed';
import dynamic from 'next/dynamic';
import { recordView } from '@/lib/recentlyViewed';
import toast from 'react-hot-toast';

// Only needed when the shopper opens the size guide — code-split so it stays out of the initial
// product-page bundle and loads on demand.
const SizeGuideModal = dynamic(() => import('@/components/products/SizeGuideModal'), { ssr: false });

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗', 'Gents Fashion': '👘',
  'Beauty': '✨', 'Home & Living': '🏠', 'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

const WHATSAPP_NUMBER = '923248234639';

interface Props {
  initialProduct: Product;
  initialReviews: Review[];
}

export default function ProductDetailClient({ initialProduct, initialReviews }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  const slug = initialProduct.slug;
  const initialSizes = initialProduct.sizes ? initialProduct.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
  const initialColors = initialProduct.colors ? initialProduct.colors.split(',').map(c => c.trim()).filter(Boolean) : [];

  const [product, setProduct] = useState<Product>(initialProduct);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingReviewImage, setUploadingReviewImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(initialSizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(initialColors[0] || '');
  const [soldCount, setSoldCount] = useState(0);

  // Background revalidation + secondary fetches (sold count).
  // Server already provided product+reviews; we just refresh in case stock/price changed.
  useEffect(() => {
    let cancelled = false;
    const productKey = `product:slug:${slug}`;
    setCached(productKey, initialProduct);
    setCached(`reviews:product:${initialProduct.id}`, initialReviews);

    api.get(`/api/products/${initialProduct.id}/sold-recently`)
      .then(r => { if (!cancelled) setSoldCount(r.data.soldCount || 0); })
      .catch(() => {});

    api.get<Product>(`/api/products/slug/${slug}`)
      .then(res => {
        if (cancelled) return;
        setProduct(res.data);
        setCached(productKey, res.data);
      })
      .catch(() => {});

    api.get<Review[]>(`/api/reviews/product/${initialProduct.id}`)
      .then(res => {
        if (cancelled) return;
        setReviews(res.data || []);
        setCached(`reviews:product:${initialProduct.id}`, res.data || []);
      })
      .catch(() => {});

    api.get<ReviewSummary>(`/api/reviews/product/${initialProduct.id}/summary`)
      .then(res => { if (!cancelled) setReviewSummary(res.data); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [slug, initialProduct, initialReviews]);

  // Record this product in the client-side "recently viewed" history.
  useEffect(() => { recordView(initialProduct); }, [initialProduct]);

  // For a variant-driven product, default the size/colour selection to the first in-stock variant
  // (falling back to the first). Only rewrites a selection that isn't a valid variant value, so it
  // seeds sensible defaults on load without ever fighting a choice the customer has made.
  useEffect(() => {
    const vs = (product.variants ?? []).filter(v => v.active !== false);
    if (vs.length === 0) return;
    const hasSize = vs.some(v => v.size);
    const hasColor = vs.some(v => v.color);
    // Does the current size+colour actually resolve to a real variant COMBINATION?
    const resolves = vs.some(v =>
      (!hasSize || v.size === selectedSize) && (!hasColor || v.color === selectedColor));
    if (resolves) return;
    // If not (e.g. a sparse matrix on first load), snap to a complete in-stock variant.
    const pick = vs.find(v => v.stock > 0) ?? vs[0];
    if (pick.size) setSelectedSize(pick.size);
    if (pick.color) setSelectedColor(pick.color);
  }, [product.variants, selectedSize, selectedColor]);

  // Delivery estimate (3–5 days). Computed client-side in an effect so the date never differs
  // between server and client render (no hydration mismatch).
  useEffect(() => {
    const fmt = (d: Date) => d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
    const from = new Date(); from.setDate(from.getDate() + 3);
    const to = new Date(); to.setDate(to.getDate() + 5);
    setDeliveryEstimate(`${fmt(from)} – ${fmt(to)}`);
  }, []);

  const getAllImages = useCallback(() => {
    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (product.imageUrls) {
      product.imageUrls.forEach(url => {
        if (url && !images.includes(url)) images.push(url);
      });
    }
    return images;
  }, [product]);

  // Returns true only when the item actually made it into the cart, so callers like Buy Now
  // can decide whether to proceed instead of navigating on a failed/blocked add.
  const handleAddToCart = async (): Promise<boolean> => {
    if (!isLoggedIn) { toast.error('Please login first!'); router.push('/auth/login'); return false; }
    // Variant-driven products require a valid, in-stock size/colour before adding.
    const vs = (product.variants ?? []).filter(v => v.active !== false);
    if (vs.length > 0) {
      if (!selectedVariant) { toast.error('Please select an available option first'); return false; }
      if (selectedVariant.stock <= 0) { toast.error('That option is out of stock'); return false; }
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity, selectedVariant?.id);
      toast.success(`${product.name} added to cart!`);
      return true;
    } catch {
      toast.error('Please try again');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    // Only head to checkout if the add succeeded; otherwise the user lands on /cart with
    // nothing added, or gets bounced to /cart mid-redirect to the login page.
    if (await handleAddToCart()) {
      router.push('/cart');
    }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    try {
      await api.post(`/api/wishlist/${product.id}`);
      setWishlisted(w => !w);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch { toast.error('Please try again'); }
  };

  const handleWhatsApp = () => {
    const enquiryPrice = selectedVariant?.effectivePrice ?? (product.salePrice || product.price);
    const message = `Hi! I'm interested in *${product.name}*${selectedSize ? ` (Size: ${selectedSize})` : ''}${selectedColor ? ` (Color: ${selectedColor})` : ''} - ${formatPrice(enquiryPrice)}\n\nProduct link: ${window.location.href}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleReviewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file after removal
    if (files.length === 0) return;
    const room = 4 - reviewImages.length;
    if (room <= 0) { toast.error('Up to 4 photos'); return; }
    setUploadingReviewImage(true);
    try {
      for (const file of files.slice(0, room)) {
        if (!file.type.startsWith('image/')) { toast.error('Images only'); continue; }
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
        const form = new FormData();
        form.append('file', file);
        const res = await api.post<{ url: string }>('/api/upload/review', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.url) setReviewImages(prev => [...prev, res.data.url]);
      }
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploadingReviewImage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a review!'); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post<Review>(`/api/reviews/product/${product.id}`, {
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImages,
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      setReviewImages([]);
      toast.success('Review submitted! Thank you!');
      // Refresh the aggregate so the histogram + product stars reflect the new review.
      api.get<ReviewSummary>(`/api/reviews/product/${product.id}/summary`)
        .then(r => setReviewSummary(r.data)).catch(() => {});
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Variants ─────────────────────────────────────────────────────────────
  // A product is "variant-driven" once it has active variants; then size/colour, price and stock all
  // come from the chosen variant. A product with none behaves exactly as before (free-text options,
  // product-level price/stock).
  const variants = (product.variants ?? []).filter(v => v.active !== false);
  const hasVariants = variants.length > 0;
  const variantSizes = [...new Set(variants.map(v => v.size).filter((s): s is string => !!s))];
  const variantColors = [...new Set(variants.map(v => v.color).filter((c): c is string => !!c))];
  const selectedVariant = hasVariants
    ? (variants.find(v =>
        (variantSizes.length === 0 || v.size === selectedSize) &&
        (variantColors.length === 0 || v.color === selectedColor)) ?? null)
    : null;
  // A size/colour chip is "sold out" only when EVERY variant carrying it is out of stock.
  const sizeSoldOut = (s: string) => !variants.some(v => v.size === s && v.stock > 0);
  const colorSoldOut = (c: string) => !variants.some(v => v.color === c && v.stock > 0);

  const disc = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
  const emoji = EMOJIS[product.categoryName] || '🛍️';

  // Effective stock / prices honour the chosen variant when the product is variant-driven.
  const effStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const inStock = effStock > 0;
  const displayPrice = hasVariants
    ? (selectedVariant?.effectivePrice ?? Math.min(...variants.map(v => v.effectivePrice)))
    : (product.salePrice ?? product.price);
  const displayOriginal = hasVariants
    ? (selectedVariant && selectedVariant.salePrice != null && selectedVariant.salePrice < selectedVariant.price
        ? selectedVariant.price : null)
    : (product.salePrice ? product.price : null);
  const activeSku = selectedVariant?.sku ?? product.sku ?? null;

  // Combination-aware chip selection: when a product has BOTH size and colour, picking one dimension
  // auto-corrects the other to a value that actually exists together (preferring in-stock), so the
  // shopper can never get stranded on a size/colour pair that maps to no variant (sparse matrices).
  const pickSize = (size: string) => {
    setSelectedSize(size);
    if (variantColors.length > 0) {
      const forSize = variants.filter(v => v.size === size);
      if (!forSize.some(v => v.color === selectedColor)) {
        const next = (forSize.find(v => v.stock > 0) ?? forSize[0])?.color;
        if (next) setSelectedColor(next);
      }
    }
  };
  const pickColor = (color: string) => {
    setSelectedColor(color);
    if (variantSizes.length > 0) {
      const forColor = variants.filter(v => v.color === color);
      if (!forColor.some(v => v.size === selectedSize)) {
        const next = (forColor.find(v => v.stock > 0) ?? forColor[0])?.size;
        if (next) setSelectedSize(next);
      }
    }
  };

  const images = getAllImages();
  const sizes = hasVariants ? variantSizes : (product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : []);
  const colors = hasVariants ? variantColors : (product.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : []);

  // Keep the chosen quantity within the (possibly variant-specific) stock ceiling as the selection changes.
  useEffect(() => { setQuantity(q => Math.min(Math.max(1, q), Math.max(1, effStock))); }, [effStock]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600">Products</Link>
          <span>/</span>
          <Link href={`/products?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-blue-600">{product.categoryName}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </div>

        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <div className="relative bg-gray-50 rounded-2xl h-80 md:h-[450px] flex items-center justify-center overflow-hidden mb-3">
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage] || images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    className="object-contain"
                  />
                ) : (
                  <span className="text-8xl">{emoji}</span>
                )}
              </div>
              {disc > 0 && (
                <span className="absolute top-4 left-4 bg-blue-600 text-white text-sm font-black px-3 py-1.5 rounded-xl">
                  -{disc}% OFF
                </span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                  <span className="bg-gray-800 text-white font-black px-6 py-3 rounded-xl text-lg">Out of Stock</span>
                </div>
              )}

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-brand shadow-md' : 'border-gray-200 hover:border-gray-400'}`}>
                      <Image src={img} alt={`${product.name} ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <p className="text-blue-600 font-semibold text-sm mb-1">{product.categoryName}</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>

              {product.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} className={s <= Math.round(product.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <span className="font-bold text-sm">{product.averageRating}</span>
                  <span className="text-gray-400 text-sm">({product.totalReviews} reviews)</span>
                </div>
              )}

              {soldCount > 0 && (
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-semibold">
                    <Flame size={14} />
                    <span>{soldCount} sold in last 24 hours</span>
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-2">
                {hasVariants && !selectedVariant && <span className="text-sm text-gray-400 font-semibold">From</span>}
                <span className="text-3xl font-black text-blue-600">{formatPrice(displayPrice)}</span>
                {displayOriginal != null && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatPrice(displayOriginal)}</span>
                    <span className="text-green-600 font-bold text-sm">
                      Save {formatPrice(displayOriginal - displayPrice)}!
                    </span>
                  </>
                )}
              </div>
              {activeSku && <p className="text-xs text-gray-400 font-medium mb-4">SKU: {activeSku}</p>}

              <div className="mb-4">
                {inStock ? (
                  effStock <= 10 ? (
                    <span className="text-brand font-bold text-sm flex items-center gap-1">
                      🔥 Hurry — only {effStock} left in stock!
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" /> In Stock
                    </span>
                  )
                ) : hasVariants && !selectedVariant ? (
                  <span className="text-gray-500 font-semibold text-sm">Selected option is unavailable</span>
                ) : (
                  <span className="text-red-600 font-semibold text-sm">Out of Stock</span>
                )}
              </div>

              {sizes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Size:</p>
                    <button onClick={() => setSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                      <Ruler size={13} /> Size guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => {
                      const soldOut = hasVariants && sizeSoldOut(size);
                      return (
                        <button key={size} onClick={() => pickSize(size)} disabled={soldOut}
                          title={soldOut ? 'Out of stock' : undefined}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedSize === size ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700 hover:border-blue-400'} ${soldOut ? 'opacity-40 line-through cursor-not-allowed hover:border-gray-200' : ''}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Color: <span className="text-blue-600">{selectedColor}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => {
                      const soldOut = hasVariants && colorSoldOut(color);
                      return (
                      <button key={color} onClick={() => pickColor(color)} disabled={soldOut}
                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color ? 'border-blue-600 ring-2 ring-blue-300 ring-offset-1' : 'border-gray-300 hover:border-gray-500'} ${soldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={soldOut ? `${color} — out of stock` : color}>
                        {selectedColor === color && (
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                            <path d="M6 10l3 3 5-6" stroke={['white','yellow','beige','cream','ivory','lightyellow','snow','linen','floralwhite','ghostwhite','mintcream','azure','aliceblue','lavenderblush','seashell','cornsilk','lemonchiffon','honeydew','oldlace','papayawhip','blanchedalmond','bisque','wheat','moccasin','peachpuff','mistyrose','lavender','thistle','pink','lightpink','lightsalmon','lightyellow','lightgoldenrodyellow','lightcyan','lightblue','lightsteelblue','lightgray','lightgrey','silver','gainsboro','whitesmoke'].includes(color.toLowerCase()) ? '#111' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {inStock && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(effStock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-4">
                <button onClick={handleAddToCart} disabled={adding || !inStock}
                  className="flex-1 btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                  {adding ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</>
                  ) : (
                    <><ShoppingCart size={18} /> Add to Cart</>
                  )}
                </button>
                <button onClick={handleWishlist}
                  className={`p-4 rounded-xl border-2 transition-all ${wishlisted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}>
                  <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              {inStock && (
                <button onClick={handleBuyNow}
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-4 rounded-xl font-bold transition-all text-sm mb-4">
                  Buy Now
                </button>
              )}

              {inStock && deliveryEstimate && (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-3 mb-4">
                  <Truck size={18} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Get it by <span className="font-bold text-gray-900">{deliveryEstimate}</span>
                    <span className="text-gray-400"> · if you order now</span>
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck size={20} className="text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">Free Delivery<br />Rs. 2000+</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <RotateCcw size={20} className="text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">7 Day<br />Return</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Shield size={20} className="text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">100%<br />Original</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button onClick={() => setActiveTab('details')}
              className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Product Details
            </button>
            <button onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'reviews' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Reviews ({reviews.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'details' ? (
              <div>
                {product.description ? (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No description available yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {reviewSummary && reviewSummary.total > 0 && (
                  <div className="mb-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-gray-50 rounded-2xl p-5">
                    <div className="text-center flex-shrink-0">
                      <p className="text-5xl font-black text-gray-900">{reviewSummary.average.toFixed(1)}</p>
                      <div className="flex justify-center my-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={16} className={s <= Math.round(reviewSummary.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{reviewSummary.total} review{reviewSummary.total === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      {[5,4,3,2,1].map(star => {
                        const count = reviewSummary.distribution[String(star)] || 0;
                        const pct = reviewSummary.total ? (count / reviewSummary.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                            <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isLoggedIn && (
                  <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-gray-50 rounded-2xl">
                    <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-600 font-medium">Rating:</span>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setReviewRating(s)}>
                          <Star size={24} className={s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={3} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none mb-3" />

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {reviewImages.map((url, i) => (
                          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                            <Image src={url} alt={`Review photo ${i + 1}`} fill sizes="64px" className="object-cover" />
                            <button type="button" onClick={() => setReviewImages(prev => prev.filter(u => u !== url))}
                              aria-label="Remove photo"
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                        {reviewImages.length < 4 && (
                          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand text-gray-400 hover:text-brand transition-colors">
                            {uploadingReviewImage ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleReviewImages} disabled={uploadingReviewImage} />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Add up to 4 photos (optional)</p>
                    </div>

                    <button type="submit" disabled={submittingReview || !reviewComment.trim()}
                      className="btn-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm">Be the first to write a review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                              {review.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                                  <BadgeCheck size={12} /> Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {review.images.map((url, i) => (
                              <button key={url} type="button" onClick={() => setLightbox(url)}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                <Image src={url} alt={`Review photo ${i + 1}`} fill sizes="80px" className="object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedProducts productId={product.id} />

      <RecentlyViewed excludeId={product.id} altBg />

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={28} />
          </button>
          <div className="relative w-full max-w-3xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox} alt="Review photo" fill sizes="768px" className="object-contain" />
          </div>
        </div>
      )}

      <button onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 group">
        <MessageCircle size={24} fill="currentColor" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-bold">
          Chat on WhatsApp
        </span>
      </button>
    </div>
  );
}
