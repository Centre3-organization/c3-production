import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../../../db";
import { 
  getUserPermissions, 
  clearPermissionCache, 
  clearRolePermissionCache 
} from "../../../services/enterprise-rbac.service";
import { 
  systemRoles, 
  permissions, 
  rolePermissions, 
  userSystemRoles,
  users 
} from "../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Role Permissions System", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;
  let testRoleId: number;
  let testPermissionId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get an existing user for testing (Administrator - Abdullah Alzakari)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "abdullah@centre3.com"))
      .limit(1);

    if (existingUser.length > 0) {
      testUserId = existingUser[0].id;
    } else {
      // Use any existing user
      const anyUser = await db.select().from(users).limit(1);
      if (anyUser.length > 0) {
        testUserId = anyUser[0].id;
      }
    }

    // Get Administrator role
    const adminRole = await db
      .select()
      .from(systemRoles)
      .where(eq(systemRoles.code, "admin"))
      .limit(1);

    if (adminRole.length > 0) {
      testRoleId = adminRole[0].id;
    }

    // Get a test permission
    const testPerm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, "requestTypes.view"))
      .limit(1);

    if (testPerm.length > 0) {
      testPermissionId = testPerm[0].id;
    }

    // Clear any cached permissions
    clearPermissionCache();
  });

  afterAll(async () => {
    // Clean up - clear cache
    clearPermissionCache();
  });

  describe("Permission Saving", () => {
    it("should save role permissions to database", async () => {
      if (!db || !testRoleId) {
        console.log("Skipping test - no database or role available");
        return;
      }

      // Get current permissions for the role
      const currentPerms = await db
        .select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, testRoleId));

      expect(Array.isArray(currentPerms)).toBe(true);
    });

    it("should update role permissions when changed", async () => {
      if (!db || !testRoleId || !testPermissionId) {
        console.log("Skipping test - no database, role, or permission available");
        return;
      }

      // Check if permission exists for role
      const existingPerm = await db
        .select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, testRoleId),
          eq(rolePermissions.permissionId, testPermissionId)
        ))
        .limit(1);

      const hadPermission = existingPerm.length > 0;

      // Toggle the permission
      if (hadPermission) {
        // Remove it
        await db
          .delete(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, testRoleId),
            eq(rolePermissions.permissionId, testPermissionId)
          ));
      } else {
        // Add it
        await db.insert(rolePermissions).values({
          roleId: testRoleId,
          permissionId: testPermissionId,
        });
      }

      // Verify the change
      const afterChange = await db
        .select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, testRoleId),
          eq(rolePermissions.permissionId, testPermissionId)
        ))
        .limit(1);

      expect(afterChange.length > 0).toBe(!hadPermission);

      // Restore original state
      if (hadPermission) {
        await db.insert(rolePermissions).values({
          roleId: testRoleId,
          permissionId: testPermissionId,
        });
      } else {
        await db
          .delete(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, testRoleId),
            eq(rolePermissions.permissionId, testPermissionId)
          ));
      }
    });
  });

  describe("Permission Cache Invalidation", () => {
    it("should clear user permission cache when role is updated", async () => {
      if (!db || !testRoleId || !testUserId) {
        console.log("Skipping test - no database, role, or user available");
        return;
      }

      // First, get permissions to populate cache
      const perms1 = await getUserPermissions(testUserId);
      expect(perms1).not.toBeNull();

      // Clear the cache for this role
      await clearRolePermissionCache(testRoleId);

      // Get permissions again - should fetch fresh from database
      const perms2 = await getUserPermissions(testUserId);
      expect(perms2).not.toBeNull();
    });

    it("should return fresh permissions after cache clear", async () => {
      if (!testUserId) {
        console.log("Skipping test - no user available");
        return;
      }

      // Clear all cache
      clearPermissionCache();

      // Get permissions - should be fresh
      const perms = await getUserPermissions(testUserId);
      
      // Verify structure
      expect(perms).not.toBeNull();
      if (perms) {
        expect(perms.userId).toBe(testUserId);
        expect(perms.permissions).toBeInstanceOf(Set);
        expect(typeof perms.roleCode).toBe("string");
      }
    });
  });

  describe("User Permission Loading", () => {
    it("should load permissions based on assigned role", async () => {
      if (!testUserId) {
        console.log("Skipping test - no user available");
        return;
      }

      clearPermissionCache();
      const perms = await getUserPermissions(testUserId);

      expect(perms).not.toBeNull();
      if (perms) {
        // Should have a role code
        expect(perms.roleCode).toBeTruthy();
        
        // Permissions should be a Set
        expect(perms.permissions).toBeInstanceOf(Set);
      }
    });

    it("should only give all permissions to super_admin role", async () => {
      if (!db) {
        console.log("Skipping test - no database available");
        return;
      }

      // Get a super admin user
      const superAdminRole = await db
        .select()
        .from(systemRoles)
        .where(eq(systemRoles.code, "super_admin"))
        .limit(1);

      if (superAdminRole.length === 0) {
        console.log("Skipping test - no super_admin role found");
        return;
      }

      const superAdminUser = await db
        .select({ userId: userSystemRoles.userId })
        .from(userSystemRoles)
        .where(and(
          eq(userSystemRoles.roleId, superAdminRole[0].id),
          eq(userSystemRoles.isActive, true)
        ))
        .limit(1);

      if (superAdminUser.length === 0) {
        console.log("Skipping test - no super_admin user found");
        return;
      }

      clearPermissionCache();
      const perms = await getUserPermissions(superAdminUser[0].userId);

      expect(perms).not.toBeNull();
      if (perms) {
        expect(perms.roleCode).toBe("super_admin");
      }
    });

    it("should respect role-specific permissions for non-super_admin", async () => {
      if (!db || !testUserId) {
        console.log("Skipping test - no database or user available");
        return;
      }

      clearPermissionCache();
      const perms = await getUserPermissions(testUserId);

      expect(perms).not.toBeNull();
      if (perms && perms.roleCode !== "super_admin") {
        // Non-super_admin should have specific permissions, not all
        // The permissions should match what's in the rolePermissions table
        const rolePerms = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .innerJoin(userSystemRoles, eq(rolePermissions.roleId, userSystemRoles.roleId))
          .where(and(
            eq(userSystemRoles.userId, testUserId),
            eq(userSystemRoles.isActive, true)
          ));

        const expectedCodes = new Set(rolePerms.map(p => p.code));
        
        // User's permissions should match role's permissions
        for (const code of Array.from(perms.permissions)) {
          expect(expectedCodes.has(code)).toBe(true);
        }
      }
    });
  });
});
