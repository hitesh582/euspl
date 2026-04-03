import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qr-attendance-secret-key-2024-change-in-prod"
);

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];
const GUARD_ONLY_PATHS = ["/scan"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = payload.role as string;

      if (pathname.startsWith("/api/")) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", payload.userId as string);
        requestHeaders.set("x-user-email", payload.email as string);
        requestHeaders.set("x-user-role", role);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }

      return NextResponse.next();
    } catch {
      // Session token invalid
    }
  }

  // No valid token, redirect to login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("auth_token");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico)$).*)",
  ],
};
