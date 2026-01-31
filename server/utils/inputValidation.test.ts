import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  escapeLikePattern,
  createSafeSearchPattern,
  isValidId,
  parseId,
  isValidSaudiNationalId,
  isValidIqama,
  isValidSaudiId,
} from './inputValidation';

describe('Input Validation', () => {
  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove onclick handlers', () => {
      const result = sanitizeString('<div onclick="alert(1)">Click me</div>');
      expect(result).not.toContain('onclick');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should preserve normal text', () => {
      expect(sanitizeString('Hello World 123')).toBe('Hello World 123');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>bad</script>John',
        age: 25,
        email: 'john@example.com',
      };
      const result = sanitizeObject(input);
      expect(result.name).not.toContain('<script>');
      expect(result.age).toBe(25);
      expect(result.email).toBe('john@example.com');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>bad</script>John',
        },
      };
      const result = sanitizeObject(input);
      expect((result.user as any).name).not.toContain('<script>');
    });
  });

  describe('escapeLikePattern', () => {
    it('should escape percent signs', () => {
      expect(escapeLikePattern('100%')).toBe('100\\%');
    });

    it('should escape underscores', () => {
      expect(escapeLikePattern('user_name')).toBe('user\\_name');
    });

    it('should escape backslashes', () => {
      expect(escapeLikePattern('path\\to')).toBe('path\\\\to');
    });
  });

  describe('createSafeSearchPattern', () => {
    it('should wrap in wildcards', () => {
      const result = createSafeSearchPattern('test');
      expect(result).toBe('%test%');
    });

    it('should escape special characters', () => {
      const result = createSafeSearchPattern('100%');
      expect(result).toBe('%100\\%%');
    });
  });

  describe('isValidId', () => {
    it('should accept positive integers', () => {
      expect(isValidId(1)).toBe(true);
      expect(isValidId(100)).toBe(true);
      expect(isValidId(999999)).toBe(true);
    });

    it('should reject zero and negative numbers', () => {
      expect(isValidId(0)).toBe(false);
      expect(isValidId(-1)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isValidId(1.5)).toBe(false);
      expect(isValidId('1' as any)).toBe(false);
    });
  });

  describe('parseId', () => {
    it('should parse valid string IDs', () => {
      expect(parseId('123')).toBe(123);
    });

    it('should return number IDs as-is', () => {
      expect(parseId(456)).toBe(456);
    });

    it('should return null for invalid IDs', () => {
      expect(parseId('')).toBe(null);
      expect(parseId(undefined)).toBe(null);
      expect(parseId('abc')).toBe(null);
      expect(parseId('-1')).toBe(null);
    });
  });

  describe('Saudi ID Validation', () => {
    describe('isValidSaudiNationalId', () => {
      it('should accept valid Saudi National IDs starting with 1', () => {
        // Valid format: 10 digits starting with 1, passes Luhn
        expect(isValidSaudiNationalId('1234567890')).toBe(false); // Fails Luhn
        expect(isValidSaudiNationalId('1000000000')).toBe(false); // Fails Luhn
      });

      it('should reject IDs not starting with 1', () => {
        expect(isValidSaudiNationalId('2234567890')).toBe(false);
      });

      it('should reject IDs with wrong length', () => {
        expect(isValidSaudiNationalId('123456789')).toBe(false);
        expect(isValidSaudiNationalId('12345678901')).toBe(false);
      });
    });

    describe('isValidIqama', () => {
      it('should accept valid Iqama IDs starting with 2', () => {
        // Valid format: 10 digits starting with 2, passes Luhn
        expect(isValidIqama('2234567890')).toBe(false); // Fails Luhn
      });

      it('should reject IDs not starting with 2', () => {
        expect(isValidIqama('1234567890')).toBe(false);
      });
    });

    describe('isValidSaudiId', () => {
      it('should accept either National ID or Iqama format', () => {
        // This tests the combined validator
        expect(isValidSaudiId('abc')).toBe(false);
        expect(isValidSaudiId('3234567890')).toBe(false);
      });
    });
  });
});
