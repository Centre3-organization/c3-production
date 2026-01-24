import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  listRoles: vi.fn().mockResolvedValue([
    { 
      id: 1, 
      name: "Administrator", 
      description: "Full system access",
      isSystem: true,
      isActive: true,
      permissions: {
        requests: { create: true, read: true, update: true, delete: true },
        approvals: { l1: true, manual: true },
      }
    },
    { 
      id: 2, 
      name: "Security Guard", 
      description: "Monitors security events",
      isSystem: true,
      isActive: true,
      permissions: {
        requests: { create: false, read: true, update: false, delete: false },
        approvals: { l1: false, manual: false },
      }
    },
  ]),
  getRoleById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({ 
        id: 1, 
        name: "Administrator", 
        isSystem: true,
        isActive: true,
        permissions: {
          requests: { create: true, read: true, update: true, delete: true },
        }
      });
    }
    if (id === 2) {
      return Promise.resolve({ 
        id: 2, 
        name: "Custom Role", 
        isSystem: false,
        isActive: true,
        permissions: {}
      });
    }
    return Promise.resolve(undefined);
  }),
  createRole: vi.fn().mockResolvedValue(3),
  updateRole: vi.fn().mockResolvedValue(undefined),
  deleteRole: vi.fn().mockResolvedValue(undefined),
  seedDefaultRoles: vi.fn().mockResolvedValue(undefined),
  seedDefaultDepartments: vi.fn().mockResolvedValue(undefined),
}));

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      status: "active",
      employeeId: null,
      phone: null,
      avatar: null,
      roleId: null,
      departmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("roles router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns roles for authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roles.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Administrator");
    });
  });

  describe("getById", () => {
    it("returns role for valid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roles.getById({ id: 1 });

      expect(result.name).toBe("Administrator");
      expect(result.isSystem).toBe(true);
    });

    it("throws for invalid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.roles.getById({ id: 999 })).rejects.toThrow("Role not found");
    });
  });

  describe("create", () => {
    it("creates role for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roles.create({
        name: "New Role",
        description: "A new custom role",
        permissions: {
          requests: { create: true, read: true, update: false, delete: false },
        },
      });

      expect(result.id).toBe(3);
    });

    it("throws for non-admin user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.roles.create({
          name: "New Role",
          permissions: {},
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates role permissions for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roles.update({
        id: 2,
        permissions: {
          requests: { create: true, read: true, update: true, delete: false },
        },
      });

      expect(result.success).toBe(true);
    });

    it("prevents renaming system roles", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.roles.update({
          id: 1,
          name: "Renamed Admin",
        })
      ).rejects.toThrow("Cannot rename system roles");
    });
  });

  describe("delete", () => {
    it("deletes non-system role for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.roles.delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});
