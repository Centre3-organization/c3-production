import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { 
  requests, 
  requestZones, 
  requestAssets, 
  approvals,
  sites,
  zones,
  users
} from "../../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../_core/trpc";

// Generate request number: REQ-YYYYMMDD-XXXXXX (max 20 chars to fit column)
function generateRequestNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  // Use shorter random for guaranteed uniqueness - 6 chars
  const unique = Math.random().toString(36).slice(2, 8);
  return `REQ-${dateStr}-${unique.toUpperCase()}`;
}

export const requestsRouter = router({
  // ============================================================================
  // LIST & GET OPERATIONS
  // ============================================================================
  
  // Get all requests with filters
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "pending_l1", "pending_manual", "approved", "rejected", "cancelled", "expired"]).optional(),
      type: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]).optional(),
      siteId: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { requests: [], total: 0 };
      
      // Build conditions
      const conditions: any[] = [];
      if (input?.status) conditions.push(eq(requests.status, input.status));
      if (input?.type) conditions.push(eq(requests.type, input.type));
      if (input?.siteId) conditions.push(eq(requests.siteId, input.siteId));
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(requests)
        .where(whereClause);
      const total = countResult[0]?.count || 0;
      
      // Get requests with joins
      const result = await db
        .select({
          id: requests.id,
          requestNumber: requests.requestNumber,
          type: requests.type,
          status: requests.status,
          visitorName: requests.visitorName,
          visitorCompany: requests.visitorCompany,
          visitorIdType: requests.visitorIdType,
          visitorIdNumber: requests.visitorIdNumber,
          visitorPhone: requests.visitorPhone,
          visitorEmail: requests.visitorEmail,
          purpose: requests.purpose,
          siteId: requests.siteId,
          siteName: sites.name,
          hostId: requests.hostId,
          requestorId: requests.requestorId,
          startDate: requests.startDate,
          endDate: requests.endDate,
          startTime: requests.startTime,
          endTime: requests.endTime,
          createdAt: requests.createdAt,
          updatedAt: requests.updatedAt,
        })
        .from(requests)
        .leftJoin(sites, eq(requests.siteId, sites.id))
        .where(whereClause)
        .orderBy(desc(requests.createdAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);
      
      return { requests: result, total };
    }),
  
  // Get requests pending L1 approval
  getPendingL1: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        status: requests.status,
        visitorName: requests.visitorName,
        visitorCompany: requests.visitorCompany,
        visitorIdType: requests.visitorIdType,
        visitorIdNumber: requests.visitorIdNumber,
        purpose: requests.purpose,
        siteId: requests.siteId,
        siteName: sites.name,
        startDate: requests.startDate,
        endDate: requests.endDate,
        startTime: requests.startTime,
        endTime: requests.endTime,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .leftJoin(sites, eq(requests.siteId, sites.id))
      .where(eq(requests.status, "pending_l1"))
      .orderBy(desc(requests.createdAt));
    
    return result;
  }),
  
  // Get requests pending manual approval
  getPendingManual: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        status: requests.status,
        visitorName: requests.visitorName,
        visitorCompany: requests.visitorCompany,
        visitorIdType: requests.visitorIdType,
        visitorIdNumber: requests.visitorIdNumber,
        visitorPhone: requests.visitorPhone,
        visitorEmail: requests.visitorEmail,
        purpose: requests.purpose,
        siteId: requests.siteId,
        siteName: sites.name,
        hostId: requests.hostId,
        startDate: requests.startDate,
        endDate: requests.endDate,
        startTime: requests.startTime,
        endTime: requests.endTime,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .leftJoin(sites, eq(requests.siteId, sites.id))
      .where(eq(requests.status, "pending_manual"))
      .orderBy(desc(requests.createdAt));
    
    // Get zones for each request
    const requestIds = result.map(r => r.id);
    let zonesMap: Record<number, any[]> = {};
    
    if (requestIds.length > 0) {
      const requestZonesData = await db
        .select({
          requestId: requestZones.requestId,
          zoneId: requestZones.zoneId,
          zoneName: zones.name,
          zoneCode: zones.code,
          securityLevel: zones.securityLevel,
        })
        .from(requestZones)
        .leftJoin(zones, eq(requestZones.zoneId, zones.id))
        .where(inArray(requestZones.requestId, requestIds));
      
      requestZonesData.forEach(rz => {
        if (!zonesMap[rz.requestId]) zonesMap[rz.requestId] = [];
        zonesMap[rz.requestId].push({
          id: rz.zoneId,
          name: rz.zoneName,
          code: rz.zoneCode,
          securityLevel: rz.securityLevel,
        });
      });
    }
    
    return result.map(r => ({
      ...r,
      zones: zonesMap[r.id] || [],
    }));
  }),
  
  // Get single request by ID with full details
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select({
          id: requests.id,
          requestNumber: requests.requestNumber,
          type: requests.type,
          status: requests.status,
          visitorName: requests.visitorName,
          visitorCompany: requests.visitorCompany,
          visitorIdType: requests.visitorIdType,
          visitorIdNumber: requests.visitorIdNumber,
          visitorPhone: requests.visitorPhone,
          visitorEmail: requests.visitorEmail,
          purpose: requests.purpose,
          siteId: requests.siteId,
          siteName: sites.name,
          hostId: requests.hostId,
          requestorId: requests.requestorId,
          startDate: requests.startDate,
          endDate: requests.endDate,
          startTime: requests.startTime,
          endTime: requests.endTime,
          createdAt: requests.createdAt,
          updatedAt: requests.updatedAt,
        })
        .from(requests)
        .leftJoin(sites, eq(requests.siteId, sites.id))
        .where(eq(requests.id, input.id))
        .limit(1);
      
      if (result.length === 0) return null;
      
      const request = result[0];
      
      // Get zones
      const zonesData = await db
        .select({
          zoneId: requestZones.zoneId,
          zoneName: zones.name,
          zoneCode: zones.code,
          securityLevel: zones.securityLevel,
        })
        .from(requestZones)
        .leftJoin(zones, eq(requestZones.zoneId, zones.id))
        .where(eq(requestZones.requestId, input.id));
      
      // Get assets
      const assetsData = await db
        .select()
        .from(requestAssets)
        .where(eq(requestAssets.requestId, input.id));
      
      // Get approvals history
      const approvalsData = await db
        .select({
          id: approvals.id,
          stage: approvals.stage,
          status: approvals.status,
          approverId: approvals.approverId,
          approverName: users.name,
          comments: approvals.comments,
          entryMethod: approvals.entryMethod,
          cardNumber: approvals.cardNumber,
          approvedAt: approvals.approvedAt,
          createdAt: approvals.createdAt,
        })
        .from(approvals)
        .leftJoin(users, eq(approvals.approverId, users.id))
        .where(eq(approvals.requestId, input.id))
        .orderBy(desc(approvals.createdAt));
      
      return {
        ...request,
        zones: zonesData.map(z => ({
          id: z.zoneId,
          name: z.zoneName,
          code: z.zoneCode,
          securityLevel: z.securityLevel,
        })),
        assets: assetsData,
        approvals: approvalsData,
      };
    }),
  
  // ============================================================================
  // CREATE & UPDATE OPERATIONS
  // ============================================================================
  
  // Create new request
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]),
      visitorName: z.string().min(1).max(100),
      visitorIdType: z.enum(["national_id", "iqama", "passport"]),
      visitorIdNumber: z.string().min(1).max(50),
      visitorCompany: z.string().max(100).optional(),
      visitorPhone: z.string().max(20).optional(),
      visitorEmail: z.string().email().optional(),
      hostId: z.number().optional(),
      siteId: z.number(),
      zoneIds: z.array(z.number()).optional(),
      purpose: z.string().optional(),
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(),
      startTime: z.string().optional(), // HH:MM
      endTime: z.string().optional(),
      assets: z.array(z.object({
        assetType: z.enum(["laptop", "camera", "tool", "material", "other"]),
        description: z.string().max(200).optional(),
        serialNumber: z.string().max(100).optional(),
        quantity: z.number().min(1).default(1),
      })).optional(),
      submitImmediately: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const requestNumber = generateRequestNumber();
      const status = input.submitImmediately ? "pending_l1" : "draft";
      
      // Insert request
      const insertResult = await db.insert(requests).values({
        requestNumber,
        type: input.type,
        status,
        requestorId: ctx.user.id,
        visitorName: input.visitorName,
        visitorIdType: input.visitorIdType,
        visitorIdNumber: input.visitorIdNumber,
        visitorCompany: input.visitorCompany,
        visitorPhone: input.visitorPhone,
        visitorEmail: input.visitorEmail,
        hostId: input.hostId,
        siteId: input.siteId,
        purpose: input.purpose,
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
      });
      
      const requestId = insertResult[0].insertId;
      
      // Insert zones
      if (input.zoneIds && input.zoneIds.length > 0) {
        await db.insert(requestZones).values(
          input.zoneIds.map(zoneId => ({
            requestId,
            zoneId,
          }))
        );
      }
      
      // Insert assets
      if (input.assets && input.assets.length > 0) {
        await db.insert(requestAssets).values(
          input.assets.map(asset => ({
            requestId,
            assetType: asset.assetType,
            description: asset.description,
            serialNumber: asset.serialNumber,
            quantity: asset.quantity,
          }))
        );
      }
      
      // Create initial approval record if submitted
      if (input.submitImmediately) {
        await db.insert(approvals).values({
          requestId,
          stage: "l1",
          status: "pending",
        });
      }
      
      // Fetch the created request
      const created = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
      return created[0];
    }),
  
  // Submit draft request for approval
  submit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists and is draft
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      if (existing[0].status !== "draft") throw new Error("Only draft requests can be submitted");
      
      // Update status
      await db.update(requests).set({ status: "pending_l1" }).where(eq(requests.id, input.id));
      
      // Create L1 approval record
      await db.insert(approvals).values({
        requestId: input.id,
        stage: "l1",
        status: "pending",
      });
      
      return { success: true, message: "Request submitted for L1 approval" };
    }),
  
  // ============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ============================================================================
  
  // L1 Approve - moves to pending_manual
  approveL1: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists and is pending_l1
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      if (existing[0].status !== "pending_l1") throw new Error("Request is not pending L1 approval");
      
      // Update request status
      await db.update(requests).set({ status: "pending_manual" }).where(eq(requests.id, input.id));
      
      // Update L1 approval record
      await db.update(approvals)
        .set({ 
          status: "approved", 
          approverId: ctx.user.id,
          comments: input.comments,
          approvedAt: new Date(),
        })
        .where(and(
          eq(approvals.requestId, input.id),
          eq(approvals.stage, "l1")
        ));
      
      // Create manual approval record
      await db.insert(approvals).values({
        requestId: input.id,
        stage: "manual",
        status: "pending",
      });
      
      return { success: true, message: "L1 approval granted, moved to manual approval" };
    }),
  
  // L1 Reject
  rejectL1: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists and is pending_l1
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      if (existing[0].status !== "pending_l1") throw new Error("Request is not pending L1 approval");
      
      // Update request status
      await db.update(requests).set({ status: "rejected" }).where(eq(requests.id, input.id));
      
      // Update L1 approval record
      await db.update(approvals)
        .set({ 
          status: "rejected", 
          approverId: ctx.user.id,
          comments: input.comments,
          approvedAt: new Date(),
        })
        .where(and(
          eq(approvals.requestId, input.id),
          eq(approvals.stage, "l1")
        ));
      
      return { success: true, message: "Request rejected at L1" };
    }),
  
  // Manual Approve - final approval
  approveManual: protectedProcedure
    .input(z.object({
      id: z.number(),
      entryMethod: z.enum(["manual", "rfid", "card"]).optional(),
      cardNumber: z.string().max(50).optional(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists and is pending_manual
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      if (existing[0].status !== "pending_manual") throw new Error("Request is not pending manual approval");
      
      // Update request status to approved
      await db.update(requests).set({ status: "approved" }).where(eq(requests.id, input.id));
      
      // Update manual approval record
      await db.update(approvals)
        .set({ 
          status: "approved", 
          approverId: ctx.user.id,
          comments: input.comments,
          entryMethod: input.entryMethod,
          cardNumber: input.cardNumber,
          approvedAt: new Date(),
        })
        .where(and(
          eq(approvals.requestId, input.id),
          eq(approvals.stage, "manual")
        ));
      
      return { success: true, message: "Request fully approved" };
    }),
  
  // Manual Reject
  rejectManual: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists and is pending_manual
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      if (existing[0].status !== "pending_manual") throw new Error("Request is not pending manual approval");
      
      // Update request status
      await db.update(requests).set({ status: "rejected" }).where(eq(requests.id, input.id));
      
      // Update manual approval record
      await db.update(approvals)
        .set({ 
          status: "rejected", 
          approverId: ctx.user.id,
          comments: input.comments,
          approvedAt: new Date(),
        })
        .where(and(
          eq(approvals.requestId, input.id),
          eq(approvals.stage, "manual")
        ));
      
      return { success: true, message: "Request rejected at manual approval" };
    }),
  
  // Cancel request (only by requestor or admin)
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      
      // Only allow cancellation of draft or pending requests
      if (!["draft", "pending_l1", "pending_manual"].includes(existing[0].status)) {
        throw new Error("Cannot cancel a request that is already processed");
      }
      
      await db.update(requests).set({ status: "cancelled" }).where(eq(requests.id, input.id));
      
      return { success: true, message: "Request cancelled" };
    }),
  
  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================
  
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return {
      totalRequests: 0,
      pendingL1: 0,
      pendingManual: 0,
      approved: 0,
      rejected: 0,
    };
    
    const stats = await db
      .select({
        status: requests.status,
        count: sql<number>`count(*)`,
      })
      .from(requests)
      .groupBy(requests.status);
    
    const result = {
      totalRequests: 0,
      pendingL1: 0,
      pendingManual: 0,
      approved: 0,
      rejected: 0,
    };
    
    stats.forEach(s => {
      result.totalRequests += Number(s.count);
      if (s.status === "pending_l1") result.pendingL1 = Number(s.count);
      if (s.status === "pending_manual") result.pendingManual = Number(s.count);
      if (s.status === "approved") result.approved = Number(s.count);
      if (s.status === "rejected") result.rejected = Number(s.count);
    });
    
    return result;
  }),
});
