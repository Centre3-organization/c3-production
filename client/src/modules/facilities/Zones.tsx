import { useState } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  RotateCcw, 
  Printer, 
  User, 
  ArrowLeft, 
  ShieldAlert, 
  Lock, 
  Unlock,
  Thermometer, 
  Video, 
  Fingerprint,
  Edit,
  Trash2,
  Filter,
  Download,
  Settings,
  Maximize2,
  ChevronDown,
  Calendar,
  Copy,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  // Permission checks
  const { canCreate, canUpdate, canDelete, hasPermission } = usePermissions('zones');
  const canLock = hasPermission('zones.lock');
  
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  
  // Form state
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

  // Queries
  const { data: zones = [], isLoading, refetch } = trpc.zones.getAll.useQuery(
    siteFilter !== "all" ? { siteId: parseInt(siteFilter) } : undefined
  );
  const { data: sites = [] } = trpc.sites.getForDropdown.useQuery();
  const { data: zoneTypes = [] } = trpc.masterData.getZoneTypes.useQuery();

  // Mutations
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

  // Filter zones
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
      critical: "border-red-200 text-red-700 bg-red-50",
      high: "border-orange-200 text-orange-700 bg-orange-50",
      medium: "border-yellow-200 text-yellow-700 bg-yellow-50",
      low: "border-green-200 text-green-700 bg-green-50",
    };
    return styles[level] || "border-gray-200 text-gray-700 bg-gray-50";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      maintenance: "bg-yellow-100 text-yellow-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#f4f4f4] font-poppins">
      {view === "list" ? (
        <div className="flex flex-col h-full p-4 space-y-4">
          {/* SAP Fiori Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Security Zones</h1>
              <ChevronDown className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button onClick={handleCreate} className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Zone
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800">Standard</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search" 
                  className="pl-9 h-9 bg-gray-50 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Site: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Zone Type: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {zoneTypes.map((type) => (
                    <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4">Go</Button>
                <Button variant="ghost" className="h-9 text-[#0f62fe] font-medium" onClick={() => { setSearchTerm(""); setSiteFilter("all"); }}>Clear Filters</Button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-700 text-sm ml-2">Zones ({filteredZones.length})</h3>
                <Separator orientation="vertical" className="h-4 mx-2" />
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input 
                    placeholder="Quick search" 
                    className="pl-7 h-7 text-xs bg-white border-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canCreate && <Button variant="ghost" size="sm" className="h-7 text-[#0f62fe] font-medium hover:bg-blue-50" onClick={handleCreate}>Create</Button>}
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0f62fe]"><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0f62fe]"><Filter className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0f62fe]"><Settings className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0f62fe]"><Maximize2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-gray-200">
                      <TableHead className="w-[40px]"><Checkbox /></TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Zone Code</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Zone Name</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Parent Site</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Security Level</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Locked</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Created Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No zones found. Click "Add Zone" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredZones.map((zone) => (
                        <TableRow 
                          key={zone.id} 
                          className={`hover:bg-blue-50/50 border-b border-gray-100 ${canUpdate ? 'cursor-pointer' : ''} group`} 
                          onClick={() => canUpdate && handleEdit(zone)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                          <TableCell className="font-medium text-[#0f62fe]">{zone.code}</TableCell>
                          <TableCell className="text-gray-700">{zone.name}</TableCell>
                          <TableCell className="text-gray-600">{zone.siteCode || "-"}</TableCell>
                          <TableCell className="text-gray-600">{zone.zoneTypeName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getSecurityLevelBadge(zone.securityLevel)}>
                              {zone.securityLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {zone.isLocked ? (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                                <Lock className="h-3 w-3 mr-1" /> Locked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Unlock className="h-3 w-3 mr-1" /> Open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(zone.status)}`}>
                              {zone.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 text-xs">{formatDate(zone.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canLock && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-7 w-7 ${zone.isLocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
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
                                  className="h-7 w-7 text-gray-400 hover:text-red-600"
                                  onClick={(e) => handleDelete(zone.id, e)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {canUpdate && <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#0f62fe]" />}
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
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* IBM Maximo Style Header for Form */}
          <div className="bg-[#161616] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
            <div className="flex items-center gap-6">
              <span className="font-bold tracking-wide text-white uppercase">
                {selectedZone ? "EDIT ZONE" : "CREATE NEW ZONE"}
              </span>
              <div className="h-5 w-px bg-gray-600" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleSave} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={() => { setView("list"); resetForm(); }} variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="uppercase tracking-wider text-[10px] font-medium text-gray-400">LOGGED IN AS:</span>
              <span className="font-bold text-white flex items-center gap-1 text-xs">
                ADMIN USER <User className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Secondary Toolbar */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-4 text-sm shadow-sm">
            <Button onClick={() => { setView("list"); resetForm(); }} variant="ghost" size="sm" className="text-[#0f62fe] hover:bg-[#0f62fe]/10 gap-2 font-medium h-8">
              <ArrowLeft className="h-4 w-4" />
              Return to List
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={handleSave}
              className="bg-[#0f62fe] hover:bg-blue-700 text-white px-4 h-8"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Zone</>
              )}
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Basic Information */}
              <div className="bg-white border shadow-sm rounded-sm">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-[#0f62fe]" /> Zone Details
                  </h2>
                  <span className="text-xs text-gray-500 italic">* Indicates mandatory field</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Parent Site <span className="text-red-600">*</span></Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Zone Type</Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Zone Code <span className="text-red-600">*</span></Label>
                    <Input 
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. ZONE-A" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Zone Name <span className="text-red-600">*</span></Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Server Room A" 
                    />
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Description</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Zone description..." 
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Security Level</Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Access Policy</Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Max Capacity</Label>
                    <Input 
                      type="number"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                      placeholder="Maximum capacity" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Status</Label>
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
              <div className="bg-white border shadow-sm rounded-sm">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#0f62fe]" /> Security Controls
                  </h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">CCTV Monitoring</p>
                        <p className="text-xs text-gray-500">24/7 video surveillance</p>
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
                      <Fingerprint className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Biometric Access</p>
                        <p className="text-xs text-gray-500">Fingerprint/Face required</p>
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
                      <ShieldAlert className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Badge Required</p>
                        <p className="text-xs text-gray-500">Access card needed</p>
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
                      <Lock className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Emergency Lock</p>
                        <p className="text-xs text-gray-500">Auto-lock on emergency</p>
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
                      <ShieldAlert className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Fire Suppression</p>
                        <p className="text-xs text-gray-500">Auto fire system</p>
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
                      <Thermometer className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Temp Monitoring</p>
                        <p className="text-xs text-gray-500">Environmental sensors</p>
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
        </div>
      )}
    </div>
  );
}
