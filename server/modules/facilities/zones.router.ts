import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { zones, sites, zoneTypes } from "../../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../_core/trpc";

// Security controls schema
const securityControlsSchema = z.object({
  cctvEnabled: z.boolean().optional(),
  biometricRequired: z.boolean().optional(),
  badgeRequired: z.boolean().optional(),
  emergencyLock: z.boolean().optional(),
  fireSuppress: z.boolean().optional(),
  tempMonitor: z.boolean().optional(),
}).optional();

// Input validation schemas
const createZoneSchema = z.object({
  siteId: z.number(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  zoneTypeId: z.number().optional(),
  securityLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  accessPolicy: z.enum(["open", "supervised", "restricted", "prohibited"]).optional(),
  maxCapacity: z.number().min(0).optional(),
  securityControls: securityControlsSchema,
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

const updateZoneSchema = z.object({
  id: z.number(),
  siteId: z.number().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  zoneTypeId: z.number().nullable().optional(),
  securityLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  accessPolicy: z.enum(["open", "supervised", "restricted", "prohibited"]).optional(),
  maxCapacity: z.number().min(0).optional(),
  currentOccupancy: z.number().min(0).optional(),
  securityControls: securityControlsSchema,
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

export const zonesRouter = router({
  // Get all zones with related data
  getAll: publicProcedure
    .input(z.object({
      siteId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input?.siteId) {
        conditions.push(eq(zones.siteId, input.siteId));
      }
      
      const result = await db
        .select({
          id: zones.id,
          siteId: zones.siteId,
          code: zones.code,
          name: zones.name,
          description: zones.description,
          zoneTypeId: zones.zoneTypeId,
          securityLevel: zones.securityLevel,
          accessPolicy: zones.accessPolicy,
          maxCapacity: zones.maxCapacity,
          currentOccupancy: zones.currentOccupancy,
          securityControls: zones.securityControls,
          isLocked: zones.isLocked,
          lockedBy: zones.lockedBy,
          lockedAt: zones.lockedAt,
          lockReason: zones.lockReason,
          status: zones.status,
          createdAt: zones.createdAt,
          updatedAt: zones.updatedAt,
          siteName: sites.name,
          siteCode: sites.code,
          zoneTypeName: zoneTypes.name,
        })
        .from(zones)
        .leftJoin(sites, eq(zones.siteId, sites.id))
        .leftJoin(zoneTypes, eq(zones.zoneTypeId, zoneTypes.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(zones.createdAt));
      
      return result;
    }),
  
  // Get a single zone by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select({
          id: zones.id,
          siteId: zones.siteId,
          code: zones.code,
          name: zones.name,
          description: zones.description,
          zoneTypeId: zones.zoneTypeId,
          securityLevel: zones.securityLevel,
          accessPolicy: zones.accessPolicy,
          maxCapacity: zones.maxCapacity,
          currentOccupancy: zones.currentOccupancy,
          securityControls: zones.securityControls,
          isLocked: zones.isLocked,
          lockedBy: zones.lockedBy,
          lockedAt: zones.lockedAt,
          lockReason: zones.lockReason,
          status: zones.status,
          createdAt: zones.createdAt,
          updatedAt: zones.updatedAt,
          siteName: sites.name,
          siteCode: sites.code,
          zoneTypeName: zoneTypes.name,
        })
        .from(zones)
        .leftJoin(sites, eq(zones.siteId, sites.id))
        .leftJoin(zoneTypes, eq(zones.zoneTypeId, zoneTypes.id))
        .where(eq(zones.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),
  
  // Get zones for dropdown (simplified)
  getForDropdown: publicProcedure
    .input(z.object({
      siteId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [eq(zones.status, "active")];
      if (input?.siteId) {
        conditions.push(eq(zones.siteId, input.siteId));
      }
      
      const result = await db
        .select({
          id: zones.id,
          code: zones.code,
          name: zones.name,
          siteId: zones.siteId,
        })
        .from(zones)
        .where(and(...conditions))
        .orderBy(zones.name);
      
      return result;
    }),
  
  // Create a new zone
  create: adminProcedure
    .input(createZoneSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check for duplicate code within the same site
      const existing = await db
        .select({ id: zones.id })
        .from(zones)
        .where(and(
          eq(zones.siteId, input.siteId),
          eq(zones.code, input.code)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error(`Zone with code "${input.code}" already exists in this site`);
      }
      
      const result = await db.insert(zones).values({
        siteId: input.siteId,
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
        zoneTypeId: input.zoneTypeId,
        securityLevel: input.securityLevel || "medium",
        accessPolicy: input.accessPolicy || "supervised",
        maxCapacity: input.maxCapacity || 0,
        currentOccupancy: 0,
        securityControls: input.securityControls || {},
        isLocked: false,
        status: input.status || "active",
      });
      
      const newId = Number(result[0].insertId);
      
      // Fetch and return the created zone
      const [newZone] = await db
        .select()
        .from(zones)
        .where(eq(zones.id, newId))
        .limit(1);
      
      return newZone;
    }),
  
  // Update an existing zone
  update: adminProcedure
    .input(updateZoneSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      // Check for duplicate code if code is being updated
      if (data.code && data.siteId) {
        const existing = await db
          .select({ id: zones.id })
          .from(zones)
          .where(and(
            eq(zones.siteId, data.siteId),
            eq(zones.code, data.code)
          ))
          .limit(1);
        
        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error(`Zone with code "${data.code}" already exists in this site`);
        }
      }
      
      if (data.code) {
        data.code = data.code.toUpperCase();
      }
      
      await db.update(zones).set(data).where(eq(zones.id, id));
      
      // Fetch and return the updated zone
      const [updatedZone] = await db
        .select()
        .from(zones)
        .where(eq(zones.id, id))
        .limit(1);
      
      return updatedZone;
    }),
  
  // Delete a zone (soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Hard delete instead of soft delete for proper cleanup
      await db.delete(zones).where(eq(zones.id, input.id));
      
      return { success: true, message: "Zone deleted successfully" };
    }),
  
  // Lock a zone (emergency lock)
  lock: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(zones)
        .set({
          isLocked: true,
          lockedBy: ctx.user?.id,
          lockedAt: new Date(),
          lockReason: input.reason,
        })
        .where(eq(zones.id, input.id));
      
      // Fetch and return the locked zone
      const [lockedZone] = await db
        .select()
        .from(zones)
        .where(eq(zones.id, input.id))
        .limit(1);
      
      return lockedZone;
    }),
  
  // Unlock a zone
  unlock: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(zones)
        .set({
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockReason: null,
        })
        .where(eq(zones.id, input.id));
      
      // Fetch and return the unlocked zone
      const [unlockedZone] = await db
        .select()
        .from(zones)
        .where(eq(zones.id, input.id))
        .limit(1);
      
      return unlockedZone;
    }),
  
  // Update zone occupancy
  updateOccupancy: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentOccupancy: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(zones)
        .set({ currentOccupancy: input.currentOccupancy })
        .where(eq(zones.id, input.id));
      
      return { success: true, message: "Occupancy updated" };
    }),
  
  // Get zone statistics for a site
  getStatsBySite: publicProcedure
    .input(z.object({ siteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, locked: 0, totalCapacity: 0, totalOccupancy: 0 };
      
      const result = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${zones.status} = 'active' then 1 else 0 end)`,
          locked: sql<number>`sum(case when ${zones.isLocked} = true then 1 else 0 end)`,
          totalCapacity: sql<number>`sum(${zones.maxCapacity})`,
          totalOccupancy: sql<number>`sum(${zones.currentOccupancy})`,
        })
        .from(zones)
        .where(eq(zones.siteId, input.siteId));
      
      return {
        total: Number(result[0]?.total || 0),
        active: Number(result[0]?.active || 0),
        locked: Number(result[0]?.locked || 0),
        totalCapacity: Number(result[0]?.totalCapacity || 0),
        totalOccupancy: Number(result[0]?.totalOccupancy || 0),
      };
    }),
});
