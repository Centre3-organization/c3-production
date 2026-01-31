/**
 * Input Validation Utilities
 * 
 * Comprehensive input validation and sanitization:
 * - XSS prevention
 * - SQL injection prevention
 * - Saudi National ID validation
 * - Iqama validation
 * - Safe string handling
 */

import xss, { IFilterXSSOptions } from 'xss';
import { z } from 'zod';

// ============================================================================
// XSS SANITIZATION
// ============================================================================

/**
 * XSS filter options - strict mode
 */
const xssOptions: IFilterXSSOptions = {
  whiteList: {}, // No tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return xss(input.trim(), xssOptions);
}

/**
 * Sanitize object recursively - sanitizes all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : 
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================

/**
 * Escape special characters for LIKE queries
 * Prevents SQL injection in LIKE patterns
 */
export function escapeLikePattern(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Escape special LIKE characters: %, _, \
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Create a safe search pattern for LIKE queries
 */
export function createSafeSearchPattern(input: string): string {
  const sanitized = sanitizeString(input);
  const escaped = escapeLikePattern(sanitized);
  return `%${escaped}%`;
}

/**
 * Validate that a value is a safe integer ID
 */
export function isValidId(value: unknown): value is number {
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER;
}

/**
 * Parse and validate an ID from string input
 */
export function parseId(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isValidId(parsed)) {
    return parsed;
  }
  
  return null;
}

// ============================================================================
// SAUDI ID VALIDATION
// ============================================================================

/**
 * Validate Saudi National ID (10 digits, starts with 1)
 */
export function isValidSaudiNationalId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(id)) return false;
  
  // Must start with 1 (Saudi national)
  if (!id.startsWith('1')) return false;
  
  // Luhn algorithm validation
  return validateLuhn(id);
}

/**
 * Validate Iqama (Resident ID) - 10 digits, starts with 2
 */
export function isValidIqama(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(id)) return false;
  
  // Must start with 2 (resident)
  if (!id.startsWith('2')) return false;
  
  // Luhn algorithm validation
  return validateLuhn(id);
}

/**
 * Validate either Saudi National ID or Iqama
 */
export function isValidSaudiId(id: string): boolean {
  return isValidSaudiNationalId(id) || isValidIqama(id);
}

/**
 * Luhn algorithm for ID validation
 */
function validateLuhn(id: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = id.length - 1; i >= 0; i--) {
    let digit = parseInt(id[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// ============================================================================
// ZOD SCHEMAS FOR COMMON VALIDATIONS
// ============================================================================

/**
 * Safe string schema - sanitizes XSS
 */
export const SafeStringSchema = z.string().transform(sanitizeString);

/**
 * Safe email schema
 */
export const SafeEmailSchema = z.string()
  .email('Invalid email format')
  .max(320, 'Email too long')
  .transform(s => sanitizeString(s.toLowerCase()));

/**
 * Safe phone schema (international format)
 */
export const SafePhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
  .transform(sanitizeString);

/**
 * Saudi National ID schema
 */
export const SaudiNationalIdSchema = z.string()
  .refine(isValidSaudiNationalId, 'Invalid Saudi National ID');

/**
 * Iqama schema
 */
export const IqamaSchema = z.string()
  .refine(isValidIqama, 'Invalid Iqama number');

/**
 * Saudi ID schema (either National ID or Iqama)
 */
export const SaudiIdSchema = z.string()
  .refine(isValidSaudiId, 'Invalid Saudi ID or Iqama');

/**
 * Safe ID schema (positive integer)
 */
export const SafeIdSchema = z.number()
  .int('ID must be an integer')
  .positive('ID must be positive')
  .max(Number.MAX_SAFE_INTEGER, 'ID too large');

/**
 * Safe search string schema
 */
export const SafeSearchSchema = z.string()
  .max(100, 'Search term too long')
  .transform(sanitizeString);
