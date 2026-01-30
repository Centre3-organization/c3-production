import { useState, useMemo, useEffect } from "react";
import {
  User,
  Building2,
  Shield,
  Camera,
  Settings,
  ChevronRight,
  ChevronLeft,
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

type UserType = "centre3_employee" | "contractor" | "sub_contractor" | "client";

interface NewUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const userTypeLabels: Record<UserType, string> = {
  centre3_employee: "Centre3 Employee",
  contractor: "Contractor",
  sub_contractor: "Sub-Contractor",
  client: "Client",
};

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "System Access", icon: Shield },
  { id: 3, title: "Photo", icon: Camera },
  { id: 4, title: "Options", icon: Settings },
];

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Yakeen verification state
  const [idType, setIdType] = useState<"national_id" | "iqama">("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [formData, setFormData] = useState({
    // Step 1: User Type + Personal Details (merged)
    userType: "" as UserType | "",
    firstName: "",
    lastName: "",
    firstNameAr: "",
    lastNameAr: "",
    email: "",
    phone: "",
    jobTitle: "", // Now optional
    employeeId: "",
    departmentId: null as number | null,
    managerId: null as number | null,
    contractorCompanyId: null as number | null,
    contractReference: "",
    contractExpiry: "",
    reportingToId: null as number | null,
    parentContractorId: null as number | null,
    subContractorCompany: "",
    clientCompanyId: null as number | null,
    accountManagerId: null as number | null,
    
    // Step 2: System Access - with multi-site selection
    roleId: null as number | null,
    allSitesAccess: false,
    selectedSiteIds: [] as number[],
    selectedZoneIds: [] as number[],
    selectedAreaIds: [] as number[],
    
    // Step 3: Photo
    profilePhotoUrl: "",
    
    // Step 4: Options
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

  // Cascading: Filter zones by selected sites (multiple)
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
    if (formData.userType === "contractor" && formData.contractorCompanyId) {
      const company = companies.find((c: any) => c.id === formData.contractorCompanyId);
      if (company) {
        setFormData(prev => ({
          ...prev,
          contractReference: company.contractReference || "",
          contractExpiry: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
        }));
      }
    }
  }, [formData.contractorCompanyId, formData.userType, companies]);

  useEffect(() => {
    if (formData.userType === "sub_contractor" && formData.parentContractorId) {
      const company = companies.find((c: any) => c.id === formData.parentContractorId);
      if (company) {
        setFormData(prev => ({
          ...prev,
          contractReference: company.contractReference || "",
          contractExpiry: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
        }));
      }
    }
  }, [formData.parentContractorId, formData.userType, companies]);

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
    if (!idNumber || idNumber.length < 10) {
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

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
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
        // Job Title is now optional - no validation
        return true;
      case 2:
        // System access validation - at least one site or all sites
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
    if (!validateCurrentStep()) return;

    createUserMutation.mutate({
      userType: formData.userType as UserType,
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
      parentContractorId: formData.parentContractorId || undefined,
      subContractorCompany: formData.subContractorCompany || undefined,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfoStep();
      case 2:
        return renderSystemAccessStep();
      case 3:
        return renderPhotoStep();
      case 4:
        return renderOptionsStep();
      default:
        return null;
    }
  };

  // Step 1: Personal Information (merged with User Type)
  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      {/* User Type Dropdown with Yakeen Verification */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">
            User Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.userType}
            onValueChange={(value) => setFormData({ ...formData, userType: value as UserType })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="centre3_employee">Centre3 Employee</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="sub_contractor">Sub-Contractor</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.userType && (
        <>
          <Separator />
          
          {/* Yakeen Verification Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Verify by Yakeen</h4>
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
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="iqama">Iqama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter 10-digit ID"
                  maxLength={10}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleVerifyYakeen}
                  disabled={verifyYakeenMutation.isPending || idNumber.length < 10}
                  className="w-full"
                >
                  {verifyYakeenMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify by Yakeen
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contractor Company <span className="text-red-500">*</span></Label>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Reference</Label>
                  <Input
                    value={formData.contractReference}
                    onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                    placeholder="Auto-populated from company"
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Expiry</Label>
                  <Input
                    type="date"
                    value={formData.contractExpiry}
                    onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    className="bg-muted"
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          {/* Sub-Contractor Specific Fields */}
          {formData.userType === "sub_contractor" && (
            <>
              <Separator />
              <h4 className="font-medium text-sm text-muted-foreground">Sub-Contractor Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent Contractor <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.parentContractorId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, parentContractorId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent contractor" />
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
                <div className="space-y-2">
                  <Label>Sub-Contractor Company Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.subContractorCompany}
                    onChange={(e) => setFormData({ ...formData, subContractorCompany: e.target.value })}
                    placeholder="Enter sub-contractor company"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Reference</Label>
                  <Input
                    value={formData.contractReference}
                    className="bg-muted"
                    readOnly
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

  // Step 2: System Access with multi-site selection
  const renderSystemAccessStep = () => (
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

      {/* Zone Selection - only show if sites are selected */}
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

      {/* Area Selection - only show if zones are selected */}
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

  // Step 3: Photo
  const renderPhotoStep = () => (
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

  // Step 4: Options
  const renderOptionsStep = () => (
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

        {(formData.userType === "contractor" || formData.userType === "sub_contractor") && (
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Create New User</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 p-4 border-b bg-muted/30">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createUserMutation.isPending}
            className="gap-2"
          >
            {createUserMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create User
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
