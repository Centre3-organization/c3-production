import { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Building2,
  Shield,
  User,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

interface EditUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// SAP Fiori-style Form Field Component
function FormField({ 
  label, 
  required, 
  children,
  hint,
}: { 
  label: string; 
  required?: boolean; 
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground font-normal">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}:
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// SAP Fiori-style Section Header
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pb-2 mb-4 border-b border-[#4f008c]/20">
      <h3 className="text-sm font-semibold text-[#4f008c]">{title}</h3>
    </div>
  );
}

const tabs = [
  { id: "general", label: "General Information", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "access", label: "Access & Security", icon: Shield },
];

export default function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: "",
    lastName: "",
    firstNameAr: "",
    lastNameAr: "",
    email: "",
    phone: "",
    jobTitle: "",
    employeeId: "",
    departmentId: null as number | null,
    managerId: null as number | null,
    
    // Company Details
    contractorCompanyId: null as number | null,
    subContractorCompanyId: null as number | null,
    contractReference: "",
    contractExpiry: "",
    reportingToId: null as number | null,
    clientCompanyId: null as number | null,
    accountManagerId: null as number | null,
    
    // System Access
    roleId: null as number | null,
    status: "active" as "active" | "inactive" | "suspended",
    selectedSiteId: null as number | null,
    selectedZoneId: null as number | null,
    selectedAreaId: null as number | null,
    allSitesAccess: true,
    selectedSiteIds: [] as number[],
    
    // Options
    accountExpiresWithContract: false,
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        firstNameAr: user.firstNameAr || "",
        lastNameAr: user.lastNameAr || "",
        email: user.email || "",
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        employeeId: user.employeeId || "",
        departmentId: user.departmentId || null,
        managerId: user.managerId || null,
        contractorCompanyId: user.contractorCompanyId || null,
        subContractorCompanyId: user.subContractorCompanyId || null,
        contractReference: user.contractReference || "",
        contractExpiry: user.contractExpiry ? new Date(user.contractExpiry).toISOString().split('T')[0] : "",
        reportingToId: user.reportingToId || null,
        clientCompanyId: user.clientCompanyId || null,
        accountManagerId: user.accountManagerId || null,
        roleId: user.roleId || null,
        status: user.status || "active",
        selectedSiteId: null,
        selectedZoneId: null,
        selectedAreaId: null,
        allSitesAccess: user.allSitesAccess !== false,
        selectedSiteIds: user.siteIds || [],
        accountExpiresWithContract: user.accountExpiresWithContract || false,
      });
      setActiveTab("general");
    }
  }, [user]);

  // Fetch data
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const { data: usersData } = trpc.users.list.useQuery({});
  const { data: sitesData } = trpc.sites.getAll.useQuery();
  const { data: companiesData } = trpc.masterData.getAllCompanies.useQuery({});
  const { data: rolesData } = trpc.roles.list.useQuery();
  const { data: zonesData } = trpc.zones.getAll.useQuery({ siteId: formData.selectedSiteId || undefined });
  const { data: areasData } = trpc.masterData.getAreaTypes.useQuery();

  const departments = departmentsData || [];
  const users = usersData?.users || [];
  const sites = sitesData || [];
  const companies = companiesData || [];
  const roles = rolesData || [];
  const zones = zonesData || [];
  const areas = areasData || [];

  // Filter companies by type
  const contractorCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "contractor"), [companies]);
  const subContractorCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "subcontractor"), [companies]);
  const clientCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "client"), [companies]);

  // Reset zone and area when site changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedZoneId: null, selectedAreaId: null }));
  }, [formData.selectedSiteId]);

  // Reset area when zone changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedAreaId: null }));
  }, [formData.selectedZoneId]);

  // Update user mutation
  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update user", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter first and last name");
      setActiveTab("general");
      return;
    }
    if (!formData.email) {
      toast.error("Please enter email address");
      setActiveTab("general");
      return;
    }

    updateUserMutation.mutate({
      id: user.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      jobTitle: formData.jobTitle || undefined,
      roleId: formData.roleId || undefined,
      status: formData.status,
      employeeId: formData.employeeId || undefined,
      departmentId: formData.departmentId || undefined,
      managerId: formData.managerId || undefined,
      contractorCompanyId: formData.contractorCompanyId || undefined,
      contractReference: formData.contractReference || undefined,
      contractExpiry: formData.contractExpiry || undefined,
      reportingToId: formData.reportingToId || undefined,
      clientCompanyId: formData.clientCompanyId || undefined,
      accountManagerId: formData.accountManagerId || undefined,
      accountExpiresWithContract: formData.accountExpiresWithContract,
    });
  };

  // Navigation helpers
  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const goToNextTab = () => {
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const goToPrevTab = () => {
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const getUserTypeDisplay = () => {
    if (!user) return "";
    switch (user.userType) {
      case "centre3_employee": return "Centre3 Employee";
      case "contractor": return "Contractor";
      case "sub_contractor": return "Sub-Contractor";
      case "client": return "Client";
      default: return user.userType || "";
    }
  };

  const isSubContractor = user?.userType === "sub_contractor";

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff375e] to-[#4f008c] flex items-center justify-center">
                <UserCog className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#4f008c]">Edit User</h1>
                <p className="text-sm text-muted-foreground">{getUserTypeDisplay()}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>

          {/* Main Content with Left Sidebar Tabs */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Vertical Tabs */}
            <div className="w-56 border-r bg-card flex flex-col">
              <div className="p-4 border-b">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sections</p>
              </div>
              <nav className="flex-1 p-2">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id;
                  const isCompleted = index < currentTabIndex;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1 ${
                        isActive 
                          ? "bg-gradient-to-r from-[#ff375e]/10 to-[#4f008c]/10 text-[#4f008c] border-l-4 border-[#4f008c]" 
                          : isCompleted
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive 
                          ? "bg-gradient-to-br from-[#ff375e] to-[#4f008c] text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tab.label}</p>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 text-[#4f008c]" />}
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
                      {/* Personal Data Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Personal Data" />
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <FormField label="First Name (English)" required>
                            <Input
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              placeholder="Enter first name"
                              className="bg-background"
                            />
                          </FormField>
                          
                          <FormField label="Last Name (English)" required>
                            <Input
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              placeholder="Enter last name"
                              className="bg-background"
                            />
                          </FormField>
                          
                          <FormField label="First Name (Arabic) / الاسم الأول">
                            <Input
                              value={formData.firstNameAr}
                              onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                              placeholder="أدخل الاسم الأول"
                              dir="rtl"
                              className="bg-background"
                            />
                          </FormField>
                          
                          <FormField label="Last Name (Arabic) / اسم العائلة">
                            <Input
                              value={formData.lastNameAr}
                              onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                              placeholder="أدخل اسم العائلة"
                              dir="rtl"
                              className="bg-background"
                            />
                          </FormField>
                        </div>
                      </div>

                      {/* Communication Data Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Communication Data" />
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <FormField label="Email Address" required>
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="user@example.com"
                              className="bg-background"
                            />
                          </FormField>
                          
                          <FormField label="Mobile Number">
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+966 5XX XXX XXXX"
                              className="bg-background"
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organization Tab */}
                  {activeTab === "organization" && (
                    <div className="space-y-6">
                      {/* Employment Data Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Employment Data" />
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <FormField label="Job Title">
                            <Input
                              value={formData.jobTitle}
                              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                              placeholder="Enter job title"
                              className="bg-background"
                            />
                          </FormField>
                          
                          <FormField label="Department">
                            <Select
                              value={formData.departmentId?.toString() || ""}
                              onValueChange={(value) => setFormData({ ...formData, departmentId: value ? parseInt(value) : null })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept: any) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>

                          {user.userType === "centre3_employee" && (
                            <>
                              <FormField label="Employee ID">
                                <Input
                                  value={formData.employeeId}
                                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                  placeholder="Enter employee ID"
                                  className="bg-background"
                                />
                              </FormField>
                              
                              <FormField label="Reports To">
                                <Select
                                  value={formData.managerId?.toString() || ""}
                                  onValueChange={(value) => setFormData({ ...formData, managerId: value ? parseInt(value) : null })}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select manager" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {users.filter((u: any) => u.id !== user.id).map((u: any) => (
                                      <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.name || `${u.firstName} ${u.lastName}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contractor Company Section */}
                      {(user.userType === "contractor" || user.userType === "sub_contractor") && (
                        <div className="bg-card rounded-lg border p-6">
                          <SectionHeader title="Contractor Assignment" />
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <FormField 
                              label={isSubContractor ? "Parent Contractor Company" : "Contractor Company"}
                            >
                              <Select
                                value={formData.contractorCompanyId?.toString() || ""}
                                onValueChange={(value) => setFormData({ ...formData, contractorCompanyId: value ? parseInt(value) : null })}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                  {contractorCompanies.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id.toString()}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            
                            {isSubContractor && (
                              <FormField label="Sub-Contractor Company">
                                <Select
                                  value={formData.subContractorCompanyId?.toString() || ""}
                                  onValueChange={(value) => setFormData({ ...formData, subContractorCompanyId: value ? parseInt(value) : null })}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select sub-contractor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subContractorCompanies.map((company: any) => (
                                      <SelectItem key={company.id} value={company.id.toString()}>
                                        {company.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}
                            
                            <FormField label="Contract Reference">
                              <Input
                                value={formData.contractReference}
                                onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                                placeholder="Enter contract reference"
                                className="bg-background"
                              />
                            </FormField>
                            
                            <FormField label="Contract Expiry Date">
                              <Input
                                type="date"
                                value={formData.contractExpiry}
                                onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                                className="bg-background"
                              />
                            </FormField>
                            
                            <FormField label="Centre3 Contact Person">
                              <Select
                                value={formData.reportingToId?.toString() || ""}
                                onValueChange={(value) => setFormData({ ...formData, reportingToId: value ? parseInt(value) : null })}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Select contact" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                      {u.name || `${u.firstName} ${u.lastName}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                          </div>
                        </div>
                      )}

                      {/* Client Company Section */}
                      {user.userType === "client" && (
                        <div className="bg-card rounded-lg border p-6">
                          <SectionHeader title="Client Assignment" />
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <FormField label="Client Company">
                              <Select
                                value={formData.clientCompanyId?.toString() || ""}
                                onValueChange={(value) => setFormData({ ...formData, clientCompanyId: value ? parseInt(value) : null })}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Select client company" />
                                </SelectTrigger>
                                <SelectContent>
                                  {clientCompanies.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id.toString()}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            
                            <FormField label="Account Manager (Centre3)">
                              <Select
                                value={formData.accountManagerId?.toString() || ""}
                                onValueChange={(value) => setFormData({ ...formData, accountManagerId: value ? parseInt(value) : null })}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Select account manager" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                      {u.name || `${u.firstName} ${u.lastName}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Access & Security Tab */}
                  {activeTab === "access" && (
                    <div className="space-y-6">
                      {/* User Role Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="User Role & Status" />
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <FormField label="System Role" required>
                            <Select
                              value={formData.roleId?.toString() || ""}
                              onValueChange={(value) => setFormData({ ...formData, roleId: value ? parseInt(value) : null })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role: any) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField label="Account Status" required>
                            <Select
                              value={formData.status}
                              onValueChange={(value: "active" | "inactive" | "suspended") => setFormData({ ...formData, status: value })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                      </div>

                      {/* Site Access Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Site Access" />
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="allSites"
                              checked={formData.allSitesAccess}
                              onCheckedChange={(checked) => setFormData({ 
                                ...formData, 
                                allSitesAccess: !!checked,
                                selectedSiteId: null,
                                selectedZoneId: null,
                                selectedAreaId: null,
                              })}
                            />
                            <Label htmlFor="allSites" className="cursor-pointer">
                              Grant access to all sites
                            </Label>
                          </div>

                          {!formData.allSitesAccess && (
                            <div className="grid grid-cols-3 gap-6 pt-4">
                              <FormField label="Site">
                                <Select
                                  value={formData.selectedSiteId?.toString() || ""}
                                  onValueChange={(value) => setFormData({ ...formData, selectedSiteId: value ? parseInt(value) : null })}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select site" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sites.map((site: any) => (
                                      <SelectItem key={site.id} value={site.id.toString()}>
                                        {site.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>

                              <FormField label="Zone">
                                <Select
                                  value={formData.selectedZoneId?.toString() || ""}
                                  onValueChange={(value) => setFormData({ ...formData, selectedZoneId: value ? parseInt(value) : null })}
                                  disabled={!formData.selectedSiteId}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={formData.selectedSiteId ? "Select zone" : "Select site first"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {zones.map((zone: any) => (
                                      <SelectItem key={zone.id} value={zone.id.toString()}>
                                        {zone.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>

                              <FormField label="Area">
                                <Select
                                  value={formData.selectedAreaId?.toString() || ""}
                                  onValueChange={(value) => setFormData({ ...formData, selectedAreaId: value ? parseInt(value) : null })}
                                  disabled={!formData.selectedZoneId}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={formData.selectedZoneId ? "Select area" : "Select zone first"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {areas.map((area: any) => (
                                      <SelectItem key={area.id} value={area.id.toString()}>
                                        {area.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Account Options */}
                      {(user.userType === "contractor" || user.userType === "sub_contractor") && (
                        <div className="bg-card rounded-lg border p-6">
                          <SectionHeader title="Account Options" />
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="expiresWithContract"
                              checked={formData.accountExpiresWithContract}
                              onCheckedChange={(checked) => setFormData({ ...formData, accountExpiresWithContract: !!checked })}
                            />
                            <Label htmlFor="expiresWithContract" className="cursor-pointer">
                              Account expires with contract
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Bottom Navigation Bar */}
              <div className="border-t bg-card px-6 py-4 flex items-center justify-between">
                <div>
                  {!isFirstTab && (
                    <Button
                      variant="outline"
                      onClick={goToPrevTab}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {!isLastTab ? (
                    <Button
                      onClick={goToNextTab}
                      className="gap-2 bg-[#4f008c] hover:bg-[#3d006d] text-white"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={updateUserMutation.isPending}
                      className="gap-2 bg-[#4f008c] hover:bg-[#3d006d] text-white"
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
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
  );
}
