import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { 
  clearSessionCookie, 
  clearRememberMeCookie,
  hashToken,
  invalidateRememberMeToken,
  REMEMBER_ME_COOKIE_NAME
} from "@/lib/auth";

export async function POST() {
  // Extract remember-me token from cookie if present
  const cookieStore = await cookies();
  const rememberMeToken = cookieStore.get(REMEMBER_ME_COOKIE_NAME)?.value;
  
  // If remember-me token exists, invalidate it
  if (rememberMeToken) {
    try {
      // Hash the token to match database storage
      const tokenHash = hashToken(rememberMeToken);
      
      // Remove token from database
      await invalidateRememberMeToken(tokenHash);
      
      // Clear the remember-me cookie
      await clearRememberMeCookie();
    } catch (error) {
      // Log error but continue with session logout
      console.error("Failed to invalidate remember-me token:", error);
    }
  }
  
  // Clear session cookie (existing logout logic)
  await clearSessionCookie();
  
  return NextResponse.json({ success: true });
}
