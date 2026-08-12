"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  /** Responsive sizes hint for the optimizer. Defaults tuned for a product grid. */
  sizes?: string;
  /** Extra classes applied to the <Image> (e.g. group-hover:scale-105). */
  imgClassName?: string;
  /** Set for above-the-fold images (hero, first product) to skip lazy-loading. */
  priority?: boolean;
}

// next/image wrapper for Cloudinary product/category media. Renders fill-mode inside a
// positioned parent, fades in on load, and shows a branded fallback when the src is
// missing or fails. Meaningful alt text is required (SEO + accessibility).
export default function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  imgClassName = "",
  priority = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const showFallback = !src || error;

  return (
    <>
      {(!loaded || showFallback) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
          <ImageOff size={28} className="text-slate-300" />
          <span className="text-xs text-slate-400 font-medium px-3 text-center line-clamp-2">{alt}</span>
        </div>
      )}
      {src && !error && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName
          )}
        />
      )}
    </>
  );
}
