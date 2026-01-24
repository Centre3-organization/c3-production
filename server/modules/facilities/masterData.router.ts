import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { 
  countries, 
  regions, 
  cities, 
  siteTypes, 
  zoneTypes, 
  areaTypes 
} from "../../../drizzle/schema";
import { adminProcedure, publicProcedure, router } from "../../_core/trpc";

export const masterDataRouter = router({
  // ============================================================================
  // COUNTRIES
  // ============================================================================
  
  // Get active countries for dropdowns
  getCountries: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(countries).where(eq(countries.isActive, true));
    return result;
  }),
  
  // Get all countries for admin management (including inactive)
  getAllCountries: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(countries);
    return result;
  }),
  
  createCountry: adminProcedure
    .input(z.object({
      code: z.string().min(2).max(3),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(countries).values({
        code: input.code.toUpperCase(),
        name: input.name,
      });
      
      return { success: true, message: "Country created successfully" };
    }),
  
  updateCountry: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(2).max(3).optional(),
      name: z.string().min(1).max(100).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      await db.update(countries).set(data).where(eq(countries.id, id));
      
      return { success: true, message: "Country updated successfully" };
    }),
  
  deleteCountry: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Soft delete by setting isActive to false
      await db.update(countries).set({ isActive: false }).where(eq(countries.id, input.id));
      
      return { success: true, message: "Country deleted successfully" };
    }),
  
  // ============================================================================
  // REGIONS
  // ============================================================================
  
  // Get active regions for dropdowns
  getRegions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(regions).where(eq(regions.isActive, true));
    return result;
  }),
  
  // Get all regions for admin management (including inactive)
  getAllRegions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(regions);
    return result;
  }),
  
  createRegion: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(regions).values({
        code: input.code.toUpperCase(),
        name: input.name,
      });
      
      return { success: true, message: "Region created successfully" };
    }),
  
  updateRegion: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      await db.update(regions).set(data).where(eq(regions.id, id));
      
      return { success: true, message: "Region updated successfully" };
    }),
  
  deleteRegion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(regions).set({ isActive: false }).where(eq(regions.id, input.id));
      
      return { success: true, message: "Region deleted successfully" };
    }),
  
  // ============================================================================
  // CITIES
  // ============================================================================
  
  // Get active cities for dropdowns
  getCities: publicProcedure
    .input(z.object({
      countryId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input?.countryId) {
        return await db.select().from(cities).where(
          and(eq(cities.countryId, input.countryId), eq(cities.isActive, true))
        );
      }
      
      return await db.select().from(cities).where(eq(cities.isActive, true));
    }),
  
  // Get all cities for admin management (including inactive)
  getAllCities: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: cities.id,
        countryId: cities.countryId,
        name: cities.name,
        isActive: cities.isActive,
        createdAt: cities.createdAt,
        countryName: countries.name,
      })
      .from(cities)
      .leftJoin(countries, eq(cities.countryId, countries.id));
    return result;
  }),
  
  createCity: adminProcedure
    .input(z.object({
      countryId: z.number(),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(cities).values({
        countryId: input.countryId,
        name: input.name,
      });
      
      return { success: true, message: "City created successfully" };
    }),
  
  updateCity: adminProcedure
    .input(z.object({
      id: z.number(),
      countryId: z.number().optional(),
      name: z.string().min(1).max(100).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(cities).set(data).where(eq(cities.id, id));
      
      return { success: true, message: "City updated successfully" };
    }),
  
  deleteCity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(cities).set({ isActive: false }).where(eq(cities.id, input.id));
      
      return { success: true, message: "City deleted successfully" };
    }),
  
  // ============================================================================
  // SITE TYPES
  // ============================================================================
  
  // Get active site types for dropdowns
  getSiteTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes).where(eq(siteTypes.isActive, true));
    return result;
  }),
  
  // Get all site types for admin management (including inactive)
  getAllSiteTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes);
    return result;
  }),
  
  createSiteType: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(siteTypes).values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
      });
      
      return { success: true, message: "Site type created successfully" };
    }),
  
  updateSiteType: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      await db.update(siteTypes).set(data).where(eq(siteTypes.id, id));
      
      return { success: true, message: "Site type updated successfully" };
    }),
  
  deleteSiteType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(siteTypes).set({ isActive: false }).where(eq(siteTypes.id, input.id));
      
      return { success: true, message: "Site type deleted successfully" };
    }),
  
  // ============================================================================
  // ZONE TYPES
  // ============================================================================
  
  // Get active zone types for dropdowns
  getZoneTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes).where(eq(zoneTypes.isActive, true));
    return result;
  }),
  
  // Get all zone types for admin management (including inactive)
  getAllZoneTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes);
    return result;
  }),
  
  createZoneType: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(zoneTypes).values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
      });
      
      return { success: true, message: "Zone type created successfully" };
    }),
  
  updateZoneType: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      await db.update(zoneTypes).set(data).where(eq(zoneTypes.id, id));
      
      return { success: true, message: "Zone type updated successfully" };
    }),
  
  deleteZoneType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(zoneTypes).set({ isActive: false }).where(eq(zoneTypes.id, input.id));
      
      return { success: true, message: "Zone type deleted successfully" };
    }),
  
  // ============================================================================
  // AREA TYPES
  // ============================================================================
  
  // Get active area types for dropdowns
  getAreaTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes).where(eq(areaTypes.isActive, true));
    return result;
  }),
  
  // Get all area types for admin management (including inactive)
  getAllAreaTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes);
    return result;
  }),
  
  createAreaType: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(areaTypes).values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
      });
      
      return { success: true, message: "Area type created successfully" };
    }),
  
  updateAreaType: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      await db.update(areaTypes).set(data).where(eq(areaTypes.id, id));
      
      return { success: true, message: "Area type updated successfully" };
    }),
  
  deleteAreaType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(areaTypes).set({ isActive: false }).where(eq(areaTypes.id, input.id));
      
      return { success: true, message: "Area type deleted successfully" };
    }),
});
