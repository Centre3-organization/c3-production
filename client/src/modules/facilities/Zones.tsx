import { useState, useMemo } from "react";
import { 
  Plus, 
  Save, 
  ShieldAlert, 
  Lock, 
  Unlock,
  Thermometer, 
  Video, 
  Fingerprint,
  Trash2,
  Loader2,
  Download,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

type Zone = {
  id: number;
  siteId: number;
  code: string;
  name: string;
  description: string | null;
  zoneTypeId: number | null;
  securityLevel: "low" | "medium" | "high" | "critical";
  accessPolicy: "open" | "supervised" | "restricted" | "prohibited" | null;
  maxCapacity: number;
  currentOccupancy: number;
  securityControls: Record<string, boolean> | null;
  isLocked: boolean;
  lockedBy: number | null;
  lockedAt: Date | null;
  lockReason: string | null;
  status: "active" | "inactive" | "maintenance";
  createdAt: Date;
  updatedAt: Date;
  siteName: string | null;
  siteCode: string | null;
  zoneTypeName: string | null;
};

function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#2C2C2C]">
        {label}{required && <span className="text-[#FF6B6B] ml-0.5">*</span>}:
      </Label>
      {children}
      {hint && <p className="text-xs text-[#6B6B6B]">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-l-4 border-[#5B2C93] pl-3 mb-4">
      <h3 className="text-base font-medium text-[#5B2C93]">{title}</h3>
    </div>
  );
}

const wizardTabs = [
  { id: "details", label: "Zone Details", icon: ShieldAlert },
  { id: "security", label: "Security Configuration", icon: Shield },
  { id: "controls", label: "Security Controls", icon: Settings2 },
];

export default function Zones() {
  const { canCreate, canUpdate, canDelete, hasPermission } = usePermissions('zones');
  const canLock = hasPermission('zones.lock');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [securityFilter, setSecurityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    siteId: "",
    code: "",
    name: "",
    description: "",
    zoneTypeId: "",
    securityLevel: "medium" as "low" | "medium" | "high" | "critical",
    accessPolicy: "supervised" as "open" | "supervised" | "restricted" | "prohibited",
    maxCapacity: 0,
    securityControls: {
      cctvEnabled: false,
      biometricRequired: false,
      badgeRequired: true,
      emergencyLock: false,
      fireSuppress: false,
      tempMonitor: false,
    },
    status: "active" as "active" | "inactive" | "maintenance",
  });

  const { data: zones = [], isLoading, refetch } = trpc.zones.getAll.useQuery(
    siteFilter !== "all" ? { siteId: parseInt(siteFilter) } : undefined
  );
  const { data: sites = [] } = trpc.sites.getForDropdown.useQuery();
  const { data: zoneTypes = [] } = trpc.masterData.getZoneTypes.useQuery();

  const createMutation = trpc.zones.create.useMutation({
    onSuccess: () => { toast.success("Zone created successfully"); refetch(); setDialogOpen(false); resetForm(); },
    onError: (error) => toast.error(error.message || "Failed to create zone"),
  });

  const updateMutation = trpc.zones.update.useMutation({
    onSuccess: () => { toast.success("Zone updated successfully"); refetch(); setDialogOpen(false); resetForm(); },
    onError: (error) => toast.error(error.message || "Failed to update zone"),
  });

  const deleteMutation = trpc.zones.delete.useMutation({
    onSuccess: () => { toast.success("Zone deleted successfully"); refetch(); },
    onError: (error) => toast.error(error.message || "Failed to delete zone"),
  });

  const lockMutation = trpc.zones.lock.useMutation({
    onSuccess: () => { toast.success("Zone locked successfully"); refetch(); },
    onError: (error) => toast.error(error.message || "Failed to lock zone"),
  });

  const unlockMutation = trpc.zones.unlock.useMutation({
    onSuccess: () => { toast.success("Zone unlocked successfully"); refetch(); },
    onError: (error) => toast.error(error.message || "Failed to unlock zone"),
  });

  const resetForm = () => {
    setFormData({
      siteId: "", code: "", name: "", description: "", zoneTypeId: "",
      securityLevel: "medium", accessPolicy: "supervised", maxCapacity: 0,
      securityControls: { cctvEnabled: false, biometricRequired: false, badgeRequired: true, emergencyLock: false, fireSuppress: false, tempMonitor: false },
      status: "active",
    });
    setSelectedZone(null);
    setActiveTab("details");
  };

  const handleCreate = () => { resetForm(); setDialogOpen(true); };

  const handleEdit = (zone: Zone) => {
    setSelectedZone(zone);
    setFormData({
      siteId: zone.siteId.toString(), code: zone.code, name: zone.name,
      description: zone.description || "",
      zoneTypeId: zone.zoneTypeId?.toString() || "",
      securityLevel: zone.securityLevel,
      accessPolicy: zone.accessPolicy || "supervised",
      maxCapacity: zone.maxCapacity || 0,
      securityControls: {
        cctvEnabled: (zone.securityControls as any)?.cctvEnabled || false,
        biometricRequired: (zone.securityControls as any)?.biometricRequired || false,
        badgeRequired: (zone.securityControls as any)?.badgeRequired || true,
        emergencyLock: (zone.securityControls as any)?.emergencyLock || false,
        fireSuppress: (zone.securityControls as any)?.fireSuppress || false,
        tempMonitor: (zone.securityControls as any)?.tempMonitor || false,
      },
      status: zone.status,
    });
    setActiveTab("details");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.siteId || !formData.code || !formData.name) {
      toast.error("Please fill in required fields (Parent Site, Zone Code, Zone Name)");
      setActiveTab("details");
      return;
    }
    const payload = {
      siteId: parseInt(formData.siteId), code: formData.code, name: formData.name,
      description: formData.description || undefined,
      zoneTypeId: formData.zoneTypeId ? parseInt(formData.zoneTypeId) : undefined,
      securityLevel: formData.securityLevel, accessPolicy: formData.accessPolicy,
      maxCapacity: formData.maxCapacity, securityControls: formData.securityControls,
      status: formData.status,
    };
    if (selectedZone) { updateMutation.mutate({ id: selectedZone.id, ...payload }); }
    else { createMutation.mutate(payload); }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this zone?")) { deleteMutation.mutate({ id }); }
  };

  const handleLock = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    if (zone.isLocked) { unlockMutation.mutate({ id: zone.id }); }
    else {
      const reason = prompt("Enter lock reason:");
      if (reason) { lockMutation.mutate({ id: zone.id, reason }); }
    }
  };

  const currentTabIndex = wizardTabs.findIndex(t => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === wizardTabs.length - 1;
  const goToNextTab = () => { if (currentTabIndex < wizardTabs.length - 1) setActiveTab(wizardTabs[currentTabIndex + 1].id); };
  const goToPrevTab = () => { if (currentTabIndex > 0) setActiveTab(wizardTabs[currentTabIndex - 1].id); };

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchesSearch = !searchTerm ||
        zone.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zone.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesSecurity = securityFilter === "all" || zone.securityLevel === securityFilter;
      const matchesStatus = statusFilter === "all" || zone.status === statusFilter;
      return matchesSearch && matchesSecurity && matchesStatus;
    });
  }, [zones, searchTerm, securityFilter, statusFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const activeFilters = [
    ...(siteFilter !== "all" ? [{ key: "site", label: `Site: ${sites.find(s => s.id.toString() === siteFilter)?.name || siteFilter}`, onRemove: () => setSiteFilter("all") }] : []),
    ...(securityFilter !== "all" ? [{ key: "security", label: `Security: ${securityFilter}`, onRemove: () => setSecurityFilter("all") }] : []),
    ...(statusFilter !== "all" ? [{ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") }] : []),
  ];

  const columns: FioriColumn<Zone>[] = [
    {
      key: "code", header: "Zone Code", width: "120px",
      render: (zone) => <span className="font-mono text-sm font-medium text-[#5B2C93]">{zone.code}</span>,
    },
    {
      key: "name", header: "Zone Name",
      render: (zone) => (
        <div>
          <span className="font-medium text-[#2C2C2C]">{zone.name}</span>
          {zone.description && <p className="text-xs text-[#6B6B6B] mt-0.5 truncate max-w-[200px]">{zone.description}</p>}
        </div>
      ),
    },
    {
      key: "site", header: "Parent Site",
      render: (zone) => <span className="text-[#6B6B6B]">{zone.siteCode ? `${zone.siteCode} — ${zone.siteName}` : "—"}</span>,
    },
    {
      key: "type", header: "Type",
      render: (zone) => <span className="text-[#6B6B6B]">{zone.zoneTypeName || "—"}</span>,
    },
    {
      key: "security", header: "Security",
      render: (zone) => <FioriStatusBadge status={zone.securityLevel} />,
    },
    {
      key: "access", header: "Access Policy",
      render: (zone) => zone.accessPolicy ? <FioriStatusBadge status={zone.accessPolicy} /> : <span className="text-[#B0B0B0]">—</span>,
    },
    {
      key: "locked", header: "Lock",
      render: (zone) => zone.isLocked ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] bg-[#FFE5E5] px-2 py-0.5 rounded-full">
          <Lock className="h-3 w-3" /> Locked
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0D9488] bg-[#E8F9F8] px-2 py-0.5 rounded-full">
          <Unlock className="h-3 w-3" /> Open
        </span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (zone) => <FioriStatusBadge status={zone.status} />,
    },
    {
      key: "created", header: "Created",
      render: (zone) => <span className="text-xs text-[#6B6B6B]">{formatDate(zone.createdAt)}</span>,
    },
    {
      key: "actions", header: "", width: "80px", align: "right",
      render: (zone) => (
        <div className="flex items-center gap-0.5">
          {canLock && (
            <Button variant="ghost" size="icon"
              className={`h-7 w-7 ${zone.isLocked ? "text-[#0D9488] hover:text-[#0D9488] hover:bg-[#E8F9F8]" : "text-[#D97706] hover:text-[#D97706] hover:bg-[#FFF4E5]"}`}
              onClick={(e) => handleLock(zone, e)}
              title={zone.isLocked ? "Unlock Zone" : "Lock Zone"}
            >
              {zone.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#B0B0B0] hover:text-[#DC2626] hover:bg-[#FFE5E5]"
              onClick={(e) => handleDelete(zone.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-0">
      <FioriPageHeader
        title="Security Zones"
        subtitle="Manage security zones and access levels"
        icon={<ShieldAlert className="h-5 w-5" />}
        count={filteredZones.length}
        onRefresh={() => refetch()}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Export feature coming soon")} className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {canCreate && (
              <Button onClick={handleCreate} size="sm" className="gap-1.5 bg-[#5B2C93] hover:bg-[#3D1C5E]">
                <Plus className="h-4 w-4" /> Add Zone
              </Button>
            )}
          </>
        }
      />

      <FioriFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by code, name, or site..."
        activeFilters={activeFilters}
        onClearAll={() => { setSiteFilter("all"); setSecurityFilter("all"); setStatusFilter("all"); }}
        filters={
          <>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[180px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site) => <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={securityFilter} onValueChange={setSecurityFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="Security Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="mt-4">
        <FioriTable
          columns={columns}
          data={filteredZones}
          isLoading={isLoading}
          rowKey={(zone) => zone.id}
          onRowClick={canUpdate ? handleEdit : undefined}
          emptyIcon={<ShieldAlert className="h-10 w-10" />}
          emptyTitle="No zones found"
          emptyDescription='Click "Add Zone" to create your first security zone.'
          footerInfo={`Showing ${filteredZones.length} of ${zones.length} zones`}
        />
      </div>

      {/* ─── WIZARD DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden" showCloseButton={false}>
          <div className="flex flex-col h-full bg-[#F5F5F5]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5B2C93] flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-medium text-[#5B2C93]">
                    {selectedZone ? "Edit Zone" : "Create New Zone"}
                  </h1>
                  <p className="text-sm text-[#6B6B6B]">
                    {selectedZone ? `Editing ${selectedZone.name}` : "Add a new security zone"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar Steps */}
              <div className="w-64 border-r bg-white flex flex-col">
                <div className="p-4 border-b">
                  <p className="text-sm font-medium text-[#2C2C2C] tracking-wider">Steps</p>
                </div>
                <nav className="flex-1 p-2">
                  {wizardTabs.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    const isCompleted = index < currentTabIndex;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1 ${
                          isActive ? "bg-[#E8DCF5] text-[#2C2C2C] border-l-4 border-[#5B2C93]" 
                            : "text-[#2C2C2C] hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isActive ? "bg-[#5B2C93] text-white"
                            : isCompleted ? "bg-[#D1FAE5] text-white" : "bg-[#F5F5F5] text-[#6B6B6B]"
                        }`}>
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tab.label}</p>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 text-[#5B2C93]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right Content */}
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-6">
                    {/* Zone Details Tab */}
                    {activeTab === "details" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Zone Identification" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Parent Site" required>
                              <Select value={formData.siteId} onValueChange={(value) => setFormData({ ...formData, siteId: value })}>
                                <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                                <SelectContent>{sites.map((site) => <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Zone Code" required>
                              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ZN-A01" />
                            </FormField>
                            <FormField label="Zone Name" required>
                              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Server Hall Alpha" />
                            </FormField>
                            <FormField label="Zone Type">
                              <Select value={formData.zoneTypeId} onValueChange={(value) => setFormData({ ...formData, zoneTypeId: value })}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>{zoneTypes.map((type) => <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormField>
                            <div className="col-span-2">
                              <FormField label="Description">
                                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Zone description..." rows={2} />
                              </FormField>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Configuration Tab */}
                    {activeTab === "security" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Security & Access" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Security Level">
                              <Select value={formData.securityLevel} onValueChange={(value: any) => setFormData({ ...formData, securityLevel: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Access Policy">
                              <Select value={formData.accessPolicy} onValueChange={(value: any) => setFormData({ ...formData, accessPolicy: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="supervised">Supervised</SelectItem>
                                  <SelectItem value="restricted">Restricted</SelectItem>
                                  <SelectItem value="prohibited">Prohibited</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Max Capacity">
                              <Input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })} />
                            </FormField>
                            <FormField label="Status">
                              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Controls Tab */}
                    {activeTab === "controls" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Security Controls" />
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { key: "cctvEnabled", label: "CCTV Monitoring", desc: "Video surveillance", icon: <Video className="h-5 w-5 text-[#6B6B6B]" /> },
                              { key: "biometricRequired", label: "Biometric Access", desc: "Fingerprint/iris scan", icon: <Fingerprint className="h-5 w-5 text-[#6B6B6B]" /> },
                              { key: "badgeRequired", label: "Badge Required", desc: "ID card access", icon: <Shield className="h-5 w-5 text-[#6B6B6B]" /> },
                              { key: "emergencyLock", label: "Emergency Lock", desc: "Auto-lockdown capable", icon: <Lock className="h-5 w-5 text-[#6B6B6B]" /> },
                              { key: "fireSuppress", label: "Fire Suppression", desc: "Auto fire system", icon: <ShieldAlert className="h-5 w-5 text-[#6B6B6B]" /> },
                              { key: "tempMonitor", label: "Temp Monitoring", desc: "Environmental sensors", icon: <Thermometer className="h-5 w-5 text-[#6B6B6B]" /> },
                            ].map((control) => (
                              <div key={control.key} className="flex items-center justify-between p-3 border border-[#E0E0E0] rounded-lg bg-[#FAFAFA]">
                                <div className="flex items-center gap-3">
                                  {control.icon}
                                  <div>
                                    <p className="text-sm font-medium text-[#2C2C2C]">{control.label}</p>
                                    <p className="text-xs text-[#6B6B6B]">{control.desc}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={(formData.securityControls as any)[control.key]}
                                  onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    securityControls: { ...formData.securityControls, [control.key]: checked }
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Bottom Navigation */}
                <div className="border-t bg-white px-6 py-4 flex items-center justify-between shrink-0">
                  <div>
                    {!isFirstTab && (
                      <Button variant="outline" onClick={goToPrevTab} className="gap-2">
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!isLastTab ? (
                      <Button onClick={goToNextTab} className="gap-2 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white">
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="gap-2 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white"
                      >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-4 w-4" /> {selectedZone ? "Update Zone" : "Create Zone"}</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
