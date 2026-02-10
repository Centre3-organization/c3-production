/**
 * Messaging Service — Orchestrator
 * 
 * This is the central service that:
 * 1. Evaluates trigger rules when system events fire
 * 2. Resolves recipients (requester, approver, visitor, etc.)
 * 3. Renders message templates with variable interpolation
 * 4. Dispatches messages through the configured provider
 * 5. Logs every delivery attempt for audit trail
 * 
 * Usage from workflow engine or request lifecycle:
 *   await messagingService.fireEvent("task_assigned", { requestId, taskId, ... });
 */

import { getDb } from "../../infra/db/connection";
import {
  integrations,
  messageTemplates,
  messageTriggerRules,
  messageLogs,
  users,
  requests,
  approvalTasks,
  approvalInstances,
  approvalStages,
  sites,
  requestVisitors,
} from "../../../drizzle/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { createProvider, type MessagingProvider, type SendResult } from "./messaging.provider";

// Ensure Twilio adapter is registered
import "./twilio.adapter";

// ============================================================================
// TYPES
// ============================================================================

export interface EventContext {
  requestId?: number;
  taskId?: number;
  instanceId?: number;
  userId?: number;         // the user who triggered the event
  approverUserId?: number; // the approver for task events
  stageName?: string;
  comment?: string;
  siteId?: number;
  requestType?: string;
  [key: string]: any;      // extensible for future event data
}

export interface ResolvedRecipient {
  phone?: string;
  email?: string;
  name?: string;
  userId?: number;
}

// All supported event types
export const EVENT_TYPES = [
  "request_created",
  "request_submitted",
  "request_approved",
  "request_rejected",
  "request_cancelled",
  "access_granted",
  "task_assigned",
  "task_approved",
  "task_rejected",
  "clarification_requested",
  "clarification_responded",
  "send_back",
  "request_expired",
] as const;

export type EventType = typeof EVENT_TYPES[number];

// Available template variables
export const TEMPLATE_VARIABLES = [
  { key: "requestId", label: "Request ID", description: "The request reference number" },
  { key: "requestRefNo", label: "Request Ref No", description: "The formatted request reference" },
  { key: "requesterName", label: "Requester Name", description: "Name of the person who created the request" },
  { key: "requesterEmail", label: "Requester Email", description: "Email of the requester" },
  { key: "requesterPhone", label: "Requester Phone", description: "Phone number of the requester" },
  { key: "approverName", label: "Approver Name", description: "Name of the assigned approver" },
  { key: "siteName", label: "Site Name", description: "Name of the site for the request" },
  { key: "requestType", label: "Request Type", description: "Type of request (Admin Visit, TEP, etc.)" },
  { key: "stageName", label: "Stage Name", description: "Current approval stage name" },
  { key: "status", label: "Status", description: "Current request status" },
  { key: "comment", label: "Comment", description: "Approval/rejection comment" },
  { key: "visitorName", label: "Visitor Name", description: "Name of the visitor" },
  { key: "visitorPhone", label: "Visitor Phone", description: "Phone number of the visitor" },
  { key: "accessCode", label: "Access Code", description: "QR code or access credential" },
  { key: "portalUrl", label: "Portal URL", description: "Link to the Centre3 portal" },
  { key: "date", label: "Date", description: "Current date" },
  { key: "time", label: "Time", description: "Current time" },
] as const;

// ============================================================================
// MESSAGING SERVICE
// ============================================================================

class MessagingService {
  
  /**
   * Fire a system event — evaluates all matching trigger rules and sends messages.
   * This is the main entry point called from the workflow engine and request lifecycle.
   */
  async fireEvent(eventType: EventType, context: EventContext): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Messaging] Database not available, skipping event:", eventType);
        return;
      }

      // 1. Find all enabled trigger rules for this event type
      const rules = await db
        .select()
        .from(messageTriggerRules)
        .where(
          and(
            eq(messageTriggerRules.eventType, eventType),
            eq(messageTriggerRules.isEnabled, true)
          )
        );

      if (rules.length === 0) return;

      // 2. For each matching rule, evaluate conditions and send
      for (const rule of rules) {
        try {
          // Check scope conditions (site, request type)
          if (rule.siteId && context.siteId && rule.siteId !== context.siteId) continue;
          if (rule.requestTypeSlug && context.requestType && rule.requestTypeSlug !== context.requestType) continue;

          // Evaluate custom conditions if present
          if (rule.conditions) {
            const conditions = JSON.parse(rule.conditions);
            if (!this.evaluateConditions(conditions, context)) continue;
          }

          // 3. Resolve the recipient
          const recipients = await this.resolveRecipients(db, rule, context);
          if (recipients.length === 0) continue;

          // 4. Get the template
          const template = await db
            .select()
            .from(messageTemplates)
            .where(
              and(
                eq(messageTemplates.id, rule.templateId),
                eq(messageTemplates.isActive, true)
              )
            )
            .limit(1);

          if (template.length === 0) continue;

          // 5. Get the provider
          const provider = await this.getProvider(db, rule.integrationId);
          if (!provider) continue;

          // 6. Build variable context for template rendering
          const variables = await this.buildVariableContext(db, context);

          // 7. Send to each recipient
          for (const recipient of recipients) {
            const recipientVars: Record<string, string | undefined> = {
            recipientName: recipient.name,
            recipientPhone: recipient.phone,
            recipientEmail: recipient.email,
          };
          const renderedBody = this.renderTemplate(template[0].body, { ...variables, ...recipientVars });
            const channel = template[0].channel;

            // Create log entry
            const [logEntry] = await db.insert(messageLogs).values({
              triggerRuleId: rule.id,
              eventType,
              integrationId: rule.integrationId,
              providerType: provider.slug,
              channel,
              templateId: template[0].id,
              recipientPhone: recipient.phone,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              messageBody: renderedBody,
              requestId: context.requestId,
              taskId: context.taskId,
              userId: recipient.userId,
              status: "pending",
            });
            const logId = (logEntry as any).insertId;

            // Send the message
            let result: SendResult;
            if (channel === "sms") {
              result = await provider.sendSms({ to: recipient.phone || "", body: renderedBody });
            } else if (channel === "whatsapp") {
              result = await provider.sendWhatsApp({ to: recipient.phone || "", body: renderedBody });
            } else {
              // Email not yet implemented
              result = { success: false, errorCode: "UNSUPPORTED", errorMessage: "Email channel not yet implemented" };
            }

            // Update log with result
            await db
              .update(messageLogs)
              .set({
                status: result.success ? "sent" : "failed",
                providerMessageId: result.providerMessageId,
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                sentAt: result.success ? new Date() : undefined,
              })
              .where(eq(messageLogs.id, logId));

            if (!result.success) {
              console.warn(`[Messaging] Failed to send ${channel} to ${recipient.phone}: ${result.errorMessage}`);
            }
          }
        } catch (ruleError: any) {
          console.error(`[Messaging] Error processing rule ${rule.id}:`, ruleError.message);
        }
      }
    } catch (error: any) {
      console.error("[Messaging] Error firing event:", eventType, error.message);
    }
  }

  /**
   * Send a direct message (not triggered by an event rule).
   * Used for manual sends like "Resend Access Credentials".
   */
  async sendDirect(params: {
    channel: "sms" | "whatsapp";
    to: string;
    body: string;
    requestId?: number;
    userId?: number;
    recipientName?: string;
  }): Promise<SendResult> {
    const db = await getDb();
    if (!db) return { success: false, errorCode: "NO_DB", errorMessage: "Database not available" };

    const provider = await this.getProvider(db, null);
    if (!provider) return { success: false, errorCode: "NO_PROVIDER", errorMessage: "No messaging provider configured" };

    // Create log entry
    const [logEntry] = await db.insert(messageLogs).values({
      eventType: "direct_send",
      providerType: provider.slug,
      channel: params.channel,
      recipientPhone: params.to,
      recipientName: params.recipientName,
      messageBody: params.body,
      requestId: params.requestId,
      userId: params.userId,
      status: "pending",
    });
    const logId = (logEntry as any).insertId;

    let result: SendResult;
    if (params.channel === "sms") {
      result = await provider.sendSms({ to: params.to, body: params.body });
    } else {
      result = await provider.sendWhatsApp({ to: params.to, body: params.body });
    }

    await db
      .update(messageLogs)
      .set({
        status: result.success ? "sent" : "failed",
        providerMessageId: result.providerMessageId,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        sentAt: result.success ? new Date() : undefined,
      })
      .where(eq(messageLogs.id, logId));

    return result;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get the messaging provider instance, initialized with credentials.
   */
  private async getProvider(db: any, integrationId: number | null | undefined): Promise<MessagingProvider | null> {
    try {
      let integration;
      if (integrationId) {
        const result = await db
          .select()
          .from(integrations)
          .where(and(eq(integrations.id, integrationId), eq(integrations.isEnabled, true)))
          .limit(1);
        integration = result[0];
      } else {
        // Use default provider
        const result = await db
          .select()
          .from(integrations)
          .where(and(eq(integrations.isEnabled, true), eq(integrations.isDefault, true)))
          .limit(1);
        integration = result[0];
        
        // Fallback: any enabled provider
        if (!integration) {
          const fallback = await db
            .select()
            .from(integrations)
            .where(eq(integrations.isEnabled, true))
            .limit(1);
          integration = fallback[0];
        }
      }

      if (!integration) return null;

      const provider = createProvider(integration.providerType);
      if (!provider) return null;

      const credentials = integration.credentials ? JSON.parse(integration.credentials) : {};
      provider.initialize(credentials);
      return provider;
    } catch (error: any) {
      console.error("[Messaging] Error getting provider:", error.message);
      return null;
    }
  }

  /**
   * Resolve recipients based on the trigger rule's recipientType.
   */
  private async resolveRecipients(db: any, rule: any, context: EventContext): Promise<ResolvedRecipient[]> {
    const recipientConfig = rule.recipientConfig ? JSON.parse(rule.recipientConfig) : {};
    const recipients: ResolvedRecipient[] = [];

    switch (rule.recipientType) {
      case "requester": {
        if (context.requestId) {
          const req = await db.select().from(requests).where(eq(requests.id, context.requestId)).limit(1);
          if (req[0]?.createdBy) {
            const user = await db.select().from(users).where(eq(users.id, req[0].createdBy)).limit(1);
            if (user[0]) {
              recipients.push({ phone: user[0].phone, email: user[0].email, name: user[0].name, userId: user[0].id });
            }
          }
        }
        break;
      }

      case "approver": {
        if (context.approverUserId) {
          const user = await db.select().from(users).where(eq(users.id, context.approverUserId)).limit(1);
          if (user[0]) {
            recipients.push({ phone: user[0].phone, email: user[0].email, name: user[0].name, userId: user[0].id });
          }
        } else if (context.taskId) {
          const task = await db.select().from(approvalTasks).where(eq(approvalTasks.id, context.taskId)).limit(1);
          if (task[0]?.assignedToUserId) {
            const user = await db.select().from(users).where(eq(users.id, task[0].assignedToUserId)).limit(1);
            if (user[0]) {
              recipients.push({ phone: user[0].phone, email: user[0].email, name: user[0].name, userId: user[0].id });
            }
          }
        }
        break;
      }

      case "visitor": {
        if (context.requestId) {
          const visitors = await db.select().from(requestVisitors).where(eq(requestVisitors.requestId, context.requestId));
          for (const v of visitors) {
            if (v.phone || v.email) {
              recipients.push({ phone: v.phone, email: v.email, name: v.fullName || v.firstName, userId: undefined });
            }
          }
        }
        break;
      }

      case "host": {
        // Host is stored in form_data — would need to parse
        // For now, skip unless we add a hostUserId to context
        if (context.hostUserId) {
          const user = await db.select().from(users).where(eq(users.id, context.hostUserId)).limit(1);
          if (user[0]) {
            recipients.push({ phone: user[0].phone, email: user[0].email, name: user[0].name, userId: user[0].id });
          }
        }
        break;
      }

      case "site_manager": {
        // Would need a site_manager field on sites table — future enhancement
        break;
      }

      case "specific_user": {
        const userId = recipientConfig.userId;
        if (userId) {
          const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          if (user[0]) {
            recipients.push({ phone: user[0].phone, email: user[0].email, name: user[0].name, userId: user[0].id });
          }
        }
        break;
      }

      case "specific_number": {
        const phone = recipientConfig.phoneNumber;
        if (phone) {
          recipients.push({ phone, name: recipientConfig.name || "Unknown" });
        }
        break;
      }

      case "custom_field": {
        // Would parse form_data for the specified field code
        break;
      }
    }

    // Filter out recipients without phone numbers (for SMS/WhatsApp)
    return recipients.filter(r => r.phone);
  }

  /**
   * Build the variable context for template rendering.
   */
  private async buildVariableContext(db: any, context: EventContext): Promise<Record<string, string>> {
    const vars: Record<string, string> = {
      date: new Date().toLocaleDateString("en-GB"),
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      portalUrl: process.env.VITE_APP_URL || "https://centre3.manus.space",
    };

    // Request info
    if (context.requestId) {
      const req = await db.select().from(requests).where(eq(requests.id, context.requestId)).limit(1);
      if (req[0]) {
        vars.requestId = String(req[0].id);
        vars.requestRefNo = req[0].referenceNumber || `REQ-${req[0].id}`;
        vars.requestType = req[0].type || "";
        vars.status = req[0].status || "";

        // Requester info
        if (req[0].createdBy) {
          const requester = await db.select().from(users).where(eq(users.id, req[0].createdBy)).limit(1);
          if (requester[0]) {
            vars.requesterName = requester[0].name || "";
            vars.requesterEmail = requester[0].email || "";
            vars.requesterPhone = requester[0].phone || "";
          }
        }

        // Site info
        if (req[0].siteId) {
          const site = await db.select().from(sites).where(eq(sites.id, req[0].siteId)).limit(1);
          if (site[0]) {
            vars.siteName = site[0].name || "";
          }
        }
      }
    }

    // Approver info
    if (context.approverUserId) {
      const approver = await db.select().from(users).where(eq(users.id, context.approverUserId)).limit(1);
      if (approver[0]) {
        vars.approverName = approver[0].name || "";
      }
    }

    // Stage info
    if (context.stageName) {
      vars.stageName = context.stageName;
    }

    // Comment
    if (context.comment) {
      vars.comment = context.comment;
    }

    return vars;
  }

  /**
   * Render a template body by replacing {{variable}} placeholders.
   */
  private renderTemplate(body: string, variables: Record<string, string | undefined>): string {
    return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Evaluate custom conditions against the event context.
   */
  private evaluateConditions(conditions: any[], context: EventContext): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const contextValue = String(context[condition.field] || "");
      const conditionValue = String(condition.value || "");

      switch (condition.operator) {
        case "equals":
          if (contextValue !== conditionValue) return false;
          break;
        case "not_equals":
          if (contextValue === conditionValue) return false;
          break;
        case "contains":
          if (!contextValue.includes(conditionValue)) return false;
          break;
        case "in":
          const values = conditionValue.split(",").map(v => v.trim());
          if (!values.includes(contextValue)) return false;
          break;
        default:
          break;
      }
    }

    return true;
  }
}

// Singleton instance
export const messagingService = new MessagingService();
