import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { securityAlerts, sites, zones, areas, users } from "../../../drizzle/schema";
import { eq, inArray, and, desc, sql, SQL } from "drizzle-orm";

export const securityAlertsRouter = router({
  // Get all alerts with filtering
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "viewed", "in_progress", "resolved", "false_alarm"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { status, severity, type, limit = 50, offset = 0 } = input || {};
      
      // Build conditions
      const conditions = [];
      if (status) conditions.push(eq(securityAlerts.status, status));
      if (severity) conditions.push(eq(securityAlerts.severity, severity));
      if (type) conditions.push(eq(securityAlerts.type, type as any));
      
      // Get alerts with joins
      const alerts = await db
        .select({
          id: securityAlerts.id,
          title: securityAlerts.title,
          description: securityAlerts.description,
          type: securityAlerts.type,
          severity: securityAlerts.severity,
          status: securityAlerts.status,
          siteId: securityAlerts.siteId,
          siteName: sites.name,
          siteCode: sites.code,
          zoneId: securityAlerts.zoneId,
          zoneName: zones.name,
          zoneCode: zones.code,
          areaId: securityAlerts.zoneId,
          viewedBy: securityAlerts.viewedBy,
          viewedAt: securityAlerts.viewedAt,
          resolvedBy: securityAlerts.resolvedBy,
          resolvedAt: securityAlerts.resolvedAt,
          resolution: securityAlerts.resolution,
          createdAt: securityAlerts.createdAt,
        })
        .from(securityAlerts)
        .leftJoin(sites, eq(securityAlerts.siteId, sites.id))
        .leftJoin(zones, eq(securityAlerts.zoneId, zones.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          // Order by severity priority
          sql`CASE ${securityAlerts.severity}
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END`,
          desc(securityAlerts.createdAt)
        )
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const countResult = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(securityAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = countResult[0]?.total || 0;
      
      return {
        alerts,
        total,
        limit,
        offset,
      };
    }),

  // Get active alerts count by severity
  getActiveCounts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select({
        severity: securityAlerts.severity,
        count: sql<number>`COUNT(*)`,
      })
      .from(securityAlerts)
      .where(inArray(securityAlerts.status, ["new", "viewed", "in_progress"]))
      .groupBy(securityAlerts.severity);
    
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };
    
    result.forEach((row) => {
      counts[row.severity as keyof typeof counts] = Number(row.count);
      counts.total += Number(row.count);
    });
    
    return counts;
  }),

  // Get alert by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .select({
          id: securityAlerts.id,
          title: securityAlerts.title,
          description: securityAlerts.description,
          type: securityAlerts.type,
          severity: securityAlerts.severity,
          status: securityAlerts.status,
          siteId: securityAlerts.siteId,
          siteName: sites.name,
          siteCode: sites.code,
          zoneId: securityAlerts.zoneId,
          zoneName: zones.name,
          zoneCode: zones.code,
          areaId: securityAlerts.zoneId,
          areaName: areas.name,
          viewedBy: securityAlerts.viewedBy,
          viewedByName: users.name,
          viewedAt: securityAlerts.viewedAt,
          resolvedBy: securityAlerts.resolvedBy,
          resolvedByName: users.name,
          resolvedAt: securityAlerts.resolvedAt,
          resolution: securityAlerts.resolution,
          createdAt: securityAlerts.createdAt,
        })
        .from(securityAlerts)
        .leftJoin(sites, eq(securityAlerts.siteId, sites.id))
        .leftJoin(zones, eq(securityAlerts.zoneId, zones.id))
        .leftJoin(areas, eq(securityAlerts.zoneId, areas.id))
        .leftJoin(users, eq(securityAlerts.viewedBy, users.id))
        .where(eq(securityAlerts.id, input.id));
      
      return result[0] || null;
    }),

  // Acknowledge alert
  acknowledge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(securityAlerts)
        .set({
          status: "viewed",
          viewedAt: new Date(),
          viewedBy: ctx.user.id,
        })
        .where(eq(securityAlerts.id, input.id));
      
      return { success: true };
    }),

  // Start investigation
  investigate: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      assignTo: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(securityAlerts)
        .set({
          status: "in_progress",
          viewedBy: input.assignTo || ctx.user.id,
          viewedAt: new Date(),
        })
        .where(eq(securityAlerts.id, input.id));
      
      return { success: true };
    }),

  // Resolve alert
  resolve: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      resolutionNotes: z.string().optional(),
      falseAlarm: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const status = input.falseAlarm ? "false_alarm" : "resolved";
      
      await db
        .update(securityAlerts)
        .set({
          status,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
          resolution: input.resolutionNotes || null,
        })
        .where(eq(securityAlerts.id, input.id));
      
      return { success: true };
    }),

  // Create new alert
  create: protectedProcedure
    .input(z.object({
      type: z.enum(['door_forced', 'unauthorized_access', 'tailgating', 'fire', 'intrusion', 'system_failure', 'manual_trigger']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      title: z.string().min(1),
      description: z.string().optional(),
      siteId: z.number(),
      zoneId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .insert(securityAlerts)
        .values({
          type: input.type as any,
          severity: input.severity as any,
          title: input.title,
          description: input.description || null,
          siteId: input.siteId,
          zoneId: input.zoneId || null,
          status: "new",
          createdAt: new Date(),
        });
      
      return { success: true, alertId: (result as any).insertId || 0 };
    }),

  // Get alert types for dropdown
  getTypes: protectedProcedure.query(async () => {
    return [
      { value: 'door_forced', label: 'Door Forced' },
      { value: 'unauthorized_access', label: 'Unauthorized Access' },
      { value: 'tailgating', label: 'Tailgating' },
      { value: 'fire', label: 'Fire' },
      { value: 'intrusion', label: 'Intrusion' },
      { value: 'system_failure', label: 'System Failure' },
      { value: 'manual_trigger', label: 'Manual Trigger' },
    ];
  }),
});
