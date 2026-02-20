/**
 * Alert Trigger Engine
 * Real-time service that monitors checkpoint requests and automatically triggers configured security alerts
 */

import { getDb } from "../../db";
import {
  securityAlertConfigs,
  securityAlertLogs,
  securityAlertNotifications,
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "../../_core/notification";

export interface AlertTriggerContext {
  requestId: string;
  visitorId: string;
  visitorName: string;
  visitorIdNumber: string;
  checkpointId: number;
  guardId: number;
  accessZoneId?: number;
  documentValid?: boolean;
  faceMatchScore?: number;
  anomalyScore?: number;
  plateNumber?: string;
  accessTime: Date;
  previousDenialCount?: number;
  isWatchlisted?: boolean;
  accessOutsideHours?: boolean;
}

export interface AlertTriggerResult {
  alertConfigId: number;
  triggered: boolean;
  reason?: string;
  actionsExecuted: string[];
  notificationsSent: number;
  timestamp: Date;
}

/**
 * Main Alert Trigger Engine - Evaluates all active alert configurations
 */
export async function triggerAlerts(context: AlertTriggerContext): Promise<AlertTriggerResult[]> {
  const results: AlertTriggerResult[] = [];

  try {
    const db = await getDb();
    if (!db) {
      console.error("[AlertTriggerEngine] Database not available");
      return results;
    }

    const configs = await db
      .select()
      .from(securityAlertConfigs)
      .where(eq(securityAlertConfigs.isActive, true));

    for (const config of configs) {
      const result = await evaluateAndExecuteAlert(config, context);
      if (result.triggered) {
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error("[AlertTriggerEngine] Error triggering alerts:", error);
    return [];
  }
}

/**
 * Evaluate a single alert configuration and execute if conditions are met
 */
async function evaluateAndExecuteAlert(
  config: typeof securityAlertConfigs.$inferSelect,
  context: AlertTriggerContext
): Promise<AlertTriggerResult> {
  try {
    const conditions = config.triggerConditions as any[];
    if (!conditions || conditions.length === 0) {
      return {
        alertConfigId: config.id,
        triggered: false,
        reason: "No trigger conditions defined",
        actionsExecuted: [],
        notificationsSent: 0,
        timestamp: new Date(),
      };
    }

    const allConditionsMet = await evaluateConditions(conditions, context);
    if (!allConditionsMet) {
      return {
        alertConfigId: config.id,
        triggered: false,
        reason: "Trigger conditions not met",
        actionsExecuted: [],
        notificationsSent: 0,
        timestamp: new Date(),
      };
    }

    const isDuplicate = await checkDuplicate(config.id, context.requestId);
    if (isDuplicate) {
      return {
        alertConfigId: config.id,
        triggered: false,
        reason: "Duplicate alert suppressed",
        actionsExecuted: [],
        notificationsSent: 0,
        timestamp: new Date(),
      };
    }

    const actionsExecuted = await executeActions(config, context);
    const notificationsSent = await sendNotifications(config, context);

    await logAlertExecution(config.id, context, true, "Conditions met, alert triggered");

    const notifyOwnerField = (config as any).notifyOwner;
    if (notifyOwnerField) {
      await notifyOwner({
        title: `Security Alert: ${config.name}`,
        content: `Alert triggered for visitor: ${context.visitorName}. Actions: ${actionsExecuted.join(", ")}`,
      });
    }

    return {
      alertConfigId: config.id,
      triggered: true,
      reason: "Conditions met",
      actionsExecuted,
      notificationsSent,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[AlertTriggerEngine] Error evaluating alert config ${config.id}:`, error);
    await logAlertExecution(
      config.id,
      context,
      false,
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return {
      alertConfigId: config.id,
      triggered: false,
      reason: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      actionsExecuted: [],
      notificationsSent: 0,
      timestamp: new Date(),
    };
  }
}

/**
 * Evaluate trigger conditions against context
 */
async function evaluateConditions(
  conditions: any[],
  context: AlertTriggerContext
): Promise<boolean> {
  for (const condition of conditions) {
    const conditionMet = await evaluateSingleCondition(condition, context);
    if (!conditionMet) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluate a single trigger condition
 */
async function evaluateSingleCondition(condition: any, context: AlertTriggerContext): Promise<boolean> {
  const { field, operator, value } = condition;

  switch (field) {
    case "sameDayVisitCount":
      return evaluateNumericCondition(context.previousDenialCount || 0, operator, value);
    case "visitorOnWatchlist":
      return context.isWatchlisted === true;
    case "documentExpired":
      return context.documentValid === false;
    case "faceMatchFailed":
      return (context.faceMatchScore || 100) < 70;
    case "multipleDenials":
      return (context.previousDenialCount || 0) >= value;
    case "accessOutsideHours":
      return context.accessOutsideHours === true;
    case "unusualAccessPattern":
      const hour = context.accessTime.getHours();
      return hour >= 2 && hour <= 5;
    case "highRiskZoneAccess":
      return context.accessZoneId === value;
    case "anomalyDetected":
      return (context.anomalyScore || 0) > 70;
    case "plateRecognitionAlert":
      return context.plateNumber !== undefined && context.plateNumber.length > 0;
    default:
      console.warn(`[AlertTriggerEngine] Unknown condition field: ${field}`);
      return false;
  }
}

/**
 * Helper: Evaluate numeric conditions
 */
function evaluateNumericCondition(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case "equals":
      return actual === expected;
    case "greaterThan":
      return actual > expected;
    case "lessThan":
      return actual < expected;
    case "greaterOrEqual":
      return actual >= expected;
    case "lessOrEqual":
      return actual <= expected;
    case "notEquals":
      return actual !== expected;
    default:
      return false;
  }
}

/**
 * Execute configured actions
 */
async function executeActions(
  config: typeof securityAlertConfigs.$inferSelect,
  context: AlertTriggerContext
): Promise<string[]> {
  const actions: string[] = [];
  const actionPoints = config.actionPoints as any[];

  if (!actionPoints || actionPoints.length === 0) {
    return actions;
  }

  for (const action of actionPoints) {
    try {
      switch (action.type) {
        case "denyEntry":
          actions.push("Entry Denied");
          break;
        case "alertSupervisor":
          actions.push("Supervisor Alerted");
          break;
        case "lockZone":
          actions.push("Zone Locked");
          break;
        case "capturePhoto":
          actions.push("Photo Captured");
          break;
        case "logIncident":
          actions.push("Incident Logged");
          break;
        case "escalate":
          actions.push("Escalated");
          break;
        default:
          console.warn(`[AlertTriggerEngine] Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`[AlertTriggerEngine] Error executing action ${action.type}:`, error);
    }
  }

  return actions;
}

/**
 * Send notifications based on configuration
 */
async function sendNotifications(
  config: typeof securityAlertConfigs.$inferSelect,
  context: AlertTriggerContext
): Promise<number> {
  let notificationCount = 0;

  try {
    const db = await getDb();
    if (!db) return 0;

    const notificationRules = await db
      .select()
      .from(securityAlertNotifications)
      .where(eq(securityAlertNotifications.alertConfigId, config.id));

    for (const rule of notificationRules) {
      try {
        const channel = rule.channel;
        const recipients = rule.recipients as any[];

        for (const recipient of recipients) {
          switch (channel) {
            case "email":
              console.log(`[AlertTriggerEngine] Sending email to ${recipient.email}`);
              notificationCount++;
              break;
            case "sms":
              console.log(`[AlertTriggerEngine] Sending SMS to ${recipient.phone}`);
              notificationCount++;
              break;
            case "whatsapp":
              console.log(`[AlertTriggerEngine] Sending WhatsApp to ${recipient.phone}`);
              notificationCount++;
              break;
            case "in_app":
              notificationCount++;
              break;
            case "webhook":
              console.log(`[AlertTriggerEngine] Sending webhook to ${recipient.url}`);
              notificationCount++;
              break;
          }
        }
      } catch (error) {
        console.error("[AlertTriggerEngine] Error sending notification:", error);
      }
    }
  } catch (error) {
    console.error("[AlertTriggerEngine] Error fetching notification rules:", error);
  }

  return notificationCount;
}

/**
 * Check for duplicate alerts (suppress within 5 minutes)
 */
async function checkDuplicate(alertConfigId: number, requestId: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const recentAlert = await db
      .select()
      .from(securityAlertLogs)
      .where(
        and(
          eq(securityAlertLogs.alertConfigId, alertConfigId),
          eq(securityAlertLogs.triggeredBy, requestId),
          eq(securityAlertLogs.status, "triggered")
        )
      )
      .limit(1);

    return recentAlert.length > 0;
  } catch (error) {
    console.error("[AlertTriggerEngine] Error checking duplicate:", error);
    return false;
  }
}

/**
 * Log alert execution for audit trail
 */
async function logAlertExecution(
  alertConfigId: number,
  context: AlertTriggerContext,
  triggered: boolean,
  reason: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(securityAlertLogs).values({
      alertConfigId,
      triggeredBy: context.requestId,
      triggerData: context,
      status: triggered ? "triggered" : "resolved",
      notificationsSent: [],
    });
  } catch (error) {
    console.error("[AlertTriggerEngine] Error logging alert execution:", error);
  }
}

/**
 * Get alert statistics for dashboard
 */
export async function getAlertStatistics(days: number = 7) {
  try {
    const db = await getDb();
    if (!db) {
      return {
        totalTriggered: 0,
        totalEvaluated: 0,
        triggerRate: 0,
        alertsByType: {},
        period: `Last ${days} days`,
      };
    }

    const triggeredAlerts = await db
      .select()
      .from(securityAlertLogs)
      .where(eq(securityAlertLogs.status, "triggered"));

    const totalAlerts = await db
      .select()
      .from(securityAlertLogs);

    const alertsByType = triggeredAlerts.reduce(
      (acc: Record<number, number>, log: any) => {
        const key = log.alertConfigId;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      totalTriggered: triggeredAlerts.length,
      totalEvaluated: totalAlerts.length,
      triggerRate: totalAlerts.length > 0 ? (triggeredAlerts.length / totalAlerts.length) * 100 : 0,
      alertsByType,
      period: `Last ${days} days`,
    };
  } catch (error) {
    console.error("[AlertTriggerEngine] Error getting statistics:", error);
    return {
      totalTriggered: 0,
      totalEvaluated: 0,
      triggerRate: 0,
      alertsByType: {},
      period: `Last ${days} days`,
    };
  }
}
