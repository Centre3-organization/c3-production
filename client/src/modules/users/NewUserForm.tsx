import { useState, useMemo, useEffect } from "react";
import {
  User,
  Building2,
  Loader2,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  IdCard,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function NewUserForm({ onSuccess, onCancel }: NewUserFormProps) {
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
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter first and last name");
      return;
    }
    if (!formData.email) {
      toast.error("Please enter email address");
      return;
    }
    if (!formData.phone) {
      toast.error("Please enter mobile number");
      return;
    }
    if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
      toast.error("Please enter a temporary password (min 6 characters)");
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Create New User</h2>
            <p className="text-sm text-muted-foreground">Fill in the details below to add a new user</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form Content */}
      <ScrollArea className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          
          {/* User Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              User Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.userType}
              onValueChange={(value) => setFormData({ ...formData, userType: value as UserType, isSubContractor: false })}
            >
              <SelectTrigger>
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
              {/* Identity Verification */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Identity Verification (Optional)</span>
                  {isVerified && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ID Type</Label>
                    <Select value={idType} onValueChange={(value: "national_id" | "iqama") => setIdType(value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="iqama">Iqama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ID Number</Label>
                    <Input
                      value={idNumber}
                      onChange={(e) => handleIdNumberChange(e.target.value)}
                      placeholder={idType === "national_id" ? "1XXXXXXXXX" : "2XXXXXXXXX"}
                      maxLength={10}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button"
                      onClick={handleVerifyYakeen}
                      disabled={verifyYakeenMutation.isPending || idNumber.length !== 10}
                      variant="secondary"
                      size="sm"
                      className="w-full h-9"
                    >
                      {verifyYakeenMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {verificationError && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {verificationError}
                  </div>
                )}
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      disabled={isVerified}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      disabled={isVerified}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number <span className="text-destructive">*</span></Label>
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
              </div>

              {/* Centre3 Employee Fields */}
              {formData.userType === "centre3_employee" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Employee Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Employee ID</Label>
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
                  </div>
                </>
              )}

              {/* Contractor Fields */}
              {formData.userType === "contractor" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Contractor Details
                      </h3>
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
                        <Label htmlFor="isSubContractor" className="text-sm cursor-pointer">Sub-Contractor</Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          {formData.isSubContractor ? "Parent Contractor" : "Contractor Company"} 
                          <span className="text-destructive">*</span>
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
                          <Label>Sub-Contractor Company <span className="text-destructive">*</span></Label>
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
                          <Label>Centre3 Contact</Label>
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
                  </div>
                </>
              )}

              {/* Client Fields */}
              {formData.userType === "client" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Client Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client Company <span className="text-destructive">*</span></Label>
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
                </>
              )}

              <Separator />

              {/* Site Access */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Site Access</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allSites"
                      checked={formData.allSitesAccess}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        allSitesAccess: !!checked,
                        selectedSiteIds: [],
                      })}
                    />
                    <Label htmlFor="allSites" className="text-sm cursor-pointer">All Sites</Label>
                  </div>
                </div>

                {!formData.allSitesAccess && (
                  <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {sites.map((site: any) => (
                        <div key={site.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`site-${site.id}`}
                            checked={formData.selectedSiteIds.includes(site.id)}
                            onCheckedChange={() => toggleSite(site.id)}
                          />
                          <Label htmlFor={`site-${site.id}`} className="text-xs cursor-pointer">
                            {site.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Account Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Account Options</h3>
                
                <div className="space-y-2">
                  <Label>Temporary Password <span className="text-destructive">*</span></Label>
                  <Input
                    type="password"
                    value={formData.temporaryPassword}
                    onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sendWelcome"
                      checked={formData.sendWelcomeEmail}
                      onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: !!checked })}
                    />
                    <Label htmlFor="sendWelcome" className="text-sm cursor-pointer">Send welcome email with login instructions</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mustChange"
                      checked={formData.mustChangePassword}
                      onCheckedChange={(checked) => setFormData({ ...formData, mustChangePassword: !!checked })}
                    />
                    <Label htmlFor="mustChange" className="text-sm cursor-pointer">Require password change on first login</Label>
                  </div>

                  {formData.userType === "contractor" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="expiresWithContract"
                        checked={formData.accountExpiresWithContract}
                        onCheckedChange={(checked) => setFormData({ ...formData, accountExpiresWithContract: !!checked })}
                      />
                      <Label htmlFor="expiresWithContract" className="text-sm cursor-pointer">Account expires with contract</Label>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createUserMutation.isPending || !formData.userType}
        >
          {createUserMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
