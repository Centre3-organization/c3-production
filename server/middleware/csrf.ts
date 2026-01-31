/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * - Generates CSRF token and stores in cookie
 * - Validates token from header matches cookie
 * - Skips validation for safe methods (GET, HEAD, OPTIONS)
 */

import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH);
}

/**
 * Get secure cookie options based on environment
 */
function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
}

/**
 * CSRF Protection Middleware
 * 
 * For safe methods (GET, HEAD, OPTIONS):
 * - Sets CSRF token cookie if not present
 * 
 * For state-changing methods (POST, PUT, DELETE, PATCH):
 * - Validates CSRF token from header matches cookie
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Set CSRF token cookie if not present
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = generateCSRFToken();
      res.cookie(CSRF_COOKIE, token, getCookieOptions(isProduction));
    }
    return next();
  }
  
  // Skip CSRF for API endpoints that use JWT authentication
  // tRPC endpoints are protected by JWT tokens
  if (req.path.startsWith('/api/trpc')) {
    return next();
  }
  
  // Validate CSRF token for state-changing methods
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }
  
  next();
}

/**
 * Middleware to set CSRF token on all responses
 * Useful for SPAs that need the token on initial load
 */
export function csrfTokenSetter(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generateCSRFToken();
    res.cookie(CSRF_COOKIE, token, getCookieOptions(isProduction));
  }
  
  next();
}
