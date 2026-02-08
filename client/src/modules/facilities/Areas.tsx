import { useState, useMemo } from "react";
import { 
  Plus, 
  Save, 
  Grid3X3, 
  Server, 
  Trash2,
  Loader2,
  Download,
  Users as UsersIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriFormSection,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
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
    onSuccess: () => { toast.success("Area created successfully"); refetch(); setView("list"); resetForm(); },
    onError: (error) => toast.error(error.message || "Failed to create area"),
  });

  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => { toast.success("Area updated successfully"); refetch(); setView("list"); resetForm(); },
    onError: (error) => toast.error(error.message || "Failed to update area"),
  });

  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => { toast.success("Area deleted successfully"); refetch(); },
    onError: (error) => toast.error(error.message || "Failed to delete area"),
  });

  const resetForm = () => {
    setFormData({
      zoneId: "", code: "", name: "", description: "", areaTypeId: "", floor: "",
      maxCapacity: 0, rackCount: 0,
      infrastructureSpecs: { powerType: "AC", coolingType: "Air", escortRequired: false, cagedArea: false },
      status: "active",
    });
    setSelectedArea(null);
  };

  const handleCreate = () => { resetForm(); setView("form"); };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormData({
      zoneId: area.zoneId.toString(), code: area.code, name: area.name,
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
      zoneId: parseInt(formData.zoneId), code: formData.code, name: formData.name,
      description: formData.description || undefined,
      areaTypeId: formData.areaTypeId ? parseInt(formData.areaTypeId) : undefined,
      floor: formData.floor || undefined,
      maxCapacity: formData.maxCapacity, rackCount: formData.rackCount,
      infrastructureSpecs: formData.infrastructureSpecs, status: formData.status,
    };
    if (selectedArea) { updateMutation.mutate({ id: selectedArea.id, ...payload }); }
    else { createMutation.mutate(payload); }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this area?")) { deleteMutation.mutate({ id }); }
  };

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matchesSearch = !searchTerm ||
        area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (area.zoneName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "all" || area.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [areas, searchTerm, statusFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const activeFilters = [
    ...(siteFilter !== "all" ? [{ key: "site", label: `Site: ${sites.find(s => s.id.toString() === siteFilter)?.name || siteFilter}`, onRemove: () => { setSiteFilter("all"); setZoneFilter("all"); } }] : []),
    ...(zoneFilter !== "all" ? [{ key: "zone", label: `Zone: ${zones.find(z => z.id.toString() === zoneFilter)?.name || zoneFilter}`, onRemove: () => setZoneFilter("all") }] : []),
    ...(statusFilter !== "all" ? [{ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") }] : []),
  ];

  const columns: FioriColumn<Area>[] = [
    {
      key: "code", header: "Area Code", width: "120px",
      render: (area) => <span className="font-mono text-sm font-medium text-[#5B2C93]">{area.code}</span>,
    },
    {
      key: "name", header: "Area Name",
      render: (area) => (
        <div>
          <span className="font-medium text-[#2C2C2C]">{area.name}</span>
          {area.description && <p className="text-xs text-[#6B6B6B] mt-0.5 truncate max-w-[200px]">{area.description}</p>}
        </div>
      ),
    },
    {
      key: "zone", header: "Zone",
      render: (area) => <span className="text-[#6B6B6B]">{area.zoneCode ? `${area.zoneCode} — ${area.zoneName}` : "—"}</span>,
    },
    {
      key: "site", header: "Site",
      render: (area) => <span className="text-[#6B6B6B]">{area.siteCode || "—"}</span>,
    },
    {
      key: "type", header: "Type",
      render: (area) => <span className="text-[#6B6B6B]">{area.areaTypeName || "—"}</span>,
    },
    {
      key: "floor", header: "Floor",
      render: (area) => <span className="text-[#6B6B6B]">{area.floor || "—"}</span>,
    },
    {
      key: "racks", header: "Racks", align: "center",
      render: (area) => <span className="text-[#2C2C2C] font-medium">{area.rackCount || 0}</span>,
    },
    {
      key: "status", header: "Status",
      render: (area) => <FioriStatusBadge status={area.status} />,
    },
    {
      key: "created", header: "Created",
      render: (area) => <span className="text-xs text-[#6B6B6B]">{formatDate(area.createdAt)}</span>,
    },
    {
      key: "actions", header: "", width: "60px", align: "right",
      render: (area) => canDelete ? (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#B0B0B0] hover:text-[#DC2626] hover:bg-[#FFE5E5]"
          onClick={(e) => handleDelete(area.id, e)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null,
    },
  ];

  // ─── FORM VIEW ───
  if (view === "form") {
    return (
      <div className="space-y-0">
        <FioriPageHeader
          title={selectedArea ? "Edit Area" : "Create New Area"}
          subtitle={selectedArea ? `Editing ${selectedArea.name}` : "Add a new area within a security zone"}
          onBack={() => { setView("list"); resetForm(); }}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setView("list"); resetForm(); }} className="border-[#E0E0E0] text-[#6B6B6B]">Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#5B2C93] hover:bg-[#3D1C5E]">
                {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Area</>}
              </Button>
            </div>
          }
        />

        <div className="max-w-4xl space-y-6">
          <FioriFormSection title="Area Details" icon={<Grid3X3 className="h-4 w-4" />} showMandatory>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Parent Zone <span className="text-[#DC2626]">*</span></Label>
                <Select value={formData.zoneId} onValueChange={(value) => setFormData({ ...formData, zoneId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                  <SelectContent>{zones.map((zone) => <SelectItem key={zone.id} value={zone.id.toString()}>{zone.code} - {zone.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Area Type</Label>
                <Select value={formData.areaTypeId} onValueChange={(value) => setFormData({ ...formData, areaTypeId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>{areaTypes.map((type) => <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Area Code <span className="text-[#DC2626]">*</span></Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. AREA-001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Area Name <span className="text-[#DC2626]">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rack Row A" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Area description..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Floor</Label>
                <Input value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} placeholder="e.g. 1, B1, G" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Max Capacity</Label>
                <Input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Rack Count</Label>
                <Input type="number" value={formData.rackCount} onChange={(e) => setFormData({ ...formData, rackCount: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FioriFormSection>

          <FioriFormSection title="Infrastructure Specifications" icon={<Server className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Power Type</Label>
                <Select value={formData.infrastructureSpecs.powerType} onValueChange={(value: any) => setFormData({ ...formData, infrastructureSpecs: { ...formData.infrastructureSpecs, powerType: value } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">AC Power</SelectItem>
                    <SelectItem value="DC">DC Power</SelectItem>
                    <SelectItem value="Both">Both AC & DC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#2C2C2C]">Cooling Type</Label>
                <Select value={formData.infrastructureSpecs.coolingType} onValueChange={(value: any) => setFormData({ ...formData, infrastructureSpecs: { ...formData.infrastructureSpecs, coolingType: value } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Air">Air Cooling</SelectItem>
                    <SelectItem value="Liquid">Liquid Cooling</SelectItem>
                    <SelectItem value="Immersion">Immersion Cooling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: "escortRequired", label: "Escort Required", desc: "Visitors need escort", icon: <UsersIcon className="h-5 w-5 text-[#6B6B6B]" /> },
                { key: "cagedArea", label: "Caged Area", desc: "Physical cage enclosure", icon: <Grid3X3 className="h-5 w-5 text-[#6B6B6B]" /> },
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
                    checked={(formData.infrastructureSpecs as any)[control.key]}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      infrastructureSpecs: { ...formData.infrastructureSpecs, [control.key]: checked }
                    })}
                  />
                </div>
              ))}
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
        title="Area Management"
        subtitle="Manage areas within security zones"
        icon={<Grid3X3 className="h-5 w-5" />}
        count={filteredAreas.length}
        onRefresh={() => refetch()}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Export feature coming soon")} className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {canCreate && (
              <Button onClick={handleCreate} size="sm" className="gap-1.5 bg-[#5B2C93] hover:bg-[#3D1C5E]">
                <Plus className="h-4 w-4" /> Add Area
              </Button>
            )}
          </>
        }
      />

      <FioriFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by code, name, or zone..."
        activeFilters={activeFilters}
        onClearAll={() => { setSiteFilter("all"); setZoneFilter("all"); setStatusFilter("all"); }}
        filters={
          <>
            <Select value={siteFilter} onValueChange={(value) => { setSiteFilter(value); setZoneFilter("all"); }}>
              <SelectTrigger className="w-[180px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site) => <SelectItem key={site.id} value={site.id.toString()}>{site.code} - {site.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter} disabled={siteFilter === "all"}>
              <SelectTrigger className="w-[180px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder={siteFilter === "all" ? "Select site first" : "All Zones"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => <SelectItem key={zone.id} value={zone.id.toString()}>{zone.code} - {zone.name}</SelectItem>)}
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
          data={filteredAreas}
          isLoading={isLoading}
          rowKey={(area) => area.id}
          onRowClick={canUpdate ? handleEdit : undefined}
          emptyIcon={<Grid3X3 className="h-10 w-10" />}
          emptyTitle="No areas found"
          emptyDescription='Click "Add Area" to create your first area.'
          footerInfo={`Showing ${filteredAreas.length} of ${areas.length} areas`}
        />
      </div>
    </div>
  );
}
