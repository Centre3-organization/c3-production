import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Checkpoint Router - Simplified Version
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
        transactionType: z.enum([
          "person_entry",
          "person_exit",
          "vehicle_entry",
          "vehicle_exit",
          "asset_entry",
          "asset_exit",
        ]),
        decision: z.enum(["allowed", "denied"]),
        guardId: z.number(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          transactionId: Math.floor(Math.random() * 10000),
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
      // Mock data
      return [
        {
          id: 1,
          personName: "Ahmed Al-Rashid",
          decision: "allowed",
          transactionType: "person_entry",
          createdAt: new Date(Date.now() - 5 * 60000),
        },
        {
          id: 2,
          personName: "Fatima Al-Dosari",
          decision: "denied",
          transactionType: "person_entry",
          createdAt: new Date(Date.now() - 15 * 60000),
        },
      ];
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
      if (input.comments.length < 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Comments must be at least 20 characters",
        });
      }

      try {
        return {
          success: true,
          reportId: Math.floor(Math.random() * 10000),
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
      // Mock data
      return [
        {
          id: 1,
          visitorName: "Fatima Al-Dosari",
          denialReason: "request_expired",
          comments: "Request was expired at time of entry attempt",
          createdAt: new Date(Date.now() - 15 * 60000),
        },
      ];
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
      // Mock implementation
      return {
        onWatchlist: false,
        entries: [],
        severity: null,
      };
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
      // Mock data
      return [
        {
          id: 1,
          entryType: "person",
          personName: "Suspicious Person",
          severity: "high",
          reason: "Repeat denial attempts",
          actionRequired: "alert_supervisor",
          createdAt: new Date(),
        },
      ];
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
        actionRequired: z.enum([
          "monitor",
          "deny_entry",
          "alert_supervisor",
          "call_security",
        ]),
        sourceType: z.enum([
          "denial_report",
          "unregistered_attempt",
          "fake_pass",
          "security_incident",
          "manual_entry",
        ]),
        guardId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          entryId: Math.floor(Math.random() * 10000),
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
      try {
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
      // Mock data
      return {
        checkpoint: {
          id: input.checkpointId,
          name: "Main Gate",
          location: "Entrance A",
          status: "active",
        },
        recentTransactions: [
          {
            id: 1,
            personName: "Ahmed Al-Rashid",
            decision: "allowed",
            transactionType: "person_entry",
            createdAt: new Date(Date.now() - 5 * 60000),
          },
        ],
        recentDenials: [
          {
            id: 1,
            visitorName: "Fatima Al-Dosari",
            denialReason: "request_expired",
            createdAt: new Date(Date.now() - 15 * 60000),
          },
        ],
        stats: {
          totalTransactions: 45,
          totalDenials: 3,
          allowedCount: 42,
          deniedCount: 3,
        },
      };
    }),
});
