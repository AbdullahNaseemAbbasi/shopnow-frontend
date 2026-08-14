'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Storefront social proof, driven by the backend's public SSE channel (no auth).
// Shows a live "viewing now" badge and toasts real "someone just bought X" sales.
export default function SocialProof() {
  const [viewers, setViewers] = useState(0);
  const lastSale = useRef(0);

  useEffect(() => {
    const es = new EventSource(`${API}/api/realtime/public`);

    const onViewers = (raw: string) => {
      try {
        const d = JSON.parse(raw);
        const n = typeof d.count === 'number' ? d.count : d.viewers;
        if (typeof n === 'number') setViewers(n);
      } catch { /* ignore malformed */ }
    };
    es.addEventListener('connected', (e) => onViewers((e as MessageEvent).data));
    es.addEventListener('viewers', (e) => onViewers((e as MessageEvent).data));

    es.addEventListener('sale', (e) => {
      // Throttle so a burst of orders can't spam the storefront.
      const now = Date.now();
      if (now - lastSale.current < 4000) return;
      lastSale.current = now;
      try {
        const d = JSON.parse((e as MessageEvent).data);
        const extra = d.extraItems > 0 ? ` + ${d.extraItems} more` : '';
        toast(`Someone just bought ${d.productName}${extra}!`, { icon: '🛍️', duration: 5000 });
      } catch { /* ignore malformed */ }
    });

    // EventSource reconnects on its own; nothing to do on error.
    return () => es.close();
  }, []);

  if (viewers < 1) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {viewers} {viewers === 1 ? 'person' : 'people'} viewing now
    </div>
  );
}
