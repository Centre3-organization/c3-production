/**
 * Enterprise RBAC Service
 * 
 * Provides comprehensive role-based access control with:
 * - Permission checking (module:action pattern)
 * - Data scoping (global, site, zone, group, self)
 * - Role hierarchy
 * - Site/Zone assignments
 */

import { getDb } from "../db";
import { eq, and, sql } from "drizzle-orm";
import {
  systemRoles,
  permissions,
  rolePermissions,
  userSystemRoles,
  dataScopeRules,
  userSiteAssignments,
  userZoneAssignments,
  users,
} from "../../drizzle/schema";

// Types
export type PermissionCode = string; // e.g., "users:create", "requests:approve"
export type ScopeType = "global" | "site" | "zone" | "group" | "department" | "self";

export interface UserPermissions {
  userId: number;
  roleCode: string;
  roleLevel: number;
  permissions: Set<string>;
  dataScopes: Map<string, ScopeType>;
  assignedSites: number[];
  assignedZones: number[];
}

export interface DataScopeFilter {
  resourceType: string;
  scopeType: ScopeType;
  userIds?: number[];
  siteIds?: number[];
  zoneIds?: number[];
  groupIds?: number[];
  departmentIds?: number[];
}

// Cache for user permissions (TTL: 5 minutes)
const permissionCache = new Map<number, { data: UserPermissions; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user's permissions and role information
 */
export async function getUserPermissions(userId: number): Promise<UserPermissions | null> {
  // Check cache
  const cached = permissionCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const db = await getDb();
  if (!db) return null;

  // Get user's system role
  const userRole = await db
    .select({
      roleId: userSystemRoles.roleId,
      roleCode: systemRoles.code,
      roleLevel: systemRoles.level,
    })
    .from(userSystemRoles)
    .innerJoin(systemRoles, eq(userSystemRoles.roleId, systemRoles.id))
    .where(and(eq(userSystemRoles.userId, userId), eq(userSystemRoles.isActive, true)))
    .limit(1);

  if (userRole.length === 0) {
    // Default to requestor role if no role assigned
    const defaultRole = await db
      .select()
      .from(systemRoles)
      .where(eq(systemRoles.code, "requestor"))
      .limit(1);

    if (defaultRole.length === 0) {
      return null;
    }

    // Auto-assign requestor role
    await db.insert(userSystemRoles).values({
      userId,
      roleId: defaultRole[0].id,
    });

    return getUserPermissions(userId); // Recursive call to get permissions
  }

  const { roleId, roleCode, roleLevel } = userRole[0];

  // Get permissions for this role
  const rolePerms = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  const permissionSet = new Set<string>(rolePerms.map((p) => p.code));

  // Get data scope rules for this role
  const scopeRules = await db
    .select({
      resourceType: dataScopeRules.resourceType,
      scopeType: dataScopeRules.scopeType,
    })
    .from(dataScopeRules)
    .where(and(eq(dataScopeRules.roleId, roleId), eq(dataScopeRules.isActive, true)));

  const dataScopes = new Map<string, ScopeType>();
  for (const rule of scopeRules) {
    dataScopes.set(rule.resourceType, rule.scopeType);
  }

  // Get assigned sites
  const siteAssignments = await db
    .select({ siteId: userSiteAssignments.siteId })
    .from(userSiteAssignments)
    .where(and(eq(userSiteAssignments.userId, userId), eq(userSiteAssignments.isActive, true)));

  // Get assigned zones
  const zoneAssignments = await db
    .select({ zoneId: userZoneAssignments.zoneId })
    .from(userZoneAssignments)
    .where(and(eq(userZoneAssignments.userId, userId), eq(userZoneAssignments.isActive, true)));

  const result: UserPermissions = {
    userId,
    roleCode,
    roleLevel,
    permissions: permissionSet,
    dataScopes,
    assignedSites: siteAssignments.map((s) => s.siteId),
    assignedZones: zoneAssignments.map((z) => z.zoneId),
  };

  // Cache the result
  permissionCache.set(userId, { data: result, expires: Date.now() + CACHE_TTL });

  return result;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: number, permission: PermissionCode): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  // Super admin has all permissions
  if (userPerms.roleCode === "super_admin") return true;

  return userPerms.permissions.has(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: number, perms: PermissionCode[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  // Super admin has all permissions
  if (userPerms.roleCode === "super_admin") return true;

  return perms.some((p) => userPerms.permissions.has(p));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: number, perms: PermissionCode[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  // Super admin has all permissions
  if (userPerms.roleCode === "super_admin") return true;

  return perms.every((p) => userPerms.permissions.has(p));
}

/**
 * Get data scope filter for a resource type
 * Returns filter criteria based on user's role and assignments
 */
export async function getDataScopeFilter(
  userId: number,
  resourceType: string
): Promise<DataScopeFilter | null> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return null;

  const db = await getDb();
  if (!db) return null;

  // Super admin and admin have global scope
  if (userPerms.roleCode === "super_admin" || userPerms.roleCode === "admin") {
    return { resourceType, scopeType: "global" };
  }

  // Get scope type for this resource
  const scopeType = userPerms.dataScopes.get(resourceType) || "self";

  const filter: DataScopeFilter = { resourceType, scopeType };

  switch (scopeType) {
    case "global":
      // No filtering needed
      break;

    case "site":
      filter.siteIds = userPerms.assignedSites;
      break;

    case "zone":
      filter.zoneIds = userPerms.assignedZones;
      break;

    case "group":
      // Get user's group memberships
      const userGroups = await db.execute(
        sql`SELECT groupId FROM userGroupMembership WHERE userId = ${userId} AND status = 'active'`
      );
      filter.groupIds = (userGroups as unknown as Array<{ groupId: number }>).map((g) => g.groupId);
      break;

    case "department":
      // Get user's department
      const user = await db
        .select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user[0]?.departmentId) {
        filter.departmentIds = [user[0].departmentId];
      }
      break;

    case "self":
      filter.userIds = [userId];
      break;
  }

  return filter;
}

/**
 * Check if user can access a specific site
 */
export async function canAccessSite(userId: number, siteId: number): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  // Super admin and admin can access all sites
  if (userPerms.roleCode === "super_admin" || userPerms.roleCode === "admin") {
    return true;
  }

  return userPerms.assignedSites.includes(siteId);
}

/**
 * Check if user can access a specific zone
 */
export async function canAccessZone(userId: number, zoneId: number): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;

  // Super admin and admin can access all zones
  if (userPerms.roleCode === "super_admin" || userPerms.roleCode === "admin") {
    return true;
  }

  return userPerms.assignedZones.includes(zoneId);
}

/**
 * Get user's role level (lower = more privileged)
 */
export async function getUserRoleLevel(userId: number): Promise<number> {
  const userPerms = await getUserPermissions(userId);
  return userPerms?.roleLevel ?? 999; // Return high number if no role
}

/**
 * Check if user has higher or equal privilege than another user
 */
export async function hasHigherPrivilege(userId: number, targetUserId: number): Promise<boolean> {
  // Cannot have higher privilege than yourself
  if (userId === targetUserId) return false;
  
  const userLevel = await getUserRoleLevel(userId);
  const targetLevel = await getUserRoleLevel(targetUserId);
  
  // Level 0 means no role assigned - cannot have higher privilege
  if (userLevel === 0) return false;
  
  // Lower level number = higher privilege (e.g., level 1 super_admin > level 5 user)
  return userLevel < targetLevel;
}

/**
 * Assign a system role to a user by role ID
 */
export async function assignRoleById(
  userId: number,
  roleId: number,
  assignedBy: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const role = await db
    .select()
    .from(systemRoles)
    .where(eq(systemRoles.id, roleId))
    .limit(1);

  if (role.length === 0) return false;

  // Deactivate ALL existing role assignments for this user
  await db
    .update(userSystemRoles)
    .set({ isActive: false })
    .where(eq(userSystemRoles.userId, userId));

  // Check if this user-role combination already exists (even if inactive)
  const existingAssignment = await db
    .select()
    .from(userSystemRoles)
    .where(and(
      eq(userSystemRoles.userId, userId),
      eq(userSystemRoles.roleId, roleId)
    ))
    .limit(1);

  if (existingAssignment.length > 0) {
    // Reactivate the existing assignment
    await db
      .update(userSystemRoles)
      .set({ 
        isActive: true, 
        assignedBy,
        assignedAt: new Date()
      })
      .where(eq(userSystemRoles.id, existingAssignment[0].id));
  } else {
    // Create new assignment
    await db.insert(userSystemRoles).values({
      userId,
      roleId,
      assignedBy,
    });
  }

  // Clear cache
  permissionCache.delete(userId);

  return true;
}

/**
 * Assign a system role to a user by role code
 */
export async function assignRole(
  userId: number,
  roleCode: string,
  assignedBy: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const role = await db
    .select()
    .from(systemRoles)
    .where(eq(systemRoles.code, roleCode))
    .limit(1);

  if (role.length === 0) return false;

  // Deactivate ALL existing role assignments for this user
  await db
    .update(userSystemRoles)
    .set({ isActive: false })
    .where(eq(userSystemRoles.userId, userId));

  // Check if this user-role combination already exists (even if inactive)
  const existingAssignment = await db
    .select()
    .from(userSystemRoles)
    .where(and(
      eq(userSystemRoles.userId, userId),
      eq(userSystemRoles.roleId, role[0].id)
    ))
    .limit(1);

  if (existingAssignment.length > 0) {
    // Reactivate the existing assignment
    await db
      .update(userSystemRoles)
      .set({ 
        isActive: true, 
        assignedBy,
        assignedAt: new Date()
      })
      .where(eq(userSystemRoles.id, existingAssignment[0].id));
  } else {
    // Create new assignment
    await db.insert(userSystemRoles).values({
      userId,
      roleId: role[0].id,
      assignedBy,
    });
  }

  // Clear cache
  permissionCache.delete(userId);

  return true;
}

/**
 * Assign user to a site
 */
export async function assignUserToSite(
  userId: number,
  siteId: number,
  accessLevel: "view" | "operate" | "manage" | "admin",
  assignedBy: number,
  isPrimary: boolean = false
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if assignment already exists
  const existing = await db
    .select()
    .from(userSiteAssignments)
    .where(and(eq(userSiteAssignments.userId, userId), eq(userSiteAssignments.siteId, siteId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(userSiteAssignments)
      .set({ accessLevel, isPrimary, isActive: true })
      .where(eq(userSiteAssignments.id, existing[0].id));
  } else {
    // Create new
    await db.insert(userSiteAssignments).values({
      userId,
      siteId,
      accessLevel,
      isPrimary,
      assignedBy,
    });
  }

  // Clear cache
  permissionCache.delete(userId);

  return true;
}

/**
 * Assign user to a zone
 */
export async function assignUserToZone(
  userId: number,
  zoneId: number,
  accessLevel: "view" | "operate" | "manage" | "admin",
  assignedBy: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if assignment already exists
  const existing = await db
    .select()
    .from(userZoneAssignments)
    .where(and(eq(userZoneAssignments.userId, userId), eq(userZoneAssignments.zoneId, zoneId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(userZoneAssignments)
      .set({ accessLevel, isActive: true })
      .where(eq(userZoneAssignments.id, existing[0].id));
  } else {
    // Create new
    await db.insert(userZoneAssignments).values({
      userId,
      zoneId,
      accessLevel,
      assignedBy,
    });
  }

  // Clear cache
  permissionCache.delete(userId);

  return true;
}

/**
 * Clear permission cache for a user
 */
export function clearPermissionCache(userId?: number): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * Clear permission cache for all users with a specific role
 * Called when role permissions are updated
 */
export async function clearRolePermissionCache(roleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get all users with this role
  const usersWithRole = await db
    .select({ userId: userSystemRoles.userId })
    .from(userSystemRoles)
    .where(and(eq(userSystemRoles.roleId, roleId), eq(userSystemRoles.isActive, true)));

  // Clear cache for each user
  for (const user of usersWithRole) {
    permissionCache.delete(user.userId);
  }
}

/**
 * Get all system roles
 */
export async function getAllSystemRoles() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(systemRoles)
    .where(eq(systemRoles.isActive, true))
    .orderBy(systemRoles.level);
}

/**
 * Get all permissions grouped by category
 */
export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return {};

  const perms = await db
    .select()
    .from(permissions)
    .where(eq(permissions.isActive, true))
    .orderBy(permissions.category, permissions.module);

  // Group by category
  const grouped: Record<string, typeof perms> = {};
  for (const perm of perms) {
    const category = perm.category || "Other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(perm);
  }

  return grouped;
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
}

/**
 * Get user's current system role
 */
export async function getUserSystemRole(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      role: systemRoles,
    })
    .from(userSystemRoles)
    .innerJoin(systemRoles, eq(userSystemRoles.roleId, systemRoles.id))
    .where(and(eq(userSystemRoles.userId, userId), eq(userSystemRoles.isActive, true)))
    .limit(1);

  return result[0]?.role || null;
}
