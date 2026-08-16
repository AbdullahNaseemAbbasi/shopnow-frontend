// In-memory session token, used only as an Authorization: Bearer fallback for API calls within
// the current page life. It is deliberately NOT persisted to localStorage — that surface is
// readable by any XSS/extension and was the app's biggest token-theft exposure. The durable
// session lives in the backend-set HttpOnly cookie (unreadable to JS), which authenticates
// requests via `withCredentials` and survives reloads; this holder just avoids a cookie round
// trip while the tab is alive and is cleared on logout.
let token: string | null = null;

export function setAuthToken(next: string | null | undefined) {
  token = next && next.length > 0 ? next : null;
}

export function getAuthToken(): string | null {
  return token;
}
