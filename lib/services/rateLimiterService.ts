import {
  checkRateLimit as checkRateLimitDb,
  recordAttempt as recordAttemptDb,
  cleanupExpiredAttempts,
} from "@/lib/models/PasswordResetAttempt";

/**
 * Check if an email can make a password reset request
 */
export async function checkRateLimit(email: string): Promise<{
  allowed: boolean;
  attemptsRemaining?: number;
}> {
  return checkRateLimitDb(email);
}

/**
 * Record a password reset attempt
 */
export async function recordAttempt(email: string): Promise<void> {
  await recordAttemptDb(email);
}

/**
 * Log rate limit violation for security monitoring
 */
export function logRateLimitViolation(email: string, ip?: string): void {
  console.warn(`[SECURITY] Rate limit exceeded for password reset`, {
    email,
    ip,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupExpiredRecords(): Promise<void> {
  await cleanupExpiredAttempts();
}
