import { getDb } from "../db";
import { checkpointSettings, denialReports, fakePassReports, unregisteredEntryAttempts, watchlist, checkpointTransactions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Get checkpoint settings by checkpoint ID
 */
export async function getCheckpointSettings(checkpointId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const settings = await db
    .select()
    .from(checkpointSettings)
    .where(eq(checkpointSettings.checkpointId, checkpointId))
    .limit(1);
  
  return settings[0] || null;
}

/**
 * Create or update checkpoint settings
 */
export async function upsertCheckpointSettings(
  checkpointId: number,
  data: Partial<typeof checkpointSettings.$inferInsert>,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Check if settings exist
  const existing = await getCheckpointSettings(checkpointId);
  
  if (existing) {
    // Update existing
    await db
      .update(checkpointSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(checkpointSettings.id, existing.id));
    
    return existing.id;
  } else {
    // Create new
    const result = await db.insert(checkpointSettings).values({
      checkpointId,
      ...data,
      createdBy: userId,
    } as any);
    
    return (result as any)[0].insertId;
  }
}

/**
 * Get all watchlist entries with optional filtering
 */
export async function getWatchlistEntries(filters?: {
  entryType?: string;
  severity?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions: any[] = [];
  
  if (filters?.entryType) {
    conditions.push(eq(watchlist.entryType, filters.entryType as any));
  }
  
  if (filters?.severity) {
    conditions.push(eq(watchlist.severity, filters.severity as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(watchlist.isActive, filters.isActive));
  }
  
  let query: any = db.select().from(watchlist);
  
  if (conditions.length > 0) {
    for (const condition of conditions) {
      query = query.where(condition);
    }
  }
  
  return await query.orderBy(desc(watchlist.createdAt));
}

/**
 * Add entry to watchlist
 */
export async function addWatchlistEntry(
  data: typeof watchlist.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(watchlist).values(data);
  
  return (result as any)[0].insertId;
}

/**
 * Update watchlist entry
 */
export async function updateWatchlistEntry(
  id: number,
  data: Partial<typeof watchlist.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .update(watchlist)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(watchlist.id, id));
}

/**
 * Archive watchlist entry (soft delete)
 */
export async function archiveWatchlistEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .update(watchlist)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(watchlist.id, id));
}

/**
 * Get incident reports with filtering and pagination
 */
export async function getIncidentReports(filters?: {
  type?: "denial" | "fake_pass" | "unregistered";
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { denials: [], fakePass: [], unreg: [] };
  
  const pageLimit = filters?.limit || 50;
  const pageOffset = filters?.offset || 0;
  
  // Get denial reports
  const denials = await (db as any)
    .select()
    .from(denialReports)
    .orderBy(desc(denialReports.createdAt))
    .limit(pageLimit)
    .offset(pageOffset);
  
  // Get fake pass reports
  const fakePass = await (db as any)
    .select()
    .from(fakePassReports)
    .orderBy(desc(fakePassReports.createdAt))
    .limit(pageLimit)
    .offset(pageOffset);
  
  // Get unregistered attempts
  const unreg = await (db as any)
    .select()
    .from(unregisteredEntryAttempts)
    .orderBy(desc(unregisteredEntryAttempts.createdAt))
    .limit(pageLimit)
    .offset(pageOffset);
  
  return { denials, fakePass, unreg };
}

/**
 * Get incident statistics
 */
export async function getIncidentStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  
  if (!db) {
    return {
      totalDenials: 0,
      totalFakePass: 0,
      totalUnregistered: 0,
      total: 0,
    };
  }
  
  // Get all incidents and count them
  const denials = await db.select().from(denialReports);
  const fakePass = await db.select().from(fakePassReports);
  const unreg = await db.select().from(unregisteredEntryAttempts);
  
  return {
    totalDenials: denials.length,
    totalFakePass: fakePass.length,
    totalUnregistered: unreg.length,
    total: denials.length + fakePass.length + unreg.length,
  };
}

/**
 * Get high-risk incidents for dashboard
 */
export async function getHighRiskIncidents(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Get recent high-severity incidents
  const incidents = await db
    .select()
    .from(fakePassReports)
    .orderBy(desc(fakePassReports.createdAt))
    .limit(limit);
  
  return incidents;
}

/**
 * Log checkpoint transaction
 */
export async function logCheckpointTransaction(
  data: typeof checkpointTransactions.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(checkpointTransactions).values(data);
  
  return (result as any)[0].insertId;
}

/**
 * Get checkpoint transaction history
 */
export async function getCheckpointTransactionHistory(
  checkpointId: number,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];
  
  const transactions = await db
    .select()
    .from(checkpointTransactions)
    .where(eq(checkpointTransactions.checkpointId, checkpointId))
    .orderBy(desc(checkpointTransactions.createdAt))
    .limit(limit);
  
  return transactions;
}
