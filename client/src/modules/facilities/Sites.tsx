import { useState, useMemo } from "react";
import { 
  Plus, 
  Save, 
  ArrowLeft, 
  Building2, 
  Trash2,
  Loader2,
  Download,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriFormSection,
  FioriStatusBadge,
  FioriEmptyState,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
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
    onError: (error) => toast.error(error.message || "Failed to create site"),
  });

  const updateMutation = trpc.sites.update.useMutation({
    onSuccess: () => {
      toast.success("Site updated successfully");
      refetch();
      setView("list");
      resetForm();
    },
    onError: (error) => toast.error(error.message || "Failed to update site"),
  });

  const deleteMutation = trpc.sites.delete.useMutation({
    onSuccess: () => {
      toast.success("Site deleted successfully");
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to delete site"),
  });

  const resetForm = () => {
    setFormData({
      code: "", name: "", countryId: "", regionId: "", cityId: "",
      address: "", latitude: "", longitude: "", siteTypeId: "",
      category: "primary", maxCapacity: 0, status: "active",
    });
    setSelectedSite(null);
  };

  const handleCreate = () => { resetForm(); setView("form"); };

  const handleEdit = (site: Site) => {
    setSelectedSite(site);
    setFormData({
      code: site.code, name: site.name,
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
      code: formData.code, name: formData.name,
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

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch = !searchTerm ||
        site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesRegion = regionFilter === "all" || site.regionName === regionFilter;
      const matchesStatus = statusFilter === "all" || site.status === statusFilter;
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [sites, searchTerm, regionFilter, statusFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric",
    });
  };

  // Active filter chips
  const activeFilters = [
    ...(regionFilter !== "all" ? [{ key: "region", label: `Region: ${regionFilter}`, onRemove: () => setRegionFilter("all") }] : []),
    ...(statusFilter !== "all" ? [{ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") }] : []),
  ];

  // Table columns
  const columns: FioriColumn<Site>[] = [
    {
      key: "code",
      header: "Site Code",
      width: "120px",
      render: (site) => (
        <span className="font-mono text-sm font-medium text-[#5B2C93]">{site.code}</span>
      ),
    },
    {
      key: "name",
      header: "Site Name",
      render: (site) => (
        <div>
          <span className="font-medium text-[#2C2C2C]">{site.name}</span>
          {site.address && (
            <p className="text-xs text-[#6B6B6B] mt-0.5 truncate max-w-[200px]">{site.address}</p>
          )}
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (site) => (
        <span className="text-[#6B6B6B]">{site.regionName || "—"}</span>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (site) => (
        <div className="flex items-center gap-1.5 text-[#6B6B6B]">
          <MapPin className="h-3.5 w-3.5 text-[#B0B0B0]" />
          {site.cityName || "—"}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (site) => (
        <span className="text-[#6B6B6B]">{site.siteTypeName || "—"}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (site) => (
        <span className="text-xs font-medium text-[#6B6B6B] uppercase">{site.category || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (site) => <FioriStatusBadge status={site.status} />,
    },
    {
      key: "created",
      header: "Created",
      render: (site) => (
        <span className="text-xs text-[#6B6B6B]">{formatDate(site.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "60px",
      align: "right",
      render: (site) => (
        canDelete ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#B0B0B0] hover:text-[#DC2626] hover:bg-[#FFE5E5]"
            onClick={(e) => handleDelete(site.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null
      ),
    },
  ];

  // ─── FORM VIEW ───
  if (view === "form") {
    return (
      <div className="space-y-0">
        <FioriPageHeader
          title={selectedSite ? "Edit Site" : "Create New Site"}
          subtitle={selectedSite ? `Editing ${selectedSite.name}` : "Add a new data center site to the portfolio"}
          onBack={() => { setView("list"); resetForm(); }}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => { setView("list"); resetForm(); }}
                className="border-[#E0E0E0] text-[#6B6B6B]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#5B2C93] hover:bg-[#3D1C5E]"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Site</>
                )}
              </Button>
            </div>
          }
        />

        <div className="max-w-4xl space-y-6">
          {/* General Information */}
          <FioriFormSection title="General Information" icon={<Building2 className="h-4 w-4" />} showMandatory>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Site Code <span className="text-[#DC2626]">*</span></Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. KSA-DC1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Site Name <span className="text-[#DC2626]">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Saudi Data Center 1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Site Type</Label>
                <Select value={formData.siteTypeId} onValueChange={(value) => setFormData({ ...formData, siteTypeId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {siteTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Category</Label>
                <Select value={formData.category} onValueChange={(value: "primary" | "secondary" | "tertiary") => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="tertiary">Tertiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Max Capacity</Label>
                <Input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })} placeholder="Maximum capacity" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Status <span className="text-[#DC2626]">*</span></Label>
                <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "maintenance" | "offline") => setFormData({ ...formData, status: value })}>
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
          </FioriFormSection>

          {/* Location Details */}
          <FioriFormSection title="Location Details" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Country</Label>
                <Select value={formData.countryId} onValueChange={(value) => setFormData({ ...formData, countryId: value, cityId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id.toString()}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Region</Label>
                <Select value={formData.regionId} onValueChange={(value) => setFormData({ ...formData, regionId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id.toString()}>{region.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">City</Label>
                <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })} disabled={!formData.countryId}>
                  <SelectTrigger><SelectValue placeholder={formData.countryId ? "Select City" : "Select country first"} /></SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full physical address" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Latitude</Label>
                <Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Decimal coordinates" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Longitude</Label>
                <Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Decimal coordinates" />
              </div>
            </div>
          </FioriFormSection>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="space-y-0">
      <FioriPageHeader
        title="Sites Management"
        subtitle="Manage data center sites and locations"
        icon={<Building2 className="h-5 w-5" />}
        count={filteredSites.length}
        onRefresh={() => refetch()}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Export feature coming soon")}
              className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            {canCreate && (
              <Button onClick={handleCreate} size="sm" className="gap-1.5 bg-[#5B2C93] hover:bg-[#3D1C5E]">
                <Plus className="h-4 w-4" /> Add Site
              </Button>
            )}
          </>
        }
      />

      <FioriFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by code, name, or city..."
        activeFilters={activeFilters}
        onClearAll={() => { setRegionFilter("all"); setStatusFilter("all"); }}
        filters={
          <>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.name}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="mt-4">
        <FioriTable
          columns={columns}
          data={filteredSites}
          isLoading={isLoading}
          rowKey={(site) => site.id}
          onRowClick={canUpdate ? handleEdit : undefined}
          emptyIcon={<Building2 className="h-10 w-10" />}
          emptyTitle="No sites found"
          emptyDescription='Click "Add Site" to create your first data center site.'
          footerInfo={`Showing ${filteredSites.length} of ${sites.length} sites`}
        />
      </div>
    </div>
  );
}
