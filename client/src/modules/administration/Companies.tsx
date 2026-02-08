import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Download,
  MoreHorizontal,
  Globe,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
  FioriFormSection,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

export default function Companies() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();

  // State
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } =
    trpc.masterData.getAllCompanies.useQuery();
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companiesFilter, setCompaniesFilter] = useState<"all" | "contractor" | "subcontractor" | "client">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newCompany, setNewCompany] = useState({
    code: "", name: "", nameAr: "", type: "contractor" as "contractor" | "subcontractor" | "client",
    parentCompanyId: undefined as number | undefined, contractReference: "", contractStartDate: "",
    contractEndDate: "", contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "",
    contactPersonPosition: "", registrationNumber: "", address: "", city: "", country: "",
    status: "active" as "active" | "inactive" | "suspended", notes: "",
  });

  const resetNewCompany = () => setNewCompany({
    code: "", name: "", nameAr: "", type: "contractor", parentCompanyId: undefined,
    contractReference: "", contractStartDate: "", contractEndDate: "", contactPersonName: "",
    contactPersonEmail: "", contactPersonPhone: "", contactPersonPosition: "", registrationNumber: "",
    address: "", city: "", country: "", status: "active", notes: "",
  });

  // Mutations
  const createCompanyMutation = trpc.masterData.createCompany.useMutation({
    onSuccess: () => { toast.success("Company Created"); refetchCompanies(); setNewCompanyOpen(false); resetNewCompany(); },
    onError: (error) => toast.error("Failed to create company", { description: error.message }),
  });

  const updateCompanyMutation = trpc.masterData.updateCompany.useMutation({
    onSuccess: () => { toast.success("Company Updated"); refetchCompanies(); setEditCompanyOpen(false); setEditingCompany(null); },
    onError: (error) => toast.error("Failed to update company", { description: error.message }),
  });

  const deleteCompanyMutation = trpc.masterData.deleteCompany.useMutation({
    onSuccess: () => { toast.success("Company Deactivated"); refetchCompanies(); },
    onError: (error) => toast.error("Failed to deactivate company", { description: error.message }),
  });

  // Derived data
  const filteredCompanies = useMemo(() => {
    return (companiesData || [])
      .filter((c) => companiesFilter === "all" || c.type === companiesFilter)
      .filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)) ||
          (c.nameAr && c.nameAr.includes(searchQuery)) || (c.contactPersonName && c.contactPersonName.toLowerCase().includes(q)) ||
          (c.contractReference && c.contractReference.toLowerCase().includes(q));
      });
  }, [companiesData, companiesFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: companiesData?.length || 0,
    contractors: companiesData?.filter((c) => c.type === "contractor").length || 0,
    subcontractors: companiesData?.filter((c) => c.type === "subcontractor").length || 0,
    clients: companiesData?.filter((c) => c.type === "client").length || 0,
    active: companiesData?.filter((c) => c.status === "active").length || 0,
  }), [companiesData]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (companiesFilter !== "all") chips.push({ key: "type", label: `Type: ${companiesFilter}`, onRemove: () => setCompaniesFilter("all") });
    return chips;
  }, [companiesFilter]);

  // Table columns
  const columns: FioriColumn<any>[] = useMemo(() => [
    {
      key: "code",
      header: t("companies.code", "Code"),
      width: "100px",
      render: (c: any) => <span className="font-mono text-sm text-[#5B2C93]">{c.code}</span>,
    },
    {
      key: "name",
      header: t("companies.companyName", "Company Name"),
      render: (c: any) => (
        <div>
          <p className="font-medium text-[#2C2C2C]">{c.name}</p>
          {c.nameAr && <p className="text-xs text-[#6B6B6B]" dir="rtl">{c.nameAr}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: t("companies.type", "Type"),
      render: (c: any) => (
        <FioriStatusBadge
          status={c.type === "contractor" ? "info" : c.type === "subcontractor" ? "warning" : "success"}
          label={c.type === "contractor" ? "Contractor" : c.type === "subcontractor" ? "Sub-Contractor" : "Client"}
          showDot={false}
        />
      ),
    },
    {
      key: "contract",
      header: t("companies.contractRef", "Contract Ref"),
      render: (c: any) => (
        <div className="text-sm">
          <p className="text-[#2C2C2C]">{c.contractReference || "\u2014"}</p>
          {c.contractStartDate && c.contractEndDate && (
            <p className="text-xs text-[#6B6B6B]">
              {new Date(c.contractStartDate).toLocaleDateString()} - {new Date(c.contractEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: t("companies.contactPerson", "Contact"),
      render: (c: any) => c.contactPersonName ? (
        <div className="text-sm">
          <p className="text-[#2C2C2C]">{c.contactPersonName}</p>
          {c.contactPersonEmail && <p className="text-xs text-[#6B6B6B]">{c.contactPersonEmail}</p>}
        </div>
      ) : <span className="text-[#B0B0B0]">\u2014</span>,
    },
    {
      key: "status",
      header: t("companies.status", "Status"),
      render: (c: any) => <FioriStatusBadge status={c.status} />,
    },
    {
      key: "actions",
      header: t("common.actions", "Actions"),
      align: "right" as const,
      width: "80px",
      render: (c: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingCompany(c); setEditCompanyOpen(true); }}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (confirm("Deactivate this company?")) deleteCompanyMutation.mutate({ id: c.id }); }} className="text-[#DC2626]">
              <Trash2 className="h-4 w-4 mr-2" /> Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t]);

  return (
    <div className="space-y-0" dir={isRTL ? "rtl" : "ltr"}>
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title={t("companies.title", "Companies")}
        subtitle={t("companies.description", "Manage contractor, sub-contractor, and client companies with their contract details.")}
        icon={<Building2 className="h-5 w-5" />}
        count={filteredCompanies.length}
        onRefresh={() => refetchCompanies()}
        actions={
          <Button onClick={() => setNewCompanyOpen(true)} className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2" size="sm">
            <Plus className="h-4 w-4" /> {t("companies.addCompany", "Add Company")}
          </Button>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: "Total", value: stats.total, icon: Building2, color: "#5B2C93", bg: "#E8DCF5", filter: "all" as const },
          { label: "Contractors", value: stats.contractors, icon: FileText, color: "#5B2C93", bg: "#E8DCF5", filter: "contractor" as const },
          { label: "Sub-Contractors", value: stats.subcontractors, icon: Users, color: "#D97706", bg: "#FFF4E5", filter: "subcontractor" as const },
          { label: "Clients", value: stats.clients, icon: Globe, color: "#059669", bg: "#D1FAE5", filter: "client" as const },
          { label: "Active", value: stats.active, icon: Building2, color: "#0D9488", bg: "#E8F9F8", filter: "all" as const },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:border-[#5B2C93] ${companiesFilter === kpi.filter && kpi.label !== "Active" && kpi.label !== "Total" ? "border-[#5B2C93] ring-1 ring-[#5B2C93]" : "border-[#E0E0E0]"}`}
            onClick={() => kpi.label !== "Active" ? setCompaniesFilter(kpi.filter) : null}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] font-medium">{kpi.label}</p>
                <p className="text-xl font-semibold text-[#2C2C2C]">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SAP Fiori Filter Bar */}
      <FioriFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("companies.searchPlaceholder", "Search by name, code, contact, or contract...")}
        activeFilters={activeFilterChips}
        onClearAll={() => setCompaniesFilter("all")}
        filters={
          <div className="flex gap-1">
            {(["all", "contractor", "subcontractor", "client"] as const).map((tab) => (
              <Button
                key={tab}
                variant={companiesFilter === tab ? "default" : "ghost"}
                size="sm"
                className={`h-8 text-xs ${companiesFilter === tab ? "bg-[#5B2C93] text-white hover:bg-[#3D1C5E]" : "text-[#6B6B6B]"}`}
                onClick={() => setCompaniesFilter(tab)}
              >
                {tab === "all" ? "All" : tab === "subcontractor" ? "Sub-Contractors" : tab.charAt(0).toUpperCase() + tab.slice(1) + "s"}
              </Button>
            ))}
          </div>
        }
        trailing={
          <Button variant="outline" size="sm" className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]" onClick={() => toast.info("Export feature coming soon")}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      {/* SAP Fiori Table */}
      <FioriTable
        columns={columns}
        data={filteredCompanies}
        isLoading={companiesLoading}
        rowKey={(c: any) => c.id}
        onRowClick={(c: any) => setLocation(`/companies/${c.id}`)}
        emptyIcon={<Building2 className="h-10 w-10" />}
        emptyTitle={searchQuery ? "No companies match your search" : "No companies found"}
        emptyDescription="Add a company to get started."
        footerInfo={`Showing ${filteredCompanies.length} of ${companiesData?.length || 0} companies`}
      />

      {/* Add Company Dialog */}
      <Dialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <form onSubmit={(e) => { e.preventDefault(); createCompanyMutation.mutate(newCompany); }}>
            <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0]">
              <DialogTitle>{t("companies.addNewCompany", "Add New Company")}</DialogTitle>
            </div>
            <div className="px-6 py-4 space-y-4">
              <FioriFormSection title="Company Details" icon={<Building2 className="h-4 w-4" />} showMandatory>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Code <span className="text-[#DC2626]">*</span></Label>
                    <Input value={newCompany.code} onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value })} placeholder="e.g., CONT-001" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Type <span className="text-[#DC2626]">*</span></Label>
                    <Select value={newCompany.type} onValueChange={(v: any) => setNewCompany({ ...newCompany, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name (English) <span className="text-[#DC2626]">*</span></Label>
                    <Input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name (Arabic)</Label>
                    <Input value={newCompany.nameAr} onChange={(e) => setNewCompany({ ...newCompany, nameAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                {newCompany.type === "subcontractor" && (
                  <div className="space-y-2 mt-4">
                    <Label>Parent Company (Main Contractor)</Label>
                    <Select value={newCompany.parentCompanyId?.toString() || ""} onValueChange={(v) => setNewCompany({ ...newCompany, parentCompanyId: v ? parseInt(v) : undefined })}>
                      <SelectTrigger><SelectValue placeholder="Select parent company" /></SelectTrigger>
                      <SelectContent>
                        {companiesData?.filter((c) => c.type === "contractor").map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </FioriFormSection>

              <FioriFormSection title="Contract Information" icon={<FileText className="h-4 w-4" />}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contract Reference</Label>
                    <Input value={newCompany.contractReference} onChange={(e) => setNewCompany({ ...newCompany, contractReference: e.target.value })} placeholder="e.g., CNT-2024-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={newCompany.contractStartDate} onChange={(e) => setNewCompany({ ...newCompany, contractStartDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={newCompany.contractEndDate} onChange={(e) => setNewCompany({ ...newCompany, contractEndDate: e.target.value })} />
                  </div>
                </div>
              </FioriFormSection>

              <FioriFormSection title="Contact Person" icon={<Users className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={newCompany.contactPersonName} onChange={(e) => setNewCompany({ ...newCompany, contactPersonName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Position</Label><Input value={newCompany.contactPersonPosition} onChange={(e) => setNewCompany({ ...newCompany, contactPersonPosition: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={newCompany.contactPersonEmail} onChange={(e) => setNewCompany({ ...newCompany, contactPersonEmail: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={newCompany.contactPersonPhone} onChange={(e) => setNewCompany({ ...newCompany, contactPersonPhone: e.target.value })} /></div>
                </div>
              </FioriFormSection>

              <FioriFormSection title="Additional Information" icon={<Globe className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Registration Number</Label><Input value={newCompany.registrationNumber} onChange={(e) => setNewCompany({ ...newCompany, registrationNumber: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newCompany.status} onValueChange={(v: any) => setNewCompany({ ...newCompany, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 mt-4"><Label>Address</Label><Input value={newCompany.address} onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2"><Label>City</Label><Input value={newCompany.city} onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Country</Label><Input value={newCompany.country} onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })} /></div>
                </div>
                <div className="space-y-2 mt-4"><Label>Notes</Label><Input value={newCompany.notes} onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })} /></div>
              </FioriFormSection>
            </div>
            <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setNewCompanyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCompanyMutation.isPending} className="bg-[#5B2C93] hover:bg-[#3D1C5E]">
                {createCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <form onSubmit={(e) => { e.preventDefault(); if (editingCompany) updateCompanyMutation.mutate(editingCompany); }}>
            <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0]">
              <DialogTitle>Edit Company</DialogTitle>
            </div>
            {editingCompany && (
              <div className="px-6 py-4 space-y-4">
                <FioriFormSection title="Company Details" icon={<Building2 className="h-4 w-4" />} showMandatory>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Code <span className="text-[#DC2626]">*</span></Label>
                      <Input value={editingCompany.code} onChange={(e) => setEditingCompany({ ...editingCompany, code: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Type <span className="text-[#DC2626]">*</span></Label>
                      <Select value={editingCompany.type} onValueChange={(v) => setEditingCompany({ ...editingCompany, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name (English) <span className="text-[#DC2626]">*</span></Label>
                      <Input value={editingCompany.name} onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name (Arabic)</Label>
                      <Input value={editingCompany.nameAr || ""} onChange={(e) => setEditingCompany({ ...editingCompany, nameAr: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                  {editingCompany.type === "subcontractor" && (
                    <div className="space-y-2 mt-4">
                      <Label>Parent Company</Label>
                      <Select value={editingCompany.parentCompanyId?.toString() || ""} onValueChange={(v) => setEditingCompany({ ...editingCompany, parentCompanyId: v ? parseInt(v) : null })}>
                        <SelectTrigger><SelectValue placeholder="Select parent company" /></SelectTrigger>
                        <SelectContent>
                          {companiesData?.filter((c) => c.type === "contractor" && c.id !== editingCompany.id).map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </FioriFormSection>

                <FioriFormSection title="Contract Information" icon={<FileText className="h-4 w-4" />}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Contract Reference</Label><Input value={editingCompany.contractReference || ""} onChange={(e) => setEditingCompany({ ...editingCompany, contractReference: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={editingCompany.contractStartDate ? new Date(editingCompany.contractStartDate).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCompany({ ...editingCompany, contractStartDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label>End Date</Label><Input type="date" value={editingCompany.contractEndDate ? new Date(editingCompany.contractEndDate).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCompany({ ...editingCompany, contractEndDate: e.target.value })} /></div>
                  </div>
                </FioriFormSection>

                <FioriFormSection title="Contact Person" icon={<Users className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={editingCompany.contactPersonName || ""} onChange={(e) => setEditingCompany({ ...editingCompany, contactPersonName: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Position</Label><Input value={editingCompany.contactPersonPosition || ""} onChange={(e) => setEditingCompany({ ...editingCompany, contactPersonPosition: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={editingCompany.contactPersonEmail || ""} onChange={(e) => setEditingCompany({ ...editingCompany, contactPersonEmail: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={editingCompany.contactPersonPhone || ""} onChange={(e) => setEditingCompany({ ...editingCompany, contactPersonPhone: e.target.value })} /></div>
                  </div>
                </FioriFormSection>

                <FioriFormSection title="Additional Information" icon={<Globe className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Registration Number</Label><Input value={editingCompany.registrationNumber || ""} onChange={(e) => setEditingCompany({ ...editingCompany, registrationNumber: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editingCompany.status} onValueChange={(v) => setEditingCompany({ ...editingCompany, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4"><Label>Address</Label><Input value={editingCompany.address || ""} onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2"><Label>City</Label><Input value={editingCompany.city || ""} onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Country</Label><Input value={editingCompany.country || ""} onChange={(e) => setEditingCompany({ ...editingCompany, country: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2 mt-4"><Label>Notes</Label><Input value={editingCompany.notes || ""} onChange={(e) => setEditingCompany({ ...editingCompany, notes: e.target.value })} /></div>
                </FioriFormSection>
              </div>
            )}
            <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditCompanyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateCompanyMutation.isPending} className="bg-[#5B2C93] hover:bg-[#3D1C5E]">
                {updateCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
