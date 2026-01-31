import { describe, it, expect, beforeAll } from 'vitest';
import {
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

// Set up test environment
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-encryption-testing';
});

describe('Encryption Utilities', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const original = 'Hello, World!';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const original = 'Same text';
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should handle special characters', () => {
      const original = '日本語 العربية 🎉';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe('hashForSearch', () => {
    it('should produce consistent hash for same input', () => {
      const hash1 = hashForSearch('test@example.com');
      const hash2 = hashForSearch('test@example.com');
      expect(hash1).toBe(hash2);
    });

    it('should normalize input (lowercase, trim)', () => {
      const hash1 = hashForSearch('TEST@EXAMPLE.COM');
      const hash2 = hashForSearch('  test@example.com  ');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashForSearch('test1@example.com');
      const hash2 = hashForSearch('test2@example.com');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      expect(hashForSearch('')).toBe('');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      const masked = maskEmail('john.doe@example.com');
      expect(masked).toMatch(/^j\*\*\*e@e\*\*\*\.com$/);
    });

    it('should handle short local parts', () => {
      const masked = maskEmail('ab@example.com');
      expect(masked).toContain('***');
    });

    it('should handle invalid emails', () => {
      expect(maskEmail('invalid')).toBe('***');
      expect(maskEmail('')).toBe('***');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number correctly', () => {
      const masked = maskPhone('+966501234567');
      expect(masked).toContain('***');
      expect(masked).toContain('4567');
    });

    it('should handle short phone numbers', () => {
      expect(maskPhone('12345')).toBe('***');
    });
  });

  describe('maskSaudiId', () => {
    it('should mask Saudi ID correctly', () => {
      const masked = maskSaudiId('1234567890');
      expect(masked).toBe('123****890');
    });

    it('should handle invalid IDs', () => {
      expect(maskSaudiId('12345')).toBe('***');
      expect(maskSaudiId('')).toBe('***');
    });
  });

  describe('maskName', () => {
    it('should mask name correctly', () => {
      const masked = maskName('John Doe');
      expect(masked).toBe('J*** D***');
    });

    it('should handle single names', () => {
      const masked = maskName('John');
      expect(masked).toBe('J***');
    });

    it('should handle empty names', () => {
      expect(maskName('')).toBe('***');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of correct length', () => {
      const token = generateSecureToken(16);
      expect(token.length).toBe(32); // hex encoding doubles length
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a 64-character session ID', () => {
      const sessionId = generateSessionId();
      expect(sessionId.length).toBe(64);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });
});
