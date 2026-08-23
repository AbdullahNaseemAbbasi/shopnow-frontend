import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

const promos = [
  { icon: Truck, title: 'Fast Delivery', desc: '3–5 day nationwide shipping', color: 'text-brand-600' },
  { icon: Shield, title: '100% Secure', desc: 'Safe & secure payments', color: 'text-green-600' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy', color: 'text-brand-600' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help', color: 'text-brand' },
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
