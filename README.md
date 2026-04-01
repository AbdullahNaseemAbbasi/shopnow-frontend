<div align="center">

# ShopNow - E-Commerce Frontend

**Pakistan's Favorite Online Store**

A modern, full-featured e-commerce frontend built with Next.js, TypeScript, and Tailwind CSS.

[![Live Demo](https://img.shields.io/badge/Live_Demo-shopnow--frontend--bay.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://shopnow-frontend-bay.vercel.app)

</div>

---

## Features

**Customer**
- Product browsing with search, category filtering, and pagination
- Product detail page with image gallery, size & color selectors
- Shopping cart with coupon code support
- Checkout with address management
- Order tracking and history
- Wishlist and product reviews
- WhatsApp integration for quick inquiries
- Live viewer count and recent sales display

**Admin Panel**
- Dashboard with revenue, orders, and analytics
- Product management with multi-image upload (up to 15) and camera capture
- Dynamic sizes (S/M/L/XL) and color options per product
- Order status management (Pending → Confirmed → Shipped → Delivered)
- Category and coupon management

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=react&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend API running ([shopnow-ecommerce-backend](https://github.com/AbdullahNaseemAbbasi/shopnow-ecommerce-backend))

### Installation

```bash
git clone https://github.com/AbdullahNaseemAbbasi/shopnow-frontend.git
cd shopnow-frontend
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (dashboard, products, orders, categories, coupons)
│   ├── auth/               # Login & Register
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── orders/             # Order history & tracking
│   ├── products/           # Product listing & detail
│   ├── profile/            # Address management
│   ├── dashboard/          # User dashboard
│   └── wishlist/           # Wishlist
├── components/             # Reusable components (Navbar, Footer, ProductCard, etc.)
├── store/                  # Zustand stores (auth, cart)
├── lib/                    # API client, utilities
└── types/                  # TypeScript interfaces
```

---

## Deployment

Deployed on **Vercel** with automatic deployments from the `main` branch.

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

---

<div align="center">

**Built by [Abdullah Naseem Abbasi](https://github.com/AbdullahNaseemAbbasi)**

</div>
