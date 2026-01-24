import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { sql } from "drizzle-orm";

export const securityAlertsRouter = router({
  // Get all alerts with filtering
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "acknowledged", "investigating", "resolved", "false_alarm"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { status, severity, type, limit = 50, offset = 0 } = input || {};
      
      // Build dynamic query using template literals
      const [alerts] = await db.execute(sql`
        SELECT 
          sa.*,
          s.name as site_name,
          s.code as site_code,
          z.name as zone_name,
          z.code as zone_code
        FROM security_alerts sa
        LEFT JOIN sites s ON sa.site_id = s.id
        LEFT JOIN zones z ON sa.zone_id = z.id
        WHERE 1=1
        ORDER BY 
          CASE sa.severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          sa.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as unknown as [any[], any];
      
      // Get total count
      const [countResult] = await db.execute(sql`
        SELECT COUNT(*) as total FROM security_alerts
      `) as unknown as [any[], any];
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
    
    const [result] = await db.execute(sql`
      SELECT 
        severity,
        COUNT(*) as count
      FROM security_alerts 
      WHERE status IN ('active', 'acknowledged', 'investigating')
      GROUP BY severity
    `) as unknown as [any[], any];
    
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    };
    
    result.forEach((row: any) => {
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
      
      const [result] = await db.execute(sql`
        SELECT 
          sa.*,
          s.name as site_name,
          s.code as site_code,
          z.name as zone_name,
          z.code as zone_code,
          a.name as area_name,
          assigned.name as assigned_to_name,
          ack.name as acknowledged_by_name,
          res.name as resolved_by_name
        FROM security_alerts sa
        LEFT JOIN sites s ON sa.site_id = s.id
        LEFT JOIN zones z ON sa.zone_id = z.id
        LEFT JOIN areas a ON sa.area_id = a.id
        LEFT JOIN users assigned ON sa.assigned_to = assigned.id
        LEFT JOIN users ack ON sa.acknowledged_by = ack.id
        LEFT JOIN users res ON sa.resolved_by = res.id
        WHERE sa.id = ${input.id}
      `) as unknown as [any[], any];
      
      return result[0] || null;
    }),

  // Acknowledge alert
  acknowledge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.execute(sql`
        UPDATE security_alerts 
        SET 
          status = 'acknowledged',
          acknowledged_at = NOW(),
          acknowledged_by = ${ctx.user.id},
          updated_at = NOW()
        WHERE id = ${input.id}
      `);
      
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
      
      await db.execute(sql`
        UPDATE security_alerts 
        SET 
          status = 'investigating',
          assigned_to = ${input.assignTo || ctx.user.id},
          updated_at = NOW()
        WHERE id = ${input.id}
      `);
      
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
      
      const status = input.falseAlarm ? 'false_alarm' : 'resolved';
      
      await db.execute(sql`
        UPDATE security_alerts 
        SET 
          status = ${status},
          resolved_at = NOW(),
          resolved_by = ${ctx.user.id},
          resolution_notes = ${input.resolutionNotes || null},
          updated_at = NOW()
        WHERE id = ${input.id}
      `);
      
      return { success: true };
    }),

  // Create new alert
  create: protectedProcedure
    .input(z.object({
      type: z.enum(['unauthorized_access', 'tailgating', 'forced_entry', 'door_held_open', 'perimeter_breach', 'suspicious_activity', 'equipment_tamper', 'fire_alarm', 'medical_emergency', 'other']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      title: z.string().min(1),
      description: z.string().optional(),
      siteId: z.number().optional(),
      zoneId: z.number().optional(),
      areaId: z.number().optional(),
      triggeredBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Generate alert number
      const [countResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM security_alerts WHERE YEAR(created_at) = YEAR(NOW())
      `) as unknown as [any[], any];
      const count = (countResult[0]?.count || 0) + 1;
      const alertNumber = `ALT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
      
      await db.execute(sql`
        INSERT INTO security_alerts (
          alert_number, type, severity, status, title, description,
          site_id, zone_id, area_id, triggered_by, created_at
        ) VALUES (
          ${alertNumber}, ${input.type}, ${input.severity}, 'active', ${input.title},
          ${input.description || null}, ${input.siteId || null}, ${input.zoneId || null},
          ${input.areaId || null}, ${input.triggeredBy || null}, NOW()
        )
      `);
      
      return { success: true, alertNumber };
    }),

  // Get alert types for dropdown
  getTypes: protectedProcedure.query(async () => {
    return [
      { value: 'unauthorized_access', label: 'Unauthorized Access' },
      { value: 'tailgating', label: 'Tailgating' },
      { value: 'forced_entry', label: 'Forced Entry' },
      { value: 'door_held_open', label: 'Door Held Open' },
      { value: 'perimeter_breach', label: 'Perimeter Breach' },
      { value: 'suspicious_activity', label: 'Suspicious Activity' },
      { value: 'equipment_tamper', label: 'Equipment Tamper' },
      { value: 'fire_alarm', label: 'Fire Alarm' },
      { value: 'medical_emergency', label: 'Medical Emergency' },
      { value: 'other', label: 'Other' },
    ];
  }),
});
