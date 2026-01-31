import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  RotateCcw, 
  Printer, 
  User, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  ShieldCheck,
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

type Site = {
  id: number;
  code: string;
  name: string;
  countryId: number | null;
  regionId: number | null;
  cityId: number | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  siteTypeId: number | null;
  category: "primary" | "secondary" | "tertiary" | null;
  maxCapacity: number;
  currentOccupancy: number;
  status: "active" | "inactive" | "maintenance" | "offline";
  createdAt: Date;
  updatedAt: Date;
  countryName: string | null;
  regionName: string | null;
  cityName: string | null;
  siteTypeName: string | null;
};

export default function Sites() {
  // Permission checks
  const { canCreate, canUpdate, canDelete, canRead } = usePermissions('sites');
  
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    countryId: "",
    regionId: "",
    cityId: "",
    address: "",
    latitude: "",
    longitude: "",
    siteTypeId: "",
    category: "primary" as "primary" | "secondary" | "tertiary",
    maxCapacity: 0,
    status: "active" as "active" | "inactive" | "maintenance" | "offline",
  });

  // Queries
  const { data: sites = [], isLoading, refetch } = trpc.sites.getAll.useQuery();
  const { data: countries = [] } = trpc.masterData.getCountries.useQuery();
  const { data: regions = [] } = trpc.masterData.getRegions.useQuery();
  const { data: cities = [] } = trpc.masterData.getCities.useQuery(
    formData.countryId ? { countryId: parseInt(formData.countryId) } : undefined
  );
  const { data: siteTypes = [] } = trpc.masterData.getSiteTypes.useQuery();

  // Mutations
  const createMutation = trpc.sites.create.useMutation({
    onSuccess: () => {
      toast.success("Site created successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create site");
    },
  });

  const updateMutation = trpc.sites.update.useMutation({
    onSuccess: () => {
      toast.success("Site updated successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update site");
    },
  });

  const deleteMutation = trpc.sites.delete.useMutation({
    onSuccess: () => {
      toast.success("Site deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete site");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      countryId: "",
      regionId: "",
      cityId: "",
      address: "",
      latitude: "",
      longitude: "",
      siteTypeId: "",
      category: "primary",
      maxCapacity: 0,
      status: "active",
    });
    setSelectedSite(null);
  };

  const handleCreate = () => {
    resetForm();
    setView("form");
  };

  const handleEdit = (site: Site) => {
    setSelectedSite(site);
    setFormData({
      code: site.code,
      name: site.name,
      countryId: site.countryId?.toString() || "",
      regionId: site.regionId?.toString() || "",
      cityId: site.cityId?.toString() || "",
      address: site.address || "",
      latitude: site.latitude || "",
      longitude: site.longitude || "",
      siteTypeId: site.siteTypeId?.toString() || "",
      category: site.category || "primary",
      maxCapacity: site.maxCapacity || 0,
      status: site.status,
    });
    setView("form");
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    const payload = {
      code: formData.code,
      name: formData.name,
      countryId: formData.countryId ? parseInt(formData.countryId) : undefined,
      regionId: formData.regionId ? parseInt(formData.regionId) : undefined,
      cityId: formData.cityId ? parseInt(formData.cityId) : undefined,
      address: formData.address || undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      siteTypeId: formData.siteTypeId ? parseInt(formData.siteTypeId) : undefined,
      category: formData.category,
      maxCapacity: formData.maxCapacity,
      status: formData.status,
    };

    if (selectedSite) {
      updateMutation.mutate({ id: selectedSite.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this site?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch = 
      site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesRegion = regionFilter === "all" || site.regionName === regionFilter;
    
    return matchesSearch && matchesRegion;
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
      offline: "bg-red-100 text-red-800",
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
              <h1 className="text-xl font-bold text-gray-900">Sites Management</h1>
              <ChevronDown className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button onClick={handleCreate} className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Site
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
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Region: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.name}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Site Type: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {siteTypes.map((type) => (
                    <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="h-9 bg-[#0f62fe] hover:bg-blue-700 text-white px-4">Go</Button>
                <Button variant="ghost" className="h-9 text-[#0f62fe] font-medium">Clear Filters</Button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-700 text-sm ml-2">Sites ({filteredSites.length})</h3>
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
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Site Code</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Site Name</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Region</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">City</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider">Created Date</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSites.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No sites found. Click "Add Site" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSites.map((site) => (
                        <TableRow 
                          key={site.id} 
                          className={`hover:bg-blue-50/50 border-b border-gray-100 ${canUpdate ? 'cursor-pointer' : ''} group`} 
                          onClick={() => canUpdate && handleEdit(site)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                          <TableCell className="font-medium text-[#0f62fe]">{site.code}</TableCell>
                          <TableCell className="text-gray-700">{site.name}</TableCell>
                          <TableCell className="text-gray-600">{site.regionName || "-"}</TableCell>
                          <TableCell className="text-gray-600">{site.cityName || "-"}</TableCell>
                          <TableCell className="text-gray-600">{site.siteTypeName || "-"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(site.status)}`}>
                              {site.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 text-xs">{formatDate(site.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canDelete && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-gray-400 hover:text-red-600"
                                  onClick={(e) => handleDelete(site.id, e)}
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
                {selectedSite ? "EDIT SITE" : "CREATE NEW SITE"}
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
                <><Save className="h-4 w-4 mr-2" /> Save Site</>
              )}
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto bg-white border shadow-sm rounded-sm">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#0f62fe]" /> Site Details
                </h2>
                <span className="text-xs text-gray-500 italic">* Indicates mandatory field</span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Site Code <span className="text-red-600">*</span></Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. KSA-DC1" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Site Name <span className="text-red-600">*</span></Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Saudi Data Center 1" 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Country</Label>
                  <Select 
                    value={formData.countryId}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value, cityId: "" })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Region</Label>
                  <Select 
                    value={formData.regionId}
                    onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id.toString()}>{region.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">City</Label>
                  <Select 
                    value={formData.cityId}
                    onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                    disabled={!formData.countryId}
                  >
                    <SelectTrigger><SelectValue placeholder={formData.countryId ? "Select City" : "Select country first"} /></SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Site Type</Label>
                  <Select 
                    value={formData.siteTypeId}
                    onValueChange={(value) => setFormData({ ...formData, siteTypeId: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      {siteTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(value: "primary" | "secondary" | "tertiary") => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="tertiary">Tertiary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full physical address" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Latitude</Label>
                  <Input 
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Decimal coordinates" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Longitude</Label>
                  <Input 
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Decimal coordinates" 
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
                  <Label className="text-xs font-bold text-gray-600 uppercase">Status <span className="text-red-600">*</span></Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "maintenance" | "offline") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
