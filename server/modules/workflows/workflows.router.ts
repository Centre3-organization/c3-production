/**
 * Workflows Router
 * 
 * Main router for the Dynamic Approval Workflow Module
 * Combines workflow management and delegations
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  approvalWorkflows,
  workflowConditions,
  approvalStages,
  stageApprovers,
  escalationRules,
  approvalRoles,
  userApprovalRoles,
  approvalInstances,
  approvalTasks,
  approvalHistory,
  users,
} from "../../../drizzle/schema";
import { delegationsRouter } from "./delegations.router";
import {
  startWorkflow,
  processApprovalDecision,
  getApprovalStatus,
  getPendingTasksForUser,
  listWorkflows,
  getWorkflowDetails,
  RequestContext,
  processSendBack,
  processClarificationResponse,
  getSendBackHistory,
  SendBackTarget,
} from "./workflow-engine";

export const workflowsRouter = router({
  // Sub-routers
  delegations: delegationsRouter,

  // ============================================
  // WORKFLOW MANAGEMENT
  // ============================================

  // List all workflows
  list: protectedProcedure
    .input(z.object({
      processType: z.string().optional(),
      includeInactive: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions = [];
      
      if (!input?.includeInactive) {
        conditions.push(eq(approvalWorkflows.isActive, true));
      }

      if (input?.processType) {
        conditions.push(eq(approvalWorkflows.processType, input.processType as any));
      }

      const workflows = await db
        .select()
        .from(approvalWorkflows)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(approvalWorkflows.priority));

      return workflows;
    }),

  // Get workflow details with stages and conditions
  getDetails: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ input }) => {
      return await getWorkflowDetails(input.workflowId);
    }),

  // Create a new workflow
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      processType: z.enum([
        "admin_visit",
        "work_permit",
        "material_entry",
        "tep",
        "mop",
        "escort",
        "mcm",
        "tdp",
        "mhv",
      ]).optional(),
      priority: z.number().optional().default(0),
      isDefault: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check for duplicate workflow name
      const existingWorkflow = await db
        .select({ id: approvalWorkflows.id })
        .from(approvalWorkflows)
        .where(eq(approvalWorkflows.name, input.name))
        .limit(1);

      if (existingWorkflow.length > 0) {
        throw new Error(`A workflow with the name "${input.name}" already exists. Please choose a different name.`);
      }

      // If setting as default, unset other defaults for the process type
      if (input.isDefault && input.processType) {
        await db
          .update(approvalWorkflows)
          .set({ isDefault: false })
          .where(eq(approvalWorkflows.processType, input.processType));
      }

      const [result] = await db.insert(approvalWorkflows).values({
        name: input.name,
        description: input.description,
        processType: input.processType,
        priority: input.priority,
        isDefault: input.isDefault,
        createdBy: ctx.user.id,
      });

      return { id: Number(result.insertId) };
    }),

  // Update a workflow
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      priority: z.number().optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        const [workflow] = await db
          .select({ processType: approvalWorkflows.processType })
          .from(approvalWorkflows)
          .where(eq(approvalWorkflows.id, id));

        if (workflow?.processType) {
          await db
            .update(approvalWorkflows)
            .set({ isDefault: false })
            .where(eq(approvalWorkflows.processType, workflow.processType));
        }
      }

      await db
        .update(approvalWorkflows)
        .set(updates)
        .where(eq(approvalWorkflows.id, id));

      return { success: true };
    }),

  // Delete a workflow (hard delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // First delete related records
      // Delete stage approvers for stages in this workflow
      const stages = await db
        .select({ id: approvalStages.id })
        .from(approvalStages)
        .where(eq(approvalStages.workflowId, input.id));
      
      const stageIds = stages.map(s => s.id);
      if (stageIds.length > 0) {
        for (const stageId of stageIds) {
          await db.delete(stageApprovers).where(eq(stageApprovers.stageId, stageId));
          await db.delete(escalationRules).where(eq(escalationRules.stageId, stageId));
        }
      }
      
      // Delete stages
      await db.delete(approvalStages).where(eq(approvalStages.workflowId, input.id));
      
      // Delete conditions
      await db.delete(workflowConditions).where(eq(workflowConditions.workflowId, input.id));
      
      // Delete the workflow
      await db.delete(approvalWorkflows).where(eq(approvalWorkflows.id, input.id));

      return { success: true };
    }),

  // ============================================
  // WORKFLOW STAGES
  // ============================================

  // Add a stage to a workflow
  addStage: adminProcedure
    .input(z.object({
      workflowId: z.number(),
      stageName: z.string().min(1),
      stageType: z.enum([
        "individual",
        "role",
        "group",
        "group_hierarchy",
        "dynamic_field",
        "shift_based",
        "manager",
        "external_manager",
        "site_manager",
        "zone_owner",
        "custom_resolver",
      ]),
      approvalMode: z.enum(["any", "all", "percentage"]).optional().default("any"),
      requiredApprovals: z.number().optional().default(1),
      approvalPercentage: z.number().optional(),
      canReject: z.boolean().optional().default(true),
      canRequestInfo: z.boolean().optional().default(true),
      slaHours: z.number().optional(),
      autoApproveOnSla: z.boolean().optional().default(false),
      autoRejectOnSla: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the next stage order
      const existingStages = await db
        .select({ stageOrder: approvalStages.stageOrder })
        .from(approvalStages)
        .where(eq(approvalStages.workflowId, input.workflowId))
        .orderBy(desc(approvalStages.stageOrder))
        .limit(1);

      const nextOrder = (existingStages[0]?.stageOrder || 0) + 1;

      const [result] = await db.insert(approvalStages).values({
        workflowId: input.workflowId,
        stageOrder: nextOrder,
        stageName: input.stageName,
        stageType: input.stageType,
        approvalMode: input.approvalMode,
        requiredApprovals: input.requiredApprovals,
        approvalPercentage: input.approvalPercentage,
        canReject: input.canReject,
        canRequestInfo: input.canRequestInfo,
        slaHours: input.slaHours,
        autoApproveOnSla: input.autoApproveOnSla,
        autoRejectOnSla: input.autoRejectOnSla,
      });

      return { id: Number(result.insertId), stageOrder: nextOrder };
    }),

  // Update a stage
  updateStage: adminProcedure
    .input(z.object({
      id: z.number(),
      stageName: z.string().min(1).optional(),
      stageType: z.enum([
        "individual",
        "role",
        "group",
        "group_hierarchy",
        "dynamic_field",
        "shift_based",
        "manager",
        "external_manager",
        "site_manager",
        "zone_owner",
        "custom_resolver",
      ]).optional(),
      approvalMode: z.enum(["any", "all", "percentage"]).optional(),
      requiredApprovals: z.number().optional(),
      approvalPercentage: z.number().optional(),
      canReject: z.boolean().optional(),
      canRequestInfo: z.boolean().optional(),
      slaHours: z.number().optional(),
      autoApproveOnSla: z.boolean().optional(),
      autoRejectOnSla: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db
        .update(approvalStages)
        .set(updates)
        .where(eq(approvalStages.id, id));

      return { success: true };
    }),

  // Delete a stage
  deleteStage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete approvers first
      await db
        .delete(stageApprovers)
        .where(eq(stageApprovers.stageId, input.id));

      // Delete escalation rules
      await db
        .delete(escalationRules)
        .where(eq(escalationRules.stageId, input.id));

      // Delete the stage
      await db
        .delete(approvalStages)
        .where(eq(approvalStages.id, input.id));

      return { success: true };
    }),

  // Reorder stages
  reorderStages: adminProcedure
    .input(z.object({
      workflowId: z.number(),
      stageIds: z.array(z.number()), // Ordered list of stage IDs
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      for (let i = 0; i < input.stageIds.length; i++) {
        await db
          .update(approvalStages)
          .set({ stageOrder: i + 1 })
          .where(eq(approvalStages.id, input.stageIds[i]));
      }

      return { success: true };
    }),

  // ============================================
  // STAGE APPROVERS
  // ============================================

  // Add approver to a stage
  addApprover: adminProcedure
    .input(z.object({
      stageId: z.number(),
      approverType: z.enum([
        "user",
        "role",
        "approval_role",
        "group",
        "group_role",
        "hierarchy_level",
        "dynamic_field",
        "shift_assignment",
        "manager_chain",
      ]),
      approverReference: z.string().optional(),
      approverConfig: z.record(z.string(), z.any()).optional(),
      priority: z.number().optional().default(0),
      isBackup: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(stageApprovers).values({
        stageId: input.stageId,
        approverType: input.approverType,
        approverReference: input.approverReference,
        approverConfig: input.approverConfig,
        priority: input.priority,
        isBackup: input.isBackup,
      });

      return { id: Number(result.insertId) };
    }),

  // Remove approver from a stage
  removeApprover: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(stageApprovers)
        .where(eq(stageApprovers.id, input.id));

      return { success: true };
    }),

  // ============================================
  // WORKFLOW CONDITIONS
  // ============================================

  // Add condition to a workflow
  addCondition: adminProcedure
    .input(z.object({
      workflowId: z.number(),
      conditionType: z.enum([
        "process_type",
        "category",
        "sub_category",
        "site_id",
        "region",
        "zone_id",
        "area_id",
        "requester_group",
        "requester_type",
        "requester_department",
        "requester_role",
        "activity_risk",
        "has_mop",
        "has_mhv",
        "visitor_count",
        "time_range",
        "request_duration",
        "vip_visit",
        "working_hours",
        "shift_id",
        "day_of_week",
        "escort_required",
        "access_level",
      ]),
      conditionOperator: z.enum([
        "equals",
        "not_equals",
        "in",
        "not_in",
        "greater_than",
        "less_than",
        "between",
        "contains",
        "starts_with",
        "is_null",
        "is_not_null",
      ]),
      conditionValue: z.any(),
      logicalGroup: z.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(workflowConditions).values({
        workflowId: input.workflowId,
        conditionType: input.conditionType,
        conditionOperator: input.conditionOperator,
        conditionValue: input.conditionValue,
        logicalGroup: input.logicalGroup,
      });

      return { id: Number(result.insertId) };
    }),

  // Remove condition from a workflow
  removeCondition: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(workflowConditions)
        .where(eq(workflowConditions.id, input.id));

      return { success: true };
    }),

  // ============================================
  // ESCALATION RULES
  // ============================================

  // Add escalation rule to a stage
  addEscalationRule: adminProcedure
    .input(z.object({
      stageId: z.number(),
      triggerType: z.enum(["no_response", "sla_warning", "sla_breach"]),
      triggerValue: z.number(), // Hours for no_response, percentage for sla_warning
      actionType: z.enum([
        "notify_approver",
        "notify_escalation",
        "notify_admin",
        "add_approver",
        "replace_approver",
        "escalate_stage",
        "auto_approve",
        "auto_reject",
      ]),
      actionConfig: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get next escalation order
      const existing = await db
        .select({ escalationOrder: escalationRules.escalationOrder })
        .from(escalationRules)
        .where(eq(escalationRules.stageId, input.stageId))
        .orderBy(desc(escalationRules.escalationOrder))
        .limit(1);

      const nextOrder = (existing[0]?.escalationOrder || 0) + 1;

      const [result] = await db.insert(escalationRules).values({
        stageId: input.stageId,
        escalationOrder: nextOrder,
        triggerType: input.triggerType,
        triggerValue: input.triggerValue,
        actionType: input.actionType,
        actionConfig: input.actionConfig,
      });

      return { id: Number(result.insertId) };
    }),

  // Remove escalation rule
  removeEscalationRule: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(escalationRules)
        .where(eq(escalationRules.id, input.id));

      return { success: true };
    }),

  // ============================================
  // APPROVAL ROLES
  // ============================================

  // List approval roles
  listApprovalRoles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(approvalRoles)
      .where(eq(approvalRoles.isActive, true))
      .orderBy(asc(approvalRoles.level), asc(approvalRoles.name));
  }),

  // Assign approval role to user
  assignApprovalRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      approvalRoleId: z.number(),
      siteIds: z.array(z.number()).optional(),
      regionIds: z.array(z.string()).optional(),
      isPrimary: z.boolean().optional().default(true),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(userApprovalRoles).values({
        userId: input.userId,
        approvalRoleId: input.approvalRoleId,
        siteIds: input.siteIds || null,
        regionIds: input.regionIds || null,
        isPrimary: input.isPrimary,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      });

      return { id: Number(result.insertId) };
    }),

  // Remove approval role from user
  removeApprovalRole: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(userApprovalRoles)
        .set({ isActive: false })
        .where(eq(userApprovalRoles.id, input.id));

      return { success: true };
    }),

  // Get user's approval roles
  getUserApprovalRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select({
          id: userApprovalRoles.id,
          roleId: approvalRoles.id,
          roleCode: approvalRoles.code,
          roleName: approvalRoles.name,
          roleLevel: approvalRoles.level,
          siteIds: userApprovalRoles.siteIds,
          regionIds: userApprovalRoles.regionIds,
          isPrimary: userApprovalRoles.isPrimary,
          validFrom: userApprovalRoles.validFrom,
          validUntil: userApprovalRoles.validUntil,
          isActive: userApprovalRoles.isActive,
        })
        .from(userApprovalRoles)
        .innerJoin(approvalRoles, eq(approvalRoles.id, userApprovalRoles.approvalRoleId))
        .where(
          and(
            eq(userApprovalRoles.userId, input.userId),
            eq(userApprovalRoles.isActive, true)
          )
        );
    }),

  // ============================================
  // WORKFLOW EXECUTION
  // ============================================

  // Start a workflow for a request
  startWorkflow: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      requestType: z.string(),
      processType: z.string().optional(),
      category: z.string().optional(),
      subCategory: z.string().optional(),
      siteId: z.number().optional(),
      region: z.string().optional(),
      zoneId: z.number().optional(),
      requesterGroupId: z.number().optional(),
      requesterType: z.enum(["internal", "external"]).optional(),
      activityRisk: z.enum(["low", "medium", "high", "critical"]).optional(),
      hasMop: z.boolean().optional(),
      hasMhv: z.boolean().optional(),
      visitorCount: z.number().optional(),
      requestDuration: z.number().optional(),
      vipVisit: z.boolean().optional(),
      hostId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const context: RequestContext = {
        ...input,
        requesterId: ctx.user.id,
      };

      return await startWorkflow(context);
    }),

  // Process an approval decision
  processDecision: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      decision: z.enum(["approved", "rejected", "info_requested"]),
      comments: z.string().optional(),
      infoRequest: z.object({
        questions: z.array(z.string()).optional(),
        requiredDocuments: z.array(z.string()).optional(),
        deadlineHours: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await processApprovalDecision(
        input.taskId,
        input.decision,
        ctx.user.id,
        input.comments,
        input.infoRequest
      );
    }),

  // Get approval status for a request
  getStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      requestType: z.string(),
    }))
    .query(async ({ input }) => {
      return await getApprovalStatus(input.requestId, input.requestType);
    }),

  // Get pending tasks for current user
  myPendingTasks: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await getPendingTasksForUser(ctx.user.id);
    
    // Enrich with instance and stage info
    const db = await getDb();
    if (!db) return [];

    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const [instance] = await db
          .select()
          .from(approvalInstances)
          .where(eq(approvalInstances.id, task.instanceId));

        const [stage] = await db
          .select()
          .from(approvalStages)
          .where(eq(approvalStages.id, task.stageId));

        const [workflow] = instance
          ? await db
              .select()
              .from(approvalWorkflows)
              .where(eq(approvalWorkflows.id, instance.workflowId))
          : [null];

        return {
          ...task,
          instance,
          stage,
          workflow,
        };
      })
    );

    return enriched;
  }),

  // Get approval history for a request
  getHistory: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      requestType: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const [instance] = await db
        .select()
        .from(approvalInstances)
        .where(
          and(
            eq(approvalInstances.requestId, input.requestId),
            eq(approvalInstances.requestType, input.requestType)
          )
        )
        .orderBy(desc(approvalInstances.createdAt))
        .limit(1);

      if (!instance) return [];

      const history = await db
        .select()
        .from(approvalHistory)
        .where(eq(approvalHistory.instanceId, instance.id))
        .orderBy(desc(approvalHistory.actionAt));

      // Enrich with user names
      const enriched = await Promise.all(
        history.map(async (h) => {
          if (h.actionBy) {
            const [user] = await db
              .select({ firstName: users.firstName, lastName: users.lastName })
              .from(users)
              .where(eq(users.id, h.actionBy));
            return { ...h, actionByUser: user };
          }
          return { ...h, actionByUser: null };
        })
      );

      return enriched;
    }),

  // Get process types for dropdown
  getProcessTypes: protectedProcedure.query(async () => {
    return [
      { value: "admin_visit", label: "Admin Visit" },
      { value: "work_permit", label: "Work Permit" },
      { value: "material_entry", label: "Material Entry" },
      { value: "tep", label: "TEP (Temporary Entry Pass)" },
      { value: "mop", label: "MOP (Method of Procedure)" },
      { value: "escort", label: "Escort Request" },
      { value: "mcm", label: "MCM (Managed Change Management)" },
      { value: "tdp", label: "TDP (Technical Data Package)" },
      { value: "mhv", label: "MHV (Material Handling Vehicle)" },
    ];
  }),

  // ============================================
  // SEND BACK FUNCTIONALITY
  // ============================================

  // Send back a task for clarification
  sendBack: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      target: z.enum(["requestor", "previous_stage", "specific_stage", "specific_person", "group"]),
      targetStageId: z.number().optional(),
      targetUserId: z.number().optional(),
      targetGroupId: z.number().optional(),
      reason: z.string().min(1, "Reason is required"),
      requiredActions: z.array(z.string()).optional(),
      deadlineHours: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await processSendBack(input.taskId, ctx.user.id, {
        target: input.target as SendBackTarget,
        targetStageId: input.targetStageId,
        targetUserId: input.targetUserId,
        targetGroupId: input.targetGroupId,
        reason: input.reason,
        requiredActions: input.requiredActions,
        deadlineHours: input.deadlineHours,
      });
    }),

  // Respond to a clarification request
  respondToClarification: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      response: z.string().min(1, "Response is required"),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await processClarificationResponse(
        input.taskId,
        ctx.user.id,
        input.response,
        input.attachments
      );
    }),

  // Get send back history for a request
  getSendBackHistory: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      requestType: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get instance ID first
      const [instance] = await db
        .select({ id: approvalInstances.id })
        .from(approvalInstances)
        .where(
          and(
            eq(approvalInstances.requestId, input.requestId),
            eq(approvalInstances.requestType, input.requestType)
          )
        )
        .orderBy(desc(approvalInstances.createdAt))
        .limit(1);

      if (!instance) return [];

      return await getSendBackHistory(instance.id);
    }),

  // Get pending clarification tasks for current user
  myPendingClarifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const tasks = await db
      .select()
      .from(approvalTasks)
      .where(
        and(
          eq(approvalTasks.assignedTo, ctx.user.id),
          eq(approvalTasks.status, "pending_clarification")
        )
      );

    // Enrich with instance and stage info
    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const [instance] = await db
          .select()
          .from(approvalInstances)
          .where(eq(approvalInstances.id, task.instanceId));

        const [stage] = await db
          .select()
          .from(approvalStages)
          .where(eq(approvalStages.id, task.stageId));

        const [workflow] = instance
          ? await db
              .select()
              .from(approvalWorkflows)
              .where(eq(approvalWorkflows.id, instance.workflowId))
          : [null];

        return {
          ...task,
          instance,
          stage,
          workflow,
        };
      })
    );

    return enriched;
  }),
});
