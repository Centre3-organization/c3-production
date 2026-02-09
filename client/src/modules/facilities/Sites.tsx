import { useState, useMemo } from "react";
import { 
  Plus, 
  Save, 
  Building2, 
  Trash2,
  Loader2,
  Download,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

// SAP Fiori-style Form Field
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

// Section Header with purple left border
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-l-4 border-[#5B2C93] pl-3 mb-4">
      <h3 className="text-base font-medium text-[#5B2C93]">{title}</h3>
    </div>
  );
}

const wizardTabs = [
  { id: "general", label: "General Information", icon: Building2 },
  { id: "location", label: "Location Details", icon: MapPin },
  { id: "configuration", label: "Configuration", icon: Settings2 },
];

export default function Sites() {
  const { canCreate, canUpdate, canDelete } = usePermissions('sites');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeTab, setActiveTab] = useState("general");
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
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message || "Failed to create site"),
  });

  const updateMutation = trpc.sites.update.useMutation({
    onSuccess: () => {
      toast.success("Site updated successfully");
      refetch();
      setDialogOpen(false);
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
    setActiveTab("general");
  };

  const handleCreate = () => { resetForm(); setDialogOpen(true); };

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
    setActiveTab("general");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Please fill in required fields (Site Code and Site Name)");
      setActiveTab("general");
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

  // Wizard navigation
  const currentTabIndex = wizardTabs.findIndex(t => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === wizardTabs.length - 1;
  const goToNextTab = () => {
    if (currentTabIndex < wizardTabs.length - 1) {
      setActiveTab(wizardTabs[currentTabIndex + 1].id);
    }
  };
  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(wizardTabs[currentTabIndex - 1].id);
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

  const activeFilters = [
    ...(regionFilter !== "all" ? [{ key: "region", label: `Region: ${regionFilter}`, onRemove: () => setRegionFilter("all") }] : []),
    ...(statusFilter !== "all" ? [{ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") }] : []),
  ];

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

      {/* ─── WIZARD DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden" showCloseButton={false}>
          <div className="flex flex-col h-full bg-[#F5F5F5]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5B2C93] flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-medium text-[#5B2C93]">
                    {selectedSite ? "Edit Site" : "Create New Site"}
                  </h1>
                  <p className="text-sm text-[#6B6B6B]">
                    {selectedSite ? `Editing ${selectedSite.name}` : "Add a new data center site"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
            </div>

            {/* Main Content with Left Sidebar Tabs */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Vertical Tabs */}
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
                          isActive 
                            ? "bg-[#E8DCF5] text-[#2C2C2C] border-l-4 border-[#5B2C93]" 
                            : isCompleted
                              ? "text-[#2C2C2C] hover:bg-[#F5F5F5]"
                              : "text-[#2C2C2C] hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isActive 
                            ? "bg-[#5B2C93] text-white"
                            : isCompleted
                              ? "bg-[#D1FAE5] text-white"
                              : "bg-[#F5F5F5] text-[#6B6B6B]"
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

              {/* Right Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-6">
                    {/* General Information Tab */}
                    {activeTab === "general" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Site Identification" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Site Code" required>
                              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. KSA-DC1" />
                            </FormField>
                            <FormField label="Site Name" required>
                              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Saudi Data Center 1" />
                            </FormField>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Classification" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Site Type">
                              <Select value={formData.siteTypeId} onValueChange={(value) => setFormData({ ...formData, siteTypeId: value })}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>
                                  {siteTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Category">
                              <Select value={formData.category} onValueChange={(value: "primary" | "secondary" | "tertiary") => setFormData({ ...formData, category: value })}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="primary">Primary</SelectItem>
                                  <SelectItem value="secondary">Secondary</SelectItem>
                                  <SelectItem value="tertiary">Tertiary</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Status" required>
                              <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "maintenance" | "offline") => setFormData({ ...formData, status: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Max Capacity">
                              <Input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })} placeholder="Maximum capacity" />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location Details Tab */}
                    {activeTab === "location" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Geographic Location" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Country">
                              <Select value={formData.countryId} onValueChange={(value) => setFormData({ ...formData, countryId: value, cityId: "" })}>
                                <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country.id} value={country.id.toString()}>{country.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Region">
                              <Select value={formData.regionId} onValueChange={(value) => setFormData({ ...formData, regionId: value })}>
                                <SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger>
                                <SelectContent>
                                  {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id.toString()}>{region.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="City">
                              <Select value={formData.cityId} onValueChange={(value) => setFormData({ ...formData, cityId: value })} disabled={!formData.countryId}>
                                <SelectTrigger><SelectValue placeholder={formData.countryId ? "Select City" : "Select country first"} /></SelectTrigger>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Address & Coordinates" />
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div className="col-span-2">
                              <FormField label="Physical Address">
                                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full physical address" />
                              </FormField>
                            </div>
                            <FormField label="Latitude" hint="Decimal coordinates">
                              <Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="e.g. 24.7136" />
                            </FormField>
                            <FormField label="Longitude" hint="Decimal coordinates">
                              <Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="e.g. 46.6753" />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configuration Tab */}
                    {activeTab === "configuration" && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg border p-6">
                          <SectionHeader title="Review & Confirm" />
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Site Code</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{formData.code || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Site Name</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{formData.name || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Site Type</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{siteTypes.find(t => t.id.toString() === formData.siteTypeId)?.name || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Category</p>
                                <p className="text-sm font-medium text-[#2C2C2C] capitalize">{formData.category}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Status</p>
                                <p className="text-sm font-medium text-[#2C2C2C] capitalize">{formData.status}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Max Capacity</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{formData.maxCapacity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Country</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{countries.find(c => c.id.toString() === formData.countryId)?.name || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#6B6B6B]">City</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{cities.find(c => c.id.toString() === formData.cityId)?.name || "—"}</p>
                              </div>
                            </div>
                            {formData.address && (
                              <div>
                                <p className="text-xs text-[#6B6B6B]">Address</p>
                                <p className="text-sm font-medium text-[#2C2C2C]">{formData.address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Bottom Navigation Bar */}
                <div className="border-t bg-white px-6 py-4 flex items-center justify-between shrink-0">
                  <div>
                    {!isFirstTab && (
                      <Button variant="outline" onClick={goToPrevTab} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!isLastTab ? (
                      <Button onClick={goToNextTab} className="gap-2 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white">
                        Next
                        <ChevronRight className="h-4 w-4" />
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
                          <><Save className="h-4 w-4" /> {selectedSite ? "Update Site" : "Create Site"}</>
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
