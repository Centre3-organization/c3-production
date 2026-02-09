import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  Clock, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  UserCheck,
  FileText,
  Building2,
  ChevronRight,
  RefreshCw,
  Eye,
  MapPin,
  BarChart3,
  Target,
  Shield,
  Layers,
  AlertCircle,
  Printer,
  Filter,
  Zap,
  Gauge,
  CircleAlert,
  TriangleAlert,
  Info
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/utils/useAuth";

// ─── KPI Indicator Card ─────────────────────────────────────────────────────
function KPICard({ 
  label, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendLabel,
  accentColor = "#5B2C93",
  onClick,
  loading,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
  trendLabel?: string;
  accentColor?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <div 
      className={cn(
        "bg-white border border-[#E8E8E8] rounded-lg p-4 flex flex-col justify-between min-h-[120px]",
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      style={{ borderTop: `3px solid ${accentColor}` }}
      onClick={onClick}
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">{label}</span>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}18` }}>
              <Icon className="h-4 w-4" style={{ color: accentColor }} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-[#1A1A2E]">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                trend >= 0 ? "text-[#059669]" : "text-[#DC2626]"
              )}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            {(subtitle || trendLabel) && (
              <span className="text-[11px] text-[#8C8C8C]">{trendLabel || subtitle}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Status Indicator Dot ────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: "bg-[#059669]",
    rejected: "bg-[#DC2626]",
    pending_l1: "bg-[#D97706]",
    pending_manual: "bg-[#7C3AED]",
    pending_approval: "bg-[#D97706]",
    pending_review: "bg-[#D97706]",
    draft: "bg-[#94A3B8]",
    expired: "bg-[#6B7280]",
    cancelled: "bg-[#DC2626]",
    in_progress: "bg-[#2563EB]",
    completed: "bg-[#059669]",
    active: "bg-[#059669]",
    inactive: "bg-[#94A3B8]",
  };
  return <div className={cn("w-2 h-2 rounded-full", colors[status] || "bg-[#94A3B8]")} />;
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "#5B2C93" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("operational");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch user permissions to filter dashboard content
  const { data: permissions } = trpc.users.getMyPermissions.useQuery();
  
  const hasPermission = (category: string, action: string): boolean => {
    if (!permissions) return false;
    return (permissions as any)?.[category]?.[action] === true;
  };
  
  const isAdmin = hasPermission('admin', 'full') || hasPermission('admin', 'access');
  const canViewAnalytics = hasPermission('dashboard', 'analytics') || isAdmin;
  const canViewAlerts = hasPermission('alerts', 'view') || isAdmin;
  const canViewApprovals = hasPermission('approvals', 'l1') || isAdmin;
  const canViewSites = hasPermission('sites', 'read') || isAdmin;
  const canViewZones = hasPermission('zones', 'read') || isAdmin;
  
  // Data queries
  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: requestsByType, isLoading: typeLoading } = trpc.dashboard.getRequestsByType.useQuery(undefined, { enabled: canViewAnalytics });
  const { data: requestsByStatus, isLoading: statusLoading } = trpc.dashboard.getRequestsByStatus.useQuery(undefined, { enabled: canViewAnalytics });
  const { data: dailyTrend, isLoading: trendLoading } = trpc.dashboard.getDailyTrend.useQuery(undefined, { enabled: canViewAnalytics });
  const { data: zoneOccupancy, isLoading: zoneLoading } = trpc.dashboard.getZoneOccupancy.useQuery(undefined, { enabled: canViewZones });
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery();
  const { data: pendingItems, isLoading: pendingLoading } = trpc.dashboard.getPendingItems.useQuery(undefined, { enabled: canViewApprovals });
  const { data: siteOverview, isLoading: siteLoading } = trpc.dashboard.getSiteOverview.useQuery(undefined, { enabled: canViewSites });
  const { data: approvalMetrics } = trpc.dashboard.getApprovalMetrics.useQuery(undefined, { enabled: canViewApprovals });

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.dashboard.getStats.invalidate(),
        utils.dashboard.getRequestsByType.invalidate(),
        utils.dashboard.getRequestsByStatus.invalidate(),
        utils.dashboard.getDailyTrend.invalidate(),
        utils.dashboard.getZoneOccupancy.invalidate(),
        utils.dashboard.getRecentActivity.invalidate(),
        utils.dashboard.getPendingItems.invalidate(),
        utils.dashboard.getSiteOverview.invalidate(),
        utils.dashboard.getApprovalMetrics.invalidate(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [utils]);

  // Chart calculations
  const maxTrend = useMemo(() => dailyTrend ? Math.max(...dailyTrend.map(d => d.total), 1) : 1, [dailyTrend]);
  const totalByStatus = useMemo(() => requestsByStatus ? requestsByStatus.reduce((sum, r) => sum + r.count, 0) : 0, [requestsByStatus]);
  const totalByType = useMemo(() => requestsByType ? requestsByType.reduce((sum, r) => sum + r.count, 0) : 0, [requestsByType]);

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    pending_l1: "Pending Review",
    pending_manual: "Pending Approval",
    pending_approval: "Pending Approval",
    pending_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
    cancelled: "Cancelled",
    in_progress: "In Progress",
    completed: "Completed",
  };

  // Current timestamp
  const lastUpdated = format(new Date(), "dd MMM yyyy, HH:mm");

  return (
    <div className="space-y-5">
      {/* ─── Command Centre Header ──────────────────────────────────────── */}
      <div className="rounded-xl p-5 mb-1" style={{ background: "linear-gradient(135deg, #5B2C93 0%, #7B4DB5 50%, #9B6DD7 100%)" }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Target className="h-5 w-5 text-white/80" />
              Command Centre
            </h1>
            <p className="text-xs text-white/70 mt-0.5">
              Last synced: {lastUpdated} &middot; {user?.name || "Operator"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 h-8 px-3 text-xs border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 h-8 px-3 text-xs border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* ─── KPI Strip ──────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-4">
        <KPICard
          label="Active Requests"
          value={stats?.totalRequestsThisMonth || 0}
          trend={stats?.monthOverMonthChange}
          trendLabel="vs last month"
          icon={FileText}
          accentColor="#5B2C93"
          onClick={() => navigate("/requests")}
          loading={statsLoading}
        />
        {canViewApprovals && (
          <KPICard
            label="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            subtitle="Requires action"
            icon={Clock}
            accentColor="#D97706"
            onClick={() => navigate("/approvals")}
            loading={statsLoading}
          />
        )}
        <KPICard
          label="Approved"
          value={stats?.approvedCount || 0}
          subtitle={`${stats?.approvalRate || 0}% approval rate`}
          icon={CheckCircle2}
          accentColor="#059669"
          loading={statsLoading}
        />
        {canViewAlerts && (
          <KPICard
            label="Rejected"
            value={stats?.rejectedCount || 0}
            subtitle="Total rejected"
            icon={AlertTriangle}
            accentColor="#DC2626"
            loading={statsLoading}
          />
        )}
        {canViewSites && (
          <KPICard
            label="Facilities"
            value={stats?.sites || 0}
            subtitle={`${stats?.zones || 0} zones · ${stats?.areas || 0} areas`}
            icon={Building2}
            accentColor="#2563EB"
            onClick={() => navigate("/sites")}
            loading={statsLoading}
          />
        )}
      </div>

      {/* ─── Tabbed Views ───────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b-2 border-[#E8DCF5]">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger 
              value="operational" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B2C93] data-[state=active]:text-[#5B2C93] data-[state=active]:shadow-none bg-transparent px-4 py-2.5 text-xs font-medium text-[#6B6B6B] uppercase tracking-wider"
            >
              Operational Overview
            </TabsTrigger>
            {canViewAnalytics && (
              <TabsTrigger 
                value="analytics" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B2C93] data-[state=active]:text-[#5B2C93] data-[state=active]:shadow-none bg-transparent px-4 py-2.5 text-xs font-medium text-[#6B6B6B] uppercase tracking-wider"
              >
                Performance Analytics
              </TabsTrigger>
            )}
            {(canViewAlerts || canViewSites) && (
              <TabsTrigger 
                value="compliance" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B2C93] data-[state=active]:text-[#5B2C93] data-[state=active]:shadow-none bg-transparent px-4 py-2.5 text-xs font-medium text-[#6B6B6B] uppercase tracking-wider"
              >
                Compliance & Facilities
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: OPERATIONAL OVERVIEW
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="operational" className="mt-4 space-y-4">
          {/* Quick Actions Bar */}
          {canViewApprovals && (
            <div className="bg-[#F8F6FC] border border-[#E8DCF5] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#5B2C93]" />
                <span className="text-sm font-medium text-[#5B2C93]">Action Required</span>
                <Badge className="bg-[#5B2C93] text-white text-xs px-2 py-0.5">
                  {(stats?.pendingL1 || 0) + (stats?.pendingManual || 0)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-[#5B2C93] hover:bg-[#4A2378] text-white h-8 px-3 text-xs"
                  onClick={() => navigate("/approvals")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Review Approvals ({stats?.pendingApprovals || 0})
                </Button>
                {canViewAlerts && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 px-3 text-xs border-[#5B2C93] text-[#5B2C93]"
                    onClick={() => navigate("/global-overwatch")}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Global Overwatch
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pending Approvals + Recent Activity */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Pending Items */}
            {canViewApprovals && (
              <Card className="lg:col-span-2 border border-[#E8DCF5] shadow-none">
                <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#F8F6FC] rounded-t-lg">
                  <div>
                    <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#5B2C93]" />
                      Pending Queue
                    </CardTitle>
                    <p className="text-[11px] text-[#8C8C8C] mt-0.5">Awaiting review & approval</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/approvals")} className="h-7 px-2 text-xs text-[#5B2C93]">
                    View All <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {pendingLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (pendingItems?.pendingL1.length === 0 && pendingItems?.pendingManual.length === 0) ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-[#8C8C8C]">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-[#059669]" />
                      <p className="text-sm font-medium">All Clear</p>
                      <p className="text-xs">No pending items</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {[...(pendingItems?.pendingL1 || []).map(i => ({ ...i, stage: "Review" })),
                        ...(pendingItems?.pendingManual || []).map(i => ({ ...i, stage: "Approval" }))
                      ].slice(0, 8).map((item) => (
                        <div 
                          key={item.id} 
                          className="p-2.5 rounded border border-[#F0F0F0] hover:bg-[#FAFAFA] cursor-pointer transition-colors flex items-center justify-between gap-2"
                          onClick={() => navigate("/approvals")}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-[#8C8C8C]">{item.requestNumber}</span>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-[#E0E0E0]">
                                {item.typeLabel}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#1A1A2E] truncate mt-0.5">{item.visitorName}</p>
                          </div>
                          <Badge className={cn(
                            "text-[10px] h-5 px-1.5 shrink-0",
                            item.stage === "Review" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#EDE9FE] text-[#5B21B6]"
                          )}>
                            {item.stage}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Feed */}
            <Card className={cn("border border-[#E8DCF5] shadow-none", canViewApprovals ? "lg:col-span-3" : "lg:col-span-5")}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#F8F6FC] rounded-t-lg">
                <div>
                  <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#5B2C93]" />
                    Activity Stream
                  </CardTitle>
                  <p className="text-[11px] text-[#8C8C8C] mt-0.5">Latest system events</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/requests")} className="h-7 px-2 text-xs text-[#5B2C93]">
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {activityLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-[#F0F0F0]">
                        <TableHead className="text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider h-8">Request</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider h-8">Type</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider h-8">Visitor</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider h-8">Status</TableHead>
                        <TableHead className="text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider h-8 text-right">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity?.slice(0, 7).map((row) => (
                        <TableRow key={row.id} className="cursor-pointer hover:bg-[#FAFAFA] border-[#F0F0F0]" onClick={() => navigate("/requests")}>
                          <TableCell className="font-mono text-xs text-[#8C8C8C] py-2.5">{row.requestNumber}</TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-xs text-[#1A1A2E]">{row.type}</span>
                          </TableCell>
                          <TableCell className="text-sm text-[#1A1A2E] py-2.5">{row.visitorName}</TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              <StatusDot status={row.status} />
                              <span className="text-xs text-[#6B6B6B]">
                                {statusLabels[row.status] || row.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px] text-[#8C8C8C] py-2.5 text-right">
                            {row.timestamp ? formatDistanceToNow(new Date(row.timestamp), { addSuffix: true }) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: PERFORMANCE ANALYTICS
            ═══════════════════════════════════════════════════════════════════ */}
        {canViewAnalytics && (
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Request Trend Chart */}
          <Card className="border border-[#E8DCF5] shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#F8F6FC] rounded-t-lg">
              <div>
                <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#5B2C93]" />
                  Request Volume Trend
                </CardTitle>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Daily request submissions — last 14 days</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#5B2C93]" /> Total</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#059669]" /> Approved</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#DC2626]" /> Rejected</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {trendLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#8C8C8C]" />
                </div>
              ) : (
                <div>
                  <div className="h-[220px] w-full flex items-end gap-1 px-1">
                    {dailyTrend?.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white text-[10px] px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-lg pointer-events-none">
                          <div className="font-medium">{d.date}</div>
                          <div>Total: {d.total} · Approved: {d.approved} · Rejected: {d.rejected}</div>
                        </div>
                        {/* Bar stack */}
                        <div className="w-full flex flex-col-reverse gap-px" style={{ height: `${Math.max((d.total / maxTrend) * 190, 4)}px` }}>
                          <div 
                            className="w-full bg-[#5B2C93] rounded-t-sm hover:bg-[#4A2378] transition-colors"
                            style={{ height: `${d.total > 0 ? Math.max(((d.total - d.approved - d.rejected) / d.total) * 100, 5) : 100}%` }}
                          />
                          {d.approved > 0 && (
                            <div 
                              className="w-full bg-[#059669]"
                              style={{ height: `${(d.approved / d.total) * 100}%` }}
                            />
                          )}
                          {d.rejected > 0 && (
                            <div 
                              className="w-full bg-[#DC2626] rounded-t-sm"
                              style={{ height: `${(d.rejected / d.total) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8C8C8C] px-1 mt-2 border-t border-[#F0F0F0] pt-2">
                    {dailyTrend?.map((d, i) => (
                      <span key={i} className="flex-1 text-center">{d.date.split(' ')[1]}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Charts Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Request Status Distribution */}
            <Card className="border border-[#E8DCF5] shadow-none">
              <CardHeader className="pb-3 bg-[#F8F6FC] rounded-t-lg">
                <CardTitle className="text-sm font-medium text-[#5B2C93]">Status Distribution</CardTitle>
                <p className="text-[11px] text-[#8C8C8C]">Current request pipeline</p>
              </CardHeader>
              <CardContent className="pt-0">
                {statusLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestsByStatus?.map((s) => (
                      <div key={s.status}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-xs text-[#1A1A2E]">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#1A1A2E]">{s.count}</span>
                            <span className="text-[10px] text-[#8C8C8C]">
                              {totalByStatus > 0 ? Math.round((s.count / totalByStatus) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={s.count} max={totalByStatus} color={s.color} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Request Type Distribution */}
            <Card className="border border-[#E8DCF5] shadow-none">
              <CardHeader className="pb-3 bg-[#F8F6FC] rounded-t-lg">
                <CardTitle className="text-sm font-medium text-[#5B2C93]">Request Categories</CardTitle>
                <p className="text-[11px] text-[#8C8C8C]">Volume by request type</p>
              </CardHeader>
              <CardContent className="pt-0">
                {typeLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestsByType?.map((r) => (
                      <div key={r.type}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-[#1A1A2E]">{r.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#1A1A2E]">{r.count}</span>
                            <span className="text-[10px] text-[#8C8C8C]">
                              {totalByType > 0 ? Math.round((r.count / totalByType) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={r.count} max={totalByType} color={r.color} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Performance */}
            {canViewApprovals && (
              <Card className="border border-[#E8DCF5] shadow-none">
                <CardHeader className="pb-3 bg-[#F8F6FC] rounded-t-lg">
                  <CardTitle className="text-sm font-medium text-[#5B2C93]">Approval Throughput</CardTitle>
                  <p className="text-[11px] text-[#8C8C8C]">Workflow processing metrics</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Approval Rate Gauge */}
                    <div className="text-center py-3">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-28 h-28 -rotate-90">
                          <circle cx="56" cy="56" r="48" fill="none" stroke="#F0F0F0" strokeWidth="8" />
                          <circle 
                            cx="56" cy="56" r="48" fill="none" stroke="#5B2C93" strokeWidth="8"
                            strokeDasharray={`${(approvalMetrics?.approvalRate || 0) * 3.01} 301.6`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <div className="text-2xl font-semibold text-[#1A1A2E]">{approvalMetrics?.approvalRate || 0}%</div>
                          <div className="text-[10px] text-[#8C8C8C]">Approval Rate</div>
                        </div>
                      </div>
                    </div>
                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-[#F0FDF4] rounded">
                        <div className="text-lg font-semibold text-[#059669]">{approvalMetrics?.approved || 0}</div>
                        <div className="text-[10px] text-[#6B6B6B]">Approved</div>
                      </div>
                      <div className="p-2 bg-[#FEF2F2] rounded">
                        <div className="text-lg font-semibold text-[#DC2626]">{approvalMetrics?.rejected || 0}</div>
                        <div className="text-[10px] text-[#6B6B6B]">Rejected</div>
                      </div>
                      <div className="p-2 bg-[#FFF7ED] rounded">
                        <div className="text-lg font-semibold text-[#D97706]">{approvalMetrics?.pending || 0}</div>
                        <div className="text-[10px] text-[#6B6B6B]">Pending</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: COMPLIANCE & FACILITIES
            ═══════════════════════════════════════════════════════════════════ */}
        {(canViewAlerts || canViewSites) && (
        <TabsContent value="compliance" className="mt-4 space-y-4">
          {/* Facilities Grid */}
          {canViewSites && (
            <Card className="border border-[#E8DCF5] shadow-none">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#F8F6FC] rounded-t-lg">
                <div>
                  <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#5B2C93]" />
                    Facility Portfolio
                  </CardTitle>
                  <p className="text-[11px] text-[#8C8C8C] mt-0.5">Site infrastructure & request distribution</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/sites")} className="h-7 px-2 text-xs text-[#5B2C93]">
                  Manage Sites <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {siteLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : siteOverview && siteOverview.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {siteOverview.map((site) => (
                      <div 
                        key={site.id}
                        className="p-3 rounded-lg border border-[#F0F0F0] hover:border-[#D0D0D0] transition-colors cursor-pointer"
                        onClick={() => navigate("/sites")}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-[#1A1A2E] truncate">{site.name}</p>
                            <p className="text-[11px] text-[#8C8C8C] font-mono">{site.code}</p>
                          </div>
                          <StatusDot status={site.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="text-center p-1.5 bg-[#F8F8F8] rounded">
                            <div className="text-sm font-medium text-[#1A1A2E]">{site.zoneCount}</div>
                            <div className="text-[10px] text-[#8C8C8C]">Zones</div>
                          </div>
                          <div className="text-center p-1.5 bg-[#F8F8F8] rounded">
                            <div className="text-sm font-medium text-[#1A1A2E]">{site.totalRequests}</div>
                            <div className="text-[10px] text-[#8C8C8C]">Requests</div>
                          </div>
                        </div>
                        {site.pendingRequests > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#D97706]">
                            <AlertCircle className="h-3 w-3" />
                            {site.pendingRequests} pending
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[150px] flex flex-col items-center justify-center text-[#8C8C8C]">
                    <Building2 className="h-10 w-10 mb-2" />
                    <p className="text-sm">No sites configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Zone Occupancy */}
          {canViewZones && (
            <Card className="border border-[#E8DCF5] shadow-none">
              <CardHeader className="pb-3 bg-[#F8F6FC] rounded-t-lg">
                <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#5B2C93]" />
                  Zone Capacity Utilization
                </CardTitle>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Current headcount vs capacity</p>
              </CardHeader>
              <CardContent className="pt-0">
                {zoneLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : zoneOccupancy && zoneOccupancy.length > 0 ? (
                  <div className="space-y-3">
                    {zoneOccupancy.map((z) => (
                      <div key={z.id}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#1A1A2E]">{z.name}</span>
                            <span className="text-[10px] text-[#8C8C8C] font-mono">{z.code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#1A1A2E]">{z.occupancy}/{z.capacity}</span>
                            <span className={cn(
                              "text-[10px] font-medium",
                              z.percentage > 80 ? "text-[#DC2626]" : z.percentage > 60 ? "text-[#D97706]" : "text-[#059669]"
                            )}>
                              {z.percentage}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar 
                          value={z.occupancy} 
                          max={z.capacity} 
                          color={z.percentage > 80 ? "#DC2626" : z.percentage > 60 ? "#D97706" : "#059669"} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[150px] flex flex-col items-center justify-center text-[#8C8C8C]">
                    <Layers className="h-10 w-10 mb-2" />
                    <p className="text-sm">No zones configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Health Summary */}
          <Card className="border border-[#E8DCF5] shadow-none">
            <CardHeader className="pb-3 bg-[#F8F6FC] rounded-t-lg">
              <CardTitle className="text-sm font-medium text-[#5B2C93] flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[#5B2C93]" />
                System Health
              </CardTitle>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">Infrastructure & service status</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-[#D1FAE5] bg-[#F0FDF4]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[11px] font-medium text-[#059669]">Operational</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">Approval Engine</p>
                </div>
                <div className="p-3 rounded-lg border border-[#D1FAE5] bg-[#F0FDF4]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[11px] font-medium text-[#059669]">Operational</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">Access Control</p>
                </div>
                <div className="p-3 rounded-lg border border-[#D1FAE5] bg-[#F0FDF4]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[11px] font-medium text-[#059669]">Operational</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">Database</p>
                </div>
                <div className="p-3 rounded-lg border border-[#D1FAE5] bg-[#F0FDF4]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span className="text-[11px] font-medium text-[#059669]">Operational</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
