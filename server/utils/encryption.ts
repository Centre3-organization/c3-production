/**
 * Encryption Utilities
 * 
 * Implements AES-256-GCM encryption for sensitive data:
 * - Field-level encryption for PII
 * - Hash-for-search functionality
 * - PII masking for logging
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!keyEnv) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET required');
  }
  return crypto.scryptSync(keyEnv, 'centre3-encryption-salt', 32);
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');
  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashForSearch(value: string): string {
  if (!value) return '';
  const keyEnv = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!keyEnv) throw new Error('ENCRYPTION_KEY or JWT_SECRET required');
  const normalized = value.toLowerCase().trim();
  const hmac = crypto.createHmac('sha256', keyEnv);
  hmac.update(normalized);
  return hmac.digest('hex');
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const [domainName, ...tld] = domain.split('.');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
  const maskedDomain = domainName.length > 2 ? `${domainName[0]}***` : '***';
  return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return '***';
  const prefix = phone.slice(0, phone.length - 7);
  const suffix = phone.slice(-4);
  return `${prefix}***${suffix}`;
}

export function maskSaudiId(id: string): string {
  if (!id || id.length !== 10) return '***';
  return `${id.slice(0, 3)}****${id.slice(-3)}`;
}

export function maskName(name: string): string {
  if (!name) return '***';
  return name.split(' ').map(part => part.length > 1 ? `${part[0]}***` : '***').join(' ');
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateSessionId(): string {
  return generateSecureToken(32);
}
