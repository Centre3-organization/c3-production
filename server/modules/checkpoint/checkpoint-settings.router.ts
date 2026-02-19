import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";

// Zod schemas for validation
const CameraSettingsSchema = z.object({
  enabled: z.boolean(),
  resolution: z.enum(["640x480", "1280x720", "1920x1080"]),
  facingMode: z.enum(["user", "environment"]),
});

const AISettingsSchema = z.object({
  enabled: z.boolean(),
  claudeApiKey: z.string().optional(),
  faceMatching: z.boolean(),
  documentValidation: z.boolean(),
  anomalyDetection: z.boolean(),
  plateRecognition: z.boolean(),
});

const NotificationSettingsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  supervisorEmail: z.string().email(),
  supervisorPhone: z.string(),
});

const WatchlistSettingsSchema = z.object({
  enabled: z.boolean(),
  autoFlagHighRisk: z.boolean(),
  retentionDays: z.number().min(1).max(365),
});

const IntegrationSettingsSchema = z.object({
  camera: CameraSettingsSchema,
  ai: AISettingsSchema,
  notifications: NotificationSettingsSchema,
  watchlist: WatchlistSettingsSchema,
});

const WatchlistEntrySchema = z.object({
  type: z.enum(["person", "vehicle", "company"]),
  name: z.string().min(1),
  identifier: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  reason: z.string().min(1),
});

export const checkpointSettingsRouter = router({
  // Get integration settings
  getSettings: protectedProcedure.query(async () => {
    // TODO: Fetch from database
    // For now, return default settings
    return {
      camera: {
        enabled: true,
        resolution: "1280x720",
        facingMode: "user",
      },
      ai: {
        enabled: false,
        claudeApiKey: "",
        faceMatching: false,
        documentValidation: false,
        anomalyDetection: false,
        plateRecognition: false,
      },
      notifications: {
        email: true,
        sms: false,
        supervisorEmail: "supervisor@centre3.com",
        supervisorPhone: "+966501234567",
      },
      watchlist: {
        enabled: true,
        autoFlagHighRisk: true,
        retentionDays: 90,
      },
    };
  }),

  // Update integration settings
  updateSettings: protectedProcedure
    .input(IntegrationSettingsSchema)
    .mutation(async (opts: any) => {
      const input = opts.input;
      // Validate AI settings
      if (input.ai.enabled && !input.ai.claudeApiKey) {
        throw new Error("Claude API key is required when AI is enabled");
      }

      // TODO: Save to database
      console.log("Saving settings:", input);

      return {
        success: true,
        message: "Settings updated successfully",
      };
    }),

  // Get all watchlist entries
  getWatchlist: protectedProcedure.query(async () => {
    // TODO: Fetch from database
    return [];
  }),

  // Add entry to watchlist
  addWatchlistEntry: protectedProcedure
    .input(WatchlistEntrySchema)
    .mutation(async (opts: any) => {
      const input = opts.input;
      // TODO: Save to database
      const id = Math.random().toString(36).substr(2, 9);

      return {
        id,
        ...input,
        addedDate: new Date().toISOString().split("T")[0],
        status: "active",
        incidents: 0,
      };
    }),

  // Update watchlist entry
  updateWatchlistEntry: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...WatchlistEntrySchema.shape,
      })
    )
    .mutation(async (opts: any) => {
      const input = opts.input;
      // TODO: Update in database
      return {
        success: true,
        message: "Watchlist entry updated",
      };
    }),

  // Remove from watchlist
  removeWatchlistEntry: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts: any) => {
      const input = opts.input;
      // TODO: Delete from database
      return {
        success: true,
        message: "Entry removed from watchlist",
      };
    }),

  // Archive watchlist entry
  archiveWatchlistEntry: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts: any) => {
      const input = opts.input;
      // TODO: Update status in database
      return {
        success: true,
        message: "Entry archived",
      };
    }),
});
