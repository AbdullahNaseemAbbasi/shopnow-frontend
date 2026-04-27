"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { prefetch } from "@/lib/useCachedFetch";
import toast from "react-hot-toast";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;
  const displayPrice = product.salePrice || product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login first!"); return; }
    if (product.stock === 0) { toast.error("Out of stock!"); return; }
    setAddingToCart(true);
    try {
      await addToCart(product.id, 1);
      toast.success("Added to cart!");
    } catch {
      toast.error("Please try again");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login first!"); return; }
    try {
      await api.post(`/api/wishlist/${product.id}`);
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!");
    } catch {
      toast.error("Please try again");
    }
  };

  const handlePrefetch = () => {
    prefetch(`product:slug:${product.slug}`, `/api/products/slug/${product.slug}`);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block h-full"
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-blue-200">

        <div className="relative w-full bg-slate-50 overflow-hidden" style={{ paddingBottom: '60%' }}>
          <div className="absolute inset-0">
            {(!imgLoaded || imgError) && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
                <ShoppingCart size={32} className="text-slate-300" />
                <span className="text-xs text-slate-400 font-medium px-3 text-center line-clamp-2">{product.name}</span>
              </div>
            )}
            {product.imageUrl && !imgError && (
              <img
                src={product.imageUrl}
                alt=""
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </div>

          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg z-10 shadow-sm">
              -{discount}%
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute top-2.5 left-2.5 bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg z-10">
              Out of Stock
            </span>
          )}

          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200
              ${wishlisted ? "bg-blue-600 text-white" : "bg-white text-slate-400 hover:text-blue-600"}
              opacity-0 group-hover:opacity-100`}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-slate-400 font-medium mb-1 truncate">{product.categoryName}</p>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 flex-1 leading-snug mb-2">
            {product.name}
          </h3>

          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={11}
                    className={s <= Math.round(product.averageRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">({product.totalReviews})</span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-blue-600">{formatPrice(displayPrice)}</span>
            {product.salePrice && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            <ShoppingCart size={14} />
            {addingToCart ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
