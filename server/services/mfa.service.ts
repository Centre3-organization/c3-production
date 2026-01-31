/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * Implements TOTP-based MFA using authenticator apps:
 * - Secret generation and QR code creation
 * - Token verification
 * - Backup codes generation and verification
 */

import * as otplib from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * MFA Setup Result
 */
export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Generate MFA secret and QR code for user enrollment
 */
export async function setupMFA(email: string): Promise<MFASetupResult> {
  // Generate secret using otplib v13 API
  const secret = otplib.generateSecret();
  
  // Generate OTP auth URL
  const otpauth = otplib.generateURI({
    secret,
    issuer: 'Centre3',
    label: email,
    digits: 6,
    period: 30,
  });
  
  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(otpauth, {
    width: 256,
    margin: 2,
    color: {
      dark: '#4f008c',
      light: '#ffffff',
    },
  });
  
  // Generate backup codes
  const backupCodes = generateBackupCodes();
  
  return {
    secret,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify TOTP token using otplib v13 API
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = otplib.verifySync({
      token,
      secret,
      digits: 6,
      period: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Generate backup codes (10 codes, 8 characters each)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    // Generate 8 character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );
  return hashedCodes;
}

/**
 * Verify a backup code against stored hashes
 * Returns the index of the matched code, or -1 if not found
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(code.toUpperCase(), hashedCodes[i]);
    if (isMatch) {
      return i;
    }
  }
  return -1;
}

/**
 * Encrypt MFA secret for database storage
 */
export function encryptSecret(secret: string, encryptionKey: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt MFA secret from database
 */
export function decryptSecret(encryptedSecret: string, encryptionKey: string): string {
  const algorithm = 'aes-256-gcm';
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
