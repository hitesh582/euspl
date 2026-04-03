import { ObjectId } from "mongodb";
import getDb from "@/lib/db";

export interface PasswordResetTokenDoc {
  _id: ObjectId;
  user_id: ObjectId;
  email: string;
  token: string;              // Hashed token
  created_at: Date;            // Creation timestamp
  expires_at: Date;            // Expiration (created_at + 15 minutes)
  used: boolean;
  used_at?: Date;              // Timestamp when token was used
}

/**
 * Store a password reset token in the database
 */
export async function storeResetToken(
  userId: string,
  email: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  const db = await getDb();
  
  await db.collection("password_reset_tokens").insertOne({
    user_id: new ObjectId(userId),
    email,
    token: tokenHash,
    created_at: new Date(),
    expires_at: expiresAt,
    used: false,
  });
}

/**
 * Find a password reset token by its hash
 */
export async function findResetToken(
  tokenHash: string
): Promise<PasswordResetTokenDoc | null> {
  const db = await getDb();
  
  const token = await db.collection("password_reset_tokens").findOne({
    token: tokenHash,
  });
  
  if (!token) return null;
  
  return {
    _id: token._id,
    user_id: token.user_id,
    email: token.email,
    token: token.token,
    created_at: token.created_at,
    expires_at: token.expires_at,
    used: token.used,
    used_at: token.used_at,
  };
}

/**
 * Mark a token as used
 */
export async function markTokenAsUsed(tokenHash: string): Promise<void> {
  const db = await getDb();
  
  await db.collection("password_reset_tokens").updateOne(
    { token: tokenHash },
    {
      $set: {
        used: true,
        used_at: new Date(),
      },
    }
  );
}

/**
 * Invalidate all password reset tokens for a user
 */
export async function invalidateAllUserResetTokens(userId: string): Promise<void> {
  const db = await getDb();
  
  await db.collection("password_reset_tokens").updateMany(
    { user_id: new ObjectId(userId) },
    {
      $set: {
        used: true,
        used_at: new Date(),
      },
    }
  );
}
