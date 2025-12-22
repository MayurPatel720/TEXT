import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET - Verify token validity
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    console.log('\n========================================');
    console.log('🔍 VERIFYING RESET TOKEN');
    console.log('Token:', token?.substring(0, 20) + '...');
    console.log('========================================\n');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "No token provided" },
        { status: 400 }
      );
    }

    await connectDB();

    // First, let's see if this token exists at all
    const userWithToken = await User.findOne({
      resetPasswordToken: token,
    });

    console.log('User with this token found:', userWithToken ? 'YES' : 'NO');
    
    if (userWithToken) {
      console.log('Token expires:', userWithToken.resetPasswordExpires);
      console.log('Current time:', new Date());
      console.log('Is expired:', userWithToken.resetPasswordExpires < new Date());
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

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

// POST - Reset password with token
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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

    // Hash new password
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

    console.log(`✅ Password reset successful for: ${user.email}`);

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
