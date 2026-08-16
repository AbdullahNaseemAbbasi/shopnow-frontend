import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  // Explicit "Rs" prefix so the currency label is consistent everywhere (some ICU builds render the
  // PKR currency style as "PKR" or "₨"); never "$". API unchanged — callers still get a string.
  return `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(price)}`;
}

export function getDiscountPercent(price: number, salePrice: number): number {
  // Guard against price 0 → Infinity/NaN ("-NaN% OFF"). No discount is representable without a base.
  if (price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
