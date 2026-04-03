/**
 * Email service for sending password reset emails
 * Uses Nodemailer with Gmail SMTP (free)
 */

import nodemailer from "nodemailer";

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Create a reusable Nodemailer transporter with Gmail SMTP
 *
 * Required environment variables:
 *   GMAIL_USER     — your Gmail address (e.g. you@gmail.com)
 *   GMAIL_APP_PASSWORD — a Gmail App Password (NOT your regular password)
 *
 * To generate an App Password:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to https://myaccount.google.com/apppasswords
 *   3. Create an App Password for "Mail"
 *   4. Copy the 16-char password and set it as GMAIL_APP_PASSWORD
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<EmailResult> {
  try {
    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    // For development: log the reset link instead of sending email
    if (process.env.NODE_ENV === "development" && !process.env.GMAIL_USER) {
      console.log("\n=================================");
      console.log("PASSWORD RESET EMAIL");
      console.log("=================================");
      console.log(`To: ${email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Expires: 15 minutes from now`);
      console.log("=================================\n");

      return { success: true };
    }

    // Validate Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error(
        "GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required"
      );
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const transporter = createTransporter();
    const { html, text, subject } = getEmailTemplate(resetLink);

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "EUSPL"}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: "Failed to send email",
    };
  }
}

/**
 * Get email template for password reset
 */
function getEmailTemplate(resetLink: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset Your Password";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all;">
          ${resetLink}
        </p>
        <p style="color: #ef4444; font-weight: bold;">This link will expire in 15 minutes.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated email. Please do not reply.</p>
      </body>
    </html>
  `;

  const text = `
Reset Your Password

You requested to reset your password. Click the link below to set a new password:

${resetLink}

This link will expire in 15 minutes.

If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  return { subject, html, text };
}
