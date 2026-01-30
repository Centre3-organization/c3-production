import { useState, useMemo, useEffect } from "react";
import {
  User,
  Building2,
  Shield,
  Camera,
  Settings,
  Check,
  Loader2,
  Upload,
  X,
  MapPin,
  Layers,
  Grid3X3,
  Search,
  CheckCircle,
  AlertCircle,
  IdCard,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

type UserType = "centre3_employee" | "contractor" | "client";

interface NewUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const userTypeLabels: Record<UserType, string> = {
  centre3_employee: "Centre3 Employee",
  contractor: "Contractor",
  client: "Client",
};

// Left-side section navigation
const sections = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "System Access", icon: Shield },
  { id: 3, title: "Photo", icon: Camera },
  { id: 4, title: "Options", icon: Settings },
];

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
  const [currentSection, setCurrentSection] = useState(1);
  
  // Yakeen verification state
  const [idType, setIdType] = useState<"national_id" | "iqama">("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [formData, setFormData] = useState({
    // Section 1: User Type + Personal Details
    userType: "" as UserType | "",
    isSubContractor: false, // For contractors only
    firstName: "",
    lastName: "",
    firstNameAr: "",
    lastNameAr: "",
    email: "",
    phone: "",
    jobTitle: "", // Optional
    employeeId: "",
    departmentId: null as number | null,
    managerId: null as number | null,
    contractorCompanyId: null as number | null,
    subContractorCompanyId: null as number | null, // Sub-contractor dropdown
    contractReference: "",
    contractExpiry: "",
    reportingToId: null as number | null,
    clientCompanyId: null as number | null,
    accountManagerId: null as number | null,
    
    // Section 2: System Access
    roleId: null as number | null,
    allSitesAccess: false,
    selectedSiteIds: [] as number[],
    selectedZoneIds: [] as number[],
    selectedAreaIds: [] as number[],
    
    // Section 3: Photo
    profilePhotoUrl: "",
    
    // Section 4: Options
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
  const { data: zonesData } = trpc.zones.getAll.useQuery();
  const { data: areasData } = trpc.areas.getAll.useQuery();

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

  // Cascading: Filter zones by selected sites
  const filteredZones = useMemo(() => {
    if (formData.allSitesAccess) return zones;
    if (formData.selectedSiteIds.length === 0) return [];
    return zones.filter((z: any) => formData.selectedSiteIds.includes(z.siteId));
  }, [zones, formData.selectedSiteIds, formData.allSitesAccess]);

  // Cascading: Filter areas by selected zones
  const filteredAreas = useMemo(() => {
    if (formData.selectedZoneIds.length === 0) return [];
    return areas.filter((a: any) => formData.selectedZoneIds.includes(a.zoneId));
  }, [areas, formData.selectedZoneIds]);

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

  // Reset zones/areas when sites change
  useEffect(() => {
    if (!formData.allSitesAccess) {
      setFormData(prev => ({
        ...prev,
        selectedZoneIds: [],
        selectedAreaIds: [],
      }));
    }
  }, [formData.selectedSiteIds, formData.allSitesAccess]);

  // Reset areas when zones change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedAreaIds: [],
    }));
  }, [formData.selectedZoneIds]);

  // ID Number validation
  const validateIdNumber = (value: string): boolean => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return false;
    // Max 10 digits
    if (value.length > 10) return false;
    // ID must start with 1, Iqama must start with 2
    if (value.length > 0) {
      if (idType === "national_id" && value[0] !== "1") return false;
      if (idType === "iqama" && value[0] !== "2") return false;
    }
    return true;
  };

  const handleIdNumberChange = (value: string) => {
    // Only allow digits and validate
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 10) {
      // Auto-correct first digit based on ID type
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

  // When ID type changes, reset or adjust the ID number
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
        toast.success("Verification successful", {
          description: "User information has been populated from Yakeen."
        });
      } else {
        setIsVerified(false);
        setVerificationError(result.message || "Verification failed. Please enter information manually.");
        toast.error("Verification failed", {
          description: "ID not found. Please enter information manually."
        });
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
      toast.success("User created successfully", {
        description: formData.sendWelcomeEmail 
          ? "The new user will receive an email with login instructions."
          : "The account has been created."
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });

  const validateCurrentSection = () => {
    switch (currentSection) {
      case 1:
        if (!formData.userType) {
          toast.error("Please select a user type");
          return false;
        }
        if (!formData.firstName || !formData.lastName) {
          toast.error("Please enter first and last name");
          return false;
        }
        if (!formData.email) {
          toast.error("Please enter email address");
          return false;
        }
        if (!formData.phone) {
          toast.error("Please enter mobile number");
          return false;
        }
        return true;
      case 2:
        if (!formData.allSitesAccess && formData.selectedSiteIds.length === 0) {
          toast.error("Please select at least one site or enable All Sites access");
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
          toast.error("Please enter a temporary password (min 6 characters)");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    // Validate all sections
    for (let i = 1; i <= 4; i++) {
      setCurrentSection(i);
      if (!validateCurrentSection()) return;
    }

    createUserMutation.mutate({
      userType: formData.isSubContractor ? "sub_contractor" : formData.userType as UserType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle || "",
      role: "user",
      temporaryPassword: formData.temporaryPassword || "TempPass123!",
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
      subContractorCompany: undefined,
      clientCompanyId: formData.clientCompanyId || undefined,
      accountManagerId: formData.accountManagerId || undefined,
      profilePhotoUrl: formData.profilePhotoUrl || undefined,
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

  const toggleZone = (zoneId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedZoneIds: prev.selectedZoneIds.includes(zoneId)
        ? prev.selectedZoneIds.filter(id => id !== zoneId)
        : [...prev.selectedZoneIds, zoneId],
    }));
  };

  const toggleArea = (areaId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedAreaIds: prev.selectedAreaIds.includes(areaId)
        ? prev.selectedAreaIds.filter(id => id !== areaId)
        : [...prev.selectedAreaIds, areaId],
    }));
  };

  const isSectionComplete = (sectionId: number): boolean => {
    switch (sectionId) {
      case 1:
        return !!(formData.userType && formData.firstName && formData.lastName && formData.email && formData.phone);
      case 2:
        return formData.allSitesAccess || formData.selectedSiteIds.length > 0;
      case 3:
        return true; // Photo is optional
      case 4:
        return formData.temporaryPassword.length >= 6;
      default:
        return false;
    }
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 1:
        return renderPersonalInfoSection();
      case 2:
        return renderSystemAccessSection();
      case 3:
        return renderPhotoSection();
      case 4:
        return renderOptionsSection();
      default:
        return null;
    }
  };

  // Section 1: Personal Information
  const renderPersonalInfoSection = () => (
    <div className="space-y-6">
      {/* User Type Dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          User Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.userType}
          onValueChange={(value) => setFormData({ ...formData, userType: value as UserType, isSubContractor: false })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select user type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centre3_employee">Centre3 Employee</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.userType && (
        <>
          <Separator />
          
          {/* Yakeen Verification Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Identity Verification</h4>
              {isVerified && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select
                  value={idType}
                  onValueChange={(value: "national_id" | "iqama") => setIdType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">National ID (starts with 1)</SelectItem>
                    <SelectItem value="iqama">Iqama (starts with 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Number (10 digits)</Label>
                <Input
                  value={idNumber}
                  onChange={(e) => handleIdNumberChange(e.target.value)}
                  placeholder={idType === "national_id" ? "1XXXXXXXXX" : "2XXXXXXXXX"}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  {idNumber.length}/10 digits
                </p>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleVerifyYakeen}
                  disabled={verifyYakeenMutation.isPending || idNumber.length !== 10}
                  className="w-full"
                  variant="secondary"
                >
                  {verifyYakeenMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify with Yakeen
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {verificationError && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {verificationError}
              </div>
            )}
          </div>

          <Separator />
          
          {/* Name Fields - English and Arabic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name (English) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
                disabled={isVerified}
                className={isVerified ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name (English) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
                disabled={isVerified}
                className={isVerified ? "bg-muted" : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name (Arabic) / الاسم الأول</Label>
              <Input
                value={formData.firstNameAr}
                onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                placeholder="أدخل الاسم الأول"
                dir="rtl"
                disabled={isVerified}
                className={isVerified ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name (Arabic) / اسم العائلة</Label>
              <Input
                value={formData.lastNameAr}
                onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                placeholder="أدخل اسم العائلة"
                dir="rtl"
                disabled={isVerified}
                className={isVerified ? "bg-muted" : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number <span className="text-red-500">*</span></Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 5XX XXX XXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Enter job title (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.departmentId?.toString() || ""}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value ? parseInt(value) : null })}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Centre3 Employee Specific Fields */}
          {formData.userType === "centre3_employee" && (
            <>
              <Separator />
              <h4 className="font-medium text-sm text-muted-foreground">Centre3 Employee Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Enter employee ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reports To</Label>
                  <Select
                    value={formData.managerId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, managerId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
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
                </div>
              </div>
            </>
          )}

          {/* Contractor Specific Fields */}
          {formData.userType === "contractor" && (
            <>
              <Separator />
              <h4 className="font-medium text-sm text-muted-foreground">Contractor Details</h4>
              
              {/* Sub-Contractor Toggle */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  id="isSubContractor"
                  checked={formData.isSubContractor}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isSubContractor: !!checked,
                    subContractorCompanyId: null,
                  })}
                />
                <div>
                  <Label htmlFor="isSubContractor" className="cursor-pointer font-medium">This is a Sub-Contractor</Label>
                  <p className="text-sm text-muted-foreground">Select if this user works for a sub-contractor company</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {formData.isSubContractor ? "Parent Contractor" : "Contractor Company"} 
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.contractorCompanyId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, contractorCompanyId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
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
                </div>
                
                {formData.isSubContractor ? (
                  <div className="space-y-2">
                    <Label>Sub-Contractor Company <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.subContractorCompanyId?.toString() || ""}
                      onValueChange={(value) => setFormData({ ...formData, subContractorCompanyId: value ? parseInt(value) : null })}
                    >
                      <SelectTrigger>
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Reports To (Centre3 Contact)</Label>
                    <Select
                      value={formData.reportingToId?.toString() || ""}
                      onValueChange={(value) => setFormData({ ...formData, reportingToId: value ? parseInt(value) : null })}
                    >
                      <SelectTrigger>
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
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Reference</Label>
                  <Input
                    value={formData.contractReference}
                    className="bg-muted"
                    readOnly
                    placeholder="Auto-populated from company"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Expiry</Label>
                  <Input
                    type="date"
                    value={formData.contractExpiry}
                    className="bg-muted"
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          {/* Client Specific Fields */}
          {formData.userType === "client" && (
            <>
              <Separator />
              <h4 className="font-medium text-sm text-muted-foreground">Client Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Company <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.clientCompanyId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, clientCompanyId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label>Account Manager (Centre3)</Label>
                  <Select
                    value={formData.accountManagerId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, accountManagerId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
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
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // Section 2: System Access
  const renderSystemAccessSection = () => (
    <div className="space-y-6">
      {/* Role Selection */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={formData.roleId?.toString() || ""}
          onValueChange={(value) => setFormData({ ...formData, roleId: value ? parseInt(value) : null })}
        >
          <SelectTrigger>
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
      </div>

      <Separator />

      {/* Site Access Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Site Access</h4>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="allSites"
              checked={formData.allSitesAccess}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                allSitesAccess: !!checked,
                selectedSiteIds: checked ? [] : formData.selectedSiteIds,
              })}
            />
            <Label htmlFor="allSites" className="text-sm font-normal cursor-pointer">
              All Sites Access
            </Label>
          </div>
        </div>

        {!formData.allSitesAccess && (
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {sites.map((site: any) => (
                <div key={site.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`site-${site.id}`}
                    checked={formData.selectedSiteIds.includes(site.id)}
                    onCheckedChange={() => toggleSite(site.id)}
                  />
                  <Label htmlFor={`site-${site.id}`} className="text-sm font-normal cursor-pointer">
                    {site.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {formData.allSitesAccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700">User will have access to all sites</span>
          </div>
        )}
      </div>

      {/* Zone Selection */}
      {(formData.allSitesAccess || formData.selectedSiteIds.length > 0) && filteredZones.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Zone Access</h4>
              <Badge variant="outline" className="ml-2">
                {formData.selectedZoneIds.length} selected
              </Badge>
            </div>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {filteredZones.map((zone: any) => (
                  <div key={zone.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`zone-${zone.id}`}
                      checked={formData.selectedZoneIds.includes(zone.id)}
                      onCheckedChange={() => toggleZone(zone.id)}
                    />
                    <Label htmlFor={`zone-${zone.id}`} className="text-sm font-normal cursor-pointer">
                      {zone.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Area Selection */}
      {formData.selectedZoneIds.length > 0 && filteredAreas.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Area Access</h4>
              <Badge variant="outline" className="ml-2">
                {formData.selectedAreaIds.length} selected
              </Badge>
            </div>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {filteredAreas.map((area: any) => (
                  <div key={area.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={formData.selectedAreaIds.includes(area.id)}
                      onCheckedChange={() => toggleArea(area.id)}
                    />
                    <Label htmlFor={`area-${area.id}`} className="text-sm font-normal cursor-pointer">
                      {area.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Section 3: Photo
  const renderPhotoSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
          {formData.profilePhotoUrl ? (
            <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Photo
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Recommended: 200x200px, JPG or PNG
        </p>
      </div>
    </div>
  );

  // Section 4: Options
  const renderOptionsSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Temporary Password <span className="text-red-500">*</span></Label>
        <Input
          type="password"
          value={formData.temporaryPassword}
          onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
          placeholder="Enter temporary password (min 6 characters)"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="sendWelcome"
            checked={formData.sendWelcomeEmail}
            onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: !!checked })}
          />
          <div>
            <Label htmlFor="sendWelcome" className="cursor-pointer">Send Welcome Email</Label>
            <p className="text-sm text-muted-foreground">User will receive login instructions via email</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="mustChange"
            checked={formData.mustChangePassword}
            onCheckedChange={(checked) => setFormData({ ...formData, mustChangePassword: !!checked })}
          />
          <div>
            <Label htmlFor="mustChange" className="cursor-pointer">Must Change Password on First Login</Label>
            <p className="text-sm text-muted-foreground">User will be prompted to set a new password</p>
          </div>
        </div>

        {formData.userType === "contractor" && (
          <div className="flex items-center gap-3">
            <Checkbox
              id="expiresWithContract"
              checked={formData.accountExpiresWithContract}
              onCheckedChange={(checked) => setFormData({ ...formData, accountExpiresWithContract: !!checked })}
            />
            <div>
              <Label htmlFor="expiresWithContract" className="cursor-pointer">Account Expires with Contract</Label>
              <p className="text-sm text-muted-foreground">Account will be automatically deactivated when contract expires</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSection < sections.length) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-[900px] max-w-[1200px] mx-auto">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#1e1e2d] to-[#2d2d44]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Create New User</h2>
            <p className="text-sm text-white/60">Step {currentSection} of {sections.length}: {sections[currentSection - 1].title}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/10">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentSection / sections.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Section Navigation */}
        <div className="w-72 border-r bg-gradient-to-b from-muted/50 to-muted/20 p-5">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Form Sections</h3>
          </div>
          <nav className="space-y-1">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = currentSection === section.id;
              const isComplete = isSectionComplete(section.id);
              const isPast = section.id < currentSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                      : isPast
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{section.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-sm block ${
                      isActive ? "text-primary-foreground" : isPast ? "text-green-700" : ""
                    }`}>{section.title}</span>
                    {isComplete && !isActive && (
                      <span className="text-xs text-green-600">Completed</span>
                    )}
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Section Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <div className="text-xs font-medium text-muted-foreground mb-2">Completion Status</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(sections.filter((_, i) => isSectionComplete(i + 1)).length / sections.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold">
                {sections.filter((_, i) => isSectionComplete(i + 1)).length}/{sections.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-background">
          <div className="max-w-3xl">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          
          {currentSection > 1 && (
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentSection < sections.length ? (
            <Button
              onClick={handleNext}
              className="gap-2 min-w-[120px]"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createUserMutation.isPending}
              className="gap-2 min-w-[140px] bg-green-600 hover:bg-green-700"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
