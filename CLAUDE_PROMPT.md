# ShopNow Frontend — Claude Code Prompt

Paste this entire prompt when starting a new Claude Code session for ShopNow frontend.

---

## PROMPT (Copy everything below this line)

---

Tum ShopNow ka frontend developer ho. Yeh Pakistan ka e-commerce platform hai (Daraz jaise). Mujhe tumse frontend ka kaam karwana hai.

**Working Directory**: `D:/shopnow-frontend`

**Tech Stack**:
- Next.js 16.2.1 (App Router) + TypeScript
- Tailwind CSS v3 (NOT v4 — postcss.config.mjs already fixed)
- Zustand (state management)
- Axios (HTTP — auto JWT token attach, auto 401 logout)
- React Hot Toast (notifications)
- Lucide React (icons)
- Backend on `http://localhost:8080`

---

## IMPORTANT RULES

1. **Sab kuch dynamic hoga** — koi static/mock data nahi, har cheez backend API se aayegi
2. **Har page clickable hoga** — koi broken link nahi
3. **Professional design** — Daraz/Amazon jaisa look, responsive, animated
4. **Urdu toast messages** — success/error messages Urdu mein
5. **Error handling** — har API call mein try/catch, toast.error() on failure
6. **Loading states** — skeleton loader ya spinner jab data load ho raha ho
7. **Auth check** — `/cart`, `/checkout`, `/orders`, `/wishlist` pages pe redirect to `/auth/login` agar logged out

---

## EXISTING STORES — USE THESE, DON'T RECREATE

```typescript
// useAuthStore (src/store/authStore.ts)
const { user, isLoggedIn, login, logout } = useAuthStore();
// user = { email, firstName, role: "USER"|"ADMIN", token }

// useCartStore (src/store/cartStore.ts)
const { cart, loading, fetchCart, addToCart, updateItem, removeItem, clearCart, itemCount } = useCartStore();
// cart = { cartId, items: CartItem[], totalAmount, totalItems }
```

## EXISTING LIB — USE THESE

```typescript
import api from '@/lib/axios';          // Axios with auto JWT
import { formatPrice, getDiscountPercent, cn } from '@/lib/utils';
// formatPrice(1500) → "Rs. 1,500"
// getDiscountPercent(2000, 1500) → 25
```

## EXISTING CSS CLASSES — USE THESE

```css
.btn-primary       /* Red gradient button */
.skeleton          /* Loading shimmer */
.product-card      /* Hover lift effect */
.line-clamp-2      /* 2-line text truncation */
.glass             /* Frosted glass */
.animate-fade-in-up
```

---

## ALL API ENDPOINTS

### No Auth Required (Public)
```
GET  /api/products              ?page=0&size=12          → PageResponse<Product>
GET  /api/products/featured                              → Product[]
GET  /api/products/search       ?keyword=X&page=0&size=12 → PageResponse<Product>
GET  /api/products/slug/{slug}                           → Product
GET  /api/products/category/{categoryId}  ?page=0&size=12 → PageResponse<Product>
GET  /api/categories                                     → Category[]
GET  /api/reviews/product/{productId}                    → Review[]
POST /api/coupons/apply         ?code=X&amount=N         → { discountAmount, message }
POST /api/auth/login            body: {email, password}  → AuthResponse
POST /api/auth/register         body: {firstName, lastName, email, password} → AuthResponse
```

### Auth Required (add Bearer token — axios does this automatically)
```
GET    /api/cart                                         → Cart
POST   /api/cart/add            body: {productId, quantity} → Cart
PUT    /api/cart/update         body: {cartItemId, quantity} → Cart
DELETE /api/cart/remove/{cartItemId}                    → Cart
DELETE /api/cart/clear                                  → message

GET    /api/orders                                      → Order[]
GET    /api/orders/{id}                                 → Order
POST   /api/orders              body: {shippingAddress} → Order

GET    /api/addresses                                   → Address[]
POST   /api/addresses           body: {fullName, phone, street, city, state, postalCode, country}
PUT    /api/addresses/{id}
PUT    /api/addresses/{id}/default
DELETE /api/addresses/{id}

GET    /api/wishlist                                    → WishlistItem[]
POST   /api/wishlist/{productId}                       → toggle (add/remove)
GET    /api/wishlist/check/{productId}                 → boolean

POST   /api/reviews/product/{productId}  body: {rating: 1-5, comment}  → Review
DELETE /api/reviews/{reviewId}
```

### Admin Only (role === "ADMIN")
```
GET    /api/admin/dashboard     → { totalOrders, totalRevenue, totalUsers, totalProducts, pendingOrders, monthlyRevenue }
POST   /api/products            body: {name, slug, description, price, salePrice, stock, imageUrl, categoryId, featured, active}
PUT    /api/products/{id}
DELETE /api/products/{id}
PATCH  /api/products/{id}/stock  ?quantity=N
POST   /api/categories          body: {name, description, imageUrl}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
PUT    /api/orders/{id}/status   ?status=CONFIRMED|SHIPPED|DELIVERED|CANCELLED
GET    /api/coupons
POST   /api/coupons             body: {code, discountType: "PERCENTAGE|FIXED", discountValue, ...}
DELETE /api/coupons/{id}
```

---

## TYPESCRIPT INTERFACES

```typescript
interface User { email: string; firstName: string; role: "USER"|"ADMIN"; token: string; }
interface Category { id: number; name: string; slug: string; description?: string; imageUrl?: string; }
interface Product { id: number; name: string; slug: string; description?: string; price: number; salePrice?: number; stock: number; imageUrl?: string; featured: boolean; active: boolean; categoryId: number; categoryName: string; averageRating: number; totalReviews: number; }
interface CartItem { cartItemId: number; productId: number; productName: string; productSlug: string; imageUrl?: string; price: number; salePrice?: number; stock: number; quantity: number; subtotal: number; }
interface Cart { cartId: number; items: CartItem[]; totalAmount: number; totalItems: number; }
interface Order { id: number; orderNumber: string; status: "PENDING"|"CONFIRMED"|"SHIPPED"|"DELIVERED"|"CANCELLED"; paymentStatus: "UNPAID"|"PAID"|"REFUNDED"; shippingAddress: string; totalAmount: number; items: OrderItem[]; totalItems: number; createdAt: string; updatedAt: string; }
interface OrderItem { id: number; productId: number; productName: string; quantity: number; price: number; subtotal: number; }
interface Review { id: number; rating: number; comment: string; productId: number; productName: string; userId: number; userName: string; createdAt: string; }
interface Address { id: number; fullName: string; phone: string; street: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean; fullAddress: string; }
interface WishlistItem { id: number; productId: number; productName: string; productSlug?: string; productImage?: string; price: number; salePrice?: number; inStock: boolean; addedAt: string; }
interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; size: number; number: number; first: boolean; last: boolean; }
```

---

## EXISTING PAGES (Already built — don't recreate unless fixing)

| Route | File | Status |
|-------|------|--------|
| `/` | app/page.tsx | ✅ Done |
| `/auth/login` | app/auth/login/page.tsx | ✅ Done |
| `/auth/register` | app/auth/register/page.tsx | ✅ Done |
| `/products` | app/products/page.tsx | ✅ Done |
| `/products/[slug]` | app/products/[slug]/page.tsx | ✅ Done |
| `/cart` | app/cart/page.tsx | ✅ Done |
| `/checkout` | app/checkout/page.tsx | ✅ Done |
| `/orders` | app/orders/page.tsx | ✅ Done |
| `/wishlist` | app/wishlist/page.tsx | ✅ Done |

---

## MISSING PAGES (Need to be built)

### Priority 1 — User Pages
- `/orders/[id]` — Order detail page (orders list already links to `/orders/${order.id}`)
- `/profile` — User profile + saved addresses CRUD

### Priority 2 — Admin Pages
- `/admin` — Admin dashboard with stats cards
- `/admin/products` — Product list + add/edit/delete
- `/admin/orders` — All orders list + status update
- `/admin/categories` — Category management
- `/admin/coupons` — Coupon management

---

## DESIGN SYSTEM

**Primary Color**: `#E40046` (red) — use `red-600` in Tailwind
**Background**: `#f5f5f5` (light gray)
**Cards**: `bg-white rounded-2xl shadow-sm border border-gray-100`
**Buttons**: use `.btn-primary` class for main CTA buttons
**Font**: Inter (loaded in layout.tsx)
**Spacing**: `px-4 py-8` for page containers, `max-w-7xl mx-auto` for max width

**Standard page template**:
```tsx
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* content */}
  </div>
</div>
```

**Standard card template**:
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  {/* content */}
</div>
```

**Standard loading skeleton**:
```tsx
<div className="skeleton h-4 w-full rounded" />
```

**Standard empty state**:
```tsx
<div className="text-center py-20">
  <div className="text-6xl mb-4">📦</div>
  <h3 className="text-xl font-bold text-gray-700 mb-2">Kuch nahi mila</h3>
  <p className="text-gray-400 mb-6">Description</p>
  <Link href="/products" className="btn-primary text-white px-6 py-3 rounded-xl font-semibold text-sm inline-block">
    Wapas Jaein
  </Link>
</div>
```

---

## COMMON PATTERNS

### Fetch data on page load:
```tsx
useEffect(() => {
  api.get('/api/endpoint')
    .then(res => setData(res.data))
    .catch(() => toast.error('Data load nahi hua'))
    .finally(() => setLoading(false));
}, []);
```

### Add to cart:
```tsx
const { addToCart } = useCartStore();
const { isLoggedIn } = useAuthStore();

const handleAddToCart = async () => {
  if (!isLoggedIn) { toast.error('Pehle login karein!'); return; }
  try {
    await addToCart(productId, quantity);
    toast.success('Cart mein add ho gaya! 🛒');
  } catch { toast.error('Dobara try karein'); }
};
```

### Auth guard:
```tsx
useEffect(() => {
  if (!isLoggedIn) { router.push('/auth/login'); return; }
  // fetch data
}, [isLoggedIn, router]);

if (!isLoggedIn) return null;
```

### API call with auth:
```tsx
// axios instance already has token — just call normally:
const res = await api.get('/api/protected-endpoint');
const res = await api.post('/api/endpoint', { body });
```

---

## BACKEND IS 100% COMPLETE

Backend pe koi kaam nahi karna. Sirf frontend pe kaam karo. Backend Spring Boot hai, port 8080 pe chalta hai. Sab APIs ready hain.

Agar backend band ho ya connect na ho, frontend pe kaam karte raho — mock data fallback use karo temporarily.

---

*ShopNow Frontend Guide | March 2026*
