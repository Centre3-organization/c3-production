/**
 * Shift Management Router
 * 
 * Handles shift schedules, definitions, and assignments for time-based approval routing
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  shiftSchedules,
  shiftDefinitions,
  shiftAssignments,
  users,
  sites,
} from "../../../drizzle/schema";

export const shiftsRouter = router({
  // List all shift schedules
  listSchedules: protectedProcedure
    .input(z.object({
      siteId: z.number().optional(),
      includeInactive: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(shiftSchedules);
      
      if (input?.siteId) {
        query = query.where(eq(shiftSchedules.siteId, input.siteId)) as any;
      }
      
      if (!input?.includeInactive) {
        query = query.where(eq(shiftSchedules.isActive, true)) as any;
      }

      return await query.orderBy(asc(shiftSchedules.name));
    }),

  // Get schedule with shifts and assignments
  getScheduleDetails: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [schedule] = await db
        .select()
        .from(shiftSchedules)
        .where(eq(shiftSchedules.id, input.scheduleId));

      if (!schedule) return null;

      const shifts = await db
        .select()
        .from(shiftDefinitions)
        .where(eq(shiftDefinitions.scheduleId, schedule.id))
        .orderBy(asc(shiftDefinitions.startTime));

      const shiftsWithAssignments = await Promise.all(
        shifts.map(async (shift) => {
          const assignments = await db
            .select({
              id: shiftAssignments.id,
              userId: shiftAssignments.userId,
              roleInShift: shiftAssignments.roleInShift,
              isPrimary: shiftAssignments.isPrimary,
              validFrom: shiftAssignments.validFrom,
              validUntil: shiftAssignments.validUntil,
              isActive: shiftAssignments.isActive,
              userName: users.firstName,
              userLastName: users.lastName,
              userEmail: users.email,
            })
            .from(shiftAssignments)
            .leftJoin(users, eq(users.id, shiftAssignments.userId))
            .where(eq(shiftAssignments.shiftId, shift.id));

          return {
            ...shift,
            assignments,
          };
        })
      );

      return {
        schedule,
        shifts: shiftsWithAssignments,
      };
    }),

  // Create a new shift schedule
  createSchedule: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      siteId: z.number().optional(),
      timezone: z.string().default("Asia/Riyadh"),
      isDefault: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // If setting as default, unset other defaults for the site
      if (input.isDefault) {
        await db
          .update(shiftSchedules)
          .set({ isDefault: false })
          .where(
            input.siteId
              ? eq(shiftSchedules.siteId, input.siteId)
              : eq(shiftSchedules.isDefault, true)
          );
      }

      const [result] = await db.insert(shiftSchedules).values({
        name: input.name,
        siteId: input.siteId,
        timezone: input.timezone,
        isDefault: input.isDefault,
        createdBy: ctx.user.id,
      });

      return { id: Number(result.insertId) };
    }),

  // Update a shift schedule
  updateSchedule: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      timezone: z.string().optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        const [schedule] = await db
          .select({ siteId: shiftSchedules.siteId })
          .from(shiftSchedules)
          .where(eq(shiftSchedules.id, id));

        if (schedule) {
          await db
            .update(shiftSchedules)
            .set({ isDefault: false })
            .where(
              schedule.siteId
                ? eq(shiftSchedules.siteId, schedule.siteId)
                : eq(shiftSchedules.isDefault, true)
            );
        }
      }

      await db
        .update(shiftSchedules)
        .set(updates)
        .where(eq(shiftSchedules.id, id));

      return { success: true };
    }),

  // Create a shift definition
  createShift: adminProcedure
    .input(z.object({
      scheduleId: z.number(),
      name: z.string().min(1),
      startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      daysOfWeek: z.array(z.number().min(0).max(6)), // 0=Sunday, 6=Saturday
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(shiftDefinitions).values({
        scheduleId: input.scheduleId,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        daysOfWeek: input.daysOfWeek,
      });

      return { id: Number(result.insertId) };
    }),

  // Update a shift definition
  updateShift: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db
        .update(shiftDefinitions)
        .set(updates)
        .where(eq(shiftDefinitions.id, id));

      return { success: true };
    }),

  // Delete a shift definition
  deleteShift: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete assignments first
      await db
        .delete(shiftAssignments)
        .where(eq(shiftAssignments.shiftId, input.id));

      // Delete the shift
      await db
        .delete(shiftDefinitions)
        .where(eq(shiftDefinitions.id, input.id));

      return { success: true };
    }),

  // Assign a user to a shift
  assignUser: adminProcedure
    .input(z.object({
      shiftId: z.number(),
      userId: z.number(),
      roleInShift: z.string().min(1),
      isPrimary: z.boolean().optional().default(true),
      validFrom: z.string().optional(), // ISO date string
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(shiftAssignments).values({
        shiftId: input.shiftId,
        userId: input.userId,
        roleInShift: input.roleInShift,
        isPrimary: input.isPrimary,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        createdBy: ctx.user.id,
      });

      return { id: Number(result.insertId) };
    }),

  // Update a shift assignment
  updateAssignment: adminProcedure
    .input(z.object({
      id: z.number(),
      roleInShift: z.string().min(1).optional(),
      isPrimary: z.boolean().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, validFrom, validUntil, ...rest } = input;

      await db
        .update(shiftAssignments)
        .set({
          ...rest,
          validFrom: validFrom ? new Date(validFrom) : undefined,
          validUntil: validUntil ? new Date(validUntil) : undefined,
        })
        .where(eq(shiftAssignments.id, id));

      return { success: true };
    }),

  // Remove a shift assignment
  removeAssignment: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(shiftAssignments)
        .where(eq(shiftAssignments.id, input.id));

      return { success: true };
    }),

  // Get current shift for a site
  getCurrentShift: protectedProcedure
    .input(z.object({ siteId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
      const dayOfWeek = now.getDay();

      // Find applicable schedule
      let schedules: (typeof shiftSchedules.$inferSelect)[] = [];
      if (input.siteId) {
        schedules = await db
          .select()
          .from(shiftSchedules)
          .where(
            and(
              eq(shiftSchedules.isActive, true),
              eq(shiftSchedules.siteId, input.siteId)
            )
          );
      }

      if (!schedules?.length) {
        // Try default schedule
        schedules = await db
          .select()
          .from(shiftSchedules)
          .where(
            and(
              eq(shiftSchedules.isActive, true),
              eq(shiftSchedules.isDefault, true)
            )
          );
      }

      const schedule = schedules?.[0];
      if (!schedule) return null;

      // Find current shift
      const shifts = await db
        .select()
        .from(shiftDefinitions)
        .where(
          and(
            eq(shiftDefinitions.scheduleId, schedule.id),
            eq(shiftDefinitions.isActive, true)
          )
        );

      for (const shift of shifts) {
        const daysOfWeek = shift.daysOfWeek as number[];
        if (!daysOfWeek.includes(dayOfWeek)) continue;

        const startTime = shift.startTime;
        const endTime = shift.endTime;

        let isInShift = false;
        if (startTime < endTime) {
          isInShift = currentTime >= startTime && currentTime < endTime;
        } else {
          // Shift crosses midnight
          isInShift = currentTime >= startTime || currentTime < endTime;
        }

        if (isInShift) {
          // Get assignments for this shift
          const assignments = await db
            .select({
              id: shiftAssignments.id,
              userId: shiftAssignments.userId,
              roleInShift: shiftAssignments.roleInShift,
              isPrimary: shiftAssignments.isPrimary,
              userName: users.firstName,
              userLastName: users.lastName,
            })
            .from(shiftAssignments)
            .leftJoin(users, eq(users.id, shiftAssignments.userId))
            .where(
              and(
                eq(shiftAssignments.shiftId, shift.id),
                eq(shiftAssignments.isActive, true)
              )
            );

          return {
            schedule,
            shift,
            assignments,
          };
        }
      }

      return null;
    }),

  // Get available roles for shift assignments
  getShiftRoles: protectedProcedure.query(async () => {
    // Return predefined shift roles
    return [
      { code: "security_incharge", name: "Security In-Charge" },
      { code: "shift_supervisor", name: "Shift Supervisor" },
      { code: "duty_manager", name: "Duty Manager" },
      { code: "site_engineer", name: "Site Engineer" },
      { code: "operations_lead", name: "Operations Lead" },
      { code: "access_controller", name: "Access Controller" },
      { code: "emergency_responder", name: "Emergency Responder" },
    ];
  }),
});
