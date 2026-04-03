import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { 
  signToken, 
  setSessionCookie,
  generateRememberMeToken,
  enforceTokenLimit,
  storeRememberMeToken,
  setRememberMeCookie
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token, rememberMe === true);

    // Handle remember-me functionality
    if (rememberMe === true) {
      // Generate remember-me token
      const rememberMeTokenData = await generateRememberMeToken();
      
      // Enforce token limit (max 10 devices per user)
      await enforceTokenLimit(user._id.toString());
      
      // Get user agent from request headers
      const userAgent = req.headers.get("user-agent") || "unknown";
      
      // Store token in database
      await storeRememberMeToken(
        user._id.toString(),
        rememberMeTokenData.tokenHash,
        userAgent,
        rememberMeTokenData.expiresAt
      );
      
      // Set remember-me cookie
      await setRememberMeCookie(
        rememberMeTokenData.token,
        rememberMeTokenData.expiresAt
      );
    }

    return NextResponse.json({
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
