import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  storeResetToken,
  findResetToken,
  markTokenAsUsed,
  invalidateAllUserResetTokens,
} from "@/lib/models/PasswordResetToken";

const TOKEN_BYTES = 32; // 256 bits of entropy
const TOKEN_EXPIRATION_MINUTES = 15;

export interface ResetTokenData {
  token: string;        // Raw token (only returned once)
  tokenHash: string;    // Hashed version for storage
  expiresAt: Date;
}

/**
 * Generate a cryptographically secure password reset token
 * Uses crypto.randomBytes(32) for 256 bits of entropy
 * Returns raw token and hashed version
 */
export function generateSecureToken(): string {
  const tokenBytes = crypto.randomBytes(TOKEN_BYTES);
  return tokenBytes.toString("hex"); // 64 character hex string
}

/**
 * Hash token using bcrypt for storage
 */
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Verify token against hash using constant-time comparison
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Create a password reset token for a user
 */
export async function createResetToken(
  userId: string,
  email: string
): Promise<ResetTokenData> {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRATION_MINUTES);
  
  await storeResetToken(userId, email, tokenHash, expiresAt);
  
  return {
    token,
    tokenHash,
    expiresAt,
  };
}

/**
 * Validate a reset token and return user info if valid
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    const db = await (await import("@/lib/db")).default();
    
    // Find all non-used, non-expired tokens
    const now = new Date();
    const tokens = await db.collection("password_reset_tokens")
      .find({
        used: false,
        expires_at: { $gt: now },
      })
      .toArray();
    
    // Check each token hash against the provided token
    for (const tokenDoc of tokens) {
      const isMatch = await verifyToken(token, tokenDoc.token);
      
      if (isMatch) {
        return {
          valid: true,
          userId: tokenDoc.user_id.toString(),
          email: tokenDoc.email,
        };
      }
    }
    
    return {
      valid: false,
      error: "Invalid or expired reset token",
    };
  } catch (error) {
    console.error("Error validating reset token:", error);
    return {
      valid: false,
      error: "Invalid or expired reset token",
    };
  }
}

/**
 * Mark a token as used after password reset
 */
export async function useResetToken(token: string): Promise<void> {
  const db = await (await import("@/lib/db")).default();
  
  const now = new Date();
  const tokens = await db.collection("password_reset_tokens")
    .find({
      used: false,
      expires_at: { $gt: now },
    })
    .toArray();
  
  for (const tokenDoc of tokens) {
    const isMatch = await verifyToken(token, tokenDoc.token);
    
    if (isMatch) {
      await markTokenAsUsed(tokenDoc.token);
      return;
    }
  }
}

/**
 * Invalidate all reset tokens for a user
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  await invalidateAllUserResetTokens(userId);
}
