import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  Grid3X3
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
  
  const [masterDataTab, setMasterDataTab] = useState("countries");
  
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
        <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="masterdata">Master Data</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
                <TabsList className="grid w-full grid-cols-6 mb-6">
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Site Types</h3>
                    <Dialog open={newSiteTypeOpen} onOpenChange={setNewSiteTypeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Site Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createSiteTypeMutation.mutate(newSiteType); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Site Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Code</Label>
                                <Input 
                                  placeholder="e.g. DC" 
                                  value={newSiteType.code}
                                  onChange={e => setNewSiteType({...newSiteType, code: e.target.value.toUpperCase()})}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input 
                                  placeholder="e.g. Data Center" 
                                  value={newSiteType.name}
                                  onChange={e => setNewSiteType({...newSiteType, name: e.target.value})}
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input 
                                placeholder="Optional description" 
                                value={newSiteType.description}
                                onChange={e => setNewSiteType({...newSiteType, description: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewSiteTypeOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createSiteTypeMutation.isPending}>
                              {createSiteTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {siteTypesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(siteTypesData || []).map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-mono">{type.code}</TableCell>
                            <TableCell>{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">{type.description || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={type.isActive ? "default" : "secondary"}>
                                {type.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSiteType(type); setEditSiteTypeOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this site type?")) deleteSiteTypeMutation.mutate({ id: type.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Zone Types Tab */}
                <TabsContent value="zonetypes">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Zone Types</h3>
                    <Dialog open={newZoneTypeOpen} onOpenChange={setNewZoneTypeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Zone Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createZoneTypeMutation.mutate(newZoneType); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Zone Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Code</Label>
                                <Input 
                                  placeholder="e.g. SR" 
                                  value={newZoneType.code}
                                  onChange={e => setNewZoneType({...newZoneType, code: e.target.value.toUpperCase()})}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input 
                                  placeholder="e.g. Server Room" 
                                  value={newZoneType.name}
                                  onChange={e => setNewZoneType({...newZoneType, name: e.target.value})}
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input 
                                placeholder="Optional description" 
                                value={newZoneType.description}
                                onChange={e => setNewZoneType({...newZoneType, description: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewZoneTypeOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createZoneTypeMutation.isPending}>
                              {createZoneTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {zoneTypesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(zoneTypesData || []).map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-mono">{type.code}</TableCell>
                            <TableCell>{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">{type.description || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={type.isActive ? "default" : "secondary"}>
                                {type.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingZoneType(type); setEditZoneTypeOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this zone type?")) deleteZoneTypeMutation.mutate({ id: type.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Area Types Tab */}
                <TabsContent value="areatypes">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Area Types</h3>
                    <Dialog open={newAreaTypeOpen} onOpenChange={setNewAreaTypeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                          <Plus className="h-4 w-4" /> Add Area Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={(e) => { e.preventDefault(); createAreaTypeMutation.mutate(newAreaType); }}>
                          <DialogHeader>
                            <DialogTitle>Add New Area Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Code</Label>
                                <Input 
                                  placeholder="e.g. RR" 
                                  value={newAreaType.code}
                                  onChange={e => setNewAreaType({...newAreaType, code: e.target.value.toUpperCase()})}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input 
                                  placeholder="e.g. Rack Row" 
                                  value={newAreaType.name}
                                  onChange={e => setNewAreaType({...newAreaType, name: e.target.value})}
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input 
                                placeholder="Optional description" 
                                value={newAreaType.description}
                                onChange={e => setNewAreaType({...newAreaType, description: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewAreaTypeOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createAreaTypeMutation.isPending}>
                              {createAreaTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Create
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {areaTypesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(areaTypesData || []).map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-mono">{type.code}</TableCell>
                            <TableCell>{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">{type.description || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={type.isActive ? "default" : "secondary"}>
                                {type.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAreaType(type); setEditAreaTypeOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => { if(confirm("Delete this area type?")) deleteAreaTypeMutation.mutate({ id: type.id }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Edit Dialogs for Master Data */}
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
      </Tabs>
    </div>
  );
}
