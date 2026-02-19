import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import {
  checkpoints,
  checkpointTransactions,
  denialReports,
  watchlist,
} from "../../../drizzle/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Checkpoint Router
 * Handles security checkpoint operations for guards
 */
export const checkpointRouter = router({
  // ==================== SEARCH ====================

  /**
   * Search for access requests by multiple methods
   */
  searchRequest: protectedProcedure
    .input(
      z.object({
        method: z.enum(["qr", "request_number", "id_number", "plate"]),
        value: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      // Mock implementation - returns sample request data
      // In production, this would query the requests table
      return {
        found: true,
        request: {
          id: 1,
          requestNumber: "REQ-2026-001234",
          visitorName: "Ahmed Al-Rashid",
          visitorIdNumber: "1234567890",
          visitorIdType: "National ID",
          visitorCompany: "Tech Solutions LLC",
          requestType: "Contractor Visit",
          hostName: "Mohammed Al-Otaibi",
          hostDepartment: "IT Department",
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 8 * 3600000),
          accessZones: ["Zone A", "Zone B"],
          status: "approved",
          specialInstructions: "Must wear safety helmet",
        },
      };
    }),

  // ==================== TRANSACTIONS ====================

  /**
   * Log an entry/exit transaction
   */
  logTransaction: protectedProcedure
    .input(
      z.object({
        checkpointId: z.number(),
        requestId: z.number().optional(),
        visitorName: z.string(),
        visitorIdNumber: z.string(),
        transactionType: z.enum(["person_entry", "person_exit", "vehicle_entry", "vehicle_exit", "asset_entry", "asset_exit"]),
        decision: z.enum(["allowed", "denied"]),
        guardId: z.number(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const result = await db.insert(checkpointTransactions).values({
          checkpointId: input.checkpointId,
          requestId: input.requestId,
          visitorName: input.visitorName,
          visitorIdNumber: input.visitorIdNumber,
          transactionType: input.transactionType,
          decision: input.decision,
          guardId: input.guardId,
          photoUrl: input.photoUrl,
          notes: input.notes,
          createdAt: new Date(),
        });

        return {
          success: true,
          transactionId: (result as any).insertId || 0,
          message: `Entry ${input.decision === "allowed" ? "ALLOWED" : "DENIED"}`,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log transaction: " + error.message,
        });
      }
    }),

  /**
   * Get transaction history for a checkpoint
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        checkpointId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const transactions = await db.query.checkpointTransactions.findMany({
          where: eq(checkpointTransactions.checkpointId, input.checkpointId),
          orderBy: desc(checkpointTransactions.createdAt),
          limit: input.limit,
          offset: input.offset,
        });

        return transactions;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transaction history: " + error.message,
        });
      }
    }),

  // ==================== DENIAL REPORTS ====================

  /**
   * Submit a denial report (mandatory when denying entry)
   */
  submitDenialReport: protectedProcedure
    .input(
      z.object({
        checkpointId: z.number(),
        transactionId: z.number(),
        visitorName: z.string(),
        visitorIdNumber: z.string(),
        denialReason: z.enum([
          "request_not_found",
          "request_expired",
          "wrong_date_time",
          "fake_pass",
          "escort_not_present",
          "safety_violation",
          "other",
        ]),
        comments: z.string().min(20),
        photoUrl: z.string().optional(),
        guardId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.comments.length < 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Comments must be at least 20 characters",
        });
      }

      try {
        const result = await db.insert(denialReports).values({
          checkpointId: input.checkpointId,
          transactionId: input.transactionId,
          visitorName: input.visitorName,
          visitorIdNumber: input.visitorIdNumber,
          denialReason: input.denialReason,
          comments: input.comments,
          photoUrl: input.photoUrl,
          guardId: input.guardId,
          createdAt: new Date(),
        });

        return {
          success: true,
          reportId: (result as any).insertId || 0,
          message: "Denial report submitted successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit denial report: " + error.message,
        });
      }
    }),

  /**
   * Get denial reports for a checkpoint
   */
  getDenialReports: protectedProcedure
    .input(
      z.object({
        checkpointId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const reports = await db.query.denialReports.findMany({
          where: eq(denialReports.checkpointId, input.checkpointId),
          orderBy: desc(denialReports.createdAt),
          limit: input.limit,
          offset: input.offset,
        });

        return reports;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch denial reports: " + error.message,
        });
      }
    }),

  // ==================== WATCHLIST ====================

  /**
   * Check if person/vehicle is on watchlist
   */
  checkWatchlist: protectedProcedure
    .input(
      z.object({
        entryType: z.enum(["person", "vehicle", "company"]),
        personName: z.string().optional(),
        idNumber: z.string().optional(),
        vehiclePlate: z.string().optional(),
        companyName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const conditions: any[] = [eq(watchlist.isActive, true), eq(watchlist.entryType, input.entryType)];

        if (input.personName) {
          conditions.push(like(watchlist.personName, `%${input.personName}%`));
        }
        if (input.idNumber) {
          conditions.push(eq(watchlist.idNumber, input.idNumber));
        }
        if (input.vehiclePlate) {
          conditions.push(eq(watchlist.vehiclePlate, input.vehiclePlate));
        }
        if (input.companyName) {
          conditions.push(like(watchlist.companyName, `%${input.companyName}%`));
        }

        const entries = await db.query.watchlist.findMany({
          where: and(...conditions),
        });

        return {
          onWatchlist: entries.length > 0,
          entries: entries,
          severity: entries.length > 0 ? (entries[0] as any).severity : null,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check watchlist: " + error.message,
        });
      }
    }),

  /**
   * Get all watchlist entries
   */
  getWatchlist: protectedProcedure
    .input(
      z.object({
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const conditions: any[] = [eq(watchlist.isActive, true)];

        if (input.severity) {
          conditions.push(eq(watchlist.severity, input.severity));
        }

        const entries = await db.query.watchlist.findMany({
          where: and(...conditions),
          limit: input.limit,
          offset: input.offset,
          orderBy: desc(watchlist.createdAt),
        }) as any[];

        return entries;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch watchlist: " + error.message,
        });
      }
    }),

  /**
   * Add entry to watchlist
   */
  addToWatchlist: protectedProcedure
    .input(
      z.object({
        entryType: z.enum(["person", "vehicle", "company"]),
        personName: z.string().optional(),
        idNumber: z.string().optional(),
        vehiclePlate: z.string().optional(),
        companyName: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        reason: z.string().min(10),
        actionRequired: z.enum(["monitor", "deny_entry", "alert_supervisor", "call_security"]),
        sourceType: z.enum(["denial_report", "unregistered_attempt", "fake_pass", "security_incident", "manual_entry"]),
        guardId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const result = await db.insert(watchlist).values({
          entryType: input.entryType,
          personName: input.personName,
          idNumber: input.idNumber,
          vehiclePlate: input.vehiclePlate,
          companyName: input.companyName,
          severity: input.severity,
          reason: input.reason,
          actionRequired: input.actionRequired,
          sourceType: input.sourceType,
          isActive: true,
          addedBy: ctx.user?.id || input.guardId,
          createdAt: new Date(),
        });

        return {
          success: true,
          entryId: (result as any).insertId || 0,
          message: "Added to watchlist",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add to watchlist: " + error.message,
        });
      }
    }),

  /**
   * Remove entry from watchlist
   */
  removeFromWatchlist: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        await db.update(watchlist).set({ isActive: false }).where(eq(watchlist.id, input.id));

        return {
          success: true,
          message: "Removed from watchlist",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove from watchlist: " + error.message,
        });
      }
    }),

  // ==================== CHECKPOINT INFO ====================

  /**
   * Get checkpoint details and recent activity
   */
  getCheckpointInfo: protectedProcedure
    .input(z.object({ checkpointId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const checkpoint = await db.query.checkpoints.findFirst({
          where: eq(checkpoints.id, input.checkpointId),
        });

        if (!checkpoint) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Checkpoint not found",
          });
        }

        const recentTransactions = await db.query.checkpointTransactions.findMany({
          where: eq(checkpointTransactions.checkpointId, input.checkpointId),
          orderBy: desc(checkpointTransactions.createdAt),
          limit: 20,
        });

        const recentDenials = await db.query.denialReports.findMany({
          where: eq(denialReports.checkpointId, input.checkpointId),
          orderBy: desc(denialReports.createdAt),
          limit: 10,
        });

        return {
          checkpoint,
          recentTransactions,
          recentDenials,
          stats: {
            totalTransactions: recentTransactions.length,
            totalDenials: recentDenials.length,
            allowedCount: recentTransactions.filter((t: any) => t.decision === "allowed").length,
            deniedCount: recentTransactions.filter((t: any) => t.decision === "denied").length,
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch checkpoint info: " + error.message,
        });
      }
    }),
});
