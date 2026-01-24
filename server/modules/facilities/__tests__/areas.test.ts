import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import { getDb } from '../db';
import { sites, zones, areas } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Track created IDs for cleanup
let testSiteId: number | null = null;
let testZoneId: number | null = null;
let createdAreaId: number | null = null;

// Create anonymous context
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

// Create authenticated context
function createAuthContext(role: "user" | "admin" = "admin"): TrpcContext {
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

describe('Areas Router', () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    // Create a test site
    const siteResult = await db.insert(sites).values({
      code: 'TEST-AREA-SITE',
      name: 'Test Site for Areas',
      status: 'active',
      maxCapacity: 100,
      currentOccupancy: 0,
    });
    testSiteId = Number(siteResult[0].insertId);

    // Create a test zone
    const zoneResult = await db.insert(zones).values({
      siteId: testSiteId,
      code: 'TEST-AREA-ZONE',
      name: 'Test Zone for Areas',
      securityLevel: 'medium',
      maxCapacity: 50,
      currentOccupancy: 0,
      isLocked: false,
      status: 'active',
    });
    testZoneId = Number(zoneResult[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    // Clean up in reverse order of creation
    if (createdAreaId) {
      await db.delete(areas).where(eq(areas.id, createdAreaId));
    }
    if (testZoneId) {
      await db.delete(zones).where(eq(zones.id, testZoneId));
    }
    if (testSiteId) {
      await db.delete(sites).where(eq(sites.id, testSiteId));
    }
  });

  describe('getAll', () => {
    it('should return a list of areas', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const areaList = await caller.areas.getAll();
      
      expect(Array.isArray(areaList)).toBe(true);
    });

    it('should filter areas by zoneId', async () => {
      if (testZoneId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const areaList = await caller.areas.getAll({ zoneId: testZoneId });
        
        expect(Array.isArray(areaList)).toBe(true);
        // All areas should belong to the test zone
        areaList.forEach(area => {
          expect(area.zoneId).toBe(testZoneId);
        });
      }
    });

    it('should filter areas by siteId', async () => {
      if (testSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const areaList = await caller.areas.getAll({ siteId: testSiteId });
        
        expect(Array.isArray(areaList)).toBe(true);
        // All areas should belong to zones in the test site
        areaList.forEach(area => {
          expect(area.siteId).toBe(testSiteId);
        });
      }
    });
  });

  describe('create', () => {
    it('should require authentication', async () => {
      if (testZoneId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.areas.create({
            zoneId: testZoneId,
            code: 'TEST-AREA-001',
            name: 'Test Area',
            status: 'active',
          })
        ).rejects.toThrow();
      }
    });

    it('should create a new area when authenticated', async () => {
      if (testZoneId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const newArea = await caller.areas.create({
          zoneId: testZoneId,
          code: 'TEST-AREA-001',
          name: 'Test Rack Row',
          floor: '1',
          maxCapacity: 20,
          rackCount: 10,
          infrastructureSpecs: {
            powerType: 'AC',
            coolingType: 'Air',
            escortRequired: true,
            cagedArea: false,
          },
          status: 'active',
        });

        expect(newArea).toHaveProperty('id');
        expect(newArea.code).toBe('TEST-AREA-001');
        expect(newArea.name).toBe('Test Rack Row');
        expect(newArea.zoneId).toBe(testZoneId);
        expect(newArea.rackCount).toBe(10);
        
        createdAreaId = newArea.id;
      }
    });
  });

  describe('getById', () => {
    it('should return an area by id', async () => {
      if (createdAreaId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const area = await caller.areas.getById({ id: createdAreaId });
        
        expect(area).toBeDefined();
        expect(area?.id).toBe(createdAreaId);
        expect(area?.code).toBe('TEST-AREA-001');
      }
    });

    it('should return null for non-existent area', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const area = await caller.areas.getById({ id: 999999 });
      expect(area).toBeNull();
    });
  });

  describe('update', () => {
    it('should require authentication', async () => {
      if (createdAreaId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.areas.update({
            id: createdAreaId,
            name: 'Updated Name',
          })
        ).rejects.toThrow();
      }
    });

    it('should update an area when authenticated', async () => {
      if (createdAreaId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const updatedArea = await caller.areas.update({
          id: createdAreaId,
          name: 'Updated Test Rack Row',
          rackCount: 15,
          status: 'maintenance',
        });

        expect(updatedArea.name).toBe('Updated Test Rack Row');
        expect(updatedArea.rackCount).toBe(15);
        expect(updatedArea.status).toBe('maintenance');
      }
    });
  });

  describe('delete', () => {
    it('should require authentication', async () => {
      if (createdAreaId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.areas.delete({ id: createdAreaId })
        ).rejects.toThrow();
      }
    });

    it('should delete an area when authenticated', async () => {
      if (createdAreaId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const result = await caller.areas.delete({ id: createdAreaId });
        
        expect(result.success).toBe(true);
        
        // Verify deletion
        const deletedArea = await caller.areas.getById({ id: createdAreaId });
        expect(deletedArea).toBeNull();
        
        // Reset so afterAll doesn't try to delete again
        createdAreaId = null;
      }
    });
  });
});
