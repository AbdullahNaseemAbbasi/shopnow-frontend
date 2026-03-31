import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'My Orders', href: '/orders' },
  { label: 'My Wishlist', href: '/wishlist' },
  { label: 'My Account', href: '/dashboard' },
  { label: 'My Addresses', href: '/profile' },
];

const SERVICE_LINKS = [
  { label: 'Track Your Order', href: '/orders' },
  { label: 'My Dashboard', href: '/dashboard' },
  { label: 'Login', href: '/auth/login' },
  { label: 'Create Account', href: '/auth/register' },
  { label: 'Browse Categories', href: '/products' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-[1600px] mx-auto px-8 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-xl font-black text-white">Shop<span className="text-blue-400">Now</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-slate-400">
              Pakistan's largest and most trusted online store. Quality products, fast delivery, and best prices guaranteed.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
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
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <MapPin size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-400">DHA Phase 6, Lahore, Pakistan</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-blue-400 flex-shrink-0" />
                <span className="text-sm text-slate-400">0300-1234567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-blue-400 flex-shrink-0" />
                <span className="text-sm text-slate-400">support@shopnow.pk</span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Download App</p>
              <div className="flex gap-2">
                <div className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 cursor-pointer transition-colors">App Store</div>
                <div className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 cursor-pointer transition-colors">Play Store</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">© 2026 ShopNow. All rights reserved.</p>
          <div className="flex gap-5 text-xs">
            <Link href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
