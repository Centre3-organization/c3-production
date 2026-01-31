/**
 * Security Events Service
 * 
 * Implements comprehensive security event logging:
 * - Authentication events
 * - Authorization failures
 * - Data access audit
 * - Security alerts
 */

import { getDb } from '../db';
import { securityEvents } from '../../drizzle/schema';
import { maskEmail, maskPhone, maskSaudiId } from '../utils/encryption';

// ============================================================================
// EVENT TYPES
// ============================================================================

export type SecurityEventType =
  // Authentication
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_COMPLETE'
  // MFA
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFY_SUCCESS'
  | 'MFA_VERIFY_FAILURE'
  | 'MFA_BACKUP_CODE_USED'
  // Authorization
  | 'AUTHZ_ACCESS_DENIED'
  | 'AUTHZ_ROLE_CHANGE'
  | 'AUTHZ_PERMISSION_DENIED'
  // Data Access
  | 'DATA_EXPORT'
  | 'DATA_BULK_ACCESS'
  | 'DATA_SENSITIVE_ACCESS'
  | 'DATA_PII_ACCESS'
  // Security
  | 'SECURITY_RATE_LIMIT_EXCEEDED'
  | 'SECURITY_CSRF_FAILURE'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'
  | 'SECURITY_BRUTE_FORCE_DETECTED'
  // Audit
  | 'AUDIT_RECORD_CREATE'
  | 'AUDIT_RECORD_UPDATE'
  | 'AUDIT_RECORD_DELETE';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventData {
  eventType: SecurityEventType;
  userId?: number | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action?: string | null;
  details?: Record<string, unknown> | null;
  severity?: SecurityEventSeverity;
  success?: boolean;
}

// ============================================================================
// SEVERITY MAPPING
// ============================================================================

const EVENT_SEVERITY: Record<SecurityEventType, SecurityEventSeverity> = {
  // Authentication - mostly medium
  AUTH_LOGIN_SUCCESS: 'low',
  AUTH_LOGIN_FAILURE: 'medium',
  AUTH_LOGOUT: 'low',
  AUTH_SESSION_EXPIRED: 'low',
  AUTH_PASSWORD_CHANGE: 'medium',
  AUTH_PASSWORD_RESET_REQUEST: 'medium',
  AUTH_PASSWORD_RESET_COMPLETE: 'medium',
  // MFA - medium to high
  MFA_ENABLED: 'medium',
  MFA_DISABLED: 'high',
  MFA_VERIFY_SUCCESS: 'low',
  MFA_VERIFY_FAILURE: 'medium',
  MFA_BACKUP_CODE_USED: 'high',
  // Authorization - high
  AUTHZ_ACCESS_DENIED: 'high',
  AUTHZ_ROLE_CHANGE: 'high',
  AUTHZ_PERMISSION_DENIED: 'medium',
  // Data Access - varies
  DATA_EXPORT: 'medium',
  DATA_BULK_ACCESS: 'medium',
  DATA_SENSITIVE_ACCESS: 'high',
  DATA_PII_ACCESS: 'high',
  // Security - high to critical
  SECURITY_RATE_LIMIT_EXCEEDED: 'high',
  SECURITY_CSRF_FAILURE: 'high',
  SECURITY_SUSPICIOUS_ACTIVITY: 'critical',
  SECURITY_BRUTE_FORCE_DETECTED: 'critical',
  // Audit - low to medium
  AUDIT_RECORD_CREATE: 'low',
  AUDIT_RECORD_UPDATE: 'low',
  AUDIT_RECORD_DELETE: 'medium',
};

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log a security event
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Security] Cannot log event: database not available');
      return;
    }
    
    const severity = data.severity || EVENT_SEVERITY[data.eventType] || 'medium';
    
    // Mask PII in details
    const maskedDetails = data.details ? maskPIIInDetails(data.details) : null;
    
    await db.insert(securityEvents).values({
      eventType: data.eventType,
      userId: data.userId || null,
      userEmail: data.userEmail ? maskEmail(data.userEmail) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent?.substring(0, 500) || null,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      action: data.action || null,
      details: maskedDetails ? JSON.stringify(maskedDetails) : null,
      severity,
      success: data.success ?? true,
      createdAt: new Date(),
    });
    
    // Alert on high/critical events
    if (severity === 'high' || severity === 'critical') {
      await alertSecurityTeam(data, severity);
    }
  } catch (error) {
    // Don't throw - security logging should not break the application
    console.error('Failed to log security event:', error);
  }
}

/**
 * Mask PII in event details
 */
function maskPIIInDetails(details: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('email')) {
        masked[key] = maskEmail(value);
      } else if (key.toLowerCase().includes('phone')) {
        masked[key] = maskPhone(value);
      } else if (key.toLowerCase().includes('id') && /^\d{10}$/.test(value)) {
        masked[key] = maskSaudiId(value);
      } else {
        masked[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPIIInDetails(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Alert security team on high/critical events
 */
async function alertSecurityTeam(
  data: SecurityEventData,
  severity: SecurityEventSeverity
): Promise<void> {
  // In production, this would send to a security monitoring system
  console.warn(`[SECURITY ALERT - ${severity.toUpperCase()}]`, {
    eventType: data.eventType,
    userId: data.userId,
    ipAddress: data.ipAddress,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
  });
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log successful login
 */
export async function logLoginSuccess(
  userId: number,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTH_LOGIN_SUCCESS',
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTH_LOGIN_FAILURE',
    userEmail: email,
    ipAddress,
    userAgent,
    details: { reason },
    success: false,
  });
}

/**
 * Log access denied
 */
export async function logAccessDenied(
  userId: number | null,
  resourceType: string,
  resourceId: string,
  action: string,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTHZ_ACCESS_DENIED',
    userId,
    resourceType,
    resourceId,
    action,
    ipAddress,
    success: false,
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  userId: number,
  resourceType: string,
  recordCount: number,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'DATA_EXPORT',
    userId,
    resourceType,
    details: { recordCount },
    ipAddress,
    success: true,
  });
}

/**
 * Log audit trail for record changes
 */
export async function logAuditTrail(
  userId: number,
  action: 'create' | 'update' | 'delete',
  resourceType: string,
  resourceId: string,
  changes?: Record<string, { old: unknown; new: unknown }>,
  ipAddress?: string
): Promise<void> {
  const eventType = 
    action === 'create' ? 'AUDIT_RECORD_CREATE' :
    action === 'update' ? 'AUDIT_RECORD_UPDATE' :
    'AUDIT_RECORD_DELETE';
  
  await logSecurityEvent({
    eventType,
    userId,
    resourceType,
    resourceId,
    action,
    details: changes ? { changes } : null,
    ipAddress,
    success: true,
  });
}
