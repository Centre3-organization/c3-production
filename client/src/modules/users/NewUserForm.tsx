import { useState, useEffect, useMemo } from "react";
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

// Updated steps - merged User Type with Personal Info
const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "System Access", icon: Shield },
  { id: 3, title: "Photo", icon: Camera },
  { id: 4, title: "Options", icon: Settings },
];

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: User Type + Personal Details (merged)
    userType: "" as UserType | "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
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
    
    // Step 2: System Access - with cascading site/zone/area
    roleId: null as number | null,
    selectedSiteId: null as number | null,
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

  // Cascading: Filter zones by selected site
  const filteredZones = useMemo(() => {
    if (!formData.selectedSiteId) return [];
    return zones.filter((z: any) => z.siteId === formData.selectedSiteId);
  }, [zones, formData.selectedSiteId]);

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

  // Reset zones/areas when site changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedZoneIds: [],
      selectedAreaIds: [],
    }));
  }, [formData.selectedSiteId]);

  // Reset areas when zones change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedAreaIds: [],
    }));
  }, [formData.selectedZoneIds]);

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

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.userType) {
          toast.error("Please select a user type");
          return false;
        }
        if (!formData.firstName || !formData.lastName) {
          toast.error("First name and last name are required");
          return false;
        }
        if (!formData.email) {
          toast.error("Email is required");
          return false;
        }
        if (!formData.phone) {
          toast.error("Mobile number is required");
          return false;
        }
        if (!formData.jobTitle) {
          toast.error("Job title is required");
          return false;
        }
        // Type-specific validation
        if (formData.userType === "centre3_employee" && !formData.employeeId) {
          toast.error("Employee ID is required for Centre3 employees");
          return false;
        }
        if (formData.userType === "contractor" && !formData.contractorCompanyId) {
          toast.error("Please select a contractor company");
          return false;
        }
        if (formData.userType === "sub_contractor" && !formData.parentContractorId) {
          toast.error("Please select a parent contractor");
          return false;
        }
        if (formData.userType === "client" && !formData.clientCompanyId) {
          toast.error("Please select a client company");
          return false;
        }
        return true;
      case 2:
        if (!formData.roleId) {
          toast.error("Please select a role");
          return false;
        }
        if (!formData.selectedSiteId) {
          toast.error("Please select at least one site");
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
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
      jobTitle: formData.jobTitle,
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
    });
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

  // Render step content
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
      {/* User Type Dropdown */}
      <div className="space-y-2">
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

      {formData.userType && (
        <>
          <Separator />
          
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
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
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Enter job title"
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
                          {user.name}
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
                      <SelectValue placeholder="Select contractor company" />
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
                  <Label>Reports To (Internal)</Label>
                  <Select
                    value={formData.reportingToId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, reportingToId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select internal contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((u: any) => u.userType === "centre3_employee").map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Expiry</Label>
                  <Input
                    type="date"
                    value={formData.contractExpiry}
                    onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    className="bg-muted"
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
                  <Label>Sub-Contractor Company Name</Label>
                  <Input
                    value={formData.subContractorCompany}
                    onChange={(e) => setFormData({ ...formData, subContractorCompany: e.target.value })}
                    placeholder="Enter sub-contractor company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Reference</Label>
                  <Input
                    value={formData.contractReference}
                    onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                    placeholder="Auto-populated from parent contractor"
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Expiry</Label>
                  <Input
                    type="date"
                    value={formData.contractExpiry}
                    onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    className="bg-muted"
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
                  <Label>Account Manager</Label>
                  <Select
                    value={formData.accountManagerId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, accountManagerId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((u: any) => u.userType === "centre3_employee").map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
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
                    placeholder="Auto-populated from client company"
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Expiry</Label>
                  <Input
                    type="date"
                    value={formData.contractExpiry}
                    onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    className="bg-muted"
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // Step 2: System Access with cascading Site → Zone → Area
  const renderSystemAccessStep = () => (
    <div className="space-y-6">
      {/* Role Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Role <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.roleId?.toString() || ""}
          onValueChange={(value) => setFormData({ ...formData, roleId: value ? parseInt(value) : null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role: any) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {role.name}
                  {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.roleId && (
          <p className="text-xs text-muted-foreground">
            {roles.find((r: any) => r.id === formData.roleId)?.description || "No description available"}
          </p>
        )}
      </div>

      <Separator />

      {/* Site Access - Cascading Dropdowns */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Site Access
        </h4>

        {/* Site Selection */}
        <div className="space-y-2">
          <Label>Site <span className="text-red-500">*</span></Label>
          <Select
            value={formData.selectedSiteId?.toString() || ""}
            onValueChange={(value) => setFormData({ ...formData, selectedSiteId: value ? parseInt(value) : null })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site: any) => (
                <SelectItem key={site.id} value={site.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {site.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone Selection - Only show if site is selected */}
        {formData.selectedSiteId && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Zones
            </Label>
            {filteredZones.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/30">
                {filteredZones.map((zone: any) => (
                  <div key={zone.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`zone-${zone.id}`}
                      checked={formData.selectedZoneIds.includes(zone.id)}
                      onCheckedChange={() => toggleZone(zone.id)}
                    />
                    <label
                      htmlFor={`zone-${zone.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {zone.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No zones available for this site</p>
            )}
          </div>
        )}

        {/* Area Selection - Only show if zones are selected */}
        {formData.selectedZoneIds.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Areas
            </Label>
            {filteredAreas.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/30">
                {filteredAreas.map((area: any) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={formData.selectedAreaIds.includes(area.id)}
                      onCheckedChange={() => toggleArea(area.id)}
                    />
                    <label
                      htmlFor={`area-${area.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {area.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No areas available for selected zones</p>
            )}
          </div>
        )}

        {/* Access Summary */}
        {formData.selectedSiteId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Access Summary</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                {sites.find((s: any) => s.id === formData.selectedSiteId)?.name}
              </Badge>
              {formData.selectedZoneIds.map(zoneId => (
                <Badge key={zoneId} variant="secondary">
                  {zones.find((z: any) => z.id === zoneId)?.name}
                </Badge>
              ))}
              {formData.selectedAreaIds.map(areaId => (
                <Badge key={areaId} className="bg-purple-100 text-purple-800">
                  {areas.find((a: any) => a.id === areaId)?.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Photo
  const renderPhotoStep = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
        {formData.profilePhotoUrl ? (
          <div className="relative">
            <img
              src={formData.profilePhotoUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => setFormData({ ...formData, profilePhotoUrl: "" })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Upload a profile photo (optional)
            </p>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Choose Photo
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Recommended: Square image, at least 200x200 pixels
      </p>
    </div>
  );

  // Step 4: Options
  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Temporary Password</Label>
        <Input
          type="password"
          value={formData.temporaryPassword}
          onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
          placeholder="Leave blank to auto-generate"
        />
        <p className="text-xs text-muted-foreground">
          If left blank, a secure password will be generated automatically
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Send Welcome Email</Label>
            <p className="text-xs text-muted-foreground">
              Send login credentials to the user's email
            </p>
          </div>
          <Checkbox
            checked={formData.sendWelcomeEmail}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, sendWelcomeEmail: checked as boolean })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Must Change Password</Label>
            <p className="text-xs text-muted-foreground">
              Require password change on first login
            </p>
          </div>
          <Checkbox
            checked={formData.mustChangePassword}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, mustChangePassword: checked as boolean })
            }
          />
        </div>

        {(formData.userType === "contractor" || formData.userType === "sub_contractor" || formData.userType === "client") && (
          <div className="flex items-center justify-between">
            <div>
              <Label>Account Expires with Contract</Label>
              <p className="text-xs text-muted-foreground">
                Automatically disable account when contract expires
              </p>
            </div>
            <Checkbox
              checked={formData.accountExpiresWithContract}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, accountExpiresWithContract: checked as boolean })
              }
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <Separator />
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-3">Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Name:</span>
          <span>{formData.firstName} {formData.lastName}</span>
          <span className="text-muted-foreground">Email:</span>
          <span>{formData.email}</span>
          <span className="text-muted-foreground">User Type:</span>
          <span>{formData.userType ? userTypeLabels[formData.userType] : "-"}</span>
          <span className="text-muted-foreground">Role:</span>
          <span>{roles.find((r: any) => r.id === formData.roleId)?.name || "-"}</span>
          <span className="text-muted-foreground">Site:</span>
          <span>{sites.find((s: any) => s.id === formData.selectedSiteId)?.name || "-"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4">
        <h3 className="font-semibold mb-4">Create New User</h3>
        <div className="space-y-1">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-muted"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">{steps[currentStep - 1].title}</h2>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="gap-2"
          >
            {currentStep === 1 ? (
              <>
                <X className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" /> Previous
              </>
            )}
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} className="gap-2 bg-purple-600 hover:bg-purple-700">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createUserMutation.isPending}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Create User
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
