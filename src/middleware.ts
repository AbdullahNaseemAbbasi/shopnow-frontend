import { NextResponse } from "next/server";

// The /admin gate is NOT enforced here, on purpose.
//
// The session JWT is an HttpOnly cookie set on the BACKEND's domain (Railway). In a cross-domain
// deployment — frontend on Vercel, backend on Railway — that cookie is NOT present on requests to
// the frontend's own origin, so this edge middleware literally cannot read or verify it. Gating on
// it here just redirected every admin away from /admin (the bug this replaces). It happened to work
// locally only because localhost:3000 and localhost:8080 share the `localhost` cookie domain.
//
// Access is still controlled in two places that DO work cross-domain:
//   1. Client-side — src/app/admin/layout.tsx redirects non-admins / anonymous users.
//   2. Authoritatively — every admin API is @PreAuthorize("hasRole('ADMIN')") on the backend, which
//      reads the cookie because the browser sends it to the backend's own origin (withCredentials).
//
// If the app is ever served from a single origin (custom domain, or a same-origin /api proxy),
// restore a verified check here by fetching /api/auth/me with the then-readable cookie.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
