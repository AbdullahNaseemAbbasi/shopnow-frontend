"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = product.salePrice
    ? getDiscountPercent(product.price, product.salePrice)
    : 0;

  const displayPrice = product.salePrice || product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Pehle login karein!");
      return;
    }
    if (product.stock === 0) {
      toast.error("Out of stock!");
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(product.id, 1);
      toast.success("Cart mein add ho gaya! 🛒");
    } catch {
      toast.error("Dobara try karein");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Pehle login karein!");
      return;
    }
    try {
      await api.post(`/api/wishlist/${product.id}`);
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? "Wishlist se hata diya" : "Wishlist mein add ho gaya! ❤️");
    } catch {
      toast.error("Dobara try karein");
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="product-card bg-white rounded-2xl overflow-hidden border border-gray-100 group cursor-pointer h-full flex flex-col">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {!imgError && product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart size={40} className="text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-[#E40046] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              wishlisted
                ? "bg-[#E40046] text-white"
                : "bg-white text-gray-400 hover:bg-red-50 hover:text-[#E40046]"
            } shadow-md opacity-0 group-hover:opacity-100`}
          >
            <Heart size={15} fill={wishlisted ? "currentColor" : "none"} />
          </button>

          {/* Add to Cart Overlay */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock === 0}
            className="absolute bottom-0 left-0 right-0 btn-primary text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:opacity-60"
          >
            <ShoppingCart size={16} />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-gray-400 mb-1">{product.categoryName}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={s <= Math.round(product.averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.totalReviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-bold text-[#E40046]">
              {formatPrice(displayPrice)}
            </span>
            {product.salePrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
