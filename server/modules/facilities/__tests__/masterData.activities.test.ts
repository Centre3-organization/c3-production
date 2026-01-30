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

  describe("getAllCompanies", () => {
    it("returns list of companies for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.getAllCompanies();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createCompany", () => {
    it("creates a contractor company for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.createCompany({
        code: "TEST-" + Date.now(),
        name: "Test Contractor Company " + Date.now(),
        nameAr: "شركة مقاول اختبارية",
        type: "contractor",
        contactPersonName: "John Doe",
        contactPersonEmail: "john@test.com",
        contactPersonPhone: "+966501234567",
        contactPersonPosition: "Project Manager",
        contractReference: "CNT-2024-001",
        contractStartDate: "2024-01-01",
        contractEndDate: "2025-12-31",
        address: "123 Test Street",
        city: "Riyadh",
        country: "Saudi Arabia",
        registrationNumber: "CR-12345",
        status: "active",
        notes: "Test company for unit testing"
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toContain("Test Contractor Company");
    });

    it("creates a client company for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.masterData.createCompany({
        code: "CLIENT-" + Date.now(),
        name: "Test Client Company " + Date.now(),
        type: "client",
        status: "active"
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("creates a subcontractor company with parent for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a contractor
      const contractor = await caller.masterData.createCompany({
        code: "PARENT-" + Date.now(),
        name: "Parent Contractor " + Date.now(),
        type: "contractor",
        status: "active"
      });

      // Then create a subcontractor under it
      const result = await caller.masterData.createCompany({
        code: "SUB-" + Date.now(),
        name: "Test Subcontractor " + Date.now(),
        type: "subcontractor",
        parentCompanyId: contractor.id,
        status: "active"
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  describe("updateCompany", () => {
    it("updates a company for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a company
      const created = await caller.masterData.createCompany({
        code: "UPDATE-" + Date.now(),
        name: "Company to Update " + Date.now(),
        type: "contractor",
        status: "active"
      });

      // Then update it
      const result = await caller.masterData.updateCompany({
        id: created.id,
        name: "Updated Company Name",
        contactPersonName: "Jane Smith",
        status: "inactive"
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("getCompanyById", () => {
    it("retrieves a company by ID for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a company
      const created = await caller.masterData.createCompany({
        code: "GET-" + Date.now(),
        name: "Company to Get " + Date.now(),
        type: "contractor",
        contactPersonName: "Test Person",
        status: "active"
      });

      // Then retrieve it
      const result = await caller.masterData.getCompanyById({ id: created.id });

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.contactPersonName).toBe("Test Person");
    });
  });
});
