/**
 * Workflow Conditions Tests
 * 
 * Tests for the workflow condition management functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../../../routers";
import { TrpcContext } from "../../../_core/context";

// Mock the database connection
vi.mock("../../../infra/db/connection", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
}));

// Helper to create admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      name: "Admin User",
      role: "admin",
      email: "admin@test.com",
      openId: "admin-open-id",
      avatarUrl: null,
      phone: null,
      department: null,
      departmentId: null,
      employeeId: null,
      company: null,
      companyId: null,
      title: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      siteId: null,
      zoneId: null,
      areaId: null,
      badgeNumber: null,
      badgeExpiry: null,
      emergencyContact: null,
      emergencyPhone: null,
      notes: null,
      managerId: null,
    },
    sessionId: "test-session",
  };
}

// Helper to create regular user context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      name: "Regular User",
      role: "user",
      email: "user@test.com",
      openId: "user-open-id",
      avatarUrl: null,
      phone: null,
      department: null,
      departmentId: null,
      employeeId: null,
      company: null,
      companyId: null,
      title: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      siteId: null,
      zoneId: null,
      areaId: null,
      badgeNumber: null,
      badgeExpiry: null,
      emergencyContact: null,
      emergencyPhone: null,
      notes: null,
      managerId: null,
    },
    sessionId: "test-session",
  };
}

describe("workflow conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addCondition", () => {
    it("allows admin to add site_id condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "site_id",
        conditionOperator: "equals",
        conditionValue: 5,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
      expect(result.id).toBe(1);
    });

    it("allows admin to add zone_id condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "zone_id",
        conditionOperator: "in",
        conditionValue: [1, 2, 3],
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add area_id condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "area_id",
        conditionOperator: "equals",
        conditionValue: 10,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add requester_group condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "requester_group",
        conditionOperator: "equals",
        conditionValue: 2,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add requester_department condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "requester_department",
        conditionOperator: "equals",
        conditionValue: 3,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add requester_role condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "requester_role",
        conditionOperator: "equals",
        conditionValue: 1,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add process_type condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "process_type",
        conditionOperator: "equals",
        conditionValue: "admin_visit",
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add activity_risk condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "activity_risk",
        conditionOperator: "equals",
        conditionValue: "high",
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add vip_visit condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "vip_visit",
        conditionOperator: "equals",
        conditionValue: true,
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add day_of_week condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "day_of_week",
        conditionOperator: "in",
        conditionValue: ["monday", "tuesday", "wednesday"],
        logicalGroup: 0,
      });

      expect(result).toHaveProperty("id");
    });

    it("allows admin to add condition with logical grouping", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.addCondition({
        workflowId: 1,
        conditionType: "site_id",
        conditionOperator: "equals",
        conditionValue: 1,
        logicalGroup: 1, // Different group for OR logic
      });

      expect(result).toHaveProperty("id");
    });

    it("rejects non-admin users from adding conditions", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.workflows.addCondition({
          workflowId: 1,
          conditionType: "site_id",
          conditionOperator: "equals",
          conditionValue: 1,
          logicalGroup: 0,
        })
      ).rejects.toThrow();
    });

    it("validates condition type enum", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.workflows.addCondition({
          workflowId: 1,
          conditionType: "invalid_type" as any,
          conditionOperator: "equals",
          conditionValue: 1,
          logicalGroup: 0,
        })
      ).rejects.toThrow();
    });

    it("validates condition operator enum", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.workflows.addCondition({
          workflowId: 1,
          conditionType: "site_id",
          conditionOperator: "invalid_operator" as any,
          conditionValue: 1,
          logicalGroup: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("removeCondition", () => {
    it("allows admin to remove a condition", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.workflows.removeCondition({ id: 1 });

      expect(result).toEqual({ success: true });
    });

    it("rejects non-admin users from removing conditions", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.workflows.removeCondition({ id: 1 })
      ).rejects.toThrow();
    });
  });
});
