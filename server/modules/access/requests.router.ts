import { z } from "zod";
import { eq, and, desc, sql, inArray, or, isNull } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { 
  requests, 
  requestZones, 
  requestAssets, 
  approvals,
  sites,
  zones,
  users,
  approvalWorkflows,
  approvalStages,
  approvalInstances,
  approvalTasks,
  approvalHistory,
  workflowConditions,
  stageApprovers,
  requestVisitors,
  requestMaterials,
  requestVehicles
} from "../../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../../_core/trpc";
// Workflow engine functions are defined locally

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
      status: z.enum(["draft", "pending_l1", "pending_manual", "pending_approval", "approved", "rejected", "cancelled", "expired"]).optional(),
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
  
  // Get requests pending approval for current user (using new workflow system)
  getMyPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    // Get tasks assigned to current user that are pending
    const tasks = await db
      .select({
        taskId: approvalTasks.id,
        instanceId: approvalTasks.instanceId,
        stageId: approvalTasks.stageId,
        stageName: approvalStages.stageName,
        stageOrder: approvalStages.stageOrder,
        requestId: approvalInstances.requestId,
        workflowId: approvalInstances.workflowId,
        workflowName: approvalWorkflows.name,
        taskCreatedAt: approvalTasks.createdAt,
      })
      .from(approvalTasks)
      .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
      .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
      .innerJoin(approvalWorkflows, eq(approvalInstances.workflowId, approvalWorkflows.id))
      .where(and(
        eq(approvalTasks.assignedTo, ctx.user.id),
        eq(approvalTasks.status, "pending")
      ))
      .orderBy(desc(approvalTasks.createdAt));
    
    if (tasks.length === 0) return [];
    
    // Get total stages count for each workflow
    const workflowIds = Array.from(new Set(tasks.map(t => t.workflowId)));
    const stageCounts = await db
      .select({
        workflowId: approvalStages.workflowId,
        totalStages: sql<number>`count(*)`.as('totalStages'),
      })
      .from(approvalStages)
      .where(inArray(approvalStages.workflowId, workflowIds))
      .groupBy(approvalStages.workflowId);
    
    const stageCountMap = new Map(stageCounts.map(s => [s.workflowId, Number(s.totalStages)]));
    
    // Get the request details for each task
    const requestIds = Array.from(new Set(tasks.map(t => t.requestId)));
    const requestsData = await db
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
      .where(inArray(requests.id, requestIds));
    
    const requestsMap = new Map(requestsData.map(r => [r.id, r]));
    
    return tasks.map(task => ({
      ...task,
      totalStages: stageCountMap.get(task.workflowId) || 1,
      request: requestsMap.get(task.requestId),
    }));
  }),
  
  // Get approval history for current user
  getMyApprovalHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;
      
      // Get completed tasks (approved or rejected) by current user
      const tasks = await db
        .select({
          taskId: approvalTasks.id,
          instanceId: approvalTasks.instanceId,
          stageId: approvalTasks.stageId,
          stageName: approvalStages.stageName,
          stageOrder: approvalStages.stageOrder,
          requestId: approvalInstances.requestId,
          workflowId: approvalInstances.workflowId,
          workflowName: approvalWorkflows.name,
          taskStatus: approvalTasks.status,
          taskCompletedAt: approvalTasks.decidedAt,
          taskCreatedAt: approvalTasks.createdAt,
        })
        .from(approvalTasks)
        .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
        .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
        .innerJoin(approvalWorkflows, eq(approvalInstances.workflowId, approvalWorkflows.id))
        .where(and(
          eq(approvalTasks.assignedTo, ctx.user.id),
          or(
            eq(approvalTasks.status, "approved"),
            eq(approvalTasks.status, "rejected")
          )
        ))
        .orderBy(desc(approvalTasks.decidedAt))
        .limit(limit)
        .offset(offset);
      
      if (tasks.length === 0) return [];
      
      // Get total stages count for each workflow
      const workflowIds = Array.from(new Set(tasks.map(t => t.workflowId)));
      const stageCounts = await db
        .select({
          workflowId: approvalStages.workflowId,
          totalStages: sql<number>`count(*)`.as('totalStages'),
        })
        .from(approvalStages)
        .where(inArray(approvalStages.workflowId, workflowIds))
        .groupBy(approvalStages.workflowId);
      
      const stageCountMap = new Map(stageCounts.map(s => [s.workflowId, Number(s.totalStages)]));
      
      // Get the request details for each task
      const requestIds = Array.from(new Set(tasks.map(t => t.requestId)));
      const requestsData = await db
        .select({
          id: requests.id,
          requestNumber: requests.requestNumber,
          type: requests.type,
          status: requests.status,
          visitorName: requests.visitorName,
          visitorCompany: requests.visitorCompany,
          purpose: requests.purpose,
          siteId: requests.siteId,
          siteName: sites.name,
          createdAt: requests.createdAt,
        })
        .from(requests)
        .leftJoin(sites, eq(requests.siteId, sites.id))
        .where(inArray(requests.id, requestIds));
      
      const requestsMap = new Map(requestsData.map(r => [r.id, r]));
      
      return tasks.map(task => ({
        ...task,
        totalStages: stageCountMap.get(task.workflowId) || 1,
        request: requestsMap.get(task.requestId),
      }));
    }),
  
  // Get approval statistics for dashboard
  getApprovalStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { pending: 0, completedToday: 0, awaitingOthers: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count pending tasks assigned to current user
    const pendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalTasks)
      .where(and(
        eq(approvalTasks.assignedTo, ctx.user.id),
        eq(approvalTasks.status, "pending")
      ));
    
    // Count tasks completed today by current user
    const completedTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalTasks)
      .where(and(
        eq(approvalTasks.assignedTo, ctx.user.id),
        or(
          eq(approvalTasks.status, "approved"),
          eq(approvalTasks.status, "rejected")
        ),
        sql`DATE(${approvalTasks.decidedAt}) = CURDATE()`
      ));
    
    // Count requests submitted by current user that are awaiting approval
    const awaitingOthersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(
        eq(requests.requestorId, ctx.user.id),
        or(
          eq(requests.status, "pending_l1"),
          eq(requests.status, "pending_manual"),
          eq(requests.status, "pending_approval")
        )
      ));
    
    return {
      pending: Number(pendingResult[0]?.count || 0),
      completedToday: Number(completedTodayResult[0]?.count || 0),
      awaitingOthers: Number(awaitingOthersResult[0]?.count || 0),
    };
  }),
  
  // Get requests pending L1 approval (legacy support + new workflow)
  getPendingL1: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    // Get both legacy pending_l1 requests and new workflow stage 1 requests
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
      .where(or(
        eq(requests.status, "pending_l1"),
        eq(requests.status, "pending_approval")
      ))
      .orderBy(desc(requests.createdAt));
    
    // For new workflow requests, check if user has pending task for stage 1
    const requestIds = result.filter(r => r.status === "pending_approval").map(r => r.id);
    let userTaskRequestIds: number[] = [];
    
    if (requestIds.length > 0) {
      const userTasks = await db
        .select({
          requestId: approvalInstances.requestId,
        })
        .from(approvalTasks)
        .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
        .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
        .where(and(
          inArray(approvalInstances.requestId, requestIds),
          eq(approvalTasks.assignedTo, ctx.user.id),
          eq(approvalTasks.status, "pending"),
          eq(approvalStages.stageOrder, 1)
        ));
      
      userTaskRequestIds = userTasks.map(t => t.requestId);
    }
    
    // Return legacy requests + new workflow requests where user has stage 1 task
    return result.filter(r => 
      r.status === "pending_l1" || 
      (r.status === "pending_approval" && userTaskRequestIds.includes(r.id))
    );
  }),
  
  // Get requests pending manual approval (legacy support + new workflow stage 2)
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
      .where(or(
        eq(requests.status, "pending_manual"),
        eq(requests.status, "pending_approval")
      ))
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
    
    // For new workflow requests, check if user has pending task for stage 2+
    const newWorkflowRequestIds = result.filter(r => r.status === "pending_approval").map(r => r.id);
    let userTaskRequestIds: number[] = [];
    
    if (newWorkflowRequestIds.length > 0) {
      const userTasks = await db
        .select({
          requestId: approvalInstances.requestId,
        })
        .from(approvalTasks)
        .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
        .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
        .where(and(
          inArray(approvalInstances.requestId, newWorkflowRequestIds),
          eq(approvalTasks.assignedTo, ctx.user.id),
          eq(approvalTasks.status, "pending"),
          sql`${approvalStages.stageOrder} >= 2`
        ));
      
      userTaskRequestIds = userTasks.map(t => t.requestId);
    }
    
    // Return legacy requests + new workflow requests where user has stage 2+ task
    return result
      .filter(r => 
        r.status === "pending_manual" || 
        (r.status === "pending_approval" && userTaskRequestIds.includes(r.id))
      )
      .map(r => ({
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
      
      // Get legacy approvals history
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
      
      // Get new workflow history
      const workflowInstance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id))
        .limit(1);
      
      let workflowHistory: any[] = [];
      let currentStage: any = null;
      
      if (workflowInstance.length > 0) {
        const instance = workflowInstance[0];
        
        // Get workflow history
        const historyData = await db
          .select({
            id: approvalHistory.id,
            actionType: approvalHistory.actionType,
            actionBy: approvalHistory.actionBy,
            performedByName: users.name,
            details: approvalHistory.details,
            createdAt: approvalHistory.actionAt,
          })
          .from(approvalHistory)
          .leftJoin(users, eq(approvalHistory.actionBy, users.id))
          .where(eq(approvalHistory.instanceId, instance.id))
          .orderBy(desc(approvalHistory.actionAt));
        
        workflowHistory = historyData;
        
        // Get current stage info
        if (instance.currentStageId) {
          const stageData = await db
            .select()
            .from(approvalStages)
            .where(eq(approvalStages.id, instance.currentStageId))
            .limit(1);
          
          if (stageData.length > 0) {
            currentStage = stageData[0];
          }
        }
      }
      
      // Get access method info from workflow instance
      let accessMethod: {
        entryMethod: string | null;
        qrCodeData: string | null;
        rfidTag: string | null;
        cardNumber: string | null;
        accessGrantedBy: number | null;
        accessGrantedByName: string | null;
        accessGrantedAt: Date | null;
      } | null = null;
      
      if (workflowInstance.length > 0 && workflowInstance[0].status === "approved") {
        const instance = workflowInstance[0];
        let grantedByName: string | null = null;
        
        if (instance.accessGrantedBy) {
          const grantedByUser = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, instance.accessGrantedBy))
            .limit(1);
          grantedByName = grantedByUser[0]?.name || null;
        }
        
        accessMethod = {
          entryMethod: instance.entryMethod,
          qrCodeData: instance.qrCodeData,
          rfidTag: instance.rfidTag,
          cardNumber: instance.cardNumber,
          accessGrantedBy: instance.accessGrantedBy,
          accessGrantedByName: grantedByName,
          accessGrantedAt: instance.accessGrantedAt,
        };
      }
      
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
        workflowHistory,
        currentStage,
        accessMethod,
      };
    }),
  
  // ============================================================================
  // CREATE & UPDATE OPERATIONS
  // ============================================================================
  
  // Create new request
  create: protectedProcedure
    .input(z.object({
      // Legacy fields (for backward compatibility)
      type: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]).optional(),
      visitorName: z.string().min(1).max(100),
      visitorIdType: z.enum(["national_id", "iqama", "passport"]),
      visitorIdNumber: z.string().min(1).max(50),
      visitorCompany: z.string().max(100).optional(),
      visitorPhone: z.string().max(20).optional(),
      visitorEmail: z.string().email().optional().nullable(),
      hostId: z.number().optional(),
      siteId: z.number(),
      purpose: z.string().min(1).max(500),
      startDate: z.string(),
      endDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      zoneIds: z.array(z.number()).optional(),
      assets: z.array(z.object({
        assetType: z.string(),
        description: z.string().optional(),
        serialNumber: z.string().optional(),
        quantity: z.number().default(1),
      })).optional(),
      submitImmediately: z.boolean().default(false),
      
      // Dynamic Request Type System fields
      categoryId: z.number().optional(),
      selectedTypeIds: z.array(z.number()).optional(),
      formData: z.record(z.string(), z.any()).optional(),
      
      // Visitors array (fixes bug: only 1 visitor saved)
      visitors: z.array(z.object({
        fullName: z.string().min(1).max(255),
        idType: z.enum(["national_id", "iqama", "passport"]).optional(),
        idNumber: z.string().min(1).max(50),
        nationality: z.string().max(100).optional(),
        company: z.string().max(255).optional(),
        jobTitle: z.string().max(255).optional(),
        phone: z.string().max(20).optional(),
        email: z.string().email().optional().nullable(),
        isVerified: z.boolean().optional(),
      })).optional(),
      
      // Materials array (for MHV)
      materials: z.array(z.object({
        materialType: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        quantity: z.number().default(1),
        serialNumber: z.string().max(255).optional(),
        unit: z.string().max(50).optional(),
        direction: z.enum(["entry", "exit"]).optional(),
      })).optional(),
      
      // Vehicles array (for VIP/MHV)
      vehicles: z.array(z.object({
        vehicleType: z.string().max(100).optional(),
        plateNumber: z.string().max(50).optional(),
        driverName: z.string().max(255).optional(),
        driverIdNumber: z.string().max(50).optional(),
        driverNationality: z.string().max(100).optional(),
        driverCompany: z.string().max(255).optional(),
        driverPhone: z.string().max(20).optional(),
        purpose: z.string().max(500).optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const requestNumber = generateRequestNumber();
      const status = input.submitImmediately ? "pending_approval" : "draft";
      
      // Determine request type from selectedTypeIds or use legacy type
      let requestType = input.type || "admin_visit";
      if (input.selectedTypeIds && input.selectedTypeIds.length > 0) {
        // Map type IDs to request type (simplified - first type determines main type)
        // In production, you'd look up the type code from the database
        const typeMapping: Record<number, string> = {
          1: "admin_visit",
          2: "tep",
          3: "work_permit",
          4: "mop",
          5: "material_entry", // MHV maps to material_entry
        };
        requestType = (typeMapping[input.selectedTypeIds[0]] as any) || "admin_visit";
      }
      
      // Insert request
      const insertResult = await db.insert(requests).values({
        requestNumber,
        type: requestType,
        status,
        visitorName: input.visitorName,
        visitorIdType: input.visitorIdType,
        visitorIdNumber: input.visitorIdNumber,
        visitorCompany: input.visitorCompany,
        visitorPhone: input.visitorPhone,
        visitorEmail: input.visitorEmail || undefined,
        hostId: input.hostId,
        siteId: input.siteId,
        requestorId: ctx.user.id,
        purpose: input.purpose,
        startDate: new Date(input.startDate).toISOString().split('T')[0],
        endDate: new Date(input.endDate).toISOString().split('T')[0],
        startTime: input.startTime,
        endTime: input.endTime,
        // Dynamic form fields
        categoryId: input.categoryId,
        selectedTypeIds: input.selectedTypeIds,
        formData: input.formData,
      } as any);
      
      const requestId = Number((insertResult as any).insertId || (insertResult as any)[0]?.insertId);
      
      // Insert zones
      if (input.zoneIds && input.zoneIds.length > 0) {
        await db.insert(requestZones).values(
          input.zoneIds.map(zoneId => ({
            requestId,
            zoneId,
          }))
        );
      }
      
      // Insert assets (legacy)
      if (input.assets && input.assets.length > 0) {
        await db.insert(requestAssets).values(
          input.assets.map(asset => ({
            requestId,
            assetType: asset.assetType as "laptop" | "camera" | "tool" | "material" | "other",
            description: asset.description,
            serialNumber: asset.serialNumber,
            quantity: asset.quantity,
          }))
        );
      }
      
      // Insert visitors (new - fixes bug: only 1 visitor saved)
      if (input.visitors && input.visitors.length > 0) {
        await db.insert(requestVisitors).values(
          input.visitors.map((visitor, index) => ({
            requestId,
            visitorIndex: index + 1,
            fullName: visitor.fullName,
            idType: visitor.idType || "national_id",
            idNumber: visitor.idNumber,
            nationality: visitor.nationality,
            company: visitor.company,
            jobTitle: visitor.jobTitle,
            mobile: visitor.phone,
            email: visitor.email || undefined,
            isVerified: visitor.isVerified || false,
          }))
        );
      }
      
      // Insert materials (for MHV)
      if (input.materials && input.materials.length > 0) {
        await db.insert(requestMaterials).values(
          input.materials.map((material, index) => ({
            requestId,
            materialIndex: index + 1,
            direction: material.direction || "entry",
            materialType: material.materialType,
            model: material.description,
            serialNumber: material.serialNumber,
            quantity: material.quantity || 1,
          }))
        );
      }
      
      // Insert vehicles (for VIP/MHV)
      if (input.vehicles && input.vehicles.length > 0) {
        await db.insert(requestVehicles).values(
          input.vehicles.map(vehicle => ({
            requestId,
            driverName: vehicle.driverName,
            driverNationality: vehicle.driverNationality,
            driverId: vehicle.driverIdNumber,
            driverCompany: vehicle.driverCompany,
            driverPhone: vehicle.driverPhone,
            vehiclePlate: vehicle.plateNumber,
            vehicleType: vehicle.vehicleType,
          }))
        );
      }
      
      // If submitting immediately, start the workflow
      if (input.submitImmediately) {
        await startWorkflowForRequest(db, requestId, requestType, input.siteId, ctx.user.id);
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
      
      const request = existing[0];
      
      // Update status to pending_approval (new workflow system)
      await db.update(requests).set({ status: "pending_approval" }).where(eq(requests.id, input.id));
      
      // Start the workflow
      await startWorkflowForRequest(db, input.id, request.type, request.siteId, ctx.user.id);
      
      return { success: true, message: "Request submitted for approval" };
    }),
  
  // ============================================================================
  // NEW WORKFLOW-BASED APPROVAL OPERATIONS
  // ============================================================================
  
  // Approve a task (new workflow system)
  approveTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      comments: z.string().optional(),
      // Entry method for final approval stage
      entryMethod: z.enum(["qr_code", "rfid", "card"]).optional(),
      rfidTag: z.string().max(100).optional(),
      cardNumber: z.string().max(100).optional(),
      // Flag to indicate this is the final approval
      isFinalApproval: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get the task
      const taskData = await db
        .select({
          task: approvalTasks,
          instance: approvalInstances,
          stage: approvalStages,
        })
        .from(approvalTasks)
        .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
        .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
        .where(eq(approvalTasks.id, input.taskId))
        .limit(1);
      
      if (taskData.length === 0) throw new Error("Task not found");
      
      const { task, instance, stage } = taskData[0];
      
      if (task.assignedTo !== ctx.user.id) {
        throw new Error("You are not authorized to approve this task");
      }
      
      if (task.status !== "pending") {
        throw new Error("Task is not pending");
      }
      
      // Update task status
      await db.update(approvalTasks)
        .set({
          status: "approved",
          comments: input.comments
        })
        .where(eq(approvalTasks.id, input.taskId));
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        taskId: task.id,
        actionType: "decision_made",
        actionBy: ctx.user.id,
        details: {
          stageName: stage.stageName,
          stageOrder: stage.stageOrder,
          comments: input.comments,
          entryMethod: input.entryMethod,
          cardNumber: input.cardNumber,
        },
      });
      
      // Check if stage is complete based on approval mode
      const stageComplete = await checkStageCompletion(db, instance.id, stage);
      
      if (stageComplete) {
        // Check if there's a next stage
        const nextStage = await db
          .select()
          .from(approvalStages)
          .where(and(
            eq(approvalStages.workflowId, instance.workflowId),
            sql`${approvalStages.stageOrder} > ${stage.stageOrder}`
          ))
          .orderBy(approvalStages.stageOrder)
          .limit(1);
        
        if (nextStage.length > 0) {
          // Move to next stage
          await db.update(approvalInstances)
            .set({ currentStageId: nextStage[0].id })
            .where(eq(approvalInstances.id, instance.id));
          
          // Create tasks for next stage
          await createTasksForStage(db, instance.id, nextStage[0].id, instance.requestId);
          
          // Record history
          await db.insert(approvalHistory).values({
            instanceId: instance.id,
            actionType: "stage_completed",
            actionBy: ctx.user.id,
            details: {
              previousStatus: stage.stageName,
              newStatus: nextStage[0].stageName,
            },
          });
          
          return { success: true, message: `Approved. Request moved to ${nextStage[0].stageName}` };
        } else {
          // No more stages - request is fully approved
          // Generate QR code data if QR method selected
          let qrCodeData: string | undefined;
          if (input.entryMethod === "qr_code") {
            // Generate unique QR code: REQ-{requestId}-{timestamp}-{random}
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).slice(2, 8);
            qrCodeData = `CENTRE3-${instance.requestId}-${timestamp}-${random}`.toUpperCase();
          }
          
          await db.update(approvalInstances)
            .set({ 
              status: "approved",
              completedAt: new Date(),
              entryMethod: input.entryMethod || null,
              qrCodeData: qrCodeData || null,
              rfidTag: input.rfidTag || null,
              cardNumber: input.cardNumber || null,
              accessGrantedBy: ctx.user.id,
              accessGrantedAt: new Date(),
            })
            .where(eq(approvalInstances.id, instance.id));
          
          await db.update(requests)
            .set({ status: "approved" })
            .where(eq(requests.id, instance.requestId));
          
          // Record history
          await db.insert(approvalHistory).values({
            instanceId: instance.id,
            actionType: "workflow_completed",
            actionBy: ctx.user.id,
            details: { 
              newStatus: "approved",
              entryMethod: input.entryMethod,
              qrCodeData: qrCodeData,
              rfidTag: input.rfidTag,
              cardNumber: input.cardNumber,
            },
          });
          
          return { 
            success: true, 
            message: "Request fully approved",
            entryMethod: input.entryMethod,
            qrCodeData: qrCodeData,
            isFinalApproval: true,
          };
        }
      }
      
      return { success: true, message: "Approval recorded" };
    }),
  
  // Reject a task (new workflow system)
  rejectTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      comments: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get the task
      const taskData = await db
        .select({
          task: approvalTasks,
          instance: approvalInstances,
          stage: approvalStages,
        })
        .from(approvalTasks)
        .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
        .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
        .where(eq(approvalTasks.id, input.taskId))
        .limit(1);
      
      if (taskData.length === 0) throw new Error("Task not found");
      
      const { task, instance, stage } = taskData[0];
      
      if (task.assignedTo !== ctx.user.id) {
        throw new Error("You are not authorized to reject this task");
      }
      
      if (task.status !== "pending") {
        throw new Error("Task is not pending");
      }
      
      // Update task status
      await db.update(approvalTasks)
        .set({
          status: "rejected",
          comments: input.comments
        })
        .where(eq(approvalTasks.id, input.taskId));
      
      // For "any" mode rejection doesn't immediately reject the request
      // For "all" mode, any rejection rejects the request
      if (stage.approvalMode === "all") {
        // Cancel all other pending tasks for this stage
        await db.update(approvalTasks)
          .set({ status: "skipped" })
          .where(and(
            eq(approvalTasks.instanceId, instance.id),
            eq(approvalTasks.stageId, stage.id),
            eq(approvalTasks.status, "pending")
          ));
        
        // Reject the entire request
        await db.update(approvalInstances)
          .set({ 
            status: "rejected"
          })
          .where(eq(approvalInstances.id, instance.id));
        
        await db.update(requests)
          .set({ status: "rejected" })
          .where(eq(requests.id, instance.requestId));
        
        // Record history
        await db.insert(approvalHistory).values({
          instanceId: instance.id,
          taskId: task.id,
          actionType: "workflow_completed",
          actionBy: ctx.user.id,
          details: {
            stageName: stage.stageName,
            comments: input.comments,
          },
        });
        
        return { success: true, message: "Request rejected" };
      }
      
      // For "any" mode, check if all approvers have rejected
      const pendingTasks = await db
        .select({ count: sql<number>`count(*)` })
        .from(approvalTasks)
        .where(and(
          eq(approvalTasks.instanceId, instance.id),
          eq(approvalTasks.stageId, stage.id),
          eq(approvalTasks.status, "pending")
        ));
      
      if (pendingTasks[0].count === 0) {
        // All tasks completed - check if any approved
        const approvedTasks = await db
          .select({ count: sql<number>`count(*)` })
          .from(approvalTasks)
          .where(and(
            eq(approvalTasks.instanceId, instance.id),
            eq(approvalTasks.stageId, stage.id),
            eq(approvalTasks.status, "approved")
          ));
        
        if (approvedTasks[0].count === 0) {
          // All rejected - reject the request
          await db.update(approvalInstances)
            .set({ status: "rejected" })
            .where(eq(approvalInstances.id, instance.id));
          
          await db.update(requests)
            .set({ status: "rejected" })
            .where(eq(requests.id, instance.requestId));
          
          // Record history
          await db.insert(approvalHistory).values({
            instanceId: instance.id,
            actionType: "workflow_completed",
            actionBy: ctx.user.id,
            details: {
              stageName: stage.stageName,
              comments: "All approvers rejected",
            },
          });
          
          return { success: true, message: "Request rejected (all approvers rejected)" };
        }
      }
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        taskId: task.id,
        actionType: "decision_made",
        actionBy: ctx.user.id,
        details: {
          stageName: stage.stageName,
          comments: input.comments,
        },
      });
      
      return { success: true, message: "Rejection recorded" };
    }),
  
  // Update access method for an approved request
  updateAccessMethod: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      entryMethod: z.enum(["qr_code", "rfid", "card"]),
      rfidTag: z.string().max(100).optional(),
      cardNumber: z.string().max(100).optional(),
      regenerateQr: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get the approval instance for this request
      const instance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.requestId))
        .limit(1);
      
      if (instance.length === 0) throw new Error("No approval instance found for this request");
      if (instance[0].status !== "approved") throw new Error("Request is not approved");
      
      // Generate new QR code if requested or if switching to QR method
      let qrCodeData = instance[0].qrCodeData;
      if (input.entryMethod === "qr_code" && (input.regenerateQr || !qrCodeData)) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).slice(2, 8);
        qrCodeData = `CENTRE3-${input.requestId}-${timestamp}-${random}`.toUpperCase();
      }
      
      // Update the instance with new access method
      await db.update(approvalInstances)
        .set({
          entryMethod: input.entryMethod,
          qrCodeData: input.entryMethod === "qr_code" ? qrCodeData || null : null,
          rfidTag: input.entryMethod === "rfid" ? (input.rfidTag || null) : null,
          cardNumber: input.entryMethod === "card" ? (input.cardNumber || null) : null,
          accessGrantedBy: ctx.user.id,
          accessGrantedAt: new Date(),
        })
        .where(eq(approvalInstances.id, instance[0].id));
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance[0].id,
        actionType: "decision_made",
        actionBy: ctx.user.id,
        details: {
          previousStatus: "access_method_updated",
          entryMethod: input.entryMethod,
          qrCodeData: input.entryMethod === "qr_code" && qrCodeData ? qrCodeData : undefined,
          rfidTag: input.entryMethod === "rfid" && input.rfidTag ? input.rfidTag : undefined,
          cardNumber: input.entryMethod === "card" && input.cardNumber ? input.cardNumber : undefined,
        },
      });
      
      return {
        success: true,
        message: "Access method updated",
        entryMethod: input.entryMethod,
        qrCodeData: input.entryMethod === "qr_code" ? qrCodeData : null,
      };
    }),
  
  // ============================================================================
  // LEGACY APPROVAL OPERATIONS (for backward compatibility)
  // ============================================================================
  
  // L1 Approve - moves to pending_manual (legacy)
  approveL1: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      
      // Check if using new workflow system
      const workflowInstance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id))
        .limit(1);
      
      if (workflowInstance.length > 0) {
        // Use new workflow system - find the user's pending task
        const task = await db
          .select()
          .from(approvalTasks)
          .where(and(
            eq(approvalTasks.instanceId, workflowInstance[0].id),
            eq(approvalTasks.assignedTo, ctx.user.id),
            eq(approvalTasks.status, "pending")
          ))
          .limit(1);
        
        if (task.length === 0) {
          throw new Error("No pending approval task found for you");
        }
        
        // Delegate to approveTask
        return await approveTaskInternal(db, task[0].id, ctx.user.id, input.comments);
      }
      
      // Legacy flow
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
  
  // L1 Reject (legacy)
  rejectL1: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      
      // Check if using new workflow system
      const workflowInstance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id))
        .limit(1);
      
      if (workflowInstance.length > 0) {
        // Use new workflow system
        const task = await db
          .select()
          .from(approvalTasks)
          .where(and(
            eq(approvalTasks.instanceId, workflowInstance[0].id),
            eq(approvalTasks.assignedTo, ctx.user.id),
            eq(approvalTasks.status, "pending")
          ))
          .limit(1);
        
        if (task.length === 0) {
          throw new Error("No pending approval task found for you");
        }
        
        return await rejectTaskInternal(db, task[0].id, ctx.user.id, input.comments);
      }
      
      // Legacy flow
      if (existing[0].status !== "pending_l1") throw new Error("Request is not pending L1 approval");
      
      await db.update(requests).set({ status: "rejected" }).where(eq(requests.id, input.id));
      
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
  
  // Manual Approve - final approval (legacy)
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
      
      // Check request exists
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      
      // Check if using new workflow system
      const workflowInstance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id))
        .limit(1);
      
      if (workflowInstance.length > 0) {
        // Use new workflow system
        const task = await db
          .select()
          .from(approvalTasks)
          .where(and(
            eq(approvalTasks.instanceId, workflowInstance[0].id),
            eq(approvalTasks.assignedTo, ctx.user.id),
            eq(approvalTasks.status, "pending")
          ))
          .limit(1);
        
        if (task.length === 0) {
          throw new Error("No pending approval task found for you");
        }
        
        return await approveTaskInternal(db, task[0].id, ctx.user.id, input.comments, input.entryMethod, input.cardNumber);
      }
      
      // Legacy flow
      if (existing[0].status !== "pending_manual") throw new Error("Request is not pending manual approval");
      
      await db.update(requests).set({ status: "approved" }).where(eq(requests.id, input.id));
      
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
  
  // Manual Reject (legacy)
  rejectManual: protectedProcedure
    .input(z.object({
      id: z.number(),
      comments: z.string().min(1, "Rejection reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check request exists
      const existing = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (existing.length === 0) throw new Error("Request not found");
      
      // Check if using new workflow system
      const workflowInstance = await db
        .select()
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id))
        .limit(1);
      
      if (workflowInstance.length > 0) {
        // Use new workflow system
        const task = await db
          .select()
          .from(approvalTasks)
          .where(and(
            eq(approvalTasks.instanceId, workflowInstance[0].id),
            eq(approvalTasks.assignedTo, ctx.user.id),
            eq(approvalTasks.status, "pending")
          ))
          .limit(1);
        
        if (task.length === 0) {
          throw new Error("No pending approval task found for you");
        }
        
        return await rejectTaskInternal(db, task[0].id, ctx.user.id, input.comments);
      }
      
      // Legacy flow
      if (existing[0].status !== "pending_manual") throw new Error("Request is not pending manual approval");
      
      await db.update(requests).set({ status: "rejected" }).where(eq(requests.id, input.id));
      
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
      if (!["draft", "pending_l1", "pending_manual", "pending_approval"].includes(existing[0].status)) {
        throw new Error("Cannot cancel a request that is already processed");
      }
      
      await db.update(requests).set({ status: "cancelled" }).where(eq(requests.id, input.id));
      
      // Cancel any workflow instance
      await db.update(approvalInstances)
        .set({ status: "cancelled" })
        .where(eq(approvalInstances.requestId, input.id));
      
      // Cancel any pending tasks
      const instances = await db
        .select({ id: approvalInstances.id })
        .from(approvalInstances)
        .where(eq(approvalInstances.requestId, input.id));
      
      if (instances.length > 0) {
        await db.update(approvalTasks)
          .set({ status: "skipped" })
          .where(and(
            inArray(approvalTasks.instanceId, instances.map(i => i.id)),
            eq(approvalTasks.status, "pending")
          ));
      }
      
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
      pendingApproval: 0,
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
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
    };
    
    stats.forEach(s => {
      result.totalRequests += Number(s.count);
      if (s.status === "pending_l1") result.pendingL1 = Number(s.count);
      if (s.status === "pending_manual") result.pendingManual = Number(s.count);
      if (s.status === "pending_approval") result.pendingApproval = Number(s.count);
      if (s.status === "approved") result.approved = Number(s.count);
      if (s.status === "rejected") result.rejected = Number(s.count);
    });
    
    return result;
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function startWorkflowForRequest(
  db: any, 
  requestId: number, 
  processType: string, 
  siteId: number | null,
  requestorId: number
) {
  // Find the appropriate workflow
  const workflows = await db
    .select()
    .from(approvalWorkflows)
    .where(and(
      eq(approvalWorkflows.isActive, true),
      or(
        eq(approvalWorkflows.processType, processType as any),
        isNull(approvalWorkflows.processType)
      )
    ))
    .orderBy(desc(approvalWorkflows.priority));
  
  let selectedWorkflow = null;
  
  // Evaluate conditions for each workflow
  for (const workflow of workflows) {
    // Get conditions for this workflow
    const conditions = await db
      .select()
      .from(workflowConditions)
      .where(eq(workflowConditions.workflowId, workflow.id));
    
    if (conditions.length === 0) {
      // No conditions - use if it matches process type or is default
      if (workflow.processType === processType || workflow.isDefault) {
        selectedWorkflow = workflow;
        break;
      }
    } else {
      // Evaluate conditions
      let allMatch = true;
      for (const condition of conditions) {
        if (condition.conditionType === "processType" && condition.conditionValue !== processType) {
          allMatch = false;
          break;
        }
        if (condition.conditionType === "siteId" && siteId && condition.conditionValue !== String(siteId)) {
          allMatch = false;
          break;
        }
        // Add more condition types as needed
      }
      
      if (allMatch) {
        selectedWorkflow = workflow;
        break;
      }
    }
  }
  
  if (!selectedWorkflow) {
    // Create a default workflow instance with basic L1 -> L2 flow
    // For now, just create legacy approval records
    await db.insert(approvals).values({
      requestId,
      stage: "l1",
      status: "pending",
    });
    
    // Update request to use legacy status
    await db.update(requests)
      .set({ status: "pending_l1" })
      .where(eq(requests.id, requestId));
    
    return;
  }
  
  // Get first stage
  const firstStage = await db
    .select()
    .from(approvalStages)
    .where(eq(approvalStages.workflowId, selectedWorkflow.id))
    .orderBy(approvalStages.stageOrder)
    .limit(1);
  
  if (firstStage.length === 0) {
    throw new Error("Workflow has no stages configured");
  }
  
  // Create approval instance
  const instanceResult = await db.insert(approvalInstances).values({
    requestId,
    requestType: processType,
    workflowId: selectedWorkflow.id,
    currentStageId: firstStage[0].id,
    status: "in_progress",
    startedAt: new Date(),
  });
  
  const instanceId = Number((instanceResult as any).insertId || (instanceResult as any)[0]?.insertId);
  
  // Create tasks for first stage
  await createTasksForStage(db, instanceId, firstStage[0].id, requestId);
  
  // Record history
  await db.insert(approvalHistory).values({
    instanceId,
    actionType: "workflow_started",
    actionBy: requestorId,
    details: {
      workflowName: selectedWorkflow.name,
      firstStageName: firstStage[0].name,
    },
  });
}

async function createTasksForStage(db: any, instanceId: number, stageId: number, requestId: number) {
  // Get stage approvers
  const approvers = await db
    .select()
    .from(stageApprovers)
    .where(eq(stageApprovers.stageId, stageId))
    .orderBy(stageApprovers.priority);
  
  if (approvers.length === 0) {
    // No approvers configured - assign to all admins
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    
    for (const admin of admins) {
      await db.insert(approvalTasks).values({
        instanceId,
        stageId,
        assignedTo: admin.id,
          assignedVia: "direct" as const,
        status: "pending",
      });
    }
    return;
  }
  
  // Resolve each approver configuration
  for (const approverConfig of approvers) {
    const resolvedUsers = await resolveApprover(db, approverConfig, requestId);
    
    for (const userId of resolvedUsers) {
      // Check if task already exists for this user
      const existing = await db
        .select()
        .from(approvalTasks)
        .where(and(
          eq(approvalTasks.instanceId, instanceId),
          eq(approvalTasks.stageId, stageId),
          eq(approvalTasks.assignedTo, userId)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(approvalTasks).values({
          instanceId,
          stageId,
          assignedTo: userId,
          assignedVia: "direct" as const,
          status: "pending",
        });
      }
    }
  }
}

async function resolveApprover(db: any, approverConfig: any, requestId: number): Promise<number[]> {
  const userIds: number[] = [];
  
  switch (approverConfig.approverType) {
    case "individual":
      if (approverConfig.approverValue) {
        userIds.push(parseInt(approverConfig.approverValue));
      }
      break;
      
    case "role":
      const roleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, approverConfig.approverValue || "admin"));
      userIds.push(...roleUsers.map((u: any) => u.id));
      break;
      
    case "approval_role":
      // Get users with this approval role
      const { userApprovalRoles } = await import("../../../drizzle/schema");
      const roleAssignments = await db
        .select({ userId: userApprovalRoles.userId })
        .from(userApprovalRoles)
        .where(eq(userApprovalRoles.approvalRoleId, parseInt(approverConfig.approverValue || "0")));
      userIds.push(...roleAssignments.map((r: any) => r.userId));
      break;
      
    case "manager":
      // Get requestor's manager
      const request = await db
        .select({ requestorId: requests.requestorId })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);
      
      if (request.length > 0 && request[0].requestorId) {
        const requestor = await db
          .select({ managerId: users.managerId })
          .from(users)
          .where(eq(users.id, request[0].requestorId))
          .limit(1);
        
        if (requestor.length > 0 && requestor[0].managerId) {
          userIds.push(requestor[0].managerId);
        }
      }
      break;
      
    default:
      // Default to admins
      const defaultAdmins = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));
      userIds.push(...defaultAdmins.map((u: any) => u.id));
  }
  
  return userIds;
}

async function checkStageCompletion(db: any, instanceId: number, stage: any): Promise<boolean> {
  // Get all tasks for this stage
  const tasks = await db
    .select()
    .from(approvalTasks)
    .where(and(
      eq(approvalTasks.instanceId, instanceId),
      eq(approvalTasks.stageId, stage.id)
    ));
  
  const approvedCount = tasks.filter((t: any) => t.status === "approved").length;
  const rejectedCount = tasks.filter((t: any) => t.status === "rejected").length;
  const pendingCount = tasks.filter((t: any) => t.status === "pending").length;
  const totalCount = tasks.length;
  
  switch (stage.approvalMode) {
    case "any":
      // Any single approval completes the stage
      return approvedCount >= 1;
      
    case "all":
      // All must approve
      return approvedCount === totalCount && pendingCount === 0;
      
    case "percentage":
      // Required percentage must approve
      const requiredPercent = stage.requiredApprovals || 100;
      const approvedPercent = (approvedCount / totalCount) * 100;
      return approvedPercent >= requiredPercent;
      
    default:
      return approvedCount >= 1;
  }
}

async function approveTaskInternal(
  db: any, 
  taskId: number, 
  userId: number, 
  comments?: string,
  entryMethod?: string,
  cardNumber?: string
) {
  // Get the task
  const taskData = await db
    .select({
      task: approvalTasks,
      instance: approvalInstances,
      stage: approvalStages,
    })
    .from(approvalTasks)
    .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
    .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
    .where(eq(approvalTasks.id, taskId))
    .limit(1);
  
  if (taskData.length === 0) throw new Error("Task not found");
  
  const { task, instance, stage } = taskData[0];
  
  // Update task status
  await db.update(approvalTasks)
    .set({
      status: "approved",
      comments
    })
    .where(eq(approvalTasks.id, taskId));
  
  // Record history
  await db.insert(approvalHistory).values({
    instanceId: instance.id,
    taskId: task.id,
    actionType: "decision_made",
    actionBy: userId,
    details: {
      stageName: stage.stageName,
      stageOrder: stage.stageOrder,
      comments,
      entryMethod,
      cardNumber,
    },
  });
  
  // Check if stage is complete
  const stageComplete = await checkStageCompletion(db, instance.id, stage);
  
  if (stageComplete) {
    // Check if there's a next stage
    const nextStage = await db
      .select()
      .from(approvalStages)
      .where(and(
        eq(approvalStages.workflowId, instance.workflowId),
        sql`${approvalStages.stageOrder} > ${stage.stageOrder}`
      ))
      .orderBy(approvalStages.stageOrder)
      .limit(1);
    
    if (nextStage.length > 0) {
      // Move to next stage
      await db.update(approvalInstances)
        .set({ currentStageId: nextStage[0].id })
        .where(eq(approvalInstances.id, instance.id));
      
      // Create tasks for next stage
      await createTasksForStage(db, instance.id, nextStage[0].id, instance.requestId);
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        actionType: "stage_completed",
        actionBy: userId,
        details: {
          previousStatus: stage.stageName,
          newStatus: nextStage[0].stageName,
        },
      });
      
      return { success: true, message: `Approved. Request moved to ${nextStage[0].stageName}` };
    } else {
      // No more stages - request is fully approved
      await db.update(approvalInstances)
        .set({ status: "approved" })
        .where(eq(approvalInstances.id, instance.id));
      
      await db.update(requests)
        .set({ status: "approved" })
        .where(eq(requests.id, instance.requestId));
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        actionType: "workflow_completed",
        actionBy: userId,
        details: { newStatus: "approved" },
      });
      
      return { success: true, message: "Request fully approved" };
    }
  }
  
  return { success: true, message: "Approval recorded" };
}

async function rejectTaskInternal(db: any, taskId: number, userId: number, comments: string) {
  // Get the task
  const taskData = await db
    .select({
      task: approvalTasks,
      instance: approvalInstances,
      stage: approvalStages,
    })
    .from(approvalTasks)
    .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
    .innerJoin(approvalStages, eq(approvalTasks.stageId, approvalStages.id))
    .where(eq(approvalTasks.id, taskId))
    .limit(1);
  
  if (taskData.length === 0) throw new Error("Task not found");
  
  const { task, instance, stage } = taskData[0];
  
  // Update task status
  await db.update(approvalTasks)
    .set({
      status: "rejected",
      comments
    })
    .where(eq(approvalTasks.id, taskId));
  
  // For "all" mode, any rejection rejects the request
  if (stage.approvalMode === "all") {
    // Cancel all other pending tasks
    await db.update(approvalTasks)
      .set({ status: "skipped" })
      .where(and(
        eq(approvalTasks.instanceId, instance.id),
        eq(approvalTasks.stageId, stage.id),
        eq(approvalTasks.status, "pending")
      ));
    
    // Reject the entire request
    await db.update(approvalInstances)
      .set({ status: "rejected" })
      .where(eq(approvalInstances.id, instance.id));
    
    await db.update(requests)
      .set({ status: "rejected" })
      .where(eq(requests.id, instance.requestId));
    
    // Record history
    await db.insert(approvalHistory).values({
      instanceId: instance.id,
      taskId: task.id,
      actionType: "workflow_completed",
      actionBy: userId,
      details: {
        stageName: stage.stageName,
        comments: comments,
      },
    });
    
    return { success: true, message: "Request rejected" };
  }
  
  // For "any" mode, check if all approvers have rejected
  const pendingTasks = await db
    .select({ count: sql<number>`count(*)` })
    .from(approvalTasks)
    .where(and(
      eq(approvalTasks.instanceId, instance.id),
      eq(approvalTasks.stageId, stage.id),
      eq(approvalTasks.status, "pending")
    ));
  
  if (pendingTasks[0].count === 0) {
    // All tasks completed - check if any approved
    const approvedTasks = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvalTasks)
      .where(and(
        eq(approvalTasks.instanceId, instance.id),
        eq(approvalTasks.stageId, stage.id),
        eq(approvalTasks.status, "approved")
      ));
    
    if (approvedTasks[0].count === 0) {
      // All rejected - reject the request
      await db.update(approvalInstances)
        .set({ status: "rejected" })
        .where(eq(approvalInstances.id, instance.id));
      
      await db.update(requests)
        .set({ status: "rejected" })
        .where(eq(requests.id, instance.requestId));
      
      // Record history
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        actionType: "workflow_completed",
        actionBy: userId,
        details: {
          stageName: stage.stageName,
          comments: "All approvers rejected",
        },
      });
      
      return { success: true, message: "Request rejected (all approvers rejected)" };
    }
  }
  
  // Record history
  await db.insert(approvalHistory).values({
    instanceId: instance.id,
    taskId: task.id,
    actionType: "decision_made",
    actionBy: userId,
    details: {
      stageName: stage.stageName,
      comments: comments,
    },
  });
  
  return { success: true, message: "Rejection recorded" };
}
