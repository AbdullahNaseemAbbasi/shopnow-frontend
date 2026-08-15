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
import ProductImage from "@/components/ui/ProductImage";
import Badge from "@/components/ui/Badge";

interface Props {
  product: Product;
  /** Set for above-the-fold cards (first grid row) so their image isn't lazy-loaded — improves LCP. */
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  const { addToCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Variant-driven products can't be quick-added from a card (the customer must pick a size/colour),
  // and their base price/stock are not authoritative — derive both from the variants.
  const variants = (product.variants ?? []).filter((v) => v.active !== false);
  const hasVariants = variants.length > 0;
  const effStock = hasVariants ? variants.reduce((s, v) => s + (v.stock || 0), 0) : product.stock;
  const inStock = effStock > 0;
  const displayPrice = hasVariants
    ? Math.min(...variants.map((v) => v.effectivePrice))
    : (product.salePrice || product.price);
  // Discount badge only for simple products (a variant product shows a "From" price, not a strike).
  const discount = !hasVariants && product.salePrice ? getDiscountPercent(product.price, product.salePrice) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login first!"); return; }
    if (!inStock) { toast.error("Out of stock!"); return; }
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
      <div className="bg-white rounded-2xl border border-line overflow-hidden group cursor-pointer h-full flex flex-col shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-brand-200">

        <div className="relative w-full bg-slate-50 overflow-hidden" style={{ paddingBottom: '60%' }}>
          <ProductImage src={product.imageUrl} alt={product.name} imgClassName="group-hover:scale-105" priority={priority} />

          {!inStock ? (
            <Badge tone="ink" className="absolute top-2.5 left-2.5 z-10 shadow-sm">Out of Stock</Badge>
          ) : discount > 0 ? (
            <Badge tone="brandSolid" className="absolute top-2.5 left-2.5 z-10 shadow-sm">-{discount}%</Badge>
          ) : null}

          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200
              ${wishlisted ? "bg-brand text-white" : "bg-white text-slate-400 hover:text-brand"}
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

          <div className="flex items-center gap-2 mb-2">
            {hasVariants && <span className="text-[11px] text-slate-400 font-medium">From</span>}
            <span className="text-sm font-bold text-brand">{formatPrice(displayPrice)}</span>
            {!hasVariants && product.salePrice && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {inStock && effStock <= 5 && (
            <p className="text-xs font-bold text-brand mb-3 flex items-center gap-1">🔥 Only {effStock} left!</p>
          )}

          {hasVariants ? (
            // Variant products can't be quick-added — the whole card is a Link, so this span just
            // lets the click through to the PDP where a size/colour is chosen.
            <span className="w-full flex items-center justify-center gap-2 bg-surface-subtle group-hover:bg-brand text-ink-soft group-hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-line transition-all duration-200">
              <ShoppingCart size={14} />
              {inStock ? "Select options" : "Out of Stock"}
            </span>
          ) : (
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !inStock}
            className="w-full flex items-center justify-center gap-2 bg-surface-subtle hover:bg-brand text-ink-soft hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-line transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
            {addingToCart ? "Adding..." : !inStock ? "Out of Stock" : "Add to Cart"}
          </button>
          )}
        </div>
      </div>
    </Link>
  );
}
