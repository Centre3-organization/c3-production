/**
 * Secure Cookie Configuration
 * 
 * Provides secure cookie settings for session management:
 * - HttpOnly: Prevents XSS access to cookies
 * - Secure: HTTPS only in production
 * - SameSite: CSRF protection
 * - Domain: Proper domain scoping
 */

import { CookieOptions, Request } from 'express';

/**
 * Get secure cookie options based on environment and request
 */
export function getSecureCookieOptions(req?: Request): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,                    // Prevent XSS access
    secure: isProduction,              // HTTPS only in production
    sameSite: 'strict',                // CSRF protection
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,      // 24 hours
    // Domain is set automatically by Express based on request
  };
}

/**
 * Get cookie options for session tokens (more restrictive)
 */
export function getSessionCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
}

/**
 * Get cookie options for refresh tokens (longer duration)
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth', // Only sent to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Get cookie options for "remember me" tokens
 */
export function getRememberMeCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

/**
 * Clear a cookie securely
 */
export function getClearCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}
