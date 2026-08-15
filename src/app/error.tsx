'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

// Route-level error boundary. Catches render/runtime errors in any page and shows a branded
// recovery screen (with a retry) instead of a broken/blank page. Rendered inside the app layout,
// so the navbar/footer stay.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface it in the console for debugging; a real logging sink would go here.
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
        <AlertTriangle className="text-brand" size={30} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-ink">Something went wrong</h1>
      <p className="mt-2 text-ink-muted max-w-md">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand text-white font-bold px-5 py-2.5 rounded-full hover:bg-brand-700 transition-colors shadow-brand"
        >
          <RotateCcw size={18} /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-line text-ink font-bold px-5 py-2.5 rounded-full hover:border-brand-300 hover:text-brand transition-colors"
        >
          <Home size={18} /> Back to home
        </Link>
      </div>
    </div>
  );
}
