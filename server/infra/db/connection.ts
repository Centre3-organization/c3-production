import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { 
  InsertUser, 
  users, 
  departments, 
  roles, 
  systemSettings,
  InsertDepartment, 
  InsertRole,
  Department,
  Role,
  User,
  systemRoles,
  permissions,
  rolePermissions,
  userSystemRoles,
  InsertSystemRole,
  InsertPermission,
  cardCompanies
} from "../../../drizzle/schema";

import { ENV } from '../../_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers(options?: {
  search?: string;
  status?: "active" | "inactive" | "all";
  role?: "user" | "admin" | "all";
  departmentId?: number;
  groupId?: number;
  limit?: number;
  offset?: number;
}): Promise<{ users: User[]; total: number }> {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const conditions = [];
  
  if (options?.search) {
    conditions.push(
      sql`(${users.name} LIKE ${`%${options.search}%`} OR ${users.email} LIKE ${`%${options.search}%`} OR ${users.firstName} LIKE ${`%${options.search}%`} OR ${users.lastName} LIKE ${`%${options.search}%`})`
    );
  }

  // Status filter
  if (options?.status && options.status !== "all") {
    conditions.push(sql`${users.status} = ${options.status}`);
  }

  // Role filter
  if (options?.role && options.role !== "all") {
    conditions.push(eq(users.role, options.role));
  }

  // Department filter
  if (options?.departmentId) {
    conditions.push(eq(users.departmentId, options.departmentId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  const [result, countResult] = await Promise.all([
    query,
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause),
  ]);

  // If groupId filter is specified, filter in memory (join would be complex)
  let filteredResult = result;
  if (options?.groupId) {
    // Get user IDs that belong to the group
    const groupMembers = await db.execute(
      sql`SELECT userId FROM userGroupMembership WHERE groupId = ${options.groupId} AND isActive = 1`
    );
    const rows = (groupMembers as unknown as any[][])[0] || [];
    const memberIds = new Set(rows.map((m: any) => m.userId));
    filteredResult = result.filter(u => memberIds.has(u.id));
  }

  // Get system roles for all users
  const userIds = filteredResult.map(u => u.id);
  let userRolesMap = new Map<number, any>();
  
  if (userIds.length > 0) {
    const userRolesData = await db
      .select({
        userId: userSystemRoles.userId,
        roleId: systemRoles.id,
        roleCode: systemRoles.code,
        roleName: systemRoles.name,
        roleLevel: systemRoles.level,
        roleDescription: systemRoles.description,
      })
      .from(userSystemRoles)
      .innerJoin(systemRoles, eq(userSystemRoles.roleId, systemRoles.id))
      .where(eq(userSystemRoles.isActive, true));
    
    for (const ur of userRolesData) {
      userRolesMap.set(ur.userId, {
        id: ur.roleId,
        code: ur.roleCode,
        name: ur.roleName,
        level: ur.roleLevel,
        description: ur.roleDescription,
      });
    }
  }

  // Add systemRole to each user
  const usersWithRoles = filteredResult.map(u => ({
    ...u,
    systemRole: userRolesMap.get(u.id) || null,
  }));

  return {
    users: usersWithRoles,
    total: options?.groupId ? filteredResult.length : (countResult[0]?.count || 0),
  };
}

export async function updateUser(
  id: number,
  data: Partial<Omit<InsertUser, "id" | "createdAt">> & { openId?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, id));
}

export async function createUser(data: Omit<InsertUser, "openId"> & { openId?: string }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if email already exists
  if (data.email) {
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email as string)).limit(1);
    if (existingUser.length > 0) {
      throw new Error("A user with this email address already exists");
    }
  }

  // Generate a unique openId for manually created users
  const openId = data.openId || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const result = await db.insert(users).values({
    ...data,
    openId,
    createdAt: new Date(),
  });
  return result[0].insertId;
}



export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, id));
}

// ============================================================================
// DEPARTMENT QUERIES
// ============================================================================

export async function createDepartment(data: InsertDepartment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(departments).values(data);
  return result[0].insertId;
}

export async function getDepartmentById(id: number): Promise<Department | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCompanyById(id: number): Promise<{ id: number; name: string } | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({ id: cardCompanies.id, name: cardCompanies.name }).from(cardCompanies).where(eq(cardCompanies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listDepartments(options?: {
  search?: string;
  isActive?: boolean;
}): Promise<Department[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (options?.search) {
    conditions.push(like(departments.name, `%${options.search}%`));
  }
  if (options?.isActive !== undefined) {
    conditions.push(eq(departments.isActive, options.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(departments)
    .where(whereClause)
    .orderBy(departments.name);
}

export async function updateDepartment(
  id: number,
  data: Partial<Omit<InsertDepartment, "id" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Soft delete by setting isActive to false
  await db.update(departments).set({ isActive: false }).where(eq(departments.id, id));
}

// ============================================================================
// ROLE QUERIES
// ============================================================================

export async function createRole(data: InsertRole): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(roles).values(data);
  return result[0].insertId;
}

export async function getRoleById(id: number): Promise<Role | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listRoles(options?: {
  search?: string;
  isActive?: boolean;
}): Promise<Role[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (options?.search) {
    conditions.push(like(roles.name, `%${options.search}%`));
  }
  if (options?.isActive !== undefined) {
    conditions.push(eq(roles.isActive, options.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(roles)
    .where(whereClause)
    .orderBy(roles.name);
}

export async function updateRole(
  id: number,
  data: Partial<Omit<InsertRole, "id" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(roles).set(data).where(eq(roles.id, id));
}

export async function deleteRole(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if it's a system role
  const role = await getRoleById(id);
  if (role?.isSystem) {
    throw new Error("Cannot delete system role");
  }

  // Soft delete by setting isActive to false
  await db.update(roles).set({ isActive: false }).where(eq(roles.id, id));
}

// ============================================================================
// SEED DEFAULT DATA
// ============================================================================

export async function seedDefaultRoles(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultRoles: InsertRole[] = [
    {
      name: "Administrator",
      description: "Full system access",
      isSystem: true,
      permissions: {
        requests: { create: true, read: true, update: true, delete: true },
        approvals: { l1: true, manual: true },
        sites: { create: true, read: true, update: true, delete: true },
        zones: { create: true, read: true, update: true, lock: true },
        alerts: { view: true, resolve: true },
        users: { create: true, read: true, update: true, delete: true },
        hardware: { view: true, control: true },
        reports: { view: true, export: true },
      },
    },
    {
      name: "Security Supervisor",
      description: "Manages security operations and approvals",
      isSystem: true,
      permissions: {
        requests: { create: true, read: true, update: true, delete: false },
        approvals: { l1: true, manual: true },
        sites: { create: false, read: true, update: false, delete: false },
        zones: { create: false, read: true, update: false, lock: true },
        alerts: { view: true, resolve: true },
        users: { create: false, read: true, update: false, delete: false },
        hardware: { view: true, control: true },
        reports: { view: true, export: true },
      },
    },
    {
      name: "Security Guard",
      description: "Monitors and responds to security events",
      isSystem: true,
      permissions: {
        requests: { create: false, read: true, update: false, delete: false },
        approvals: { l1: false, manual: false },
        sites: { create: false, read: true, update: false, delete: false },
        zones: { create: false, read: true, update: false, lock: false },
        alerts: { view: true, resolve: false },
        users: { create: false, read: false, update: false, delete: false },
        hardware: { view: true, control: false },
        reports: { view: false, export: false },
      },
    },
    {
      name: "Requestor",
      description: "Can create and manage access requests",
      isSystem: true,
      permissions: {
        requests: { create: true, read: true, update: true, delete: false },
        approvals: { l1: false, manual: false },
        sites: { create: false, read: true, update: false, delete: false },
        zones: { create: false, read: true, update: false, lock: false },
        alerts: { view: false, resolve: false },
        users: { create: false, read: false, update: false, delete: false },
        hardware: { view: false, control: false },
        reports: { view: false, export: false },
      },
    },
    {
      name: "L1 Approver",
      description: "Can approve L1 level requests",
      isSystem: true,
      permissions: {
        requests: { create: true, read: true, update: true, delete: false },
        approvals: { l1: true, manual: false },
        sites: { create: false, read: true, update: false, delete: false },
        zones: { create: false, read: true, update: false, lock: false },
        alerts: { view: true, resolve: false },
        users: { create: false, read: true, update: false, delete: false },
        hardware: { view: false, control: false },
        reports: { view: true, export: false },
      },
    },
  ];

  for (const role of defaultRoles) {
    // Check if role already exists
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.name, role.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(roles).values(role);
      console.log(`[Seed] Created role: ${role.name}`);
    }
  }
}

export async function seedDefaultDepartments(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultDepartments: InsertDepartment[] = [
    { name: "IT Operations", costCenter: "IT-001", description: "Information Technology Operations" },
    { name: "Security", costCenter: "SEC-001", description: "Physical and Cyber Security" },
    { name: "Facilities", costCenter: "FAC-001", description: "Facilities Management" },
    { name: "Engineering", costCenter: "ENG-001", description: "Engineering and Maintenance" },
    { name: "Administration", costCenter: "ADM-001", description: "Administrative Services" },
  ];

  for (const dept of defaultDepartments) {
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.name, dept.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(departments).values(dept);
      console.log(`[Seed] Created department: ${dept.name}`);
    }
  }
}


// ============================================================================
// SEED SYSTEM ROLES (Enterprise RBAC)
// ============================================================================

export async function seedSystemRoles(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultSystemRoles: InsertSystemRole[] = [
    {
      code: "super_admin",
      name: "Super Admin",
      nameAr: "المدير الأعلى",
      description: "Full system access with all permissions.",
      level: 0,
      isSystem: true,
      isActive: true,
    },
    {
      code: "admin",
      name: "Administrator",
      nameAr: "مدير النظام",
      description: "System administrator with access to most features.",
      level: 1,
      isSystem: true,
      isActive: true,
    },
    {
      code: "security_manager",
      name: "Security Manager",
      nameAr: "مدير الأمن",
      description: "Manages security operations and approvals.",
      level: 2,
      isSystem: true,
      isActive: true,
    },
    {
      code: "site_manager",
      name: "Site Manager",
      nameAr: "مدير الموقع",
      description: "Manages operations for assigned sites.",
      level: 3,
      isSystem: true,
      isActive: true,
    },
    {
      code: "zone_manager",
      name: "Zone Manager",
      nameAr: "مدير المنطقة",
      description: "Manages operations for assigned zones.",
      level: 4,
      isSystem: true,
      isActive: true,
    },
    {
      code: "approver",
      name: "Approver",
      nameAr: "المعتمد",
      description: "Can approve access requests.",
      level: 5,
      isSystem: true,
      isActive: true,
    },
    {
      code: "requestor",
      name: "Requestor",
      nameAr: "مقدم الطلب",
      description: "Can create and manage access requests.",
      level: 6,
      isSystem: true,
      isActive: true,
    },
    {
      code: "viewer",
      name: "Viewer",
      nameAr: "المشاهد",
      description: "Read-only access to view data.",
      level: 7,
      isSystem: true,
      isActive: true,
    },
    {
      code: "guest",
      name: "Guest",
      nameAr: "ضيف",
      description: "Limited access for external visitors.",
      level: 8,
      isSystem: true,
      isActive: true,
    },
  ];

  for (const role of defaultSystemRoles) {
    const existing = await db
      .select()
      .from(systemRoles)
      .where(eq(systemRoles.code, role.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(systemRoles).values(role);
      console.log(`[Seed] Created system role: ${role.name}`);
    }
  }
}

// ============================================================================
// SEED PERMISSIONS
// ============================================================================

export async function seedPermissions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultPermissions: InsertPermission[] = [
    // Dashboard & Analytics
    { code: "dashboard:view", module: "dashboard", action: "view", name: "View Dashboard", category: "Dashboard" },
    { code: "dashboard:analytics", module: "dashboard", action: "analytics", name: "View Analytics", category: "Dashboard" },
    { code: "dashboard:export", module: "dashboard", action: "export", name: "Export Reports", category: "Dashboard" },
    
    // Access Requests
    { code: "requests:view", module: "requests", action: "view", name: "View Requests", category: "Requests" },
    { code: "requests:create", module: "requests", action: "create", name: "Create Requests", category: "Requests" },
    { code: "requests:update", module: "requests", action: "update", name: "Update Requests", category: "Requests" },
    { code: "requests:delete", module: "requests", action: "delete", name: "Delete Requests", category: "Requests" },
    { code: "requests:approve", module: "requests", action: "approve", name: "Approve Requests", category: "Requests" },
    { code: "requests:reject", module: "requests", action: "reject", name: "Reject Requests", category: "Requests" },
    
    // Approvals
    { code: "approvals:l1", module: "approvals", action: "l1", name: "L1 Approval", category: "Approvals" },
    { code: "approvals:manual", module: "approvals", action: "manual", name: "Manual Approval", category: "Approvals" },
    
    // Site Management
    { code: "sites:create", module: "sites", action: "create", name: "Create Sites", category: "Sites" },
    { code: "sites:read", module: "sites", action: "read", name: "View Sites", category: "Sites" },
    { code: "sites:update", module: "sites", action: "update", name: "Update Sites", category: "Sites" },
    { code: "sites:delete", module: "sites", action: "delete", name: "Delete Sites", category: "Sites" },
    
    // Zone Management
    { code: "zones:create", module: "zones", action: "create", name: "Create Zones", category: "Zones" },
    { code: "zones:read", module: "zones", action: "read", name: "View Zones", category: "Zones" },
    { code: "zones:update", module: "zones", action: "update", name: "Update Zones", category: "Zones" },
    { code: "zones:lock", module: "zones", action: "lock", name: "Lock/Unlock Zones", category: "Zones" },
    
    // Security Alerts
    { code: "alerts:view", module: "alerts", action: "view", name: "View Alerts", category: "Alerts" },
    { code: "alerts:resolve", module: "alerts", action: "resolve", name: "Resolve Alerts", category: "Alerts" },
    
    // User Administration
    { code: "users:view", module: "users", action: "view", name: "View Users", category: "Users" },
    { code: "users:create", module: "users", action: "create", name: "Create Users", category: "Users" },
    { code: "users:update", module: "users", action: "update", name: "Update Users", category: "Users" },
    { code: "users:delete", module: "users", action: "delete", name: "Delete Users", category: "Users" },
    { code: "users:manage_roles", module: "users", action: "manage_roles", name: "Manage User Roles", category: "Users" },
    
    // Groups
    { code: "groups:view", module: "groups", action: "view", name: "View Groups", category: "Groups" },
    { code: "groups:create", module: "groups", action: "create", name: "Create Groups", category: "Groups" },
    { code: "groups:update", module: "groups", action: "update", name: "Update Groups", category: "Groups" },
    { code: "groups:delete", module: "groups", action: "delete", name: "Delete Groups", category: "Groups" },
    
    // Workflow Management
    { code: "workflows:view", module: "workflows", action: "view", name: "View Workflows", category: "Workflows" },
    { code: "workflows:create", module: "workflows", action: "create", name: "Create Workflows", category: "Workflows" },
    { code: "workflows:update", module: "workflows", action: "update", name: "Update Workflows", category: "Workflows" },
    { code: "workflows:delete", module: "workflows", action: "delete", name: "Delete Workflows", category: "Workflows" },
    
    // Request Types
    { code: "requestTypes:view", module: "requestTypes", action: "view", name: "View Request Types", category: "Request Types" },
    { code: "requestTypes:create", module: "requestTypes", action: "create", name: "Create Request Types", category: "Request Types" },
    { code: "requestTypes:update", module: "requestTypes", action: "update", name: "Update Request Types", category: "Request Types" },
    { code: "requestTypes:delete", module: "requestTypes", action: "delete", name: "Delete Request Types", category: "Request Types" },
    
    // Delegations
    { code: "delegations:view", module: "delegations", action: "view", name: "View Delegations", category: "Delegations" },
    { code: "delegations:create", module: "delegations", action: "create", name: "Create Delegations", category: "Delegations" },
    { code: "delegations:update", module: "delegations", action: "update", name: "Update Delegations", category: "Delegations" },
    { code: "delegations:delete", module: "delegations", action: "delete", name: "Delete Delegations", category: "Delegations" },
    
    // Card Management
    { code: "cards:view", module: "cards", action: "view", name: "View Cards", category: "Cards" },
    { code: "cards:issue", module: "cards", action: "issue", name: "Issue Cards", category: "Cards" },
    { code: "cards:revoke", module: "cards", action: "revoke", name: "Revoke Cards", category: "Cards" },
    { code: "cards:control", module: "cards", action: "control", name: "Control Cards", category: "Cards" },
    
    // Hardware
    { code: "hardware:view", module: "hardware", action: "view", name: "View Hardware", category: "Hardware" },
    { code: "hardware:control", module: "hardware", action: "control", name: "Control Hardware", category: "Hardware" },
    
    // Reports
    { code: "reports:view", module: "reports", action: "view", name: "View Reports", category: "Reports" },
    { code: "reports:export", module: "reports", action: "export", name: "Export Reports", category: "Reports" },
    
    // Settings
    { code: "settings:view", module: "settings", action: "view", name: "View Settings", category: "Settings" },
    { code: "settings:update", module: "settings", action: "update", name: "Update Settings", category: "Settings" },
    
    // Integration Hub
    { code: "integrations:view", module: "integrations", action: "view", name: "View Integrations", category: "Integrations" },
    { code: "integrations:configure", module: "integrations", action: "configure", name: "Configure Integrations", category: "Integrations" },
    
    // Admin
    { code: "admin:access", module: "admin", action: "access", name: "Access Admin Panel", category: "Admin" },
    { code: "admin:roles", module: "admin", action: "roles", name: "Manage Roles", category: "Admin" },
    { code: "admin:audit", module: "admin", action: "audit", name: "View Audit Logs", category: "Admin" },
    
    // Legacy compatibility
    { code: "facilities:view", module: "facilities", action: "view", name: "View Facilities", category: "Facilities" },
    { code: "facilities:create", module: "facilities", action: "create", name: "Create Facilities", category: "Facilities" },
    { code: "facilities:update", module: "facilities", action: "update", name: "Update Facilities", category: "Facilities" },
  ];

  for (const perm of defaultPermissions) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, perm.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values({ ...perm, isActive: true });
      console.log(`[Seed] Created permission: ${perm.code}`);
    }
  }
}

// ============================================================================
// SEED ROLE PERMISSIONS
// ============================================================================

export async function seedRolePermissions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const allRoles = await db.select().from(systemRoles);
  const allPerms = await db.select().from(permissions);

  const roleMap = new Map(allRoles.map(r => [r.code, r.id]));
  const permMap = new Map(allPerms.map(p => [p.code, p.id]));

  const rolePermissionMap: Record<string, string[]> = {
    super_admin: allPerms.map(p => p.code),
    admin: [
      "dashboard:view", "dashboard:analytics",
      "users:view", "users:create", "users:update", "users:delete", "users:manage_roles",
      "groups:view", "groups:create", "groups:update", "groups:delete",
      "requests:view", "requests:create", "requests:update", "requests:approve", "requests:reject",
      "facilities:view", "facilities:create", "facilities:update",
      "workflows:view", "workflows:create", "workflows:update",
      "reports:view", "reports:export",
      "settings:view", "settings:update",
      "admin:access", "admin:roles", "admin:audit",
    ],
    security_manager: [
      "dashboard:view", "dashboard:analytics",
      "users:view",
      "groups:view",
      "requests:view", "requests:approve", "requests:reject",
      "facilities:view",
      "reports:view", "reports:export",
      "admin:access", "admin:audit",
    ],
    site_manager: [
      "dashboard:view",
      "users:view",
      "groups:view",
      "requests:view", "requests:approve",
      "facilities:view", "facilities:update",
      "reports:view",
    ],
    zone_manager: [
      "dashboard:view",
      "users:view",
      "groups:view",
      "requests:view", "requests:approve",
      "facilities:view",
      "reports:view",
    ],
    approver: [
      "dashboard:view",
      "users:view",
      "groups:view",
      "requests:view", "requests:approve", "requests:reject",
      "facilities:view",
      "reports:view",
    ],
    requestor: [
      "dashboard:view",
      "users:view",
      "groups:view",
      "requests:view", "requests:create", "requests:update",
      "facilities:view",
    ],
    viewer: [
      "dashboard:view",
      "users:view",
      "groups:view",
      "requests:view",
      "facilities:view",
      "reports:view",
    ],
    guest: [
      "dashboard:view",
      "requests:view",
      "facilities:view",
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionMap)) {
    const roleId = roleMap.get(roleCode);
    if (!roleId) continue;

    for (const permCode of permCodes) {
      const permId = permMap.get(permCode);
      if (!permId) continue;

      const existing = await db
        .select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permId)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(rolePermissions).values({ roleId, permissionId: permId });
      }
    }
  }

  console.log("[Seed] Role permissions seeded successfully");
}

// ============================================================================
// ASSIGN OWNER TO SUPER ADMIN ROLE
// ============================================================================

export async function assignOwnerSuperAdmin(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const owner = await db
    .select()
    .from(users)
    .where(eq(users.openId, ENV.ownerOpenId))
    .limit(1);

  if (owner.length === 0) {
    console.log("[Seed] Owner user not found, skipping super admin assignment");
    return;
  }

  const superAdminRole = await db
    .select()
    .from(systemRoles)
    .where(eq(systemRoles.code, "super_admin"))
    .limit(1);

  if (superAdminRole.length === 0) {
    console.log("[Seed] Super Admin role not found, skipping assignment");
    return;
  }

  const existing = await db
    .select()
    .from(userSystemRoles)
    .where(and(
      eq(userSystemRoles.userId, owner[0].id),
      eq(userSystemRoles.roleId, superAdminRole[0].id)
    ))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userSystemRoles).values({
      userId: owner[0].id,
      roleId: superAdminRole[0].id,
      isActive: true,
    });
    console.log(`[Seed] Assigned Super Admin role to owner: ${owner[0].name || owner[0].email}`);
  }
}
