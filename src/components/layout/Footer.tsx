import Link from 'next/link';
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import NewsletterForm from '@/components/layout/NewsletterForm';

// lucide-react has no TikTok brand glyph, so render it as an inline SVG that mirrors the lucide
// icon API (a `size` prop) — used the same way as the other social icons below.
function TikTok({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const QUICK_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'My Orders', href: '/orders' },
  { label: 'My Wishlist', href: '/wishlist' },
  { label: 'My Account', href: '/dashboard' },
  { label: 'My Addresses', href: '/profile' },
];

const SERVICE_LINKS = [
  { label: 'Track Your Order', href: '/orders' },
  { label: 'Shipping & Returns', href: '/shipping-returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Browse Categories', href: '/products' },
];

const SOCIALS = [
  { Icon: Facebook, href: 'https://facebook.com/shopnow.pk', label: 'Facebook' },
  { Icon: Instagram, href: 'https://instagram.com/shopnow.pk', label: 'Instagram' },
  { Icon: TikTok, href: 'https://tiktok.com/@shopnow.pk', label: 'TikTok' },
  { Icon: Linkedin, href: 'https://linkedin.com/company/shopnow-pk', label: 'LinkedIn' },
];

const WHATSAPP = 'https://wa.me/923072243897';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Newsletter + WhatsApp CTA */}
      <div className="border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-white font-black text-lg">Join the ShopNow list</h3>
            <p className="text-sm text-slate-400 mt-0.5">New arrivals, exclusive offers and sale alerts — straight to your inbox.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <NewsletterForm />
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
              <MessageCircle size={16} fill="currentColor" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-xl font-black text-white">Shop<span className="text-brand-400">Now</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-slate-400">
              Pakistan&apos;s trusted online fashion store. Quality products, fast delivery, and best prices guaranteed.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 bg-slate-800 hover:bg-brand rounded-lg flex items-center justify-center transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Customer Service</h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-400">HBCHS Hub River Road, Naval Colony, Karachi</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-brand-400 flex-shrink-0" />
                <a href="tel:+923072243897" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">0307-2243897</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-brand-400 flex-shrink-0" />
                <a href="mailto:elafqazi1407@gmail.com" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">elafqazi1407@gmail.com</a>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">We accept</p>
              <div className="flex flex-wrap gap-2">
                {['COD', 'Card', 'EasyPaisa', 'JazzCash'].map((m) => (
                  <span key={m} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">© 2026 ShopNow. All rights reserved.</p>
          <div className="flex gap-5 text-xs">
            <Link href="/privacy" className="text-slate-500 hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-500 hover:text-brand-400 transition-colors">Terms of Service</Link>
            <Link href="/shipping-returns" className="text-slate-500 hover:text-brand-400 transition-colors">Shipping &amp; Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
