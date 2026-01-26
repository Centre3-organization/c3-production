import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

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
