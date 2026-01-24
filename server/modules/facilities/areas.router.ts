import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { areas, zones, sites, areaTypes } from "../../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../_core/trpc";

// Infrastructure specs schema
const infrastructureSpecsSchema = z.object({
  powerType: z.enum(["AC", "DC", "Both"]).optional(),
  coolingType: z.enum(["Air", "Liquid", "Immersion"]).optional(),
  escortRequired: z.boolean().optional(),
  cagedArea: z.boolean().optional(),
}).optional();

// Input validation schemas
const createAreaSchema = z.object({
  zoneId: z.number(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  areaTypeId: z.number().optional(),
  floor: z.string().max(10).optional(),
  maxCapacity: z.number().min(0).optional(),
  rackCount: z.number().min(0).optional(),
  infrastructureSpecs: infrastructureSpecsSchema,
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

const updateAreaSchema = z.object({
  id: z.number(),
  zoneId: z.number().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  areaTypeId: z.number().nullable().optional(),
  floor: z.string().max(10).nullable().optional(),
  maxCapacity: z.number().min(0).optional(),
  rackCount: z.number().min(0).nullable().optional(),
  infrastructureSpecs: infrastructureSpecsSchema,
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

export const areasRouter = router({
  // Get all areas with related data
  getAll: publicProcedure
    .input(z.object({
      zoneId: z.number().optional(),
      siteId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input?.zoneId) {
        conditions.push(eq(areas.zoneId, input.zoneId));
      }
      if (input?.siteId) {
        conditions.push(eq(zones.siteId, input.siteId));
      }
      
      const result = await db
        .select({
          id: areas.id,
          zoneId: areas.zoneId,
          code: areas.code,
          name: areas.name,
          description: areas.description,
          areaTypeId: areas.areaTypeId,
          floor: areas.floor,
          maxCapacity: areas.maxCapacity,
          rackCount: areas.rackCount,
          infrastructureSpecs: areas.infrastructureSpecs,
          status: areas.status,
          createdAt: areas.createdAt,
          updatedAt: areas.updatedAt,
          zoneName: zones.name,
          zoneCode: zones.code,
          siteId: zones.siteId,
          siteName: sites.name,
          siteCode: sites.code,
          areaTypeName: areaTypes.name,
        })
        .from(areas)
        .leftJoin(zones, eq(areas.zoneId, zones.id))
        .leftJoin(sites, eq(zones.siteId, sites.id))
        .leftJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(areas.createdAt));
      
      return result;
    }),
  
  // Get a single area by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select({
          id: areas.id,
          zoneId: areas.zoneId,
          code: areas.code,
          name: areas.name,
          description: areas.description,
          areaTypeId: areas.areaTypeId,
          floor: areas.floor,
          maxCapacity: areas.maxCapacity,
          rackCount: areas.rackCount,
          infrastructureSpecs: areas.infrastructureSpecs,
          status: areas.status,
          createdAt: areas.createdAt,
          updatedAt: areas.updatedAt,
          zoneName: zones.name,
          zoneCode: zones.code,
          siteId: zones.siteId,
          siteName: sites.name,
          siteCode: sites.code,
          areaTypeName: areaTypes.name,
        })
        .from(areas)
        .leftJoin(zones, eq(areas.zoneId, zones.id))
        .leftJoin(sites, eq(zones.siteId, sites.id))
        .leftJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id))
        .where(eq(areas.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),
  
  // Get areas for dropdown (simplified)
  getForDropdown: publicProcedure
    .input(z.object({
      zoneId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [eq(areas.status, "active")];
      if (input?.zoneId) {
        conditions.push(eq(areas.zoneId, input.zoneId));
      }
      
      const result = await db
        .select({
          id: areas.id,
          code: areas.code,
          name: areas.name,
          zoneId: areas.zoneId,
        })
        .from(areas)
        .where(and(...conditions))
        .orderBy(areas.name);
      
      return result;
    }),
  
  // Create a new area
  create: adminProcedure
    .input(createAreaSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check for duplicate code within the same zone
      const existing = await db
        .select({ id: areas.id })
        .from(areas)
        .where(and(
          eq(areas.zoneId, input.zoneId),
          eq(areas.code, input.code)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error(`Area with code "${input.code}" already exists in this zone`);
      }
      
      const result = await db.insert(areas).values({
        zoneId: input.zoneId,
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
        areaTypeId: input.areaTypeId,
        floor: input.floor,
        maxCapacity: input.maxCapacity || 0,
        rackCount: input.rackCount || 0,
        infrastructureSpecs: input.infrastructureSpecs || {},
        status: input.status || "active",
      });
      
      const newId = Number(result[0].insertId);
      
      // Fetch and return the created area
      const [newArea] = await db
        .select()
        .from(areas)
        .where(eq(areas.id, newId))
        .limit(1);
      
      return newArea;
    }),
  
  // Update an existing area
  update: adminProcedure
    .input(updateAreaSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      // Check for duplicate code if code is being updated
      if (data.code && data.zoneId) {
        const existing = await db
          .select({ id: areas.id })
          .from(areas)
          .where(and(
            eq(areas.zoneId, data.zoneId),
            eq(areas.code, data.code)
          ))
          .limit(1);
        
        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error(`Area with code "${data.code}" already exists in this zone`);
        }
      }
      
      if (data.code) {
        data.code = data.code.toUpperCase();
      }
      
      await db.update(areas).set(data).where(eq(areas.id, id));
      
      // Fetch and return the updated area
      const [updatedArea] = await db
        .select()
        .from(areas)
        .where(eq(areas.id, id))
        .limit(1);
      
      return updatedArea;
    }),
  
  // Delete an area (soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Hard delete instead of soft delete for proper cleanup
      await db.delete(areas).where(eq(areas.id, input.id));
      
      return { success: true, message: "Area deleted successfully" };
    }),
  
  // Get area statistics for a zone
  getStatsByZone: publicProcedure
    .input(z.object({ zoneId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, totalCapacity: 0, totalRacks: 0 };
      
      const result = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${areas.status} = 'active' then 1 else 0 end)`,
          totalCapacity: sql<number>`sum(${areas.maxCapacity})`,
          totalRacks: sql<number>`sum(${areas.rackCount})`,
        })
        .from(areas)
        .where(eq(areas.zoneId, input.zoneId));
      
      return {
        total: Number(result[0]?.total || 0),
        active: Number(result[0]?.active || 0),
        totalCapacity: Number(result[0]?.totalCapacity || 0),
        totalRacks: Number(result[0]?.totalRacks || 0),
      };
    }),
});
