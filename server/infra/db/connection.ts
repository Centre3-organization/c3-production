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
  User
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

  return {
    users: filteredResult,
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
