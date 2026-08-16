import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// The /admin gate must NOT trust anything the client can forge. The session JWT is an HttpOnly
// cookie (unreadable/unwritable by page JS); here we forward it to the backend's authenticated
// /api/auth/me and admit the request only if the backend confirms an ADMIN. This verifies the
// signature AND the live DB role (so a ban or role change takes effect immediately), with no
// secret shared into the frontend. Fail closed: any missing cookie / non-200 / error → redirect.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const loginUrl = new URL("/auth/login", request.url);
  const token = request.cookies.get("shopnow-jwt")?.value;
  if (!token) return NextResponse.redirect(loginUrl);

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: `shopnow-jwt=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.redirect(loginUrl);
    const user = (await res.json()) as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
