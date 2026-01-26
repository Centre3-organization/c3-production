import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { eq, and, isNull, sql, desc, asc } from "drizzle-orm";
import { getDb } from "../../db";
import { 
  groups, 
  userGroupMembership, 
  groupAccessPolicy, 
  groupSecuritySettings,
  users,
  sites,
  zones,
  areas
} from "../../../drizzle/schema";

// ============================================================================
// GROUPS ROUTER
// ============================================================================

export const groupsRouter = router({
  // List all groups with hierarchy
  list: publicProcedure
    .input(z.object({
      parentGroupId: z.number().nullable().optional(),
      groupType: z.enum(["internal", "external"]).optional(),
      status: z.enum(["active", "inactive"]).optional(),
      includeChildren: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(groups);
      
      const conditions = [];
      
      if (input?.parentGroupId !== undefined) {
        if (input.parentGroupId === null) {
          conditions.push(isNull(groups.parentGroupId));
        } else {
          conditions.push(eq(groups.parentGroupId, input.parentGroupId));
        }
      }
      
      if (input?.groupType) {
        conditions.push(eq(groups.groupType, input.groupType));
      }
      
      if (input?.status) {
        conditions.push(eq(groups.status, input.status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const result = await query.orderBy(asc(groups.name));
      return result;
    }),

  // Get group hierarchy (tree structure)
  getHierarchy: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allGroups = await db.select().from(groups).where(eq(groups.status, "active"));
    
    // Build tree structure
    const buildTree = (parentId: number | null): any[] => {
      return allGroups
        .filter(g => g.parentGroupId === parentId)
        .map(g => ({
          ...g,
          children: buildTree(g.id),
        }));
    };

    return buildTree(null);
  }),

  // Get single group by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(groups).where(eq(groups.id, input.id)).limit(1);
      return result[0] || null;
    }),

  // Create new group
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      groupType: z.enum(["internal", "external"]),
      parentGroupId: z.number().nullable().optional(),
      description: z.string().optional(),
      metadata: z.object({
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        contractNumber: z.string().optional(),
        contractStartDate: z.string().optional(),
        contractEndDate: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(groups).values({
        name: input.name,
        groupType: input.groupType,
        parentGroupId: input.parentGroupId || null,
        description: input.description || null,
        metadata: input.metadata || null,
        createdBy: ctx.user.id,
        status: "active",
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  // Update group
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
      metadata: z.object({
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        contractNumber: z.string().optional(),
        contractStartDate: z.string().optional(),
        contractEndDate: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;

      await db.update(groups).set(updateData).where(eq(groups.id, input.id));

      return { success: true };
    }),

  // Delete group (soft delete by setting status to inactive)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if group has children
      const children = await db.select().from(groups).where(eq(groups.parentGroupId, input.id));
      if (children.length > 0) {
        throw new Error("Cannot delete group with sub-groups. Delete sub-groups first.");
      }

      // Check if group has members
      const members = await db.select().from(userGroupMembership)
        .where(and(eq(userGroupMembership.groupId, input.id), eq(userGroupMembership.status, "active")));
      if (members.length > 0) {
        throw new Error("Cannot delete group with active members. Remove members first.");
      }

      await db.update(groups).set({ status: "inactive" }).where(eq(groups.id, input.id));

      return { success: true };
    }),

  // Get group members
  getMembers: publicProcedure
    .input(z.object({ 
      groupId: z.number(),
      status: z.enum(["active", "inactive", "pending"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(userGroupMembership.groupId, input.groupId)];
      if (input.status) {
        conditions.push(eq(userGroupMembership.status, input.status));
      }

      const result = await db
        .select({
          membership: userGroupMembership,
          user: users,
        })
        .from(userGroupMembership)
        .innerJoin(users, eq(userGroupMembership.userId, users.id))
        .where(and(...conditions));

      return result.map(r => ({
        ...r.membership,
        user: r.user,
      }));
    }),

  // Add user to group
  addMember: protectedProcedure
    .input(z.object({
      userId: z.number(),
      groupId: z.number(),
      isPrimaryGroup: z.boolean().optional().default(false),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if membership already exists
      const existing = await db.select().from(userGroupMembership)
        .where(and(
          eq(userGroupMembership.userId, input.userId),
          eq(userGroupMembership.groupId, input.groupId)
        ));

      if (existing.length > 0) {
        // Update existing membership
        await db.update(userGroupMembership)
          .set({
            status: "active",
            isPrimaryGroup: input.isPrimaryGroup,
            validFrom: input.validFrom ? new Date(input.validFrom) : null,
            validUntil: input.validUntil ? new Date(input.validUntil) : null,
          })
          .where(eq(userGroupMembership.id, existing[0].id));
        return { success: true, id: existing[0].id };
      }

      // If setting as primary, unset other primary groups for this user
      if (input.isPrimaryGroup) {
        await db.update(userGroupMembership)
          .set({ isPrimaryGroup: false })
          .where(eq(userGroupMembership.userId, input.userId));
      }

      const result = await db.insert(userGroupMembership).values({
        userId: input.userId,
        groupId: input.groupId,
        isPrimaryGroup: input.isPrimaryGroup,
        assignedBy: ctx.user.id,
        status: "active",
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  // Remove user from group
  removeMember: protectedProcedure
    .input(z.object({
      userId: z.number(),
      groupId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(userGroupMembership)
        .set({ status: "inactive" })
        .where(and(
          eq(userGroupMembership.userId, input.userId),
          eq(userGroupMembership.groupId, input.groupId)
        ));

      return { success: true };
    }),

  // Get user's groups
  getUserGroups: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select({
          membership: userGroupMembership,
          group: groups,
        })
        .from(userGroupMembership)
        .innerJoin(groups, eq(userGroupMembership.groupId, groups.id))
        .where(and(
          eq(userGroupMembership.userId, input.userId),
          eq(userGroupMembership.status, "active")
        ));

      return result.map(r => ({
        ...r.membership,
        group: r.group,
      }));
    }),

  // ============================================================================
  // ACCESS POLICIES
  // ============================================================================

  // Get group access policies
  getAccessPolicies: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const policies = await db.select().from(groupAccessPolicy)
        .where(eq(groupAccessPolicy.groupId, input.groupId));

      // Enrich with resource names
      const enrichedPolicies = await Promise.all(policies.map(async (policy) => {
        let resourceName = null;
        if (policy.resourceId) {
          if (policy.resourceType === "site") {
            const site = await db.select().from(sites).where(eq(sites.id, policy.resourceId)).limit(1);
            resourceName = site[0]?.name;
          } else if (policy.resourceType === "zone") {
            const zone = await db.select().from(zones).where(eq(zones.id, policy.resourceId)).limit(1);
            resourceName = zone[0]?.name;
          } else if (policy.resourceType === "area") {
            const area = await db.select().from(areas).where(eq(areas.id, policy.resourceId)).limit(1);
            resourceName = area[0]?.name;
          }
        }
        return { ...policy, resourceName };
      }));

      return enrichedPolicies;
    }),

  // Create access policy
  createAccessPolicy: protectedProcedure
    .input(z.object({
      groupId: z.number(),
      resourceType: z.enum(["site", "zone", "area", "system", "application", "data"]),
      resourceId: z.number().nullable().optional(),
      accessLevel: z.enum(["none", "read", "write", "execute", "delete", "admin"]),
      timeRestriction: z.object({
        daysOfWeek: z.array(z.number()).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        timezone: z.string().optional(),
      }).optional(),
      ipRestrictions: z.array(z.string()).optional(),
      requiresMfa: z.boolean().optional(),
      requiresApproval: z.boolean().optional(),
      requiresEscort: z.boolean().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(groupAccessPolicy).values({
        groupId: input.groupId,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        accessLevel: input.accessLevel,
        timeRestriction: input.timeRestriction || null,
        ipRestrictions: input.ipRestrictions || null,
        requiresMfa: input.requiresMfa || false,
        requiresApproval: input.requiresApproval || false,
        requiresEscort: input.requiresEscort || false,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  // Update access policy
  updateAccessPolicy: protectedProcedure
    .input(z.object({
      id: z.number(),
      accessLevel: z.enum(["none", "read", "write", "execute", "delete", "admin"]).optional(),
      timeRestriction: z.object({
        daysOfWeek: z.array(z.number()).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        timezone: z.string().optional(),
      }).optional(),
      ipRestrictions: z.array(z.string()).optional(),
      requiresMfa: z.boolean().optional(),
      requiresApproval: z.boolean().optional(),
      requiresEscort: z.boolean().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, any> = {};
      if (input.accessLevel !== undefined) updateData.accessLevel = input.accessLevel;
      if (input.timeRestriction !== undefined) updateData.timeRestriction = input.timeRestriction;
      if (input.ipRestrictions !== undefined) updateData.ipRestrictions = input.ipRestrictions;
      if (input.requiresMfa !== undefined) updateData.requiresMfa = input.requiresMfa;
      if (input.requiresApproval !== undefined) updateData.requiresApproval = input.requiresApproval;
      if (input.requiresEscort !== undefined) updateData.requiresEscort = input.requiresEscort;
      if (input.validFrom !== undefined) updateData.validFrom = input.validFrom ? new Date(input.validFrom) : null;
      if (input.validUntil !== undefined) updateData.validUntil = input.validUntil ? new Date(input.validUntil) : null;

      await db.update(groupAccessPolicy).set(updateData).where(eq(groupAccessPolicy.id, input.id));

      return { success: true };
    }),

  // Delete access policy
  deleteAccessPolicy: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(groupAccessPolicy).where(eq(groupAccessPolicy.id, input.id));

      return { success: true };
    }),

  // ============================================================================
  // SECURITY SETTINGS
  // ============================================================================

  // Get group security settings
  getSecuritySettings: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(groupSecuritySettings)
        .where(eq(groupSecuritySettings.groupId, input.groupId)).limit(1);

      return result[0] || null;
    }),

  // Create or update security settings
  upsertSecuritySettings: protectedProcedure
    .input(z.object({
      groupId: z.number(),
      sessionTimeoutMinutes: z.number().optional(),
      passwordComplexityLevel: z.enum(["basic", "standard", "high"]).optional(),
      mfaRequired: z.boolean().optional(),
      allowedIpRanges: z.array(z.string()).optional(),
      allowedLocations: z.array(z.string()).optional(),
      auditLevel: z.enum(["basic", "detailed", "comprehensive"]).optional(),
      accessReviewFrequency: z.enum(["monthly", "quarterly", "annually", "never"]).optional(),
      maxConcurrentSessions: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings exist
      const existing = await db.select().from(groupSecuritySettings)
        .where(eq(groupSecuritySettings.groupId, input.groupId)).limit(1);

      if (existing.length > 0) {
        // Update
        const updateData: Record<string, any> = {};
        if (input.sessionTimeoutMinutes !== undefined) updateData.sessionTimeoutMinutes = input.sessionTimeoutMinutes;
        if (input.passwordComplexityLevel !== undefined) updateData.passwordComplexityLevel = input.passwordComplexityLevel;
        if (input.mfaRequired !== undefined) updateData.mfaRequired = input.mfaRequired;
        if (input.allowedIpRanges !== undefined) updateData.allowedIpRanges = input.allowedIpRanges;
        if (input.allowedLocations !== undefined) updateData.allowedLocations = input.allowedLocations;
        if (input.auditLevel !== undefined) updateData.auditLevel = input.auditLevel;
        if (input.accessReviewFrequency !== undefined) updateData.accessReviewFrequency = input.accessReviewFrequency;
        if (input.maxConcurrentSessions !== undefined) updateData.maxConcurrentSessions = input.maxConcurrentSessions;

        await db.update(groupSecuritySettings).set(updateData)
          .where(eq(groupSecuritySettings.groupId, input.groupId));

        return { success: true, id: existing[0].id };
      } else {
        // Create
        const result = await db.insert(groupSecuritySettings).values({
          groupId: input.groupId,
          sessionTimeoutMinutes: input.sessionTimeoutMinutes || 30,
          passwordComplexityLevel: input.passwordComplexityLevel || "standard",
          mfaRequired: input.mfaRequired || false,
          allowedIpRanges: input.allowedIpRanges || null,
          allowedLocations: input.allowedLocations || null,
          auditLevel: input.auditLevel || "basic",
          accessReviewFrequency: input.accessReviewFrequency || "quarterly",
          maxConcurrentSessions: input.maxConcurrentSessions || 3,
        });

        return { success: true, id: Number(result[0].insertId) };
      }
    }),

  // Get group statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalGroups: 0, internalGroups: 0, externalGroups: 0, totalMembers: 0 };

    const allGroups = await db.select().from(groups).where(eq(groups.status, "active"));
    const allMemberships = await db.select().from(userGroupMembership).where(eq(userGroupMembership.status, "active"));

    return {
      totalGroups: allGroups.length,
      internalGroups: allGroups.filter(g => g.groupType === "internal").length,
      externalGroups: allGroups.filter(g => g.groupType === "external").length,
      totalMembers: allMemberships.length,
    };
  }),
});
