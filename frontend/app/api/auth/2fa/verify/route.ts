import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTOTP, decryptSecret, hashBackupCodes } from '@/lib/totp';

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code and enable 2FA for the user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, backupCodes } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Clean up code (remove spaces, dashes)
    const cleanCode = code.replace(/[\s-]/g, '');

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Get user with secret
    const user = await User.findOne({ email: session.user.email }).select('+twoFactorSecret');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Please set up 2FA first' },
        { status: 400 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    // Decrypt and verify
    const secret = decryptSecret(user.twoFactorSecret);
    const result = verifyTOTP(secret, user.email, cleanCode);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Enable 2FA and store hashed backup codes
    user.twoFactorEnabled = true;
    if (backupCodes && Array.isArray(backupCodes)) {
      user.twoFactorBackupCodes = hashBackupCodes(backupCodes);
    }
    await user.save();

    console.log(`✅ 2FA enabled for user: ${user.email}`);

    return NextResponse.json({
      message: '2FA has been enabled successfully',
      enabled: true,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
}
