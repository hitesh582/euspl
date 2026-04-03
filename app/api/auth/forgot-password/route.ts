import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { createResetToken } from "@/lib/services/tokenService";
import { sendPasswordResetEmail } from "@/lib/services/emailService";
import {
  checkRateLimit,
  recordAttempt,
  logRateLimitViolation,
} from "@/lib/services/rateLimiterService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(email);
    
    if (!rateLimit.allowed) {
      // Log security event
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      logRateLimitViolation(email, ip);
      
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    // Record this attempt
    await recordAttempt(email);

    // Check if user exists
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    // Always return same message to prevent email enumeration
    const successMessage = "If an account exists with this email, you will receive a password reset link.";

    if (!user) {
      // User doesn't exist, but return success message anyway
      return NextResponse.json({ message: successMessage });
    }

    // Generate reset token
    const tokenData = await createResetToken(user._id.toString(), email);

    // Send email
    const emailResult = await sendPasswordResetEmail(email, tokenData.token);

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
