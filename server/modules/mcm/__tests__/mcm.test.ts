import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCaller } from "../../../_core/trpc";
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";
import { getDb } from "../../../infra/db/connection";

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-open-id",
  email: "test@example.com",
  name: "Test User",
  role: "admin" as const,
};

// Create a mock context
const createMockContext = (user = mockUser): TrpcContext => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("MCM Module", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testCompanyId: number;
  let testAccessLevelId: number;
  let testCardId: number;
  let testRequestId: number;

  beforeAll(async () => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Companies", () => {
    it("should create a company", async () => {
      const result = await caller.mcm.companies.create({
        name: "Test Contractor Company",
        nameAr: "شركة مقاول اختبارية",
        type: "contractor",
        contactPerson: "John Doe",
        contactEmail: "john@test.com",
        contactPhone: "+966500000000",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Contractor Company");
      testCompanyId = result.id;
    });

    it("should list companies", async () => {
      const result = await caller.mcm.companies.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should list companies and find the created one", async () => {
      const result = await caller.mcm.companies.list({});

      expect(result).toBeDefined();
      const found = result.find((c: any) => c.id === testCompanyId);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Contractor Company");
    });
  });

  describe("Access Levels", () => {
    it("should create an access level", async () => {
      const result = await caller.mcm.accessLevels.create({
        code: "TEST-AL-001",
        name: "Test Access Level",
        nameAr: "مستوى وصول اختباري",
        description: "Test access level for unit testing",
        siportZoneMapping: { zone1: ["door1", "door2"], zone2: ["door3"] },
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Access Level");
      testAccessLevelId = result.id;
    });

    it("should list access levels", async () => {
      const result = await caller.mcm.accessLevels.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Cards", () => {
    it("should list cards (empty initially)", async () => {
      const result = await caller.mcm.cards.list({});

      expect(result).toBeDefined();
      expect(result.cards).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
    });

    it("should get expiring cards", async () => {
      const result = await caller.mcm.cards.getExpiring({ days: 30 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get blocked cards", async () => {
      const result = await caller.mcm.cards.getBlocked();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Requests", () => {
    it("should create a card request", async () => {
      // First get a valid access level ID
      const accessLevels = await caller.mcm.accessLevels.list({});
      const validAccessLevelId = accessLevels.length > 0 ? accessLevels[0].id : testAccessLevelId;
      
      const result = await caller.mcm.requests.createCardRequest({
        companyType: "contractor",
        companyId: testCompanyId,
        idType: "saudi_id",
        idNumber: "1234567890",
        fullName: "Test Cardholder",
        fullNameAr: "حامل بطاقة اختباري",
        birthDate: "1990-01-01",
        nationality: "Saudi",
        gender: "male",
        mobile: "+966500000001",
        email: "cardholder@test.com",
        idExpiryDate: "2030-12-31",
        accessLevels: [
          {
            countryCode: "SA",
            siteId: 1,
            accessLevelId: validAccessLevelId,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      testRequestId = result.id;
    });

    it("should list requests", async () => {
      const result = await caller.mcm.requests.list({});

      expect(result).toBeDefined();
      expect(result.requests).toBeDefined();
      expect(Array.isArray(result.requests)).toBe(true);
    });
  });

  describe("Stats", () => {
    it("should get MCM stats", async () => {
      const result = await caller.mcm.getStats();

      expect(result).toBeDefined();
      expect(typeof result.activeCards).toBe("number");
      expect(typeof result.pendingRequests).toBe("number");
      expect(typeof result.expiringSoon).toBe("number");
      expect(typeof result.blockedCards).toBe("number");
    });
  });

  // Cleanup
  afterAll(async () => {
    const db = await getDb();
    
    // Clean up test data
    if (testRequestId) {
      await db.execute(`DELETE FROM mcmRequests WHERE id = ${testRequestId}`);
    }
    if (testAccessLevelId) {
      await db.execute(`DELETE FROM mcmAccessLevels WHERE id = ${testAccessLevelId}`);
    }
    if (testCompanyId) {
      await db.execute(`DELETE FROM cardCompanies WHERE id = ${testCompanyId}`);
    }
  });
});
