import { useState } from "react";
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
  AlertCircle,
  ShieldAlert,
  Building2,
  Zap,
  Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FioriPageHeader, FioriStatusBadge } from "@/components/fiori";

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
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    severity: severityFilter === "all" ? undefined : (severityFilter as any),
    limit: 20,
  });

  // Mutations
  const acknowledgeMutation = trpc.securityAlerts.acknowledge.useMutation({
    onSuccess: () => { toast.success("Alert acknowledged"); refetchAlerts(); refetchStats(); },
  });
  const investigateMutation = trpc.securityAlerts.investigate.useMutation({
    onSuccess: () => { toast.success("Investigation started"); refetchAlerts(); refetchStats(); },
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

  const handleAcknowledge = (id: number) => acknowledgeMutation.mutate({ id });
  const handleInvestigate = (id: number) => investigateMutation.mutate({ id });
  const handleResolve = (falseAlarm: boolean = false) => {
    if (selectedAlert) resolveMutation.mutate({ id: selectedAlert.id, resolutionNotes, falseAlarm });
  };

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", border: "border-[#DC2626]" },
    high: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", border: "border-[#D97706]" },
    medium: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", border: "border-[#D97706]" },
    low: { bg: "bg-[#F5F5F5]", text: "text-[#2C2C2C]", border: "border-[#E0E0E0]" },
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]" },
    acknowledged: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
    investigating: { bg: "bg-[#E8DCF5]", text: "text-[#5B2C93]" },
    resolved: { bg: "bg-[#D1FAE5]", text: "text-[#059669]" },
    false_alarm: { bg: "bg-[#F5F5F5]", text: "text-[#2C2C2C]" },
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
    <div className="space-y-0">
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title="Global Overwatch"
        subtitle="Real-time security monitoring across all facilities"
        icon={<Eye className="h-5 w-5" />}
        onRefresh={() => { refetchStats(); refetchAlerts(); }}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: "Critical", value: alertCounts?.critical || 0, icon: AlertCircle, color: "#DC2626", bg: "#FFE5E5", borderColor: "#DC2626" },
          { label: "High", value: alertCounts?.high || 0, icon: AlertTriangle, color: "#D97706", bg: "#FEF3C7", borderColor: "#D97706" },
          { label: "Medium", value: alertCounts?.medium || 0, icon: Bell, color: "#D97706", bg: "#FFF4E5", borderColor: "#D97706" },
          { label: "Low", value: alertCounts?.low || 0, icon: Activity, color: "#6B6B6B", bg: "#F5F5F5", borderColor: "#E0E0E0" },
          { label: "Total Active", value: alertCounts?.total || 0, icon: Shield, color: "#059669", bg: "#D1FAE5", borderColor: "#059669" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg px-4 py-3 border" style={{ borderColor: kpi.borderColor }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: kpi.color }}>{kpi.label}</p>
                {alertCountsLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Security Alerts Panel */}
        <div className="lg:col-span-2 space-y-0">
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#2C2C2C] flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-[#6B6B6B]" />
                Security Alerts
              </h3>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-[#E0E0E0]">
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
                  <SelectTrigger className="w-[130px] h-8 text-xs border-[#E0E0E0]">
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

            {/* Alert List */}
            <div className="p-4">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : alertsData?.alerts.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-[#6B6B6B]">
                  <CheckCircle2 className="h-12 w-12 mb-3 text-[#059669]" />
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
                            <span className="font-mono text-xs text-[#6B6B6B]">{alert.alert_number}</span>
                            <Badge className={cn("text-[10px]", severityColors[alert.severity]?.text, "bg-transparent border-0")}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge className={cn("text-[10px]", statusColors[alert.status]?.bg, statusColors[alert.status]?.text)}>
                              {alert.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm text-[#2C2C2C] mb-1">{alert.title}</h4>
                          <p className="text-xs text-[#6B6B6B] mb-2 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
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
                          {alert.status === "active" && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-[#E0E0E0]" onClick={() => handleAcknowledge(alert.id)} disabled={acknowledgeMutation.isPending}>
                                Acknowledge
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-[#E0E0E0]" onClick={() => handleInvestigate(alert.id)} disabled={investigateMutation.isPending}>
                                Investigate
                              </Button>
                            </>
                          )}
                          {alert.status === "acknowledged" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-[#E0E0E0]" onClick={() => handleInvestigate(alert.id)} disabled={investigateMutation.isPending}>
                              Investigate
                            </Button>
                          )}
                          {(alert.status === "active" || alert.status === "acknowledged" || alert.status === "investigating") && (
                            <Button size="sm" className="h-7 text-xs bg-[#059669] hover:bg-[#047857]" onClick={() => { setSelectedAlert(alert); setResolveDialogOpen(true); }}>
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Site Status Panel */}
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2C2C2C] flex items-center gap-2 uppercase tracking-wider">
                <Building2 className="h-4 w-4 text-[#6B6B6B]" />
                Site Status
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/sites")} className="h-7 px-2 text-xs text-[#5B2C93]">
                View All <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="p-4">
              {siteLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {siteOverview?.map((site: any) => (
                    <div
                      key={site.id}
                      className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] hover:border-[#5B2C93] transition-colors cursor-pointer"
                      onClick={() => navigate("/sites")}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate text-[#2C2C2C]">{site.name}</p>
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", site.status === "active" ? "bg-[#059669]" : "bg-[#D97706]")} />
                          </div>
                          <p className="text-xs text-[#6B6B6B] font-mono">{site.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                        <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {site.zoneCount} zones</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {site.activeVisitors} visitors</span>
                        {site.alertCount > 0 && (
                          <span className="flex items-center gap-1 text-[#DC2626]"><AlertCircle className="h-3 w-3" /> {site.alertCount}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <h3 className="text-sm font-semibold text-[#2C2C2C] flex items-center gap-2 uppercase tracking-wider">
                <Zap className="h-4 w-4 text-[#6B6B6B]" />
                Quick Stats
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: "Active Visitors", value: stats?.activeVisitors || 0, color: "#2C2C2C" },
                { label: "Pending L1", value: stats?.pendingL1 || 0, color: "#D97706" },
                { label: "Pending L2", value: stats?.pendingManual || 0, color: "#5B2C93" },
                { label: "Total Sites", value: stats?.sites || 0, color: "#2C2C2C" },
                { label: "Total Zones", value: stats?.zones || 0, color: "#2C2C2C" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
                  <span className="text-sm text-[#6B6B6B]">{stat.label}</span>
                  <span className="font-semibold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="p-0">
          <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0]">
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription className="mt-1">
              {selectedAlert?.alert_number} \u2014 {selectedAlert?.title}
            </DialogDescription>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="text-xs text-[#6B6B6B] uppercase tracking-wider font-medium">Resolution Notes</label>
              <Textarea
                placeholder="Describe how the alert was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-2 border-[#E0E0E0]"
                rows={4}
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleResolve(true)} disabled={resolveMutation.isPending} className="border-[#E0E0E0]">
              Mark as False Alarm
            </Button>
            <Button onClick={() => handleResolve(false)} disabled={resolveMutation.isPending} className="bg-[#059669] hover:bg-[#047857]">
              Resolve Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
