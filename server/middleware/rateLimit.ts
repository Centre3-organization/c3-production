/**
 * Rate Limiting Middleware
 * 
 * Implements tiered rate limiting for different endpoint types:
 * - Authentication: Strict limits (5 attempts per 15 minutes)
 * - Password Reset: Very strict (3 attempts per hour)
 * - API General: Moderate limits (1000 requests per 15 minutes)
 * - Sensitive Operations: Moderate (100 requests per hour)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter factory with common configuration
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    // Use default keyGenerator (IP-based) for proper IPv6 handling
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
}

/**
 * Authentication endpoints - strict limits
 * 5 attempts per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyPrefix: 'auth',
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/**
 * Password reset - very strict
 * 3 attempts per hour
 */
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyPrefix: 'pwd-reset',
  message: 'Too many password reset requests. Please try again in 1 hour.',
});

/**
 * API endpoints - general limit
 * 1000 requests per 15 minutes
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  keyPrefix: 'api',
  message: 'Too many API requests. Please slow down.',
});

/**
 * Sensitive operations - moderate limit
 * 100 requests per hour
 */
export const sensitiveLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  keyPrefix: 'sensitive',
  message: 'Too many requests to sensitive endpoints. Please try again later.',
});

/**
 * MFA verification - strict limits
 * 10 attempts per 15 minutes
 */
export const mfaLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: 'mfa',
  message: 'Too many MFA verification attempts. Please try again in 15 minutes.',
});
