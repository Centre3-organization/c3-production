import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  listDepartments: vi.fn().mockResolvedValue([
    { id: 1, name: "IT Operations", costCenter: "IT-001", isActive: true },
    { id: 2, name: "Security", costCenter: "SEC-001", isActive: true },
  ]),
  getDepartmentById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({ id: 1, name: "IT Operations", costCenter: "IT-001", isActive: true });
    }
    return Promise.resolve(undefined);
  }),
  createDepartment: vi.fn().mockResolvedValue(3),
  updateDepartment: vi.fn().mockResolvedValue(undefined),
  deleteDepartment: vi.fn().mockResolvedValue(undefined),
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

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("departments router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns departments for authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("IT Operations");
    });

    it("throws for unauthenticated user", async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.list()).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("returns department for valid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.getById({ id: 1 });

      expect(result.name).toBe("IT Operations");
    });

    it("throws for invalid ID", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.getById({ id: 999 })).rejects.toThrow("Department not found");
    });
  });

  describe("create", () => {
    it("creates department for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.create({
        name: "New Department",
        costCenter: "NEW-001",
      });

      expect(result.id).toBe(3);
    });

    it("throws for non-admin user", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({
          name: "New Department",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates department for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.update({
        id: 1,
        name: "Updated Department",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("deletes department for admin user", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });
});
