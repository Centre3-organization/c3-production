/**
 * Password Validator
 * 
 * Implements enterprise-grade password policies:
 * - Minimum 12 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No repeated characters (3+)
 * - Not in common passwords list
 */

import { z } from 'zod';
import crypto from 'crypto';

// Common passwords to reject (top 100 most common)
const commonPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'princess',
  'welcome', 'shadow', 'superman', 'michael', 'football', 'password1', 'password123',
  'letmein', 'admin', 'login', 'passw0rd', 'starwars', 'hello', 'freedom',
  'whatever', 'qazwsx', 'ninja', 'mustang', 'password!', 'centre3', 'center3',
];

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  score: number;
}

/**
 * Zod schema for password validation
 */
export const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .refine(
    (password) => !commonPasswords.includes(password.toLowerCase()),
    'Password is too common'
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain repeated characters (3 or more in a row)'
  );

/**
 * Validate password with detailed feedback
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  
  // Length checks
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  } else {
    score += 20;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Character type checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 15;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 15;
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 15;
  }
  
  // Common password check
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    score = Math.max(0, score - 30);
  }
  
  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain repeated characters (3 or more in a row)');
    score = Math.max(0, score - 10);
  }
  
  // Sequential characters check
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score = Math.max(0, score - 5);
  }
  
  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  if (score < 30) strength = 'weak';
  else if (score < 50) strength = 'fair';
  else if (score < 70) strength = 'good';
  else if (score < 90) strength = 'strong';
  else strength = 'excellent';
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(100, score),
  };
}

/**
 * Check if password has been breached using Have I Been Pwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count?: number;
}> {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Centre3-Security-Check',
      },
    });
    
    if (!response.ok) {
      // If API fails, don't block the user
      return { breached: false };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          breached: true,
          count: parseInt(count.trim(), 10),
        };
      }
    }
    
    return { breached: false };
  } catch (error) {
    // If API fails, don't block the user
    console.error('Password breach check failed:', error);
    return { breached: false };
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }
  
  // Shuffle the password
  const array = password.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array.join('');
}
