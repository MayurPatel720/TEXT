/**
 * TOTP (Time-based One-Time Password) Utilities
 * 
 * Uses the `otpauth` library for TOTP generation and verification.
 * Compatible with Google Authenticator, Authy, and other TOTP apps.
 */

import * as OTPAuth from 'otpauth';
import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const TOTP_CONFIG = {
  issuer: 'Textile AI',
  algorithm: 'SHA1' as const,
  digits: 6,
  period: 30, // seconds
};

// ============================================================================
// Types
// ============================================================================

interface TOTPSetupResult {
  secret: string;
  uri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TOTPVerifyResult {
  valid: boolean;
  delta?: number;
}

// ============================================================================
// TOTP Functions
// ============================================================================

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Create a TOTP instance for verification
 */
function createTOTP(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: email,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/**
 * Generate setup data for enabling 2FA
 * Returns secret, URI for QR code, and backup codes
 */
export function setupTOTP(email: string): TOTPSetupResult {
  const secret = generateTOTPSecret();
  const totp = createTOTP(secret, email);
  const uri = totp.toString();
  
  // Generate QR code URL using Google Charts API (simple approach)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(8);
  
  return {
    secret,
    uri,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 * Returns valid: true if code is correct, with delta indicating time window offset
 */
export function verifyTOTP(secret: string, email: string, code: string): TOTPVerifyResult {
  try {
    const totp = createTOTP(secret, email);
    
    // Validate the token with a window of 1 period before and after
    const delta = totp.validate({ token: code, window: 1 });
    
    return {
      valid: delta !== null,
      delta: delta ?? undefined,
    };
  } catch (error) {
    console.error('TOTP verification error:', error);
    return { valid: false };
  }
}

/**
 * Generate the current TOTP code (for testing)
 */
export function generateCurrentTOTP(secret: string, email: string): string {
  const totp = createTOTP(secret, email);
  return totp.generate();
}

// ============================================================================
// Backup Codes
// ============================================================================

/**
 * Generate random backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => 
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  );
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const normalizedCode = code.replace('-', '').toUpperCase();
  const hash = crypto.createHash('sha256').update(normalizedCode).digest('hex');
  
  return hashedCodes.findIndex(h => h === hash);
}

// ============================================================================
// Encryption (for storing secrets)
// ============================================================================

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-key-change-me';

/**
 * Encrypt TOTP secret for storage
 */
export function encryptSecret(secret: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt stored TOTP secret
 */
export function decryptSecret(encryptedSecret: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const [ivHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export { TOTP_CONFIG };
