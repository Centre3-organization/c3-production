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
    draft: "bg-[#B0B0B0]",
    pending_l1: "bg-[#FFB84D]",
    pending_manual: "bg-[#5B2C93]",
    approved: "bg-[#E8F9F8]",
    rejected: "bg-[#FF6B6B]",
    expired: "bg-[#B0B0B0]",
    cancelled: "bg-[#F5F5F5]",
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">{t('dashboard.title')}</h1>
          <p className="text-sm text-[#6B6B6B]">{t('dashboard.subtitle')}</p>
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
          <Card className="border border-[#E0E0E0]/50 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2C2C2C] tracking-wider">{t('dashboard.activeVisitors')}</CardTitle>
              <div className="p-2 bg-[#F5F5F5] rounded-lg">
                <Users className="h-4 w-4 text-[#6B6B6B]" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-medium text-[#2C2C2C]">{stats?.activeVisitors || 0}</div>
                  <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 text-[#4ECDC4] mr-1" /> 
                    <span className="text-[#4ECDC4]">+12%</span>
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
            className="border border-[#FFB84D] bg-[#FFF4E5]/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate("/approvals/l1")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-[#FFB84D] uppercase tracking-wider">{t('dashboard.pendingApprovals')}</CardTitle>
              <div className="p-2 bg-[#FFF4E5] rounded-lg">
                <Clock className="h-4 w-4 text-[#FFB84D]" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-medium text-[#FFB84D]">{stats?.pendingApprovals || 0}</div>
                  <p className="text-xs text-[#FFB84D] mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" /> 
                    {t('common.actionRequired')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card 
          className="border border-[#E0E0E0]/50 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate("/requests")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2C2C2C] tracking-wider">{t('dashboard.totalRequests')}</CardTitle>
            <div className="p-2 bg-[#F5F5F5] rounded-lg">
              <FileText className="h-4 w-4 text-[#6B6B6B]" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-medium text-[#2C2C2C]">{stats?.totalRequestsThisMonth || 0}</div>
                <p className="text-xs text-[#6B6B6B] mt-1">{t('common.thisMonth')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E0E0E0]/50 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2C2C2C] tracking-wider">{t('dashboard.approvalRate')}</CardTitle>
            <div className="p-2 bg-[#F5F5F5] rounded-lg">
              <Target className="h-4 w-4 text-[#6B6B6B]" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-medium text-[#2C2C2C]">{stats?.approvalRate || 0}%</div>
                <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 text-[#4ECDC4] mr-1" />
                  {t('common.vsLastMonth')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Alerts - Only show to users with alerts permission */}
        {canViewAlerts && (
          <Card className="border border-[#FF6B6B] bg-[#FFE5E5]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-[#FF6B6B] uppercase tracking-wider">{t('dashboard.securityAlerts')}</CardTitle>
              <div className="p-2 bg-[#FFE5E5] rounded-lg">
                <ShieldAlert className="h-4 w-4 text-[#FF6B6B]" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-medium text-[#FF6B6B]">{stats?.securityAlerts || 0}</div>
                  <p className="text-xs text-[#FF6B6B] mt-1">{t('common.critical')}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Facilities - Only show to users with sites permission */}
        {canViewSites && (
          <Card 
            className="border border-[#E0E0E0]/50 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate("/sites")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2C2C2C] tracking-wider">{t('dashboard.facilities')}</CardTitle>
              <div className="p-2 bg-[#F5F5F5] rounded-lg">
                <Building2 className="h-4 w-4 text-[#6B6B6B]" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-medium text-[#2C2C2C]">{stats?.sites || 0}</div>
                  <p className="text-xs text-[#6B6B6B] mt-1">{stats?.zones || 0} {t('nav.zones')} · {stats?.areas || 0} {t('nav.areas')}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions Bar - Only show to users with approval or alerts permission */}
      {(canViewApprovals || canViewAlerts) && (
        <Card className="border-0 bg-[#5B2C93] text-white shadow-lg">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-white/80" />
                <span className="font-medium text-white">{t('dashboard.quickActions')}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {canViewApprovals && (
                  <>
                    <Button 
                      size="default" 
                      className="bg-[#5B2C93] hover:bg-[#5B2C93] text-white border-0 h-10 px-5"
                      onClick={() => navigate("/approvals/l1")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> 
                      {t('dashboard.l1Queue')} ({stats?.pendingL1 || 0})
                    </Button>
                    <Button 
                      size="default" 
                      className="bg-[#5B2C93] hover:bg-[#5B2C93] text-white border-0 h-10 px-5"
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
                    className="bg-[#5B2C93] hover:bg-[#5B2C93] text-white border-0 h-10 px-5"
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
        <Card className="col-span-4 border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#6B6B6B]" />
                {t('dashboard.visitorTraffic')}
              </CardTitle>
              <p className="text-xs text-[#6B6B6B]">{t('dashboard.hourlyArrivals')}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {trafficLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#6B6B6B]" />
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-end justify-between px-2 pb-2 gap-1">
                  {visitorTraffic?.map((t, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-[#6B6B6B] hover:bg-[#F5F5F5] transition-all rounded-t relative group cursor-pointer" 
                      style={{ height: `${Math.max((t.visitors / maxTraffic) * 100, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2C2C2C] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 whitespace-nowrap">
                        {t.visitors}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-[#6B6B6B] px-2 border-t pt-2">
                  {visitorTraffic?.map((t, i) => (
                    <span key={i} className="flex-1 text-center text-[10px]">{t.hour}</span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6B6B6B]" />
              {t('dashboard.zoneOccupancy')}
            </CardTitle>
            <p className="text-xs text-[#6B6B6B]">{t('dashboard.currentHeadcount')}</p>
          </CardHeader>
          <CardContent className="pt-0">
            {zoneLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#6B6B6B]" />
              </div>
            ) : (
              <>
                <div className="h-[160px] w-full flex items-end justify-around gap-2 px-2">
                  {zoneOccupancy?.slice(0, 5).map((z, i) => {
                    const colors = [
                      "bg-[#6B6B6B]",
                      "bg-[#F5F5F5]",
                      "bg-[#4ECDC4]",
                      "bg-[#FFF4E5]",
                      "bg-[#E8DCF5]",
                    ];
                    return (
                      <div key={z.id} className="flex flex-col items-center flex-1">
                        <span className="text-xs font-medium mb-1 text-[#2C2C2C]">{z.occupancy}</span>
                        <div 
                          className={cn(
                            "w-full rounded-t transition-all hover:opacity-80 cursor-pointer",
                            colors[i % colors.length]
                          )}
                          style={{ height: `${Math.max((z.occupancy / maxOccupancy) * 130, 10)}px` }}
                        />
                        <span className="text-[10px] text-[#6B6B6B] mt-2 truncate max-w-full">{z.code}</span>
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
        <Card className="border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#6B6B6B]" />
              {t('dashboard.requestStatus')}
            </CardTitle>
            <p className="text-xs text-[#6B6B6B]">{t('dashboard.distributionBreakdown')}</p>
          </CardHeader>
          <CardContent className="pt-0">
            {statusLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#6B6B6B]" />
              </div>
            ) : (
              <div className="space-y-3">
                {requestsByStatus?.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[s.status])} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-[#2C2C2C]">{s.label}</span>
                        <span className="text-sm font-medium text-[#2C2C2C]">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
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
        <Card className="border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FFB84D]" />
                {t('dashboard.pendingL1')}
              </CardTitle>
              <p className="text-xs text-[#6B6B6B]">{t('dashboard.awaitingInitialReview')}</p>
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
              <div className="h-[150px] flex flex-col items-center justify-center text-[#6B6B6B]">
                <CheckCircle2 className="h-10 w-10 mb-2 text-[#4ECDC4]" />
                <p className="text-sm">{t('common.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems?.pendingL1.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                    onClick={() => navigate("/approvals/l1")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#6B6B6B]">{item.requestNumber}</p>
                        <p className="text-sm font-medium truncate text-[#2C2C2C]">{item.visitorName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-[#F5F5F5] border-[#E0E0E0]">
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
        <Card className="border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#5B2C93]" />
                {t('dashboard.pendingL2')}
              </CardTitle>
              <p className="text-xs text-[#6B6B6B]">{t('dashboard.awaitingFinalReview')}</p>
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
              <div className="h-[150px] flex flex-col items-center justify-center text-[#6B6B6B]">
                <CheckCircle2 className="h-10 w-10 mb-2 text-[#4ECDC4]" />
                <p className="text-sm">{t('common.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems?.pendingManual.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                    onClick={() => navigate("/approvals/l2")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#6B6B6B]">{item.requestNumber}</p>
                        <p className="text-sm font-medium truncate text-[#2C2C2C]">{item.visitorName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-[#F5F5F5] border-[#E0E0E0]">
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
        <Card className="border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#6B6B6B]" />
                {t('dashboard.siteOverview')}
              </CardTitle>
              <p className="text-xs text-[#6B6B6B]">{t('dashboard.facilityStatus')}</p>
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
                    className="p-3 rounded-lg bg-[#F5F5F5] border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                    onClick={() => navigate("/sites")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate text-[#2C2C2C]">{site.name}</p>
                        <p className="text-xs text-[#6B6B6B]">{site.code}</p>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        site.status === "active" ? "bg-[#E8F9F8]" : "bg-[#FFF4E5]"
                      )} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {site.zoneCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {site.activeVisitors}
                      </span>
                      {site.alertCount > 0 && (
                        <span className="flex items-center gap-1 text-[#FF6B6B]">
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
        <Card className="border border-[#E0E0E0]/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#6B6B6B]" />
                {t('dashboard.recentActivity')}
              </CardTitle>
              <p className="text-xs text-[#6B6B6B]">{t('dashboard.latestSystemEvents')}</p>
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
                      activity.status === "approved" ? "bg-[#E8F9F8]" :
                      activity.status === "rejected" ? "bg-[#FFE5E5]" :
                      activity.status === "pending_l1" ? "bg-[#FFF4E5]" :
                      activity.status === "pending_manual" ? "bg-[#E8DCF5]" :
                      "bg-[#F5F5F5]"
                    )}>
                      {activity.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#4ECDC4]" /> :
                       activity.status === "rejected" ? <AlertTriangle className="h-3.5 w-3.5 text-[#FF6B6B]" /> :
                       activity.status === "pending_l1" ? <Clock className="h-3.5 w-3.5 text-[#FFB84D]" /> :
                       activity.status === "pending_manual" ? <Shield className="h-3.5 w-3.5 text-[#5B2C93]" /> :
                       <FileText className="h-3.5 w-3.5 text-[#6B6B6B]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2C2C2C] truncate">
                        <span className="font-mono text-xs text-[#6B6B6B]">{activity.requestNumber}</span>
                        <span className="mx-1">·</span>
                        {activity.action}
                      </p>
                      <p className="text-xs text-[#6B6B6B] truncate">
                        {activity.visitorName}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] whitespace-nowrap">
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
      <Card className="border border-[#E0E0E0]/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#6B6B6B]" />
              {t('dashboard.recentRequests')}
            </CardTitle>
            <p className="text-xs text-[#6B6B6B]">{t('dashboard.latestAccessRequests')}</p>
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
                    <TableCell className="font-mono text-xs text-[#6B6B6B]">{row.requestNumber}</TableCell>
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
                          row.status === "approved" ? "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]" :
                          row.status === "rejected" ? "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]" :
                          row.status === "pending_l1" ? "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]" :
                          row.status === "pending_manual" ? "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]" :
                          "bg-[#F5F5F5] text-[#2C2C2C] border-[#E0E0E0]"
                        )}
                      >
                        {row.status === "pending_l1" ? t('status.pendingL1') :
                         row.status === "pending_manual" ? t('status.pendingL2') :
                         t(`status.${row.status}`, row.status.charAt(0).toUpperCase() + row.status.slice(1))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#6B6B6B]">
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
