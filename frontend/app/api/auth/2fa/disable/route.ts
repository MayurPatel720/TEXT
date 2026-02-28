import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyTOTP, decryptSecret } from '@/lib/totp';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the user (requires current TOTP code for security)
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

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Current 2FA code is required to disable' },
        { status: 400 }
      );
    }

    const cleanCode = code.replace(/[\s-]/g, '');

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email }).select('+twoFactorSecret');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    // Verify the code before disabling
    const secret = decryptSecret(user.twoFactorSecret);
    const result = verifyTOTP(secret, user.email, cleanCode);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    console.log(`🔓 2FA disabled for user: ${user.email}`);

    return NextResponse.json({
      message: '2FA has been disabled',
      enabled: false,
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
