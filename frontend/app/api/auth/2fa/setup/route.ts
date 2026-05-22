import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { setupTOTP, encryptSecret, hashBackupCodes } from '@/lib/totp';

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA setup data (secret, QR code) for the authenticated user
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate TOTP setup data
    const setupData = setupTOTP(user.email);

    // Store encrypted secret temporarily (will be confirmed on verify)
    // We don't enable 2FA until user verifies they can generate codes
    user.twoFactorSecret = encryptSecret(setupData.secret);
    await user.save();

    return NextResponse.json({
      message: 'Scan the QR code with your authenticator app',
      qrCodeUrl: setupData.qrCodeUrl,
      secret: setupData.secret, // Show secret for manual entry
      backupCodes: setupData.backupCodes,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    );
  }
}
