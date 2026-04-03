import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSession,
  signToken,
  setSessionCookie,
  validateAndRotateRememberMeToken,
  setRememberMeCookie,
  clearRememberMeCookie,
  REMEMBER_ME_COOKIE_NAME,
} from "@/lib/auth";

export async function GET(req: Request) {
  // Try the normal session cookie first
  const session = await getSession();
  if (session) {
    return NextResponse.json({ user: session });
  }

  // Session cookie missing/expired — check for remember-me cookie
  const cookieStore = await cookies();
  const rememberMeToken = cookieStore.get(REMEMBER_ME_COOKIE_NAME)?.value;

  if (!rememberMeToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate and rotate the remember-me token
  const userAgent =
    (req.headers as any).get?.("user-agent") || "unknown";
  const result = await validateAndRotateRememberMeToken(
    rememberMeToken,
    userAgent
  );

  if (!result) {
    // Token invalid/expired — clear the stale cookie
    await clearRememberMeCookie();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-create the session from the remember-me token
  const newJwt = await signToken(result.user);
  await setSessionCookie(newJwt, true); // persist with 30-day maxAge
  await setRememberMeCookie(result.newToken, result.expiresAt);

  return NextResponse.json({ user: result.user });
}
