import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

export default function Companies() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Companies data
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } =
    trpc.masterData.getAllCompanies.useQuery();
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companiesFilter, setCompaniesFilter] = useState<"all" | "contractor" | "subcontractor" | "client">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newCompany, setNewCompany] = useState<{
    code: string;
    name: string;
    nameAr: string;
    type: "contractor" | "subcontractor" | "client";
    parentCompanyId: number | undefined;
    contractReference: string;
    contractStartDate: string;
    contractEndDate: string;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    contactPersonPosition: string;
    registrationNumber: string;
    address: string;
    city: string;
    country: string;
    status: "active" | "inactive" | "suspended";
    notes: string;
  }>({
    code: "",
    name: "",
    nameAr: "",
    type: "contractor",
    parentCompanyId: undefined,
    contractReference: "",
    contractStartDate: "",
    contractEndDate: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    contactPersonPosition: "",
    registrationNumber: "",
    address: "",
    city: "",
    country: "",
    status: "active",
    notes: "",
  });

  const createCompanyMutation = trpc.masterData.createCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Created");
      refetchCompanies();
      setNewCompanyOpen(false);
      setNewCompany({ code: "", name: "", nameAr: "", type: "contractor", parentCompanyId: undefined, contractReference: "", contractStartDate: "", contractEndDate: "", contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "", contactPersonPosition: "", registrationNumber: "", address: "", city: "", country: "", status: "active", notes: "" });
    },
    onError: (error) => toast.error("Failed to create company", { description: error.message }),
  });

  const updateCompanyMutation = trpc.masterData.updateCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Updated");
      refetchCompanies();
      setEditCompanyOpen(false);
      setEditingCompany(null);
    },
    onError: (error) => toast.error("Failed to update company", { description: error.message }),
  });

  const deleteCompanyMutation = trpc.masterData.deleteCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Deactivated");
      refetchCompanies();
    },
    onError: (error) => toast.error("Failed to deactivate company", { description: error.message }),
  });

  const filteredCompanies = (companiesData || [])
    .filter((c) => companiesFilter === "all" || c.type === companiesFilter)
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.nameAr && c.nameAr.includes(searchQuery)) ||
        (c.contactPersonName && c.contactPersonName.toLowerCase().includes(q)) ||
        (c.contractReference && c.contractReference.toLowerCase().includes(q))
      );
    });

  const stats = {
    total: companiesData?.length || 0,
    contractors: companiesData?.filter((c) => c.type === "contractor").length || 0,
    subcontractors: companiesData?.filter((c) => c.type === "subcontractor").length || 0,
    clients: companiesData?.filter((c) => c.type === "client").length || 0,
    active: companiesData?.filter((c) => c.status === "active").length || 0,
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("companies.title", "Companies")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("companies.description", "Manage contractor, sub-contractor, and client companies with their contract details.")}
          </p>
        </div>
        <Button onClick={() => setNewCompanyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("companies.addCompany", "Add Company")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer" onClick={() => setCompaniesFilter("all")}>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t("companies.totalCompanies", "Total Companies")}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setCompaniesFilter("contractor")}>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-blue-600">{stats.contractors}</div>
            <p className="text-xs text-muted-foreground">{t("companies.contractors", "Contractors")}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setCompaniesFilter("subcontractor")}>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-purple-600">{stats.subcontractors}</div>
            <p className="text-xs text-muted-foreground">{t("companies.subContractors", "Sub-Contractors")}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setCompaniesFilter("client")}>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">{t("companies.clients", "Clients")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{t("companies.activeCompanies", "Active")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("companies.searchPlaceholder", "Search by name, code, contact, or contract...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={companiesFilter === "all" ? "default" : "outline"} onClick={() => setCompaniesFilter("all")}>
                {t("common.all", "All")}
              </Button>
              <Button size="sm" variant={companiesFilter === "contractor" ? "default" : "outline"} onClick={() => setCompaniesFilter("contractor")}>
                {t("companies.contractors", "Contractors")}
              </Button>
              <Button size="sm" variant={companiesFilter === "subcontractor" ? "default" : "outline"} onClick={() => setCompaniesFilter("subcontractor")}>
                {t("companies.subContractors", "Sub-Contractors")}
              </Button>
              <Button size="sm" variant={companiesFilter === "client" ? "default" : "outline"} onClick={() => setCompaniesFilter("client")}>
                {t("companies.clients", "Clients")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {companiesFilter === "all"
                ? t("companies.allCompanies", "All Companies")
                : companiesFilter === "contractor"
                ? t("companies.contractors", "Contractors")
                : companiesFilter === "subcontractor"
                ? t("companies.subContractors", "Sub-Contractors")
                : t("companies.clients", "Clients")}
              <span className="text-muted-foreground font-normal ml-2">({filteredCompanies.length})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("companies.code", "Code")}</TableHead>
                  <TableHead>{t("companies.companyName", "Company Name")}</TableHead>
                  <TableHead>{t("companies.type", "Type")}</TableHead>
                  <TableHead>{t("companies.contractRef", "Contract Reference")}</TableHead>
                  <TableHead>{t("companies.contractPeriod", "Contract Period")}</TableHead>
                  <TableHead>{t("companies.contactPerson", "Contact Person")}</TableHead>
                  <TableHead>{t("companies.status", "Status")}</TableHead>
                  <TableHead className="w-[100px]">{t("common.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-mono text-sm">{company.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.nameAr && (
                          <div className="text-sm text-muted-foreground" dir="rtl">
                            {company.nameAr}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          company.type === "contractor"
                            ? "default"
                            : company.type === "subcontractor"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {company.type === "contractor"
                          ? t("companies.contractor", "Contractor")
                          : company.type === "subcontractor"
                          ? t("companies.subContractor", "Sub-Contractor")
                          : t("companies.client", "Client")}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.contractReference || "-"}</TableCell>
                    <TableCell>
                      {company.contractStartDate && company.contractEndDate ? (
                        <span className="text-sm">
                          {new Date(company.contractStartDate).toLocaleDateString()} -{" "}
                          {new Date(company.contractEndDate).toLocaleDateString()}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {company.contactPersonName ? (
                        <div className="text-sm">
                          <div>{company.contactPersonName}</div>
                          {company.contactPersonEmail && (
                            <div className="text-muted-foreground">{company.contactPersonEmail}</div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === "active" ? "default" : "secondary"}>
                        {company.status === "active"
                          ? t("common.active", "Active")
                          : t("common.inactive", "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCompany(company);
                          setEditCompanyOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Deactivate this company?"))
                            deleteCompanyMutation.mutate({ id: company.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      {searchQuery
                        ? t("companies.noResults", "No companies match your search.")
                        : t("companies.noCompanies", "No companies found. Add one to get started.")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Company Dialog */}
      <Dialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCompanyMutation.mutate(newCompany);
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("companies.addNewCompany", "Add New Company")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("companies.companyCode", "Company Code")} *</Label>
                  <Input
                    value={newCompany.code}
                    onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value })}
                    placeholder="e.g., CONT-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("companies.companyType", "Company Type")} *</Label>
                  <Select
                    value={newCompany.type}
                    onValueChange={(v: "contractor" | "subcontractor" | "client") =>
                      setNewCompany({ ...newCompany, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractor">{t("companies.contractor", "Contractor")}</SelectItem>
                      <SelectItem value="subcontractor">{t("companies.subContractor", "Sub-Contractor")}</SelectItem>
                      <SelectItem value="client">{t("companies.client", "Client")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("companies.nameEn", "Company Name (English)")} *</Label>
                  <Input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("companies.nameAr", "Company Name (Arabic)")}</Label>
                  <Input
                    value={newCompany.nameAr}
                    onChange={(e) => setNewCompany({ ...newCompany, nameAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>
              {newCompany.type === "subcontractor" && (
                <div className="space-y-2">
                  <Label>{t("companies.parentCompany", "Parent Company (Main Contractor)")}</Label>
                  <Select
                    value={newCompany.parentCompanyId?.toString() || ""}
                    onValueChange={(v) =>
                      setNewCompany({ ...newCompany, parentCompanyId: v ? parseInt(v) : undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("companies.selectParent", "Select parent company")} />
                    </SelectTrigger>
                    <SelectContent>
                      {companiesData
                        ?.filter((c) => c.type === "contractor")
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("companies.contractInfo", "Contract Information")}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("companies.contractRef", "Contract Reference")}</Label>
                    <Input
                      value={newCompany.contractReference}
                      onChange={(e) => setNewCompany({ ...newCompany, contractReference: e.target.value })}
                      placeholder="e.g., CNT-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.startDate", "Start Date")}</Label>
                    <Input
                      type="date"
                      value={newCompany.contractStartDate}
                      onChange={(e) => setNewCompany({ ...newCompany, contractStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.endDate", "End Date")}</Label>
                    <Input
                      type="date"
                      value={newCompany.contractEndDate}
                      onChange={(e) => setNewCompany({ ...newCompany, contractEndDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("companies.contactPerson", "Contact Person")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("common.name", "Name")}</Label>
                    <Input
                      value={newCompany.contactPersonName}
                      onChange={(e) => setNewCompany({ ...newCompany, contactPersonName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.position", "Position")}</Label>
                    <Input
                      value={newCompany.contactPersonPosition}
                      onChange={(e) => setNewCompany({ ...newCompany, contactPersonPosition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common.email", "Email")}</Label>
                    <Input
                      type="email"
                      value={newCompany.contactPersonEmail}
                      onChange={(e) => setNewCompany({ ...newCompany, contactPersonEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common.phone", "Phone")}</Label>
                    <Input
                      value={newCompany.contactPersonPhone}
                      onChange={(e) => setNewCompany({ ...newCompany, contactPersonPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("companies.additionalInfo", "Additional Information")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("companies.regNumber", "Registration Number")}</Label>
                    <Input
                      value={newCompany.registrationNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, registrationNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.status", "Status")}</Label>
                    <Select
                      value={newCompany.status}
                      onValueChange={(v: "active" | "inactive" | "suspended") =>
                        setNewCompany({ ...newCompany, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                        <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
                        <SelectItem value="suspended">{t("companies.suspended", "Suspended")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>{t("companies.address", "Address")}</Label>
                  <Input
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t("companies.city", "City")}</Label>
                    <Input
                      value={newCompany.city}
                      onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.country", "Country")}</Label>
                    <Input
                      value={newCompany.country}
                      onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>{t("common.notes", "Notes")}</Label>
                  <Input
                    value={newCompany.notes}
                    onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewCompanyOpen(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={createCompanyMutation.isPending}>
                {createCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("companies.createCompany", "Create Company")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingCompany) updateCompanyMutation.mutate(editingCompany);
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("companies.editCompany", "Edit Company")}</DialogTitle>
            </DialogHeader>
            {editingCompany && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("companies.companyCode", "Company Code")} *</Label>
                    <Input
                      value={editingCompany.code}
                      onChange={(e) => setEditingCompany({ ...editingCompany, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.companyType", "Company Type")} *</Label>
                    <Select
                      value={editingCompany.type}
                      onValueChange={(v) => setEditingCompany({ ...editingCompany, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">{t("companies.contractor", "Contractor")}</SelectItem>
                        <SelectItem value="subcontractor">{t("companies.subContractor", "Sub-Contractor")}</SelectItem>
                        <SelectItem value="client">{t("companies.client", "Client")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("companies.nameEn", "Company Name (English)")} *</Label>
                    <Input
                      value={editingCompany.name}
                      onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companies.nameAr", "Company Name (Arabic)")}</Label>
                    <Input
                      value={editingCompany.nameAr || ""}
                      onChange={(e) => setEditingCompany({ ...editingCompany, nameAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                {editingCompany.type === "subcontractor" && (
                  <div className="space-y-2">
                    <Label>{t("companies.parentCompany", "Parent Company (Main Contractor)")}</Label>
                    <Select
                      value={editingCompany.parentCompanyId?.toString() || ""}
                      onValueChange={(v) =>
                        setEditingCompany({ ...editingCompany, parentCompanyId: v ? parseInt(v) : null })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("companies.selectParent", "Select parent company")} />
                      </SelectTrigger>
                      <SelectContent>
                        {companiesData
                          ?.filter((c) => c.type === "contractor" && c.id !== editingCompany.id)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("companies.contractInfo", "Contract Information")}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("companies.contractRef", "Contract Reference")}</Label>
                      <Input
                        value={editingCompany.contractReference || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contractReference: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companies.startDate", "Start Date")}</Label>
                      <Input
                        type="date"
                        value={
                          editingCompany.contractStartDate
                            ? new Date(editingCompany.contractStartDate).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contractStartDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companies.endDate", "End Date")}</Label>
                      <Input
                        type="date"
                        value={
                          editingCompany.contractEndDate
                            ? new Date(editingCompany.contractEndDate).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contractEndDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("companies.contactPerson", "Contact Person")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("common.name", "Name")}</Label>
                      <Input
                        value={editingCompany.contactPersonName || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contactPersonName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companies.position", "Position")}</Label>
                      <Input
                        value={editingCompany.contactPersonPosition || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contactPersonPosition: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("common.email", "Email")}</Label>
                      <Input
                        type="email"
                        value={editingCompany.contactPersonEmail || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contactPersonEmail: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("common.phone", "Phone")}</Label>
                      <Input
                        value={editingCompany.contactPersonPhone || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, contactPersonPhone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t("companies.additionalInfo", "Additional Information")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("companies.regNumber", "Registration Number")}</Label>
                      <Input
                        value={editingCompany.registrationNumber || ""}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, registrationNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companies.status", "Status")}</Label>
                      <Select
                        value={editingCompany.status}
                        onValueChange={(v) => setEditingCompany({ ...editingCompany, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                          <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>{t("companies.address", "Address")}</Label>
                    <Input
                      value={editingCompany.address || ""}
                      onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>{t("companies.city", "City")}</Label>
                      <Input
                        value={editingCompany.city || ""}
                        onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companies.country", "Country")}</Label>
                      <Input
                        value={editingCompany.country || ""}
                        onChange={(e) => setEditingCompany({ ...editingCompany, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>{t("common.notes", "Notes")}</Label>
                    <Input
                      value={editingCompany.notes || ""}
                      onChange={(e) => setEditingCompany({ ...editingCompany, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCompanyOpen(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={updateCompanyMutation.isPending}>
                {updateCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("companies.updateCompany", "Update Company")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
