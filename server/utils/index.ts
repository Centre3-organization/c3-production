/**
 * Security Utilities Index
 * 
 * Exports all security-related utilities for easy import
 */

// Password Validation
export {
  validatePassword,
  checkPasswordBreach,
  generateSecurePassword,
  PasswordSchema,
  type PasswordValidationResult,
} from './passwordValidator';

// Input Validation
export {
  sanitizeString,
  sanitizeObject,
  escapeLikePattern,
  createSafeSearchPattern,
  isValidId,
  parseId,
  isValidSaudiNationalId,
  isValidIqama,
  isValidSaudiId,
  SafeStringSchema,
  SafeEmailSchema,
  SafePhoneSchema,
  SaudiNationalIdSchema,
  IqamaSchema,
  SaudiIdSchema,
  SafeIdSchema,
  SafeSearchSchema,
} from './inputValidation';

// Encryption
export {
  encrypt,
  decrypt,
  hashForSearch,
  maskEmail,
  maskPhone,
  maskSaudiId,
  maskName,
  generateSecureToken,
  generateSessionId,
} from './encryption';
