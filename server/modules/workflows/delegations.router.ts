/**
 * Delegation System Router
 * 
 * Handles approval authority delegation for temporary transfers
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { eq, and, desc, sql, or } from "drizzle-orm";
import {
  approvalDelegations,
  users,
  approvalRoles,
} from "../../../drizzle/schema";

export const delegationsRouter = router({
  // List delegations for current user (as delegator or delegate)
  myDelegations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { asDelegate: [], asDelegator: [] };

    const asDelegate = await db
      .select({
        id: approvalDelegations.id,
        delegatorId: approvalDelegations.delegatorId,
        delegationType: approvalDelegations.delegationType,
        processTypes: approvalDelegations.processTypes,
        siteIds: approvalDelegations.siteIds,
        validFrom: approvalDelegations.validFrom,
        validUntil: approvalDelegations.validUntil,
        reason: approvalDelegations.reason,
        isActive: approvalDelegations.isActive,
        delegatorName: users.firstName,
        delegatorLastName: users.lastName,
        delegatorEmail: users.email,
      })
      .from(approvalDelegations)
      .leftJoin(users, eq(users.id, approvalDelegations.delegatorId))
      .where(eq(approvalDelegations.delegateId, ctx.user.id))
      .orderBy(desc(approvalDelegations.createdAt));

    const asDelegator = await db
      .select({
        id: approvalDelegations.id,
        delegateId: approvalDelegations.delegateId,
        delegationType: approvalDelegations.delegationType,
        processTypes: approvalDelegations.processTypes,
        siteIds: approvalDelegations.siteIds,
        validFrom: approvalDelegations.validFrom,
        validUntil: approvalDelegations.validUntil,
        reason: approvalDelegations.reason,
        isActive: approvalDelegations.isActive,
        delegateName: users.firstName,
        delegateLastName: users.lastName,
        delegateEmail: users.email,
      })
      .from(approvalDelegations)
      .leftJoin(users, eq(users.id, approvalDelegations.delegateId))
      .where(eq(approvalDelegations.delegatorId, ctx.user.id))
      .orderBy(desc(approvalDelegations.createdAt));

    return { asDelegate, asDelegator };
  }),

  // List all delegations (admin only)
  listAll: adminProcedure
    .input(z.object({
      includeInactive: z.boolean().optional().default(false),
      userId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions = [];
      
      if (!input?.includeInactive) {
        conditions.push(eq(approvalDelegations.isActive, true));
      }

      if (input?.userId) {
        conditions.push(
          or(
            eq(approvalDelegations.delegatorId, input.userId),
            eq(approvalDelegations.delegateId, input.userId)
          )!
        );
      }

      const delegations = await db
        .select()
        .from(approvalDelegations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(approvalDelegations.createdAt));

      // Enrich with user names
      const enriched = await Promise.all(
        delegations.map(async (d) => {
          const [delegator] = await db
            .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, d.delegatorId));
          
          const [delegate] = await db
            .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, d.delegateId));

          return {
            ...d,
            delegator,
            delegate,
          };
        })
      );

      return enriched;
    }),

  // Create a new delegation
  create: protectedProcedure
    .input(z.object({
      delegateId: z.number(),
      delegationType: z.enum(["full", "partial"]),
      processTypes: z.array(z.string()).optional(),
      siteIds: z.array(z.number()).optional(),
      approvalRoleIds: z.array(z.number()).optional(),
      validFrom: z.string(), // ISO date string
      validUntil: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user can delegate
      const [user] = await db
        .select({ canDelegate: users.canDelegate, maxDelegationDays: users.maxDelegationDays })
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user?.canDelegate) {
        throw new Error("You are not authorized to delegate approvals");
      }

      // Validate delegation period
      const validFrom = new Date(input.validFrom);
      const validUntil = new Date(input.validUntil);
      const maxDays = user.maxDelegationDays || 30;
      const daysDiff = Math.ceil((validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > maxDays) {
        throw new Error(`Delegation period cannot exceed ${maxDays} days`);
      }

      // Check for overlapping delegations
      const existing = await db
        .select()
        .from(approvalDelegations)
        .where(
          and(
            eq(approvalDelegations.delegatorId, ctx.user.id),
            eq(approvalDelegations.isActive, true),
            sql`${approvalDelegations.validFrom} <= ${validUntil}`,
            sql`${approvalDelegations.validUntil} >= ${validFrom}`
          )
        );

      if (existing.length > 0) {
        throw new Error("You have an overlapping active delegation for this period");
      }

      const [result] = await db.insert(approvalDelegations).values({
        delegatorId: ctx.user.id,
        delegateId: input.delegateId,
        delegationType: input.delegationType,
        processTypes: input.processTypes || null,
        siteIds: input.siteIds || null,
        approvalRoleIds: input.approvalRoleIds || null,
        validFrom,
        validUntil,
        reason: input.reason,
      });

      return { id: Number(result.insertId) };
    }),

  // Revoke a delegation
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [delegation] = await db
        .select()
        .from(approvalDelegations)
        .where(eq(approvalDelegations.id, input.id));

      if (!delegation) {
        throw new Error("Delegation not found");
      }

      // Only delegator or admin can revoke
      if (delegation.delegatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You are not authorized to revoke this delegation");
      }

      await db
        .update(approvalDelegations)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedBy: ctx.user.id,
        })
        .where(eq(approvalDelegations.id, input.id));

      return { success: true };
    }),

  // Set out-of-office delegation
  setOutOfOffice: protectedProcedure
    .input(z.object({
      delegateId: z.number(),
      until: z.string(), // ISO date string
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          outOfOfficeUntil: new Date(input.until),
          outOfOfficeDelegateId: input.delegateId,
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Clear out-of-office delegation
  clearOutOfOffice: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(users)
      .set({
        outOfOfficeUntil: null,
        outOfOfficeDelegateId: null,
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  // Get out-of-office status
  getOutOfOfficeStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [user] = await db
      .select({
        outOfOfficeUntil: users.outOfOfficeUntil,
        outOfOfficeDelegateId: users.outOfOfficeDelegateId,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user?.outOfOfficeDelegateId) return null;

    const [delegate] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, user.outOfOfficeDelegateId));

    return {
      until: user.outOfOfficeUntil,
      delegate,
    };
  }),

  // Get eligible delegates for a user
  getEligibleDelegates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get all active users except the current user
    const eligibleUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        approvalAuthorityLevel: users.approvalAuthorityLevel,
      })
      .from(users)
      .where(
        and(
          sql`${users.id} != ${ctx.user.id}`,
          sql`${users.approvalAuthorityLevel} > 0`
        )
      )
      .orderBy(users.firstName);

    return eligibleUsers;
  }),

  // Admin: Force create delegation for any user
  adminCreate: adminProcedure
    .input(z.object({
      delegatorId: z.number(),
      delegateId: z.number(),
      delegationType: z.enum(["full", "partial"]),
      processTypes: z.array(z.string()).optional(),
      siteIds: z.array(z.number()).optional(),
      approvalRoleIds: z.array(z.number()).optional(),
      validFrom: z.string(),
      validUntil: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(approvalDelegations).values({
        delegatorId: input.delegatorId,
        delegateId: input.delegateId,
        delegationType: input.delegationType,
        processTypes: input.processTypes || null,
        siteIds: input.siteIds || null,
        approvalRoleIds: input.approvalRoleIds || null,
        validFrom: new Date(input.validFrom),
        validUntil: new Date(input.validUntil),
        reason: input.reason,
      });

      return { id: Number(result.insertId) };
    }),
});
