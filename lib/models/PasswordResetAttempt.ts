import { ObjectId } from "mongodb";
import getDb from "@/lib/db";

export interface PasswordResetAttemptDoc {
  _id: ObjectId;
  email: string;
  attempts: number;
  first_attempt_at: Date;
  last_attempt_at: Date;
  expires_at: Date;            // first_attempt_at + 1 hour
}

/**
 * Check if an email has exceeded the rate limit
 * Returns true if the email can make another attempt
 */
export async function checkRateLimit(email: string): Promise<{
  allowed: boolean;
  attemptsRemaining?: number;
}> {
  const db = await getDb();
  
  const record = await db.collection("password_reset_attempts").findOne({
    email,
    expires_at: { $gt: new Date() },
  });
  
  if (!record) {
    return { allowed: true, attemptsRemaining: 3 };
  }
  
  const attemptsRemaining = 3 - record.attempts;
  
  if (record.attempts >= 3) {
    return { allowed: false };
  }
  
  return { allowed: true, attemptsRemaining };
}

/**
 * Record a password reset attempt
 */
export async function recordAttempt(email: string): Promise<void> {
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  const existing = await db.collection("password_reset_attempts").findOne({
    email,
    expires_at: { $gt: now },
  });
  
  if (existing) {
    // Increment existing record
    await db.collection("password_reset_attempts").updateOne(
      { _id: existing._id },
      {
        $inc: { attempts: 1 },
        $set: { last_attempt_at: now },
      }
    );
  } else {
    // Create new record
    await db.collection("password_reset_attempts").insertOne({
      email,
      attempts: 1,
      first_attempt_at: now,
      last_attempt_at: now,
      expires_at: expiresAt,
    });
  }
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupExpiredAttempts(): Promise<void> {
  const db = await getDb();
  
  await db.collection("password_reset_attempts").deleteMany({
    expires_at: { $lt: new Date() },
  });
}
