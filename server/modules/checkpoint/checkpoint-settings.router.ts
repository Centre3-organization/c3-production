import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import {
  getCheckpointSettings,
  upsertCheckpointSettings,
  getWatchlistEntries,
  addWatchlistEntry,
  updateWatchlistEntry,
  archiveWatchlistEntry,
  getIncidentStats,
} from "../../db/checkpoint-queries";
import { invokeLLM } from "../../_core/llm";

export const checkpointSettingsRouter = router({
  /**
   * Get checkpoint settings
   */
  getSettings: protectedProcedure
    .input(z.object({ checkpointId: z.number() }))
    .query(async ({ input }) => {
      const settings = await getCheckpointSettings(input.checkpointId);
      return settings || {
        checkpointId: input.checkpointId,
        cameraEnabled: true,
        cameraResolution: "1280x720",
        cameraFacingMode: "user",
        aiEnabled: false,
        faceMatchingEnabled: false,
        documentValidationEnabled: false,
        anomalyDetectionEnabled: false,
        plateRecognitionEnabled: false,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        watchlistEnabled: true,
        autoFlagHighRisk: true,
        watchlistRetentionDays: 90,
      };
    }),

  /**
   * Update checkpoint settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        checkpointId: z.number(),
        cameraEnabled: z.boolean().optional(),
        cameraResolution: z.enum(["640x480", "1280x720", "1920x1080"]).optional(),
        cameraFacingMode: z.enum(["user", "environment"]).optional(),
        aiEnabled: z.boolean().optional(),
        claudeApiKey: z.string().optional(),
        faceMatchingEnabled: z.boolean().optional(),
        documentValidationEnabled: z.boolean().optional(),
        anomalyDetectionEnabled: z.boolean().optional(),
        plateRecognitionEnabled: z.boolean().optional(),
        emailNotificationsEnabled: z.boolean().optional(),
        smsNotificationsEnabled: z.boolean().optional(),
        supervisorEmail: z.string().optional(),
        supervisorPhone: z.string().optional(),
        watchlistEnabled: z.boolean().optional(),
        autoFlagHighRisk: z.boolean().optional(),
        watchlistRetentionDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { checkpointId, ...data } = input;

      // Validate Claude API key if AI is being enabled
      if (data.aiEnabled && !data.claudeApiKey) {
        throw new Error("Claude API key is required when AI is enabled");
      }

      await upsertCheckpointSettings(checkpointId, data as any, ctx.user.id);

      return { success: true, message: "Settings updated successfully" };
    }),

  /**
   * Get watchlist entries
   */
  getWatchlist: protectedProcedure
    .input(
      z.object({
        entryType: z.enum(["person", "vehicle", "company"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getWatchlistEntries(input);
    }),

  /**
   * Add to watchlist
   */
  addWatchlistEntry: protectedProcedure
    .input(
      z.object({
        entryType: z.enum(["person", "vehicle", "company"]),
        personName: z.string().optional(),
        idNumber: z.string().optional(),
        idType: z.enum(["national_id", "iqama", "passport", "other"]).optional(),
        vehiclePlate: z.string().optional(),
        vehicleType: z.string().optional(),
        vehicleColor: z.string().optional(),
        companyName: z.string().optional(),
        reason: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        actionRequired: z.enum(["monitor", "deny_entry", "alert_supervisor", "call_security"]),
        sourceType: z.enum(["denial_report", "unregistered_attempt", "fake_pass", "security_incident", "manual_entry"]),
        sourceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await addWatchlistEntry({
        ...input,
        addedBy: ctx.user.id,
      } as any);

      return { success: true, id, message: "Entry added to watchlist" };
    }),

  /**
   * Update watchlist entry
   */
  updateWatchlistEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        actionRequired: z.enum(["monitor", "deny_entry", "alert_supervisor", "call_security"]).optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateWatchlistEntry(id, data as any);
      return { success: true, message: "Entry updated" };
    }),

  /**
   * Archive watchlist entry
   */
  removeWatchlistEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await archiveWatchlistEntry(input.id);
      return { success: true, message: "Entry archived" };
    }),

  /**
   * Validate document with Claude API
   */
  validateDocument: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["national_id", "iqama", "passport"]),
        photoUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Call Claude Vision API for document validation
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert document verification system. Analyze the provided document image and extract key information. Return a JSON response with the following structure:
{
  "documentType": "national_id|iqama|passport",
  "name": "Full name",
  "idNumber": "ID number",
  "nationality": "Nationality",
  "dateOfBirth": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "confidence": 0-100,
  "isValid": true/false,
  "issues": ["list of any issues detected"]
}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please validate this ${input.documentType} document and extract the information.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: input.photoUrl,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "document_validation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  documentType: { type: "string" },
                  name: { type: "string" },
                  idNumber: { type: "string" },
                  nationality: { type: "string" },
                  dateOfBirth: { type: "string" },
                  expiryDate: { type: "string" },
                  confidence: { type: "number" },
                  isValid: { type: "boolean" },
                  issues: { type: "array", items: { type: "string" } },
                },
                required: ["documentType", "name", "idNumber", "confidence", "isValid"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from Claude API");
        }

        const result = typeof content === "string" ? JSON.parse(content) : content;

        return {
          success: true,
          data: result,
          message: "Document validated successfully",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Document validation failed",
          message: "Failed to validate document",
        };
      }
    }),

  /**
   * Get incident statistics
   */
  getIncidentStats: protectedProcedure.query(async () => {
    const stats = await getIncidentStats();
    return stats;
  }),
});
