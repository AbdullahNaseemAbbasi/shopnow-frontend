// Single source of truth for the storefront's shipping PREVIEW. These must mirror the backend
// (OrderService.FREE_SHIPPING_THRESHOLD / FLAT_SHIPPING_FEE), which stays authoritative for the
// amount actually charged — this only drives the cart/checkout preview and the marketing copy, so
// centralising the numbers here stops the five copies that used to drift apart.
export const FREE_SHIPPING_THRESHOLD = 2000;
export const FLAT_SHIPPING_FEE = 200;

/** Preview shipping fee for a given subtotal: free at/above the threshold, flat fee below it. */
export function shippingFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
