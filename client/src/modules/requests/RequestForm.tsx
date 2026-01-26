import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Save, 
  Search, 
  User, 
  Plus, 
  Printer, 
  RotateCcw, 
  Paperclip,
  ShieldCheck,
  Trash2,
  CheckSquare,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Users,
  Truck,
  HardHat,
  Settings,
  Clock,
  Info,
  Loader2,
  CheckCircle2,
  Building2,
  XCircle,
  Edit3,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useErrorDialog } from "@/components/ui/error-dialog";

// Request type mapping
const REQUEST_TYPE_MAP: Record<string, string> = {
  "Admin Visit": "admin_visit",
  "TEP": "tep",
  "WP": "work_permit",
  "MOP": "mop",
  "MVP": "material_entry",
  "Escort": "escort",
};

export default function NewRequest() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Form state
  const [requestType, setRequestType] = useState("Admin Visit");
  const [activeTab, setActiveTab] = useState("basic");
  
  // Basic Info
  const [departmentId, setDepartmentId] = useState<string>("");
  const [subType, setSubType] = useState("");
  const [notes, setNotes] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  
  // Location - Site → Zone → Area hierarchy (all optional except site)
  const [siteId, setSiteId] = useState<string>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [rackReference, setRackReference] = useState("");
  
  // Schedule
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [afterHours, setAfterHours] = useState(false);
  const [weekend, setWeekend] = useState(false);
  const [recurring, setRecurring] = useState(false);
  
  // Visitors
  const [visitors, setVisitors] = useState<any[]>([]);
  const [yakeenOpen, setYakeenOpen] = useState(false);
  const [visitorIdType, setVisitorIdType] = useState("national_id");
  const [visitorIdNumber, setVisitorIdNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validatedVisitor, setValidatedVisitor] = useState<any>(null);
  const [yakeenFailed, setYakeenFailed] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  
  // Manual visitor entry fields
  const [manualVisitorName, setManualVisitorName] = useState("");
  const [manualVisitorNationality, setManualVisitorNationality] = useState("");
  const [manualVisitorPhone, setManualVisitorPhone] = useState("");
  const [manualVisitorCompany, setManualVisitorCompany] = useState("");
  const [manualVisitorEmail, setManualVisitorEmail] = useState("");
  
  // Materials
  const [materials, setMaterials] = useState<any[]>([]);
  
  // Purpose
  const [purpose, setPurpose] = useState("");
  
  // Type-specific fields
  const [workOrderRef, setWorkOrderRef] = useState("");
  const [escortRequired, setEscortRequired] = useState("");
  const [workType, setWorkType] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [changeTicket, setChangeTicket] = useState("");
  const [impactLevel, setImpactLevel] = useState("");
  
  // API Queries
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: sitesData } = trpc.sites.getForDropdown.useQuery();
  const { data: zonesData } = trpc.zones.getAll.useQuery(
    { siteId: siteId ? parseInt(siteId) : undefined },
    { enabled: !!siteId }
  );
  const { data: areasData } = trpc.areas.getAll.useQuery(
    { zoneId: selectedZoneId ? parseInt(selectedZoneId) : undefined },
    { enabled: !!selectedZoneId }
  );
  
  // Get selected site details for auto-populated location
  const selectedSite = useMemo(() => {
    if (!siteId || !sitesData) return null;
    return sitesData.find(s => s.id.toString() === siteId);
  }, [siteId, sitesData]);
  
  // Get selected zone details
  const selectedZone = useMemo(() => {
    if (!selectedZoneId || !zonesData) return null;
    return zonesData.find((z: any) => z.id.toString() === selectedZoneId);
  }, [selectedZoneId, zonesData]);
  
  // Get selected area details
  const selectedArea = useMemo(() => {
    if (!selectedAreaId || !areasData) return null;
    return areasData.find((a: any) => a.id.toString() === selectedAreaId);
  }, [selectedAreaId, areasData]);
  
  // Get selected department
  const selectedDepartment = useMemo(() => {
    if (!departmentId || !departments) return null;
    return departments.find((d: any) => d.id.toString() === departmentId);
  }, [departmentId, departments]);
  
  // Check if site has zones
  const siteHasZones = useMemo(() => {
    return zonesData && zonesData.length > 0;
  }, [zonesData]);
  
  // Check if zone has areas
  const zoneHasAreas = useMemo(() => {
    return areasData && areasData.length > 0;
  }, [areasData]);
  
  // Error dialog hook
  const { showError, ErrorDialogComponent } = useErrorDialog();
  
  // Create mutation
  const createRequest = trpc.requests.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.requestNumber} created successfully!`);
      navigate("/requests");
    },
    onError: (error) => {
      showError(
        "There was an error processing your request. Please try again or contact support if the problem persists.",
        "Request Submission Failed"
      );
      console.error("Request creation error:", error);
    },
  });
  
  // Calculate duration
  const duration = useMemo(() => {
    if (!startDate || !endDate) return { days: 0, hours: 0 };
    const start = new Date(`${startDate}T${startTime || "00:00"}`);
    const end = new Date(`${endDate}T${endTime || "23:59"}`);
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days: Math.max(0, days), hours: Math.max(0, hours) };
  }, [startDate, endDate, startTime, endTime]);
  
  // Yakeen validation simulation
  const handleYakeenValidate = async () => {
    if (!visitorIdNumber) {
      toast.error("Please enter ID number first");
      return;
    }
    
    // For passport, allow alphanumeric
    if (visitorIdType !== "passport" && !/^\d+$/.test(visitorIdNumber)) {
      toast.error("ID number must contain only digits");
      return;
    }
    
    setIsValidating(true);
    setYakeenFailed(false);
    
    // Simulate Yakeen API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random failure (30% chance) for demo
    const shouldFail = Math.random() < 0.3 || visitorIdType === "passport";
    
    if (shouldFail) {
      setYakeenFailed(true);
      setIsValidating(false);
      toast.error("Cannot identify through Yakeen - Please enter details manually");
      return;
    }
    
    // Mock response based on ID type
    const mockData = {
      name: visitorIdType === "national_id" 
        ? "Mohammed Abdullah Al-Rashid" 
        : "Ahmed Hassan Khan",
      nationality: visitorIdType === "national_id" ? "Saudi" : "Pakistani",
      dateOfBirth: "1985-03-15",
      gender: "Male",
      phone: "+966 5" + Math.floor(10000000 + Math.random() * 90000000),
      company: "Tech Solutions Ltd",
      email: "visitor" + Math.floor(Math.random() * 1000) + "@company.com",
    };
    
    setValidatedVisitor(mockData);
    setIsValidated(true);
    setIsValidating(false);
    toast.success("Identity verified via Yakeen");
  };
  
  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newVisitor;
    
    if (manualEntry || yakeenFailed) {
      // Manual entry validation
      if (!manualVisitorName.trim()) {
        toast.error("Please enter visitor name");
        return;
      }
      if (!visitorIdNumber.trim()) {
        toast.error("Please enter ID number");
        return;
      }
      
      newVisitor = {
        name: manualVisitorName,
        idType: visitorIdType,
        idNumber: visitorIdNumber,
        phone: manualVisitorPhone,
        company: manualVisitorCompany,
        email: manualVisitorEmail,
        nationality: manualVisitorNationality,
        verified: false,
        manualEntry: true,
      };
    } else {
      // Yakeen validated entry
      if (!isValidated || !validatedVisitor) {
        toast.error("Please validate visitor identity first");
        return;
      }
      
      newVisitor = {
        name: validatedVisitor.name,
        idType: visitorIdType,
        idNumber: visitorIdNumber,
        phone: validatedVisitor.phone,
        company: validatedVisitor.company,
        email: validatedVisitor.email,
        nationality: validatedVisitor.nationality,
        verified: true,
        manualEntry: false,
      };
    }
    
    setVisitors([...visitors, newVisitor]);
    
    // Reset form
    resetYakeenForm();
    setYakeenOpen(false);
    toast.success("Visitor added successfully");
  };
  
  const handleRemoveVisitor = (index: number) => {
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    setMaterials([...materials, { description: "", quantity: 1, serialNumber: "" }]);
  };
  
  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };
  
  const resetYakeenForm = () => {
    setVisitorIdNumber("");
    setIsValidated(false);
    setValidatedVisitor(null);
    setYakeenFailed(false);
    setManualEntry(false);
    setManualVisitorName("");
    setManualVisitorNationality("");
    setManualVisitorPhone("");
    setManualVisitorCompany("");
    setManualVisitorEmail("");
  };
  
  const validateForm = (): string | null => {
    if (!siteId) return "Please select a site";
    if (!startDate) return "Please select a start date";
    if (!endDate) return "Please select an end date";
    if (visitors.length === 0) return "Please add at least one visitor";
    return null;
  };
  
  const handleSubmit = async (asDraft: boolean = false) => {
    const error = validateForm();
    if (error && !asDraft) {
      toast.error(error);
      return;
    }
    
    // Use first visitor as main visitor
    const mainVisitor = visitors[0] || {
      name: user?.name || "Unknown",
      idType: "national_id",
      idNumber: "N/A",
    };
    
    const requestData = {
      type: REQUEST_TYPE_MAP[requestType] as any,
      visitorName: mainVisitor.name,
      visitorIdType: mainVisitor.idType as any,
      visitorIdNumber: mainVisitor.idNumber,
      visitorCompany: mainVisitor.company || undefined,
      visitorPhone: mainVisitor.phone || undefined,
      visitorEmail: mainVisitor.email || undefined,
      siteId: parseInt(siteId),
      zoneIds: selectedZoneId ? [parseInt(selectedZoneId)] : undefined,
      purpose: purpose || notes || `${requestType} request`,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      assets: materials.length > 0 ? materials.map(m => ({
        assetType: "material" as const,
        description: m.description,
        serialNumber: m.serialNumber,
        quantity: parseInt(m.quantity) || 1,
      })) : undefined,
      submitImmediately: !asDraft,
    };
    
    createRequest.mutate(requestData);
  };

  // Helper to render field value or empty indicator
  const renderFieldValue = (value: string | undefined | null, emptyText: string = "Not provided") => {
    if (value && value.trim()) {
      return <span className="font-medium text-gray-900">{value}</span>;
    }
    return <span className="text-gray-400 italic">{emptyText}</span>;
  };

  return (
    <>
    <ErrorDialogComponent />
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#f4f4f4] font-poppins">
      {/* Top Toolbar - IBM Maximo Style */}
      <div className="bg-[#161616] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-wide text-white uppercase">CREATE NEW REQUEST</span>
          <div className="h-5 w-px bg-gray-600" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
              onClick={() => handleSubmit(true)}
              disabled={createRequest.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-none">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="uppercase tracking-wider text-[10px] font-medium text-gray-400">LOGGED IN AS:</span>
          <span className="font-bold text-white flex items-center gap-1 text-xs">
            {user?.name?.toUpperCase() || "USER"} <User className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-4 text-sm shadow-sm">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="text-[#0f62fe] hover:bg-[#0f62fe]/10 gap-2 font-medium h-8">
            <ArrowLeft className="h-4 w-4" />
            Return to List
          </Button>
        </Link>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-bold">*</span>
          <span className="font-medium text-gray-700">Request Type:</span>
          <Select value={requestType} onValueChange={setRequestType}>
            <SelectTrigger className="w-[240px] h-9 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-[#0f62fe] font-semibold text-[#0f62fe]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin Visit">Admin Visit</SelectItem>
              <SelectItem value="TEP">Temporary Entry (TEP)</SelectItem>
              <SelectItem value="WP">Work Permit (WP)</SelectItem>
              <SelectItem value="MOP">Method of Procedure (MOP)</SelectItem>
              <SelectItem value="MVP">Material Permit (MVP)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-6 text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-gray-400">Status</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-sm px-2 py-0.5">NEW</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-gray-400">Request ID</span>
            <span className="font-mono text-black font-medium">REQ-DRAFT</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Navigation Tabs (Vertical) */}
        <div className="w-64 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">SECTIONS</h3>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {[
              { id: "basic", label: "Basic Info", icon: FileText },
              { id: "location", label: "Location", icon: MapPin },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "visitors", label: "Visitors", icon: Users },
              { id: "specific", label: "Type Details", icon: Settings },
              { id: "attachments", label: "Attachments", icon: Paperclip },
              { id: "review", label: "Review & Submit", icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id 
                    ? "bg-[#e5f6ff] text-[#0043ce] border-l-4 border-[#0f62fe]" 
                    : "text-gray-600 hover:bg-gray-100 border-l-4 border-transparent"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-[#0f62fe]" : "text-gray-400"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f4]">
          <div className="max-w-5xl mx-auto bg-white border shadow-sm rounded-sm min-h-[600px]">
            
            {/* Header for current section */}
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {activeTab === "basic" && <><FileText className="h-5 w-5 text-[#0f62fe]" /> Basic Information</>}
                {activeTab === "location" && <><MapPin className="h-5 w-5 text-[#0f62fe]" /> Location Details</>}
                {activeTab === "schedule" && <><Calendar className="h-5 w-5 text-[#0f62fe]" /> Schedule & Timing</>}
                {activeTab === "visitors" && <><Users className="h-5 w-5 text-[#0f62fe]" /> Visitor Management</>}
                {activeTab === "specific" && <><Settings className="h-5 w-5 text-[#0f62fe]" /> {requestType} Specifics</>}
                {activeTab === "attachments" && <><Paperclip className="h-5 w-5 text-[#0f62fe]" /> Documents & Attachments</>}
                {activeTab === "review" && <><ShieldCheck className="h-5 w-5 text-[#0f62fe]" /> Review & Submit</>}
              </h2>
              <span className="text-xs text-gray-500 italic">* Indicates mandatory field</span>
            </div>

            <div className="p-8">
              {/* BASIC INFO TAB */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Requestor Full Name <span className="text-red-600">*</span></Label>
                    <Input defaultValue={user?.name || "User"} className="bg-gray-50" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Requestor Company <span className="text-red-600">*</span></Label>
                    <Input defaultValue="Centre3" className="bg-gray-50" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Email Address <span className="text-red-600">*</span></Label>
                    <Input defaultValue={user?.email || "user@centre3.com"} className="bg-gray-50" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Mobile Number</Label>
                    <Input 
                      placeholder="+966 5XX XXX XXXX" 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Department <span className="text-red-600">*</span></Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Request Sub-Type</Label>
                    <Select value={subType} onValueChange={setSubType}>
                      <SelectTrigger><SelectValue placeholder="Select Sub-Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="vendor">Vendor / Supplier</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="gov">Government / Regulatory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Purpose of Visit <span className="text-red-600">*</span></Label>
                    <Textarea 
                      placeholder="Describe the purpose of this visit..." 
                      className="h-24"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase">Additional Notes</Label>
                    <Textarea 
                      placeholder="Any additional context for this request..." 
                      className="h-24"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* LOCATION TAB - Site → Zone → Area hierarchy (Zone/Area optional based on availability) */}
              {activeTab === "location" && (
                <div className="space-y-8">
                  {/* Site Selection */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#0f62fe]" />
                      Select Site <span className="text-red-600">*</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-600 uppercase">Data Center / Site <span className="text-red-600">*</span></Label>
                        <Select value={siteId} onValueChange={(v) => { setSiteId(v); setSelectedZoneId(""); setSelectedAreaId(""); }}>
                          <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                          <SelectContent>
                            {sitesData?.map((site: any) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name} ({site.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Auto-populated location info */}
                    {selectedSite && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Site Location (Auto-populated)
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600 font-medium">Country:</span>
                            <p className="text-blue-900 font-bold">{selectedSite.countryName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Region:</span>
                            <p className="text-blue-900 font-bold">{selectedSite.regionName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">City:</span>
                            <p className="text-blue-900 font-bold">{selectedSite.cityName || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zone Selection - Only show if site has zones */}
                  {siteId && siteHasZones && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#0f62fe]" />
                          Select Zone
                          <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Leave blank to request access to the entire site, or select a specific zone.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-600 uppercase">Zone</Label>
                            <Select 
                              value={selectedZoneId} 
                              onValueChange={(v) => { setSelectedZoneId(v); setSelectedAreaId(""); }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select Zone (Optional)" /></SelectTrigger>
                              <SelectContent>
                                {zonesData?.map((zone: any) => (
                                  <SelectItem key={zone.id} value={zone.id.toString()}>
                                    {zone.name} ({zone.code}) - {zone.securityLevel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedZone && (
                            <div className="flex items-center">
                              <Badge className={`
                                ${selectedZone.securityLevel === 'critical' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                                ${selectedZone.securityLevel === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                                ${selectedZone.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                                ${selectedZone.securityLevel === 'low' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              `}>
                                Security Level: {selectedZone.securityLevel?.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Area Selection - Only show if zone is selected and has areas */}
                  {selectedZoneId && zoneHasAreas && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#0f62fe]" />
                          Select Area
                          <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Leave blank to request access to the entire zone, or select a specific area.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-600 uppercase">Area</Label>
                            <Select 
                              value={selectedAreaId} 
                              onValueChange={setSelectedAreaId}
                            >
                              <SelectTrigger><SelectValue placeholder="Select Area (Optional)" /></SelectTrigger>
                              <SelectContent>
                                {areasData?.map((area: any) => (
                                  <SelectItem key={area.id} value={area.id.toString()}>
                                    {area.name} ({area.code}) {area.floor ? `- Floor ${area.floor}` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Access Scope Summary */}
                  {siteId && (
                    <>
                      <Separator />
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Access Scope
                        </h4>
                        <p className="text-sm text-green-700">
                          {selectedArea ? (
                            <>Requesting access to <strong>{selectedArea.name}</strong> in <strong>{selectedZone?.name}</strong> at <strong>{selectedSite?.name}</strong></>
                          ) : selectedZone ? (
                            <>Requesting access to entire <strong>{selectedZone.name}</strong> zone at <strong>{selectedSite?.name}</strong></>
                          ) : (
                            <>Requesting access to entire <strong>{selectedSite?.name}</strong> site</>
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  {(requestType === "WP" || requestType === "MOP") && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-600 uppercase">Cabinet / Rack Reference</Label>
                        <Input 
                          placeholder="e.g. RACK-04-B" 
                          value={rackReference}
                          onChange={(e) => setRackReference(e.target.value)}
                          className="max-w-md"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SCHEDULE TAB */}
              {activeTab === "schedule" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase">Start Date <span className="text-red-600">*</span></Label>
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase">Start Time</Label>
                      <Input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase">End Date <span className="text-red-600">*</span></Label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase">End Time</Label>
                      <Input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-blue-800 text-sm">Duration Calculation</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Total Duration: <span className="font-mono font-bold">{duration.days} Days, {duration.hours} Hours</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                      <Checkbox 
                        id="after-hours" 
                        checked={afterHours}
                        onCheckedChange={(checked) => setAfterHours(!!checked)}
                      />
                      <Label htmlFor="after-hours" className="text-sm font-medium">After-Hours Access</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                      <Checkbox 
                        id="weekend" 
                        checked={weekend}
                        onCheckedChange={(checked) => setWeekend(!!checked)}
                      />
                      <Label htmlFor="weekend" className="text-sm font-medium">Weekend Access</Label>
                    </div>
                    {requestType === "TEP" && (
                      <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <Checkbox 
                          id="recurring" 
                          checked={recurring}
                          onCheckedChange={(checked) => setRecurring(!!checked)}
                        />
                        <Label htmlFor="recurring" className="text-sm font-medium">Recurring Visit</Label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VISITORS TAB */}
              {activeTab === "visitors" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Visitor List (Minimum 1 Required)</h3>
                    <Dialog open={yakeenOpen} onOpenChange={(open) => { setYakeenOpen(open); if (!open) resetYakeenForm(); }}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#0f62fe] hover:bg-[#0f62fe]/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Visitor
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[650px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-[#0f62fe]">
                            <ShieldCheck className="h-6 w-6" />
                            {manualEntry || yakeenFailed ? "Manual Visitor Entry" : "Yakeen Identity Verification"}
                          </DialogTitle>
                          <DialogDescription>
                            {manualEntry || yakeenFailed 
                              ? "Enter visitor details manually." 
                              : "Enter visitor ID for real-time government database verification."}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddVisitor}>
                          <div className="grid gap-4 py-4">
                            {/* ID Entry Section */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>ID Type <span className="text-red-600">*</span></Label>
                                  <Select 
                                    value={visitorIdType} 
                                    onValueChange={(v) => { setVisitorIdType(v); resetYakeenForm(); setVisitorIdType(v); }}
                                    disabled={isValidated}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="national_id">National ID</SelectItem>
                                      <SelectItem value="iqama">Iqama</SelectItem>
                                      <SelectItem value="passport">Passport</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>
                                    {visitorIdType === "national_id" ? "National ID Number" : 
                                     visitorIdType === "iqama" ? "Iqama Number" : "Passport Number"} 
                                    <span className="text-red-600">*</span>
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input 
                                      type="text"
                                      inputMode={visitorIdType === "passport" ? "text" : "numeric"}
                                      pattern={visitorIdType === "passport" ? undefined : "[0-9]*"}
                                      placeholder={visitorIdType === "passport" ? "e.g. AB1234567" : "10 digit ID"}
                                      value={visitorIdNumber}
                                      onChange={(e) => {
                                        // For passport allow alphanumeric, for others only numbers
                                        const value = visitorIdType === "passport" 
                                          ? e.target.value.toUpperCase()
                                          : e.target.value.replace(/\D/g, '');
                                        setVisitorIdNumber(value);
                                        setIsValidated(false);
                                        setValidatedVisitor(null);
                                        setYakeenFailed(false);
                                      }}
                                      disabled={isValidated && !manualEntry}
                                      className="font-mono"
                                    />
                                    {!manualEntry && !yakeenFailed && (
                                      <Button 
                                        type="button"
                                        onClick={handleYakeenValidate}
                                        disabled={!visitorIdNumber || isValidating || isValidated}
                                        className={isValidated ? "bg-green-600 hover:bg-green-600" : "bg-[#0f62fe]"}
                                      >
                                        {isValidating ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isValidated ? (
                                          <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                          "Validate"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Yakeen Failed - Show manual entry option */}
                              {yakeenFailed && !manualEntry && (
                                <Alert className="bg-amber-50 border-amber-200">
                                  <XCircle className="h-4 w-4 text-amber-600" />
                                  <AlertTitle className="text-amber-800">Cannot identify through Yakeen</AlertTitle>
                                  <AlertDescription className="text-amber-700">
                                    <p className="mb-2">The ID could not be verified through Yakeen. You can enter the visitor details manually.</p>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setManualEntry(true)}
                                      className="border-amber-400 text-amber-700 hover:bg-amber-100"
                                    >
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      Enter Manually
                                    </Button>
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {/* Passport note */}
                              {visitorIdType === "passport" && !manualEntry && (
                                <Alert className="bg-blue-50 border-blue-200">
                                  <Globe className="h-4 w-4 text-blue-600" />
                                  <AlertTitle className="text-blue-800">Passport Verification</AlertTitle>
                                  <AlertDescription className="text-blue-700">
                                    Passport numbers are alphanumeric. Yakeen verification is not available for passports - manual entry will be required.
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {isValidated && !manualEntry && (
                                <Alert className="bg-green-50 border-green-200">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <AlertTitle className="text-green-800">Identity Verified</AlertTitle>
                                  <AlertDescription className="text-green-700">
                                    Visitor identity has been verified via Yakeen.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                            
                            {/* Validated details from Yakeen */}
                            {isValidated && validatedVisitor && !manualEntry && (
                              <>
                                <Separator />
                                <div className="space-y-4">
                                  <h4 className="font-bold text-gray-700">Verified Details</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <Label className="text-gray-500">Full Name</Label>
                                      <Input value={validatedVisitor.name} readOnly className="bg-gray-50 font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-gray-500">Nationality</Label>
                                      <Input value={validatedVisitor.nationality} readOnly className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-gray-500">Phone</Label>
                                      <Input value={validatedVisitor.phone} readOnly className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-gray-500">Company</Label>
                                      <Input value={validatedVisitor.company} readOnly className="bg-gray-50" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                      <Label className="text-gray-500">Email</Label>
                                      <Input value={validatedVisitor.email} readOnly className="bg-gray-50" />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* Manual Entry Form */}
                            {(manualEntry || (yakeenFailed && manualEntry)) && (
                              <>
                                <Separator />
                                <div className="space-y-4">
                                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Edit3 className="h-4 w-4" />
                                    Manual Entry
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <Label>Full Name <span className="text-red-600">*</span></Label>
                                      <Input 
                                        value={manualVisitorName}
                                        onChange={(e) => setManualVisitorName(e.target.value)}
                                        placeholder="Enter full name"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Nationality</Label>
                                      <Input 
                                        value={manualVisitorNationality}
                                        onChange={(e) => setManualVisitorNationality(e.target.value)}
                                        placeholder="Enter nationality"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Phone</Label>
                                      <Input 
                                        value={manualVisitorPhone}
                                        onChange={(e) => setManualVisitorPhone(e.target.value)}
                                        placeholder="+966 5XX XXX XXXX"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Company</Label>
                                      <Input 
                                        value={manualVisitorCompany}
                                        onChange={(e) => setManualVisitorCompany(e.target.value)}
                                        placeholder="Enter company name"
                                      />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                      <Label>Email</Label>
                                      <Input 
                                        type="email"
                                        value={manualVisitorEmail}
                                        onChange={(e) => setManualVisitorEmail(e.target.value)}
                                        placeholder="visitor@company.com"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setYakeenOpen(false); resetYakeenForm(); }}>
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-[#0f62fe]" 
                              disabled={!isValidated && !manualEntry && !yakeenFailed}
                            >
                              Add Visitor
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {visitors.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="font-bold text-gray-600 mb-2">No Visitors Added</h4>
                      <p className="text-sm text-gray-500">Click "Add Visitor" to verify and add visitors to this request.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left font-bold text-gray-600">Name</th>
                            <th className="p-3 text-left font-bold text-gray-600">ID Type</th>
                            <th className="p-3 text-left font-bold text-gray-600">ID Number</th>
                            <th className="p-3 text-left font-bold text-gray-600">Nationality</th>
                            <th className="p-3 text-left font-bold text-gray-600">Company</th>
                            <th className="p-3 text-left font-bold text-gray-600">Status</th>
                            <th className="p-3 w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map((visitor, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 font-medium">{visitor.name}</td>
                              <td className="p-3 capitalize">{visitor.idType.replace("_", " ")}</td>
                              <td className="p-3 font-mono">{visitor.idNumber}</td>
                              <td className="p-3">{visitor.nationality || "-"}</td>
                              <td className="p-3">{visitor.company || "-"}</td>
                              <td className="p-3">
                                {visitor.verified ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Manual
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRemoveVisitor(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TYPE SPECIFIC TAB */}
              {activeTab === "specific" && (
                <div className="space-y-6">
                  {requestType === "Admin Visit" && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Admin Visit</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Standard administrative visit. No additional details required.
                      </AlertDescription>
                    </Alert>
                  )}

                  {requestType === "TEP" && (
                    <div className="space-y-6">
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Temporary Entry Permit</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          TEP requires zone-level access approval. Select zone in the Location tab if needed.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Work Order Reference</Label>
                          <Input 
                            placeholder="WO-XXXX" 
                            value={workOrderRef}
                            onChange={(e) => setWorkOrderRef(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Escort Required</Label>
                          <Select value={escortRequired} onValueChange={setEscortRequired}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes - Escort Required</SelectItem>
                              <SelectItem value="no">No - Self-Access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {requestType === "WP" && (
                    <div className="space-y-6">
                      <Alert className="bg-orange-50 border-orange-200">
                        <HardHat className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">Work Permit</AlertTitle>
                        <AlertDescription className="text-orange-700">
                          Work permits require detailed safety documentation and risk assessment.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Work Type</Label>
                          <Select value={workType} onValueChange={setWorkType}>
                            <SelectTrigger><SelectValue placeholder="Select Work Type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrical">Electrical Work</SelectItem>
                              <SelectItem value="mechanical">Mechanical Work</SelectItem>
                              <SelectItem value="civil">Civil Work</SelectItem>
                              <SelectItem value="it">IT Infrastructure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Risk Level</Label>
                          <Select value={riskLevel} onValueChange={setRiskLevel}>
                            <SelectTrigger><SelectValue placeholder="Select Risk Level" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {requestType === "MOP" && (
                    <div className="space-y-6">
                      <Alert className="bg-purple-50 border-purple-200">
                        <Settings className="h-4 w-4 text-purple-600" />
                        <AlertTitle className="text-purple-800">Method of Procedure</AlertTitle>
                        <AlertDescription className="text-purple-700">
                          MOP requires detailed step-by-step procedure documentation and CAB approval.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Change Ticket</Label>
                          <Input 
                            placeholder="CHG-XXXX" 
                            value={changeTicket}
                            onChange={(e) => setChangeTicket(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-600 uppercase">Impact Level</Label>
                          <Select value={impactLevel} onValueChange={setImpactLevel}>
                            <SelectTrigger><SelectValue placeholder="Select Impact" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Impact</SelectItem>
                              <SelectItem value="minor">Minor Impact</SelectItem>
                              <SelectItem value="major">Major Impact</SelectItem>
                              <SelectItem value="critical">Critical Impact</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {requestType === "MVP" && (
                    <div className="space-y-6">
                      <Alert className="bg-green-50 border-green-200">
                        <Truck className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Material Entry Permit</AlertTitle>
                        <AlertDescription className="text-green-700">
                          List all materials to be brought into the facility.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-gray-700">Materials List</h4>
                          <Button variant="outline" size="sm" onClick={handleAddMaterial}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 text-left">Description *</th>
                                <th className="p-2 w-24 text-left">Qty *</th>
                                <th className="p-2 text-left">Serial Number</th>
                                <th className="p-2 w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {materials.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No items added.</td></tr>
                              ) : (
                                materials.map((m, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2">
                                      <Input 
                                        className="h-8" 
                                        placeholder="Item name"
                                        value={m.description}
                                        onChange={(e) => {
                                          const updated = [...materials];
                                          updated[i].description = e.target.value;
                                          setMaterials(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">
                                      <Input 
                                        className="h-8" 
                                        type="number" 
                                        value={m.quantity}
                                        onChange={(e) => {
                                          const updated = [...materials];
                                          updated[i].quantity = e.target.value;
                                          setMaterials(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">
                                      <Input 
                                        className="h-8" 
                                        placeholder="S/N"
                                        value={m.serialNumber}
                                        onChange={(e) => {
                                          const updated = [...materials];
                                          updated[i].serialNumber = e.target.value;
                                          setMaterials(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => handleRemoveMaterial(i)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ATTACHMENTS TAB */}
              {activeTab === "attachments" && (
                <div className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Required Documents</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Based on your request type ({requestType}), please upload the following documents.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <Paperclip className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-gray-700">Visitor ID Copies</h4>
                      <p className="text-xs text-gray-500 mt-1">Upload scanned copies of ID for all visitors.</p>
                      <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
                    </div>

                    {(requestType === "WP" || requestType === "MOP") && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="bg-blue-100 p-3 rounded-full mb-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-700">Method Statement / Risk Assessment</h4>
                        <p className="text-xs text-gray-500 mt-1">Upload approved technical documents.</p>
                        <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* REVIEW TAB - Comprehensive Summary */}
              {activeTab === "review" && (
                <div className="space-y-8">
                  {validateForm() ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-800">Missing Information</h4>
                        <p className="text-sm text-amber-700">{validateForm()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md flex items-start gap-3">
                      <CheckSquare className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-green-800">Ready to Submit</h4>
                        <p className="text-sm text-green-700">
                          All mandatory fields have been filled. Please review the complete summary below before submitting.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Basic Information Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0f62fe]" />
                        Basic Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Request Type</span>
                          <span className="font-bold text-[#0f62fe]">{requestType}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Requestor</span>
                          {renderFieldValue(user?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Email</span>
                          {renderFieldValue(user?.email)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Mobile</span>
                          {renderFieldValue(mobileNumber)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Department</span>
                          {renderFieldValue(selectedDepartment?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Sub-Type</span>
                          {renderFieldValue(subType ? subType.charAt(0).toUpperCase() + subType.slice(1) : "")}
                        </div>
                        <div className="col-span-2 py-2 border-b">
                          <span className="text-gray-500 block mb-1">Purpose of Visit</span>
                          {renderFieldValue(purpose)}
                        </div>
                        <div className="col-span-2 py-2">
                          <span className="text-gray-500 block mb-1">Additional Notes</span>
                          {renderFieldValue(notes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#0f62fe]" />
                        Location Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Site</span>
                          {renderFieldValue(selectedSite?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Country</span>
                          {renderFieldValue(selectedSite?.countryName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Region</span>
                          {renderFieldValue(selectedSite?.regionName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">City</span>
                          {renderFieldValue(selectedSite?.cityName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Zone</span>
                          {renderFieldValue(selectedZone?.name, "Entire Site")}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Area</span>
                          {renderFieldValue(selectedArea?.name, selectedZone ? "Entire Zone" : "N/A")}
                        </div>
                        {(requestType === "WP" || requestType === "MOP") && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-500">Rack Reference</span>
                            {renderFieldValue(rackReference)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#0f62fe]" />
                        Schedule & Timing
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Start Date</span>
                          {renderFieldValue(startDate)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Start Time</span>
                          {renderFieldValue(startTime)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">End Date</span>
                          {renderFieldValue(endDate)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">End Time</span>
                          {renderFieldValue(endTime)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Duration</span>
                          <span className="font-mono font-medium">{duration.days}d {duration.hours}h</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">After-Hours</span>
                          <span className={afterHours ? "text-green-600 font-medium" : "text-gray-400"}>{afterHours ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Weekend Access</span>
                          <span className={weekend ? "text-green-600 font-medium" : "text-gray-400"}>{weekend ? "Yes" : "No"}</span>
                        </div>
                        {requestType === "TEP" && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-500">Recurring</span>
                            <span className={recurring ? "text-green-600 font-medium" : "text-gray-400"}>{recurring ? "Yes" : "No"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visitors Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#0f62fe]" />
                        Visitors ({visitors.length})
                      </h3>
                    </div>
                    <div className="p-4">
                      {visitors.length === 0 ? (
                        <p className="text-gray-400 italic text-sm">No visitors added</p>
                      ) : (
                        <div className="space-y-3">
                          {visitors.map((v, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <div>
                                <span className="font-medium">{v.name}</span>
                                <span className="text-gray-500 text-sm ml-2">({v.idType.replace("_", " ")} - {v.idNumber})</span>
                              </div>
                              <Badge className={v.verified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                {v.verified ? "Verified" : "Manual"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type-Specific Section */}
                  {(requestType === "TEP" || requestType === "WP" || requestType === "MOP") && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 border-b">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-[#0f62fe]" />
                          {requestType} Details
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {requestType === "TEP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Work Order Ref</span>
                                {renderFieldValue(workOrderRef)}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Escort Required</span>
                                {renderFieldValue(escortRequired ? (escortRequired === "yes" ? "Yes" : "No") : "")}
                              </div>
                            </>
                          )}
                          {requestType === "WP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Work Type</span>
                                {renderFieldValue(workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : "")}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Risk Level</span>
                                {renderFieldValue(riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : "")}
                              </div>
                            </>
                          )}
                          {requestType === "MOP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Change Ticket</span>
                                {renderFieldValue(changeTicket)}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Impact Level</span>
                                {renderFieldValue(impactLevel ? impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1) : "")}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Materials Section (MVP) */}
                  {requestType === "MVP" && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 border-b">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#0f62fe]" />
                          Materials ({materials.length})
                        </h3>
                      </div>
                      <div className="p-4">
                        {materials.length === 0 ? (
                          <p className="text-gray-400 italic text-sm">No materials added</p>
                        ) : (
                          <div className="space-y-2">
                            {materials.map((m, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
                                <span>{m.description || <span className="text-gray-400 italic">No description</span>}</span>
                                <span className="text-gray-500">Qty: {m.quantity} {m.serialNumber && `| S/N: ${m.serialNumber}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Approval Path */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#0f62fe]" />
                        Approval Path
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">1</div>
                          <span className="text-sm font-medium">L1 Approval (Security Supervisor)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">2</div>
                          <span className="text-sm text-gray-500">L2 Approval (Data Center Manager)</span>
                        </div>
                        {requestType === "MOP" && (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
                            <span className="text-sm text-gray-500">Change Advisory Board (CAB)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleSubmit(true)}
                      disabled={createRequest.isPending}
                    >
                      {createRequest.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save as Draft
                    </Button>
                    <Button 
                      size="lg" 
                      className="bg-[#0f62fe] hover:bg-[#0f62fe]/90 px-8"
                      onClick={() => handleSubmit(false)}
                      disabled={createRequest.isPending || !!validateForm()}
                    >
                      {createRequest.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
