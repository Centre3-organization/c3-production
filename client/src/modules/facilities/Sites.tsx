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
      active: "bg-[#E8F9F8] text-[#4ECDC4]",
      inactive: "bg-[#F5F5F5] text-[#2C2C2C]",
      maintenance: "bg-[#FFF4E5] text-[#FFB84D]",
      offline: "bg-[#FFE5E5] text-[#FF6B6B]",
    };
    return styles[status] || "bg-[#F5F5F5] text-[#2C2C2C]";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#F5F5F5]">
      {view === "list" ? (
        <div className="flex flex-col h-full p-4 space-y-4">
          {/* SAP Fiori Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                <ArrowLeft className="h-5 w-5 text-[#6B6B6B]" />
              </Button>
              <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Sites Management</h1>
              <p className="text-sm text-[#6B6B6B]">Manage data center sites and locations</p>
              <ChevronDown className="h-5 w-5 text-[#5B2C93]" />
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button onClick={handleCreate} className="h-9 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white px-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Site
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E0E0E0] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg text-[#2C2C2C]">Standard</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#5B2C93]">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B0B0]" />
                <Input 
                  placeholder="Search" 
                  className="pl-9 h-9 bg-[#F5F5F5] border-[#E0E0E0]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9 bg-[#F5F5F5] border-[#E0E0E0]">
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
                <SelectTrigger className="h-9 bg-[#F5F5F5] border-[#E0E0E0]">
                  <SelectValue placeholder="Site Type: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {siteTypes.map((type) => (
                    <SelectItem key={type.id} value={type.code || type.id.toString()}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="h-9 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white px-4">Go</Button>
                <Button variant="ghost" className="h-9 text-[#5B2C93] font-medium">Clear Filters</Button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F5F5F5]/50">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[#2C2C2C] text-sm ml-2">Sites ({filteredSites.length})</h3>
                <Separator orientation="vertical" className="h-4 mx-2" />
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#B0B0B0]" />
                  <Input 
                    placeholder="Quick search" 
                    className="pl-7 h-7 text-xs bg-white border-[#E0E0E0]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canCreate && <Button variant="ghost" size="sm" className="h-7 text-[#5B2C93] font-medium hover:bg-[#E8DCF5]" onClick={handleCreate}>Create</Button>}
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#5B2C93]"><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#5B2C93]"><Filter className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#5B2C93]"><Settings className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#5B2C93]"><Maximize2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-[#E0E0E0]">
                      <TableHead className="w-[40px]"><Checkbox /></TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Site Code</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Site Name</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Region</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">City</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-medium text-[#2C2C2C] text-xs uppercase tracking-wider">Created Date</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSites.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-[#6B6B6B]">
                          No sites found. Click "Add Site" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSites.map((site) => (
                        <TableRow 
                          key={site.id} 
                          className={`hover:bg-[#E8DCF5]/50 border-b border-[#E0E0E0] ${canUpdate ? 'cursor-pointer' : ''} group`} 
                          onClick={() => canUpdate && handleEdit(site)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                          <TableCell className="font-medium text-[#5B2C93]">{site.code}</TableCell>
                          <TableCell className="text-[#2C2C2C]">{site.name}</TableCell>
                          <TableCell className="text-[#6B6B6B]">{site.regionName || "-"}</TableCell>
                          <TableCell className="text-[#6B6B6B]">{site.cityName || "-"}</TableCell>
                          <TableCell className="text-[#6B6B6B]">{site.siteTypeName || "-"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(site.status)}`}>
                              {site.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-[#6B6B6B] text-xs">{formatDate(site.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canDelete && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-[#B0B0B0] hover:text-[#FF6B6B]"
                                  onClick={(e) => handleDelete(site.id, e)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {canUpdate && <ArrowRight className="h-4 w-4 text-[#B0B0B0] group-hover:text-[#5B2C93]" />}
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
          <div className="bg-[#2C2C2C] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
            <div className="flex items-center gap-6">
              <span className="font-medium tracking-wide text-white uppercase">
                {selectedSite ? "EDIT SITE" : "CREATE NEW SITE"}
              </span>
              <div className="h-5 w-px bg-[#6B6B6B]" />
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
            <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
              <span className="uppercase tracking-wider text-[10px] font-medium text-[#B0B0B0]">LOGGED IN AS:</span>
              <span className="font-medium text-white flex items-center gap-1 text-xs">
                ADMIN USER <User className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Secondary Toolbar */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-4 text-sm shadow-sm">
            <Button onClick={() => { setView("list"); resetForm(); }} variant="ghost" size="sm" className="text-[#5B2C93] hover:bg-[#5B2C93]/10 gap-2 font-medium h-8">
              <ArrowLeft className="h-4 w-4" />
              Return to List
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={handleSave}
              className="bg-[#5B2C93] hover:bg-[#3D1C5E] text-white px-4 h-8"
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
              <div className="px-6 py-4 border-b bg-[#F5F5F5] flex justify-between items-center">
                <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#5B2C93]" /> Site Details
                </h2>
                <span className="text-xs text-[#6B6B6B] italic">* Indicates mandatory field</span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#2C2C2C]">Site Code <span className="text-[#FF6B6B]">*</span></Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. KSA-DC1" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#2C2C2C]">Site Name <span className="text-[#FF6B6B]">*</span></Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Saudi Data Center 1" 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#2C2C2C]">Country</Label>
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">Region</Label>
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">City</Label>
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">Site Type</Label>
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">Category</Label>
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full physical address" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#2C2C2C]">Latitude</Label>
                  <Input 
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Decimal coordinates" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#2C2C2C]">Longitude</Label>
                  <Input 
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Decimal coordinates" 
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
                  <Label className="text-sm font-medium text-[#2C2C2C]">Status <span className="text-[#FF6B6B]">*</span></Label>
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
