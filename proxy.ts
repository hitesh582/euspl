import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { validateAndRotateRememberMeToken, REMEMBER_ME_COOKIE_NAME } from "@/lib/auth";

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

  // Step 1: Try session token first
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
      // Session token invalid, try remember-me token
    }
  }

  // Step 2: Try remember-me token
  const rememberToken = request.cookies.get(REMEMBER_ME_COOKIE_NAME)?.value;
  
  if (rememberToken) {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      const result = await validateAndRotateRememberMeToken(rememberToken, userAgent);
      
      if (result) {
        // Token is valid, set new cookie with rotated token
        const response = NextResponse.next();
        
        // Calculate maxAge in seconds from expiresAt
        const now = new Date();
        const maxAge = Math.floor((result.expiresAt.getTime() - now.getTime()) / 1000);
        
        // Set new remember-me cookie with rotated token
        response.cookies.set(REMEMBER_ME_COOKIE_NAME, result.newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: maxAge > 0 ? maxAge : 30 * 24 * 60 * 60, // 30 days fallback
          path: "/",
        });
        
        // Set headers for API routes
        if (pathname.startsWith("/api/")) {
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set("x-user-id", result.user.userId);
          requestHeaders.set("x-user-email", result.user.email);
          requestHeaders.set("x-user-role", result.user.role);
          return NextResponse.next({ 
            request: { headers: requestHeaders },
            headers: response.headers 
          });
        }
        
        return response;
      }
    } catch (error) {
      console.error("Remember-me token validation error:", error);
    }
  }

  // Step 3: No valid token, redirect to login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("auth_token");
  response.cookies.delete(REMEMBER_ME_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico)$).*)",
  ],
};
