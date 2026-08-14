'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RotateCcw, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import type { ReturnRequest } from '@/types';
import { RETURN_STATUS_META, RETURN_REASON_LABEL, RETURN_TYPE_LABEL } from '@/lib/returnStatus';
import { formatPrice } from '@/lib/utils';
import { useRealtimeEvent } from '@/lib/useRealtime';

export default function MyReturnsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(() => {
    api.get('/api/returns')
      .then(res => setReturns(res.data || []))
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    fetchReturns();
  }, [isLoggedIn, router, fetchReturns]);

  useRealtimeEvent('return.updated', () => fetchReturns());

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
          <RotateCcw size={22} className="text-brand" /> My Returns
        </h1>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No return requests yet</h3>
            <p className="text-gray-400 mb-6 text-sm">You can request a return from any delivered order.</p>
            <Link href="/orders" className="btn-primary text-white px-6 py-3 rounded-xl font-bold text-sm inline-block">View Orders</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map(r => (
              <Link key={r.id} href={`/orders/${r.orderId}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-brand-200 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-900">{r.orderNumber}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RETURN_STATUS_META[r.status].badge}`}>
                        {RETURN_STATUS_META[r.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{RETURN_TYPE_LABEL[r.type]} · {RETURN_REASON_LABEL[r.reason]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-PK')}</p>
                    {typeof r.refundAmount === 'number' && <p className="text-sm text-green-700 font-semibold mt-1">Refunded {formatPrice(r.refundAmount)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {r.evidenceImages.length > 0 && (
                      <Image src={r.evidenceImages[0]} alt="evidence" width={48} height={48} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    )}
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
