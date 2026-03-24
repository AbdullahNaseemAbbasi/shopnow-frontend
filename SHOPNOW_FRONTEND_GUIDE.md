# ShopNow Frontend — Complete Developer Guide
> Pakistan's #1 E-Commerce Platform | Next.js 16 + Spring Boot Backend

---

## PROJECT OVERVIEW

| Item | Detail |
|------|--------|
| Frontend | Next.js 16.2.1 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v3 + Custom CSS |
| State | Zustand v5 |
| HTTP | Axios with JWT interceptors |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Spring Boot on `http://localhost:8080` |
| Database | PostgreSQL (Supabase) |

---

## FOLDER STRUCTURE

```
d:/shopnow-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (Navbar, Footer, Toaster)
│   │   ├── page.tsx                ← Home page
│   │   ├── globals.css             ← Global styles + custom CSS classes
│   │   ├── auth/
│   │   │   ├── login/page.tsx      ← Login form
│   │   │   └── register/page.tsx   ← Register form
│   │   ├── products/
│   │   │   ├── page.tsx            ← Products listing (search + pagination)
│   │   │   └── [slug]/page.tsx     ← Product detail (reviews + cart)
│   │   ├── cart/page.tsx           ← Cart (coupon + checkout button)
│   │   ├── checkout/page.tsx       ← Checkout (address + place order)
│   │   ├── orders/page.tsx         ← Orders history
│   │   └── wishlist/page.tsx       ← Wishlist
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          ← Top nav (auth dropdown, cart badge)
│   │   │   └── Footer.tsx          ← 4-column footer
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx      ← Auto-sliding banner (3 slides, 5s)
│   │   │   ├── PromoStrip.tsx      ← 4 benefit icons
│   │   │   ├── CategorySection.tsx ← 8 category cards
│   │   │   └── FeaturedProducts.tsx← Featured products from API
│   │   └── products/
│   │       └── ProductCard.tsx     ← Reusable product card
│   ├── store/
│   │   ├── authStore.ts            ← Zustand auth (login/logout, persist)
│   │   └── cartStore.ts            ← Zustand cart (fetch/add/update/remove)
│   ├── lib/
│   │   ├── axios.ts                ← Axios instance (auto JWT, auto 401 logout)
│   │   └── utils.ts                ← formatPrice, getDiscountPercent, cn
│   └── types/
│       └── index.ts                ← All TypeScript interfaces
├── tailwind.config.ts              ← Colors, animations, screens
├── postcss.config.mjs              ← tailwindcss + autoprefixer (v3 config)
├── next.config.ts
└── package.json
```

---

## COMPLETE API REFERENCE

### BASE URL
```
http://localhost:8080
```

Axios instance (`src/lib/axios.ts`) auto-attaches:
```
Authorization: Bearer {token from localStorage "shopnow_token"}
```

---

### AUTH APIs

#### POST /api/auth/register
```json
// Request Body
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string"
}
// Response: AuthResponse { token, email, firstName, role }
```

#### POST /api/auth/login
```json
// Request Body
{ "email": "string", "password": "string" }
// Response: AuthResponse { token, email, firstName, role }
```

---

### PRODUCT APIs (Public — no auth needed)

#### GET /api/products
```
Query: ?page=0&size=12
Response: PageResponse<Product>
```

#### GET /api/products/featured
```
Response: Product[]
```

#### GET /api/products/search
```
Query: ?keyword=string&page=0&size=12
Response: PageResponse<Product>
```

#### GET /api/products/slug/{slug}
```
Response: Product (single product by URL slug)
```

#### GET /api/products/category/{categoryId}
```
Query: ?page=0&size=12
Response: PageResponse<Product>
```

---

### CATEGORY APIs (Public)

#### GET /api/categories
```
Response: Category[]
```

#### GET /api/categories/{id}
```
Response: Category
```

---

### CART APIs (Auth Required ✅)

#### GET /api/cart
```
Response: Cart { cartId, items: CartItem[], totalAmount, totalItems }
```

#### POST /api/cart/add
```json
// Request Body
{ "productId": number, "quantity": number }
// Response: Cart
```

#### PUT /api/cart/update
```json
// Request Body
{ "cartItemId": number, "quantity": number }
// Response: Cart
```

#### DELETE /api/cart/remove/{cartItemId}
```
Response: Cart
```

#### DELETE /api/cart/clear
```
Response: { "message": "Cart cleared successfully" }
```

---

### ORDER APIs (Auth Required ✅)

#### POST /api/orders
```json
// Request Body
{ "shippingAddress": "string" }
// Response: Order { id, orderNumber, status, totalAmount, items, ... }
```

#### GET /api/orders
```
Response: Order[]
```

#### GET /api/orders/{id}
```
Response: Order (single order detail)
```

---

### REVIEW APIs

#### POST /api/reviews/product/{productId}  (Auth Required ✅)
```json
// Request Body
{ "rating": 1-5, "comment": "string" }
// Response: Review
```

#### GET /api/reviews/product/{productId}  (Public)
```
Response: Review[]
```

#### DELETE /api/reviews/{reviewId}  (Auth Required ✅)
```
Response: "Review delete ho gya"
```

---

### ADDRESS APIs (Auth Required ✅)

#### POST /api/addresses
```json
{
  "fullName": "string",
  "phone": "string",
  "street": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "country": "Pakistan"
}
// Response: Address
```

#### GET /api/addresses
```
Response: Address[]
```

#### PUT /api/addresses/{id}
```
Request Body: same as POST
Response: Address
```

#### PUT /api/addresses/{id}/default
```
Response: Address (sets as default address)
```

#### DELETE /api/addresses/{id}
```
Response: "Address delete ho gya"
```

---

### WISHLIST APIs (Auth Required ✅)

#### POST /api/wishlist/{productId}
```
Response: string (toggle — adds if not exists, removes if exists)
```

#### GET /api/wishlist
```
Response: WishlistItem[]
```

#### GET /api/wishlist/check/{productId}
```
Response: boolean (true = in wishlist)
```

---

### COUPON APIs

#### POST /api/coupons/apply  (Public)
```
Query: ?code=string&amount=number
Response: { discountAmount: number, message: string }
```

#### POST /api/coupons  (Admin Only ✅)
```json
{
  "code": "string",
  "description": "string",
  "discountType": "PERCENTAGE | FIXED",
  "discountValue": number,
  "minimumAmount": number,
  "maximumDiscount": number,
  "usageLimit": number,
  "expiresAt": "datetime"
}
```

#### GET /api/coupons  (Admin Only ✅)
```
Response: Coupon[]
```

#### DELETE /api/coupons/{id}  (Admin Only ✅)

---

### ADMIN APIs (Admin Role Required ✅)

#### GET /api/admin/dashboard
```json
// Response
{
  "totalOrders": number,
  "totalRevenue": number,
  "totalUsers": number,
  "totalProducts": number,
  "pendingOrders": number,
  "monthlyRevenue": number
}
```

#### POST /api/products  (Admin)
#### PUT /api/products/{id}  (Admin)
#### DELETE /api/products/{id}  (Admin)
#### PATCH /api/products/{id}/stock?quantity=N  (Admin)
#### POST /api/categories  (Admin)
#### PUT /api/categories/{id}  (Admin)
#### DELETE /api/categories/{id}  (Admin)
#### PUT /api/orders/{id}/status?status=CONFIRMED|SHIPPED|DELIVERED|CANCELLED  (Admin)

---

## TYPESCRIPT INTERFACES

```typescript
// src/types/index.ts

interface User {
  email: string;
  firstName: string;
  role: "USER" | "ADMIN";
  token: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

interface Product {
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

interface CartItem {
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

interface Cart {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
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

interface Review {
  id: number;
  rating: number;
  comment: string;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  createdAt: string;
}

interface Address {
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

interface WishlistItem {
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

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
```

---

## STATE MANAGEMENT (Zustand)

### authStore
```typescript
// src/store/authStore.ts
// Persisted in localStorage key: "shopnow-auth"
// Token stored separately: localStorage "shopnow_token"

const { user, isLoggedIn, login, logout } = useAuthStore();

// login({ email, firstName, role, token })
// logout() — clears user + removes shopnow_token
```

### cartStore
```typescript
// src/store/cartStore.ts

const { cart, loading, fetchCart, addToCart, updateItem, removeItem, clearCart, itemCount } = useCartStore();

// fetchCart()                    → GET /api/cart
// addToCart(productId, qty)      → POST /api/cart/add
// updateItem(cartItemId, qty)    → PUT /api/cart/update
// removeItem(cartItemId)         → DELETE /api/cart/remove/{id}
// clearCart()                    → DELETE /api/cart/clear
// itemCount()                    → number (total quantity in cart)
```

---

## UTILITY FUNCTIONS

```typescript
// src/lib/utils.ts

import { formatPrice, getDiscountPercent, cn } from '@/lib/utils';

formatPrice(1500)              // → "Rs. 1,500"
getDiscountPercent(2000, 1500) // → 25 (percent)
cn('class1', condition && 'class2') // → merge classes
```

---

## CUSTOM CSS CLASSES (globals.css)

```css
.skeleton          /* Loading shimmer animation */
.product-card      /* Hover: translateY(-8px) + shadow */
.btn-primary       /* Red gradient button with hover glow */
.glass             /* Frosted glass effect */
.hero-gradient     /* Dark to red gradient */
.category-card     /* Hover scale(1.05) */
.line-clamp-1      /* Single line text truncation */
.line-clamp-2      /* Two line text truncation */
.no-scrollbar      /* Hide scrollbar */
.animate-fade-in-up
.animate-fade-in
.animate-bounce-in
.animate-float
.delay-100 through .delay-500
```

---

## TAILWIND COLORS

```
Primary:  #E40046
Dark:     #B8003A
Light:    #FF1A5E
```

Use in code:
```jsx
className="bg-red-600"          // primary
className="text-red-600"
className="border-red-600"
className="hover:bg-red-700"
```

---

## IMPORTANT NOTES

### 1. API URL Mismatch — cartStore
The cartStore uses these URLs:
```
PUT /api/cart/update    ← cartStore uses this
DELETE /api/cart/remove/{cartItemId}  ← cartStore uses this
```
Backend controller may use different paths — verify if issues occur.

### 2. Product Slug vs ID
- Always use `/api/products/slug/{slug}` for fetching by slug (NOT `/api/products/{slug}`)
- Reviews use productId, not slug: `/api/reviews/product/{productId}`

### 3. Auth Required Pages
These pages redirect to `/auth/login` if not logged in:
- `/cart`
- `/checkout`
- `/orders`
- `/wishlist`

### 4. Free Delivery Threshold
Rs. 2,000+ = free delivery (200 PKR otherwise)
This is currently hardcoded in cart and checkout pages.

### 5. Wishlist Toggle
`POST /api/wishlist/{productId}` — same endpoint for add AND remove (backend handles toggle logic).

### 6. CategorySection
Currently uses hardcoded categories. Can be connected to `GET /api/categories` for dynamic data.

### 7. Admin Panel
No admin panel frontend exists yet. Backend admin APIs are all ready.
- Dashboard: GET /api/admin/dashboard
- Product CRUD: POST/PUT/DELETE /api/products
- Order management: PUT /api/orders/{id}/status
- Coupon management: POST/GET/DELETE /api/coupons
- Category CRUD: POST/PUT/DELETE /api/categories

---

## MISSING / TODO PAGES

| Page | Status | Notes |
|------|--------|-------|
| `/orders/[id]` | ❌ Missing | Order detail page (orders list links to it) |
| `/admin` | ❌ Missing | Admin dashboard |
| `/admin/products` | ❌ Missing | Product management |
| `/admin/orders` | ❌ Missing | Order management |
| `/profile` | ❌ Missing | User profile + address management |
| `/products?category=X` | ⚠️ Partial | URL param exists but filter not fully wired |

---

## EXISTING PAGES SUMMARY

| Route | What it does |
|-------|-------------|
| `/` | Home: banner + categories + featured products |
| `/auth/login` | Login form → saves token, redirects home |
| `/auth/register` | Register form → auto-login, redirects home |
| `/products` | All products grid, search, pagination |
| `/products/[slug]` | Product detail, add to cart, reviews |
| `/cart` | Cart items, coupon, checkout button |
| `/checkout` | Address selection, place order |
| `/orders` | Orders list with progress bar |
| `/wishlist` | Wishlist items, add to cart |

---

## HOW TO RUN

```bash
# Frontend
cd D:/shopnow-frontend
npm run dev
# Runs on http://localhost:3000

# Backend (in separate terminal)
cd D:/shopnow-backend/backend
mvnw.cmd spring-boot:run
# Runs on http://localhost:8080
```

Environment variable (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## BACKEND ERROR: DATABASE CONNECTION FAILED

**Error**: `java.net.UnknownHostException: aws-1-ap-northeast-1.pooler.supabase.com`

This means backend cannot reach Supabase database. Check:
1. Internet connection is active
2. Supabase project is not paused (free tier pauses after inactivity)
3. `application.properties` has correct DB credentials
4. Supabase → Project Settings → Database → Connection string matches

---

*Document generated: March 2026 | ShopNow v1.0*
