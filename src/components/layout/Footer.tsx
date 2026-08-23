import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import NewsletterForm from '@/components/layout/NewsletterForm';

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
  { Icon: Twitter, href: 'https://twitter.com/shopnow_pk', label: 'Twitter' },
  { Icon: Youtube, href: 'https://youtube.com/@shopnowpk', label: 'YouTube' },
];

const WHATSAPP = 'https://wa.me/923248234639';

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
                <span className="text-sm text-slate-400">DHA Phase 6, Lahore, Pakistan</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-brand-400 flex-shrink-0" />
                <a href="tel:+923248234639" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">03072243897</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-brand-400 flex-shrink-0" />
                <a href="mailto:support@shopnow.pk" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">support@shopnow.pk</a>
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
