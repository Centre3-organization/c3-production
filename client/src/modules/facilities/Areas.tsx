import { useState } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  RotateCcw, 
  Printer, 
  User, 
  ArrowLeft, 
  Grid3X3, 
  Server, 
  Zap, 
  Wind,
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
  Loader2,
  Users
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
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  
  // Form state
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

  // Queries
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

  // Mutations
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

  // Filter areas
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
              <h1 className="text-xl font-bold text-gray-900">Area Management</h1>
              <ChevronDown className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreate} className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Area
              </Button>
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
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search" 
                  className="pl-9 h-9 bg-gray-50 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={siteFilter} onValueChange={(value) => { setSiteFilter(value); setZoneFilter("all"); }}>
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
              <Select value={zoneFilter} onValueChange={setZoneFilter} disabled={siteFilter === "all"}>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder={siteFilter === "all" ? "Select site first" : "Zone: All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>{zone.code} - {zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Area Type: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {areaTypes.map((type) => (
                    <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4">Go</Button>
                <Button variant="ghost" className="h-9 text-[#0f62fe] font-medium" onClick={() => { setSearchTerm(""); setSiteFilter("all"); setZoneFilter("all"); }}>Clear</Button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-700 text-sm ml-2">Areas ({filteredAreas.length})</h3>
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
                <Button variant="ghost" size="sm" className="h-7 text-[#0f62fe] font-medium hover:bg-blue-50" onClick={handleCreate}>Create</Button>
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
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Area Code</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Area Name</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Zone</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Site</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Floor</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Racks</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          No areas found. Click "Add Area" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAreas.map((area) => (
                        <TableRow 
                          key={area.id} 
                          className="hover:bg-blue-50/50 cursor-pointer group border-b border-gray-100" 
                          onClick={() => handleEdit(area)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                          <TableCell className="font-medium text-[#0f62fe]">{area.code}</TableCell>
                          <TableCell className="text-gray-700">{area.name}</TableCell>
                          <TableCell className="text-gray-600">{area.zoneCode || "-"}</TableCell>
                          <TableCell className="text-gray-600">{area.siteCode || "-"}</TableCell>
                          <TableCell className="text-gray-600">{area.areaTypeName || "-"}</TableCell>
                          <TableCell className="text-gray-600">{area.floor || "-"}</TableCell>
                          <TableCell className="text-gray-600">{area.rackCount || 0}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(area.status)}`}>
                              {area.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 text-xs">{formatDate(area.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-gray-400 hover:text-red-600"
                                onClick={(e) => handleDelete(area.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#0f62fe]" />
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
                {selectedArea ? "EDIT AREA" : "CREATE NEW AREA"}
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
                <><Save className="h-4 w-4 mr-2" /> Save Area</>
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
                    <Grid3X3 className="h-5 w-5 text-[#0f62fe]" /> Area Details
                  </h2>
                  <span className="text-xs text-gray-500 italic">* Indicates mandatory field</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Parent Zone <span className="text-red-600">*</span></Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Area Type</Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Area Code <span className="text-red-600">*</span></Label>
                    <Input 
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. AREA-001" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Area Name <span className="text-red-600">*</span></Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rack Row A" 
                    />
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Description</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Area description..." 
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Floor</Label>
                    <Input 
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="e.g. 1, B1, G" 
                    />
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Rack Count</Label>
                    <Input 
                      type="number"
                      value={formData.rackCount}
                      onChange={(e) => setFormData({ ...formData, rackCount: parseInt(e.target.value) || 0 })}
                      placeholder="Number of racks" 
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

              {/* Infrastructure Specifications */}
              <div className="bg-white border shadow-sm rounded-sm">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Server className="h-5 w-5 text-[#0f62fe]" /> Infrastructure Specifications
                  </h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Power Type</Label>
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
                    <Label className="text-xs font-bold text-gray-600 uppercase">Cooling Type</Label>
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
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Escort Required</p>
                        <p className="text-xs text-gray-500">Visitors need escort</p>
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
                      <Grid3X3 className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">Caged Area</p>
                        <p className="text-xs text-gray-500">Physical cage enclosure</p>
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
        </div>
      )}
    </div>
  );
}
