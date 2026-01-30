import { z } from "zod";
import { eq, and, isNull, asc, desc } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { 
  countries, 
  regions, 
  cities, 
  siteTypes, 
  zoneTypes, 
  areaTypes,
  mainActivities,
  subActivities,
  roleTypes,
  approvers,
  users,
  sites,
  cardCompanies
} from "../../../drizzle/schema";
import { adminProcedure, publicProcedure, router } from "../../_core/trpc";

// Helper function to build tree structure from flat list
function buildTree<T extends { id: number; parentId: number | null }>(items: T[]): (T & { children: T[] })[] {
  const itemMap = new Map<number, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  // First pass: create all nodes with empty children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build the tree
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId === null) {
      roots.push(node);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent doesn't exist, treat as root
        roots.push(node);
      }
    }
  });

  return roots;
}

// Helper function to get all descendants of a type
async function getDescendantIds(db: any, table: any, parentId: number): Promise<number[]> {
  const descendants: number[] = [];
  const queue = [parentId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await db.select({ id: table.id }).from(table).where(eq(table.parentId, currentId));
    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }
  
  return descendants;
}

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
  // SITE TYPES (with hierarchical support)
  // ============================================================================
  
  // Get active site types for dropdowns (flat list)
  getSiteTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes)
      .where(eq(siteTypes.isActive, true))
      .orderBy(asc(siteTypes.level), asc(siteTypes.sortOrder));
    return result;
  }),
  
  // Get site types as tree structure
  getSiteTypesTree: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes)
      .where(eq(siteTypes.isActive, true))
      .orderBy(asc(siteTypes.level), asc(siteTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  // Get children of a specific site type
  getSiteTypeChildren: publicProcedure
    .input(z.object({ parentId: z.number().nullable() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input.parentId === null) {
        return await db.select().from(siteTypes)
          .where(and(isNull(siteTypes.parentId), eq(siteTypes.isActive, true)))
          .orderBy(asc(siteTypes.sortOrder));
      }
      
      return await db.select().from(siteTypes)
        .where(and(eq(siteTypes.parentId, input.parentId), eq(siteTypes.isActive, true)))
        .orderBy(asc(siteTypes.sortOrder));
    }),
  
  // Get all site types for admin management (including inactive)
  getAllSiteTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes)
      .orderBy(asc(siteTypes.level), asc(siteTypes.sortOrder));
    return result;
  }),
  
  // Get all site types as tree for admin
  getAllSiteTypesTree: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(siteTypes)
      .orderBy(asc(siteTypes.level), asc(siteTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  createSiteType: adminProcedure
    .input(z.object({
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      nameAr: z.string().max(100).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate level based on parent
      let level = 0;
      if (input.parentId) {
        const parent = await db.select({ level: siteTypes.level }).from(siteTypes)
          .where(eq(siteTypes.id, input.parentId)).limit(1);
        if (parent.length > 0) {
          level = parent[0].level + 1;
        }
      }
      
      await db.insert(siteTypes).values({
        parentId: input.parentId || null,
        code: input.code.toUpperCase(),
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        level,
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Site type created successfully" };
    }),
  
  updateSiteType: adminProcedure
    .input(z.object({
      id: z.number(),
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      nameAr: z.string().max(100).optional().nullable(),
      description: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, parentId, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      
      // If parentId is being changed, recalculate level
      const updateData: any = { ...data };
      if (parentId !== undefined) {
        updateData.parentId = parentId;
        if (parentId === null) {
          updateData.level = 0;
        } else {
          const parent = await db.select({ level: siteTypes.level }).from(siteTypes)
            .where(eq(siteTypes.id, parentId)).limit(1);
          if (parent.length > 0) {
            updateData.level = parent[0].level + 1;
          }
        }
      }
      
      await db.update(siteTypes).set(updateData).where(eq(siteTypes.id, id));
      
      return { success: true, message: "Site type updated successfully" };
    }),
  
  deleteSiteType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Soft delete the type and all its descendants
      const descendantIds = await getDescendantIds(db, siteTypes, input.id);
      const allIds = [input.id, ...descendantIds];
      
      for (const id of allIds) {
        await db.update(siteTypes).set({ isActive: false }).where(eq(siteTypes.id, id));
      }
      
      return { success: true, message: "Site type and its children deleted successfully" };
    }),
  
  // Update sort order for multiple site types
  updateSiteTypeOrder: adminProcedure
    .input(z.array(z.object({
      id: z.number(),
      sortOrder: z.number(),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      for (const item of input) {
        await db.update(siteTypes).set({ sortOrder: item.sortOrder }).where(eq(siteTypes.id, item.id));
      }
      
      return { success: true, message: "Sort order updated successfully" };
    }),
  
  // ============================================================================
  // ZONE TYPES (with hierarchical support)
  // ============================================================================
  
  // Get active zone types for dropdowns (flat list)
  getZoneTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes)
      .where(eq(zoneTypes.isActive, true))
      .orderBy(asc(zoneTypes.level), asc(zoneTypes.sortOrder));
    return result;
  }),
  
  // Get zone types as tree structure
  getZoneTypesTree: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes)
      .where(eq(zoneTypes.isActive, true))
      .orderBy(asc(zoneTypes.level), asc(zoneTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  // Get children of a specific zone type
  getZoneTypeChildren: publicProcedure
    .input(z.object({ parentId: z.number().nullable() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input.parentId === null) {
        return await db.select().from(zoneTypes)
          .where(and(isNull(zoneTypes.parentId), eq(zoneTypes.isActive, true)))
          .orderBy(asc(zoneTypes.sortOrder));
      }
      
      return await db.select().from(zoneTypes)
        .where(and(eq(zoneTypes.parentId, input.parentId), eq(zoneTypes.isActive, true)))
        .orderBy(asc(zoneTypes.sortOrder));
    }),
  
  // Get all zone types for admin management (including inactive)
  getAllZoneTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes)
      .orderBy(asc(zoneTypes.level), asc(zoneTypes.sortOrder));
    return result;
  }),
  
  // Get all zone types as tree for admin
  getAllZoneTypesTree: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(zoneTypes)
      .orderBy(asc(zoneTypes.level), asc(zoneTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  createZoneType: adminProcedure
    .input(z.object({
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      nameAr: z.string().max(100).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate level based on parent
      let level = 0;
      if (input.parentId) {
        const parent = await db.select({ level: zoneTypes.level }).from(zoneTypes)
          .where(eq(zoneTypes.id, input.parentId)).limit(1);
        if (parent.length > 0) {
          level = parent[0].level + 1;
        }
      }
      
      await db.insert(zoneTypes).values({
        parentId: input.parentId || null,
        code: input.code.toUpperCase(),
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        level,
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Zone type created successfully" };
    }),
  
  updateZoneType: adminProcedure
    .input(z.object({
      id: z.number(),
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      nameAr: z.string().max(100).optional().nullable(),
      description: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, parentId, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      
      // If parentId is being changed, recalculate level
      const updateData: any = { ...data };
      if (parentId !== undefined) {
        updateData.parentId = parentId;
        if (parentId === null) {
          updateData.level = 0;
        } else {
          const parent = await db.select({ level: zoneTypes.level }).from(zoneTypes)
            .where(eq(zoneTypes.id, parentId)).limit(1);
          if (parent.length > 0) {
            updateData.level = parent[0].level + 1;
          }
        }
      }
      
      await db.update(zoneTypes).set(updateData).where(eq(zoneTypes.id, id));
      
      return { success: true, message: "Zone type updated successfully" };
    }),
  
  deleteZoneType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Soft delete the type and all its descendants
      const descendantIds = await getDescendantIds(db, zoneTypes, input.id);
      const allIds = [input.id, ...descendantIds];
      
      for (const id of allIds) {
        await db.update(zoneTypes).set({ isActive: false }).where(eq(zoneTypes.id, id));
      }
      
      return { success: true, message: "Zone type and its children deleted successfully" };
    }),
  
  // Update sort order for multiple zone types
  updateZoneTypeOrder: adminProcedure
    .input(z.array(z.object({
      id: z.number(),
      sortOrder: z.number(),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      for (const item of input) {
        await db.update(zoneTypes).set({ sortOrder: item.sortOrder }).where(eq(zoneTypes.id, item.id));
      }
      
      return { success: true, message: "Sort order updated successfully" };
    }),
  
  // ============================================================================
  // AREA TYPES (with hierarchical support)
  // ============================================================================
  
  // Get active area types for dropdowns (flat list)
  getAreaTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes)
      .where(eq(areaTypes.isActive, true))
      .orderBy(asc(areaTypes.level), asc(areaTypes.sortOrder));
    return result;
  }),
  
  // Get area types as tree structure
  getAreaTypesTree: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes)
      .where(eq(areaTypes.isActive, true))
      .orderBy(asc(areaTypes.level), asc(areaTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  // Get children of a specific area type
  getAreaTypeChildren: publicProcedure
    .input(z.object({ parentId: z.number().nullable() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input.parentId === null) {
        return await db.select().from(areaTypes)
          .where(and(isNull(areaTypes.parentId), eq(areaTypes.isActive, true)))
          .orderBy(asc(areaTypes.sortOrder));
      }
      
      return await db.select().from(areaTypes)
        .where(and(eq(areaTypes.parentId, input.parentId), eq(areaTypes.isActive, true)))
        .orderBy(asc(areaTypes.sortOrder));
    }),
  
  // Get all area types for admin management (including inactive)
  getAllAreaTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes)
      .orderBy(asc(areaTypes.level), asc(areaTypes.sortOrder));
    return result;
  }),
  
  // Get all area types as tree for admin
  getAllAreaTypesTree: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(areaTypes)
      .orderBy(asc(areaTypes.level), asc(areaTypes.sortOrder));
    
    return buildTree(result);
  }),
  
  createAreaType: adminProcedure
    .input(z.object({
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      nameAr: z.string().max(100).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate level based on parent
      let level = 0;
      if (input.parentId) {
        const parent = await db.select({ level: areaTypes.level }).from(areaTypes)
          .where(eq(areaTypes.id, input.parentId)).limit(1);
        if (parent.length > 0) {
          level = parent[0].level + 1;
        }
      }
      
      await db.insert(areaTypes).values({
        parentId: input.parentId || null,
        code: input.code.toUpperCase(),
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        level,
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Area type created successfully" };
    }),
  
  updateAreaType: adminProcedure
    .input(z.object({
      id: z.number(),
      parentId: z.number().nullable().optional(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(100).optional(),
      nameAr: z.string().max(100).optional().nullable(),
      description: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, parentId, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();
      
      // If parentId is being changed, recalculate level
      const updateData: any = { ...data };
      if (parentId !== undefined) {
        updateData.parentId = parentId;
        if (parentId === null) {
          updateData.level = 0;
        } else {
          const parent = await db.select({ level: areaTypes.level }).from(areaTypes)
            .where(eq(areaTypes.id, parentId)).limit(1);
          if (parent.length > 0) {
            updateData.level = parent[0].level + 1;
          }
        }
      }
      
      await db.update(areaTypes).set(updateData).where(eq(areaTypes.id, id));
      
      return { success: true, message: "Area type updated successfully" };
    }),
  
  deleteAreaType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Soft delete the type and all its descendants
      const descendantIds = await getDescendantIds(db, areaTypes, input.id);
      const allIds = [input.id, ...descendantIds];
      
      for (const id of allIds) {
        await db.update(areaTypes).set({ isActive: false }).where(eq(areaTypes.id, id));
      }
      
      return { success: true, message: "Area type and its children deleted successfully" };
    }),
  
  // Update sort order for multiple area types
  updateAreaTypeOrder: adminProcedure
    .input(z.array(z.object({
      id: z.number(),
      sortOrder: z.number(),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      for (const item of input) {
        await db.update(areaTypes).set({ sortOrder: item.sortOrder }).where(eq(areaTypes.id, item.id));
      }
      
      return { success: true, message: "Sort order updated successfully" };
    }),

  // ============================================================================
  // MAIN ACTIVITIES
  // ============================================================================
  
  // Get active main activities for dropdowns
  getMainActivities: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(mainActivities)
      .where(eq(mainActivities.isActive, true))
      .orderBy(asc(mainActivities.sortOrder), asc(mainActivities.name));
    return result;
  }),
  
  // Get all main activities for admin management (including inactive)
  getAllMainActivities: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(mainActivities)
      .orderBy(asc(mainActivities.sortOrder), asc(mainActivities.name));
    return result;
  }),
  
  createMainActivity: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      nameAr: z.string().max(255).optional(),
      description: z.string().optional(),
      icon: z.string().max(50).optional(),
      color: z.string().max(20).optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(mainActivities).values({
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        icon: input.icon,
        color: input.color,
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Main activity created successfully" };
    }),
  
  updateMainActivity: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      nameAr: z.string().max(255).optional().nullable(),
      description: z.string().optional().nullable(),
      icon: z.string().max(50).optional().nullable(),
      color: z.string().max(20).optional().nullable(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(mainActivities).set(data).where(eq(mainActivities.id, id));
      
      return { success: true, message: "Main activity updated successfully" };
    }),
  
  deleteMainActivity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Soft delete by setting isActive to false
      await db.update(mainActivities).set({ isActive: false }).where(eq(mainActivities.id, input.id));
      
      // Also deactivate all sub-activities under this main activity
      await db.update(subActivities).set({ isActive: false }).where(eq(subActivities.mainActivityId, input.id));
      
      return { success: true, message: "Main activity deleted successfully" };
    }),

  // ============================================================================
  // SUB-ACTIVITIES
  // ============================================================================
  
  // Get active sub-activities for dropdowns
  getSubActivities: publicProcedure
    .input(z.object({
      mainActivityId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input?.mainActivityId) {
        return await db.select().from(subActivities).where(
          and(eq(subActivities.mainActivityId, input.mainActivityId), eq(subActivities.isActive, true))
        ).orderBy(asc(subActivities.sortOrder), asc(subActivities.name));
      }
      
      return await db.select().from(subActivities)
        .where(eq(subActivities.isActive, true))
        .orderBy(asc(subActivities.sortOrder), asc(subActivities.name));
    }),
  
  // Get all sub-activities for admin management (including inactive)
  getAllSubActivities: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: subActivities.id,
        mainActivityId: subActivities.mainActivityId,
        name: subActivities.name,
        nameAr: subActivities.nameAr,
        description: subActivities.description,
        // New requirement fields
        needsRFC: subActivities.needsRFC,
        needsHRS: subActivities.needsHRS,
        needsMOP: subActivities.needsMOP,
        needsMHV: subActivities.needsMHV,
        needsRoomSelection: subActivities.needsRoomSelection,
        // Legacy fields
        requiresMOP: subActivities.requiresMOP,
        requiresPermit: subActivities.requiresPermit,
        riskLevel: subActivities.riskLevel,
        sortOrder: subActivities.sortOrder,
        isActive: subActivities.isActive,
        createdAt: subActivities.createdAt,
        mainActivityName: mainActivities.name,
      })
      .from(subActivities)
      .leftJoin(mainActivities, eq(subActivities.mainActivityId, mainActivities.id))
      .orderBy(asc(subActivities.sortOrder), asc(subActivities.name));
    return result;
  }),
  
  createSubActivity: adminProcedure
    .input(z.object({
      mainActivityId: z.number(),
      name: z.string().min(1).max(255),
      nameAr: z.string().max(255).optional(),
      description: z.string().optional(),
      // New requirement fields
      needsRFC: z.boolean().optional(),
      needsHRS: z.boolean().optional(),
      needsMOP: z.boolean().optional(),
      needsMHV: z.boolean().optional(),
      needsRoomSelection: z.boolean().optional(),
      // Legacy fields
      requiresMOP: z.boolean().optional(),
      requiresPermit: z.boolean().optional(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(subActivities).values({
        mainActivityId: input.mainActivityId,
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        needsRFC: input.needsRFC || false,
        needsHRS: input.needsHRS || false,
        needsMOP: input.needsMOP || false,
        needsMHV: input.needsMHV || false,
        needsRoomSelection: input.needsRoomSelection || false,
        requiresMOP: input.requiresMOP || false,
        requiresPermit: input.requiresPermit || false,
        riskLevel: input.riskLevel || "low",
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Sub-activity created successfully" };
    }),
  
  updateSubActivity: adminProcedure
    .input(z.object({
      id: z.number(),
      mainActivityId: z.number().optional(),
      name: z.string().min(1).max(255).optional(),
      nameAr: z.string().max(255).optional().nullable(),
      description: z.string().optional().nullable(),
      // New requirement fields
      needsRFC: z.boolean().optional(),
      needsHRS: z.boolean().optional(),
      needsMOP: z.boolean().optional(),
      needsMHV: z.boolean().optional(),
      needsRoomSelection: z.boolean().optional(),
      // Legacy fields
      requiresMOP: z.boolean().optional(),
      requiresPermit: z.boolean().optional(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(subActivities).set(data).where(eq(subActivities.id, id));
      
      return { success: true, message: "Sub-activity updated successfully" };
    }),
  
  deleteSubActivity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(subActivities).set({ isActive: false }).where(eq(subActivities.id, input.id));
      
      return { success: true, message: "Sub-activity deleted successfully" };
    }),

  // ============================================================================
  // ROLE TYPES
  // ============================================================================
  
  // Get active role types for dropdowns
  getRoleTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(roleTypes)
      .where(eq(roleTypes.isActive, true))
      .orderBy(asc(roleTypes.sortOrder), asc(roleTypes.name));
    return result;
  }),
  
  // Get all role types for admin management (including inactive)
  getAllRoleTypes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select().from(roleTypes)
      .orderBy(asc(roleTypes.sortOrder), asc(roleTypes.name));
    return result;
  }),
  
  createRoleType: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      nameAr: z.string().max(100).optional(),
      description: z.string().optional(),
      category: z.enum(["internal", "external", "contractor", "visitor"]).optional(),
      accessLevel: z.enum(["basic", "standard", "elevated", "full"]).optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(roleTypes).values({
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        category: input.category || "internal",
        accessLevel: input.accessLevel || "standard",
        sortOrder: input.sortOrder || 0,
      });
      
      return { success: true, message: "Role type created successfully" };
    }),
  
  updateRoleType: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      nameAr: z.string().max(100).optional().nullable(),
      description: z.string().optional().nullable(),
      category: z.enum(["internal", "external", "contractor", "visitor"]).optional(),
      accessLevel: z.enum(["basic", "standard", "elevated", "full"]).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(roleTypes).set(data).where(eq(roleTypes.id, id));
      
      return { success: true, message: "Role type updated successfully" };
    }),
  
  deleteRoleType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(roleTypes).set({ isActive: false }).where(eq(roleTypes.id, input.id));
      
      return { success: true, message: "Role type deleted successfully" };
    }),

  // ============================================================================
  // APPROVERS
  // ============================================================================
  
  // Get active approvers for dropdowns
  getApprovers: publicProcedure
    .input(z.object({
      siteId: z.number().optional(),
      regionId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let conditions = [eq(approvers.isActive, true)];
      if (input?.siteId) {
        conditions.push(eq(approvers.siteId, input.siteId));
      }
      if (input?.regionId) {
        conditions.push(eq(approvers.regionId, input.regionId));
      }
      
      const result = await db
        .select({
          id: approvers.id,
          userId: approvers.userId,
          siteId: approvers.siteId,
          regionId: approvers.regionId,
          approvalLevel: approvers.approvalLevel,
          maxApprovalAmount: approvers.maxApprovalAmount,
          canApproveEmergency: approvers.canApproveEmergency,
          canApproveVIP: approvers.canApproveVIP,
          delegateUserId: approvers.delegateUserId,
          isActive: approvers.isActive,
          userName: users.name,
          userEmail: users.email,
          siteName: sites.name,
        })
        .from(approvers)
        .leftJoin(users, eq(approvers.userId, users.id))
        .leftJoin(sites, eq(approvers.siteId, sites.id))
        .where(and(...conditions))
        .orderBy(asc(approvers.approvalLevel));
      return result;
    }),
  
  // Get all approvers for admin management (including inactive)
  getAllApprovers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: approvers.id,
        userId: approvers.userId,
        siteId: approvers.siteId,
        regionId: approvers.regionId,
        approvalLevel: approvers.approvalLevel,
        maxApprovalAmount: approvers.maxApprovalAmount,
        canApproveEmergency: approvers.canApproveEmergency,
        canApproveVIP: approvers.canApproveVIP,
        delegateUserId: approvers.delegateUserId,
        isActive: approvers.isActive,
        createdAt: approvers.createdAt,
        userName: users.name,
        userEmail: users.email,
        siteName: sites.name,
      })
      .from(approvers)
      .leftJoin(users, eq(approvers.userId, users.id))
      .leftJoin(sites, eq(approvers.siteId, sites.id))
      .orderBy(asc(approvers.approvalLevel));
    return result;
  }),
  
  createApprover: adminProcedure
    .input(z.object({
      userId: z.number(),
      siteId: z.number().optional(),
      regionId: z.number().optional(),
      approvalLevel: z.number().min(1).max(10).optional(),
      maxApprovalAmount: z.string().optional(),
      canApproveEmergency: z.boolean().optional(),
      canApproveVIP: z.boolean().optional(),
      delegateUserId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(approvers).values({
        userId: input.userId,
        siteId: input.siteId || null,
        regionId: input.regionId || null,
        approvalLevel: input.approvalLevel || 1,
        maxApprovalAmount: input.maxApprovalAmount,
        canApproveEmergency: input.canApproveEmergency || false,
        canApproveVIP: input.canApproveVIP || false,
        delegateUserId: input.delegateUserId || null,
      });
      
      return { success: true, message: "Approver created successfully" };
    }),
  
  updateApprover: adminProcedure
    .input(z.object({
      id: z.number(),
      userId: z.number().optional(),
      siteId: z.number().optional().nullable(),
      regionId: z.number().optional().nullable(),
      approvalLevel: z.number().min(1).max(10).optional(),
      maxApprovalAmount: z.string().optional().nullable(),
      canApproveEmergency: z.boolean().optional(),
      canApproveVIP: z.boolean().optional(),
      delegateUserId: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(approvers).set(data).where(eq(approvers.id, id));
      
      return { success: true, message: "Approver updated successfully" };
    }),
  
  deleteApprover: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(approvers).set({ isActive: false }).where(eq(approvers.id, input.id));
      
      return { success: true, message: "Approver deleted successfully" };
    }),

  // ============================================================================
  // COMPANIES (Contractors & Clients)
  // ============================================================================
  
  getAllCompanies: publicProcedure
    .input(z.object({
      type: z.enum(["contractor", "subcontractor", "client"]).optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions: any[] = [];
      if (input?.type) {
        conditions.push(eq(cardCompanies.type, input.type));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(cardCompanies.isActive, input.isActive));
      }
      
      const result = await db
        .select()
        .from(cardCompanies)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(cardCompanies.name));
      
      return result;
    }),
  
  getCompanyById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const [result] = await db
        .select()
        .from(cardCompanies)
        .where(eq(cardCompanies.id, input.id));
      
      return result || null;
    }),
  
  createCompany: adminProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      nameAr: z.string().optional(),
      type: z.enum(["contractor", "subcontractor", "client"]),
      parentCompanyId: z.number().optional(),
      // Contact person fields
      contactPersonName: z.string().optional(),
      contactPersonEmail: z.string().email().optional(),
      contactPersonPhone: z.string().optional(),
      contactPersonPosition: z.string().optional(),
      // Legacy fields (kept for compatibility)
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      // Contract fields
      contractReference: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      // Company details
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      registrationNumber: z.string().optional(),
      // Status
      status: z.enum(["active", "inactive", "suspended"]).default("active"),
      notes: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(cardCompanies).values({
        ...input,
        contractStartDate: input.contractStartDate ? new Date(input.contractStartDate) : null,
        contractEndDate: input.contractEndDate ? new Date(input.contractEndDate) : null,
      });
      
      return { id: result.insertId, ...input };
    }),
  
  updateCompany: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      nameAr: z.string().optional(),
      type: z.enum(["contractor", "subcontractor", "client"]).optional(),
      parentCompanyId: z.number().nullable().optional(),
      // Contact person fields
      contactPersonName: z.string().optional(),
      contactPersonEmail: z.string().email().optional(),
      contactPersonPhone: z.string().optional(),
      contactPersonPosition: z.string().optional(),
      // Legacy fields
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      // Contract fields
      contractReference: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      // Company details
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      registrationNumber: z.string().optional(),
      // Status
      status: z.enum(["active", "inactive", "suspended"]).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.contractStartDate) {
        updateData.contractStartDate = new Date(data.contractStartDate);
      }
      if (data.contractEndDate) {
        updateData.contractEndDate = new Date(data.contractEndDate);
      }

      
      await db.update(cardCompanies).set(updateData).where(eq(cardCompanies.id, id));
      
      return { success: true };
    }),
  
  deleteCompany: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(cardCompanies).set({ isActive: false }).where(eq(cardCompanies.id, input.id));
      
      return { success: true };
    }),
});
