import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { emailService } from "@/lib/email";
import { 
  checkRateLimit, 
  getClientIp, 
  rateLimitPresets, 
  createRateLimitResponse 
} from "@/lib/rate-limit";

// ============================================================================
// Password Reset Request Handler
// ============================================================================

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `forgot-password:${clientIp}`,
      rateLimitPresets.passwordReset
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Validate request body
    let email: string;
    try {
      const body = await request.json();
      email = body.email?.trim()?.toLowerCase();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Connect to database and verify user exists
    await connectDB();
    const user = await User.findOne({ email });

    // Security: Don't reveal if email exists or not in production
    // But in development, provide helpful feedback
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          { error: "This email is not registered. Please check the email or create a new account." },
          { status: 404 }
        );
      }
      // In production, always return success to prevent email enumeration
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link shortly."
      });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Store token in user document (DB-only, no in-memory for serverless compatibility)
    await User.updateOne(
      { email },
      {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expires),
        updatedAt: new Date(),
      }
    );

    // Build reset link
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(email, resetLink);

    if (!emailResult.success && emailService.isEmailConfigured()) {
      // Email was configured but failed to send
      console.error("Failed to send password reset email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    // Return appropriate response
    if (!emailService.isEmailConfigured() && process.env.NODE_ENV === 'development') {
      // Development mode without email config
      return NextResponse.json({
        message: "Password reset link generated",
        devNote: "Email not configured - showing link for development only",
        resetLink,
      });
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link shortly."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
