import { useState } from "react";
import {
  User,
  Building2,
  Shield,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";

interface ViewUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

// SAP Fiori-style Field Display
function FieldDisplay({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

// Section Header
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pb-2 mb-4 border-b border-[#4f008c]/20">
      <h3 className="text-sm font-semibold text-[#4f008c]">{title}</h3>
    </div>
  );
}

export default function ViewUserDialog({ user, open, onOpenChange, onEdit }: ViewUserDialogProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Fetch additional data
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const { data: companiesData } = trpc.masterData.getAllCompanies.useQuery({});
  const { data: sitesData } = trpc.sites.getAll.useQuery();

  const departments = departmentsData || [];
  const companies = companiesData || [];
  const sites = sitesData || [];

  if (!user) return null;

  const getUserInitials = () => {
    const first = user.firstName?.[0] || user.name?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email || "Unknown User";
  };

  const getUserTypeDisplay = () => {
    switch (user.userType) {
      case "centre3_employee": return "Centre3 Employee";
      case "contractor": return "Contractor";
      case "sub_contractor": return "Sub-Contractor";
      case "client": return "Client";
      default: return user.userType || "Unknown";
    }
  };

  const getDepartmentName = (id: number | null) => {
    if (!id) return "—";
    const dept = departments.find((d: any) => d.id === id);
    return dept?.name || "—";
  };

  const getCompanyName = (id: number | null) => {
    if (!id) return "—";
    const company = companies.find((c: any) => c.id === id);
    return company?.name || "—";
  };

  const getSiteName = (id: number | null) => {
    if (!id) return "—";
    const site = sites.find((s: any) => s.id === id);
    return site?.name || "—";
  };

  const formatDate = (date: any) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "user": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-700 border-gray-200";
      case "suspended": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-[#4f008c]/20">
                <AvatarFallback className="bg-gradient-to-br from-[#ff375e]/20 to-[#4f008c]/20 text-[#4f008c] text-xl font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl text-[#4f008c]">{getUserDisplayName()}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(user.status || "active")}>
                    {user.status || "active"}
                  </Badge>
                  <Badge variant="secondary">
                    {getUserTypeDisplay()}
                  </Badge>
                </div>
              </div>
            </div>
            <Button onClick={onEdit} className="gap-2 bg-[#4f008c] hover:bg-[#3d006d] text-white">
              <Edit2 className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general" className="gap-2">
              <User className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Shield className="h-4 w-4" />
              Access
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-auto mt-4">
            {/* General Tab */}
            <TabsContent value="general" className="m-0 space-y-6">
              {/* Personal Information */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Personal Information" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay label="First Name (English)" value={user.firstName} />
                  <FieldDisplay label="Last Name (English)" value={user.lastName} />
                  <FieldDisplay label="First Name (Arabic)" value={user.firstNameAr} />
                  <FieldDisplay label="Last Name (Arabic)" value={user.lastNameAr} />
                </div>
              </div>

              {/* Identity Information */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Identity Information" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay label="ID Type" value={user.idType === "national_id" ? "National ID" : user.idType === "iqama" ? "Iqama" : user.idType} />
                  <FieldDisplay label="ID Number" value={user.idNumber} />
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Contact Information" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay 
                    label="Email Address" 
                    value={user.email} 
                    icon={<Mail className="h-4 w-4 text-muted-foreground" />} 
                  />
                  <FieldDisplay 
                    label="Mobile Number" 
                    value={user.phone} 
                    icon={<Phone className="h-4 w-4 text-muted-foreground" />} 
                  />
                </div>
              </div>
            </TabsContent>

            {/* Organization Tab */}
            <TabsContent value="organization" className="m-0 space-y-6">
              {/* Employment Information */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Employment Information" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay 
                    label="Job Title" 
                    value={user.jobTitle} 
                    icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} 
                  />
                  <FieldDisplay label="Employee ID" value={user.employeeId} />
                  <FieldDisplay label="Department" value={getDepartmentName(user.departmentId)} />
                  <FieldDisplay label="Reports To" value={user.managerName || "—"} />
                </div>
              </div>

              {/* Company Assignment */}
              {(user.userType === "contractor" || user.userType === "sub_contractor") && (
                <div className="bg-card rounded-lg border p-5">
                  <SectionHeader title="Contractor Assignment" />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <FieldDisplay 
                      label="Contractor Company" 
                      value={getCompanyName(user.contractorCompanyId)} 
                      icon={<Building2 className="h-4 w-4 text-muted-foreground" />} 
                    />
                    {user.userType === "sub_contractor" && (
                      <FieldDisplay 
                        label="Sub-Contractor Company" 
                        value={getCompanyName(user.subContractorCompanyId)} 
                      />
                    )}
                    <FieldDisplay 
                      label="Contract Reference" 
                      value={user.contractReference} 
                      icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
                    />
                    <FieldDisplay 
                      label="Contract Expiry" 
                      value={formatDate(user.contractExpiry)} 
                      icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
                    />
                    <FieldDisplay label="Centre3 Contact" value={user.reportingToName || "—"} />
                  </div>
                </div>
              )}

              {user.userType === "client" && (
                <div className="bg-card rounded-lg border p-5">
                  <SectionHeader title="Client Assignment" />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <FieldDisplay 
                      label="Client Company" 
                      value={getCompanyName(user.clientCompanyId)} 
                      icon={<Building2 className="h-4 w-4 text-muted-foreground" />} 
                    />
                    <FieldDisplay label="Account Manager" value={user.accountManagerName || "—"} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Access Tab */}
            <TabsContent value="access" className="m-0 space-y-6">
              {/* Role & Permissions */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Role & Permissions" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay 
                    label="System Role" 
                    value={
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    } 
                  />
                  <FieldDisplay 
                    label="Status" 
                    value={
                      <Badge variant="outline" className={getStatusColor(user.status || "active")}>
                        {user.status || "active"}
                      </Badge>
                    } 
                  />
                </div>
              </div>

              {/* Site Access */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Site Access" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay 
                    label="Site Access" 
                    value={user.allSitesAccess ? "All Sites" : "Specific Sites"} 
                    icon={<MapPin className="h-4 w-4 text-muted-foreground" />} 
                  />
                  {!user.allSitesAccess && user.siteIds && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Assigned Sites</p>
                      <div className="flex flex-wrap gap-2">
                        {user.siteIds.map((siteId: number) => (
                          <Badge key={siteId} variant="secondary">
                            {getSiteName(siteId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-card rounded-lg border p-5">
                <SectionHeader title="Account Information" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldDisplay 
                    label="Created" 
                    value={formatDate(user.createdAt)} 
                    icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
                  />
                  <FieldDisplay 
                    label="Last Sign In" 
                    value={formatDate(user.lastSignedIn)} 
                  />
                  <FieldDisplay label="Login Method" value={user.loginMethod || "Password"} />
                  {user.userType === "contractor" && (
                    <FieldDisplay 
                      label="Account Expires With Contract" 
                      value={user.accountExpiresWithContract ? "Yes" : "No"} 
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
