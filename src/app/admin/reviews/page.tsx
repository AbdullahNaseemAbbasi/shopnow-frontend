'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, Check, X, BadgeCheck, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { Review } from '@/types';

const STATUS_META: Record<string, { label: string; badge: string }> = {
  PENDING:  { label: 'Pending',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', badge: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', badge: 'bg-red-50 text-red-600 border-red-200' },
};
const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const fetchReviews = (f = filter) => {
    setLoading(true);
    api.get<Review[]>('/api/reviews/admin', { params: f === 'ALL' ? {} : { status: f } })
      .then((res) => setReviews(res.data || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(filter); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const moderate = async (id: number, status: 'APPROVED' | 'REJECTED', reasonText?: string) => {
    setActioningId(id);
    try {
      await api.patch(`/api/reviews/${id}/moderate?status=${status}`, status === 'REJECTED' ? { reason: reasonText || '' } : {});
      toast.success(status === 'APPROVED' ? 'Review approved' : 'Review rejected');
      setRejectingId(null);
      setReason('');
      fetchReviews(filter);
    } catch {
      toast.error('Action failed');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm">Moderate customer reviews — approve or reject inappropriate ones</p>
        </div>
        <button onClick={() => fetchReviews(filter)} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand'}`}>
            {s === 'ALL' ? 'All' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 text-gray-400">No reviews here.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const meta = STATUS_META[review.status ?? 'APPROVED'] ?? STATUS_META.APPROVED;
            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900 text-sm">{review.productName}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>{meta.label}</span>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <BadgeCheck size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={13} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {review.userName} · {new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {review.status !== 'APPROVED' && (
                      <button onClick={() => moderate(review.id, 'APPROVED')} disabled={actioningId === review.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60">
                        <Check size={13} /> Approve
                      </button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <button onClick={() => { setRejectingId(rejectingId === review.id ? null : review.id); setReason(''); }} disabled={actioningId === review.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-danger-light text-danger border border-danger/20 hover:brightness-95 transition-colors disabled:opacity-60">
                        <X size={13} /> Reject
                      </button>
                    )}
                  </div>
                </div>

                {review.comment && <p className="text-sm text-gray-700 leading-relaxed mt-3">{review.comment}</p>}

                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.images.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90">
                        <Image src={url} alt={`Review photo ${i + 1}`} fill sizes="64px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {review.status === 'REJECTED' && review.rejectionReason && (
                  <p className="text-xs text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">Rejection note: {review.rejectionReason}</p>
                )}

                {rejectingId === review.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                      placeholder="Reason for rejection (stored internally, optional)"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand resize-none mb-2" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setRejectingId(null); setReason(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button onClick={() => moderate(review.id, 'REJECTED', reason)} disabled={actioningId === review.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-danger text-white hover:brightness-95 disabled:opacity-60">
                        Confirm reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
