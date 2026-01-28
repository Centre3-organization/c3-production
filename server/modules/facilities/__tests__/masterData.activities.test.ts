import { describe, it, expect } from 'vitest';
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "password",
    role: "admin",
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("masterData router - Activities", () => {
  describe("getAllMainActivities", () => {
    it("returns list of main activities for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.getAllMainActivities();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAllSubActivities", () => {
    it("returns list of sub-activities for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.getAllSubActivities();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAllRoleTypes", () => {
    it("returns list of role types for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.getAllRoleTypes();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAllApprovers", () => {
    it("returns list of approvers for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.getAllApprovers();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createMainActivity", () => {
    it("creates a main activity for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.createMainActivity({
        name: "Test Activity " + Date.now(),
        nameAr: "نشاط اختبار",
        description: "Test description for activity",
        icon: "test-icon",
        color: "#FF0000"
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("createRoleType", () => {
    it("creates a role type for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.createRoleType({
        name: "Test Role " + Date.now(),
        nameAr: "دور اختبار",
        description: "Test role description",
        category: "internal",
        accessLevel: "standard"
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
