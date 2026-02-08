import { useState } from "react";
import { 
  Search, 
  Plus, 
  Save, 
  ArrowLeft, 
  Building2, 
  Trash2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { canCreate, canUpdate, canDelete } = usePermissions('sites');
  
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  
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

  const { data: sites = [], isLoading, refetch } = trpc.sites.getAll.useQuery();
  const { data: countries = [] } = trpc.masterData.getCountries.useQuery();
  const { data: regions = [] } = trpc.masterData.getRegions.useQuery();
  const { data: cities = [] } = trpc.masterData.getCities.useQuery(
    formData.countryId ? { countryId: parseInt(formData.countryId) } : undefined
  );
  const { data: siteTypes = [] } = trpc.masterData.getSiteTypes.useQuery();

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
      active: "bg-[#DCFCE7] text-[#166534]",
      inactive: "bg-[#F3F4F6] text-[#374151]",
      maintenance: "bg-[#FEF3C7] text-[#92400E]",
      offline: "bg-[#FEE2E2] text-[#991B1B]",
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
                {selectedSite ? "Edit Site" : "Create New Site"}
              </h1>
              <p className="text-sm text-[#6B6B6B]">
                {selectedSite ? `Editing ${selectedSite.name}` : "Add a new data center site"}
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
                <><Save className="h-4 w-4 mr-2" /> Save Site</>
              )}
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#5B2C93]" /> Site Details
              </h2>
              <span className="text-xs text-[#6B6B6B] italic">* Indicates mandatory field</span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Site Code <span className="text-[#DC2626]">*</span></Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. KSA-DC1" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#2C2C2C]">Site Name <span className="text-[#DC2626]">*</span></Label>
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
                <Label className="text-sm font-medium text-[#2C2C2C]">Status <span className="text-[#DC2626]">*</span></Label>
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Sites Management</h1>
          <p className="text-sm text-[#6B6B6B]">Manage data center sites and locations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Site
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input 
            placeholder="Search sites..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region.id} value={region.name}>{region.name}</SelectItem>
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
                <TableHead className="font-medium text-xs uppercase tracking-wider">Site Code</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Site Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Region</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">City</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#6B6B6B]">
                    No sites found. Click "Add Site" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSites.map((site) => (
                  <TableRow 
                    key={site.id} 
                    className={`${canUpdate ? 'cursor-pointer hover:bg-[#F9FAFB]' : ''}`} 
                    onClick={() => canUpdate && handleEdit(site)}
                  >
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
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-[#6B6B6B] hover:text-[#DC2626]"
                          onClick={(e) => handleDelete(site.id, e)}
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
