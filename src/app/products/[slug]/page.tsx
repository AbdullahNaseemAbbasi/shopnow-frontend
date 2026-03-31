'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, ArrowLeft, Minus, Plus, Package, Shield, Truck, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { Product, Review } from '@/types';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const EMOJIS: Record<string, string> = {
  'Electronics': '📱', 'Fashion': '👗', 'Ladies Fashion': '👗', 'Gents Fashion': '👘',
  'Beauty': '✨', 'Home & Living': '🏠', 'Sports': '⚽', 'Books': '📚', 'Kids': '🧸', 'Groceries': '🛒',
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/api/products/slug/${slug}`)
      .then(res => {
        setProduct(res.data);
        return api.get(`/api/reviews/product/${res.data.id}`);
      })
      .then(res => setReviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { toast.error('Please login first!'); router.push('/auth/login'); return; }
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Please try again');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/cart');
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    try {
      await api.post(`/api/wishlist/${product?.id}`);
      setWishlisted(w => !w);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch { toast.error('Please try again'); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login first!'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a review!'); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post(`/api/reviews/product/${product?.id}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted! Thank you!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="skeleton h-96 rounded-2xl" />
            <div className="space-y-4">
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-8 w-1/3" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const disc = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
  const emoji = EMOJIS[product.categoryName] || '🛍️';
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-6">
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
              <div className="bg-gray-50 rounded-2xl h-80 md:h-96 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
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
            </div>

            <div className="flex flex-col">
              <p className="text-blue-600 font-semibold text-sm mb-1">{product.categoryName}</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>

              {product.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} className={s <= Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <span className="font-bold text-sm">{product.averageRating}</span>
                  <span className="text-gray-400 text-sm">({product.totalReviews} reviews)</span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-blue-600">{formatPrice(product.salePrice || product.price)}</span>
                {product.salePrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatPrice(product.price)}</span>
                    <span className="text-green-600 font-bold text-sm">
                      Save Rs. {formatPrice(product.price - product.salePrice)}!
                    </span>
                  </>
                )}
              </div>

              <div className="mb-6">
                {inStock ? (
                  <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {product.stock <= 10 ? `Only ${product.stock} left in stock!` : 'In Stock'}
                  </span>
                ) : (
                  <span className="text-blue-600 font-semibold text-sm">Out of Stock</span>
                )}
              </div>

              {inStock && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-6">
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
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-4 rounded-xl font-bold transition-all text-sm">
                  Buy Now
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-3">
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
                {isLoggedIn && (
                  <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-gray-50 rounded-2xl">
                    <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-600 font-medium">Rating:</span>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setReviewRating(s)}>
                          <Star size={24} className={s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={3} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none mb-3" />
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
                            <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                            <div className="flex mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
