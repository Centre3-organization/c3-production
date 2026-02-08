import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FormTemplateBuilder from "./FormTemplateBuilder";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Globe, 
  Bell, 
  Shield, 
  Loader2,
  Database,
  MapPin,
  Building,
  Layers,
  Grid3X3,
  Activity,
  UserCog,
  Users2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { HierarchicalTypeManager } from "./components/HierarchicalTypeManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Languages, ExternalLink } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Fetch departments from backend
  const { data: departmentsData, isLoading: departmentsLoading, refetch: refetchDepartments } = trpc.departments.list.useQuery({});
  
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [newDept, setNewDept] = useState({ name: "", costCenter: "", description: "" });

  // Create department mutation
  const createDeptMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Department Created", {
        description: `${newDept.name} has been successfully created.`
      });
      refetchDepartments();
      setNewDeptOpen(false);
      setNewDept({ name: "", costCenter: "", description: "" });
    },
    onError: (error) => {
      toast.error("Failed to create department", { description: error.message });
    }
  });

  // Update department mutation
  const updateDeptMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Department Updated");
      refetchDepartments();
      setEditDeptOpen(false);
      setEditingDept(null);
    },
    onError: (error) => {
      toast.error("Failed to update department", { description: error.message });
    }
  });

  // Delete department mutation
  const deleteDeptMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Department Removed");
      refetchDepartments();
    },
    onError: (error) => {
      toast.error("Failed to delete department", { description: error.message });
    }
  });

  const departments = departmentsData || [];

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    createDeptMutation.mutate({
      name: newDept.name,
      costCenter: newDept.costCenter || undefined,
      description: newDept.description || undefined,
    });
  };

  const handleEditDepartment = (dept: any) => {
    setEditingDept({
      id: dept.id,
      name: dept.name,
      costCenter: dept.costCenter || "",
      description: dept.description || "",
    });
    setEditDeptOpen(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    updateDeptMutation.mutate({
      id: editingDept.id,
      name: editingDept.name,
      costCenter: editingDept.costCenter || undefined,
      description: editingDept.description || undefined,
    });
  };

  const handleDeleteDept = (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteDeptMutation.mutate({ id });
    }
  };

  // Security settings - fetch from backend
  const { data: securityData, isLoading: securityLoading, refetch: refetchSecurity } = trpc.settings.getSecurityPolicies.useQuery();
  
  const [securitySettings, setSecuritySettings] = useState({
    passwordExpiry: 90,
    sessionTimeout: 30,
    mfaEnabled: false,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (securityData) {
      setSecuritySettings({
        passwordExpiry: securityData.passwordExpiry,
        sessionTimeout: securityData.sessionTimeout,
        mfaEnabled: securityData.mfaEnabled,
      });
    }
  }, [securityData]);

  // Update security policies mutation
  const updateSecurityMutation = trpc.settings.updateSecurityPolicies.useMutation({
    onSuccess: () => {
      toast.success("Security Policies Updated", {
        description: "Your security settings have been saved."
      });
      refetchSecurity();
    },
    onError: (error) => {
      toast.error("Failed to update security policies", { description: error.message });
    }
  });

  const handleSaveSecuritySettings = () => {
    updateSecurityMutation.mutate({
      passwordExpiry: securitySettings.passwordExpiry,
      sessionTimeout: securitySettings.sessionTimeout,
      mfaEnabled: securitySettings.mfaEnabled,
    });
  };

  // ============================================================================
  // MASTER DATA STATE & QUERIES
  // ============================================================================
  
  const [masterDataTab, setMasterDataTab] = useState("activities");
  const [activitiesSubTab, setActivitiesSubTab] = useState("main");

  // Main Activities
  const { data: mainActivitiesData, isLoading: mainActivitiesLoading, refetch: refetchMainActivities } = trpc.masterData.getAllMainActivities.useQuery();
  const [newMainActivityOpen, setNewMainActivityOpen] = useState(false);
  const [editMainActivityOpen, setEditMainActivityOpen] = useState(false);
  const [editingMainActivity, setEditingMainActivity] = useState<any>(null);
  const [newMainActivity, setNewMainActivity] = useState({ name: "", nameAr: "", description: "", icon: "", color: "" });
  
  const createMainActivityMutation = trpc.masterData.createMainActivity.useMutation({
    onSuccess: () => {
      toast.success("Main Activity Created");
      refetchMainActivities();
      setNewMainActivityOpen(false);
      setNewMainActivity({ name: "", nameAr: "", description: "", icon: "", color: "" });
    },
    onError: (error) => toast.error("Failed to create main activity", { description: error.message })
  });
  
  const updateMainActivityMutation = trpc.masterData.updateMainActivity.useMutation({
    onSuccess: () => {
      toast.success("Main Activity Updated");
      refetchMainActivities();
      setEditMainActivityOpen(false);
      setEditingMainActivity(null);
    },
    onError: (error) => toast.error("Failed to update main activity", { description: error.message })
  });
  
  const deleteMainActivityMutation = trpc.masterData.deleteMainActivity.useMutation({
    onSuccess: () => {
      toast.success("Main Activity Deleted");
      refetchMainActivities();
    },
    onError: (error) => toast.error("Failed to delete main activity", { description: error.message })
  });

  // Sub Activities
  const { data: subActivitiesData, isLoading: subActivitiesLoading, refetch: refetchSubActivities } = trpc.masterData.getAllSubActivities.useQuery();
  const [newSubActivityOpen, setNewSubActivityOpen] = useState(false);
  const [editSubActivityOpen, setEditSubActivityOpen] = useState(false);
  const [editingSubActivity, setEditingSubActivity] = useState<any>(null);
  const [newSubActivity, setNewSubActivity] = useState({ mainActivityId: 0, name: "", nameAr: "", description: "", needsRFC: false, needsHRS: false, needsMOP: false, needsMHV: false, needsRoomSelection: false, requiresMOP: false, requiresPermit: false, riskLevel: "low" as const });
  
  const createSubActivityMutation = trpc.masterData.createSubActivity.useMutation({
    onSuccess: () => {
      toast.success("Sub-Activity Created");
      refetchSubActivities();
      refetchMainActivities();
      setNewSubActivityOpen(false);
      setNewSubActivity({ mainActivityId: 0, name: "", nameAr: "", description: "", needsRFC: false, needsHRS: false, needsMOP: false, needsMHV: false, needsRoomSelection: false, requiresMOP: false, requiresPermit: false, riskLevel: "low" });
    },
    onError: (error) => toast.error("Failed to create sub-activity", { description: error.message })
  });
  
  const updateSubActivityMutation = trpc.masterData.updateSubActivity.useMutation({
    onSuccess: () => {
      toast.success("Sub-Activity Updated");
      refetchSubActivities();
      setEditSubActivityOpen(false);
      setEditingSubActivity(null);
    },
    onError: (error) => toast.error("Failed to update sub-activity", { description: error.message })
  });
  
  const deleteSubActivityMutation = trpc.masterData.deleteSubActivity.useMutation({
    onSuccess: () => {
      toast.success("Sub-Activity Deleted");
      refetchSubActivities();
      refetchMainActivities();
    },
    onError: (error) => toast.error("Failed to delete sub-activity", { description: error.message })
  });

  // Role Types
  const { data: roleTypesData, isLoading: roleTypesLoading, refetch: refetchRoleTypes } = trpc.masterData.getAllRoleTypes.useQuery();
  const [newRoleTypeOpen, setNewRoleTypeOpen] = useState(false);
  const [editRoleTypeOpen, setEditRoleTypeOpen] = useState(false);
  const [editingRoleType, setEditingRoleType] = useState<any>(null);
  const [newRoleType, setNewRoleType] = useState({ name: "", nameAr: "", description: "", category: "internal" as const, accessLevel: "standard" as const });
  
  const createRoleTypeMutation = trpc.masterData.createRoleType.useMutation({
    onSuccess: () => {
      toast.success("Role Type Created");
      refetchRoleTypes();
      setNewRoleTypeOpen(false);
      setNewRoleType({ name: "", nameAr: "", description: "", category: "internal", accessLevel: "standard" });
    },
    onError: (error) => toast.error("Failed to create role type", { description: error.message })
  });
  
  const updateRoleTypeMutation = trpc.masterData.updateRoleType.useMutation({
    onSuccess: () => {
      toast.success("Role Type Updated");
      refetchRoleTypes();
      setEditRoleTypeOpen(false);
      setEditingRoleType(null);
    },
    onError: (error) => toast.error("Failed to update role type", { description: error.message })
  });
  
  const deleteRoleTypeMutation = trpc.masterData.deleteRoleType.useMutation({
    onSuccess: () => {
      toast.success("Role Type Deleted");
      refetchRoleTypes();
    },
    onError: (error) => toast.error("Failed to delete role type", { description: error.message })
  });

  // Approvers
  const { data: approversData, isLoading: approversLoading, refetch: refetchApprovers } = trpc.masterData.getAllApprovers.useQuery();
  const { data: usersForApprovers } = trpc.users.list.useQuery({ limit: 1000 });
  const { data: sitesForApprovers } = trpc.sites.getAll.useQuery();
  const [newApproverOpen, setNewApproverOpen] = useState(false);
  const [editApproverOpen, setEditApproverOpen] = useState(false);
  const [editingApprover, setEditingApprover] = useState<any>(null);
  const [newApprover, setNewApprover] = useState({ userId: 0, siteId: null as number | null, approvalLevel: 1, canApproveEmergency: false, canApproveVIP: false });
  
  const createApproverMutation = trpc.masterData.createApprover.useMutation({
    onSuccess: () => {
      toast.success("Approver Created");
      refetchApprovers();
      setNewApproverOpen(false);
      setNewApprover({ userId: 0, siteId: null, approvalLevel: 1, canApproveEmergency: false, canApproveVIP: false });
    },
    onError: (error) => toast.error("Failed to create approver", { description: error.message })
  });
  
  const updateApproverMutation = trpc.masterData.updateApprover.useMutation({
    onSuccess: () => {
      toast.success("Approver Updated");
      refetchApprovers();
      setEditApproverOpen(false);
      setEditingApprover(null);
    },
    onError: (error) => toast.error("Failed to update approver", { description: error.message })
  });
  
  const deleteApproverMutation = trpc.masterData.deleteApprover.useMutation({
    onSuccess: () => {
      toast.success("Approver Deleted");
      refetchApprovers();
    },
    onError: (error) => toast.error("Failed to delete approver", { description: error.message })
  });

  // Companies
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = trpc.masterData.getAllCompanies.useQuery();
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companiesFilter, setCompaniesFilter] = useState<"all" | "contractor" | "subcontractor" | "client">("all");
  const [newCompany, setNewCompany] = useState<{
    code: string; name: string; nameAr: string; type: "contractor" | "subcontractor" | "client";
    parentCompanyId: number | undefined;
    contactPersonName: string; contactPersonEmail: string; contactPersonPhone: string; contactPersonPosition: string;
    contractReference: string; contractStartDate: string; contractEndDate: string;
    address: string; city: string; country: string; registrationNumber: string;
    status: "active" | "inactive" | "suspended"; notes: string;
  }>({
    code: "", name: "", nameAr: "", type: "contractor",
    parentCompanyId: undefined,
    contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "", contactPersonPosition: "",
    contractReference: "", contractStartDate: "", contractEndDate: "",
    address: "", city: "", country: "", registrationNumber: "",
    status: "active", notes: ""
  });

  const createCompanyMutation = trpc.masterData.createCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Created");
      refetchCompanies();
      setNewCompanyOpen(false);
      setNewCompany({ code: "", name: "", nameAr: "", type: "contractor", parentCompanyId: undefined, contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "", contactPersonPosition: "", contractReference: "", contractStartDate: "", contractEndDate: "", address: "", city: "", country: "", registrationNumber: "", status: "active", notes: "" });
    },
    onError: (error) => toast.error("Failed to create company", { description: error.message })
  });

  const updateCompanyMutation = trpc.masterData.updateCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Updated");
      refetchCompanies();
      setEditCompanyOpen(false);
      setEditingCompany(null);
    },
    onError: (error) => toast.error("Failed to update company", { description: error.message })
  });

  const deleteCompanyMutation = trpc.masterData.deleteCompany.useMutation({
    onSuccess: () => {
      toast.success("Company Deactivated");
      refetchCompanies();
    },
    onError: (error) => toast.error("Failed to deactivate company", { description: error.message })
  });

  const filteredCompanies = companiesData?.filter(c => companiesFilter === "all" || c.type === companiesFilter) || [];
  
  // Countries
  const { data: countriesData, isLoading: countriesLoading, refetch: refetchCountries } = trpc.masterData.getAllCountries.useQuery();
  const [newCountryOpen, setNewCountryOpen] = useState(false);
  const [editCountryOpen, setEditCountryOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [newCountry, setNewCountry] = useState({ code: "", name: "" });
  
  const createCountryMutation = trpc.masterData.createCountry.useMutation({
    onSuccess: () => {
      toast.success("Country Created");
      refetchCountries();
      setNewCountryOpen(false);
      setNewCountry({ code: "", name: "" });
    },
    onError: (error) => toast.error("Failed to create country", { description: error.message })
  });
  
  const updateCountryMutation = trpc.masterData.updateCountry.useMutation({
    onSuccess: () => {
      toast.success("Country Updated");
      refetchCountries();
      setEditCountryOpen(false);
      setEditingCountry(null);
    },
    onError: (error) => toast.error("Failed to update country", { description: error.message })
  });
  
  const deleteCountryMutation = trpc.masterData.deleteCountry.useMutation({
    onSuccess: () => {
      toast.success("Country Deleted");
      refetchCountries();
    },
    onError: (error) => toast.error("Failed to delete country", { description: error.message })
  });

  // Regions
  const { data: regionsData, isLoading: regionsLoading, refetch: refetchRegions } = trpc.masterData.getAllRegions.useQuery();
  const [newRegionOpen, setNewRegionOpen] = useState(false);
  const [editRegionOpen, setEditRegionOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<any>(null);
  const [newRegion, setNewRegion] = useState({ code: "", name: "" });
  
  const createRegionMutation = trpc.masterData.createRegion.useMutation({
    onSuccess: () => {
      toast.success("Region Created");
      refetchRegions();
      setNewRegionOpen(false);
      setNewRegion({ code: "", name: "" });
    },
    onError: (error) => toast.error("Failed to create region", { description: error.message })
  });
  
  const updateRegionMutation = trpc.masterData.updateRegion.useMutation({
    onSuccess: () => {
      toast.success("Region Updated");
      refetchRegions();
      setEditRegionOpen(false);
      setEditingRegion(null);
    },
    onError: (error) => toast.error("Failed to update region", { description: error.message })
  });
  
  const deleteRegionMutation = trpc.masterData.deleteRegion.useMutation({
    onSuccess: () => {
      toast.success("Region Deleted");
      refetchRegions();
    },
    onError: (error) => toast.error("Failed to delete region", { description: error.message })
  });

  // Cities
  const { data: citiesData, isLoading: citiesLoading, refetch: refetchCities } = trpc.masterData.getAllCities.useQuery();
  const [newCityOpen, setNewCityOpen] = useState(false);
  const [editCityOpen, setEditCityOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [newCity, setNewCity] = useState({ countryId: 0, name: "" });
  
  const createCityMutation = trpc.masterData.createCity.useMutation({
    onSuccess: () => {
      toast.success("City Created");
      refetchCities();
      setNewCityOpen(false);
      setNewCity({ countryId: 0, name: "" });
    },
    onError: (error) => toast.error("Failed to create city", { description: error.message })
  });
  
  const updateCityMutation = trpc.masterData.updateCity.useMutation({
    onSuccess: () => {
      toast.success("City Updated");
      refetchCities();
      setEditCityOpen(false);
      setEditingCity(null);
    },
    onError: (error) => toast.error("Failed to update city", { description: error.message })
  });
  
  const deleteCityMutation = trpc.masterData.deleteCity.useMutation({
    onSuccess: () => {
      toast.success("City Deleted");
      refetchCities();
    },
    onError: (error) => toast.error("Failed to delete city", { description: error.message })
  });

  // Site Types
  const { data: siteTypesData, isLoading: siteTypesLoading, refetch: refetchSiteTypes } = trpc.masterData.getAllSiteTypes.useQuery();
  const [newSiteTypeOpen, setNewSiteTypeOpen] = useState(false);
  const [editSiteTypeOpen, setEditSiteTypeOpen] = useState(false);
  const [editingSiteType, setEditingSiteType] = useState<any>(null);
  const [newSiteType, setNewSiteType] = useState({ code: "", name: "", description: "" });
  
  const createSiteTypeMutation = trpc.masterData.createSiteType.useMutation({
    onSuccess: () => {
      toast.success("Site Type Created");
      refetchSiteTypes();
      setNewSiteTypeOpen(false);
      setNewSiteType({ code: "", name: "", description: "" });
    },
    onError: (error) => toast.error("Failed to create site type", { description: error.message })
  });
  
  const updateSiteTypeMutation = trpc.masterData.updateSiteType.useMutation({
    onSuccess: () => {
      toast.success("Site Type Updated");
      refetchSiteTypes();
      setEditSiteTypeOpen(false);
      setEditingSiteType(null);
    },
    onError: (error) => toast.error("Failed to update site type", { description: error.message })
  });
  
  const deleteSiteTypeMutation = trpc.masterData.deleteSiteType.useMutation({
    onSuccess: () => {
      toast.success("Site Type Deleted");
      refetchSiteTypes();
    },
    onError: (error) => toast.error("Failed to delete site type", { description: error.message })
  });

  // Zone Types
  const { data: zoneTypesData, isLoading: zoneTypesLoading, refetch: refetchZoneTypes } = trpc.masterData.getAllZoneTypes.useQuery();
  const [newZoneTypeOpen, setNewZoneTypeOpen] = useState(false);
  const [editZoneTypeOpen, setEditZoneTypeOpen] = useState(false);
  const [editingZoneType, setEditingZoneType] = useState<any>(null);
  const [newZoneType, setNewZoneType] = useState({ code: "", name: "", description: "" });
  
  const createZoneTypeMutation = trpc.masterData.createZoneType.useMutation({
    onSuccess: () => {
      toast.success("Zone Type Created");
      refetchZoneTypes();
      setNewZoneTypeOpen(false);
      setNewZoneType({ code: "", name: "", description: "" });
    },
    onError: (error) => toast.error("Failed to create zone type", { description: error.message })
  });
  
  const updateZoneTypeMutation = trpc.masterData.updateZoneType.useMutation({
    onSuccess: () => {
      toast.success("Zone Type Updated");
      refetchZoneTypes();
      setEditZoneTypeOpen(false);
      setEditingZoneType(null);
    },
    onError: (error) => toast.error("Failed to update zone type", { description: error.message })
  });
  
  const deleteZoneTypeMutation = trpc.masterData.deleteZoneType.useMutation({
    onSuccess: () => {
      toast.success("Zone Type Deleted");
      refetchZoneTypes();
    },
    onError: (error) => toast.error("Failed to delete zone type", { description: error.message })
  });

  // Area Types
  const { data: areaTypesData, isLoading: areaTypesLoading, refetch: refetchAreaTypes } = trpc.masterData.getAllAreaTypes.useQuery();
  const [newAreaTypeOpen, setNewAreaTypeOpen] = useState(false);
  const [editAreaTypeOpen, setEditAreaTypeOpen] = useState(false);
  const [editingAreaType, setEditingAreaType] = useState<any>(null);
  const [newAreaType, setNewAreaType] = useState({ code: "", name: "", description: "" });
  
  const createAreaTypeMutation = trpc.masterData.createAreaType.useMutation({
    onSuccess: () => {
      toast.success("Area Type Created");
      refetchAreaTypes();
      setNewAreaTypeOpen(false);
      setNewAreaType({ code: "", name: "", description: "" });
    },
    onError: (error) => toast.error("Failed to create area type", { description: error.message })
  });
  
  const updateAreaTypeMutation = trpc.masterData.updateAreaType.useMutation({
    onSuccess: () => {
      toast.success("Area Type Updated");
      refetchAreaTypes();
      setEditAreaTypeOpen(false);
      setEditingAreaType(null);
    },
    onError: (error) => toast.error("Failed to update area type", { description: error.message })
  });
  
  const deleteAreaTypeMutation = trpc.masterData.deleteAreaType.useMutation({
    onSuccess: () => {
      toast.success("Area Type Deleted");
      refetchAreaTypes();
    },
    onError: (error) => toast.error("Failed to delete area type", { description: error.message })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-purple-600" />
            System Settings
          </h1>
          <p className="text-muted-foreground">Configure global preferences and master data.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-[1050px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="masterdata">Master Data</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="forms">Form Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Manage global application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Input defaultValue="CENTRE3 Security Ops" />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input defaultValue="support@centre3.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input defaultValue="Asia/Riyadh (GMT+3)" disabled />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t px-6 py-4">
              <Button className="ml-auto bg-purple-600 hover:bg-purple-700">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-purple-600" />
                Translation Management
              </CardTitle>
              <CardDescription>Manage multi-language support and translations for the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Supported Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="px-3 py-1">
                        <span className="mr-2">🇬🇧</span> English (EN)
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1">
                        <span className="mr-2">🇸🇦</span> Arabic (AR)
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Translation Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>English</span>
                        <span className="text-green-600 font-medium">100% Complete</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Arabic</span>
                        <span className="text-amber-600 font-medium">~85% Complete</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Use the Translation Management tool to view, edit, and add translations for all UI strings in the application.
                </p>
                <Link href="/settings/translations">
                  <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <Languages className="h-4 w-4" />
                    Open Translation Manager
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Department Management
                </CardTitle>
                <CardDescription>Define organizational units for user assignment.</CardDescription>
              </div>
              <Dialog open={newDeptOpen} onOpenChange={setNewDeptOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Plus className="h-4 w-4" /> Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddDepartment}>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>Create a new department for the organization.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deptName">Department Name</Label>
                        <Input 
                          id="deptName" 
                          placeholder="e.g. Cyber Security" 
                          value={newDept.name}
                          onChange={e => setNewDept({...newDept, name: e.target.value})}
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deptCode">Cost Center</Label>
                          <Input 
                            id="deptCode" 
                            placeholder="e.g. CC-1001" 
                            value={newDept.costCenter}
                            onChange={e => setNewDept({...newDept, costCenter: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deptDesc">Description</Label>
                          <Input 
                            id="deptDesc" 
                            placeholder="Brief description" 
                            value={newDept.description}
                            onChange={e => setNewDept({...newDept, description: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setNewDeptOpen(false)}>Cancel</Button>
                      <Button 
                        type="submit" 
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={createDeptMutation.isPending}
                      >
                        {createDeptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Department
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-muted-foreground">Loading departments...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Cost Center</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-mono text-xs">#{dept.id}</TableCell>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.costCenter || "—"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditDepartment(dept)}
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteDept(dept.id)}
                              disabled={deleteDeptMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No departments found. Click "Add Department" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Department Dialog */}
          <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}>
            <DialogContent>
              <form onSubmit={handleUpdateDepartment}>
                <DialogHeader>
                  <DialogTitle>Edit Department</DialogTitle>
                  <DialogDescription>Update department information.</DialogDescription>
                </DialogHeader>
                {editingDept && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editDeptName">Department Name</Label>
                      <Input 
                        id="editDeptName" 
                        value={editingDept.name}
                        onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editDeptCode">Cost Center</Label>
                        <Input 
                          id="editDeptCode" 
                          value={editingDept.costCenter}
                          onChange={e => setEditingDept({...editingDept, costCenter: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDeptDesc">Description</Label>
                        <Input 
                          id="editDeptDesc" 
                          value={editingDept.description}
                          onChange={e => setEditingDept({...editingDept, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDeptOpen(false)}>Cancel</Button>
                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={updateDeptMutation.isPending}
                  >
                    {updateDeptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ============================================================================ */}
        {/* MASTER DATA TAB */}
        {/* ============================================================================ */}
        <TabsContent value="masterdata" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Master Data Management
              </CardTitle>
              <CardDescription>Manage countries, regions, cities, and classification types.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={masterDataTab} onValueChange={setMasterDataTab}>
                <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-6">
                  <TabsTrigger value="activities" className="gap-1">
                    <Activity className="h-4 w-4" /> Activities
                  </TabsTrigger>
                  <TabsTrigger value="roletypes" className="gap-1">
                    <UserCog className="h-4 w-4" /> Role Types
                  </TabsTrigger>
                  <TabsTrigger value="approvers" className="gap-1">
                    <Users2 className="h-4 w-4" /> Approvers
                  </TabsTrigger>
                  <TabsTrigger value="countries" className="gap-1">
                    <Globe className="h-4 w-4" /> Countries
                  </TabsTrigger>
                  <TabsTrigger value="regions" className="gap-1">
                    <MapPin className="h-4 w-4" /> Regions
                  </TabsTrigger>
                  <TabsTrigger value="cities" className="gap-1">
                    <Building className="h-4 w-4" /> Cities
                  </TabsTrigger>
                  <TabsTrigger value="sitetypes" className="gap-1">
                    <Building2 className="h-4 w-4" /> Site Types
                  </TabsTrigger>
                  <TabsTrigger value="zonetypes" className="gap-1">
                    <Layers className="h-4 w-4" /> Zone Types
                  </TabsTrigger>
                  <TabsTrigger value="areatypes" className="gap-1">
                    <Grid3X3 className="h-4 w-4" /> Area Types
                  </TabsTrigger>

                </TabsList>

                {/* ============================================================================ */}
                {/* ACTIVITIES TAB */}
                {/* ============================================================================ */}
                <TabsContent value="activities">
                  <Tabs value={activitiesSubTab} onValueChange={setActivitiesSubTab} className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <TabsList>
                        <TabsTrigger value="main">Main Activities</TabsTrigger>
                        <TabsTrigger value="sub">Sub-Activities</TabsTrigger>
                      </TabsList>
                      {activitiesSubTab === "main" ? (
                        <Dialog open={newMainActivityOpen} onOpenChange={setNewMainActivityOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                              <Plus className="h-4 w-4" /> Add Main Activity
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={(e) => { e.preventDefault(); createMainActivityMutation.mutate(newMainActivity); }}>
                              <DialogHeader>
                                <DialogTitle>Add New Main Activity</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Activity Name (English)</Label>
                                  <Input 
                                    placeholder="e.g. Cabling Changes" 
                                    value={newMainActivity.name}
                                    onChange={e => setNewMainActivity({...newMainActivity, name: e.target.value})}
                                    required 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Activity Name (Arabic)</Label>
                                  <Input 
                                    placeholder="e.g. تغييرات الكابلات" 
                                    value={newMainActivity.nameAr}
                                    onChange={e => setNewMainActivity({...newMainActivity, nameAr: e.target.value})}
                                    dir="rtl"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Input 
                                    placeholder="Brief description of the activity" 
                                    value={newMainActivity.description}
                                    onChange={e => setNewMainActivity({...newMainActivity, description: e.target.value})}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setNewMainActivityOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createMainActivityMutation.isPending}>
                                  {createMainActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Create
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog open={newSubActivityOpen} onOpenChange={setNewSubActivityOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                              <Plus className="h-4 w-4" /> Add Sub-Activity
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={(e) => { e.preventDefault(); createSubActivityMutation.mutate(newSubActivity); }}>
                              <DialogHeader>
                                <DialogTitle>Add New Sub-Activity</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Main Activity</Label>
                                  <Select value={newSubActivity.mainActivityId.toString()} onValueChange={v => setNewSubActivity({...newSubActivity, mainActivityId: parseInt(v)})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select main activity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mainActivitiesData?.filter(a => a.isActive).map(a => (
                                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Sub-Activity Name (English)</Label>
                                  <Input 
                                    placeholder="e.g. Cable Installation" 
                                    value={newSubActivity.name}
                                    onChange={e => setNewSubActivity({...newSubActivity, name: e.target.value})}
                                    required 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Sub-Activity Name (Arabic)</Label>
                                  <Input 
                                    placeholder="e.g. تركيب الكابلات" 
                                    value={newSubActivity.nameAr}
                                    onChange={e => setNewSubActivity({...newSubActivity, nameAr: e.target.value})}
                                    dir="rtl"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Risk Level</Label>
                                  <Select value={newSubActivity.riskLevel} onValueChange={v => setNewSubActivity({...newSubActivity, riskLevel: v as any})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch checked={newSubActivity.requiresMOP} onCheckedChange={c => setNewSubActivity({...newSubActivity, requiresMOP: c})} />
                                    <Label>Requires MOP</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch checked={newSubActivity.requiresPermit} onCheckedChange={c => setNewSubActivity({...newSubActivity, requiresPermit: c})} />
                                    <Label>Requires Permit</Label>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setNewSubActivityOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createSubActivityMutation.isPending}>
                                  {createSubActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Create
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Main Activities Sub-Tab */}
                    <TabsContent value="main">
                      {mainActivitiesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Main Activity Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Sub-Activities</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mainActivitiesData?.map(activity => {
                              const subCount = subActivitiesData?.filter(s => s.mainActivityId === activity.id && s.isActive).length || 0;
                              return (
                                <TableRow key={activity.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-purple-600" />
                                      {activity.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground max-w-md truncate">{activity.description || "-"}</TableCell>
                                  <TableCell>{subCount}</TableCell>
                                  <TableCell>
                                    <Badge variant={activity.isActive ? "default" : "secondary"} className={activity.isActive ? "bg-green-100 text-green-800" : ""}>
                                      {activity.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingMainActivity({...activity}); setEditMainActivityOpen(true); }}>
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this main activity?")) deleteMainActivityMutation.mutate({ id: activity.id }); }}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {(!mainActivitiesData || mainActivitiesData.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No main activities found. Add one to get started.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    {/* Sub-Activities Sub-Tab */}
                    <TabsContent value="sub">
                      {subActivitiesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Sub-Activity Name</TableHead>
                                <TableHead>Main Activity</TableHead>
                                <TableHead className="text-center">RFC</TableHead>
                                <TableHead className="text-center">HRS</TableHead>
                                <TableHead className="text-center">MOP</TableHead>
                                <TableHead className="text-center">MHV</TableHead>
                                <TableHead className="text-center">Room</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subActivitiesData?.map(sub => (
                                <TableRow key={sub.id}>
                                  <TableCell className="font-medium">
                                    <div>
                                      <div>{sub.name}</div>
                                      {sub.nameAr && <div className="text-xs text-muted-foreground" dir="rtl">{sub.nameAr}</div>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{sub.mainActivityName || "-"}</TableCell>
                                  <TableCell className="text-center">
                                    {sub.needsRFC ? (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">✓</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.needsHRS ? (
                                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">✓</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.needsMOP ? (
                                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">✓</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.needsMHV ? (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✓</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.needsRoomSelection ? (
                                      <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">✓</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={sub.isActive ? "default" : "secondary"} className={sub.isActive ? "bg-green-100 text-green-800" : ""}>
                                      {sub.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingSubActivity({...sub}); setEditSubActivityOpen(true); }}>
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this sub-activity?")) deleteSubActivityMutation.mutate({ id: sub.id }); }}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!subActivitiesData || subActivitiesData.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No sub-activities found. Add one to get started.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* ============================================================================ */}
                {/* ROLE TYPES TAB */}
                {/* ============================================================================ */}
                <TabsContent value="roletypes">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Role Types</h3>
                    <Dialog open={newRoleTypeOpen} onOpenChange={setNewRoleTypeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Role Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createRoleTypeMutation.mutate(newRoleType); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Role Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>Role Type Name (English)</Label>
                              <Input 
                                placeholder="e.g. Contractor" 
                                value={newRoleType.name}
                                onChange={e => setNewRoleType({...newRoleType, name: e.target.value})}
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role Type Name (Arabic)</Label>
                              <Input 
                                placeholder="e.g. مقاول" 
                                value={newRoleType.nameAr}
                                onChange={e => setNewRoleType({...newRoleType, nameAr: e.target.value})}
                                dir="rtl"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={newRoleType.category} onValueChange={v => setNewRoleType({...newRoleType, category: v as any})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="internal">Internal</SelectItem>
                                    <SelectItem value="external">External</SelectItem>
                                    <SelectItem value="contractor">Contractor</SelectItem>
                                    <SelectItem value="visitor">Visitor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Access Level</Label>
                                <Select value={newRoleType.accessLevel} onValueChange={v => setNewRoleType({...newRoleType, accessLevel: v as any})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="elevated">Elevated</SelectItem>
                                    <SelectItem value="full">Full</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input 
                                placeholder="Brief description" 
                                value={newRoleType.description}
                                onChange={e => setNewRoleType({...newRoleType, description: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewRoleTypeOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createRoleTypeMutation.isPending}>
                              {createRoleTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {roleTypesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role Type Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Access Level</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleTypesData?.map(role => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4 text-purple-600" />
                                {role.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{role.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{role.accessLevel}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role.isActive ? "default" : "secondary"} className={role.isActive ? "bg-green-100 text-green-800" : ""}>
                                {role.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingRoleType({...role}); setEditRoleTypeOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this role type?")) deleteRoleTypeMutation.mutate({ id: role.id }); }}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!roleTypesData || roleTypesData.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No role types found. Add one to get started.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* ============================================================================ */}
                {/* APPROVERS TAB */}
                {/* ============================================================================ */}
                <TabsContent value="approvers">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Approvers</h3>
                    <Dialog open={newApproverOpen} onOpenChange={setNewApproverOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Approver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createApproverMutation.mutate({...newApprover, siteId: newApprover.siteId || undefined}); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Approver</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>User</Label>
                              <Select value={newApprover.userId.toString()} onValueChange={v => setNewApprover({...newApprover, userId: parseInt(v)})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {usersForApprovers?.users?.map(u => (
                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.email}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Site (Optional)</Label>
                              <Select value={newApprover.siteId?.toString() || "all"} onValueChange={v => setNewApprover({...newApprover, siteId: v === "all" ? null : parseInt(v)})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="All Sites" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Sites</SelectItem>
                                  {sitesForApprovers?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Approval Level (1-10)</Label>
                              <Input 
                                type="number"
                                min={1}
                                max={10}
                                value={newApprover.approvalLevel}
                                onChange={e => setNewApprover({...newApprover, approvalLevel: parseInt(e.target.value) || 1})}
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch checked={newApprover.canApproveEmergency} onCheckedChange={c => setNewApprover({...newApprover, canApproveEmergency: c})} />
                                <Label>Can Approve Emergency</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch checked={newApprover.canApproveVIP} onCheckedChange={c => setNewApprover({...newApprover, canApproveVIP: c})} />
                                <Label>Can Approve VIP</Label>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewApproverOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createApproverMutation.isPending}>
                              {createApproverMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {approversLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approver</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approversData?.map(approver => (
                          <TableRow key={approver.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Users2 className="h-4 w-4 text-purple-600" />
                                <div>
                                  <div>{approver.userName || "Unknown"}</div>
                                  <div className="text-xs text-muted-foreground">{approver.userEmail}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{approver.siteName || "All Sites"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">Level {approver.approvalLevel}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {approver.canApproveEmergency && <Badge variant="destructive" className="text-xs">Emergency</Badge>}
                                {approver.canApproveVIP && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                                {!approver.canApproveEmergency && !approver.canApproveVIP && <span className="text-muted-foreground">Standard</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={approver.isActive ? "default" : "secondary"} className={approver.isActive ? "bg-green-100 text-green-800" : ""}>
                                {approver.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingApprover({...approver}); setEditApproverOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this approver?")) deleteApproverMutation.mutate({ id: approver.id }); }}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!approversData || approversData.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No approvers found. Add one to get started.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Countries Tab */}
                <TabsContent value="countries">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Countries</h3>
                    <Dialog open={newCountryOpen} onOpenChange={setNewCountryOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Country
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createCountryMutation.mutate(newCountry); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Country</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>Country Code (ISO)</Label>
                              <Input 
                                placeholder="e.g. SAU" 
                                maxLength={3}
                                value={newCountry.code}
                                onChange={e => setNewCountry({...newCountry, code: e.target.value.toUpperCase()})}
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Country Name</Label>
                              <Input 
                                placeholder="e.g. Saudi Arabia" 
                                value={newCountry.name}
                                onChange={e => setNewCountry({...newCountry, name: e.target.value})}
                                required 
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewCountryOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createCountryMutation.isPending}>
                              {createCountryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {countriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(countriesData || []).map((country) => (
                          <TableRow key={country.id}>
                            <TableCell className="font-mono">{country.code}</TableCell>
                            <TableCell>{country.name}</TableCell>
                            <TableCell>
                              <Badge variant={country.isActive ? "default" : "secondary"}>
                                {country.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCountry(country); setEditCountryOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this country?")) deleteCountryMutation.mutate({ id: country.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Regions Tab */}
                <TabsContent value="regions">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Regions</h3>
                    <Dialog open={newRegionOpen} onOpenChange={setNewRegionOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Region
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createRegionMutation.mutate(newRegion); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Region</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>Region Code</Label>
                              <Input 
                                placeholder="e.g. CENTRAL" 
                                value={newRegion.code}
                                onChange={e => setNewRegion({...newRegion, code: e.target.value.toUpperCase()})}
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Region Name</Label>
                              <Input 
                                placeholder="e.g. Central Region" 
                                value={newRegion.name}
                                onChange={e => setNewRegion({...newRegion, name: e.target.value})}
                                required 
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewRegionOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createRegionMutation.isPending}>
                              {createRegionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {regionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(regionsData || []).map((region) => (
                          <TableRow key={region.id}>
                            <TableCell className="font-mono">{region.code}</TableCell>
                            <TableCell>{region.name}</TableCell>
                            <TableCell>
                              <Badge variant={region.isActive ? "default" : "secondary"}>
                                {region.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRegion(region); setEditRegionOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this region?")) deleteRegionMutation.mutate({ id: region.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Cities Tab */}
                <TabsContent value="cities">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Cities</h3>
                    <Dialog open={newCityOpen} onOpenChange={setNewCityOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add City
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); if(newCity.countryId) createCityMutation.mutate(newCity); }}>
                          <DialogHeader>
                            <DialogTitle>Add New City</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label>Country</Label>
                              <Select value={newCity.countryId?.toString() || ""} onValueChange={(v) => setNewCity({...newCity, countryId: parseInt(v)})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(countriesData || []).filter(c => c.isActive).map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>City Name</Label>
                              <Input 
                                placeholder="e.g. Riyadh" 
                                value={newCity.name}
                                onChange={e => setNewCity({...newCity, name: e.target.value})}
                                required 
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewCityOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createCityMutation.isPending || !newCity.countryId}>
                              {createCityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {citiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(citiesData || []).map((city) => (
                          <TableRow key={city.id}>
                            <TableCell>{city.name}</TableCell>
                            <TableCell>{city.countryName || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={city.isActive ? "default" : "secondary"}>
                                {city.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCity(city); setEditCityOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this city?")) deleteCityMutation.mutate({ id: city.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Site Types Tab */}
                <TabsContent value="sitetypes">
                  <HierarchicalTypeManager
                    title="Site Types"
                    data={(siteTypesData || []).map(t => ({ ...t, parentId: t.parentId ?? null, level: t.level ?? 0, sortOrder: t.sortOrder ?? 0, nameAr: t.nameAr ?? null }))}
                    isLoading={siteTypesLoading}
                    onCreate={(data) => createSiteTypeMutation.mutate(data)}
                    onUpdate={(data) => updateSiteTypeMutation.mutate(data)}
                    onDelete={(id) => deleteSiteTypeMutation.mutate({ id })}
                    isCreating={createSiteTypeMutation.isPending}
                    isUpdating={updateSiteTypeMutation.isPending}
                    isDeleting={deleteSiteTypeMutation.isPending}
                  />
                </TabsContent>

                {/* Zone Types Tab */}
                <TabsContent value="zonetypes">
                  <HierarchicalTypeManager
                    title="Zone Types"
                    data={(zoneTypesData || []).map(t => ({ ...t, parentId: t.parentId ?? null, level: t.level ?? 0, sortOrder: t.sortOrder ?? 0, nameAr: t.nameAr ?? null }))}
                    isLoading={zoneTypesLoading}
                    onCreate={(data) => createZoneTypeMutation.mutate(data)}
                    onUpdate={(data) => updateZoneTypeMutation.mutate(data)}
                    onDelete={(id) => deleteZoneTypeMutation.mutate({ id })}
                    isCreating={createZoneTypeMutation.isPending}
                    isUpdating={updateZoneTypeMutation.isPending}
                    isDeleting={deleteZoneTypeMutation.isPending}
                  />
                </TabsContent>

                {/* Area Types Tab */}
                <TabsContent value="areatypes">
                  <HierarchicalTypeManager
                    title="Area Types"
                    data={(areaTypesData || []).map(t => ({ ...t, parentId: t.parentId ?? null, level: t.level ?? 0, sortOrder: t.sortOrder ?? 0, nameAr: t.nameAr ?? null }))}
                    isLoading={areaTypesLoading}
                    onCreate={(data) => createAreaTypeMutation.mutate(data)}
                    onUpdate={(data) => updateAreaTypeMutation.mutate(data)}
                    onDelete={(id) => deleteAreaTypeMutation.mutate({ id })}
                    isCreating={createAreaTypeMutation.isPending}
                    isUpdating={updateAreaTypeMutation.isPending}
                    isDeleting={deleteAreaTypeMutation.isPending}
                  />
                </TabsContent>

                {/* Companies Tab */}
                <TabsContent value="companies">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-medium">Companies</h3>
                        <div className="flex gap-1">
                          <Button size="sm" variant={companiesFilter === "all" ? "default" : "outline"} onClick={() => setCompaniesFilter("all")}>All</Button>
                          <Button size="sm" variant={companiesFilter === "contractor" ? "default" : "outline"} onClick={() => setCompaniesFilter("contractor")}>Contractors</Button>
                          <Button size="sm" variant={companiesFilter === "subcontractor" ? "default" : "outline"} onClick={() => setCompaniesFilter("subcontractor")}>Sub-Contractors</Button>
                          <Button size="sm" variant={companiesFilter === "client" ? "default" : "outline"} onClick={() => setCompaniesFilter("client")}>Clients</Button>
                        </div>
                      </div>
                      <Button onClick={() => setNewCompanyOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Company
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Manage contractor, sub-contractor, and client companies with their contract details.</p>
                    
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Contract Reference</TableHead>
                            <TableHead>Contract Period</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCompanies.map((company) => (
                            <TableRow key={company.id}>
                              <TableCell className="font-mono text-sm">{company.code}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{company.name}</div>
                                  {company.nameAr && <div className="text-sm text-muted-foreground" dir="rtl">{company.nameAr}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={company.type === "contractor" ? "default" : company.type === "subcontractor" ? "secondary" : "outline"}>
                                  {company.type === "contractor" ? "Contractor" : company.type === "subcontractor" ? "Sub-Contractor" : "Client"}
                                </Badge>
                              </TableCell>
                              <TableCell>{company.contractReference || "-"}</TableCell>
                              <TableCell>
                                {company.contractStartDate && company.contractEndDate ? (
                                  <span className="text-sm">
                                    {new Date(company.contractStartDate).toLocaleDateString()} - {new Date(company.contractEndDate).toLocaleDateString()}
                                  </span>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                {company.contactPersonName ? (
                                  <div className="text-sm">
                                    <div>{company.contactPersonName}</div>
                                    {company.contactPersonEmail && <div className="text-muted-foreground">{company.contactPersonEmail}</div>}
                                  </div>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={company.status === "active" ? "default" : "secondary"}>
                                  {company.status === "active" ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingCompany(company); setEditCompanyOpen(true); }}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { if(confirm("Deactivate this company?")) deleteCompanyMutation.mutate({ id: company.id }); }}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredCompanies.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No companies found. Add one to get started.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Add Company Dialog */}
          <Dialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); createCompanyMutation.mutate(newCompany); }}>
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Code *</Label>
                      <Input value={newCompany.code} onChange={e => setNewCompany({...newCompany, code: e.target.value})} placeholder="e.g., CONT-001" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Type *</Label>
                      <Select value={newCompany.type} onValueChange={(v: "contractor" | "subcontractor" | "client") => setNewCompany({...newCompany, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name (English) *</Label>
                      <Input value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name (Arabic)</Label>
                      <Input value={newCompany.nameAr} onChange={e => setNewCompany({...newCompany, nameAr: e.target.value})} dir="rtl" />
                    </div>
                  </div>
                  {newCompany.type === "subcontractor" && (
                    <div className="space-y-2">
                      <Label>Parent Company (Main Contractor)</Label>
                      <Select value={newCompany.parentCompanyId?.toString() || ""} onValueChange={(v) => setNewCompany({...newCompany, parentCompanyId: v ? parseInt(v) : undefined})}>
                        <SelectTrigger><SelectValue placeholder="Select parent company" /></SelectTrigger>
                        <SelectContent>
                          {companiesData?.filter(c => c.type === "contractor").map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Contract Information</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Contract Reference</Label>
                        <Input value={newCompany.contractReference} onChange={e => setNewCompany({...newCompany, contractReference: e.target.value})} placeholder="e.g., CNT-2024-001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={newCompany.contractStartDate} onChange={e => setNewCompany({...newCompany, contractStartDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={newCompany.contractEndDate} onChange={e => setNewCompany({...newCompany, contractEndDate: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Contact Person</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={newCompany.contactPersonName} onChange={e => setNewCompany({...newCompany, contactPersonName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input value={newCompany.contactPersonPosition} onChange={e => setNewCompany({...newCompany, contactPersonPosition: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newCompany.contactPersonEmail} onChange={e => setNewCompany({...newCompany, contactPersonEmail: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={newCompany.contactPersonPhone} onChange={e => setNewCompany({...newCompany, contactPersonPhone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Additional Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Registration Number</Label>
                        <Input value={newCompany.registrationNumber} onChange={e => setNewCompany({...newCompany, registrationNumber: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={newCompany.status} onValueChange={(v: "active" | "inactive" | "suspended") => setNewCompany({...newCompany, status: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Address</Label>
                      <Input value={newCompany.address} onChange={e => setNewCompany({...newCompany, address: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={newCompany.city} onChange={e => setNewCompany({...newCompany, city: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={newCompany.country} onChange={e => setNewCompany({...newCompany, country: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Notes</Label>
                      <Input value={newCompany.notes} onChange={e => setNewCompany({...newCompany, notes: e.target.value})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setNewCompanyOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    {createCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Company
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Company Dialog */}
          <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); if(editingCompany) updateCompanyMutation.mutate(editingCompany); }}>
                <DialogHeader>
                  <DialogTitle>Edit Company</DialogTitle>
                </DialogHeader>
                {editingCompany && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Code *</Label>
                        <Input value={editingCompany.code} onChange={e => setEditingCompany({...editingCompany, code: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Type *</Label>
                        <Select value={editingCompany.type} onValueChange={(v) => setEditingCompany({...editingCompany, type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name (English) *</Label>
                        <Input value={editingCompany.name} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Name (Arabic)</Label>
                        <Input value={editingCompany.nameAr || ""} onChange={e => setEditingCompany({...editingCompany, nameAr: e.target.value})} dir="rtl" />
                      </div>
                    </div>
                    {editingCompany.type === "subcontractor" && (
                      <div className="space-y-2">
                        <Label>Parent Company (Main Contractor)</Label>
                        <Select value={editingCompany.parentCompanyId?.toString() || ""} onValueChange={(v) => setEditingCompany({...editingCompany, parentCompanyId: v ? parseInt(v) : null})}>
                          <SelectTrigger><SelectValue placeholder="Select parent company" /></SelectTrigger>
                          <SelectContent>
                            {companiesData?.filter(c => c.type === "contractor" && c.id !== editingCompany.id).map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Contract Information</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Contract Reference</Label>
                          <Input value={editingCompany.contractReference || ""} onChange={e => setEditingCompany({...editingCompany, contractReference: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" value={editingCompany.contractStartDate ? new Date(editingCompany.contractStartDate).toISOString().split('T')[0] : ""} onChange={e => setEditingCompany({...editingCompany, contractStartDate: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="date" value={editingCompany.contractEndDate ? new Date(editingCompany.contractEndDate).toISOString().split('T')[0] : ""} onChange={e => setEditingCompany({...editingCompany, contractEndDate: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Contact Person</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editingCompany.contactPersonName || ""} onChange={e => setEditingCompany({...editingCompany, contactPersonName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input value={editingCompany.contactPersonPosition || ""} onChange={e => setEditingCompany({...editingCompany, contactPersonPosition: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={editingCompany.contactPersonEmail || ""} onChange={e => setEditingCompany({...editingCompany, contactPersonEmail: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={editingCompany.contactPersonPhone || ""} onChange={e => setEditingCompany({...editingCompany, contactPersonPhone: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Additional Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Registration Number</Label>
                          <Input value={editingCompany.registrationNumber || ""} onChange={e => setEditingCompany({...editingCompany, registrationNumber: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={editingCompany.status} onValueChange={(v) => setEditingCompany({...editingCompany, status: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Address</Label>
                        <Input value={editingCompany.address || ""} onChange={e => setEditingCompany({...editingCompany, address: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input value={editingCompany.city || ""} onChange={e => setEditingCompany({...editingCompany, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input value={editingCompany.country || ""} onChange={e => setEditingCompany({...editingCompany, country: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Notes</Label>
                        <Input value={editingCompany.notes || ""} onChange={e => setEditingCompany({...editingCompany, notes: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditCompanyOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateCompanyMutation.isPending}>
                    {updateCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update Company
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialogs for Master Data */}
          
          {/* Edit Main Activity Dialog */}
          <Dialog open={editMainActivityOpen} onOpenChange={setEditMainActivityOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingMainActivity) updateMainActivityMutation.mutate(editingMainActivity); }}>
                <DialogHeader>
                  <DialogTitle>Edit Main Activity</DialogTitle>
                </DialogHeader>
                {editingMainActivity && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Activity Name (English)</Label>
                      <Input value={editingMainActivity.name} onChange={e => setEditingMainActivity({...editingMainActivity, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Activity Name (Arabic)</Label>
                      <Input value={editingMainActivity.nameAr || ""} onChange={e => setEditingMainActivity({...editingMainActivity, nameAr: e.target.value})} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editingMainActivity.description || ""} onChange={e => setEditingMainActivity({...editingMainActivity, description: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingMainActivity.isActive} onCheckedChange={c => setEditingMainActivity({...editingMainActivity, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditMainActivityOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateMainActivityMutation.isPending}>
                    {updateMainActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Sub-Activity Dialog */}
          <Dialog open={editSubActivityOpen} onOpenChange={setEditSubActivityOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingSubActivity) updateSubActivityMutation.mutate(editingSubActivity); }}>
                <DialogHeader>
                  <DialogTitle>Edit Sub-Activity</DialogTitle>
                </DialogHeader>
                {editingSubActivity && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Main Activity</Label>
                      <Select value={editingSubActivity.mainActivityId?.toString()} onValueChange={v => setEditingSubActivity({...editingSubActivity, mainActivityId: parseInt(v)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mainActivitiesData?.filter(a => a.isActive).map(a => (
                            <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-Activity Name (English)</Label>
                      <Input value={editingSubActivity.name} onChange={e => setEditingSubActivity({...editingSubActivity, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-Activity Name (Arabic)</Label>
                      <Input value={editingSubActivity.nameAr || ""} onChange={e => setEditingSubActivity({...editingSubActivity, nameAr: e.target.value})} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk Level</Label>
                      <Select value={editingSubActivity.riskLevel || "low"} onValueChange={v => setEditingSubActivity({...editingSubActivity, riskLevel: v as any})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Requirements</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch checked={editingSubActivity.needsRFC} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, needsRFC: c})} />
                          <Label className="text-sm">Needs RFC</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={editingSubActivity.needsHRS} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, needsHRS: c})} />
                          <Label className="text-sm">Needs HRS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={editingSubActivity.needsMOP} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, needsMOP: c})} />
                          <Label className="text-sm">Needs MOP</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={editingSubActivity.needsMHV} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, needsMHV: c})} />
                          <Label className="text-sm">Needs MHV</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={editingSubActivity.needsRoomSelection} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, needsRoomSelection: c})} />
                          <Label className="text-sm">Needs Room Selection</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingSubActivity.isActive} onCheckedChange={c => setEditingSubActivity({...editingSubActivity, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditSubActivityOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateSubActivityMutation.isPending}>
                    {updateSubActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Role Type Dialog */}
          <Dialog open={editRoleTypeOpen} onOpenChange={setEditRoleTypeOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingRoleType) updateRoleTypeMutation.mutate(editingRoleType); }}>
                <DialogHeader>
                  <DialogTitle>Edit Role Type</DialogTitle>
                </DialogHeader>
                {editingRoleType && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Role Type Name (English)</Label>
                      <Input value={editingRoleType.name} onChange={e => setEditingRoleType({...editingRoleType, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role Type Name (Arabic)</Label>
                      <Input value={editingRoleType.nameAr || ""} onChange={e => setEditingRoleType({...editingRoleType, nameAr: e.target.value})} dir="rtl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={editingRoleType.category || "internal"} onValueChange={v => setEditingRoleType({...editingRoleType, category: v as any})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="visitor">Visitor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Access Level</Label>
                        <Select value={editingRoleType.accessLevel || "standard"} onValueChange={v => setEditingRoleType({...editingRoleType, accessLevel: v as any})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="elevated">Elevated</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editingRoleType.description || ""} onChange={e => setEditingRoleType({...editingRoleType, description: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingRoleType.isActive} onCheckedChange={c => setEditingRoleType({...editingRoleType, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditRoleTypeOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateRoleTypeMutation.isPending}>
                    {updateRoleTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Approver Dialog */}
          <Dialog open={editApproverOpen} onOpenChange={setEditApproverOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingApprover) updateApproverMutation.mutate({...editingApprover, siteId: editingApprover.siteId || undefined}); }}>
                <DialogHeader>
                  <DialogTitle>Edit Approver</DialogTitle>
                </DialogHeader>
                {editingApprover && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select value={editingApprover.userId?.toString()} onValueChange={v => setEditingApprover({...editingApprover, userId: parseInt(v)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {usersForApprovers?.users?.map(u => (
                            <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Site (Optional)</Label>
                      <Select value={editingApprover.siteId?.toString() || "all"} onValueChange={v => setEditingApprover({...editingApprover, siteId: v === "all" ? null : parseInt(v)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sites</SelectItem>
                          {sitesForApprovers?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Approval Level (1-10)</Label>
                      <Input 
                        type="number"
                        min={1}
                        max={10}
                        value={editingApprover.approvalLevel}
                        onChange={e => setEditingApprover({...editingApprover, approvalLevel: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={editingApprover.canApproveEmergency} onCheckedChange={c => setEditingApprover({...editingApprover, canApproveEmergency: c})} />
                        <Label>Can Approve Emergency</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={editingApprover.canApproveVIP} onCheckedChange={c => setEditingApprover({...editingApprover, canApproveVIP: c})} />
                        <Label>Can Approve VIP</Label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingApprover.isActive} onCheckedChange={c => setEditingApprover({...editingApprover, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditApproverOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateApproverMutation.isPending}>
                    {updateApproverMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Country Dialog */}
          <Dialog open={editCountryOpen} onOpenChange={setEditCountryOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingCountry) updateCountryMutation.mutate(editingCountry); }}>
                <DialogHeader>
                  <DialogTitle>Edit Country</DialogTitle>
                </DialogHeader>
                {editingCountry && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Country Code</Label>
                      <Input value={editingCountry.code} onChange={e => setEditingCountry({...editingCountry, code: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country Name</Label>
                      <Input value={editingCountry.name} onChange={e => setEditingCountry({...editingCountry, name: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingCountry.isActive} onCheckedChange={c => setEditingCountry({...editingCountry, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditCountryOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateCountryMutation.isPending}>
                    {updateCountryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Region Dialog */}
          <Dialog open={editRegionOpen} onOpenChange={setEditRegionOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingRegion) updateRegionMutation.mutate(editingRegion); }}>
                <DialogHeader>
                  <DialogTitle>Edit Region</DialogTitle>
                </DialogHeader>
                {editingRegion && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Region Code</Label>
                      <Input value={editingRegion.code} onChange={e => setEditingRegion({...editingRegion, code: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Region Name</Label>
                      <Input value={editingRegion.name} onChange={e => setEditingRegion({...editingRegion, name: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingRegion.isActive} onCheckedChange={c => setEditingRegion({...editingRegion, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditRegionOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateRegionMutation.isPending}>
                    {updateRegionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit City Dialog */}
          <Dialog open={editCityOpen} onOpenChange={setEditCityOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingCity) updateCityMutation.mutate({ id: editingCity.id, name: editingCity.name, countryId: editingCity.countryId, isActive: editingCity.isActive }); }}>
                <DialogHeader>
                  <DialogTitle>Edit City</DialogTitle>
                </DialogHeader>
                {editingCity && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={editingCity.countryId?.toString() || ""} onValueChange={(v) => setEditingCity({...editingCity, countryId: parseInt(v)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(countriesData || []).filter(c => c.isActive).map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City Name</Label>
                      <Input value={editingCity.name} onChange={e => setEditingCity({...editingCity, name: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingCity.isActive} onCheckedChange={c => setEditingCity({...editingCity, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditCityOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateCityMutation.isPending}>
                    {updateCityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Site Type Dialog */}
          <Dialog open={editSiteTypeOpen} onOpenChange={setEditSiteTypeOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingSiteType) updateSiteTypeMutation.mutate(editingSiteType); }}>
                <DialogHeader>
                  <DialogTitle>Edit Site Type</DialogTitle>
                </DialogHeader>
                {editingSiteType && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input value={editingSiteType.code} onChange={e => setEditingSiteType({...editingSiteType, code: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editingSiteType.name} onChange={e => setEditingSiteType({...editingSiteType, name: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editingSiteType.description || ""} onChange={e => setEditingSiteType({...editingSiteType, description: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingSiteType.isActive} onCheckedChange={c => setEditingSiteType({...editingSiteType, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditSiteTypeOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateSiteTypeMutation.isPending}>
                    {updateSiteTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Zone Type Dialog */}
          <Dialog open={editZoneTypeOpen} onOpenChange={setEditZoneTypeOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingZoneType) updateZoneTypeMutation.mutate(editingZoneType); }}>
                <DialogHeader>
                  <DialogTitle>Edit Zone Type</DialogTitle>
                </DialogHeader>
                {editingZoneType && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input value={editingZoneType.code} onChange={e => setEditingZoneType({...editingZoneType, code: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editingZoneType.name} onChange={e => setEditingZoneType({...editingZoneType, name: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editingZoneType.description || ""} onChange={e => setEditingZoneType({...editingZoneType, description: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingZoneType.isActive} onCheckedChange={c => setEditingZoneType({...editingZoneType, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditZoneTypeOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateZoneTypeMutation.isPending}>
                    {updateZoneTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Area Type Dialog */}
          <Dialog open={editAreaTypeOpen} onOpenChange={setEditAreaTypeOpen}>
            <DialogContent>
              <form onSubmit={(e) => { e.preventDefault(); if(editingAreaType) updateAreaTypeMutation.mutate(editingAreaType); }}>
                <DialogHeader>
                  <DialogTitle>Edit Area Type</DialogTitle>
                </DialogHeader>
                {editingAreaType && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input value={editingAreaType.code} onChange={e => setEditingAreaType({...editingAreaType, code: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editingAreaType.name} onChange={e => setEditingAreaType({...editingAreaType, name: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editingAreaType.description || ""} onChange={e => setEditingAreaType({...editingAreaType, description: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={editingAreaType.isActive} onCheckedChange={c => setEditingAreaType({...editingAreaType, isActive: c})} />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditAreaTypeOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={updateAreaTypeMutation.isPending}>
                    {updateAreaTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure system-wide alert settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send critical alerts via email to admins.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">Enable SMS for P1/P2 incidents.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">Send a summary report at 08:00 AM.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Security Policies
              </CardTitle>
              <CardDescription>Enforce authentication and access rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Password Expiry (Days)</Label>
                <Input 
                  type="number" 
                  value={securitySettings.passwordExpiry}
                  onChange={e => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Session Timeout (Minutes)</Label>
                <Input 
                  type="number" 
                  value={securitySettings.sessionTimeout}
                  onChange={e => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="mfa" 
                  checked={securitySettings.mfaEnabled}
                  onCheckedChange={checked => setSecuritySettings({...securitySettings, mfaEnabled: checked})}
                />
                <Label htmlFor="mfa">Enforce Multi-Factor Authentication (MFA)</Label>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t px-6 py-4">
              <Button 
                className="ml-auto bg-purple-600 hover:bg-purple-700"
                onClick={handleSaveSecuritySettings}
                disabled={updateSecurityMutation.isPending}
              >
                {updateSecurityMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Update Policies
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="mt-6">
          <FormTemplateBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
