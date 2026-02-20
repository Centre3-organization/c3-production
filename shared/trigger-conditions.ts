/**
 * Predefined trigger conditions for Security Alerts
 * These are common conditions that guards and admins can select from
 */

export interface TriggerConditionTemplate {
  id: string;
  label: string;
  description: string;
  field: string;
  operators: string[];
  defaultOperator: string;
  valueType: "text" | "number" | "select" | "date" | "boolean";
  values?: Array<{ label: string; value: string }>;
  category: "visitor" | "request" | "checkpoint" | "system";
}

export const PREDEFINED_TRIGGER_CONDITIONS: TriggerConditionTemplate[] = [
  // Visitor-based conditions
  {
    id: "visitor_watchlist",
    label: "Visitor on Watchlist",
    description: "Trigger when visitor is on watchlist",
    field: "visitor.onWatchlist",
    operators: ["equals", "not_equals"],
    defaultOperator: "equals",
    valueType: "boolean",
    values: [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" }
    ],
    category: "visitor"
  },
  {
    id: "visitor_nationality",
    label: "Visitor Nationality",
    description: "Trigger based on visitor nationality",
    field: "visitor.nationality",
    operators: ["equals", "not_equals", "contains"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "Saudi Arabia", value: "SA" },
      { label: "United Arab Emirates", value: "AE" },
      { label: "Kuwait", value: "KW" },
      { label: "Qatar", value: "QA" },
      { label: "Bahrain", value: "BH" },
      { label: "Oman", value: "OM" },
      { label: "Other", value: "OTHER" }
    ],
    category: "visitor"
  },
  {
    id: "visitor_id_type",
    label: "Visitor ID Type",
    description: "Trigger based on ID document type",
    field: "visitor.idType",
    operators: ["equals", "not_equals"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "National ID", value: "national_id" },
      { label: "Iqama", value: "iqama" },
      { label: "Passport", value: "passport" },
      { label: "Driving License", value: "driving_license" }
    ],
    category: "visitor"
  },
  {
    id: "visitor_age",
    label: "Visitor Age",
    description: "Trigger based on visitor age",
    field: "visitor.age",
    operators: ["greater_than", "less_than", "equals", "between"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "visitor"
  },
  {
    id: "visitor_previous_denials",
    label: "Previous Denials",
    description: "Trigger when visitor has multiple previous denials",
    field: "visitor.denialCount",
    operators: ["greater_than", "equals", "less_than"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "visitor"
  },

  // Request-based conditions
  {
    id: "request_status",
    label: "Request Status",
    description: "Trigger based on request approval status",
    field: "request.status",
    operators: ["equals", "not_equals"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
      { label: "Expired", value: "expired" }
    ],
    category: "request"
  },
  {
    id: "request_type",
    label: "Request Type",
    description: "Trigger based on request type",
    field: "request.type",
    operators: ["equals", "not_equals"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "Visitor", value: "visitor" },
      { label: "Contractor", value: "contractor" },
      { label: "Delivery", value: "delivery" },
      { label: "Maintenance", value: "maintenance" }
    ],
    category: "request"
  },
  {
    id: "request_approval_count",
    label: "Approval Count",
    description: "Trigger based on number of approvals",
    field: "request.approvalCount",
    operators: ["greater_than", "equals", "less_than"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "request"
  },
  {
    id: "request_expiry_soon",
    label: "Request Expiring Soon",
    description: "Trigger when request is expiring within X hours",
    field: "request.expiresIn",
    operators: ["less_than"],
    defaultOperator: "less_than",
    valueType: "number",
    category: "request"
  },

  // Checkpoint-based conditions
  {
    id: "checkpoint_access_zone",
    label: "Access Zone",
    description: "Trigger based on access zone",
    field: "checkpoint.zone",
    operators: ["equals", "not_equals", "contains"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "Secure Area A", value: "secure_a" },
      { label: "Secure Area B", value: "secure_b" },
      { label: "Data Center", value: "data_center" },
      { label: "Executive Floor", value: "executive" }
    ],
    category: "checkpoint"
  },
  {
    id: "checkpoint_time_of_day",
    label: "Time of Day",
    description: "Trigger based on access time",
    field: "checkpoint.hour",
    operators: ["greater_than", "less_than", "between"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "checkpoint"
  },
  {
    id: "checkpoint_day_of_week",
    label: "Day of Week",
    description: "Trigger based on day of week",
    field: "checkpoint.dayOfWeek",
    operators: ["equals", "not_equals"],
    defaultOperator: "equals",
    valueType: "select",
    values: [
      { label: "Monday", value: "1" },
      { label: "Tuesday", value: "2" },
      { label: "Wednesday", value: "3" },
      { label: "Thursday", value: "4" },
      { label: "Friday", value: "5" },
      { label: "Saturday", value: "6" },
      { label: "Sunday", value: "0" }
    ],
    category: "checkpoint"
  },

  // System conditions
  {
    id: "system_consecutive_denials",
    label: "Consecutive Denials",
    description: "Trigger when N consecutive denials occur",
    field: "system.consecutiveDenials",
    operators: ["greater_than", "equals"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "system"
  },
  {
    id: "system_same_day_visits",
    label: "Same Day Multiple Visits",
    description: "Trigger when visitor visits multiple times in same day",
    field: "system.sameDayVisitCount",
    operators: ["greater_than"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "system"
  },
  {
    id: "system_anomaly_score",
    label: "Anomaly Score",
    description: "Trigger when anomaly detection score exceeds threshold",
    field: "system.anomalyScore",
    operators: ["greater_than"],
    defaultOperator: "greater_than",
    valueType: "number",
    category: "system"
  }
];

export const STATUS_ON_TRIGGER_OPTIONS = [
  { label: "Alert Triggered", value: "alert_triggered" },
  { label: "Access Denied", value: "access_denied" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Escalated", value: "escalated" },
  { label: "Under Investigation", value: "under_investigation" },
  { label: "Quarantined", value: "quarantined" }
];

export const ACTION_POINT_TYPES = [
  { label: "Deny Entry", value: "deny_entry", description: "Automatically deny access" },
  { label: "Alert Supervisor", value: "alert_supervisor", description: "Send alert to supervisor" },
  { label: "Call Security", value: "call_security", description: "Trigger security call" },
  { label: "Escalate", value: "escalate", description: "Escalate to higher authority" },
  { label: "Monitor", value: "monitor", description: "Add to monitoring list" },
  { label: "Log Incident", value: "log_incident", description: "Create incident log" },
  { label: "Notify Host", value: "notify_host", description: "Notify visitor's host" },
  { label: "Quarantine", value: "quarantine", description: "Place in quarantine zone" }
];

export const NOTIFICATION_CHANNELS = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "In-App", value: "in_app" },
  { label: "Webhook", value: "webhook" }
];

export const NOTIFICATION_TRIGGERS = [
  { label: "Alert Created", value: "alert_created" },
  { label: "Alert Escalated", value: "alert_escalated" },
  { label: "Action Taken", value: "action_taken" },
  { label: "Alert Resolved", value: "alert_resolved" }
];

export const ESCALATION_LEVELS = [
  { label: "Level 1 - Supervisor", value: 1 },
  { label: "Level 2 - Manager", value: 2 },
  { label: "Level 3 - Director", value: 3 },
  { label: "Level 4 - Executive", value: 4 }
];
