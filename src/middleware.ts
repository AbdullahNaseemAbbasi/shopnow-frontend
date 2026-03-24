import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authRaw = request.cookies.get("shopnow-auth")?.value;

    if (!authRaw) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      const auth = JSON.parse(decodeURIComponent(authRaw));
      const user = auth?.state?.user;

      if (!user || user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
