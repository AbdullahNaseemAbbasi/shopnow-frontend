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

export interface Order {
  id: number;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  shippingAddress: string;
  totalAmount: number;
  items: OrderItem[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  createdAt: string;
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

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
