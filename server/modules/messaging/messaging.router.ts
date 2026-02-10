/**
 * Messaging Router — tRPC procedures for the Integration Hub
 * 
 * Provides CRUD for:
 * - Integrations (provider management)
 * - Message Templates
 * - Trigger Rules
 * - Message Logs (read-only)
 * - Direct send capability
 * - Test connection
 */

import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../infra/db/connection";
import {
  integrations,
  messageTemplates,
  messageTriggerRules,
  messageLogs,
} from "../../../drizzle/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { createProvider, getAvailableProviders } from "./messaging.provider";
import { messagingService, EVENT_TYPES, TEMPLATE_VARIABLES } from "./messaging.service";

// Ensure adapters are registered
import "./twilio.adapter";

const integrationProcedure = protectedProcedure;

export const messagingRouter = router({
  // ============================================================================
  // METADATA
  // ============================================================================

  /** Get available event types for trigger rules */
  getEventTypes: integrationProcedure.query(() => {
    return EVENT_TYPES.map(et => ({
      value: et,
      label: et.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }),

  /** Get available template variables */
  getTemplateVariables: integrationProcedure.query(() => {
    return TEMPLATE_VARIABLES;
  }),

  /** Get available provider types */
  getProviderTypes: integrationProcedure.query(() => {
    const providers = getAvailableProviders();
    return providers.map(slug => {
      const p = createProvider(slug);
      return {
        slug,
        name: p?.name || slug,
        requiredCredentials: p?.getRequiredCredentials() || [],
      };
    });
  }),

  // ============================================================================
  // INTEGRATIONS (PROVIDERS)
  // ============================================================================

  /** List all integrations */
  listIntegrations: integrationProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db.select({
      id: integrations.id,
      name: integrations.name,
      slug: integrations.slug,
      providerType: integrations.providerType,
      description: integrations.description,
      logoUrl: integrations.logoUrl,
      supportsSms: integrations.supportsSms,
      supportsWhatsapp: integrations.supportsWhatsapp,
      supportsEmail: integrations.supportsEmail,
      isEnabled: integrations.isEnabled,
      isDefault: integrations.isDefault,
      lastTestedAt: integrations.lastTestedAt,
      lastTestStatus: integrations.lastTestStatus,
      lastTestError: integrations.lastTestError,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    }).from(integrations).orderBy(desc(integrations.createdAt));

    return result;
  }),

  /** Get a single integration (with masked credentials) */
  getIntegration: integrationProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.select().from(integrations).where(eq(integrations.id, input.id)).limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });

      const integration = result[0];
      // Mask credentials for display
      let maskedCredentials: Record<string, string> = {};
      if (integration.credentials) {
        const creds = JSON.parse(integration.credentials);
        for (const [key, value] of Object.entries(creds)) {
          const strVal = String(value);
          maskedCredentials[key] = strVal.length > 8
            ? strVal.substring(0, 4) + "****" + strVal.substring(strVal.length - 4)
            : "****";
        }
      }

      return { ...integration, credentials: undefined, maskedCredentials };
    }),

  /** Create a new integration */
  createIntegration: integrationProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      providerType: z.string().min(1),
      description: z.string().optional(),
      supportsSms: z.boolean().default(false),
      supportsWhatsapp: z.boolean().default(false),
      supportsEmail: z.boolean().default(false),
      credentials: z.record(z.string(), z.string()).optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check for duplicate slug
      const existing = await db.select().from(integrations).where(eq(integrations.slug, input.slug)).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Integration with this slug already exists" });

      const [result] = await db.insert(integrations).values({
        name: input.name,
        slug: input.slug,
        providerType: input.providerType,
        description: input.description || null,
        supportsSms: input.supportsSms,
        supportsWhatsapp: input.supportsWhatsapp,
        supportsEmail: input.supportsEmail,
        credentials: input.credentials ? JSON.stringify(input.credentials) : null,
        config: input.config ? JSON.stringify(input.config) : null,
        isEnabled: false,
        isDefault: false,
        createdBy: ctx.user?.id,
      });

      return { id: (result as any).insertId, success: true };
    }),

  /** Update an integration */
  updateIntegration: integrationProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      supportsSms: z.boolean().optional(),
      supportsWhatsapp: z.boolean().optional(),
      supportsEmail: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      credentials: z.record(z.string(), z.string()).optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.supportsSms !== undefined) updateData.supportsSms = input.supportsSms;
      if (input.supportsWhatsapp !== undefined) updateData.supportsWhatsapp = input.supportsWhatsapp;
      if (input.supportsEmail !== undefined) updateData.supportsEmail = input.supportsEmail;
      if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;
      if (input.credentials !== undefined) updateData.credentials = JSON.stringify(input.credentials);
      if (input.config !== undefined) updateData.config = JSON.stringify(input.config);

      // If setting as default, unset all others first
      if (input.isDefault === true) {
        await db.update(integrations).set({ isDefault: false });
        updateData.isDefault = true;
      }

      await db.update(integrations).set(updateData).where(eq(integrations.id, input.id));
      return { success: true };
    }),

  /** Delete an integration */
  deleteIntegration: integrationProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(integrations).where(eq(integrations.id, input.id));
      return { success: true };
    }),

  /** Test an integration's connection */
  testIntegration: integrationProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.select().from(integrations).where(eq(integrations.id, input.id)).limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });

      const integration = result[0];
      const provider = createProvider(integration.providerType);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown provider type: ${integration.providerType}` });

      const credentials = integration.credentials ? JSON.parse(integration.credentials) : {};
      provider.initialize(credentials);

      const health = await provider.testConnection();

      // Update test status
      await db.update(integrations).set({
        lastTestedAt: new Date(),
        lastTestStatus: health.healthy ? "success" : "failed",
        lastTestError: health.error || null,
      }).where(eq(integrations.id, input.id));

      return health;
    }),

  /** Send a test message */
  sendTestMessage: integrationProcedure
    .input(z.object({
      integrationId: z.number(),
      channel: z.enum(["sms", "whatsapp"]),
      to: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const integration = await db.select().from(integrations).where(eq(integrations.id, input.integrationId)).limit(1);
      if (!integration[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found" });

      const provider = createProvider(integration[0].providerType);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown provider" });

      const credentials = integration[0].credentials ? JSON.parse(integration[0].credentials) : {};
      provider.initialize(credentials);

      let result;
      if (input.channel === "sms") {
        result = await provider.sendSms({ to: input.to, body: input.body });
      } else {
        result = await provider.sendWhatsApp({ to: input.to, body: input.body });
      }

      // Log the test message
      await db.insert(messageLogs).values({
        eventType: "test_message",
        integrationId: input.integrationId,
        providerType: integration[0].providerType,
        channel: input.channel,
        recipientPhone: input.to,
        messageBody: input.body,
        status: result.success ? "sent" : "failed",
        providerMessageId: result.providerMessageId,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        sentAt: result.success ? new Date() : undefined,
      });

      return result;
    }),

  // ============================================================================
  // MESSAGE TEMPLATES
  // ============================================================================

  /** List all templates */
  listTemplates: integrationProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
  }),

  /** Get a single template */
  getTemplate: integrationProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.select().from(messageTemplates).where(eq(messageTemplates.id, input.id)).limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      return result[0];
    }),

  /** Create a template */
  createTemplate: integrationProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      channel: z.enum(["sms", "whatsapp", "email"]),
      subject: z.string().optional(),
      body: z.string().min(1),
      bodyAr: z.string().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(messageTemplates).values({
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        channel: input.channel,
        subject: input.subject || null,
        body: input.body,
        bodyAr: input.bodyAr || null,
        variables: input.variables ? JSON.stringify(input.variables) : null,
        isActive: true,
        createdBy: ctx.user?.id,
      });

      return { id: (result as any).insertId, success: true };
    }),

  /** Update a template */
  updateTemplate: integrationProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      channel: z.enum(["sms", "whatsapp", "email"]).optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      bodyAr: z.string().optional(),
      variables: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.channel !== undefined) updateData.channel = input.channel;
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.body !== undefined) updateData.body = input.body;
      if (input.bodyAr !== undefined) updateData.bodyAr = input.bodyAr;
      if (input.variables !== undefined) updateData.variables = JSON.stringify(input.variables);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(messageTemplates).set(updateData).where(eq(messageTemplates.id, input.id));
      return { success: true };
    }),

  /** Delete a template */
  deleteTemplate: integrationProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(messageTemplates).where(eq(messageTemplates.id, input.id));
      return { success: true };
    }),

  // ============================================================================
  // TRIGGER RULES
  // ============================================================================

  /** List all trigger rules */
  listTriggerRules: integrationProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const rules = await db.select().from(messageTriggerRules).orderBy(desc(messageTriggerRules.createdAt));
    
    // Enrich with template and integration names
    const templateIds = Array.from(new Set(rules.map(r => r.templateId)));
    const integrationIds = Array.from(new Set(rules.filter(r => r.integrationId).map(r => r.integrationId!)));
    
    let templateMap: Record<number, string> = {};
    let integrationMap: Record<number, string> = {};
    
    if (templateIds.length > 0) {
      const templates = await db.select({ id: messageTemplates.id, name: messageTemplates.name }).from(messageTemplates);
      templateMap = Object.fromEntries(templates.map(t => [t.id, t.name]));
    }
    if (integrationIds.length > 0) {
      const intgs = await db.select({ id: integrations.id, name: integrations.name }).from(integrations);
      integrationMap = Object.fromEntries(intgs.map(i => [i.id, i.name]));
    }

    return rules.map(r => ({
      ...r,
      templateName: templateMap[r.templateId] || "Unknown",
      integrationName: r.integrationId ? (integrationMap[r.integrationId] || "Default") : "Default Provider",
    }));
  }),

  /** Create a trigger rule */
  createTriggerRule: integrationProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      eventType: z.string().min(1),
      templateId: z.number(),
      integrationId: z.number().optional(),
      recipientType: z.enum(["requester", "approver", "host", "visitor", "site_manager", "custom_field", "specific_user", "specific_number"]),
      recipientConfig: z.record(z.string(), z.any()).optional(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.string(),
      })).optional(),
      isEnabled: z.boolean().default(true),
      siteId: z.number().optional(),
      requestTypeSlug: z.string().optional(),
      priority: z.number().default(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(messageTriggerRules).values({
        name: input.name,
        description: input.description || null,
        eventType: input.eventType,
        templateId: input.templateId,
        integrationId: input.integrationId || null,
        recipientType: input.recipientType,
        recipientConfig: input.recipientConfig ? JSON.stringify(input.recipientConfig) : null,
        conditions: input.conditions ? JSON.stringify(input.conditions) : null,
        isEnabled: input.isEnabled,
        siteId: input.siteId || null,
        requestTypeSlug: input.requestTypeSlug || null,
        priority: input.priority,
        createdBy: ctx.user?.id,
      });

      return { id: (result as any).insertId, success: true };
    }),

  /** Update a trigger rule */
  updateTriggerRule: integrationProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      eventType: z.string().optional(),
      templateId: z.number().optional(),
      integrationId: z.number().nullable().optional(),
      recipientType: z.enum(["requester", "approver", "host", "visitor", "site_manager", "custom_field", "specific_user", "specific_number"]).optional(),
      recipientConfig: z.record(z.string(), z.any()).optional(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.string(),
      })).nullable().optional(),
      isEnabled: z.boolean().optional(),
      siteId: z.number().nullable().optional(),
      requestTypeSlug: z.string().nullable().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.templateId !== undefined) updateData.templateId = input.templateId;
      if (input.integrationId !== undefined) updateData.integrationId = input.integrationId;
      if (input.recipientType !== undefined) updateData.recipientType = input.recipientType;
      if (input.recipientConfig !== undefined) updateData.recipientConfig = JSON.stringify(input.recipientConfig);
      if (input.conditions !== undefined) updateData.conditions = input.conditions ? JSON.stringify(input.conditions) : null;
      if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;
      if (input.siteId !== undefined) updateData.siteId = input.siteId;
      if (input.requestTypeSlug !== undefined) updateData.requestTypeSlug = input.requestTypeSlug;
      if (input.priority !== undefined) updateData.priority = input.priority;

      await db.update(messageTriggerRules).set(updateData).where(eq(messageTriggerRules.id, input.id));
      return { success: true };
    }),

  /** Toggle a trigger rule on/off */
  toggleTriggerRule: integrationProcedure
    .input(z.object({ id: z.number(), isEnabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(messageTriggerRules).set({ isEnabled: input.isEnabled }).where(eq(messageTriggerRules.id, input.id));
      return { success: true };
    }),

  /** Delete a trigger rule */
  deleteTriggerRule: integrationProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(messageTriggerRules).where(eq(messageTriggerRules.id, input.id));
      return { success: true };
    }),

  // ============================================================================
  // MESSAGE LOGS
  // ============================================================================

  /** List message logs with pagination */
  listLogs: integrationProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(50),
      channel: z.enum(["sms", "whatsapp", "email"]).optional(),
      status: z.enum(["pending", "sent", "delivered", "failed", "rejected"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.channel) conditions.push(eq(messageLogs.channel, input.channel));
      if (input.status) conditions.push(eq(messageLogs.status, input.status));
      if (input.search) {
        const searchCond = or(
            like(messageLogs.recipientPhone, `%${input.search}%`),
            like(messageLogs.recipientName, `%${input.search}%`),
            like(messageLogs.eventType, `%${input.search}%`)
          );
        if (searchCond) conditions.push(searchCond);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.pageSize;

      const [logs, countResult] = await Promise.all([
        db.select().from(messageLogs)
          .where(whereClause)
          .orderBy(desc(messageLogs.createdAt))
          .limit(input.pageSize)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(whereClause),
      ]);

      return {
        logs,
        total: countResult[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** Get log stats */
  getLogStats: integrationProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [total, sent, failed, today] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(messageLogs),
      db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.status, "sent")),
      db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.status, "failed")),
      db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(
        sql`DATE(${messageLogs.createdAt}) = CURDATE()`
      ),
    ]);

    return {
      totalMessages: total[0]?.count || 0,
      sentMessages: sent[0]?.count || 0,
      failedMessages: failed[0]?.count || 0,
      todayMessages: today[0]?.count || 0,
    };
  }),

  // ============================================================================
  // DIRECT SEND
  // ============================================================================

  /** Send a direct message (not triggered by rules) */
  sendDirect: integrationProcedure
    .input(z.object({
      channel: z.enum(["sms", "whatsapp"]),
      to: z.string().min(1),
      body: z.string().min(1),
      requestId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return messagingService.sendDirect({
        channel: input.channel,
        to: input.to,
        body: input.body,
        requestId: input.requestId,
        userId: ctx.user?.id,
      });
    }),
});
