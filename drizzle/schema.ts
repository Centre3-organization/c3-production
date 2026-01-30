import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, date } from "drizzle-orm/mysql-core";

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
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
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
  // New user type fields
  userType: mysqlEnum("userType", ["centre3_employee", "contractor", "sub_contractor", "client"]).default("centre3_employee"),
  employeeId: varchar("employeeId", { length: 50 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  // Contractor/Sub-Contractor/Client fields
  contractorCompanyId: int("contractorCompanyId"),
  parentContractorId: int("parentContractorId"),
  subContractorCompany: varchar("subContractorCompany", { length: 255 }),
  clientCompanyId: int("clientCompanyId"),
  contractReference: varchar("contractReference", { length: 100 }),
  contractExpiry: timestamp("contractExpiry"),
  reportingToId: int("reportingToId"),
  accountManagerId: int("accountManagerId"),
  profilePhotoUrl: varchar("profilePhotoUrl", { length: 500 }),
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
  parentId: int("parentId"),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  level: int("level").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
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

// ============================================================================
// ACTIVITIES (Main Activities and Sub-Activities)
// ============================================================================

export const mainActivities = mysqlTable("mainActivities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MainActivity = typeof mainActivities.$inferSelect;
export type InsertMainActivity = typeof mainActivities.$inferInsert;

export const subActivities = mysqlTable("subActivities", {
  id: int("id").autoincrement().primaryKey(),
  mainActivityId: int("mainActivityId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  // Requirement flags from Excel
  needsRFC: boolean("needsRFC").default(false).notNull(),
  needsHRS: boolean("needsHRS").default(false).notNull(),
  needsMOP: boolean("needsMOP").default(false).notNull(),
  needsMHV: boolean("needsMHV").default(false).notNull(),
  needsRoomSelection: boolean("needsRoomSelection").default(false).notNull(),
  // Legacy fields (kept for compatibility)
  requiresMOP: boolean("requiresMOP").default(false).notNull(),
  requiresPermit: boolean("requiresPermit").default(false).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubActivity = typeof subActivities.$inferSelect;
export type InsertSubActivity = typeof subActivities.$inferInsert;

// ============================================================================
// ROLE TYPES (for visitor/contractor categorization)
// ============================================================================

export const roleTypes = mysqlTable("roleTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  category: mysqlEnum("category", ["internal", "external", "contractor", "visitor"]).default("internal"),
  accessLevel: mysqlEnum("accessLevel", ["basic", "standard", "elevated", "full"]).default("standard"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoleType = typeof roleTypes.$inferSelect;
export type InsertRoleType = typeof roleTypes.$inferInsert;

// ============================================================================
// APPROVERS (site/region-specific approval authorities)
// ============================================================================

export const approvers = mysqlTable("approvers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId"),
  regionId: int("regionId"),
  approvalLevel: int("approvalLevel").default(1).notNull(),
  maxApprovalAmount: varchar("maxApprovalAmount", { length: 20 }),
  canApproveEmergency: boolean("canApproveEmergency").default(false).notNull(),
  canApproveVIP: boolean("canApproveVIP").default(false).notNull(),
  delegateUserId: int("delegateUserId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Approver = typeof approvers.$inferSelect;
export type InsertApprover = typeof approvers.$inferInsert;

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
  parentId: int("parentId"),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  level: int("level").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SiteType = typeof siteTypes.$inferSelect;
export type InsertSiteType = typeof siteTypes.$inferInsert;

export const zoneTypes = mysqlTable("zoneTypes", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  level: int("level").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
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
  
  // Dynamic Request Type System fields
  categoryId: int("categoryId"),
  selectedTypeIds: json("selectedTypeIds").$type<number[]>(),
  formData: json("formData").$type<Record<string, unknown>>(),
  
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
    "access_level"
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
    "info_requested",
    "need_clarification"
  ]).default("pending").notNull(),
  // Access grant fields - set on final approval
  entryMethod: mysqlEnum("entryMethod", ["qr_code", "rfid", "card"]),
  qrCodeData: varchar("qrCodeData", { length: 500 }), // Unique QR code identifier
  rfidTag: varchar("rfidTag", { length: 100 }),
  cardNumber: varchar("cardNumber", { length: 100 }),
  accessGrantedBy: int("accessGrantedBy"),
  accessGrantedAt: timestamp("accessGrantedAt"),
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
    "need_clarification",
    "info_requested",
    "reassigned",
    "expired",
    "skipped"
  ]).default("pending").notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected", "info_requested", "need_clarification"]),
  comments: text("comments"),
  clarificationTarget: mysqlEnum("clarificationTarget", ["last_approver", "requestor"]),
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
    qrCodeData?: string;
    rfidTag?: string;
    clarificationTarget?: string;
    targetInfo?: string;
  }>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  actionAt: timestamp("actionAt").defaultNow().notNull(),
});

export type ApprovalHistoryEntry = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistoryEntry = typeof approvalHistory.$inferInsert;


// ============================================================================
// DYNAMIC REQUEST TYPE SYSTEM TABLES
// ============================================================================

/**
 * Request Categories - Base processes (Admin Visit, Technical & Delivery)
 */
export const requestCategories = mysqlTable("requestCategories", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Access Control
  requiresInternalOnly: boolean("requiresInternalOnly").default(false).notNull(),
  allowedGroupIds: json("allowedGroupIds").$type<number[]>(),
  
  // Sub-type Configuration
  allowMultipleTypes: boolean("allowMultipleTypes").default(false).notNull(),
  typeCombinationRules: json("typeCombinationRules").$type<{
    [typeCode: string]: {
      exclusive?: boolean;
      canCombine?: string[];
      disables?: string[];
    };
  }>(),
  
  // Common Sections (shared across all types in this category)
  hasRequestorSection: boolean("hasRequestorSection").default(true).notNull(),
  hasLocationSection: boolean("hasLocationSection").default(true).notNull(),
  hasScheduleSection: boolean("hasScheduleSection").default(true).notNull(),
  hasVisitorSection: boolean("hasVisitorSection").default(true).notNull(),
  hasAttachmentSection: boolean("hasAttachmentSection").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RequestCategory = typeof requestCategories.$inferSelect;
export type InsertRequestCategory = typeof requestCategories.$inferInsert;

/**
 * Request Types - Sub-processes (TEP, WP, MOP, MHV)
 */
export const requestTypes = mysqlTable("requestTypes", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  shortCode: varchar("shortCode", { length: 10 }),
  description: text("description"),
  
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Combination Rules
  isExclusive: boolean("isExclusive").default(false).notNull(),
  maxDurationDays: int("maxDurationDays"),
  
  // Workflow
  workflowId: int("workflowId"),
  
  // Output Config
  generateQrCode: boolean("generateQrCode").default(true).notNull(),
  generateDcpForm: boolean("generateDcpForm").default(true).notNull(),
  notifyEmail: boolean("notifyEmail").default(true).notNull(),
  notifySms: boolean("notifySms").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RequestType = typeof requestTypes.$inferSelect;
export type InsertRequestType = typeof requestTypes.$inferInsert;

/**
 * Form Sections - Tabs within a request type form
 */
export const formSections = mysqlTable("formSections", {
  id: int("id").autoincrement().primaryKey(),
  requestTypeId: int("requestTypeId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  icon: varchar("icon", { length: 100 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  
  isRepeatable: boolean("isRepeatable").default(false).notNull(),
  minItems: int("minItems").default(0).notNull(),
  maxItems: int("maxItems").default(100).notNull(),
  
  // Conditional Display
  showCondition: json("showCondition").$type<{
    field: string;
    operator?: "equals" | "not_equals" | "in" | "not_empty" | "empty";
    value?: string | string[] | boolean;
  }>(),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormSection = typeof formSections.$inferSelect;
export type InsertFormSection = typeof formSections.$inferInsert;

/**
 * Form Fields - Individual fields within a section
 */
export const formFields = mysqlTable("formFields", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  
  fieldType: mysqlEnum("fieldType", [
    "text",
    "textarea",
    "number",
    "email",
    "phone",
    "date",
    "datetime",
    "dropdown",
    "dropdown_multi",
    "radio",
    "checkbox",
    "checkbox_group",
    "file",
    "file_multi",
    "user_lookup",
    "readonly"
  ]).notNull(),
  
  isRequired: boolean("isRequired").default(false).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  columnSpan: int("columnSpan").default(6).notNull(), // 1-12 grid
  
  placeholder: varchar("placeholder", { length: 255 }),
  placeholderAr: varchar("placeholderAr", { length: 255 }),
  helpText: text("helpText"),
  helpTextAr: text("helpTextAr"),
  defaultValue: varchar("defaultValue", { length: 500 }),
  
  // Options (for dropdowns, radios, checkboxes)
  options: json("options").$type<Array<{
    value: string;
    label: string;
    labelAr?: string;
  }>>(),
  optionsSource: mysqlEnum("optionsSource", ["static", "api", "dependent"]).default("static"),
  optionsApi: varchar("optionsApi", { length: 500 }),
  dependsOnField: varchar("dependsOnField", { length: 100 }),
  
  // Validation
  validation: json("validation").$type<{
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    accept?: string; // for file uploads
    maxSizeMB?: number;
    maxFiles?: number;
  }>(),
  
  // Conditional Display
  showCondition: json("showCondition").$type<{
    field: string;
    operator?: "equals" | "not_equals" | "in" | "not_empty" | "empty";
    value?: string | string[] | boolean;
  }>(),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;

/**
 * Field Options - Alternative to JSONB for dropdown options
 */
export const fieldOptions = mysqlTable("fieldOptions", {
  id: int("id").autoincrement().primaryKey(),
  fieldId: int("fieldId").notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  labelAr: varchar("labelAr", { length: 255 }),
  parentValue: varchar("parentValue", { length: 255 }), // For cascading dropdowns
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FieldOption = typeof fieldOptions.$inferSelect;
export type InsertFieldOption = typeof fieldOptions.$inferInsert;

/**
 * Request Visitors - Stores multiple visitors per request (fixes bug: only 1 visitor saved)
 */
export const requestVisitors = mysqlTable("requestVisitors", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  visitorIndex: int("visitorIndex").notNull(),
  
  fullName: varchar("fullName", { length: 255 }).notNull(),
  nationality: varchar("nationality", { length: 100 }),
  idType: mysqlEnum("idType", ["national_id", "iqama", "passport"]),
  idNumber: varchar("idNumber", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  mobile: varchar("mobile", { length: 20 }),
  email: varchar("email", { length: 320 }),
  
  // Yaqeen Verification
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationSource: mysqlEnum("verificationSource", ["yaqeen", "manual"]),
  
  idAttachmentUrl: varchar("idAttachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestVisitor = typeof requestVisitors.$inferSelect;
export type InsertRequestVisitor = typeof requestVisitors.$inferInsert;

/**
 * Request Materials - For MHV (Material/Vehicle Permit)
 */
export const requestMaterials = mysqlTable("requestMaterials", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  materialIndex: int("materialIndex").notNull(),
  direction: mysqlEnum("direction", ["entry", "exit"]).notNull(),
  
  materialType: varchar("materialType", { length: 100 }).notNull(),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 255 }),
  quantity: int("quantity").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestMaterial = typeof requestMaterials.$inferSelect;
export type InsertRequestMaterial = typeof requestMaterials.$inferInsert;

/**
 * Request Vehicles - For VIP/MHV
 */
export const requestVehicles = mysqlTable("requestVehicles", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  
  driverName: varchar("driverName", { length: 255 }),
  driverNationality: varchar("driverNationality", { length: 100 }),
  driverId: varchar("driverId", { length: 50 }),
  driverCompany: varchar("driverCompany", { length: 255 }),
  driverPhone: varchar("driverPhone", { length: 20 }),
  vehiclePlate: varchar("vehiclePlate", { length: 50 }),
  vehicleType: varchar("vehicleType", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestVehicle = typeof requestVehicles.$inferSelect;
export type InsertRequestVehicle = typeof requestVehicles.$inferInsert;


// ============================================================================
// MAGNETIC CARD MANAGEMENT (MCM) TABLES
// ============================================================================

/**
 * Card Companies - Contractors, Sub-Contractors, Clients
 */
export const cardCompanies = mysqlTable("cardCompanies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  type: mysqlEnum("type", ["contractor", "subcontractor", "client"]).notNull(),
  code: varchar("code", { length: 50 }),
  parentCompanyId: int("parentCompanyId"),
  // Contact person fields
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  contactPersonName: varchar("contactPersonName", { length: 255 }),
  contactPersonEmail: varchar("contactPersonEmail", { length: 255 }),
  contactPersonPhone: varchar("contactPersonPhone", { length: 50 }),
  contactPersonPosition: varchar("contactPersonPosition", { length: 100 }),
  // Address fields
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  registrationNumber: varchar("registrationNumber", { length: 100 }),
  // Contract fields
  contractReference: varchar("contractReference", { length: 100 }),
  contractStartDate: date("contractStartDate"),
  contractEndDate: date("contractEndDate"),
  // Status fields
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardCompany = typeof cardCompanies.$inferSelect;
export type InsertCardCompany = typeof cardCompanies.$inferInsert;

/**
 * Magnetic Cards - Main card table
 */
export const magneticCards = mysqlTable("magneticCards", {
  id: int("id").autoincrement().primaryKey(),
  cardNumber: varchar("cardNumber", { length: 50 }).notNull().unique(),
  
  // Card Status
  status: mysqlEnum("status", ["pending", "active", "inactive", "blocked", "expired"]).default("pending").notNull(),
  blockReason: mysqlEnum("blockReason", ["security_incident", "policy_violation", "investigation", "emergency"]),
  blockType: mysqlEnum("blockType", ["temporary", "permanent"]),
  blockUntil: timestamp("blockUntil"),
  blockedBy: int("blockedBy"),
  blockedAt: timestamp("blockedAt"),
  
  // Company Type
  companyType: mysqlEnum("companyType", ["centre3", "contractor", "subcontractor", "client"]).notNull(),
  companyId: int("companyId"), // References cardCompanies for non-Centre3
  
  // Cardholder Information
  idType: mysqlEnum("idType", ["saudi_id", "iqama"]).notNull(),
  idNumber: varchar("idNumber", { length: 20 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  fullNameAr: varchar("fullNameAr", { length: 255 }),
  birthDate: date("birthDate").notNull(),
  nationality: varchar("nationality", { length: 100 }),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  bloodType: varchar("bloodType", { length: 10 }),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  profession: varchar("profession", { length: 255 }),
  
  // ID Document Details
  idIssueDate: date("idIssueDate"),
  idIssuePlace: varchar("idIssuePlace", { length: 255 }),
  idExpiryDate: date("idExpiryDate").notNull(),
  
  // Documents (S3 URLs)
  photoUrl: varchar("photoUrl", { length: 500 }),
  idDocumentUrl: varchar("idDocumentUrl", { length: 500 }),
  contractUrl: varchar("contractUrl", { length: 500 }),
  
  // Yaqeen Verification
  yaqeenVerified: boolean("yaqeenVerified").default(false),
  yaqeenVerifiedAt: timestamp("yaqeenVerifiedAt"),
  yaqeenOverrideBy: int("yaqeenOverrideBy"),
  yaqeenOverrideReason: text("yaqeenOverrideReason"),
  
  // Dates
  issueDate: timestamp("issueDate"),
  expiryDate: timestamp("expiryDate"),
  
  // Request tracking
  requestId: int("requestId"), // Links to workflow request
  requestedBy: int("requestedBy").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  
  // Siport Integration
  siportCardId: varchar("siportCardId", { length: 100 }),
  siportSyncedAt: timestamp("siportSyncedAt"),
  siportSyncStatus: mysqlEnum("siportSyncStatus", ["pending", "synced", "failed"]).default("pending"),
  siportSyncError: text("siportSyncError"),
  
  // Deactivation
  deactivatedBy: int("deactivatedBy"),
  deactivatedAt: timestamp("deactivatedAt"),
  deactivationReason: mysqlEnum("deactivationReason", ["resignation", "termination", "contract_ended", "security_concern", "lost", "stolen", "damaged", "expired", "other"]),
  deactivationNotes: text("deactivationNotes"),
  
  // Replacement tracking
  replacesCardId: int("replacesCardId"), // If this card replaces another
  replacedByCardId: int("replacedByCardId"), // If this card was replaced
  
  // Lost card tracking
  lostReportCount: int("lostReportCount").default(0),
  lastLostReportAt: timestamp("lastLostReportAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MagneticCard = typeof magneticCards.$inferSelect;
export type InsertMagneticCard = typeof magneticCards.$inferInsert;

/**
 * Card Access Levels - Access levels assigned to a card
 */
export const cardAccessLevels = mysqlTable("cardAccessLevels", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  
  // Location
  countryCode: varchar("countryCode", { length: 10 }).notNull(), // SA, BH
  siteId: int("siteId").notNull(),
  
  // Access Level (from Centre3 system)
  accessLevelId: int("accessLevelId").notNull(),
  accessLevelName: varchar("accessLevelName", { length: 255 }),
  
  // Specific rooms (optional)
  roomIds: json("roomIds").$type<number[]>(),
  
  // Validity
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Siport mapping
  siportZoneIds: json("siportZoneIds").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardAccessLevel = typeof cardAccessLevels.$inferSelect;
export type InsertCardAccessLevel = typeof cardAccessLevels.$inferInsert;

/**
 * Card Audit Log - All card operations
 */
export const cardAuditLog = mysqlTable("cardAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  
  // Operation
  operation: mysqlEnum("operation", [
    "created", "modified", "activated", "deactivated", 
    "blocked", "unblocked", "renewed", "replaced",
    "access_added", "access_removed", "access_modified",
    "yaqeen_verified", "yaqeen_override",
    "siport_synced", "siport_failed"
  ]).notNull(),
  
  // Details
  performedBy: int("performedBy").notNull(),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
  reason: text("reason"),
  
  // Change tracking
  previousData: json("previousData").$type<Record<string, any>>(),
  newData: json("newData").$type<Record<string, any>>(),
  
  // Request reference (if via workflow)
  requestId: int("requestId"),
  
  // IP and session info
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type CardAuditLog = typeof cardAuditLog.$inferSelect;
export type InsertCardAuditLog = typeof cardAuditLog.$inferInsert;

/**
 * MCM Access Levels - Predefined access levels in Centre3 system
 */
export const mcmAccessLevels = mysqlTable("mcmAccessLevels", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  
  // Siport mapping
  siportZoneMapping: json("siportZoneMapping").$type<Record<string, string[]>>(), // { siteCode: [zoneIds] }
  
  // Restrictions
  requiresApproval: boolean("requiresApproval").default(true),
  maxValidityDays: int("maxValidityDays").default(365),
  allowedCompanyTypes: json("allowedCompanyTypes").$type<string[]>(), // ['centre3', 'contractor', etc.]
  
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type McmAccessLevel = typeof mcmAccessLevels.$inferSelect;
export type InsertMcmAccessLevel = typeof mcmAccessLevels.$inferInsert;

/**
 * MCM Requests - Card operation requests (links to workflow)
 */
export const mcmRequests = mysqlTable("mcmRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 50 }).notNull().unique(),
  
  // Operation type
  operationType: mysqlEnum("operationType", [
    "create", "modify", "deactivate", "renew", "replace_lost", "replace_damaged"
  ]).notNull(),
  
  // Card reference (null for create)
  cardId: int("cardId"),
  
  // Status
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "cancelled"]).default("draft").notNull(),
  
  // Requestor
  requestedBy: int("requestedBy").notNull(),
  requestedFor: int("requestedFor"), // If requesting for someone else
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  
  // Form data (stored as JSON for flexibility)
  formData: json("formData").$type<Record<string, any>>(),
  
  // Access levels requested
  accessLevelsRequested: json("accessLevelsRequested").$type<{
    countryCode: string;
    siteId: number;
    accessLevelId: number;
    roomIds?: number[];
  }[]>(),
  
  // For modifications - what changed
  modificationType: mysqlEnum("modificationType", ["add_access", "remove_access", "change_access"]),
  modificationReason: text("modificationReason"),
  
  // For deactivation
  deactivationReason: mysqlEnum("deactivationReason", ["resignation", "termination", "contract_ended", "security_concern", "other"]),
  effectiveDate: timestamp("effectiveDate"),
  
  // For lost/damaged
  lostDamagedType: mysqlEnum("lostDamagedType", ["lost", "stolen", "damaged"]),
  lostDamagedDetails: text("lostDamagedDetails"),
  createReplacement: boolean("createReplacement").default(false),
  
  // Workflow integration
  workflowInstanceId: int("workflowInstanceId"),
  currentStageId: int("currentStageId"),
  
  // Completion
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  
  // Result
  resultCardId: int("resultCardId"), // The card created/modified
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type McmRequest = typeof mcmRequests.$inferSelect;
export type InsertMcmRequest = typeof mcmRequests.$inferInsert;
