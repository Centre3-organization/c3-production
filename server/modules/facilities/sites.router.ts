import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { sites, countries, regions, cities, siteTypes } from "../../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../_core/trpc";

// Input validation schemas
const createSiteSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  countryId: z.number().optional(),
  regionId: z.number().optional(),
  cityId: z.number().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  siteTypeId: z.number().optional(),
  category: z.enum(["primary", "secondary", "tertiary"]).optional(),
  maxCapacity: z.number().min(0).optional(),
  status: z.enum(["active", "inactive", "maintenance", "offline"]).optional(),
});

const updateSiteSchema = z.object({
  id: z.number(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  countryId: z.number().nullable().optional(),
  regionId: z.number().nullable().optional(),
  cityId: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  siteTypeId: z.number().nullable().optional(),
  category: z.enum(["primary", "secondary", "tertiary"]).optional(),
  maxCapacity: z.number().min(0).optional(),
  currentOccupancy: z.number().min(0).optional(),
  status: z.enum(["active", "inactive", "maintenance", "offline"]).optional(),
});

export const sitesRouter = router({
  // Get all sites with related data
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    // Get sites with joined data
    const result = await db
      .select({
        id: sites.id,
        code: sites.code,
        name: sites.name,
        countryId: sites.countryId,
        regionId: sites.regionId,
        cityId: sites.cityId,
        address: sites.address,
        latitude: sites.latitude,
        longitude: sites.longitude,
        siteTypeId: sites.siteTypeId,
        category: sites.category,
        maxCapacity: sites.maxCapacity,
        currentOccupancy: sites.currentOccupancy,
        status: sites.status,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
        countryName: countries.name,
        regionName: regions.name,
        cityName: cities.name,
        siteTypeName: siteTypes.name,
      })
      .from(sites)
      .leftJoin(countries, eq(sites.countryId, countries.id))
      .leftJoin(regions, eq(sites.regionId, regions.id))
      .leftJoin(cities, eq(sites.cityId, cities.id))
      .leftJoin(siteTypes, eq(sites.siteTypeId, siteTypes.id))
      .orderBy(desc(sites.createdAt));
    
    return result;
  }),
  
  // Get a single site by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select({
          id: sites.id,
          code: sites.code,
          name: sites.name,
          countryId: sites.countryId,
          regionId: sites.regionId,
          cityId: sites.cityId,
          address: sites.address,
          latitude: sites.latitude,
          longitude: sites.longitude,
          siteTypeId: sites.siteTypeId,
          category: sites.category,
          maxCapacity: sites.maxCapacity,
          currentOccupancy: sites.currentOccupancy,
          status: sites.status,
          createdAt: sites.createdAt,
          updatedAt: sites.updatedAt,
          countryName: countries.name,
          regionName: regions.name,
          cityName: cities.name,
          siteTypeName: siteTypes.name,
        })
        .from(sites)
        .leftJoin(countries, eq(sites.countryId, countries.id))
        .leftJoin(regions, eq(sites.regionId, regions.id))
        .leftJoin(cities, eq(sites.cityId, cities.id))
        .leftJoin(siteTypes, eq(sites.siteTypeId, siteTypes.id))
        .where(eq(sites.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),
  
  // Get sites for dropdown (with location info)
  getForDropdown: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: sites.id,
        code: sites.code,
        name: sites.name,
        countryId: sites.countryId,
        regionId: sites.regionId,
        cityId: sites.cityId,
        countryName: countries.name,
        regionName: regions.name,
        cityName: cities.name,
      })
      .from(sites)
      .leftJoin(countries, eq(sites.countryId, countries.id))
      .leftJoin(regions, eq(sites.regionId, regions.id))
      .leftJoin(cities, eq(sites.cityId, cities.id))
      .where(eq(sites.status, "active"))
      .orderBy(sites.name);
    
    return result;
  }),
  
  // Create a new site
  create: adminProcedure
    .input(createSiteSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check for duplicate code
      const existing = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.code, input.code))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error(`Site with code "${input.code}" already exists`);
      }
      
      const result = await db.insert(sites).values({
        code: input.code.toUpperCase(),
        name: input.name,
        countryId: input.countryId,
        regionId: input.regionId,
        cityId: input.cityId,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        siteTypeId: input.siteTypeId,
        category: input.category || "primary",
        maxCapacity: input.maxCapacity || 0,
        currentOccupancy: 0,
        status: input.status || "active",
      });
      
      const newId = Number(result[0].insertId);
      
      // Fetch and return the created site
      const [newSite] = await db
        .select()
        .from(sites)
        .where(eq(sites.id, newId))
        .limit(1);
      
      return newSite;
    }),
  
  // Update an existing site
  update: adminProcedure
    .input(updateSiteSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      // Check for duplicate code if code is being updated
      if (data.code) {
        const existing = await db
          .select({ id: sites.id })
          .from(sites)
          .where(eq(sites.code, data.code))
          .limit(1);
        
        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error(`Site with code "${data.code}" already exists`);
        }
        data.code = data.code.toUpperCase();
      }
      
      await db.update(sites).set(data).where(eq(sites.id, id));
      
      // Fetch and return the updated site
      const [updatedSite] = await db
        .select()
        .from(sites)
        .where(eq(sites.id, id))
        .limit(1);
      
      return updatedSite;
    }),
  
  // Delete a site (soft delete by setting status to inactive)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Hard delete instead of soft delete for proper cleanup
      await db.delete(sites).where(eq(sites.id, input.id));
      
      return { success: true, message: "Site deleted successfully" };
    }),
  
  // Hard delete a site (admin only, use with caution)
  hardDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(sites).where(eq(sites.id, input.id));
      
      return { success: true, message: "Site permanently deleted" };
    }),
  
  // Get site statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, maintenance: 0, offline: 0 };
    
    const result = await db
      .select({
        status: sites.status,
        count: sql<number>`count(*)`,
      })
      .from(sites)
      .groupBy(sites.status);
    
    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      maintenance: 0,
      offline: 0,
    };
    
    result.forEach((row) => {
      stats[row.status as keyof typeof stats] = Number(row.count);
      stats.total += Number(row.count);
    });
    
    return stats;
  }),
  
  // Update site occupancy
  updateOccupancy: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentOccupancy: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(sites)
        .set({ currentOccupancy: input.currentOccupancy })
        .where(eq(sites.id, input.id));
      
      return { success: true, message: "Occupancy updated" };
    }),
});
