import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { requests, sites, zones, areas, approvals, users, approvalTasks, approvalInstances } from "../../../drizzle/schema";
import { eq, and, gte, lte, count, desc, sql, ne, isNotNull } from "drizzle-orm";

export const dashboardRouter = router({
  // Get overall statistics - role-aware
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get request counts by status
    const requestStats = await db
      .select({
        status: requests.status,
        count: count(),
      })
      .from(requests)
      .groupBy(requests.status);
    
    // Get total requests this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalThisMonth = await db
      .select({ count: count() })
      .from(requests)
      .where(gte(requests.createdAt, startOfMonth));
    
    // Get last month's total for comparison
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const totalLastMonth = await db
      .select({ count: count() })
      .from(requests)
      .where(and(gte(requests.createdAt, startOfLastMonth), lte(requests.createdAt, endOfLastMonth)));
    
    // Get pending approvals count based on actual approval tasks (not request status)
    const pendingTasksResult = await db
      .select({ count: count() })
      .from(approvalTasks)
      .innerJoin(approvalInstances, eq(approvalTasks.instanceId, approvalInstances.id))
      .where(and(
        eq(approvalTasks.status, "pending"),
        eq(approvalInstances.status, "in_progress")
      ));
    const pendingApprovals = pendingTasksResult[0]?.count || 0;
    
    // Legacy counts for backward compatibility
    const pendingL1 = requestStats.find(r => r.status === "pending_l1")?.count || 0;
    const pendingManual = requestStats.find(r => r.status === "pending_manual")?.count || 0;
    
    // Get approved requests (active visitors)
    const approvedCount = requestStats.find(r => r.status === "approved")?.count || 0;
    
    // Get site count
    const siteCount = await db.select({ count: count() }).from(sites);
    
    // Get zone count
    const zoneCount = await db.select({ count: count() }).from(zones);
    
    // Get area count
    const areaCount = await db.select({ count: count() }).from(areas);
    
    // Get active users count
    const activeUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "active"));
    
    // Calculate derived metrics
    const totalRequests = requestStats.reduce((sum, r) => sum + r.count, 0);
    const rejectedCount = requestStats.find(r => r.status === "rejected")?.count || 0;
    const draftCount = requestStats.find(r => r.status === "draft")?.count || 0;
    const expiredCount = requestStats.find(r => r.status === "expired")?.count || 0;
    const cancelledCount = requestStats.find(r => r.status === "cancelled")?.count || 0;
    const approvalRate = totalRequests > 0 ? Math.round(((approvedCount) / (totalRequests - draftCount)) * 100) : 0;
    
    // Month-over-month change
    const thisMonthCount = totalThisMonth[0]?.count || 0;
    const lastMonthCount = totalLastMonth[0]?.count || 0;
    const monthOverMonthChange = lastMonthCount > 0 
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) 
      : 0;
    
    return {
      activeVisitors: approvedCount,
      pendingApprovals,
      pendingL1,
      pendingManual,
      totalRequestsThisMonth: thisMonthCount,
      totalRequestsLastMonth: lastMonthCount,
      monthOverMonthChange,
      totalRequests,
      approvedCount,
      rejectedCount,
      draftCount,
      expiredCount,
      cancelledCount,
      approvalRate: isNaN(approvalRate) ? 0 : Math.min(approvalRate, 100),
      sites: siteCount[0]?.count || 0,
      zones: zoneCount[0]?.count || 0,
      areas: areaCount[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
    };
  }),

  // Get request breakdown by type
  getRequestsByType: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select({
        type: requests.type,
        count: count(),
      })
      .from(requests)
      .groupBy(requests.type);
    
    const typeLabels: Record<string, string> = {
      admin_visit: "Admin Visit",
      tep: "TEP",
      work_permit: "Work Permit",
      mop: "MOP",
      material_entry: "MVP",
      escort: "Escort",
    };
    
    const typeColors: Record<string, string> = {
      admin_visit: "#5B2C93",
      tep: "#2563EB",
      work_permit: "#D97706",
      mop: "#059669",
      material_entry: "#DC2626",
      escort: "#6366F1",
    };
    
    return result.map(r => ({
      type: r.type,
      label: typeLabels[r.type] || r.type,
      count: r.count,
      color: typeColors[r.type] || "#6B6B6B",
    }));
  }),

  // Get request breakdown by status
  getRequestsByStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select({
        status: requests.status,
        count: count(),
      })
      .from(requests)
      .groupBy(requests.status);
    
    const statusLabels: Record<string, string> = {
      draft: "Draft",
      pending_l1: "Pending Review",
      pending_manual: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      expired: "Expired",
      cancelled: "Cancelled",
    };
    
    const statusColors: Record<string, string> = {
      draft: "#94a3b8",
      pending_l1: "#f59e0b",
      pending_manual: "#8b5cf6",
      approved: "#22c55e",
      rejected: "#ef4444",
      expired: "#6b7280",
      cancelled: "#dc2626",
    };
    
    return result.map(r => ({
      status: r.status,
      label: statusLabels[r.status] || r.status,
      count: r.count,
      color: statusColors[r.status] || "#6b7280",
    }));
  }),

  // Get daily request trend for last 14 days
  getDailyTrend: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const days = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const dayRequests = await db
        .select({ 
          count: count(),
          status: requests.status 
        })
        .from(requests)
        .where(
          and(
            gte(requests.createdAt, startOfDay),
            lte(requests.createdAt, endOfDay)
          )
        )
        .groupBy(requests.status);
      
      const total = dayRequests.reduce((sum, r) => sum + r.count, 0);
      const approved = dayRequests.find(r => r.status === "approved")?.count || 0;
      const rejected = dayRequests.find(r => r.status === "rejected")?.count || 0;
      const pending = dayRequests.filter(r => r.status === "pending_l1" || r.status === "pending_manual")
        .reduce((sum, r) => sum + r.count, 0);
      
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      days.push({
        date: `${monthNames[startOfDay.getMonth()]} ${startOfDay.getDate()}`,
        dayName: dayNames[startOfDay.getDay()],
        total,
        approved,
        rejected,
        pending,
      });
    }
    
    return days;
  }),

  // Get zone occupancy
  getZoneOccupancy: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const zoneList = await db
      .select({
        id: zones.id,
        name: zones.name,
        code: zones.code,
        currentOccupancy: zones.currentOccupancy,
      })
      .from(zones)
      .limit(8);
    
    return zoneList.map(z => {
      const capacity = 100;
      const occupancy = z.currentOccupancy || 0;
      return {
        id: z.id,
        name: z.name,
        code: z.code,
        capacity,
        occupancy,
        percentage: Math.round((occupancy / capacity) * 100),
      };
    });
  }),

  // Get recent activity
  getRecentActivity: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const recentRequests = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        status: requests.status,
        visitorName: requests.visitorName,
        siteId: requests.siteId,
        createdAt: requests.createdAt,
        updatedAt: requests.updatedAt,
      })
      .from(requests)
      .orderBy(desc(requests.updatedAt))
      .limit(10);
    
    const typeLabels: Record<string, string> = {
      admin_visit: "Admin Visit",
      tep: "TEP",
      work_permit: "Work Permit",
      mop: "MOP",
      material_entry: "MVP",
      escort: "Escort",
    };
    
    return recentRequests.map(r => ({
      id: r.id,
      requestNumber: r.requestNumber,
      type: typeLabels[r.type] || r.type,
      status: r.status,
      visitorName: r.visitorName,
      siteId: r.siteId,
      timestamp: r.updatedAt || r.createdAt,
      action: r.status === "approved" ? "Approved" : 
              r.status === "rejected" ? "Rejected" :
              r.status === "pending_l1" ? "Submitted" :
              r.status === "pending_manual" ? "Under Review" : "Updated",
    }));
  }),

  // Get pending items for quick action - based on actual pending approval tasks
  getPendingItems: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get requests that have actual pending approval tasks
    const pendingRequests = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        visitorName: requests.visitorName,
        createdAt: requests.createdAt,
        status: requests.status,
      })
      .from(requests)
      .innerJoin(approvalInstances, eq(approvalInstances.requestId, requests.id))
      .innerJoin(approvalTasks, eq(approvalTasks.instanceId, approvalInstances.id))
      .where(and(
        eq(approvalTasks.status, "pending"),
        eq(approvalInstances.status, "in_progress")
      ))
      .orderBy(requests.createdAt)
      .limit(10);
    
    // Deduplicate by request id
    const seen = new Set<number>();
    const uniqueRequests = pendingRequests.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    
    const typeLabels: Record<string, string> = {
      admin_visit: "Admin Visit",
      tep: "TEP",
      work_permit: "Work Permit",
      mop: "MOP",
      material_entry: "MVP",
      escort: "Escort",
    };
    
    return {
      pendingL1: uniqueRequests.slice(0, 5).map(r => ({
        ...r,
        typeLabel: typeLabels[r.type] || r.type,
      })),
      pendingManual: [] as any[],
    };
  }),

  // Get site overview with real zone/area counts
  getSiteOverview: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const siteList = await db
      .select({
        id: sites.id,
        name: sites.name,
        code: sites.code,
        status: sites.status,
        category: sites.category,
      })
      .from(sites)
      .limit(6);
    
    const sitesWithZones = await Promise.all(
      siteList.map(async (site) => {
        const zoneCount = await db
          .select({ count: count() })
          .from(zones)
          .where(eq(zones.siteId, site.id));
        
        const areaCount = await db
          .select({ count: count() })
          .from(areas)
          .innerJoin(zones, eq(areas.zoneId, zones.id))
          .where(eq(zones.siteId, site.id));
        
        // Count requests for this site
        const requestCount = await db
          .select({ count: count() })
          .from(requests)
          .where(eq(requests.siteId, site.id));
        
        // Count pending requests for this site
        const pendingCount = await db
          .select({ count: count() })
          .from(requests)
          .where(and(
            eq(requests.siteId, site.id),
            sql`${requests.status} IN ('pending_l1', 'pending_manual', 'pending_approval')`
          ));
        
        return {
          ...site,
          zoneCount: zoneCount[0]?.count || 0,
          areaCount: areaCount[0]?.count || 0,
          totalRequests: requestCount[0]?.count || 0,
          pendingRequests: pendingCount[0]?.count || 0,
        };
      })
    );
    
    return sitesWithZones;
  }),

  // Get approval performance metrics
  getApprovalMetrics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get approval counts by status
    const approvalStats = await db
      .select({
        status: approvals.status,
        count: count(),
      })
      .from(approvals)
      .groupBy(approvals.status);
    
    const totalApprovals = approvalStats.reduce((sum, r) => sum + r.count, 0);
    const approvedCount = approvalStats.find(r => r.status === "approved")?.count || 0;
    const rejectedCount = approvalStats.find(r => r.status === "rejected")?.count || 0;
    const pendingCount = approvalStats.find(r => r.status === "pending")?.count || 0;
    
    return {
      total: totalApprovals,
      approved: approvedCount,
      rejected: rejectedCount,
      pending: pendingCount,
      approvalRate: totalApprovals > 0 ? Math.round((approvedCount / totalApprovals) * 100) : 0,
    };
  }),
});
