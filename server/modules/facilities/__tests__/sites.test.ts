import { describe, it, expect, vi, afterAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import { getDb } from '../db';
import { sites } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Track created site IDs for cleanup
let createdSiteId: number | null = null;
const testSuffix = Math.floor(Math.random() * 10000);

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

describe('Sites Router', () => {
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    // Clean up created test site
    if (createdSiteId) {
      await db.delete(sites).where(eq(sites.id, createdSiteId));
    }
  });

  describe('getAll', () => {
    it('should return a list of sites', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const siteList = await caller.sites.getAll();
      
      expect(Array.isArray(siteList)).toBe(true);
    });
  });

  describe('getForDropdown', () => {
    it('should return sites with id, code, and name', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const siteList = await caller.sites.getForDropdown();
      
      expect(Array.isArray(siteList)).toBe(true);
      
      if (siteList.length > 0) {
        const site = siteList[0];
        expect(site).toHaveProperty('id');
        expect(site).toHaveProperty('code');
        expect(site).toHaveProperty('name');
      }
    });
  });

  describe('create', () => {
    it('should require authentication', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.sites.create({
          code: 'TEST-001',
          name: 'Test Site',
          status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should create a new site when authenticated', async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);
      const testCode = `TS-${testSuffix}`;
      
      const newSite = await caller.sites.create({
        code: testCode,
        name: 'Test Data Center',
        category: 'primary',
        maxCapacity: 100,
        status: 'active',
      });

      expect(newSite).toHaveProperty('id');
      expect(newSite.code).toBe(testCode.toUpperCase());
      expect(newSite.name).toBe('Test Data Center');
      expect(newSite.status).toBe('active');
      
      createdSiteId = newSite.id;
    });
  });

  describe('getById', () => {
    it('should return a site by id', async () => {
      if (createdSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        const site = await caller.sites.getById({ id: createdSiteId });
        
        expect(site).toBeDefined();
        expect(site?.id).toBe(createdSiteId);
        expect(site?.code).toContain('TS-');
      }
    });

    it('should return null for non-existent site', async () => {
      const ctx = createAnonymousContext();
      const caller = appRouter.createCaller(ctx);
      const site = await caller.sites.getById({ id: 999999 });
      expect(site).toBeNull();
    });
  });

  describe('update', () => {
    it('should require authentication', async () => {
      if (createdSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.sites.update({
            id: createdSiteId,
            name: 'Updated Name',
          })
        ).rejects.toThrow();
      }
    });

    it('should update a site when authenticated', async () => {
      if (createdSiteId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const updatedSite = await caller.sites.update({
          id: createdSiteId,
          name: 'Updated Test Data Center',
          status: 'maintenance',
        });

        expect(updatedSite.name).toBe('Updated Test Data Center');
        expect(updatedSite.status).toBe('maintenance');
      }
    });
  });

  describe('delete', () => {
    it('should require authentication', async () => {
      if (createdSiteId) {
        const ctx = createAnonymousContext();
        const caller = appRouter.createCaller(ctx);
        
        await expect(
          caller.sites.delete({ id: createdSiteId })
        ).rejects.toThrow();
      }
    });

    it('should delete a site when authenticated', async () => {
      if (createdSiteId) {
        const ctx = createAuthContext("admin");
        const caller = appRouter.createCaller(ctx);
        
        const result = await caller.sites.delete({ id: createdSiteId });
        
        expect(result.success).toBe(true);
        
        // Verify deletion
        const deletedSite = await caller.sites.getById({ id: createdSiteId });
        expect(deletedSite).toBeNull();
        
        // Reset so afterAll doesn't try to delete again
        createdSiteId = null;
      }
    });
  });
});
