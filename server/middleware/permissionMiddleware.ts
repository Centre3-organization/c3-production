/**
 * Permission Middleware for tRPC
 * 
 * Provides middleware functions to check permissions in tRPC procedures
 */

import { TRPCError } from "@trpc/server";
import { hasPermission, hasAnyPermission, hasAllPermissions, getDataScopeFilter, type PermissionCode } from "../services/enterprise-rbac.service";

/**
 * Check if the current user has a specific permission
 * Throws FORBIDDEN error if permission is not granted
 */
export async function requirePermission(userId: number | undefined, permission: PermissionCode): Promise<void> {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const hasAccess = await hasPermission(userId, permission);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permission denied: ${permission}`,
    });
  }
}

/**
 * Check if the current user has any of the specified permissions
 * Throws FORBIDDEN error if none of the permissions are granted
 */
export async function requireAnyPermission(userId: number | undefined, permissions: PermissionCode[]): Promise<void> {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const hasAccess = await hasAnyPermission(userId, permissions);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permission denied: requires one of [${permissions.join(", ")}]`,
    });
  }
}

/**
 * Check if the current user has all of the specified permissions
 * Throws FORBIDDEN error if any permission is not granted
 */
export async function requireAllPermissions(userId: number | undefined, permissions: PermissionCode[]): Promise<void> {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const hasAccess = await hasAllPermissions(userId, permissions);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permission denied: requires all of [${permissions.join(", ")}]`,
    });
  }
}

/**
 * Get data scope filter for the current user
 * Returns null if user is not authenticated
 */
export async function getRequestDataScope(userId: number | undefined, resourceType: string) {
  if (!userId) {
    return null;
  }

  return getDataScopeFilter(userId, resourceType);
}

/**
 * Apply data scope filter to a query
 * Returns SQL conditions based on user's data scope
 */
export function buildScopeCondition(
  scope: Awaited<ReturnType<typeof getDataScopeFilter>>,
  fieldMappings: {
    userId?: string;
    siteId?: string;
    zoneId?: string;
    groupId?: string;
    departmentId?: string;
  }
): { field: string; values: number[] } | null {
  if (!scope) return null;

  switch (scope.scopeType) {
    case "global":
      return null; // No filtering needed

    case "self":
      if (scope.userIds && fieldMappings.userId) {
        return { field: fieldMappings.userId, values: scope.userIds };
      }
      break;

    case "site":
      if (scope.siteIds && fieldMappings.siteId) {
        return { field: fieldMappings.siteId, values: scope.siteIds };
      }
      break;

    case "zone":
      if (scope.zoneIds && fieldMappings.zoneId) {
        return { field: fieldMappings.zoneId, values: scope.zoneIds };
      }
      break;

    case "group":
      if (scope.groupIds && fieldMappings.groupId) {
        return { field: fieldMappings.groupId, values: scope.groupIds };
      }
      break;

    case "department":
      if (scope.departmentIds && fieldMappings.departmentId) {
        return { field: fieldMappings.departmentId, values: scope.departmentIds };
      }
      break;
  }

  return null;
}
