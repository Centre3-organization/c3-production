import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";

// ============================================================================
// EXISTING TABLES (matching current database structure)
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  departmentId: int("departmentId"),
  // Approval management fields
  managerId: int("managerId"),
  alternateManagerId: int("alternateManagerId"),
  employeeType: mysqlEnum("employeeType", ["internal", "external", "contractor"]).default("internal"),
  workScheduleId: int("workScheduleId"),
  defaultSiteId: int("defaultSiteId"),
  canDelegate: boolean("canDelegate").default(false),
  maxDelegationDays: int("maxDelegationDays").default(30),
  approvalAuthorityLevel: int("approvalAuthorityLevel").default(0),
  outOfOfficeUntil: timestamp("outOfOfficeUntil"),
  outOfOfficeDelegateId: int("outOfOfficeDelegateId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  stage: mysqlEnum("stage", ["l1", "manual"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approverId: int("approverId"),
  comments: text("comments"),
  entryMethod: mysqlEnum("entryMethod", ["manual", "rfid", "card"]),
  cardNumber: varchar("cardNumber", { length: 50 }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

export const areaTypes = mysqlTable("areaTypes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AreaType = typeof areaTypes.$inferSelect;
export type InsertAreaType = typeof areaTypes.$inferInsert;

// ============================================================================
// NEW TABLES TO BE CREATED
// ============================================================================

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  costCenter: varchar("costCenter", { length: 50 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").$type<Record<string, Record<string, boolean>>>().notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;

export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

export const siteTypes = mysqlTable("siteTypes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SiteType = typeof siteTypes.$inferSelect;
export type InsertSiteType = typeof siteTypes.$inferInsert;

export const zoneTypes = mysqlTable("zoneTypes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ZoneType = typeof zoneTypes.$inferSelect;
export type InsertZoneType = typeof zoneTypes.$inferInsert;

export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  countryId: int("countryId"),
  regionId: int("regionId"),
  cityId: int("cityId"),
  address: text("address"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  siteTypeId: int("siteTypeId"),
  category: mysqlEnum("category", ["primary", "secondary", "tertiary"]).default("primary"),
  maxCapacity: int("maxCapacity").default(0).notNull(),
  currentOccupancy: int("currentOccupancy").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "maintenance", "offline"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

export const zones = mysqlTable("zones", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  zoneTypeId: int("zoneTypeId"),
  securityLevel: mysqlEnum("securityLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  accessPolicy: mysqlEnum("accessPolicy", ["open", "supervised", "restricted", "prohibited"]).default("supervised"),
  maxCapacity: int("maxCapacity").default(0).notNull(),
  currentOccupancy: int("currentOccupancy").default(0).notNull(),
  securityControls: json("securityControls").$type<{
    cctvEnabled?: boolean;
    biometricRequired?: boolean;
    badgeRequired?: boolean;
    emergencyLock?: boolean;
    fireSuppress?: boolean;
    tempMonitor?: boolean;
  }>(),
  isLocked: boolean("isLocked").default(false).notNull(),
  lockedBy: int("lockedBy"),
  lockedAt: timestamp("lockedAt"),
  lockReason: text("lockReason"),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Zone = typeof zones.$inferSelect;
export type InsertZone = typeof zones.$inferInsert;

export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  areaTypeId: int("areaTypeId"),
  floor: varchar("floor", { length: 10 }),
  maxCapacity: int("maxCapacity").default(0).notNull(),
  rackCount: int("rackCount").default(0),
  infrastructureSpecs: json("infrastructureSpecs").$type<{
    powerType?: "AC" | "DC" | "Both";
    coolingType?: "Air" | "Liquid" | "Immersion";
    escortRequired?: boolean;
    cagedArea?: boolean;
  }>(),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Area = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;

export const securityAlerts = mysqlTable("securityAlerts", {
  id: int("id").autoincrement().primaryKey(),
  siteId: int("siteId").notNull(),
  zoneId: int("zoneId"),
  type: mysqlEnum("type", [
    "door_forced", 
    "unauthorized_access", 
    "tailgating", 
    "fire", 
    "intrusion", 
    "system_failure",
    "manual_trigger"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["new", "viewed", "in_progress", "resolved", "false_alarm"]).default("new").notNull(),
  viewedBy: int("viewedBy"),
  viewedAt: timestamp("viewedAt"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertSecurityAlert = typeof securityAlerts.$inferInsert;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const requests = mysqlTable("requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", [
    "admin_visit", 
    "work_permit", 
    "material_entry", 
    "tep", 
    "mop", 
    "escort"
  ]).notNull(),
  status: mysqlEnum("status", [
    "draft", 
    "pending_l1", 
    "pending_manual", 
    "pending_approval",
    "approved", 
    "rejected", 
    "cancelled", 
    "expired"
  ]).default("draft").notNull(),
  requestorId: int("requestorId").notNull(),
  visitorName: varchar("visitorName", { length: 100 }).notNull(),
  visitorIdType: mysqlEnum("visitorIdType", ["national_id", "iqama", "passport"]).notNull(),
  visitorIdNumber: varchar("visitorIdNumber", { length: 50 }).notNull(),
  visitorCompany: varchar("visitorCompany", { length: 100 }),
  visitorPhone: varchar("visitorPhone", { length: 20 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  hostId: int("hostId"),
  siteId: int("siteId").notNull(),
  purpose: text("purpose"),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

export const requestZones = mysqlTable("requestZones", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  zoneId: int("zoneId").notNull(),
});

export type RequestZone = typeof requestZones.$inferSelect;
export type InsertRequestZone = typeof requestZones.$inferInsert;

export const requestAssets = mysqlTable("requestAssets", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  assetType: mysqlEnum("assetType", ["laptop", "camera", "tool", "material", "other"]).notNull(),
  description: varchar("description", { length: 200 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  quantity: int("quantity").default(1).notNull(),
});

export type RequestAsset = typeof requestAssets.$inferSelect;
export type InsertRequestAsset = typeof requestAssets.$inferInsert;

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ============================================================================
// GROUP MANAGEMENT SYSTEM TABLES
// ============================================================================

/**
 * Groups table - Hierarchical organizational structure
 * Supports internal departments and external vendor organizations
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  groupType: mysqlEnum("groupType", ["internal", "external"]).notNull(),
  parentGroupId: int("parentGroupId"),
  description: text("description"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdBy: int("createdBy"),
  metadata: json("metadata").$type<{
    contactEmail?: string;
    contactPhone?: string;
    contractNumber?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    notes?: string;
  }>(),
  // Approval management fields
  groupCategory: varchar("groupCategory", { length: 50 }), // department, vendor, contractor, project
  requiresApprovalChain: boolean("requiresApprovalChain").default(false),
  defaultWorkflowId: int("defaultWorkflowId"),
  approvalConfig: json("approvalConfig").$type<{
    internalReviewRequired?: boolean;
    internalReviewerGroupId?: number;
    maxAutoApproveValue?: number;
    requireMfaForApproval?: boolean;
    approvalChainLevels?: Array<{
      level: number;
      role: string;
      routeToInternal?: boolean;
    }>;
  }>(),
  internalLiaisonUserId: int("internalLiaisonUserId"),
  internalLiaisonGroupId: int("internalLiaisonGroupId"),
  slaOverrideHours: int("slaOverrideHours"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Riyadh"),
  workingHours: json("workingHours").$type<{
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * User-Group Membership table
 * Links users to groups with membership details
 */
export const userGroupMembership = mysqlTable("userGroupMembership", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  isPrimaryGroup: boolean("isPrimaryGroup").default(false).notNull(),
  assignedBy: int("assignedBy"),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  // Approval management fields
  roleInGroup: varchar("roleInGroup", { length: 100 }), // e.g., "manager", "tech_lead", "engineer"
  reportsToUserId: int("reportsToUserId"),
  canApprove: boolean("canApprove").default(false),
  approvalLimit: decimal("approvalLimit", { precision: 15, scale: 2 }),
  isGroupAdmin: boolean("isGroupAdmin").default(false),
  notificationPreferences: json("notificationPreferences").$type<{
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserGroupMembership = typeof userGroupMembership.$inferSelect;
export type InsertUserGroupMembership = typeof userGroupMembership.$inferInsert;

/**
 * Group Access Policy table
 * Defines what resources a group can access and at what level
 */
export const groupAccessPolicy = mysqlTable("groupAccessPolicy", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  resourceType: mysqlEnum("resourceType", [
    "site", 
    "zone", 
    "area", 
    "system", 
    "application", 
    "data"
  ]).notNull(),
  resourceId: int("resourceId"),
  accessLevel: mysqlEnum("accessLevel", [
    "none", 
    "read", 
    "write", 
    "execute", 
    "delete", 
    "admin"
  ]).default("read").notNull(),
  timeRestriction: json("timeRestriction").$type<{
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  }>(),
  ipRestrictions: json("ipRestrictions").$type<string[]>(),
  requiresMfa: boolean("requiresMfa").default(false).notNull(),
  requiresApproval: boolean("requiresApproval").default(false).notNull(),
  requiresEscort: boolean("requiresEscort").default(false).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupAccessPolicy = typeof groupAccessPolicy.$inferSelect;
export type InsertGroupAccessPolicy = typeof groupAccessPolicy.$inferInsert;

/**
 * Group Security Settings table
 * Defines security requirements for a group
 */
export const groupSecuritySettings = mysqlTable("groupSecuritySettings", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull().unique(),
  sessionTimeoutMinutes: int("sessionTimeoutMinutes").default(30).notNull(),
  passwordComplexityLevel: mysqlEnum("passwordComplexityLevel", [
    "basic", 
    "standard", 
    "high"
  ]).default("standard").notNull(),
  mfaRequired: boolean("mfaRequired").default(false).notNull(),
  allowedIpRanges: json("allowedIpRanges").$type<string[]>(),
  allowedLocations: json("allowedLocations").$type<string[]>(),
  auditLevel: mysqlEnum("auditLevel", [
    "basic", 
    "detailed", 
    "comprehensive"
  ]).default("basic").notNull(),
  accessReviewFrequency: mysqlEnum("accessReviewFrequency", [
    "monthly", 
    "quarterly", 
    "annually", 
    "never"
  ]).default("quarterly").notNull(),
  maxConcurrentSessions: int("maxConcurrentSessions").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupSecuritySettings = typeof groupSecuritySettings.$inferSelect;
export type InsertGroupSecuritySettings = typeof groupSecuritySettings.$inferInsert;


// ============================================================================
// DYNAMIC APPROVAL WORKFLOW MODULE
// ============================================================================

/**
 * Approval Roles - Defines roles that can participate in approval workflows
 * Maps to organizational positions like WS Regional Manager, GS Manager, etc.
 */
export const approvalRoles = mysqlTable("approvalRoles", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  level: int("level").notNull().default(1), // Hierarchy level (1 = lowest)
  processTypes: json("processTypes").$type<string[]>(), // Which processes this role can approve
  canFinalApprove: boolean("canFinalApprove").default(false).notNull(),
  canReject: boolean("canReject").default(true).notNull(),
  canRequestInfo: boolean("canRequestInfo").default(true).notNull(),
  canDelegate: boolean("canDelegate").default(false).notNull(),
  maxSlaHours: int("maxSlaHours"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalRole = typeof approvalRoles.$inferSelect;
export type InsertApprovalRole = typeof approvalRoles.$inferInsert;

/**
 * User-Approval Role Mapping
 * Assigns approval roles to users with optional site/region restrictions
 */
export const userApprovalRoles = mysqlTable("userApprovalRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  approvalRoleId: int("approvalRoleId").notNull(),
  siteIds: json("siteIds").$type<number[]>(), // NULL means all sites
  regionIds: json("regionIds").$type<string[]>(), // NULL means all regions
  isPrimary: boolean("isPrimary").default(true).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserApprovalRole = typeof userApprovalRoles.$inferSelect;
export type InsertUserApprovalRole = typeof userApprovalRoles.$inferInsert;

/**
 * Approval Workflows - Primary table storing workflow definitions
 */
export const approvalWorkflows = mysqlTable("approvalWorkflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  processType: mysqlEnum("processType", [
    "admin_visit", 
    "work_permit", 
    "material_entry", 
    "tep", 
    "mop", 
    "escort",
    "mcm",
    "tdp",
    "mhv"
  ]),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(), // Higher priority = evaluated first
  isDefault: boolean("isDefault").default(false).notNull(), // Default workflow for process type
  version: int("version").default(1).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;

/**
 * Workflow Conditions - Conditions that determine when a workflow applies
 */
export const workflowConditions = mysqlTable("workflowConditions", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  conditionType: mysqlEnum("conditionType", [
    "process_type",
    "category",
    "sub_category",
    "site_id",
    "region",
    "zone_id",
    "requester_group",
    "requester_type",
    "activity_risk",
    "has_mop",
    "has_mhv",
    "visitor_count",
    "time_range",
    "request_duration",
    "vip_visit"
  ]).notNull(),
  conditionOperator: mysqlEnum("conditionOperator", [
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
    "is_not_null"
  ]).notNull(),
  conditionValue: json("conditionValue").notNull(), // JSON value for flexible matching
  logicalGroup: int("logicalGroup").default(0).notNull(), // For AND/OR grouping
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowCondition = typeof workflowConditions.$inferSelect;
export type InsertWorkflowCondition = typeof workflowConditions.$inferInsert;

/**
 * Approval Stages - Defines stages within a workflow
 */
export const approvalStages = mysqlTable("approvalStages", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stageOrder: int("stageOrder").notNull(),
  stageName: varchar("stageName", { length: 255 }).notNull(),
  stageType: mysqlEnum("stageType", [
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
    "custom_resolver"
  ]).notNull(),
  approvalMode: mysqlEnum("approvalMode", ["any", "all", "percentage"]).default("any").notNull(),
  requiredApprovals: int("requiredApprovals").default(1).notNull(),
  approvalPercentage: int("approvalPercentage"), // For percentage mode (0-100)
  canReject: boolean("canReject").default(true).notNull(),
  canRequestInfo: boolean("canRequestInfo").default(true).notNull(),
  slaHours: int("slaHours"), // NULL means no SLA
  autoApproveOnSla: boolean("autoApproveOnSla").default(false).notNull(),
  autoRejectOnSla: boolean("autoRejectOnSla").default(false).notNull(),
  isConditional: boolean("isConditional").default(false).notNull(),
  conditionExpression: json("conditionExpression").$type<object>(), // For conditional stages
  timeRestrictions: json("timeRestrictions").$type<{
    allowedHours?: { start: string; end: string };
    allowedDays?: number[];
    timezone?: string;
    behaviorOutsideWindow?: "queue" | "assign_oncall" | "skip" | "escalate";
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalStage = typeof approvalStages.$inferSelect;
export type InsertApprovalStage = typeof approvalStages.$inferInsert;

/**
 * Stage Approvers - Maps stages to their potential approvers
 */
export const stageApprovers = mysqlTable("stageApprovers", {
  id: int("id").autoincrement().primaryKey(),
  stageId: int("stageId").notNull(),
  approverType: mysqlEnum("approverType", [
    "user",
    "role",
    "approval_role",
    "group",
    "group_role",
    "hierarchy_level",
    "dynamic_field",
    "shift_assignment",
    "manager_chain"
  ]).notNull(),
  approverReference: varchar("approverReference", { length: 255 }), // User ID, role code, group ID, field name
  approverConfig: json("approverConfig").$type<{
    roleInGroup?: string;
    startFrom?: string;
    traverse?: "up" | "down";
    levels?: number;
    stopAtGroupType?: string;
    fieldType?: string;
    scheduleId?: number;
    roleInShift?: string;
    fallback?: string;
    filterBySite?: boolean;
    skipIfSameAsPrevious?: boolean;
  }>(),
  priority: int("priority").default(0).notNull(),
  isBackup: boolean("isBackup").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StageApprover = typeof stageApprovers.$inferSelect;
export type InsertStageApprover = typeof stageApprovers.$inferInsert;

/**
 * Escalation Rules - Defines what happens when SLA is breached
 */
export const escalationRules = mysqlTable("escalationRules", {
  id: int("id").autoincrement().primaryKey(),
  stageId: int("stageId").notNull(),
  escalationOrder: int("escalationOrder").notNull(),
  triggerType: mysqlEnum("triggerType", [
    "no_response",
    "sla_warning",
    "sla_breach"
  ]).notNull(),
  triggerValue: int("triggerValue").notNull(), // Hours after task creation
  actionType: mysqlEnum("actionType", [
    "notify_approver",
    "notify_escalation",
    "notify_admin",
    "add_approver",
    "replace_approver",
    "escalate_stage",
    "auto_approve",
    "auto_reject"
  ]).notNull(),
  actionConfig: json("actionConfig").$type<{
    template?: string;
    notify?: string[];
    addBackup?: boolean;
    addRole?: string;
    replaceWith?: string;
    skipToStage?: number;
    addNote?: string;
    priority?: string;
    message?: string;
  }>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EscalationRule = typeof escalationRules.$inferSelect;
export type InsertEscalationRule = typeof escalationRules.$inferInsert;

/**
 * Shift Schedules - Defines shift schedules for sites
 */
export const shiftSchedules = mysqlTable("shiftSchedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  siteId: int("siteId"), // NULL for default schedule
  timezone: varchar("timezone", { length: 50 }).default("Asia/Riyadh").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftSchedule = typeof shiftSchedules.$inferSelect;
export type InsertShiftSchedule = typeof shiftSchedules.$inferInsert;

/**
 * Shift Definitions - Defines individual shifts within a schedule
 */
export const shiftDefinitions = mysqlTable("shiftDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM format
  daysOfWeek: json("daysOfWeek").$type<number[]>().notNull(), // 0=Sunday, 6=Saturday
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftDefinition = typeof shiftDefinitions.$inferSelect;
export type InsertShiftDefinition = typeof shiftDefinitions.$inferInsert;

/**
 * Shift Assignments - Assigns users to shifts with roles
 */
export const shiftAssignments = mysqlTable("shiftAssignments", {
  id: int("id").autoincrement().primaryKey(),
  shiftId: int("shiftId").notNull(),
  userId: int("userId").notNull(),
  roleInShift: varchar("roleInShift", { length: 100 }).notNull(), // e.g., "Security Incharge"
  isPrimary: boolean("isPrimary").default(true).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type InsertShiftAssignment = typeof shiftAssignments.$inferInsert;

/**
 * Approval Delegations - Temporary delegation of approval authority
 */
export const approvalDelegations = mysqlTable("approvalDelegations", {
  id: int("id").autoincrement().primaryKey(),
  delegatorId: int("delegatorId").notNull(), // User delegating authority
  delegateId: int("delegateId").notNull(), // User receiving authority
  delegationType: mysqlEnum("delegationType", ["full", "partial"]).default("full").notNull(),
  processTypes: json("processTypes").$type<string[]>(), // NULL means all processes
  siteIds: json("siteIds").$type<number[]>(), // NULL means all sites
  approvalRoleIds: json("approvalRoleIds").$type<number[]>(), // NULL means all roles
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  reason: text("reason"),
  isActive: boolean("isActive").default(true).notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedBy: int("revokedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalDelegation = typeof approvalDelegations.$inferSelect;
export type InsertApprovalDelegation = typeof approvalDelegations.$inferInsert;

/**
 * Approval Instances - Runtime instances of workflows for requests
 */
export const approvalInstances = mysqlTable("approvalInstances", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  requestType: varchar("requestType", { length: 50 }).notNull(),
  workflowId: int("workflowId").notNull(),
  currentStageId: int("currentStageId"),
  currentStageOrder: int("currentStageOrder").default(1).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "approved",
    "rejected",
    "cancelled",
    "info_requested"
  ]).default("pending").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  metadata: json("metadata").$type<{
    totalStages?: number;
    completedStages?: number;
    lastActionBy?: number;
    lastActionAt?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalInstance = typeof approvalInstances.$inferSelect;
export type InsertApprovalInstance = typeof approvalInstances.$inferInsert;

/**
 * Approval Tasks - Individual approval tasks assigned to approvers
 */
export const approvalTasks = mysqlTable("approvalTasks", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  stageId: int("stageId").notNull(),
  assignedTo: int("assignedTo").notNull(),
  assignedVia: mysqlEnum("assignedVia", [
    "direct",
    "role",
    "group",
    "shift",
    "delegation",
    "escalation"
  ]).notNull(),
  originalAssignee: int("originalAssignee"), // If assigned via delegation
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
    "info_requested",
    "reassigned",
    "expired",
    "skipped"
  ]).default("pending").notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected", "info_requested"]),
  comments: text("comments"),
  infoRequest: json("infoRequest").$type<{
    questions?: string[];
    requiredDocuments?: string[];
    deadlineHours?: number;
  }>(),
  dueAt: timestamp("dueAt"),
  decidedAt: timestamp("decidedAt"),
  remindersSent: int("remindersSent").default(0).notNull(),
  lastReminderAt: timestamp("lastReminderAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalTask = typeof approvalTasks.$inferSelect;
export type InsertApprovalTask = typeof approvalTasks.$inferInsert;

/**
 * Approval History - Complete audit trail of all approval actions
 */
export const approvalHistory = mysqlTable("approvalHistory", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  taskId: int("taskId"),
  stageId: int("stageId"),
  actionType: mysqlEnum("actionType", [
    "workflow_started",
    "workflow_completed",
    "stage_started",
    "stage_completed",
    "task_assigned",
    "task_reassigned",
    "decision_made",
    "info_requested",
    "info_provided",
    "escalation_triggered",
    "delegation_applied",
    "sla_warning",
    "sla_breach",
    "comment_added",
    "document_attached"
  ]).notNull(),
  actionBy: int("actionBy"), // NULL for system actions
  actionByType: mysqlEnum("actionByType", ["user", "system", "scheduler"]).default("user").notNull(),
  details: json("details").$type<{
    previousStatus?: string;
    newStatus?: string;
    decision?: string;
    comments?: string;
    assignee?: number;
    assigneeName?: string;
    stageName?: string;
    stageOrder?: number;
    workflowName?: string;
    firstStageName?: string;
    escalationRule?: string;
    delegationId?: number;
    questions?: string[];
    requiredDocuments?: string[];
    totalStages?: number;
    completedStages?: number;
    entryMethod?: string;
    cardNumber?: string;
  }>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  actionAt: timestamp("actionAt").defaultNow().notNull(),
});

export type ApprovalHistoryEntry = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistoryEntry = typeof approvalHistory.$inferInsert;
