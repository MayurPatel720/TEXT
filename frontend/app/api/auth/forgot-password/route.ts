import { NextResponse } from "next/server";
import crypto from "crypto";

// Store password reset tokens (in production, use database)
const resetTokens = new Map<string, { email: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    resetTokens.set(token, { email, expires });

    // In production, send email with reset link
    // For now, return the token (you'll need to set up email service)
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    console.log("Password reset link:", resetLink);

    return NextResponse.json({
      message: "Password reset link sent to your email",
      // Remove this in production - only for demo
      resetLink
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
