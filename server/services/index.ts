/**
 * Security Services Index
 * 
 * Exports all security-related services for easy import
 */

// MFA Service
export {
  setupMFA,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
  type MFASetupResult,
} from './mfa.service';

// RBAC Service
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  roleToPermissions,
  requirePermission,
  createPermissionChecker,
  SYSTEM_ROLES,
  type Permission,
  type Module,
  type Action,
  type RoleDefinition,
} from './rbac.service';

// Security Events Service
export {
  logSecurityEvent,
  logLoginSuccess,
  logLoginFailure,
  logAccessDenied,
  logDataExport,
  logAuditTrail,
  type SecurityEventType,
  type SecurityEventSeverity,
  type SecurityEventData,
} from './securityEvents.service';
