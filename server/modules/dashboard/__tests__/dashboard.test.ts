import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../../../routers";

describe("Dashboard Router", () => {
  const createAuthenticatedCaller = () => {
    return appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-open-id",
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin",
      },
      req: {} as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
    });
  };

  const createUnauthenticatedCaller = () => {
    return appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
    });
  };

  describe("getStats", () => {
    it("should return dashboard statistics when authenticated", async () => {
      const caller = createAuthenticatedCaller();
      const stats = await caller.dashboard.getStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.activeVisitors).toBe("number");
      expect(typeof stats.pendingApprovals).toBe("number");
      expect(typeof stats.pendingL1).toBe("number");
      expect(typeof stats.pendingManual).toBe("number");
      expect(typeof stats.totalRequestsThisMonth).toBe("number");
      expect(typeof stats.totalRequests).toBe("number");
      expect(typeof stats.approvalRate).toBe("number");
      expect(typeof stats.sites).toBe("number");
      expect(typeof stats.zones).toBe("number");
      expect(typeof stats.areas).toBe("number");
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(caller.dashboard.getStats()).rejects.toThrow();
    });
  });

  describe("getRequestsByType", () => {
    it("should return request counts by type", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getRequestsByType();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("type");
        expect(result[0]).toHaveProperty("label");
        expect(result[0]).toHaveProperty("count");
      }
    });
  });

  describe("getRequestsByStatus", () => {
    it("should return request counts by status with colors", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getRequestsByStatus();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("status");
        expect(result[0]).toHaveProperty("label");
        expect(result[0]).toHaveProperty("count");
        expect(result[0]).toHaveProperty("color");
      }
    });
  });

  describe("getVisitorTraffic", () => {
    it("should return hourly visitor traffic data", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getVisitorTraffic();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("hour");
      expect(result[0]).toHaveProperty("visitors");
    });
  });

  describe("getZoneOccupancy", () => {
    it("should return zone occupancy data", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getZoneOccupancy();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("occupancy");
        expect(result[0]).toHaveProperty("percentage");
      }
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent activity list", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getRecentActivity();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("requestNumber");
        expect(result[0]).toHaveProperty("type");
        expect(result[0]).toHaveProperty("status");
        expect(result[0]).toHaveProperty("action");
      }
    });
  });

  describe("getPendingItems", () => {
    it("should return pending L1 and L2 items", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getPendingItems();
      
      expect(result).toHaveProperty("pendingL1");
      expect(result).toHaveProperty("pendingManual");
      expect(Array.isArray(result.pendingL1)).toBe(true);
      expect(Array.isArray(result.pendingManual)).toBe(true);
    });
  });

  describe("getSiteOverview", () => {
    it("should return site overview with zone counts", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getSiteOverview();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("zoneCount");
        expect(result[0]).toHaveProperty("areaCount");
      }
    });
  });

  describe("getWeeklyTrend", () => {
    it("should return weekly trend data", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.dashboard.getWeeklyTrend();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7); // 7 days
      expect(result[0]).toHaveProperty("day");
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("requests");
    });
  });
});
