import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { 
  securityAlertConfigs, 
  securityAlertTypes,
  securityAlertNotifications,
  securityAlertLogs,
  users,
  groups
} from "../../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Validation schemas
const triggerConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "contains", "greaterThan", "lessThan", "in"]),
  value: z.any(),
});

const viewableBySchema = z.object({
  type: z.enum(["role", "group", "user"]),
  id: z.number(),
  name: z.string(),
});

const actionPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["deny_entry", "alert_supervisor", "call_security", "escalate", "monitor", "log_incident"]),
  conditions: z.any().optional(),
  order: z.number(),
});

const recipientSchema = z.object({
  type: z.enum(["role", "group", "user", "email"]),
  id: z.number().optional(),
  name: z.string(),
  value: z.string(),
});

const messageVariableSchema = z.object({
  name: z.string(),
  placeholder: z.string(),
  description: z.string(),
});

export const alertConfigRouter = router({
  // Get all alert types
  getAlertTypes: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const types = await db.select().from(securityAlertTypes).where(eq(securityAlertTypes.isActive, true));
    return types;
  }),

  // Create new alert type
  createAlertType: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      category: z.enum(["breach", "impact", "status", "view", "action"]),
      severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(securityAlertTypes).values({
        name: input.name,
        description: input.description || null,
        category: input.category,
        severity: input.severity,
        isActive: true,
        isSystem: false,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true, typeId: (result as any).insertId || 0 };
    }),

  // Get all alert configurations
  getConfigs: protectedProcedure
    .input(z.object({
      alertTypeId: z.number().optional(),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { alertTypeId, isActive, limit = 50, offset = 0 } = input || {};
      
      const conditions = [];
      if (alertTypeId) conditions.push(eq(securityAlertConfigs.alertTypeId, alertTypeId));
      if (isActive !== undefined) conditions.push(eq(securityAlertConfigs.isActive, isActive));
      
      const configs = await db
        .select({
          id: securityAlertConfigs.id,
          alertTypeId: securityAlertConfigs.alertTypeId,
          name: securityAlertConfigs.name,
          description: securityAlertConfigs.description,
          impactLevel: securityAlertConfigs.impactLevel,
          statusOnTrigger: securityAlertConfigs.statusOnTrigger,
          isActive: securityAlertConfigs.isActive,
          isEnabled: securityAlertConfigs.isEnabled,
          createdAt: securityAlertConfigs.createdAt,
          updatedAt: securityAlertConfigs.updatedAt,
          createdByName: users.name,
        })
        .from(securityAlertConfigs)
        .leftJoin(users, eq(securityAlertConfigs.createdBy, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(securityAlertConfigs.createdAt))
        .limit(limit)
        .offset(offset);
      
      const countResult = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(securityAlertConfigs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = countResult[0]?.total || 0;
      
      return { configs, total, limit, offset };
    }),

  // Get alert configuration by ID
  getConfigById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const config = await db
        .select()
        .from(securityAlertConfigs)
        .where(eq(securityAlertConfigs.id, input.id));
      
      if (!config[0]) return null;
      
      // Get associated notifications
      const notifications = await db
        .select()
        .from(securityAlertNotifications)
        .where(eq(securityAlertNotifications.alertConfigId, input.id));
      
      return { ...config[0], notifications };
    }),

  // Create new alert configuration
  createConfig: adminProcedure
    .input(z.object({
      alertTypeId: z.number(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      triggerConditions: z.array(triggerConditionSchema),
      impactLevel: z.enum(["low", "medium", "high", "critical"]),
      affectedAreas: z.array(z.string()).optional(),
      statusOnTrigger: z.string().optional(),
      autoResolve: z.boolean().default(false),
      autoResolveAfterMinutes: z.number().optional(),
      viewableBy: z.array(viewableBySchema),
      actionPoints: z.array(actionPointSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(securityAlertConfigs).values({
        alertTypeId: input.alertTypeId,
        name: input.name,
        description: input.description || null,
        triggerConditions: input.triggerConditions as any,
        impactLevel: input.impactLevel,
        affectedAreas: input.affectedAreas as any,
        statusOnTrigger: input.statusOnTrigger || "alert_triggered",
        autoResolve: input.autoResolve,
        autoResolveAfterMinutes: input.autoResolveAfterMinutes || null,
        viewableBy: input.viewableBy as any,
        actionPoints: input.actionPoints as any,
        isActive: true,
        isEnabled: true,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true, configId: (result as any).insertId || 0 };
    }),

  // Update alert configuration
  updateConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      triggerConditions: z.array(triggerConditionSchema).optional(),
      impactLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
      affectedAreas: z.array(z.string()).optional(),
      statusOnTrigger: z.string().optional(),
      autoResolve: z.boolean().optional(),
      autoResolveAfterMinutes: z.number().optional(),
      viewableBy: z.array(viewableBySchema).optional(),
      actionPoints: z.array(actionPointSchema).optional(),
      isActive: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.triggerConditions) updateData.triggerConditions = updates.triggerConditions as any;
      if (updates.impactLevel) updateData.impactLevel = updates.impactLevel;
      if (updates.affectedAreas) updateData.affectedAreas = updates.affectedAreas as any;
      if (updates.statusOnTrigger) updateData.statusOnTrigger = updates.statusOnTrigger;
      if (updates.autoResolve !== undefined) updateData.autoResolve = updates.autoResolve;
      if (updates.autoResolveAfterMinutes) updateData.autoResolveAfterMinutes = updates.autoResolveAfterMinutes;
      if (updates.viewableBy) updateData.viewableBy = updates.viewableBy as any;
      if (updates.actionPoints) updateData.actionPoints = updates.actionPoints as any;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.isEnabled !== undefined) updateData.isEnabled = updates.isEnabled;
      
      await db
        .update(securityAlertConfigs)
        .set(updateData)
        .where(eq(securityAlertConfigs.id, id));
      
      return { success: true };
    }),

  // Delete alert configuration
  deleteConfig: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(securityAlertConfigs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(securityAlertConfigs.id, input.id));
      
      return { success: true };
    }),

  // Create notification rule for alert config
  createNotification: adminProcedure
    .input(z.object({
      alertConfigId: z.number(),
      triggerOn: z.enum(["alert_created", "alert_escalated", "action_taken", "alert_resolved"]),
      channel: z.enum(["email", "sms", "whatsapp", "in_app", "webhook"]),
      recipients: z.array(recipientSchema),
      messageTemplate: z.string().optional(),
      messageVariables: z.array(messageVariableSchema).optional(),
      sendImmediately: z.boolean().default(true),
      delayMinutes: z.number().default(0),
      deduplicateWithin: z.number().optional(),
      escalationLevel: z.number().default(1),
      escalateAfterMinutes: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(securityAlertNotifications).values({
        alertConfigId: input.alertConfigId,
        triggerOn: input.triggerOn,
        channel: input.channel,
        recipients: input.recipients as any,
        messageTemplate: input.messageTemplate || null,
        messageVariables: input.messageVariables as any,
        sendImmediately: input.sendImmediately,
        delayMinutes: input.delayMinutes,
        deduplicateWithin: input.deduplicateWithin || null,
        escalationLevel: input.escalationLevel,
        escalateAfterMinutes: input.escalateAfterMinutes || null,
        isActive: true,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true, notificationId: (result as any).insertId || 0 };
    }),

  // Get notifications for alert config
  getNotifications: protectedProcedure
    .input(z.object({ alertConfigId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const notifications = await db
        .select()
        .from(securityAlertNotifications)
        .where(eq(securityAlertNotifications.alertConfigId, input.alertConfigId));
      
      return notifications;
    }),

  // Update notification rule
  updateNotification: adminProcedure
    .input(z.object({
      id: z.number(),
      triggerOn: z.enum(["alert_created", "alert_escalated", "action_taken", "alert_resolved"]).optional(),
      channel: z.enum(["email", "sms", "whatsapp", "in_app", "webhook"]).optional(),
      recipients: z.array(recipientSchema).optional(),
      messageTemplate: z.string().optional(),
      messageVariables: z.array(messageVariableSchema).optional(),
      sendImmediately: z.boolean().optional(),
      delayMinutes: z.number().optional(),
      deduplicateWithin: z.number().optional(),
      escalationLevel: z.number().optional(),
      escalateAfterMinutes: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (updates.triggerOn) updateData.triggerOn = updates.triggerOn;
      if (updates.channel) updateData.channel = updates.channel;
      if (updates.recipients) updateData.recipients = updates.recipients as any;
      if (updates.messageTemplate) updateData.messageTemplate = updates.messageTemplate;
      if (updates.messageVariables) updateData.messageVariables = updates.messageVariables as any;
      if (updates.sendImmediately !== undefined) updateData.sendImmediately = updates.sendImmediately;
      if (updates.delayMinutes !== undefined) updateData.delayMinutes = updates.delayMinutes;
      if (updates.deduplicateWithin !== undefined) updateData.deduplicateWithin = updates.deduplicateWithin;
      if (updates.escalationLevel !== undefined) updateData.escalationLevel = updates.escalationLevel;
      if (updates.escalateAfterMinutes !== undefined) updateData.escalateAfterMinutes = updates.escalateAfterMinutes;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      await db
        .update(securityAlertNotifications)
        .set(updateData)
        .where(eq(securityAlertNotifications.id, id));
      
      return { success: true };
    }),

  // Delete notification rule
  deleteNotification: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(securityAlertNotifications)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(securityAlertNotifications.id, input.id));
      
      return { success: true };
    }),

  // Get alert logs
  getLogs: protectedProcedure
    .input(z.object({
      alertConfigId: z.number().optional(),
      status: z.enum(["triggered", "acknowledged", "in_progress", "resolved", "escalated"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { alertConfigId, status, limit = 50, offset = 0 } = input || {};
      
      const conditions = [];
      if (alertConfigId) conditions.push(eq(securityAlertLogs.alertConfigId, alertConfigId));
      if (status) conditions.push(eq(securityAlertLogs.status, status));
      
      const logs = await db
        .select()
        .from(securityAlertLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(securityAlertLogs.createdAt))
        .limit(limit)
        .offset(offset);
      
      const countResult = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(securityAlertLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = countResult[0]?.total || 0;
      
      return { logs, total, limit, offset };
    }),
});
