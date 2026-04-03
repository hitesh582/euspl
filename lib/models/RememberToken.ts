import getDb from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * RememberToken interface for "Remember Me" functionality
 * Stores long-lived authentication tokens for persistent sessions
 */
export interface RememberTokenDoc {
  _id?: ObjectId;
  userId: string;              // Reference to user._id
  tokenHash: string;           // SHA-256 hash of the token
  deviceInfo: {
    userAgent: string;         // Browser/device identifier
    createdAt: Date;           // When this device was first used
  };
  createdAt: Date;             // Token creation timestamp
  expiresAt: Date;             // Token expiration (30 days from creation)
  lastUsedAt: Date;            // Last time token was rotated
}

/**
 * Store a remember-me token in the database
 */
export async function storeRememberToken(
  userId: string,
  tokenHash: string,
  userAgent: string,
  expiresAt: Date
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  
  const doc: RememberTokenDoc = {
    userId,
    tokenHash,
    deviceInfo: {
      userAgent,
      createdAt: now,
    },
    createdAt: now,
    expiresAt,
    lastUsedAt: now,
  };
  
  await db.collection("remember_tokens").insertOne(doc);
}

/**
 * Find a remember-me token by its hash
 */
export async function findRememberToken(
  tokenHash: string
): Promise<RememberTokenDoc | null> {
  const db = await getDb();
  const doc = await db.collection("remember_tokens").findOne({ tokenHash });
  return doc as RememberTokenDoc | null;
}

/**
 * Update the lastUsedAt timestamp for a token
 */
export async function updateTokenLastUsed(
  tokenHash: string
): Promise<void> {
  const db = await getDb();
  await db.collection("remember_tokens").updateOne(
    { tokenHash },
    { $set: { lastUsedAt: new Date() } }
  );
}

/**
 * Delete a specific remember-me token
 */
export async function deleteRememberToken(
  tokenHash: string
): Promise<void> {
  const db = await getDb();
  await db.collection("remember_tokens").deleteOne({ tokenHash });
}

/**
 * Delete all remember-me tokens for a user
 */
export async function deleteAllUserTokens(
  userId: string
): Promise<void> {
  const db = await getDb();
  await db.collection("remember_tokens").deleteMany({ userId });
}

/**
 * Get all tokens for a user, sorted by creation date
 */
export async function getUserTokens(
  userId: string
): Promise<RememberTokenDoc[]> {
  const db = await getDb();
  const docs = await db
    .collection("remember_tokens")
    .find({ userId })
    .sort({ createdAt: 1 })
    .toArray();
  return docs as RememberTokenDoc[];
}

/**
 * Delete expired tokens (cleanup)
 */
export async function deleteExpiredTokens(): Promise<number> {
  const db = await getDb();
  const result = await db.collection("remember_tokens").deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
}

/**
 * Count active tokens for a user
 */
export async function countUserTokens(
  userId: string
): Promise<number> {
  const db = await getDb();
  return db.collection("remember_tokens").countDocuments({ userId });
}

/**
 * Delete the oldest token for a user
 */
export async function deleteOldestUserToken(
  userId: string
): Promise<void> {
  const db = await getDb();
  const oldestToken = await db
    .collection("remember_tokens")
    .findOne({ userId }, { sort: { createdAt: 1 } });
  
  if (oldestToken) {
    await db.collection("remember_tokens").deleteOne({ _id: oldestToken._id });
  }
}
