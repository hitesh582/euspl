import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  validateResetToken,
  useResetToken,
  invalidateUserTokens,
} from "@/lib/services/tokenService";
import { resetPasswordSchema } from "@/lib/validations/auth";

/**
 * GET /api/auth/reset-password?token=xxx
 * Validate a password reset token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const validation = await validateResetToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error || "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Mask email for privacy (show first char and domain)
    const email = validation.email || "";
    const [localPart, domain] = email.split("@");
    const maskedEmail = localPart ? `${localPart[0]}***@${domain}` : email;

    return NextResponse.json({
      valid: true,
      email: maskedEmail,
    });
  } catch (error) {
    console.error("Reset password validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }
}

/**
 * POST /api/auth/reset-password
 * Reset user password with valid token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = body;
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const { password } = result.data;

    // Validate token
    const validation = await validateResetToken(token);

    if (!validation.valid || !validation.userId) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: new ObjectId(validation.userId) },
      { $set: { password: hashedPassword } }
    );

    // Mark token as used
    await useResetToken(token);

    // Invalidate all other reset tokens for this user
    await invalidateUserTokens(validation.userId);

    return NextResponse.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
