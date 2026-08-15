export interface User {
  email: string;
  firstName: string;
  role: "USER" | "ADMIN";
  token: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string;
  colors?: string;
  featured: boolean;
  active: boolean;
  categoryId: number;
  categoryName: string;
  averageRating: number;
  totalReviews: number;
}

export interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  price: number;
  salePrice?: number;
  stock: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED"
  | "EXCHANGE";

export interface OrderStatusHistory {
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  shippingAddress: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  couponCode?: string;
  items: OrderItem[];
  totalItems: number;
  statusHistory?: OrderStatusHistory[];
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnType = "RETURN" | "EXCHANGE";
export type ReturnReason = "DAMAGED" | "WRONG_ITEM" | "WRONG_SIZE" | "QUALITY_ISSUE" | "OTHER";
export type ReturnStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "COMPLETED";

export interface ReturnRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  type: ReturnType;
  reason: ReturnReason;
  description?: string;
  evidenceImages: string[];
  status: ReturnStatus;
  inspectionNote?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  images?: string[];
  verifiedPurchase?: boolean;
  status?: ReviewStatus;
  rejectionReason?: string;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface ProductSuggestion {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  price: number;
  salePrice?: number;
  categoryName: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<string, number>; // "5".."1" -> count
}

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  fullAddress: string;
}

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productSlug?: string;
  productImage?: string;
  price: number;
  salePrice?: number;
  inStock: boolean;
  addedAt: string;
}

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_STATUS"
  | "RETURN_REQUESTED"
  | "RETURN_UPDATE"
  | "BACK_IN_STOCK"
  | "GENERAL";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type InventoryReason = "SALE" | "CANCELLATION" | "RETURN" | "ADJUSTMENT";

export interface InventoryTransaction {
  id: number;
  productId: number;
  productName: string;
  quantityDelta: number;
  resultingStock?: number;
  reason: InventoryReason;
  note?: string;
  actor?: string;
  createdAt: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  registeredAt: string;
  orderCount: number;
  totalSpend: number;
  avgOrderValue: number;
  lastOrderAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
