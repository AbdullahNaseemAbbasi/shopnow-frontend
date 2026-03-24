import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-xl font-black text-white">Shop<span className="text-red-500">Now</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-4">Pakistan ka sabse bada aur trusted online store. Quality products, fast delivery, aur best prices.</p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Careers', 'Press', 'Blog', 'Affiliate Program'].map(link => (
                <li key={link}><Link href="#" className="hover:text-red-400 transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              {['Help Center', 'Track Your Order', 'Returns & Refunds', 'Payment Methods', 'Shipping Info'].map(link => (
                <li key={link}><Link href="#" className="hover:text-red-400 transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" /><span>DHA Phase 6, Lahore, Pakistan</span></li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-red-500" /><span>0300-1234567</span></li>
              <li className="flex items-center gap-2"><Mail size={16} className="text-red-500" /><span>support@shopnow.pk</span></li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Download App</p>
              <div className="flex gap-2">
                <div className="bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors">App Store</div>
                <div className="bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors">Play Store</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© 2026 ShopNow. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <Link href="#" className="hover:text-red-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-red-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-red-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
