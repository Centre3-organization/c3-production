import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  FileText,
  Building2,
  ChevronRight,
  RefreshCw,
  Eye,
  Bell,
  MapPin,
  BarChart3,
  Target,
  Shield,
  Layers,
  AlertCircle
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
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const [, navigate] = useLocation();
  
  // Fetch live data from dashboard API
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.dashboard.getStats.useQuery();
  const { data: requestsByStatus, isLoading: statusLoading } = trpc.dashboard.getRequestsByStatus.useQuery();
  const { data: visitorTraffic, isLoading: trafficLoading } = trpc.dashboard.getVisitorTraffic.useQuery();
  const { data: zoneOccupancy, isLoading: zoneLoading } = trpc.dashboard.getZoneOccupancy.useQuery();
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery();
  const { data: pendingItems, isLoading: pendingLoading } = trpc.dashboard.getPendingItems.useQuery();
  const { data: siteOverview, isLoading: siteLoading } = trpc.dashboard.getSiteOverview.useQuery();

  // Calculate max values for charts
  const maxTraffic = visitorTraffic ? Math.max(...visitorTraffic.map(t => t.visitors)) : 100;
  const maxOccupancy = zoneOccupancy ? Math.max(...zoneOccupancy.map(z => z.occupancy)) : 100;
  const totalByStatus = requestsByStatus ? requestsByStatus.reduce((sum, r) => sum + r.count, 0) : 0;

  // Enterprise muted status colors
  const statusColors: Record<string, string> = {
    draft: "bg-slate-400",
    pending_l1: "bg-amber-400",
    pending_manual: "bg-indigo-400",
    approved: "bg-teal-500",
    rejected: "bg-rose-400",
    expired: "bg-gray-400",
    cancelled: "bg-slate-500",
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground">Real-time operational visibility & control</p>
        </div>
        <Button 
          variant="outline" 
          size="default" 
          onClick={() => refetchStats()}
          className="gap-2 h-10 px-4"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Row - Enterprise Muted Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Visitors</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{stats?.activeVisitors || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowUpRight className="h-3 w-3 text-teal-600 mr-1" /> 
                  <span className="text-teal-600">+12%</span>
                  <span className="ml-1">vs yesterday</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate("/approvals/l1")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Approvals</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats?.pendingApprovals || 0}</div>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> 
                  Action Required
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate("/requests")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Requests</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{stats?.totalRequestsThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approval Rate</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{stats?.approvalRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 text-teal-600 mr-1" />
                  +2% vs last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Security Alerts</CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-rose-700 dark:text-rose-400">{stats?.securityAlerts || 0}</div>
                <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">Critical</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate("/sites")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Facilities</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{stats?.sites || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.zones || 0} zones · {stats?.areas || 0} areas</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar - Enterprise Style */}
      <Card className="border-0 bg-slate-800 dark:bg-slate-900 text-white shadow-lg">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-300" />
              <span className="font-medium text-slate-100">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                size="default" 
                className="bg-slate-700 hover:bg-slate-600 text-white border-0 h-10 px-5"
                onClick={() => navigate("/approvals/l1")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> 
                L1 Queue ({stats?.pendingL1 || 0})
              </Button>
              <Button 
                size="default" 
                className="bg-slate-700 hover:bg-slate-600 text-white border-0 h-10 px-5"
                onClick={() => navigate("/approvals/l2")}
              >
                <UserCheck className="h-4 w-4 mr-2" /> 
                L2 Queue ({stats?.pendingManual || 0})
              </Button>
              <Button 
                size="default" 
                className="bg-slate-700 hover:bg-slate-600 text-white border-0 h-10 px-5"
                onClick={() => navigate("/global-overwatch")}
              >
                <Eye className="h-4 w-4 mr-2" /> 
                Global Overwatch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row - Visitor Traffic & Zone Occupancy */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                Visitor Traffic
              </CardTitle>
              <p className="text-xs text-muted-foreground">Hourly arrivals today</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {trafficLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-end justify-between px-2 pb-2 gap-1">
                  {visitorTraffic?.map((t, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-slate-600 dark:bg-slate-500 hover:bg-slate-500 dark:hover:bg-slate-400 transition-all rounded-t relative group cursor-pointer" 
                      style={{ height: `${Math.max((t.visitors / maxTraffic) * 100, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 whitespace-nowrap">
                        {t.visitors}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-2 border-t pt-2">
                  {visitorTraffic?.map((t, i) => (
                    <span key={i} className="flex-1 text-center text-[10px]">{t.hour}</span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              Zone Occupancy
            </CardTitle>
            <p className="text-xs text-muted-foreground">Current headcount by zone</p>
          </CardHeader>
          <CardContent className="pt-0">
            {zoneLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="h-[160px] w-full flex items-end justify-around gap-2 px-2">
                  {zoneOccupancy?.slice(0, 5).map((z, i) => {
                    const colors = [
                      "bg-slate-600 dark:bg-slate-500",
                      "bg-slate-500 dark:bg-slate-400",
                      "bg-teal-600 dark:bg-teal-500",
                      "bg-amber-500 dark:bg-amber-400",
                      "bg-indigo-500 dark:bg-indigo-400",
                    ];
                    return (
                      <div key={z.id} className="flex flex-col items-center flex-1">
                        <span className="text-xs font-medium mb-1 text-foreground">{z.occupancy}</span>
                        <div 
                          className={cn(
                            "w-full rounded-t transition-all hover:opacity-80 cursor-pointer",
                            colors[i % colors.length]
                          )}
                          style={{ height: `${Math.max((z.occupancy / maxOccupancy) * 130, 10)}px` }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full">{z.code}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Pending Actions Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Request Status Distribution */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              Request Status
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribution breakdown</p>
          </CardHeader>
          <CardContent className="pt-0">
            {statusLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {requestsByStatus?.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[s.status])} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-foreground">{s.label}</span>
                        <span className="text-sm font-medium text-foreground">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", statusColors[s.status])}
                          style={{ width: `${totalByStatus > 0 ? (s.count / totalByStatus) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending L1 Approvals */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending L1
              </CardTitle>
              <p className="text-xs text-muted-foreground">Awaiting initial review</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/approvals/l1")} className="h-8 px-3">
              View <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : pendingItems?.pendingL1.length === 0 ? (
              <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-teal-500" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems?.pendingL1.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => navigate("/approvals/l1")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-slate-600 dark:text-slate-400">{item.requestNumber}</p>
                        <p className="text-sm font-medium truncate text-foreground">{item.visitorName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        {item.typeLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending L2 Approvals */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" />
                Pending L2
              </CardTitle>
              <p className="text-xs text-muted-foreground">Awaiting final review</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/approvals/l2")} className="h-8 px-3">
              View <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : pendingItems?.pendingManual.length === 0 ? (
              <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-teal-500" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems?.pendingManual.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => navigate("/approvals/l2")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-slate-600 dark:text-slate-400">{item.requestNumber}</p>
                        <p className="text-sm font-medium truncate text-foreground">{item.visitorName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        {item.typeLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site Overview & Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Site Overview */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Site Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground">Facility status</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sites")} className="h-8 px-3">
              Manage <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {siteLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {siteOverview?.slice(0, 4).map((site) => (
                  <div 
                    key={site.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => navigate("/sites")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate text-foreground">{site.name}</p>
                        <p className="text-xs text-muted-foreground">{site.code}</p>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        site.status === "active" ? "bg-teal-500" : "bg-amber-500"
                      )} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {site.zoneCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {site.activeVisitors}
                      </span>
                      {site.alertCount > 0 && (
                        <span className="flex items-center gap-1 text-rose-500">
                          <AlertCircle className="h-3 w-3" /> {site.alertCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                Recent Activity
              </CardTitle>
              <p className="text-xs text-muted-foreground">Latest events</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/requests")} className="h-8 px-3">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded",
                      activity.status === "approved" ? "bg-teal-100 dark:bg-teal-900/30" :
                      activity.status === "rejected" ? "bg-rose-100 dark:bg-rose-900/30" :
                      activity.status === "pending_l1" ? "bg-amber-100 dark:bg-amber-900/30" :
                      activity.status === "pending_manual" ? "bg-indigo-100 dark:bg-indigo-900/30" :
                      "bg-slate-100 dark:bg-slate-800"
                    )}>
                      {activity.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> :
                       activity.status === "rejected" ? <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> :
                       activity.status === "pending_l1" ? <Clock className="h-3.5 w-3.5 text-amber-600" /> :
                       activity.status === "pending_manual" ? <Shield className="h-3.5 w-3.5 text-indigo-600" /> :
                       <FileText className="h-3.5 w-3.5 text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-mono text-xs text-slate-500">{activity.requestNumber}</span>
                        <span className="mx-1">·</span>
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.visitorName}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Recent Requests
            </CardTitle>
            <p className="text-xs text-muted-foreground">Latest access requests</p>
          </div>
          <Button variant="outline" size="default" onClick={() => navigate("/requests")} className="h-9 px-4">
            View All Requests
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
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Request ID</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Visitor</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity?.slice(0, 5).map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate("/requests")}>
                    <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.requestNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{row.visitorName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          row.status === "approved" ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800" :
                          row.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" :
                          row.status === "pending_l1" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
                          row.status === "pending_manual" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" :
                          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}
                      >
                        {row.status === "pending_l1" ? "Pending L1" :
                         row.status === "pending_manual" ? "Pending L2" :
                         row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
  );
}
