import type { Config } from 'tailwindcss'

// ShopNow Design System — "Premium Rose"
// Single source of truth for colour. The brand accent is a rose-red anchored on #E40046.
// NOTE: Tailwind's built-in `blue` scale is deliberately remapped onto the brand scale so the
// ~300 legacy `blue-*` utilities across the app instantly render on-brand. New code should
// prefer the semantic tokens (`brand`, `ink`, `surface`, `success`…) rather than `blue-*`.
const brand = {
  50: '#FFF1F4',
  100: '#FFE0E7',
  200: '#FFC2D1',
  300: '#FF94AF',
  400: '#FF5583',
  500: '#FF1E5E',
  600: '#E40046', // DEFAULT brand
  700: '#B8003A',
  800: '#970032',
  900: '#7D062F',
  950: '#45010F',
}

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent (rose-red). Use as bg-brand, text-brand, bg-brand-700, etc.
        brand: { ...brand, DEFAULT: brand[600] },
        // Back-compat alias kept for the `primary` name used in a few places.
        primary: { DEFAULT: brand[600], dark: brand[700], light: brand[500] },
        // Legacy re-skin: every existing blue-* utility now resolves to the brand scale.
        blue: brand,
        // Ink = near-black text / premium dark surfaces.
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        // Neutral surfaces.
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          subtle: '#F1F5F9',
        },
        line: '#E2E8F0',
        // Semantic — kept distinct from the brand red so state is never ambiguous.
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 32px rgba(15, 23, 42, 0.12)',
        brand: '0 8px 24px rgba(228, 0, 70, 0.28)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'bounce-in': 'bounceIn 0.5s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
