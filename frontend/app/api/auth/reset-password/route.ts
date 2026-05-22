import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// ============================================================================
// Password Validation Constants
// ============================================================================

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { 
      valid: false, 
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters` 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      error: "Password must contain at least one uppercase letter" 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { 
      valid: false, 
      error: "Password must contain at least one lowercase letter" 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return { 
      valid: false, 
      error: "Password must contain at least one number" 
    };
  }
  
  return { valid: true };
}

// ============================================================================
// GET - Verify Token Validity
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `reset-password-verify:${clientIp}`,
      rateLimitPresets.tokenValidation
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Validate token format (should be 64 hex chars for 32 bytes)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { valid: false, error: "Invalid token format" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('email resetPasswordExpires');

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "This reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify token" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Reset Password with Token
// ============================================================================

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `reset-password:${clientIp}`,
      rateLimitPresets.login // Using login preset as it's a sensitive operation
    );

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse and validate request body
    let token: string;
    let password: string;

    try {
      const body = await request.json();
      token = body.token?.trim();
      password = body.password;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate token format
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password with high cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password and clear reset token
    await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      }
    );

    // Log success (email only for audit, no PII exposure)
    console.log(`✅ Password reset successful for user ID: ${user._id}`);

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
