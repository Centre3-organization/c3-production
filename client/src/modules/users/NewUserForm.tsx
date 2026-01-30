import { useState, useEffect } from "react";
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
  Search,
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
  { id: 1, title: "User Type", icon: User },
  { id: 2, title: "Personal Details", icon: User },
  { id: 3, title: "System Access", icon: Shield },
  { id: 4, title: "Photo", icon: Camera },
  { id: 5, title: "Options", icon: Settings },
];

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: User Type
    userType: "" as UserType | "",
    
    // Step 2: Personal Details
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
    
    // Step 3: System Access
    role: "user" as "user" | "admin",
    siteIds: [] as number[],
    
    // Step 4: Photo
    profilePhotoUrl: "",
    
    // Step 5: Options
    temporaryPassword: "",
    sendWelcomeEmail: true,
    mustChangePassword: true,
    accountExpiresWithContract: false,
  });

  // Fetch data
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const { data: usersData } = trpc.users.list.useQuery({});
  const { data: sitesData } = trpc.sites.getAll.useQuery();
  const { data: companiesData } = trpc.mcm.companies.list.useQuery({});

  const departments = departmentsData || [];
  const users = usersData?.users || [];
  const sites = sitesData || [];
  const companies = companiesData || [];

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
      setCurrentStep((prev) => Math.min(prev + 1, 5));
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
        return true;
      case 2:
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
        // Validate email domain for Centre3 employees
        if (formData.userType === "centre3_employee" && !formData.email.endsWith("@center3.sa")) {
          // Warning but allow
          // toast.warning("Centre3 employees should use @center3.sa email");
        }
        // Validate contractor-specific fields
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
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
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
      jobTitle: formData.jobTitle,
      employeeId: formData.employeeId || undefined,
      departmentId: formData.departmentId,
      managerId: formData.managerId,
      contractorCompanyId: formData.contractorCompanyId,
      contractReference: formData.contractReference || undefined,
      contractExpiry: formData.contractExpiry || undefined,
      reportingToId: formData.reportingToId,
      parentContractorId: formData.parentContractorId,
      subContractorCompany: formData.subContractorCompany || undefined,
      clientCompanyId: formData.clientCompanyId,
      accountManagerId: formData.accountManagerId,
      role: formData.role,
      siteIds: formData.siteIds.length > 0 ? formData.siteIds : undefined,
      profilePhotoUrl: formData.profilePhotoUrl || undefined,
      temporaryPassword: formData.temporaryPassword,
      sendWelcomeEmail: formData.sendWelcomeEmail,
      mustChangePassword: formData.mustChangePassword,
      accountExpiresWithContract: formData.accountExpiresWithContract,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select User Type</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of user account you want to create. This determines which fields are required.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(userTypeLabels) as UserType[]).map((type) => (
                <div
                  key={type}
                  onClick={() => setFormData({ ...formData, userType: type })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.userType === type
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.userType === type ? "bg-purple-500 text-white" : "bg-gray-100"
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{userTypeLabels[type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {type === "centre3_employee" && "Internal staff member"}
                        {type === "contractor" && "External contractor"}
                        {type === "sub_contractor" && "Works under a contractor"}
                        {type === "client" && "Customer representative"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the user's personal and contact information.
              </p>
            </div>

            {/* Common fields for all user types */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ahmed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Al-Sayed"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={formData.userType === "centre3_employee" ? "ahmed@center3.sa" : "ahmed@company.com"}
                  required
                />
                {formData.userType === "centre3_employee" && (
                  <p className="text-xs text-muted-foreground">Use @center3.sa email for employees</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 5..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Senior Engineer"
                required
              />
            </div>

            <Separator />

            {/* Centre3 Employee specific fields */}
            {formData.userType === "centre3_employee" && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Centre3 Employee Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="EMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.departmentId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, departmentId: v ? parseInt(v) : null })}
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
                <div className="space-y-2">
                  <Label htmlFor="managerId">Manager</Label>
                  <Select
                    value={formData.managerId?.toString() || ""}
                    onValueChange={(v) => setFormData({ ...formData, managerId: v ? parseInt(v) : null })}
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
            )}

            {/* Contractor specific fields */}
            {formData.userType === "contractor" && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Contractor Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractorCompanyId">Contractor Company <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.contractorCompanyId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, contractorCompanyId: v ? parseInt(v) : null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter((c: any) => c.companyType === "contractor").map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractReference">Contract Reference</Label>
                    <Input
                      id="contractReference"
                      value={formData.contractReference}
                      onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                      placeholder="CON-2024-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractExpiry">Contract Expiry Date</Label>
                    <Input
                      id="contractExpiry"
                      type="date"
                      value={formData.contractExpiry}
                      onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingToId">Reporting To (Centre3 Contact)</Label>
                    <Select
                      value={formData.reportingToId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, reportingToId: v ? parseInt(v) : null })}
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
              </div>
            )}

            {/* Sub-Contractor specific fields */}
            {formData.userType === "sub_contractor" && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Sub-Contractor Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentContractorId">Parent Contractor <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.parentContractorId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, parentContractorId: v ? parseInt(v) : null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter((c: any) => c.companyType === "contractor").map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subContractorCompany">Sub-Contractor Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="subContractorCompany"
                      value={formData.subContractorCompany}
                      onChange={(e) => setFormData({ ...formData, subContractorCompany: e.target.value })}
                      placeholder="ABC Services Ltd"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractReference">Contract Reference</Label>
                    <Input
                      id="contractReference"
                      value={formData.contractReference}
                      onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                      placeholder="SUB-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractExpiry">Contract Expiry Date</Label>
                    <Input
                      id="contractExpiry"
                      type="date"
                      value={formData.contractExpiry}
                      onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Client specific fields */}
            {formData.userType === "client" && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Client Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCompanyId">Client Company <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.clientCompanyId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, clientCompanyId: v ? parseInt(v) : null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter((c: any) => c.companyType === "client").map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountManagerId">Account Manager (Centre3)</Label>
                    <Select
                      value={formData.accountManagerId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, accountManagerId: v ? parseInt(v) : null })}
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
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">System Access</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure the user's system role and site access permissions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">System Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v: "user" | "admin") => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Standard Access)</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins have full system access. Users have limited access based on their assigned permissions.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Site Access</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which sites this user can access. Leave empty for all sites.
              </p>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {sites.map((site: any) => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={formData.siteIds.includes(site.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, siteIds: [...formData.siteIds, site.id] });
                        } else {
                          setFormData({ ...formData, siteIds: formData.siteIds.filter((id) => id !== site.id) });
                        }
                      }}
                    />
                    <Label htmlFor={`site-${site.id}`} className="text-sm font-normal cursor-pointer">
                      {site.name}
                    </Label>
                  </div>
                ))}
                {sites.length === 0 && (
                  <p className="text-sm text-muted-foreground">No sites available</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Profile Photo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a profile photo for the user (optional).
              </p>
            </div>

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
                  <p className="text-sm text-muted-foreground mb-2">No photo uploaded</p>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 200x200 pixels. Max file size: 5MB.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Account Options</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set the initial password and account options.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Temporary Password <span className="text-red-500">*</span></Label>
              <Input
                id="temporaryPassword"
                type="password"
                value={formData.temporaryPassword}
                onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                placeholder="••••••••"
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. The user will use this to log in initially.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: !!checked })}
                />
                <Label htmlFor="sendWelcomeEmail" className="text-sm font-normal cursor-pointer">
                  Send welcome email with login instructions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mustChangePassword"
                  checked={formData.mustChangePassword}
                  onCheckedChange={(checked) => setFormData({ ...formData, mustChangePassword: !!checked })}
                />
                <Label htmlFor="mustChangePassword" className="text-sm font-normal cursor-pointer">
                  Require password change on first login
                </Label>
              </div>

              {(formData.userType === "contractor" || formData.userType === "sub_contractor") && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accountExpiresWithContract"
                    checked={formData.accountExpiresWithContract}
                    onCheckedChange={(checked) => setFormData({ ...formData, accountExpiresWithContract: !!checked })}
                  />
                  <Label htmlFor="accountExpiresWithContract" className="text-sm font-normal cursor-pointer">
                    Account expires when contract ends
                  </Label>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">User Type:</div>
                <div>{userTypeLabels[formData.userType as UserType] || "-"}</div>
                <div className="text-muted-foreground">Name:</div>
                <div>{formData.firstName} {formData.lastName}</div>
                <div className="text-muted-foreground">Email:</div>
                <div>{formData.email}</div>
                <div className="text-muted-foreground">Role:</div>
                <div>{formData.role === "admin" ? "Administrator" : "User"}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Steps */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-6">Create New User</h2>
        <div className="space-y-2 flex-1">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-purple-600"
                    : isCompleted
                    ? "bg-slate-800"
                    : "hover:bg-slate-800"
                }`}
                onClick={() => {
                  if (isCompleted || isActive) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? "bg-white text-purple-600" : isCompleted ? "bg-green-500 text-white" : "bg-slate-700"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span className="text-sm">{step.title}</span>
              </div>
            );
          })}
        </div>
        
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">Step {currentStep} of {steps.length}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            {currentStep < 5 ? (
              <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
