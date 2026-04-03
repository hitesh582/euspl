import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

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

export async function setSessionCookie(token: string, rememberMe?: boolean) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // When rememberMe is true, persist cookie for 30 days; otherwise session cookie
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : undefined,
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

// Remember Me Token Types and Constants
export interface RememberMeTokenData {
  token: string;               // Raw token (only returned once)
  tokenHash: string;           // Hashed version for storage
  expiresAt: Date;
}

const REMEMBER_ME_TOKEN_BYTES = 32;
const REMEMBER_ME_EXPIRATION_DAYS = 30;

/**
 * Generate a cryptographically secure remember-me token
 * Uses crypto.randomBytes(32) for 256 bits of randomness
 * Encodes as base64url for cookie storage
 * Hashes with SHA-256 before database storage
 * Sets expiration to 30 days from creation
 */
export async function generateRememberMeToken(): Promise<RememberMeTokenData> {
  // Generate 32 bytes of cryptographically secure random data
  const tokenBytes = crypto.randomBytes(REMEMBER_ME_TOKEN_BYTES);
  
  // Encode as base64url for safe cookie storage
  const token = tokenBytes.toString("base64url");
  
  // Hash the token for database storage
  const tokenHash = hashToken(token);
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REMEMBER_ME_EXPIRATION_DAYS);
  
  return {
    token,
    tokenHash,
    expiresAt,
  };
}

/**
 * Hash token using SHA-256
 * Returns hex-encoded hash string
 */
export function hashToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Compares two strings in constant time regardless of where they differ
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // If lengths differ, still compare to maintain constant time
  // Use the longer length to ensure we always do the same amount of work
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  
  // If lengths are different, the comparison will fail, but we still
  // perform the comparison to avoid timing leaks
  if (aBuffer.length !== bBuffer.length) {
    // Compare against a dummy buffer of the same length as 'a' to maintain timing
    const dummyBuffer = Buffer.alloc(aBuffer.length);
    crypto.timingSafeEqual(aBuffer, dummyBuffer);
    return false;
  }
  
  // Use Node.js built-in constant-time comparison
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Store a remember-me token in the database
 * Associates token with user ID, device info, and expiration
 * Uses RememberToken model functions for database operations
 * 
 * @param userId - The user's ID
 * @param tokenHash - SHA-256 hash of the token
 * @param userAgent - Browser/device identifier from request headers
 * @param expiresAt - Token expiration date (30 days from creation)
 */
export async function storeRememberMeToken(
  userId: string,
  tokenHash: string,
  userAgent: string,
  expiresAt: Date
): Promise<void> {
  const { storeRememberToken } = await import("@/lib/models/RememberToken");
  await storeRememberToken(userId, tokenHash, userAgent, expiresAt);
}

/**
 * Enforce token limit per user (max 10 devices)
 * Checks if user has 10 or more tokens
 * If at limit, removes the oldest token (by createdAt) before storing new one
 * 
 * @param userId - The user's ID
 */
export async function enforceTokenLimit(userId: string): Promise<void> {
  const { countUserTokens, deleteOldestUserToken } = await import("@/lib/models/RememberToken");
  
  const tokenCount = await countUserTokens(userId);
  
  // If user has 10 or more tokens, remove the oldest one
  if (tokenCount >= 10) {
    await deleteOldestUserToken(userId);
  }
}

/**
 * Clean up expired tokens (called during validation)
 * Removes expired remember-me tokens from the database
 * Queries for tokens where expiresAt is in the past and deletes them
 * Uses RememberToken model's deleteExpiredTokens function
 * 
 * Validates: Requirements 8.1, 8.2
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const { deleteExpiredTokens } = await import("@/lib/models/RememberToken");
  await deleteExpiredTokens();
}

/**
 * Result of token validation and rotation
 */
export interface TokenRotationResult {
  user: JWTPayload;
  newToken: string;
  expiresAt: Date;
}

/**
 * Validate and rotate a remember-me token
 * Implements atomic token rotation for security
 * 
 * Process:
 * 1. Hash the incoming token
 * 2. Query database for matching token hash
 * 3. Check if token exists and is not expired
 * 4. If valid:
 *    - Get user data from users collection
 *    - Generate a new token
 *    - Store the new token in database
 *    - Delete the old token
 *    - Return user data (JWTPayload) and new token
 * 5. If invalid/expired:
 *    - Return null
 * 
 * @param token - The raw remember-me token from cookie
 * @param userAgent - Browser/device identifier from request headers
 * @returns TokenRotationResult with user data and new token if valid, null otherwise
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4
 */
export async function validateAndRotateRememberMeToken(
  token: string,
  userAgent: string
): Promise<TokenRotationResult | null> {
  try {
    // Step 1: Hash the incoming token
    const tokenHash = hashToken(token);
    
    // Step 2: Query database for matching token hash
    const { findRememberToken, deleteRememberToken } = await import("@/lib/models/RememberToken");
    const tokenDoc = await findRememberToken(tokenHash);
    
    // Step 3: Check if token exists and is not expired
    if (!tokenDoc) {
      return null;
    }
    
    const now = new Date();
    if (tokenDoc.expiresAt < now) {
      // Token is expired, clean it up
      await deleteRememberToken(tokenHash);
      return null;
    }
    
    // Step 4: Token is valid, proceed with rotation
    
    // Get user data from database
    const getDb = (await import("@/lib/db")).default;
    const db = await getDb();
    const { ObjectId } = await import("mongodb");
    
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(tokenDoc.userId) 
    });
    
    if (!user) {
      // User no longer exists, clean up token
      await deleteRememberToken(tokenHash);
      return null;
    }
    
    // Generate a new token
    const newTokenData = await generateRememberMeToken();
    
    // Enforce token limit before storing new token
    await enforceTokenLimit(tokenDoc.userId);
    
    // Store the new token
    await storeRememberMeToken(
      tokenDoc.userId,
      newTokenData.tokenHash,
      userAgent,
      newTokenData.expiresAt
    );
    
    // Delete the old token (atomic rotation complete)
    await deleteRememberToken(tokenHash);
    
    // Clean up expired tokens opportunistically
    await cleanupExpiredTokens();
    
    // Return user data and new token for cookie setting
    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      newToken: newTokenData.token,
      expiresAt: newTokenData.expiresAt,
    };
  } catch (error) {
    console.error("Error validating and rotating remember-me token:", error);
    return null;
  }
}

/**
 * Invalidate a specific remember-me token
 * Removes a single token from the database by its hash
 * Used for single-device logout
 *
 * @param tokenHash - SHA-256 hash of the token to invalidate
 *
 * Validates: Requirements 5.1, 5.3
 */
export async function invalidateRememberMeToken(
  tokenHash: string
): Promise<void> {
  const { deleteRememberToken } = await import("@/lib/models/RememberToken");
  await deleteRememberToken(tokenHash);
}

/**
 * Invalidate all remember-me tokens for a user
 * Removes all tokens for a user from the database
 * Used for "logout all devices" functionality
 *
 * @param userId - The user's ID
 *
 * Validates: Requirements 5.1, 5.3
 */
export async function invalidateAllUserTokens(
  userId: string
): Promise<void> {
  const { deleteAllUserTokens } = await import("@/lib/models/RememberToken");
  await deleteAllUserTokens(userId);
}

// Cookie Management Constants
const REMEMBER_ME_COOKIE_NAME = "remember_me_token";
const REMEMBER_ME_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Set remember-me cookie with security attributes
 * Configures cookie with httpOnly, secure, sameSite attributes
 * Sets expiration to match token expiration (30 days)
 * 
 * Cookie configuration:
 * - httpOnly: true (prevent JavaScript access)
 * - secure: true in production (HTTPS only)
 * - sameSite: 'lax' (CSRF protection)
 * - maxAge: 30 days in seconds (2592000)
 * - path: '/' (available across entire site)
 * 
 * @param token - The raw remember-me token to store in cookie
 * @param expiresAt - Token expiration date (used to calculate maxAge)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.2
 */
export async function setRememberMeCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  
  // Calculate maxAge in seconds from expiresAt
  const now = new Date();
  const maxAge = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
  
  cookieStore.set(REMEMBER_ME_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge > 0 ? maxAge : REMEMBER_ME_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Clear remember-me cookie
 * Removes the remember-me cookie from the browser
 * Used during logout or when token is invalid
 * 
 * @returns Promise that resolves when cookie is cleared
 * 
 * Validates: Requirements 5.2
 */
export async function clearRememberMeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_ME_COOKIE_NAME);
}

export { REMEMBER_ME_COOKIE_NAME };

