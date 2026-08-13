import {
  Clock, CheckCircle, Package, PackageCheck, Truck, Navigation, Home,
  XCircle, RotateCcw, RefreshCw, Repeat, type LucideIcon,
} from "lucide-react";
import type { OrderStatus } from "@/types";

interface StatusMeta {
  label: string;
  badge: string; // pill classes
  dot: string;   // timeline dot bg
  Icon: LucideIcon;
}

// One source of truth for how every order status looks across the customer tracking page and
// the admin order screens. Colours stay within the design-system palette; terminal-negative
// states (cancelled) read muted, delivered/refunded read success.
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:          { label: "Pending",          badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500",  Icon: Clock },
  CONFIRMED:        { label: "Confirmed",         badge: "bg-brand-50 text-brand-700 border-brand-200",   dot: "bg-brand",      Icon: CheckCircle },
  PROCESSING:       { label: "Processing",        badge: "bg-brand-50 text-brand-700 border-brand-200",   dot: "bg-brand",      Icon: Package },
  PACKED:           { label: "Packed",            badge: "bg-brand-50 text-brand-700 border-brand-200",   dot: "bg-brand",      Icon: PackageCheck },
  SHIPPED:          { label: "Shipped",           badge: "bg-slate-100 text-slate-700 border-slate-200",  dot: "bg-slate-600",  Icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for delivery",  badge: "bg-slate-100 text-slate-700 border-slate-200",  dot: "bg-slate-700",  Icon: Navigation },
  DELIVERED:        { label: "Delivered",         badge: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-600",  Icon: Home },
  CANCELLED:        { label: "Cancelled",         badge: "bg-gray-100 text-gray-600 border-gray-200",     dot: "bg-gray-400",   Icon: XCircle },
  RETURNED:         { label: "Returned",          badge: "bg-orange-50 text-orange-700 border-orange-200",dot: "bg-orange-500", Icon: RotateCcw },
  REFUNDED:         { label: "Refunded",          badge: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-600",  Icon: RefreshCw },
  EXCHANGE:         { label: "Exchange",          badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500",  Icon: Repeat },
};

// The happy-path fulfilment ladder shown as the stepper. Branch/terminal states
// (cancelled, returned, refunded, exchange) are shown separately, not on this ladder.
export const FULFILLMENT_STEPS: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
];

// Mirrors the backend's ALLOWED_TRANSITIONS so the admin dropdown only offers legal next
// states (the server still enforces it — this is UX, not the guard).
export const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING:          ["CONFIRMED", "CANCELLED"],
  CONFIRMED:        ["PROCESSING", "CANCELLED"],
  PROCESSING:       ["PACKED", "CANCELLED"],
  PACKED:           ["SHIPPED", "CANCELLED"],
  SHIPPED:          ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED:        ["RETURNED", "EXCHANGE"],
  RETURNED:         ["REFUNDED", "EXCHANGE"],
  CANCELLED:        [],
  REFUNDED:         [],
  EXCHANGE:         [],
};

// A customer may cancel only before fulfilment has begun.
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];

export const isTerminalNonDelivered = (s: OrderStatus) =>
  s === "CANCELLED" || s === "RETURNED" || s === "REFUNDED" || s === "EXCHANGE";
