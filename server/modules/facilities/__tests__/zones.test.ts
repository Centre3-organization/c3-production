import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import { getDb } from '../db';
import { sites, zones } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Track created IDs for cleanup
let testSiteId: number | null = null;
let createdZoneId: number | null = null;

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

describe('Zones Router', () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    // Create a test site for zone tests
    const result = await db.insert(sites).values({
      code: 'TEST-ZONE-SITE',
      name: 'Test Site for Zones',
      status: 'active',
      maxCapacity: 100,
      currentOccupancy: 0,
    });
    testSiteId = Number(result[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    // Clean up created test zone
    if (createdZoneId) {
      await db.delete(zones).where(eq(zones.id, createdZoneId));
    }
    // Clean up test site
    if (testSiteId) {
      await db.delete(sites).where(eq(sites.id, testSiteId));
    }
  });

  describe('getAll', () => {
    it('should return a list of zones', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const zoneList = await caller.zones.getAll();
      
      expect(Array.isArray(zoneList)).toBe(true);
    });

    it('should filter zones by siteId', async () => {
      if (testSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const zoneList = await caller.zones.getAll({ siteId: testSiteId });
        
        expect(Array.isArray(zoneList)).toBe(true);
        // All zones should belong to the test site
        zoneList.forEach(zone => {
          expect(zone.siteId).toBe(testSiteId);
        });
      }
    });
  });

  describe('getForDropdown', () => {
    it('should return zones with id, code, name, and siteId', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const zoneList = await caller.zones.getForDropdown();
      
      expect(Array.isArray(zoneList)).toBe(true);
      
      if (zoneList.length > 0) {
        const zone = zoneList[0];
        expect(zone).toHaveProperty('id');
        expect(zone).toHaveProperty('code');
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('siteId');
      }
    });
  });

  describe('create', () => {
    it('should require authentication', async () => {
      if (testSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.zones.create({
            siteId: testSiteId,
            code: 'TEST-ZONE-001',
            name: 'Test Zone',
            securityLevel: 'medium',
            status: 'active',
          })
        ).rejects.toThrow();
      }
    });

    it('should create a new zone when authenticated', async () => {
      if (testSiteId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const newZone = await caller.zones.create({
          siteId: testSiteId,
          code: 'TEST-ZONE-001',
          name: 'Test Server Room',
          securityLevel: 'high',
          accessPolicy: 'restricted',
          maxCapacity: 50,
          securityControls: {
            cctvEnabled: true,
            biometricRequired: true,
            badgeRequired: true,
          },
          status: 'active',
        });

        expect(newZone).toHaveProperty('id');
        expect(newZone.code).toBe('TEST-ZONE-001');
        expect(newZone.name).toBe('Test Server Room');
        expect(newZone.securityLevel).toBe('high');
        expect(newZone.siteId).toBe(testSiteId);
        
        createdZoneId = newZone.id;
      }
    });
  });

  describe('getById', () => {
    it('should return a zone by id', async () => {
      if (createdZoneId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const zone = await caller.zones.getById({ id: createdZoneId });
        
        expect(zone).toBeDefined();
        expect(zone?.id).toBe(createdZoneId);
        expect(zone?.code).toBe('TEST-ZONE-001');
      }
    });

    it('should return null for non-existent zone', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const zone = await caller.zones.getById({ id: 999999 });
      expect(zone).toBeNull();
    });
  });

  describe('update', () => {
    it('should require authentication', async () => {
      if (createdZoneId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.zones.update({
            id: createdZoneId,
            name: 'Updated Name',
          })
        ).rejects.toThrow();
      }
    });

    it('should update a zone when authenticated', async () => {
      if (createdZoneId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const updatedZone = await caller.zones.update({
          id: createdZoneId,
          name: 'Updated Test Server Room',
          securityLevel: 'critical',
        });

        expect(updatedZone.name).toBe('Updated Test Server Room');
        expect(updatedZone.securityLevel).toBe('critical');
      }
    });
  });

  describe('lock and unlock', () => {
    it('should lock a zone', async () => {
      if (createdZoneId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const lockedZone = await caller.zones.lock({
          id: createdZoneId,
          reason: 'Security incident',
        });

        expect(lockedZone.isLocked).toBe(true);
        expect(lockedZone.lockReason).toBe('Security incident');
        expect(lockedZone.lockedBy).toBe(1); // Test user ID
      }
    });

    it('should unlock a zone', async () => {
      if (createdZoneId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const unlockedZone = await caller.zones.unlock({
          id: createdZoneId,
        });

        expect(unlockedZone.isLocked).toBe(false);
        expect(unlockedZone.lockReason).toBeNull();
        expect(unlockedZone.lockedBy).toBeNull();
      }
    });
  });

  describe('delete', () => {
    it('should require authentication', async () => {
      if (createdZoneId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.zones.delete({ id: createdZoneId })
        ).rejects.toThrow();
      }
    });

    it('should delete a zone when authenticated', async () => {
      if (createdZoneId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const result = await caller.zones.delete({ id: createdZoneId });
        
        expect(result.success).toBe(true);
        
        // Verify deletion
        const deletedZone = await caller.zones.getById({ id: createdZoneId });
        expect(deletedZone).toBeNull();
        
        // Reset so afterAll doesn't try to delete again
        createdZoneId = null;
      }
    });
  });
});
