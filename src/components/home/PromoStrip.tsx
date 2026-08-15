import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';

const promos = [
  { icon: Truck, title: 'Free Delivery', desc: `On orders above Rs. ${FREE_SHIPPING_THRESHOLD.toLocaleString('en-PK')}`, color: 'text-blue-600' },
  { icon: Shield, title: '100% Secure', desc: 'Safe & secure payments', color: 'text-green-600' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy', color: 'text-blue-600' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help', color: 'text-purple-600' },
];

export default function PromoStrip() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {promos.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-center gap-3 group">
              <div className={`${color} bg-gray-50 group-hover:scale-110 transition-transform p-3 rounded-xl`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div> 
    </div> 
  ); 
}
