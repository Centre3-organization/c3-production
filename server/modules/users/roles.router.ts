import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../../_core/trpc";
import { getDb } from "../../db";
import { eq, and, sql, like, or } from "drizzle-orm";
import {
  systemRoles,
  permissions,
  rolePermissions,
  userSystemRoles,
} from "../../../drizzle/schema";
import {
  getAllSystemRoles,
  getAllPermissions,
  getRolePermissions,
  clearRolePermissionCache,
} from "../../services/enterprise-rbac.service";

export const rolesRouter = router({
  // List all system roles with user counts
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get all system roles with user counts
      const roles = await db
        .select({
          id: systemRoles.id,
          code: systemRoles.code,
          name: systemRoles.name,
          description: systemRoles.description,
          level: systemRoles.level,
          isSystem: systemRoles.isSystem,
          isActive: systemRoles.isActive,
          createdAt: systemRoles.createdAt,
        })
        .from(systemRoles)
        .where(
          and(
            input?.isActive !== undefined ? eq(systemRoles.isActive, input.isActive) : eq(systemRoles.isActive, true),
            input?.search ? or(
              like(systemRoles.name, `%${input.search}%`),
              like(systemRoles.code, `%${input.search}%`)
            ) : undefined
          )
        )
        .orderBy(systemRoles.level);

      // Get user counts for each role
      const userCounts = await db
        .select({
          roleId: userSystemRoles.roleId,
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(userSystemRoles)
        .where(eq(userSystemRoles.isActive, true))
        .groupBy(userSystemRoles.roleId);

      const userCountMap = new Map(userCounts.map(uc => [uc.roleId, uc.count]));

      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const rolePerms = await db
            .select({
              code: permissions.code,
              module: permissions.module,
              action: permissions.action,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, role.id));

          // Convert to the old format for backward compatibility
          const permissionsObj: Record<string, Record<string, boolean>> = {};
          for (const perm of rolePerms) {
            if (!permissionsObj[perm.module]) {
              permissionsObj[perm.module] = {};
            }
            permissionsObj[perm.module][perm.action] = true;
          }

          return {
            ...role,
            userCount: userCountMap.get(role.id) || 0,
            permissions: permissionsObj,
          };
        })
      );

      return rolesWithPermissions;
    }),

  // Get role by ID with permissions
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const role = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.id, input.id))
        .limit(1);

      if (role.length === 0) {
        throw new Error("Role not found");
      }

      // Get permissions for this role
      const rolePerms = await db
        .select({
          code: permissions.code,
          module: permissions.module,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, input.id));

      // Convert to the old format
      const permissionsObj: Record<string, Record<string, boolean>> = {};
      for (const perm of rolePerms) {
        if (!permissionsObj[perm.module]) {
          permissionsObj[perm.module] = {};
        }
        permissionsObj[perm.module][perm.action] = true;
      }

      // Get user count
      const userCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userSystemRoles)
        .where(and(
          eq(userSystemRoles.roleId, input.id),
          eq(userSystemRoles.isActive, true)
        ));

      return {
        ...role[0],
        userCount: userCount[0]?.count || 0,
        permissions: permissionsObj,
      };
    }),

  // Get all available permissions grouped by module
  getPermissions: protectedProcedure.query(async () => {
    return getAllPermissions();
  }),

  // Update role permissions (admin only)
  updatePermissions: requirePermission("roles:update")
    .input(
      z.object({
        roleId: z.number(),
        permissions: z.array(z.string()), // Array of permission codes
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if role exists and is not a system role that shouldn't be modified
      const role = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.id, input.roleId))
        .limit(1);

      if (role.length === 0) {
        throw new Error("Role not found");
      }

      // Super Admin role cannot have permissions modified
      if (role[0].code === "super_admin") {
        throw new Error("Cannot modify Super Admin permissions");
      }

      // Get all permission IDs for the given codes
      const permissionRecords = await db
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions)
        .where(eq(permissions.isActive, true));

      const permissionMap = new Map(permissionRecords.map(p => [p.code, p.id]));

      // Delete existing role permissions
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, input.roleId));

      // Insert new role permissions
      const newPermissions = input.permissions
        .filter(code => permissionMap.has(code))
        .map(code => ({
          roleId: input.roleId,
          permissionId: permissionMap.get(code)!,
        }));

      if (newPermissions.length > 0) {
        await db.insert(rolePermissions).values(newPermissions);
      }

      // Clear permission cache for all users with this role
      await clearRolePermissionCache(input.roleId);

      return { success: true };
    }),

  // Create new custom role (admin only)
  create: requirePermission("roles:create")
    .input(
      z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(50),
        description: z.string().optional(),
        level: z.number().min(1).max(100).default(50),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if code already exists
      const existing = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.code, input.code))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Role code already exists");
      }

      // Insert new role
      const result = await db.insert(systemRoles).values({
        code: input.code,
        name: input.name,
        description: input.description || null,
        level: input.level,
        isSystem: false,
      });

      const roleId = Number((result as any).insertId);

      // Add permissions if provided
      if (input.permissions && input.permissions.length > 0) {
        const permissionRecords = await db
          .select({ id: permissions.id, code: permissions.code })
          .from(permissions)
          .where(eq(permissions.isActive, true));

        const permissionMap = new Map(permissionRecords.map(p => [p.code, p.id]));

        const newPermissions = input.permissions
          .filter(code => permissionMap.has(code))
          .map(code => ({
            roleId,
            permissionId: permissionMap.get(code)!,
          }));

        if (newPermissions.length > 0) {
          await db.insert(rolePermissions).values(newPermissions);
        }
      }

      return { id: roleId };
    }),

  // Update role (admin only)
  update: requirePermission("roles:update")
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        level: z.number().min(1).max(100).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;

      // Check if trying to modify a system role's name
      const existing = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Role not found");
      }

      if (existing[0].isSystem && data.name && data.name !== existing[0].name) {
        throw new Error("Cannot rename system roles");
      }

      await db
        .update(systemRoles)
        .set(data)
        .where(eq(systemRoles.id, id));

      return { success: true };
    }),

  // Delete role (admin only) - soft delete
  delete: requirePermission("roles:delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if role is a system role
      const role = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.id, input.id))
        .limit(1);

      if (role.length === 0) {
        throw new Error("Role not found");
      }

      if (role[0].isSystem) {
        throw new Error("Cannot delete system roles");
      }

      // Check if role has users assigned
      const userCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userSystemRoles)
        .where(and(
          eq(userSystemRoles.roleId, input.id),
          eq(userSystemRoles.isActive, true)
        ));

      if (userCount[0]?.count > 0) {
        throw new Error("Cannot delete role with assigned users");
      }

      // Soft delete
      await db
        .update(systemRoles)
        .set({ isActive: false })
        .where(eq(systemRoles.id, input.id));

      return { success: true };
    }),
});
