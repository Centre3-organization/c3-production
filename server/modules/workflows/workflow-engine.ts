/**
 * Approval Workflow Engine
 * 
 * This module implements the core workflow routing and execution logic
 * for the dynamic approval system. It handles:
 * - Workflow selection based on conditions
 * - Condition evaluation
 * - Approver resolution
 * - Stage progression
 */

import { getDb } from "../../infra/db/connection";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  approvalWorkflows,
  workflowConditions,
  approvalStages,
  stageApprovers,
  approvalInstances,
  approvalTasks,
  approvalHistory,
  approvalRoles,
  userApprovalRoles,
  approvalDelegations,
  users,
  groups,
  userGroupMembership,
} from "../../../drizzle/schema";

// Types for workflow engine
export interface RequestContext {
  requestId: number;
  requestType: string;
  processType?: string;
  category?: string;
  subCategory?: string;
  siteId?: number;
  region?: string;
  zoneId?: number;
  requesterGroupId?: number;
  requesterType?: "internal" | "external";
  activityRisk?: "low" | "medium" | "high" | "critical";
  hasMop?: boolean;
  hasMhv?: boolean;
  visitorCount?: number;
  requestDuration?: number;
  vipVisit?: boolean;
  hostId?: number;
  requesterId?: number;
}

export interface WorkflowResult {
  success: boolean;
  instanceId?: number;
  workflowId?: number;
  workflowName?: string;
  currentStage?: string;
  assignedTo?: number[];
  error?: string;
}

/**
 * Select the appropriate workflow for a request based on conditions
 */
export async function selectWorkflow(context: RequestContext): Promise<typeof approvalWorkflows.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  // Get all active workflows ordered by priority (highest first)
  const workflows = await db
    .select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.isActive, true))
    .orderBy(desc(approvalWorkflows.priority));

  for (const workflow of workflows) {
    // Get conditions for this workflow
    const conditions = await db
      .select()
      .from(workflowConditions)
      .where(eq(workflowConditions.workflowId, workflow.id));

    if (conditions.length === 0) {
      // Workflow with no conditions - check if it matches process type
      if (workflow.processType && workflow.processType === context.processType) {
        return workflow;
      }
      continue;
    }

    // Evaluate conditions
    if (evaluateConditions(conditions, context)) {
      return workflow;
    }
  }

  // Return default workflow for the process type if no specific match
  const defaultWorkflow = await db
    .select()
    .from(approvalWorkflows)
    .where(
      and(
        eq(approvalWorkflows.isActive, true),
        eq(approvalWorkflows.isDefault, true),
        context.processType ? eq(approvalWorkflows.processType, context.processType as any) : sql`1=1`
      )
    )
    .limit(1);

  return defaultWorkflow[0] || null;
}

/**
 * Evaluate workflow conditions against request context
 */
function evaluateConditions(
  conditions: (typeof workflowConditions.$inferSelect)[],
  context: RequestContext
): boolean {
  // Group conditions by logical_group
  const conditionGroups = new Map<number, typeof conditions>();
  for (const condition of conditions) {
    const group = condition.logicalGroup || 0;
    if (!conditionGroups.has(group)) {
      conditionGroups.set(group, []);
    }
    conditionGroups.get(group)!.push(condition);
  }

  // Evaluate each group (OR between groups, AND within group)
  for (const groupConditions of Array.from(conditionGroups.values())) {
    let groupResult = true;
    
    for (const condition of groupConditions) {
      const result = evaluateSingleCondition(condition, context);
      if (!result) {
        groupResult = false;
        break;
      }
    }

    if (groupResult) {
      return true; // At least one group matched
    }
  }

  return false;
}

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(
  condition: typeof workflowConditions.$inferSelect,
  context: RequestContext
): boolean {
  const value = condition.conditionValue as any;
  const operator = condition.conditionOperator;

  let contextValue: any;
  switch (condition.conditionType) {
    case "process_type":
      contextValue = context.processType;
      break;
    case "category":
      contextValue = context.category;
      break;
    case "sub_category":
      contextValue = context.subCategory;
      break;
    case "site_id":
      contextValue = context.siteId;
      break;
    case "region":
      contextValue = context.region;
      break;
    case "zone_id":
      contextValue = context.zoneId;
      break;
    case "requester_group":
      contextValue = context.requesterGroupId;
      break;
    case "requester_type":
      contextValue = context.requesterType;
      break;
    case "activity_risk":
      contextValue = context.activityRisk;
      break;
    case "has_mop":
      contextValue = context.hasMop;
      break;
    case "has_mhv":
      contextValue = context.hasMhv;
      break;
    case "visitor_count":
      contextValue = context.visitorCount;
      break;
    case "request_duration":
      contextValue = context.requestDuration;
      break;
    case "vip_visit":
      contextValue = context.vipVisit;
      break;
    default:
      return false;
  }

  switch (operator) {
    case "equals":
      return contextValue === value;
    case "not_equals":
      return contextValue !== value;
    case "in":
      return Array.isArray(value) && value.includes(contextValue);
    case "not_in":
      return Array.isArray(value) && !value.includes(contextValue);
    case "greater_than":
      return typeof contextValue === "number" && contextValue > value;
    case "less_than":
      return typeof contextValue === "number" && contextValue < value;
    case "between":
      return (
        typeof contextValue === "number" &&
        Array.isArray(value) &&
        contextValue >= value[0] &&
        contextValue <= value[1]
      );
    case "contains":
      return typeof contextValue === "string" && contextValue.includes(value);
    case "starts_with":
      return typeof contextValue === "string" && contextValue.startsWith(value);
    case "is_null":
      return contextValue === null || contextValue === undefined;
    case "is_not_null":
      return contextValue !== null && contextValue !== undefined;
    default:
      return false;
  }
}

/**
 * Start a workflow for a request
 */
export async function startWorkflow(context: RequestContext): Promise<WorkflowResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Select appropriate workflow
    const workflow = await selectWorkflow(context);
    if (!workflow) {
      return {
        success: false,
        error: "No matching workflow found for this request",
      };
    }

    // Get workflow stages
    const stages = await db
      .select()
      .from(approvalStages)
      .where(eq(approvalStages.workflowId, workflow.id))
      .orderBy(asc(approvalStages.stageOrder));

    if (stages.length === 0) {
      return {
        success: false,
        error: "Workflow has no stages configured",
      };
    }

    const firstStage = stages[0];

    // Create approval instance
    const [instance] = await db.insert(approvalInstances).values({
      requestId: context.requestId,
      requestType: context.requestType,
      workflowId: workflow.id,
      currentStageId: firstStage.id,
      currentStageOrder: 1,
      status: "in_progress",
      metadata: {
        totalStages: stages.length,
        completedStages: 0,
      },
    });

    const instanceId = Number(instance.insertId);

    // Record workflow start in history
    await db.insert(approvalHistory).values({
      instanceId,
      actionType: "workflow_started",
      actionByType: "system",
      details: {
        workflowName: workflow.name,
        stageName: firstStage.stageName,
      },
    });

    // Resolve approvers for first stage and create tasks
    const approvers = await resolveApprovers(firstStage, context);
    const assignedTo: number[] = [];

    for (const approverId of approvers) {
      // Check for active delegation
      const effectiveApprover = await resolveEffectiveApprover(approverId);
      
      const dueAt = firstStage.slaHours
        ? new Date(Date.now() + firstStage.slaHours * 60 * 60 * 1000)
        : null;

      await db.insert(approvalTasks).values({
        instanceId,
        stageId: firstStage.id,
        assignedTo: effectiveApprover,
        assignedVia: effectiveApprover !== approverId ? "delegation" : "direct",
        originalAssignee: effectiveApprover !== approverId ? approverId : null,
        status: "pending",
        dueAt,
      });

      assignedTo.push(effectiveApprover);

      // Record task assignment in history
      await db.insert(approvalHistory).values({
        instanceId,
        stageId: firstStage.id,
        actionType: "task_assigned",
        actionByType: "system",
        details: {
          assignee: effectiveApprover,
          stageName: firstStage.stageName,
        },
      });
    }

    return {
      success: true,
      instanceId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      currentStage: firstStage.stageName,
      assignedTo,
    };
  } catch (error) {
    console.error("Error starting workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Resolve approvers for a stage based on stage type and configuration
 */
async function resolveApprovers(
  stage: typeof approvalStages.$inferSelect,
  context: RequestContext
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const approverConfigs = await db
    .select()
    .from(stageApprovers)
    .where(eq(stageApprovers.stageId, stage.id))
    .orderBy(asc(stageApprovers.priority));

  const resolvedApprovers: number[] = [];

  for (const config of approverConfigs) {
    const approvers = await resolveSingleApprover(config, stage, context);
    resolvedApprovers.push(...approvers);
  }

  // Remove duplicates
  return Array.from(new Set(resolvedApprovers));
}

/**
 * Resolve a single approver configuration
 */
async function resolveSingleApprover(
  config: typeof stageApprovers.$inferSelect,
  stage: typeof approvalStages.$inferSelect,
  context: RequestContext
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const approverConfig = config.approverConfig as any;

  switch (config.approverType) {
    case "user":
      // Direct user assignment
      if (config.approverReference) {
        return [parseInt(config.approverReference)];
      }
      return [];

    case "approval_role":
      // Find users with this approval role
      if (config.approverReference) {
        const roleUsers = await db
          .select({ userId: userApprovalRoles.userId })
          .from(userApprovalRoles)
          .innerJoin(approvalRoles, eq(approvalRoles.id, userApprovalRoles.approvalRoleId))
          .where(
            and(
              eq(approvalRoles.code, config.approverReference),
              eq(userApprovalRoles.isActive, true)
            )
          );
        return roleUsers.map((r: { userId: number }) => r.userId);
      }
      return [];

    case "dynamic_field":
      // Resolve from request context
      if (config.approverReference === "host_name" && context.hostId) {
        return [context.hostId];
      }
      return [];


    case "manager_chain":
      // Find requester's manager
      if (context.requesterId) {
        const user = await db
          .select({ managerId: users.managerId })
          .from(users)
          .where(eq(users.id, context.requesterId))
          .limit(1);
        if (user[0]?.managerId) {
          return [user[0].managerId];
        }
      }
      return [];

    case "group_role":
      // Find users with specific role in a group
      if (config.approverReference && approverConfig?.roleInGroup) {
        const groupMembers = await db
          .select({ userId: userGroupMembership.userId })
          .from(userGroupMembership)
          .where(
            and(
              eq(userGroupMembership.groupId, parseInt(config.approverReference)),
              eq(userGroupMembership.roleInGroup, approverConfig.roleInGroup),
              eq(userGroupMembership.status, "active")
            )
          );
        return groupMembers.map((m: { userId: number }) => m.userId);
      }
      return [];

    case "hierarchy_level":
      // Navigate group hierarchy
      return await resolveHierarchyApprover(context, approverConfig);

    default:
      return [];
  }
}


/**
 * Resolve hierarchy-based approver
 */
async function resolveHierarchyApprover(
  context: RequestContext,
  config: any
): Promise<number[]> {
  if (!context.requesterGroupId) return [];

  const db = await getDb();
  if (!db) return [];

  const levels = config?.levels || 1;
  const stopAtGroupType = config?.stopAtGroupType;

  // Get requester's group
  let currentGroupId = context.requesterGroupId;

  for (let i = 0; i < levels; i++) {
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, currentGroupId))
      .limit(1);

    if (!group[0]) break;

    // Check if we should stop at this group type
    if (stopAtGroupType && group[0].groupType === stopAtGroupType) {
      // Find approvers in this group
      const groupApprovers = await db
        .select({ userId: userGroupMembership.userId })
        .from(userGroupMembership)
        .where(
          and(
            eq(userGroupMembership.groupId, currentGroupId),
            eq(userGroupMembership.canApprove, true),
            eq(userGroupMembership.status, "active")
          )
        );

      if (groupApprovers.length > 0) {
        return groupApprovers.map((a: { userId: number }) => a.userId);
      }
    }

    // Move to parent group
    if (group[0].parentGroupId) {
      currentGroupId = group[0].parentGroupId;
    } else {
      break;
    }
  }

  return [];
}

/**
 * Check for active delegation and return effective approver
 */
async function resolveEffectiveApprover(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return userId;

  const now = new Date();

  // Check for out-of-office delegation
  const user = await db
    .select({
      outOfOfficeUntil: users.outOfOfficeUntil,
      outOfOfficeDelegateId: users.outOfOfficeDelegateId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user[0]?.outOfOfficeUntil && user[0].outOfOfficeUntil > now && user[0].outOfOfficeDelegateId) {
    return user[0].outOfOfficeDelegateId;
  }

  // Check for active delegation
  const delegation = await db
    .select()
    .from(approvalDelegations)
    .where(
      and(
        eq(approvalDelegations.delegatorId, userId),
        eq(approvalDelegations.isActive, true),
        sql`${approvalDelegations.validFrom} <= NOW()`,
        sql`${approvalDelegations.validUntil} >= NOW()`
      )
    )
    .limit(1);

  if (delegation[0]) {
    return delegation[0].delegateId;
  }

  return userId;
}

/**
 * Process an approval decision
 */
export async function processApprovalDecision(
  taskId: number,
  decision: "approved" | "rejected" | "info_requested",
  userId: number,
  comments?: string,
  infoRequest?: { questions?: string[]; requiredDocuments?: string[]; deadlineHours?: number }
): Promise<WorkflowResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Get the task
    const [task] = await db
      .select()
      .from(approvalTasks)
      .where(eq(approvalTasks.id, taskId));

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status !== "pending") {
      return { success: false, error: "Task is not pending" };
    }

    // Update task
    await db
      .update(approvalTasks)
      .set({
        status: decision,
        decision,
        comments,
        infoRequest: infoRequest || null,
        decidedAt: new Date(),
      })
      .where(eq(approvalTasks.id, taskId));

    // Get instance and stage info (needed for history details)
    const [instance] = await db
      .select()
      .from(approvalInstances)
      .where(eq(approvalInstances.id, task.instanceId));

    const [stage] = await db
      .select()
      .from(approvalStages)
      .where(eq(approvalStages.id, task.stageId));

    // Record decision in history
    await db.insert(approvalHistory).values({
      instanceId: task.instanceId,
      taskId,
      stageId: task.stageId,
      actionType: "decision_made",
      actionBy: userId,
      actionByType: "user",
      details: {
        decision,
        comments,
        stageName: stage?.stageName || "Unknown",
      },
    });

    if (!instance || !stage) {
      return { success: false, error: "Instance or stage not found" };
    }

    // Handle decision
    if (decision === "rejected") {
      // Reject the entire workflow
      await db
        .update(approvalInstances)
        .set({
          status: "rejected",
          completedAt: new Date(),
        })
        .where(eq(approvalInstances.id, instance.id));

      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        actionType: "workflow_completed",
        actionBy: userId,
        actionByType: "user",
        details: {
          newStatus: "rejected",
          stageName: stage?.stageName || "Unknown",
        },
      });

      return {
        success: true,
        instanceId: instance.id,
        currentStage: stage.stageName,
      };
    }

    if (decision === "info_requested") {
      // Update instance status
      await db
        .update(approvalInstances)
        .set({ status: "info_requested" })
        .where(eq(approvalInstances.id, instance.id));

      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        taskId,
        stageId: task.stageId,
        actionType: "info_requested",
        actionBy: userId,
        actionByType: "user",
        details: {
          questions: infoRequest?.questions,
          requiredDocuments: infoRequest?.requiredDocuments,
          stageName: stage?.stageName || "Unknown",
        },
      });

      return {
        success: true,
        instanceId: instance.id,
        currentStage: stage.stageName,
      };
    }

    // Decision is "approved" - check if stage is complete
    const pendingTasks = await db
      .select()
      .from(approvalTasks)
      .where(
        and(
          eq(approvalTasks.instanceId, instance.id),
          eq(approvalTasks.stageId, stage.id),
          eq(approvalTasks.status, "pending")
        )
      );

    const approvedTasks = await db
      .select()
      .from(approvalTasks)
      .where(
        and(
          eq(approvalTasks.instanceId, instance.id),
          eq(approvalTasks.stageId, stage.id),
          eq(approvalTasks.status, "approved")
        )
      );

    let stageComplete = false;

    switch (stage.approvalMode) {
      case "any":
        // Any single approval completes the stage
        stageComplete = true;
        break;
      case "all":
        // All approvals required
        stageComplete = pendingTasks.length === 0;
        break;
      case "percentage":
        // Percentage of approvals required
        const totalTasks = pendingTasks.length + approvedTasks.length;
        const approvalPercentage = (approvedTasks.length / totalTasks) * 100;
        stageComplete = approvalPercentage >= (stage.approvalPercentage || 100);
        break;
    }

    if (stageComplete) {
      // Record stage completion
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        stageId: stage.id,
        actionType: "stage_completed",
        actionByType: "system",
        details: {
          stageName: stage.stageName,
        },
      });

      // Move to next stage
      const nextStage = await db
        .select()
        .from(approvalStages)
        .where(
          and(
            eq(approvalStages.workflowId, instance.workflowId),
            sql`${approvalStages.stageOrder} > ${stage.stageOrder}`
          )
        )
        .orderBy(asc(approvalStages.stageOrder))
        .limit(1);

      if (nextStage[0]) {
        // Update instance to next stage
        await db
          .update(approvalInstances)
          .set({
            currentStageId: nextStage[0].id,
            currentStageOrder: nextStage[0].stageOrder,
            metadata: {
              ...((instance.metadata as any) || {}),
              completedStages: ((instance.metadata as any)?.completedStages || 0) + 1,
            },
          })
          .where(eq(approvalInstances.id, instance.id));

        return {
          success: true,
          instanceId: instance.id,
          currentStage: nextStage[0].stageName,
        };
      } else {
        // No more stages - workflow complete
        await db
          .update(approvalInstances)
          .set({
            status: "approved",
            completedAt: new Date(),
          })
          .where(eq(approvalInstances.id, instance.id));

        await db.insert(approvalHistory).values({
          instanceId: instance.id,
          actionType: "workflow_completed",
          actionByType: "system",
          details: {
            newStatus: "approved",
            stageName: stage.stageName,
          },
        });

        return {
          success: true,
          instanceId: instance.id,
          currentStage: "Completed",
        };
      }
    }

    return {
      success: true,
      instanceId: instance.id,
      currentStage: stage.stageName,
    };
  } catch (error) {
    console.error("Error processing approval decision:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get approval status for a request
 */
export async function getApprovalStatus(requestId: number, requestType: string) {
  const db = await getDb();
  if (!db) return null;

  const instance = await db
    .select()
    .from(approvalInstances)
    .where(
      and(
        eq(approvalInstances.requestId, requestId),
        eq(approvalInstances.requestType, requestType)
      )
    )
    .orderBy(desc(approvalInstances.createdAt))
    .limit(1);

  if (!instance[0]) {
    return null;
  }

  const workflow = await db
    .select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.id, instance[0].workflowId))
    .limit(1);

  const currentStage = instance[0].currentStageId
    ? await db
        .select()
        .from(approvalStages)
        .where(eq(approvalStages.id, instance[0].currentStageId))
        .limit(1)
    : null;

  const tasks = await db
    .select()
    .from(approvalTasks)
    .where(eq(approvalTasks.instanceId, instance[0].id));

  const history = await db
    .select()
    .from(approvalHistory)
    .where(eq(approvalHistory.instanceId, instance[0].id))
    .orderBy(desc(approvalHistory.actionAt));

  return {
    instance: instance[0],
    workflow: workflow[0],
    currentStage: currentStage?.[0],
    tasks,
    history,
  };
}

/**
 * Get pending tasks for a user
 */
export async function getPendingTasksForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const tasks = await db
    .select()
    .from(approvalTasks)
    .where(
      and(
        eq(approvalTasks.assignedTo, userId),
        eq(approvalTasks.status, "pending")
      )
    );

  return tasks;
}

/**
 * Get all workflows
 */
export async function listWorkflows() {
  const db = await getDb();
  if (!db) return [];

  const workflows = await db
    .select()
    .from(approvalWorkflows)
    .orderBy(desc(approvalWorkflows.priority));

  return workflows;
}

/**
 * Get workflow details with stages
 */
export async function getWorkflowDetails(workflowId: number) {
  const db = await getDb();
  if (!db) return null;

  const [workflow] = await db
    .select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.id, workflowId));

  if (!workflow) return null;

  const stages = await db
    .select()
    .from(approvalStages)
    .where(eq(approvalStages.workflowId, workflowId))
    .orderBy(asc(approvalStages.stageOrder));

  const conditions = await db
    .select()
    .from(workflowConditions)
    .where(eq(workflowConditions.workflowId, workflowId));

  return {
    workflow,
    stages,
    conditions,
  };
}


/**
 * Send Back Types
 */
export type SendBackTarget = 
  | "requestor"           // Send back to original requester
  | "previous_stage"      // Send back to previous stage
  | "specific_stage"      // Send back to a specific stage by ID
  | "specific_person"     // Send back to a specific person
  | "group";              // Send back to a group

export interface SendBackOptions {
  target: SendBackTarget;
  targetStageId?: number;      // For specific_stage
  targetUserId?: number;       // For specific_person
  targetGroupId?: number;      // For group
  reason: string;              // Required reason for send back
  requiredActions?: string[];  // What the recipient needs to do
  deadlineHours?: number;      // Optional deadline
}

/**
 * Process a Send Back action
 * This returns the request to a previous point for clarification/correction
 */
export async function processSendBack(
  taskId: number,
  userId: number,
  options: SendBackOptions
): Promise<WorkflowResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Get the task
    const [task] = await db
      .select()
      .from(approvalTasks)
      .where(eq(approvalTasks.id, taskId));

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status !== "pending") {
      return { success: false, error: "Task is not pending" };
    }

    // Get instance
    const [instance] = await db
      .select()
      .from(approvalInstances)
      .where(eq(approvalInstances.id, task.instanceId));

    if (!instance) {
      return { success: false, error: "Instance not found" };
    }

    // Get current stage
    const [currentStage] = await db
      .select()
      .from(approvalStages)
      .where(eq(approvalStages.id, task.stageId));

    // Update current task as sent back
    await db
      .update(approvalTasks)
      .set({
        status: "sent_back",
        decision: "sent_back",
        comments: options.reason,
        decidedAt: new Date(),
      })
      .where(eq(approvalTasks.id, taskId));

    // Record send back in history
    await db.insert(approvalHistory).values({
      instanceId: instance.id,
      taskId,
      stageId: task.stageId,
      actionType: "sent_back",
      actionBy: userId,
      actionByType: "user",
      details: {
        target: options.target,
        targetStageId: options.targetStageId,
        targetUserId: options.targetUserId,
        targetGroupId: options.targetGroupId,
        reason: options.reason,
        requiredActions: options.requiredActions,
        stageName: currentStage?.stageName || "Unknown",
      },
    });

    // Determine who to send back to
    let sendBackToUserId: number | null = null;
    let sendBackToStageId: number | null = null;

    switch (options.target) {
      case "requestor":
        // Get the original requester from the request
        const requestResult = await db.execute(
          sql`SELECT requesterId FROM accessRequests WHERE id = ${instance.requestId}`
        );
        const requestRows = requestResult as unknown as Array<{ requesterId: number }>;
        if (requestRows[0]?.requesterId) {
          sendBackToUserId = requestRows[0].requesterId;
        }
        break;

      case "previous_stage":
        // Find the previous stage
        const prevStage = await db
          .select()
          .from(approvalStages)
          .where(
            and(
              eq(approvalStages.workflowId, instance.workflowId),
              sql`${approvalStages.stageOrder} < ${currentStage?.stageOrder || 1}`
            )
          )
          .orderBy(desc(approvalStages.stageOrder))
          .limit(1);

        if (prevStage[0]) {
          sendBackToStageId = prevStage[0].id;
          // Get the approver who approved that stage
          const prevTask = await db
            .select()
            .from(approvalTasks)
            .where(
              and(
                eq(approvalTasks.instanceId, instance.id),
                eq(approvalTasks.stageId, prevStage[0].id),
                eq(approvalTasks.status, "approved")
              )
            )
            .limit(1);
          if (prevTask[0]) {
            sendBackToUserId = prevTask[0].assignedTo;
          }
        }
        break;

      case "specific_stage":
        if (options.targetStageId) {
          sendBackToStageId = options.targetStageId;
          // Get the approver who approved that stage
          const stageTask = await db
            .select()
            .from(approvalTasks)
            .where(
              and(
                eq(approvalTasks.instanceId, instance.id),
                eq(approvalTasks.stageId, options.targetStageId),
                eq(approvalTasks.status, "approved")
              )
            )
            .limit(1);
          if (stageTask[0]) {
            sendBackToUserId = stageTask[0].assignedTo;
          }
        }
        break;

      case "specific_person":
        if (options.targetUserId) {
          sendBackToUserId = options.targetUserId;
        }
        break;

      case "group":
        if (options.targetGroupId) {
          // Get primary member of the group
          const groupMember = await db
            .select({ userId: userGroupMembership.userId })
            .from(userGroupMembership)
            .where(
              and(
                eq(userGroupMembership.groupId, options.targetGroupId),
                eq(userGroupMembership.isPrimaryGroup, true),
                eq(userGroupMembership.status, "active")
              )
            )
            .limit(1);
          if (groupMember[0]) {
            sendBackToUserId = groupMember[0].userId;
          }
        }
        break;
    }

    if (!sendBackToUserId) {
      return { success: false, error: "Could not determine send back recipient" };
    }

    // Calculate deadline
    const dueAt = options.deadlineHours
      ? new Date(Date.now() + options.deadlineHours * 60 * 60 * 1000)
      : null;

    // Create a new task for the send back recipient
    await db.insert(approvalTasks).values({
      instanceId: instance.id,
      stageId: sendBackToStageId || task.stageId,
      assignedTo: sendBackToUserId,
      assignedVia: "send_back",
      originalAssignee: userId, // Who sent it back
      status: "pending_clarification",
      dueAt,
      metadata: {
        sendBackReason: options.reason,
        requiredActions: options.requiredActions,
        sentBackBy: userId,
        sentBackAt: new Date().toISOString(),
      },
    });

    // Update instance status
    await db
      .update(approvalInstances)
      .set({
        status: "pending_clarification",
        metadata: {
          ...((instance.metadata as any) || {}),
          lastSendBack: {
            by: userId,
            to: sendBackToUserId,
            reason: options.reason,
            at: new Date().toISOString(),
          },
        },
      })
      .where(eq(approvalInstances.id, instance.id));

    // Record task assignment in history
    await db.insert(approvalHistory).values({
      instanceId: instance.id,
      stageId: sendBackToStageId || task.stageId,
      actionType: "clarification_requested",
      actionBy: userId,
      actionByType: "user",
      details: {
        assignee: sendBackToUserId,
        reason: options.reason,
        requiredActions: options.requiredActions,
        stageName: currentStage?.stageName || "Unknown",
      },
    });

    return {
      success: true,
      instanceId: instance.id,
      currentStage: currentStage?.stageName || "Pending Clarification",
    };
  } catch (error) {
    console.error("Error processing send back:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process clarification response (when someone responds to a send back)
 */
export async function processClarificationResponse(
  taskId: number,
  userId: number,
  response: string,
  attachments?: string[]
): Promise<WorkflowResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Get the task
    const [task] = await db
      .select()
      .from(approvalTasks)
      .where(eq(approvalTasks.id, taskId));

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status !== "pending_clarification") {
      return { success: false, error: "Task is not pending clarification" };
    }

    // Get instance
    const [instance] = await db
      .select()
      .from(approvalInstances)
      .where(eq(approvalInstances.id, task.instanceId));

    if (!instance) {
      return { success: false, error: "Instance not found" };
    }

    // Update the clarification task as completed
    await db
      .update(approvalTasks)
      .set({
        status: "clarification_provided",
        comments: response,
        decidedAt: new Date(),
        metadata: {
          ...((task.metadata as any) || {}),
          clarificationResponse: response,
          attachments,
          respondedAt: new Date().toISOString(),
        },
      })
      .where(eq(approvalTasks.id, taskId));

    // Record in history
    await db.insert(approvalHistory).values({
      instanceId: instance.id,
      taskId,
      stageId: task.stageId,
      actionType: "clarification_provided",
      actionBy: userId,
      actionByType: "user",
      details: {
        response,
        attachments,
        stageName: "Clarification",
      },
    });

    // Get the original approver who sent it back
    const metadata = task.metadata as any;
    const sentBackBy = metadata?.sentBackBy;

    if (sentBackBy) {
      // Create a new task for the original approver to review
      await db.insert(approvalTasks).values({
        instanceId: instance.id,
        stageId: task.stageId,
        assignedTo: sentBackBy,
        assignedVia: "clarification_response",
        status: "pending",
        metadata: {
          clarificationResponse: response,
          attachments,
          respondedBy: userId,
        },
      });

      // Record task assignment
      await db.insert(approvalHistory).values({
        instanceId: instance.id,
        stageId: task.stageId,
        actionType: "task_reassigned",
        actionByType: "system",
        details: {
          assignee: sentBackBy,
          reason: "Clarification provided, ready for review",
          stageName: "Review",
        },
      });
    }

    // Update instance status back to in_progress
    await db
      .update(approvalInstances)
      .set({
        status: "in_progress",
        metadata: {
          ...((instance.metadata as any) || {}),
          lastClarification: {
            by: userId,
            response,
            at: new Date().toISOString(),
          },
        },
      })
      .where(eq(approvalInstances.id, instance.id));

    return {
      success: true,
      instanceId: instance.id,
      currentStage: "Review Clarification",
    };
  } catch (error) {
    console.error("Error processing clarification response:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get send back history for an instance
 */
export async function getSendBackHistory(instanceId: number) {
  const db = await getDb();
  if (!db) return [];

  const history = await db
    .select()
    .from(approvalHistory)
    .where(
      and(
        eq(approvalHistory.instanceId, instanceId),
        sql`${approvalHistory.actionType} IN ('sent_back', 'clarification_requested', 'clarification_provided')`
      )
    )
    .orderBy(desc(approvalHistory.actionAt));

  return history;
}
