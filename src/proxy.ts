import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured.");
  return encoder.encode(secret);
}

async function getSessionPayload(request: NextRequest) {
  const token = request.cookies.get("etailor_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes — super admin only
  if (pathname.startsWith("/admin")) {
    const payload = await getSessionPayload(request);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (payload.platformRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect portal routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/audit")
  ) {
    const payload = await getSessionPayload(request);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/customers/:path*",
    "/jobs/:path*",
    "/billing/:path*",
    "/messages/:path*",
    "/team/:path*",
    "/search/:path*",
    "/audit/:path*",
  ],
};