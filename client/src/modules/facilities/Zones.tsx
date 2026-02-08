import { useState } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  ArrowLeft, 
  ShieldAlert, 
  Lock, 
  Unlock,
  Thermometer, 
  Video, 
  Fingerprint,
  Trash2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

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

export default function Zones() {
  const { canCreate, canUpdate, canDelete, hasPermission } = usePermissions('zones');
  const canLock = hasPermission('zones.lock');
  
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  
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
    onSuccess: () => {
      toast.success("Zone created successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create zone");
    },
  });

  const updateMutation = trpc.zones.update.useMutation({
    onSuccess: () => {
      toast.success("Zone updated successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update zone");
    },
  });

  const deleteMutation = trpc.zones.delete.useMutation({
    onSuccess: () => {
      toast.success("Zone deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete zone");
    },
  });

  const lockMutation = trpc.zones.lock.useMutation({
    onSuccess: () => {
      toast.success("Zone locked successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to lock zone");
    },
  });

  const unlockMutation = trpc.zones.unlock.useMutation({
    onSuccess: () => {
      toast.success("Zone unlocked successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlock zone");
    },
  });

  const resetForm = () => {
    setFormData({
      siteId: "",
      code: "",
      name: "",
      description: "",
      zoneTypeId: "",
      securityLevel: "medium",
      accessPolicy: "supervised",
      maxCapacity: 0,
      securityControls: {
        cctvEnabled: false,
        biometricRequired: false,
        badgeRequired: true,
        emergencyLock: false,
        fireSuppress: false,
        tempMonitor: false,
      },
      status: "active",
    });
    setSelectedZone(null);
  };

  const handleCreate = () => {
    resetForm();
    setView("form");
  };

  const handleEdit = (zone: Zone) => {
    setSelectedZone(zone);
    setFormData({
      siteId: zone.siteId.toString(),
      code: zone.code,
      name: zone.name,
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
    setView("form");
  };

  const handleSave = () => {
    if (!formData.siteId || !formData.code || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    const payload = {
      siteId: parseInt(formData.siteId),
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      zoneTypeId: formData.zoneTypeId ? parseInt(formData.zoneTypeId) : undefined,
      securityLevel: formData.securityLevel,
      accessPolicy: formData.accessPolicy,
      maxCapacity: formData.maxCapacity,
      securityControls: formData.securityControls,
      status: formData.status,
    };

    if (selectedZone) {
      updateMutation.mutate({ id: selectedZone.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleLock = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    if (zone.isLocked) {
      unlockMutation.mutate({ id: zone.id });
    } else {
      const reason = prompt("Enter lock reason:");
      if (reason) {
        lockMutation.mutate({ id: zone.id, reason });
      }
    }
  };

  const filteredZones = zones.filter((zone) => {
    const matchesSearch = 
      zone.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return matchesSearch;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getSecurityLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      critical: "border-[#DC2626] text-[#991B1B] bg-[#FEE2E2]",
      high: "border-[#D97706] text-[#92400E] bg-[#FEF3C7]",
      medium: "border-[#D97706] text-[#92400E] bg-[#FEF3C7]",
      low: "border-[#059669] text-[#065F46] bg-[#D1FAE5]",
    };
    return styles[level] || "border-[#D1D5DB] text-[#374151] bg-[#F3F4F6]";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-[#DCFCE7] text-[#166534]",
      inactive: "bg-[#F3F4F6] text-[#374151]",
      maintenance: "bg-[#FEF3C7] text-[#92400E]",
    };
    return styles[status] || "bg-[#F3F4F6] text-[#374151]";
  };

  if (view === "form") {
    return (
      <div className="space-y-4">
        {/* Form Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setView("list"); resetForm(); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">
                {selectedZone ? "Edit Zone" : "Create New Zone"}
              </h1>
              <p className="text-sm text-[#6B6B6B]">
                {selectedZone ? `Editing ${selectedZone.name}` : "Add a new security zone"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Zone</>
              )}
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl space-y-6">
          {/* Zone Details */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#5B2C93]" /> Zone Details
              </h2>
              <span className="text-xs text-[#6B6B6B] italic">* Indicates mandatory field</span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Parent Site <span className="text-[#DC2626]">*</span></Label>
                <Select 
                  value={formData.siteId}
                  onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Zone Type</Label>
                <Select 
                  value={formData.zoneTypeId}
                  onValueChange={(value) => setFormData({ ...formData, zoneTypeId: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {zoneTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Zone Code <span className="text-[#DC2626]">*</span></Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ZONE-A" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Zone Name <span className="text-[#DC2626]">*</span></Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Server Room A" 
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm font-medium text-[#2C2C2C]">Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Zone description..." 
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Security Level</Label>
                <Select 
                  value={formData.securityLevel}
                  onValueChange={(value: "low" | "medium" | "high" | "critical") => setFormData({ ...formData, securityLevel: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Access Policy</Label>
                <Select 
                  value={formData.accessPolicy}
                  onValueChange={(value: "open" | "supervised" | "restricted" | "prohibited") => setFormData({ ...formData, accessPolicy: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="supervised">Supervised</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="prohibited">Prohibited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Max Capacity</Label>
                <Input 
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                  placeholder="Maximum capacity" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "maintenance") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Security Controls */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#5B2C93]" /> Security Controls
              </h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">CCTV Monitoring</p>
                    <p className="text-xs text-[#6B6B6B]">24/7 video surveillance</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.cctvEnabled}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, cctvEnabled: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Biometric Access</p>
                    <p className="text-xs text-[#6B6B6B]">Fingerprint/Face required</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.biometricRequired}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, biometricRequired: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Badge Required</p>
                    <p className="text-xs text-[#6B6B6B]">Access card needed</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.badgeRequired}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, badgeRequired: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Emergency Lock</p>
                    <p className="text-xs text-[#6B6B6B]">Auto-lock on emergency</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.emergencyLock}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, emergencyLock: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Fire Suppression</p>
                    <p className="text-xs text-[#6B6B6B]">Auto fire system</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.fireSuppress}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, fireSuppress: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Temp Monitoring</p>
                    <p className="text-xs text-[#6B6B6B]">Environmental sensors</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.securityControls.tempMonitor}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    securityControls: { ...formData.securityControls, tempMonitor: checked } 
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Security Zones</h1>
          <p className="text-sm text-[#6B6B6B]">Manage security zones and access levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Zone
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input 
            placeholder="Search zones..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Zone Code</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Zone Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Parent Site</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Security Level</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Locked</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-[#6B6B6B]">
                    No zones found. Click "Add Zone" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredZones.map((zone) => (
                  <TableRow 
                    key={zone.id} 
                    className={`${canUpdate ? 'cursor-pointer hover:bg-[#F9FAFB]' : ''}`} 
                    onClick={() => canUpdate && handleEdit(zone)}
                  >
                    <TableCell className="font-medium text-[#5B2C93]">{zone.code}</TableCell>
                    <TableCell className="text-[#2C2C2C]">{zone.name}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{zone.siteCode || "-"}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{zone.zoneTypeName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSecurityLevelBadge(zone.securityLevel)}>
                        {zone.securityLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {zone.isLocked ? (
                        <Badge className="bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]">
                          <Lock className="h-3 w-3 mr-1" /> Locked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#D1FAE5] text-[#065F46] border-[#059669]">
                          <Unlock className="h-3 w-3 mr-1" /> Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(zone.status)}`}>
                        {zone.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#6B6B6B] text-xs">{formatDate(zone.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canLock && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 ${zone.isLocked ? "text-[#059669] hover:text-[#059669]" : "text-[#DC2626] hover:text-[#DC2626]"}`}
                            onClick={(e) => handleLock(zone, e)}
                            title={zone.isLocked ? "Unlock Zone" : "Lock Zone"}
                          >
                            {zone.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-[#6B6B6B] hover:text-[#DC2626]"
                            onClick={(e) => handleDelete(zone.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
