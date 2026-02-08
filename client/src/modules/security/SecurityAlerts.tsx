import { useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  MapPin,
  Video,
  PhoneCall,
  Clock,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

// Mock data for alerts
const initialAlerts = [
  { id: "ALT-2025-089", type: "Breach Attempt", severity: "Critical", location: "Riyadh Main DC - Zone C", timestamp: "Just now", status: "New", description: "Unauthorized access attempt detected at Server Hall 1. Biometric mismatch repeated 3 times." },
  { id: "ALT-2025-088", type: "Door Forced", severity: "High", location: "Jeddah DR - Gate 1", timestamp: "15 mins ago", status: "Viewed", description: "Perimeter gate sensor indicates forced entry. CCTV shows vehicle impact." },
  { id: "ALT-2025-087", type: "Loitering", severity: "Medium", location: "Riyadh Main DC - Lobby", timestamp: "1 hour ago", status: "Action Taken", description: "Individual loitering near security desk for >20 minutes without badge." },
  { id: "ALT-2025-086", type: "Device Offline", severity: "Low", location: "Dammam Edge - Cam 04", timestamp: "2 hours ago", status: "Action Taken", description: "Camera feed signal lost. Maintenance ticket #4421 created." },
  { id: "ALT-2025-085", type: "Fire Alarm", severity: "Critical", location: "Riyadh Main DC - Zone B", timestamp: "Yesterday", status: "Resolved", description: "False alarm triggered by maintenance dust. System reset." },
];

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (activeTab === "new") result = result.filter((a) => a.status === "New");
    else if (activeTab === "critical") result = result.filter((a) => a.severity === "Critical");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }
    return result;
  }, [alerts, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === "Critical" && a.status !== "Resolved").length,
    newAlerts: alerts.filter((a) => a.status === "New").length,
    investigating: alerts.filter((a) => a.status === "Viewed").length,
    resolved: 14,
  }), [alerts]);

  const handleView = (alert: any) => {
    setSelectedAlert(alert);
    setViewOpen(true);
    if (alert.status === "New") {
      setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, status: "Viewed" } : a)));
    }
  };

  const handleAction = (action: string) => {
    if (!selectedAlert) return;
    setAlerts(alerts.map((a) => (a.id === selectedAlert.id ? { ...a, status: "Action Taken" } : a)));
    setViewOpen(false);
    toast.success(`Action Recorded: ${action}`, { description: `Alert ${selectedAlert.id} status updated.` });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-[#FFE5E5] text-[#DC2626] border-[#DC2626]";
      case "High": return "bg-[#FEF3C7] text-[#D97706] border-[#D97706]";
      case "Medium": return "bg-[#FFF4E5] text-[#D97706] border-[#D97706]";
      default: return "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]";
    }
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (activeTab !== "all") chips.push({ key: "tab", label: `Filter: ${activeTab}`, onRemove: () => setActiveTab("all") });
    return chips;
  }, [activeTab]);

  const columns: FioriColumn<any>[] = useMemo(() => [
    {
      key: "id",
      header: "Alert ID",
      width: "140px",
      render: (a: any) => <span className="font-mono text-sm font-medium text-[#5B2C93]">{a.id}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (a: any) => <span className="font-medium text-[#2C2C2C]">{a.type}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      render: (a: any) => (
        <Badge variant="outline" className={`${getSeverityColor(a.severity)} text-xs`}>
          {a.severity}
        </Badge>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (a: any) => (
        <div className="flex items-center gap-1.5 text-sm text-[#6B6B6B]">
          <MapPin className="h-3 w-3" />
          {a.location}
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Time",
      render: (a: any) => <span className="text-sm text-[#6B6B6B]">{a.timestamp}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a: any) => (
        <FioriStatusBadge
          status={a.status === "New" ? "pending" : a.status === "Viewed" ? "info" : a.status === "Action Taken" ? "success" : a.status === "Resolved" ? "inactive" : "pending"}
          label={a.status}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      width: "80px",
      render: (a: any) => (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-[#5B2C93]" onClick={(e) => { e.stopPropagation(); handleView(a); }}>
          <Eye className="h-4 w-4" /> View
        </Button>
      ),
    },
  ], [alerts]);

  return (
    <div className="space-y-0">
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title="Security Alerts"
        subtitle="Real-time incident monitoring and response log"
        icon={<ShieldAlert className="h-5 w-5 text-[#DC2626]" />}
        count={filteredAlerts.length}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Active Critical", value: stats.critical, icon: AlertTriangle, color: "#DC2626", bg: "#FFE5E5" },
          { label: "New Alerts", value: stats.newAlerts, icon: Bell, color: "#5B2C93", bg: "#E8DCF5" },
          { label: "Under Investigation", value: stats.investigating, icon: Eye, color: "#D97706", bg: "#FEF3C7" },
          { label: "Resolved Today", value: stats.resolved, icon: CheckCircle2, color: "#059669", bg: "#D1FAE5" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#E0E0E0] rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] font-medium">{kpi.label}</p>
                <p className="text-xl font-semibold text-[#2C2C2C]">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SAP Fiori Filter Bar */}
      <FioriFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search alerts by ID, type, or location..."
        activeFilters={activeFilterChips}
        onClearAll={() => setActiveTab("all")}
        filters={
          <div className="flex gap-1">
            {[
              { key: "all", label: "All Alerts" },
              { key: "new", label: "New", dot: stats.newAlerts > 0 },
              { key: "critical", label: "Critical Only" },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                className={`h-8 text-xs relative ${activeTab === tab.key ? "bg-[#5B2C93] text-white hover:bg-[#3D1C5E]" : "text-[#6B6B6B]"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.dot && activeTab !== tab.key && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#DC2626]" />
                )}
              </Button>
            ))}
          </div>
        }
      />

      {/* SAP Fiori Table */}
      <FioriTable
        columns={columns}
        data={filteredAlerts}
        isLoading={false}
        rowKey={(a: any) => a.id}
        onRowClick={(a: any) => handleView(a)}
        rowClassName={(a: any) => a.status === "New" ? "bg-[#E8DCF5]/30" : ""}
        emptyIcon={<ShieldAlert className="h-10 w-10" />}
        emptyTitle="No alerts found"
        emptyDescription="All clear. No security alerts match your criteria."
        footerInfo={`Showing ${filteredAlerts.length} of ${alerts.length} alerts`}
      />

      {/* Alert Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl p-0">
          <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0]">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
              Incident Details
            </DialogTitle>
            <DialogDescription className="mt-1">
              {selectedAlert?.id} \u2014 {selectedAlert?.timestamp}
            </DialogDescription>
          </div>

          {selectedAlert && (
            <div className="px-6 py-4 space-y-5">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg border border-[#E0E0E0]">
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B6B] uppercase tracking-wider">Incident Type</span>
                  <p className="font-semibold text-lg text-[#2C2C2C]">{selectedAlert.type}</p>
                </div>
                <Badge className={`${getSeverityColor(selectedAlert.severity)} text-sm px-3 py-1`}>
                  {selectedAlert.severity} Severity
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B6B] flex items-center gap-1 uppercase tracking-wider">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="font-medium text-[#2C2C2C]">{selectedAlert.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B6B] flex items-center gap-1 uppercase tracking-wider">
                    <Clock className="h-3 w-3" /> Detected At
                  </span>
                  <p className="font-medium text-[#2C2C2C]">{selectedAlert.timestamp}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs text-[#6B6B6B] uppercase tracking-wider">Description</h4>
                <p className="text-sm text-[#2C2C2C] bg-[#FAFAFA] p-3 rounded-md border border-[#E0E0E0]">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 border-[#E0E0E0]">
                  <Video className="h-4 w-4" /> View Playback
                </Button>
                <Button variant="outline" className="flex-1 gap-2 border-[#E0E0E0]">
                  <PhoneCall className="h-4 w-4" /> Contact Guard
                </Button>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2">
                  Take Action <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Response Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("Dispatch Patrol")}>Dispatch Patrol Unit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("Lockdown Zone")}>Initiate Zone Lockdown</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("False Alarm")}>Mark as False Alarm</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("Escalate")} className="text-[#DC2626]">Escalate to Supervisor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
