import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qr-attendance-secret-key-2024-change-in-prod"
);

const COOKIE_NAME = "auth_token";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days, matches JWT expiration
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export type UserRole = "user" | "admin" | "guard";

export const ALLOWED_ROLES: UserRole[] = ["user", "admin", "guard"];

export async function requireRole(allowedRoles: UserRole[]): Promise<JWTPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (!allowedRoles.includes(session.role as UserRole)) return null;
  return session;
}

export { COOKIE_NAME };
