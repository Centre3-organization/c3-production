import { useState } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  ArrowLeft, 
  Grid3X3, 
  Server, 
  Trash2,
  RefreshCw,
  Loader2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

type Area = {
  id: number;
  zoneId: number;
  code: string;
  name: string;
  description: string | null;
  areaTypeId: number | null;
  floor: string | null;
  maxCapacity: number;
  rackCount: number | null;
  infrastructureSpecs: Record<string, any> | null;
  status: "active" | "inactive" | "maintenance";
  createdAt: Date;
  updatedAt: Date;
  zoneName: string | null;
  zoneCode: string | null;
  siteId: number | null;
  siteName: string | null;
  siteCode: string | null;
  areaTypeName: string | null;
};

export default function Areas() {
  const { canCreate, canUpdate, canDelete } = usePermissions('areas');
  
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    zoneId: "",
    code: "",
    name: "",
    description: "",
    areaTypeId: "",
    floor: "",
    maxCapacity: 0,
    rackCount: 0,
    infrastructureSpecs: {
      powerType: "AC" as "AC" | "DC" | "Both",
      coolingType: "Air" as "Air" | "Liquid" | "Immersion",
      escortRequired: false,
      cagedArea: false,
    },
    status: "active" as "active" | "inactive" | "maintenance",
  });

  const { data: areas = [], isLoading, refetch } = trpc.areas.getAll.useQuery(
    zoneFilter !== "all" 
      ? { zoneId: parseInt(zoneFilter) } 
      : siteFilter !== "all" 
        ? { siteId: parseInt(siteFilter) } 
        : undefined
  );
  const { data: sites = [] } = trpc.sites.getForDropdown.useQuery();
  const { data: zones = [] } = trpc.zones.getForDropdown.useQuery(
    siteFilter !== "all" ? { siteId: parseInt(siteFilter) } : undefined
  );
  const { data: areaTypes = [] } = trpc.masterData.getAreaTypes.useQuery();

  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => {
      toast.success("Area created successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create area");
    },
  });

  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => {
      toast.success("Area updated successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update area");
    },
  });

  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => {
      toast.success("Area deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete area");
    },
  });

  const resetForm = () => {
    setFormData({
      zoneId: "",
      code: "",
      name: "",
      description: "",
      areaTypeId: "",
      floor: "",
      maxCapacity: 0,
      rackCount: 0,
      infrastructureSpecs: {
        powerType: "AC",
        coolingType: "Air",
        escortRequired: false,
        cagedArea: false,
      },
      status: "active",
    });
    setSelectedArea(null);
  };

  const handleCreate = () => {
    resetForm();
    setView("form");
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormData({
      zoneId: area.zoneId.toString(),
      code: area.code,
      name: area.name,
      description: area.description || "",
      areaTypeId: area.areaTypeId?.toString() || "",
      floor: area.floor || "",
      maxCapacity: area.maxCapacity || 0,
      rackCount: area.rackCount || 0,
      infrastructureSpecs: {
        powerType: (area.infrastructureSpecs as any)?.powerType || "AC",
        coolingType: (area.infrastructureSpecs as any)?.coolingType || "Air",
        escortRequired: (area.infrastructureSpecs as any)?.escortRequired || false,
        cagedArea: (area.infrastructureSpecs as any)?.cagedArea || false,
      },
      status: area.status,
    });
    setView("form");
  };

  const handleSave = () => {
    if (!formData.zoneId || !formData.code || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    const payload = {
      zoneId: parseInt(formData.zoneId),
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      areaTypeId: formData.areaTypeId ? parseInt(formData.areaTypeId) : undefined,
      floor: formData.floor || undefined,
      maxCapacity: formData.maxCapacity,
      rackCount: formData.rackCount,
      infrastructureSpecs: formData.infrastructureSpecs,
      status: formData.status,
    };

    if (selectedArea) {
      updateMutation.mutate({ id: selectedArea.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this area?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredAreas = areas.filter((area) => {
    const matchesSearch = 
      area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area.zoneName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return matchesSearch;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
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
      <div className="p-6 space-y-6">
        {/* Form Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setView("list"); resetForm(); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">
                {selectedArea ? "Edit Area" : "Create New Area"}
              </h1>
              <p className="text-sm text-[#6B6B6B]">
                {selectedArea ? `Editing ${selectedArea.name}` : "Add a new area within a security zone"}
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
                <><Save className="h-4 w-4 mr-2" /> Save Area</>
              )}
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl space-y-6">
          {/* Area Details */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-[#5B2C93]" /> Area Details
              </h2>
              <span className="text-xs text-[#6B6B6B] italic">* Indicates mandatory field</span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Parent Zone <span className="text-[#DC2626]">*</span></Label>
                <Select 
                  value={formData.zoneId}
                  onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>{zone.code} - {zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Area Type</Label>
                <Select 
                  value={formData.areaTypeId}
                  onValueChange={(value) => setFormData({ ...formData, areaTypeId: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {areaTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Area Code <span className="text-[#DC2626]">*</span></Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. AREA-001" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Area Name <span className="text-[#DC2626]">*</span></Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rack Row A" 
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm font-medium text-[#2C2C2C]">Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Area description..." 
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Floor</Label>
                <Input 
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g. 1, B1, G" 
                />
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
                <Label className="text-sm font-medium text-[#2C2C2C]">Rack Count</Label>
                <Input 
                  type="number"
                  value={formData.rackCount}
                  onChange={(e) => setFormData({ ...formData, rackCount: parseInt(e.target.value) || 0 })}
                  placeholder="Number of racks" 
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

          {/* Infrastructure Specifications */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                <Server className="h-5 w-5 text-[#5B2C93]" /> Infrastructure Specifications
              </h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Power Type</Label>
                <Select 
                  value={formData.infrastructureSpecs.powerType}
                  onValueChange={(value: "AC" | "DC" | "Both") => setFormData({ 
                    ...formData, 
                    infrastructureSpecs: { ...formData.infrastructureSpecs, powerType: value } 
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">AC Power</SelectItem>
                    <SelectItem value="DC">DC Power</SelectItem>
                    <SelectItem value="Both">Both AC & DC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Cooling Type</Label>
                <Select 
                  value={formData.infrastructureSpecs.coolingType}
                  onValueChange={(value: "Air" | "Liquid" | "Immersion") => setFormData({ 
                    ...formData, 
                    infrastructureSpecs: { ...formData.infrastructureSpecs, coolingType: value } 
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Air">Air Cooling</SelectItem>
                    <SelectItem value="Liquid">Liquid Cooling</SelectItem>
                    <SelectItem value="Immersion">Immersion Cooling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Escort Required</p>
                    <p className="text-xs text-[#6B6B6B]">Visitors need escort</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.infrastructureSpecs.escortRequired}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    infrastructureSpecs: { ...formData.infrastructureSpecs, escortRequired: checked } 
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Grid3X3 className="h-5 w-5 text-[#6B6B6B]" />
                  <div>
                    <p className="font-medium text-[#2C2C2C]">Caged Area</p>
                    <p className="text-xs text-[#6B6B6B]">Physical cage enclosure</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.infrastructureSpecs.cagedArea}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    infrastructureSpecs: { ...formData.infrastructureSpecs, cagedArea: checked } 
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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Area Management</h1>
          <p className="text-sm text-[#6B6B6B]">Manage areas within security zones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Area
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input 
            placeholder="Search areas..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={siteFilter} onValueChange={(value) => { setSiteFilter(value); setZoneFilter("all"); }}>
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
        <Select value={zoneFilter} onValueChange={setZoneFilter} disabled={siteFilter === "all"}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={siteFilter === "all" ? "Select site first" : "All Zones"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id.toString()}>{zone.code} - {zone.name}</SelectItem>
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
                <TableHead className="font-medium text-xs uppercase tracking-wider">Area Code</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Area Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Zone</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Site</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Floor</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Racks</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAreas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-[#6B6B6B]">
                    No areas found. Click "Add Area" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAreas.map((area) => (
                  <TableRow 
                    key={area.id} 
                    className={`${canUpdate ? 'cursor-pointer hover:bg-[#F9FAFB]' : ''}`} 
                    onClick={() => canUpdate && handleEdit(area)}
                  >
                    <TableCell className="font-medium text-[#5B2C93]">{area.code}</TableCell>
                    <TableCell className="text-[#2C2C2C]">{area.name}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{area.zoneCode || "-"}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{area.siteCode || "-"}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{area.areaTypeName || "-"}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{area.floor || "-"}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{area.rackCount || 0}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(area.status)}`}>
                        {area.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#6B6B6B] text-xs">{formatDate(area.createdAt)}</TableCell>
                    <TableCell>
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-[#6B6B6B] hover:text-[#DC2626]"
                          onClick={(e) => handleDelete(area.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
