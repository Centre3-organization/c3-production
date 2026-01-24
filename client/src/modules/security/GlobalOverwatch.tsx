import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Layers,
  RefreshCw,
  Eye,
  Bell,
  Activity,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  ShieldAlert,
  Building2,
  Zap,
  Radio
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function GlobalOverwatch() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  
  // Fetch data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.dashboard.getStats.useQuery();
  const { data: siteOverview, isLoading: siteLoading } = trpc.dashboard.getSiteOverview.useQuery();
  const { data: alertCounts, isLoading: alertCountsLoading } = trpc.securityAlerts.getActiveCounts.useQuery();
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.securityAlerts.getAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    severity: severityFilter === "all" ? undefined : severityFilter as any,
    limit: 20,
  });
  
  // Mutations
  const acknowledgeMutation = trpc.securityAlerts.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      refetchAlerts();
      refetchStats();
    },
  });
  
  const investigateMutation = trpc.securityAlerts.investigate.useMutation({
    onSuccess: () => {
      toast.success("Investigation started");
      refetchAlerts();
      refetchStats();
    },
  });
  
  const resolveMutation = trpc.securityAlerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved");
      setResolveDialogOpen(false);
      setResolutionNotes("");
      setSelectedAlert(null);
      refetchAlerts();
      refetchStats();
    },
  });

  const handleAcknowledge = (id: number) => {
    acknowledgeMutation.mutate({ id });
  };

  const handleInvestigate = (id: number) => {
    investigateMutation.mutate({ id });
  };

  const handleResolve = (falseAlarm: boolean = false) => {
    if (selectedAlert) {
      resolveMutation.mutate({
        id: selectedAlert.id,
        resolutionNotes,
        falseAlarm,
      });
    }
  };

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
    high: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
    medium: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    low: { bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
    acknowledged: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    investigating: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400" },
    resolved: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400" },
    false_alarm: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-400" },
  };

  const typeLabels: Record<string, string> = {
    unauthorized_access: "Unauthorized Access",
    tailgating: "Tailgating",
    forced_entry: "Forced Entry",
    door_held_open: "Door Held Open",
    perimeter_breach: "Perimeter Breach",
    suspicious_activity: "Suspicious Activity",
    equipment_tamper: "Equipment Tamper",
    fire_alarm: "Fire Alarm",
    medical_emergency: "Medical Emergency",
    other: "Other",
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Eye className="h-6 w-6 text-slate-500" />
            Global Overwatch
          </h1>
          <p className="text-sm text-muted-foreground">Real-time security monitoring across all facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="default" 
            onClick={() => {
              refetchStats();
              refetchAlerts();
            }}
            className="gap-2 h-10 px-4"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Critical</CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            {alertCountsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-semibold text-rose-700 dark:text-rose-400">{alertCounts?.critical || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider">High</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            {alertCountsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-semibold text-orange-700 dark:text-orange-400">{alertCounts?.high || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Medium</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {alertCountsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{alertCounts?.medium || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Low</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            {alertCountsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-semibold text-slate-600 dark:text-slate-400">{alertCounts?.low || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-teal-200 dark:border-teal-800/50 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-teal-700 dark:text-teal-400 uppercase tracking-wider">Total Active</CardTitle>
            <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
              <Shield className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent>
            {alertCountsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-semibold text-teal-700 dark:text-teal-400">{alertCounts?.total || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Alerts Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  Security Alerts
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : alertsData?.alerts.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-3 text-teal-500" />
                  <p className="text-sm font-medium">No alerts found</p>
                  <p className="text-xs">All systems operating normally</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {alertsData?.alerts.map((alert: any) => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        severityColors[alert.severity]?.bg,
                        severityColors[alert.severity]?.border
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{alert.alert_number}</span>
                            <Badge className={cn("text-[10px]", severityColors[alert.severity]?.text, "bg-transparent border-0")}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge className={cn("text-[10px]", statusColors[alert.status]?.bg, statusColors[alert.status]?.text)}>
                              {alert.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm text-foreground mb-1">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Radio className="h-3 w-3" />
                              {typeLabels[alert.type] || alert.type}
                            </span>
                            {alert.site_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {alert.site_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {alert.status === 'active' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={acknowledgeMutation.isPending}
                              >
                                Acknowledge
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => handleInvestigate(alert.id)}
                                disabled={investigateMutation.isPending}
                              >
                                Investigate
                              </Button>
                            </>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs"
                              onClick={() => handleInvestigate(alert.id)}
                              disabled={investigateMutation.isPending}
                            >
                              Investigate
                            </Button>
                          )}
                          {(alert.status === 'active' || alert.status === 'acknowledged' || alert.status === 'investigating') && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setResolveDialogOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Site Status Panel */}
        <div className="space-y-4">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Site Status
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/sites")} className="h-8 px-3">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {siteLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {siteOverview?.map((site: any) => (
                    <div 
                      key={site.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => navigate("/sites")}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate text-foreground">{site.name}</p>
                            <div className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              site.status === "active" ? "bg-teal-500" : "bg-amber-500"
                            )} />
                          </div>
                          <p className="text-xs text-muted-foreground">{site.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" /> {site.zoneCount} zones
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {site.activeVisitors} visitors
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

          {/* Quick Stats */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Active Visitors</span>
                  <span className="font-semibold text-foreground">{stats?.activeVisitors || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Pending L1</span>
                  <span className="font-semibold text-amber-600">{stats?.pendingL1 || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Pending L2</span>
                  <span className="font-semibold text-indigo-600">{stats?.pendingManual || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Sites</span>
                  <span className="font-semibold text-foreground">{stats?.sites || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Zones</span>
                  <span className="font-semibold text-foreground">{stats?.zones || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              {selectedAlert?.alert_number} - {selectedAlert?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                placeholder="Describe how the alert was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleResolve(true)}
              disabled={resolveMutation.isPending}
            >
              Mark as False Alarm
            </Button>
            <Button
              onClick={() => handleResolve(false)}
              disabled={resolveMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
