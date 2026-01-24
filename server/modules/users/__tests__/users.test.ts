import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  listUsers: vi.fn().mockResolvedValue({
    users: [
      { 
        id: 1, 
        openId: "user-1",
        name: "Mohsin", 
        email: "mohsin@centre3.com",
        role: "admin",
        status: "active",
        employeeId: "EMP-001",
        phone: "+966 50 123 4567",
        roleId: 1,
        departmentId: 1,
        createdAt: new Date(),
        lastSignedIn: new Date(),
      },
    ],
    total: 1,
  }),
  getUserById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({ 
        id: 1, 
        openId: "user-1",
        name: "Mohsin", 
        email: "mohsin@centre3.com",
        role: "admin",
        status: "active",
        roleId: 1,
        departmentId: 1,
      });
    }
    return Promise.resolve(undefined);
  }),
  createUser: vi.fn().mockResolvedValue(2),
  updateUser: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  getRoleById: vi.fn().mockResolvedValue({ 
    id: 1, 
    name: "Administrator",
    permissions: { users: { create: true, read: true, update: true, delete: true } }
  }),
  getDepartmentById: vi.fn().mockResolvedValue({ id: 1, name: "IT Operations" }),
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

describe("users router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns users list with total count for authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.list({});

      expect(result).toHaveProperty("users");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.total).toBe(1);
    });

    it("supports search filter", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.list({ search: "mohsin" });

      expect(result).toHaveProperty("users");
    });
  });

  describe("getById", () => {
    it("returns user for valid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.getById({ id: 1 });

      expect(result.name).toBe("Mohsin");
      expect(result.email).toBe("mohsin@centre3.com");
    });

    it("throws for invalid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.users.getById({ id: 999 })).rejects.toThrow("User not found");
    });
  });

  describe("create", () => {
    it("creates user for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.create({
        name: "Ali Test",
        email: "ali@centre3.com",
        password: "TempPass123!",
      });

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("userId", 2);
    });

    it("creates user with all optional fields", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.create({
        name: "Full User",
        email: "full@centre3.com",
        password: "TempPass123!",
        phone: "+966 50 123 4567",
        employeeId: "EMP-002",
        roleId: 1,
        departmentId: 1,
        status: "active",
      });

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("userId", 2);
    });

    it("throws for non-admin user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.create({
          name: "New User",
          email: "new@centre3.com",
          password: "TempPass123!",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid email", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.create({
          name: "Invalid Email",
          email: "not-an-email",
        })
      ).rejects.toThrow();
    });

    it("rejects empty name", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.create({
          name: "",
          email: "valid@email.com",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates user status for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.update({
        id: 1,
        status: "inactive",
      });

      expect(result).toHaveProperty("success", true);
    });

    it("updates user role and department", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.update({
        id: 1,
        roleId: 2,
        departmentId: 2,
      });

      expect(result).toHaveProperty("success", true);
    });

    it("throws for non-admin user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.update({
          id: 1,
          status: "inactive",
        })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("soft deletes user for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.delete({ id: 1 });

      expect(result).toHaveProperty("success", true);
    });

    it("throws for non-admin user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.users.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe("getMyPermissions", () => {
    it("returns full permissions for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.getMyPermissions();

      expect(result).toHaveProperty("users");
      expect(result?.users?.create).toBe(true);
      expect(result?.users?.delete).toBe(true);
    });

    it("returns limited permissions for regular user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.getMyPermissions();

      expect(result).toHaveProperty("users");
      expect(result?.users?.create).toBe(false);
      expect(result?.users?.delete).toBe(false);
    });
  });
});
