// Session token used as the Authorization: Bearer credential for API calls.
//
// This app is deployed cross-domain (frontend on Vercel, backend on Railway). The backend's
// HttpOnly session cookie is therefore a THIRD-PARTY cookie, which modern browsers block by
// default — so the cookie alone cannot keep a session alive in the browser (the app appeared to
// "log itself out" on every reload/navigation once the in-memory token was gone). We persist the
// JWT here and send it as a Bearer header, which works reliably cross-domain and survives reloads.
// The backend still enforces every protected route via @PreAuthorize; logout clears this token.
const KEY = 'shopnow_token';

function read(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

// Seed from storage at module load so a page reload keeps the session.
let token: string | null = read();

export function setAuthToken(next: string | null | undefined) {
  token = next && next.length > 0 ? next : null;
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — session still works for this page via the in-memory value */
  }
}

export function getAuthToken(): string | null {
  if (token === null) token = read();
  return token;
}
