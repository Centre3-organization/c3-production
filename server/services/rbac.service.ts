/**
 * Role-Based Access Control (RBAC) Service
 * 
 * Implements comprehensive RBAC:
 * - Permission checking
 * - Role hierarchy
 * - Resource-based access control
 */

import { TRPCError } from '@trpc/server';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export type Permission = 
  // User management
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
  // Group management
  | 'groups:read' | 'groups:create' | 'groups:update' | 'groups:delete'
  // Request management
  | 'requests:read' | 'requests:create' | 'requests:update' | 'requests:delete' | 'requests:approve'
  // Facility management
  | 'facilities:read' | 'facilities:create' | 'facilities:update' | 'facilities:delete'
  // Master data management
  | 'masterData:read' | 'masterData:create' | 'masterData:update' | 'masterData:delete'
  // Reports
  | 'reports:read' | 'reports:export'
  // Settings
  | 'settings:read' | 'settings:update'
  // Admin
  | 'admin:access' | 'admin:roles' | 'admin:audit';

export type Module = 
  | 'users' | 'groups' | 'requests' | 'facilities' 
  | 'masterData' | 'reports' | 'settings' | 'admin';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'access' | 'roles' | 'audit';

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
}

export const SYSTEM_ROLES: Record<string, RoleDefinition> = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'groups:read', 'groups:create', 'groups:update', 'groups:delete',
      'requests:read', 'requests:create', 'requests:update', 'requests:delete', 'requests:approve',
      'facilities:read', 'facilities:create', 'facilities:update', 'facilities:delete',
      'masterData:read', 'masterData:create', 'masterData:update', 'masterData:delete',
      'reports:read', 'reports:export',
      'settings:read', 'settings:update',
      'admin:access', 'admin:roles', 'admin:audit',
    ],
  },
  manager: {
    name: 'Manager',
    description: 'Department/team management access',
    permissions: [
      'users:read', 'users:update',
      'groups:read', 'groups:create', 'groups:update',
      'requests:read', 'requests:create', 'requests:update', 'requests:approve',
      'facilities:read',
      'masterData:read',
      'reports:read', 'reports:export',
      'settings:read',
    ],
  },
  approver: {
    name: 'Approver',
    description: 'Request approval access',
    permissions: [
      'users:read',
      'groups:read',
      'requests:read', 'requests:approve',
      'facilities:read',
      'masterData:read',
      'reports:read',
    ],
  },
  user: {
    name: 'User',
    description: 'Standard user access',
    permissions: [
      'users:read',
      'groups:read',
      'requests:read', 'requests:create',
      'facilities:read',
      'masterData:read',
    ],
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'users:read',
      'groups:read',
      'requests:read',
      'facilities:read',
      'masterData:read',
    ],
  },
};

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  rolePermissions: Record<string, Record<string, boolean>> | null,
  module: Module,
  action: Action
): boolean {
  if (!rolePermissions) return false;
  
  const modulePerms = rolePermissions[module];
  if (!modulePerms) return false;
  
  return modulePerms[action] === true;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  rolePermissions: Record<string, Record<string, boolean>> | null,
  permissions: Array<{ module: Module; action: Action }>
): boolean {
  return permissions.some(p => hasPermission(rolePermissions, p.module, p.action));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  rolePermissions: Record<string, Record<string, boolean>> | null,
  permissions: Array<{ module: Module; action: Action }>
): boolean {
  return permissions.every(p => hasPermission(rolePermissions, p.module, p.action));
}

/**
 * Convert system role to permissions object
 */
export function roleToPermissions(roleName: string): Record<string, Record<string, boolean>> {
  const role = SYSTEM_ROLES[roleName];
  if (!role) return {};
  
  const permissions: Record<string, Record<string, boolean>> = {};
  
  for (const perm of role.permissions) {
    const [module, action] = perm.split(':') as [Module, Action];
    if (!permissions[module]) {
      permissions[module] = {};
    }
    permissions[module][action] = true;
  }
  
  return permissions;
}

/**
 * Require permission or throw TRPC error
 */
export function requirePermission(
  rolePermissions: Record<string, Record<string, boolean>> | null,
  module: Module,
  action: Action
): void {
  if (!hasPermission(rolePermissions, module, action)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Permission denied: ${module}:${action}`,
    });
  }
}

/**
 * Create a permission checker for a specific user
 */
export function createPermissionChecker(
  rolePermissions: Record<string, Record<string, boolean>> | null
) {
  return {
    has: (module: Module, action: Action) => hasPermission(rolePermissions, module, action),
    hasAny: (perms: Array<{ module: Module; action: Action }>) => hasAnyPermission(rolePermissions, perms),
    hasAll: (perms: Array<{ module: Module; action: Action }>) => hasAllPermissions(rolePermissions, perms),
    require: (module: Module, action: Action) => requirePermission(rolePermissions, module, action),
  };
}
