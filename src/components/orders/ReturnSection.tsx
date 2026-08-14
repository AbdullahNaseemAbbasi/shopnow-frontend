'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { RotateCcw, X, Upload, Loader2, PackageCheck } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRealtimeEvent } from '@/lib/useRealtime';
import type { ReturnRequest, ReturnReason, ReturnType } from '@/types';
import { RETURN_STATUS_META, RETURN_REASON_LABEL, RETURN_TYPE_LABEL } from '@/lib/returnStatus';
import Button from '@/components/ui/Button';

const REASONS: ReturnReason[] = ['DAMAGED', 'WRONG_ITEM', 'WRONG_SIZE', 'QUALITY_ISSUE', 'OTHER'];

// Return/exchange entry point on the order detail page. Shows the request button when the order
// is delivered and has no active return, otherwise surfaces the existing return's status.
export default function ReturnSection({ orderId, orderStatus }: { orderId: number; orderStatus: string }) {
  const [existing, setExisting] = useState<ReturnRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReturnType>('RETURN');
  const [reason, setReason] = useState<ReturnReason>('DAMAGED');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadReturns = useCallback(() => {
    api.get('/api/returns')
      .then(res => {
        const mine = (res.data as ReturnRequest[]).filter(r => r.orderId === orderId);
        setExisting(mine[0] ?? null); // list is newest-first
      })
      .catch(() => {});
  }, [orderId]);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  // Live-refresh when the admin advances this return.
  useRealtimeEvent('return.updated', (data) => {
    if (Number(data.orderId) === orderId) loadReturns();
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        urls.push(res.data.url);
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    setImages(prev => [...prev, ...urls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/returns', { orderId, type, reason, description: description.trim() || null, evidenceImages: images });
      toast.success('Return request submitted!');
      setOpen(false);
      setDescription(''); setImages([]); setType('RETURN'); setReason('DAMAGED');
      loadReturns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const canRequest = orderStatus === 'DELIVERED' && (!existing || existing.status === 'REJECTED');

  // Nothing to show unless the order is delivered or a return already exists.
  if (orderStatus !== 'DELIVERED' && !existing) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
      <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2">
        <RotateCcw size={16} className="text-brand" /> Returns &amp; Exchanges
      </h2>

      {existing && (
        <div className="flex items-center justify-between gap-3 mb-3 p-3 rounded-xl bg-surface-subtle">
          <div>
            <p className="text-sm font-semibold text-ink">
              {RETURN_TYPE_LABEL[existing.type]} — {RETURN_REASON_LABEL[existing.reason]}
            </p>
            <p className="text-xs text-ink-muted">Requested {new Date(existing.createdAt).toLocaleDateString('en-PK')}</p>
            {existing.inspectionNote && <p className="text-xs text-ink-soft mt-1">Note: {existing.inspectionNote}</p>}
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap ${RETURN_STATUS_META[existing.status].badge}`}>
            {RETURN_STATUS_META[existing.status].label}
          </span>
        </div>
      )}

      {canRequest ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <RotateCcw size={14} /> Request a return or exchange
        </Button>
      ) : !existing ? (
        <p className="text-sm text-ink-muted">You can request a return once the order is delivered.</p>
      ) : null}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-gray-900">Request Return / Exchange</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['RETURN', 'EXCHANGE'] as ReturnType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${type === t ? 'border-brand bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {RETURN_TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value as ReturnReason)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm mb-4">
              {REASONS.map(r => <option key={r} value={r}>{RETURN_REASON_LABEL[r]}</option>)}
            </select>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Details <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Tell us what went wrong..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm mb-4 resize-none" />

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Evidence photos <span className="font-normal text-gray-400">(optional)</span></label>
            <div className="flex flex-wrap gap-2 mb-4">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16">
                  <Image src={url} alt={`evidence-${i}`} width={64} height={64} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-danger text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">×</button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </div>

            <Button fullWidth loading={submitting} onClick={submit}>
              <PackageCheck size={16} /> Submit request
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
