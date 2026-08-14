'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { RotateCcw, RefreshCw, X } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { ReturnRequest, ReturnStatus } from '@/types';
import {
  RETURN_STATUS_META, RETURN_REASON_LABEL, RETURN_TYPE_LABEL, RETURN_ALLOWED_NEXT,
} from '@/lib/returnStatus';
import { formatPrice } from '@/lib/utils';
import { useRealtimeEvent } from '@/lib/useRealtime';
import Button from '@/components/ui/Button';

const FILTERS: (ReturnStatus | 'ALL')[] = ['ALL', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'COMPLETED', 'REJECTED'];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReturnStatus | 'ALL'>('ALL');

  // Action modal
  const [active, setActive] = useState<ReturnRequest | null>(null);
  const [target, setTarget] = useState<ReturnStatus>('APPROVED');
  const [note, setNote] = useState('');
  const [refund, setRefund] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = useCallback(() => {
    api.get('/api/admin/returns')
      .then(res => setReturns(res.data || []))
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);
  useRealtimeEvent('return.created', () => fetchReturns());

  const openAction = (r: ReturnRequest, status: ReturnStatus) => {
    setActive(r); setTarget(status); setNote(''); setRefund('');
  };

  const submitAction = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      const params: Record<string, string> = { status: target };
      if (note.trim()) params.inspectionNote = note.trim();
      if (target === 'COMPLETED' && active.type === 'RETURN' && refund.trim()) params.refundAmount = refund.trim();
      await api.put(`/api/admin/returns/${active.id}/status`, null, { params });
      toast.success(`Return ${RETURN_STATUS_META[target].label.toLowerCase()}`);
      setActive(null);
      fetchReturns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not update return');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? returns.length : returns.filter(r => r.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === 'ALL' ? returns : returns.filter(r => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <RotateCcw size={22} className="text-brand" /> Returns &amp; Exchanges
        </h1>
        <Button variant="outline" size="sm" onClick={fetchReturns}><RefreshCw size={14} /> Refresh</Button>
      </div>
      <p className="text-sm text-gray-500 mb-5">Review and process customer return requests</p>

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === f ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand'}`}>
            {f === 'ALL' ? 'All' : RETURN_STATUS_META[f].label} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">No return requests</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-900">{r.orderNumber}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-subtle text-ink-soft">
                      {RETURN_TYPE_LABEL[r.type]} · {RETURN_REASON_LABEL[r.reason]}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RETURN_STATUS_META[r.status].badge}`}>
                      {RETURN_STATUS_META[r.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.customerName} · {new Date(r.createdAt).toLocaleDateString('en-PK')}</p>
                  {r.description && <p className="text-sm text-gray-700 mt-2">{r.description}</p>}
                  {r.inspectionNote && <p className="text-sm text-ink-soft mt-1"><span className="font-semibold">Inspection:</span> {r.inspectionNote}</p>}
                  {typeof r.refundAmount === 'number' && <p className="text-sm text-green-700 font-semibold mt-1">Refund: {formatPrice(r.refundAmount)}</p>}
                  {r.evidenceImages.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {r.evidenceImages.map((url, i) => (
                        <Image key={i} src={url} alt={`evidence-${i}`} width={56} height={56} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {RETURN_ALLOWED_NEXT[r.status].map(next => (
                    <Button key={next} size="sm" variant={next === 'REJECTED' ? 'outline' : 'primary'} onClick={() => openAction(r, next)}>
                      {RETURN_STATUS_META[next].label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-gray-900">Mark as {RETURN_STATUS_META[target].label}</h3>
              <button onClick={() => setActive(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{active.orderNumber} · {RETURN_TYPE_LABEL[active.type]}</p>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Inspection note <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Notes for the record / customer..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm mb-4 resize-none" />

            {target === 'COMPLETED' && active.type === 'RETURN' && (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund amount (PKR)</label>
                <input type="number" value={refund} onChange={e => setRefund(e.target.value)} placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm mb-4" />
              </>
            )}

            <Button fullWidth loading={submitting} onClick={submitAction}>Confirm — {RETURN_STATUS_META[target].label}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
