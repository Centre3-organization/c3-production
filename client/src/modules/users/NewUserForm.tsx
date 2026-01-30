import { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Building2,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

type UserType = "centre3_employee" | "contractor" | "client";

interface NewUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
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
    <div className="pb-2 mb-4 border-b">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

const tabs = [
  { id: "general", label: "General Information", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "access", label: "Access & Security", icon: Shield },
];

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  
  // Yakeen verification state
  const [idType, setIdType] = useState<"national_id" | "iqama">("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [formData, setFormData] = useState({
    // User Type
    userType: "" as UserType | "",
    isSubContractor: false,
    
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
    
    // Company Details (Contractor/Client)
    contractorCompanyId: null as number | null,
    subContractorCompanyId: null as number | null,
    contractReference: "",
    contractExpiry: "",
    reportingToId: null as number | null,
    clientCompanyId: null as number | null,
    accountManagerId: null as number | null,
    
    // System Access
    roleId: null as number | null,
    allSitesAccess: true,
    selectedSiteIds: [] as number[],
    
    // Options
    temporaryPassword: "",
    sendWelcomeEmail: true,
    mustChangePassword: true,
    accountExpiresWithContract: false,
  });

  // Fetch data
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const { data: usersData } = trpc.users.list.useQuery({});
  const { data: sitesData } = trpc.sites.getAll.useQuery();
  const { data: companiesData } = trpc.masterData.getAllCompanies.useQuery({});
  const { data: rolesData } = trpc.roles.list.useQuery({ isActive: true });

  const departments = departmentsData || [];
  const users = usersData?.users || [];
  const sites = sitesData || [];
  const companies = companiesData || [];
  const roles = rolesData || [];

  // Filter companies by type
  const contractorCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "contractor"), [companies]);
  const subContractorCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "subcontractor"), [companies]);
  const clientCompanies = useMemo(() => 
    companies.filter((c: any) => c.type === "client"), [companies]);

  // Auto-populate contract info when company is selected
  useEffect(() => {
    if (formData.userType === "contractor") {
      const companyId = formData.isSubContractor ? formData.subContractorCompanyId : formData.contractorCompanyId;
      if (companyId) {
        const company = companies.find((c: any) => c.id === companyId);
        if (company) {
          setFormData(prev => ({
            ...prev,
            contractReference: company.contractReference || "",
            contractExpiry: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
          }));
        }
      }
    }
  }, [formData.contractorCompanyId, formData.subContractorCompanyId, formData.isSubContractor, formData.userType, companies]);

  useEffect(() => {
    if (formData.userType === "client" && formData.clientCompanyId) {
      const company = companies.find((c: any) => c.id === formData.clientCompanyId);
      if (company) {
        setFormData(prev => ({
          ...prev,
          contractReference: company.contractReference || "",
          contractExpiry: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
        }));
      }
    }
  }, [formData.clientCompanyId, formData.userType, companies]);

  // ID Number validation
  const handleIdNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 10) {
      if (digitsOnly.length > 0) {
        if (idType === "national_id" && digitsOnly[0] !== "1") {
          setIdNumber("1" + digitsOnly.slice(1));
          return;
        }
        if (idType === "iqama" && digitsOnly[0] !== "2") {
          setIdNumber("2" + digitsOnly.slice(1));
          return;
        }
      }
      setIdNumber(digitsOnly);
    }
  };

  useEffect(() => {
    if (idNumber.length > 0) {
      if (idType === "national_id" && idNumber[0] !== "1") {
        setIdNumber("1" + idNumber.slice(1));
      } else if (idType === "iqama" && idNumber[0] !== "2") {
        setIdNumber("2" + idNumber.slice(1));
      }
    }
  }, [idType]);

  // Yakeen verification mutation
  const verifyYakeenMutation = trpc.users.verifyByYakeen.useMutation({
    onSuccess: (result) => {
      if (result.verified && result.data) {
        setFormData(prev => ({
          ...prev,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          firstNameAr: result.data.firstNameAr,
          lastNameAr: result.data.lastNameAr,
        }));
        setIsVerified(true);
        setVerificationError("");
        toast.success("Verification successful");
      } else {
        setIsVerified(false);
        setVerificationError(result.message || "Verification failed. Please enter information manually.");
        toast.error("Verification failed");
      }
    },
    onError: (error: any) => {
      setIsVerified(false);
      setVerificationError(error.message);
      toast.error("Verification error", { description: error.message });
    },
  });

  const handleVerifyYakeen = () => {
    if (!idNumber || idNumber.length !== 10) {
      toast.error("Invalid ID", { description: "Please enter a valid 10-digit ID number." });
      return;
    }
    verifyYakeenMutation.mutate({ idType, idNumber });
  };

  // Create user mutation
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.userType) {
      toast.error("Please select a user type");
      setActiveTab("general");
      return;
    }
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
    if (!formData.phone) {
      toast.error("Please enter mobile number");
      setActiveTab("general");
      return;
    }
    if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
      toast.error("Please enter a temporary password (min 6 characters)");
      setActiveTab("access");
      return;
    }

    createUserMutation.mutate({
      userType: formData.isSubContractor ? "sub_contractor" : formData.userType as UserType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle || "",
      role: "user",
      temporaryPassword: formData.temporaryPassword,
      sendWelcomeEmail: formData.sendWelcomeEmail,
      mustChangePassword: formData.mustChangePassword,
      accountExpiresWithContract: formData.accountExpiresWithContract,
      employeeId: formData.employeeId || undefined,
      departmentId: formData.departmentId || undefined,
      managerId: formData.managerId || undefined,
      contractorCompanyId: formData.contractorCompanyId || undefined,
      contractReference: formData.contractReference || undefined,
      contractExpiry: formData.contractExpiry || undefined,
      reportingToId: formData.reportingToId || undefined,
      parentContractorId: formData.isSubContractor ? formData.contractorCompanyId : undefined,
      clientCompanyId: formData.clientCompanyId || undefined,
      accountManagerId: formData.accountManagerId || undefined,
      siteIds: formData.allSitesAccess ? sites.map((s: any) => s.id) : formData.selectedSiteIds,
    });
  };

  const toggleSite = (siteId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedSiteIds: prev.selectedSiteIds.includes(siteId)
        ? prev.selectedSiteIds.filter(id => id !== siteId)
        : [...prev.selectedSiteIds, siteId],
    }));
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

  // Check if can proceed to next tab
  const canProceedFromGeneral = formData.userType && formData.firstName && formData.lastName && formData.email && formData.phone;
  const canProceedFromOrganization = true; // Organization fields are optional

  return (
    <div className="flex flex-col h-full bg-background">
      {/* SAP Fiori-style Object Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C44569] flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Create New User</h1>
            <p className="text-sm text-muted-foreground">
              {formData.userType ? 
                formData.userType === "centre3_employee" ? "Centre3 Employee" :
                formData.userType === "contractor" ? (formData.isSubContractor ? "Sub-Contractor" : "Contractor") :
                "Client"
              : "Select user type to continue"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Main Content with Left Sidebar Tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Vertical Tabs */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Steps</p>
          </div>
          <nav className="flex-1 p-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isCompleted = index < currentTabIndex;
              const isDisabled = !formData.userType && index > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1 ${
                    isActive 
                      ? "bg-gradient-to-r from-[#FF6B9D]/10 to-[#C44569]/10 text-[#C44569] border-l-4 border-[#C44569]" 
                      : isCompleted
                        ? "text-foreground hover:bg-muted"
                        : isDisabled
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive 
                      ? "bg-gradient-to-br from-[#FF6B9D] to-[#C44569] text-white"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tab.label}</p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-[#C44569]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* General Information Tab */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  {/* User Type Section */}
                  <div className="bg-card rounded-lg border p-6">
                    <SectionHeader title="User Classification" />
                    <div className="grid grid-cols-3 gap-6">
                      <FormField label="User Type" required>
                        <Select
                          value={formData.userType}
                          onValueChange={(value) => setFormData({ ...formData, userType: value as UserType, isSubContractor: false })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select user type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="centre3_employee">Centre3 Employee</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      {formData.userType === "contractor" && (
                        <div className="flex items-end pb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="isSubContractor"
                              checked={formData.isSubContractor}
                              onCheckedChange={(checked) => setFormData({ 
                                ...formData, 
                                isSubContractor: !!checked,
                                subContractorCompanyId: null,
                              })}
                            />
                            <Label htmlFor="isSubContractor" className="text-sm cursor-pointer">
                              This is a Sub-Contractor
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.userType && (
                    <>
                      {/* Identity Verification Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Identity Verification" />
                        <div className="grid grid-cols-4 gap-6">
                          <FormField label="ID Type">
                            <Select value={idType} onValueChange={(value: "national_id" | "iqama") => setIdType(value)}>
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="national_id">National ID</SelectItem>
                                <SelectItem value="iqama">Iqama</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          
                          <FormField label="ID Number" hint={`${idNumber.length}/10 digits`}>
                            <Input
                              value={idNumber}
                              onChange={(e) => handleIdNumberChange(e.target.value)}
                              placeholder={idType === "national_id" ? "1XXXXXXXXX" : "2XXXXXXXXX"}
                              maxLength={10}
                              className="bg-background"
                            />
                          </FormField>
                          
                          <div className="flex items-end">
                            <Button 
                              type="button"
                              onClick={handleVerifyYakeen}
                              disabled={verifyYakeenMutation.isPending || idNumber.length !== 10}
                              variant="outline"
                              className="w-full"
                            >
                              {verifyYakeenMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Search className="h-4 w-4 mr-2" />
                                  Verify with Yakeen
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-end">
                            {isVerified && (
                              <Badge className="bg-green-500 h-9 px-4">
                                <CheckCircle className="h-4 w-4 mr-2" /> Verified
                              </Badge>
                            )}
                            {verificationError && (
                              <div className="flex items-center gap-2 text-amber-600 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span className="truncate">{verificationError}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Personal Data Section */}
                      <div className="bg-card rounded-lg border p-6">
                        <SectionHeader title="Personal Data" />
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <FormField label="First Name (English)" required>
                            <Input
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              placeholder="Enter first name"
                              disabled={isVerified}
                              className={`bg-background ${isVerified ? "bg-muted" : ""}`}
                            />
                          </FormField>
                          
                          <FormField label="Last Name (English)" required>
                            <Input
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              placeholder="Enter last name"
                              disabled={isVerified}
                              className={`bg-background ${isVerified ? "bg-muted" : ""}`}
                            />
                          </FormField>
                          
                          <FormField label="First Name (Arabic) / الاسم الأول">
                            <Input
                              value={formData.firstNameAr}
                              onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                              placeholder="أدخل الاسم الأول"
                              dir="rtl"
                              disabled={isVerified}
                              className={`bg-background ${isVerified ? "bg-muted" : ""}`}
                            />
                          </FormField>
                          
                          <FormField label="Last Name (Arabic) / اسم العائلة">
                            <Input
                              value={formData.lastNameAr}
                              onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                              placeholder="أدخل اسم العائلة"
                              dir="rtl"
                              disabled={isVerified}
                              className={`bg-background ${isVerified ? "bg-muted" : ""}`}
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
                          
                          <FormField label="Mobile Number" required>
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+966 5XX XXX XXXX"
                              className="bg-background"
                            />
                          </FormField>
                        </div>
                      </div>
                    </>
                  )}
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

                      {formData.userType === "centre3_employee" && (
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
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name || `${user.firstName} ${user.lastName}`}
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
                  {formData.userType === "contractor" && (
                    <div className="bg-card rounded-lg border p-6">
                      <SectionHeader title="Contractor Assignment" />
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField 
                          label={formData.isSubContractor ? "Parent Contractor Company" : "Contractor Company"} 
                          required
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
                        
                        {formData.isSubContractor ? (
                          <FormField label="Sub-Contractor Company" required>
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
                        ) : (
                          <FormField label="Centre3 Contact Person">
                            <Select
                              value={formData.reportingToId?.toString() || ""}
                              onValueChange={(value) => setFormData({ ...formData, reportingToId: value ? parseInt(value) : null })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select contact" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name || `${user.firstName} ${user.lastName}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        )}
                        
                        <FormField label="Contract Reference" hint="Auto-populated from company">
                          <Input
                            value={formData.contractReference}
                            className="bg-muted"
                            readOnly
                            placeholder="—"
                          />
                        </FormField>
                        
                        <FormField label="Contract Expiry Date" hint="Auto-populated from company">
                          <Input
                            type="date"
                            value={formData.contractExpiry}
                            className="bg-muted"
                            readOnly
                          />
                        </FormField>
                      </div>
                    </div>
                  )}

                  {/* Client Company Section */}
                  {formData.userType === "client" && (
                    <div className="bg-card rounded-lg border p-6">
                      <SectionHeader title="Client Assignment" />
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Client Company" required>
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
                              {users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name || `${user.firstName} ${user.lastName}`}
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
                            selectedSiteIds: [],
                          })}
                        />
                        <Label htmlFor="allSites" className="cursor-pointer">
                          Grant access to all sites
                        </Label>
                      </div>

                      {!formData.allSitesAccess && (
                        <div className="border rounded-lg p-4 bg-background">
                          <p className="text-sm text-muted-foreground mb-3">Select specific sites:</p>
                          <div className="grid grid-cols-3 gap-3">
                            {sites.map((site: any) => (
                              <div key={site.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`site-${site.id}`}
                                  checked={formData.selectedSiteIds.includes(site.id)}
                                  onCheckedChange={() => toggleSite(site.id)}
                                />
                                <Label htmlFor={`site-${site.id}`} className="text-sm cursor-pointer">
                                  {site.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Settings Section */}
                  <div className="bg-card rounded-lg border p-6">
                    <SectionHeader title="Account Settings" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <FormField label="Temporary Password" required hint="Minimum 6 characters">
                        <Input
                          type="password"
                          value={formData.temporaryPassword}
                          onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                          placeholder="Enter temporary password"
                          className="bg-background"
                        />
                      </FormField>
                      
                      <div className="space-y-4 pt-6">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sendWelcome"
                            checked={formData.sendWelcomeEmail}
                            onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: !!checked })}
                          />
                          <Label htmlFor="sendWelcome" className="cursor-pointer">
                            Send welcome email with login instructions
                          </Label>
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="mustChange"
                            checked={formData.mustChangePassword}
                            onCheckedChange={(checked) => setFormData({ ...formData, mustChangePassword: !!checked })}
                          />
                          <Label htmlFor="mustChange" className="cursor-pointer">
                            Require password change on first login
                          </Label>
                        </div>

                        {formData.userType === "contractor" && (
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
                        )}
                      </div>
                    </div>
                  </div>
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
                  disabled={activeTab === "general" && !canProceedFromGeneral}
                  className="gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#C44569] hover:from-[#FF5A8A] hover:to-[#B33D5C]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createUserMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#C44569] hover:from-[#FF5A8A] hover:to-[#B33D5C]"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
