import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  // Fetch user permissions to filter dashboard content
  const { data: permissions } = trpc.users.getMyPermissions.useQuery();
  
  // Helper to check if user has a specific permission
  const hasPermission = (category: string, action: string): boolean => {
    if (!permissions) return false;
    return (permissions as any)?.[category]?.[action] === true;
  };
  
  // Check if user is admin/super admin (has full access)
  const isAdmin = hasPermission('admin', 'full') || hasPermission('admin', 'access');
  
  // Check specific permissions for dashboard sections
  const canViewAnalytics = hasPermission('dashboard', 'analytics') || isAdmin;
  const canViewAlerts = hasPermission('alerts', 'view') || isAdmin;
  const canViewApprovals = hasPermission('approvals', 'l1') || isAdmin;
  const canViewSites = hasPermission('sites', 'read') || isAdmin;
  const canViewZones = hasPermission('zones', 'read') || isAdmin;
  
  // Fetch live data from dashboard API
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.dashboard.getStats.useQuery();
  const { data: requestsByStatus, isLoading: statusLoading } = trpc.dashboard.getRequestsByStatus.useQuery(undefined, { enabled: canViewAnalytics });
  const { data: visitorTraffic, isLoading: trafficLoading } = trpc.dashboard.getVisitorTraffic.useQuery(undefined, { enabled: canViewAnalytics });
  const { data: zoneOccupancy, isLoading: zoneLoading } = trpc.dashboard.getZoneOccupancy.useQuery(undefined, { enabled: canViewZones });
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery();
  const { data: pendingItems, isLoading: pendingLoading } = trpc.dashboard.getPendingItems.useQuery(undefined, { enabled: canViewApprovals });
  const { data: siteOverview, isLoading: siteLoading } = trpc.dashboard.getSiteOverview.useQuery(undefined, { enabled: canViewSites });

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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <Button 
          variant="outline" 
          size="default" 
          onClick={() => refetchStats()}
          className="gap-2 h-10 px-4"
        >
          <RefreshCw className="h-4 w-4" />
          {t('dashboard.refreshData')}
        </Button>
      </div>

      {/* KPI Cards Row - Enterprise Muted Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Active Visitors - Only show to users with analytics permission */}
        {canViewAnalytics && (
          <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.activeVisitors')}</CardTitle>
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
                    <span className="ml-1">{t('common.vsYesterday')}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals - Only show to users with approval permission */}
        {canViewApprovals && (
          <Card 
            className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate("/approvals/l1")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t('dashboard.pendingApprovals')}</CardTitle>
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
                    {t('common.actionRequired')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card 
          className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate("/requests")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.totalRequests')}</CardTitle>
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
                <p className="text-xs text-muted-foreground mt-1">{t('common.thisMonth')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.approvalRate')}</CardTitle>
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
                  {t('common.vsLastMonth')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Alerts - Only show to users with alerts permission */}
        {canViewAlerts && (
          <Card className="border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">{t('dashboard.securityAlerts')}</CardTitle>
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
                  <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">{t('common.critical')}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Facilities - Only show to users with sites permission */}
        {canViewSites && (
          <Card 
            className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate("/sites")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.facilities')}</CardTitle>
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
                  <p className="text-xs text-muted-foreground mt-1">{stats?.zones || 0} {t('nav.zones')} · {stats?.areas || 0} {t('nav.areas')}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions Bar - Only show to users with approval or alerts permission */}
      {(canViewApprovals || canViewAlerts) && (
        <Card className="border-0 bg-[#4f008c] dark:bg-[#3a1066] text-white shadow-lg">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-white/80" />
                <span className="font-medium text-slate-100">{t('dashboard.quickActions')}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {canViewApprovals && (
                  <>
                    <Button 
                      size="default" 
                      className="bg-[#7333a3] hover:bg-[#a54ee1] text-white border-0 h-10 px-5"
                      onClick={() => navigate("/approvals/l1")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> 
                      {t('dashboard.l1Queue')} ({stats?.pendingL1 || 0})
                    </Button>
                    <Button 
                      size="default" 
                      className="bg-[#7333a3] hover:bg-[#a54ee1] text-white border-0 h-10 px-5"
                      onClick={() => navigate("/approvals/l2")}
                    >
                      <UserCheck className="h-4 w-4 mr-2" /> 
                      {t('dashboard.l2Queue')} ({stats?.pendingManual || 0})
                    </Button>
                  </>
                )}
                {canViewAlerts && (
                  <Button 
                    size="default" 
                    className="bg-[#7333a3] hover:bg-[#a54ee1] text-white border-0 h-10 px-5"
                    onClick={() => navigate("/global-overwatch")}
                  >
                    <Eye className="h-4 w-4 mr-2" /> 
                    {t('dashboard.globalOverwatch')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row - Visitor Traffic & Zone Occupancy - Only show to users with analytics permission */}
      {canViewAnalytics && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                {t('dashboard.visitorTraffic')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.hourlyArrivals')}</p>
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
              {t('dashboard.zoneOccupancy')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('dashboard.currentHeadcount')}</p>
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
      )}

      {/* Status Distribution & Pending Actions Row - Only show to users with analytics or approvals permission */}
      {(canViewAnalytics || canViewApprovals) && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Request Status Distribution - Only show to users with analytics permission */}
        {canViewAnalytics && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              {t('dashboard.requestStatus')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('dashboard.distributionBreakdown')}</p>
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
        )}

        {/* Pending L1 Approvals - Only show to users with approvals permission */}
        {canViewApprovals && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                {t('dashboard.pendingL1')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.awaitingInitialReview')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/approvals/l1")} className="h-8 px-3">
              {t('common.view')} <ChevronRight className="h-3 w-3 ml-1" />
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
                <p className="text-sm">{t('common.allCaughtUp')}</p>
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
        )}

        {/* Pending L2 Approvals - Only show to users with approvals permission */}
        {canViewApprovals && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" />
                {t('dashboard.pendingL2')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.awaitingFinalReview')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/approvals/l2")} className="h-8 px-3">
              {t('common.view')} <ChevronRight className="h-3 w-3 ml-1" />
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
                <p className="text-sm">{t('common.allCaughtUp')}</p>
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
        )}
      </div>
      )}

      {/* Site Overview & Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Site Overview - Only show to users with sites permission */}
        {canViewSites && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                {t('dashboard.siteOverview')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.facilityStatus')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sites")} className="h-8 px-3">
              {t('common.manage')} <ChevronRight className="h-3 w-3 ml-1" />
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
        )}

        {/* Recent Activity - Visible to all users with dashboard access */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                {t('dashboard.recentActivity')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.latestSystemEvents')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/requests")} className="h-8 px-3">
              {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3 ml-1" />
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
              {t('dashboard.recentRequests')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('dashboard.latestAccessRequests')}</p>
          </div>
          <Button variant="outline" size="default" onClick={() => navigate("/requests")} className="h-9 px-4">
            {t('dashboard.viewAllRequests')}
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
                  <TableHead className="text-xs">{t('requests.requestId')}</TableHead>
                  <TableHead className="text-xs">{t('common.type')}</TableHead>
                  <TableHead className="text-xs">{t('requests.visitor')}</TableHead>
                  <TableHead className="text-xs">{t('common.status')}</TableHead>
                  <TableHead className="text-xs">{t('common.updated')}</TableHead>
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
                        {row.status === "pending_l1" ? t('status.pendingL1') :
                         row.status === "pending_manual" ? t('status.pendingL2') :
                         t(`status.${row.status}`, row.status.charAt(0).toUpperCase() + row.status.slice(1))}
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
