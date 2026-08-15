'use client';

// Last-resort boundary for errors thrown in the root layout itself (where the normal error.tsx
// can't render because the layout failed). Must supply its own <html>/<body>. Kept dependency-free
// and inline-styled so it works even if the app's CSS/layout is what broke.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#F8FAFC', color: '#0F172A' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#64748B', marginTop: '0.5rem', maxWidth: '28rem' }}>
            The page failed to load. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: '1.5rem', background: '#E40046', color: '#fff', fontWeight: 700, border: 'none', padding: '0.7rem 1.4rem', borderRadius: '9999px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
