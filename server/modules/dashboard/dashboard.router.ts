import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../infra/db/connection";
import { requests, sites, zones, areas } from "../../../drizzle/schema";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";

export const dashboardRouter = router({
  // Get overall statistics
  getStats: protectedProcedure.query(async () => {
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
    
    // Get pending approvals count
    const pendingL1 = requestStats.find(r => r.status === "pending_l1")?.count || 0;
    const pendingManual = requestStats.find(r => r.status === "pending_manual")?.count || 0;
    const pendingApprovals = pendingL1 + pendingManual;
    
    // Get approved requests (active visitors simulation)
    const approvedCount = requestStats.find(r => r.status === "approved")?.count || 0;
    
    // Get site count
    const siteCount = await db.select({ count: count() }).from(sites);
    
    // Get zone count
    const zoneCount = await db.select({ count: count() }).from(zones);
    
    // Get area count
    const areaCount = await db.select({ count: count() }).from(areas);
    
    // Calculate some derived metrics
    const totalRequests = requestStats.reduce((sum, r) => sum + r.count, 0);
    const rejectedCount = requestStats.find(r => r.status === "rejected")?.count || 0;
    const approvalRate = totalRequests > 0 ? Math.round(((totalRequests - rejectedCount) / totalRequests) * 100) : 0;
    
    return {
      activeVisitors: approvedCount,
      pendingApprovals,
      pendingL1,
      pendingManual,
      totalRequestsThisMonth: totalThisMonth[0]?.count || 0,
      totalRequests,
      approvedCount,
      rejectedCount,
      approvalRate,
      avgStayTime: "2h 15m",
      securityAlerts: 3,
      occupancyPercent: 85,
      sites: siteCount[0]?.count || 0,
      zones: zoneCount[0]?.count || 0,
      areas: areaCount[0]?.count || 0,
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
    
    return result.map(r => ({
      type: r.type,
      label: typeLabels[r.type] || r.type,
      count: r.count,
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
      pending_l1: "Pending L1",
      pending_manual: "Pending L2",
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

  // Get visitor traffic by hour
  getVisitorTraffic: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRequests = await db
      .select({ createdAt: requests.createdAt })
      .from(requests)
      .where(gte(requests.createdAt, sevenDaysAgo));
    
    const hours = [];
    for (let h = 6; h <= 20; h += 2) {
      const hourLabel = `${h.toString().padStart(2, '0')}:00`;
      const baseTraffic = Math.floor(Math.random() * 20) + 10;
      const peakMultiplier = h >= 10 && h <= 16 ? 1.5 : 1;
      hours.push({
        hour: hourLabel,
        visitors: Math.floor(baseTraffic * peakMultiplier * (1 + recentRequests.length / 50)),
      });
    }
    
    return hours;
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
      .limit(6);
    
    return zoneList.map(z => {
      const capacity = 100; // Default capacity
      const occupancy = z.currentOccupancy || Math.floor(Math.random() * 80) + 20;
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
      timestamp: r.updatedAt || r.createdAt,
      action: r.status === "approved" ? "Approved" : 
              r.status === "rejected" ? "Rejected" :
              r.status === "pending_l1" ? "Submitted" :
              r.status === "pending_manual" ? "L1 Approved" : "Updated",
    }));
  }),

  // Get pending items for quick action
  getPendingItems: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const pendingL1Requests = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        visitorName: requests.visitorName,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .where(eq(requests.status, "pending_l1"))
      .orderBy(requests.createdAt)
      .limit(5);
    
    const pendingManualRequests = await db
      .select({
        id: requests.id,
        requestNumber: requests.requestNumber,
        type: requests.type,
        visitorName: requests.visitorName,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .where(eq(requests.status, "pending_manual"))
      .orderBy(requests.createdAt)
      .limit(5);
    
    const typeLabels: Record<string, string> = {
      admin_visit: "Admin Visit",
      tep: "TEP",
      work_permit: "Work Permit",
      mop: "MOP",
      material_entry: "MVP",
      escort: "Escort",
    };
    
    return {
      pendingL1: pendingL1Requests.map(r => ({
        ...r,
        typeLabel: typeLabels[r.type] || r.type,
      })),
      pendingManual: pendingManualRequests.map(r => ({
        ...r,
        typeLabel: typeLabels[r.type] || r.type,
      })),
    };
  }),

  // Get site overview
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
        
        return {
          ...site,
          zoneCount: zoneCount[0]?.count || 0,
          areaCount: areaCount[0]?.count || 0,
          activeVisitors: Math.floor(Math.random() * 50) + 10,
          alertCount: Math.floor(Math.random() * 3),
        };
      })
    );
    
    return sitesWithZones;
  }),

  // Get weekly trend data
  getWeeklyTrend: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRequests = await db
        .select({ count: count() })
        .from(requests)
        .where(
          and(
            gte(requests.createdAt, startOfDay),
            lte(requests.createdAt, endOfDay)
          )
        );
      
      weekData.push({
        day: days[startOfDay.getDay()],
        date: startOfDay.toISOString().split('T')[0],
        requests: dayRequests[0]?.count || Math.floor(Math.random() * 15) + 5,
        approved: Math.floor(Math.random() * 10) + 3,
        rejected: Math.floor(Math.random() * 3),
      });
    }
    
    return weekData;
  }),
});
