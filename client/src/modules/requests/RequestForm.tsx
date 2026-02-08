import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
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
      return <span className="font-medium text-[#2C2C2C]">{value}</span>;
    }
    return <span className="text-[#9CA3AF] italic">{emptyText}</span>;
  };

  return (
    <>
    <ErrorDialogComponent />
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Toolbar */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link href="/requests">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-medium text-[#2C2C2C] leading-7">Create New Request</h1>
          <p className="text-sm text-[#6B6B6B]">Fill in the request details below</p>
        </div>
        <div className="h-6 w-px bg-[#E0E0E0] ml-2" />
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B6B] font-medium">*</span>
          <span className="font-medium text-[#2C2C2C]">Request Type:</span>
          <Select value={requestType} onValueChange={setRequestType}>
            <SelectTrigger className="w-[240px] h-9 border-[#E0E0E0] bg-[#F5F5F5] focus:ring-2 focus:ring-[#5B2C93] font-medium text-[#5B2C93]">
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
        <div className="ml-auto flex items-center gap-6 text-[#6B6B6B]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-medium text-[#9CA3AF]">Status</span>
            <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93] rounded-sm px-2 py-0.5">NEW</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-medium text-[#9CA3AF]">Request ID</span>
            <span className="font-mono text-black font-medium">REQ-DRAFT</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Navigation Tabs (Vertical) */}
        <div className="w-64 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-4 border-b bg-[#F5F5F5]">
            <h3 className="font-medium text-[#2C2C2C] text-sm">SECTIONS</h3>
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
                    ? "bg-[#D1FAE5] text-[#3D1C5E] border-l-4 border-[#5B2C93]" 
                    : "text-[#6B6B6B] hover:bg-[#F5F5F5] border-l-4 border-transparent"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-[#5B2C93]" : "text-[#9CA3AF]"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F5F5F5]">
          <div className="max-w-5xl mx-auto bg-white border shadow-sm rounded-sm min-h-[600px]">
            
            {/* Header for current section */}
            <div className="px-6 py-4 border-b bg-[#F5F5F5] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                {activeTab === "basic" && <><FileText className="h-5 w-5 text-[#5B2C93]" /> Basic Information</>}
                {activeTab === "location" && <><MapPin className="h-5 w-5 text-[#5B2C93]" /> Location Details</>}
                {activeTab === "schedule" && <><Calendar className="h-5 w-5 text-[#5B2C93]" /> Schedule & Timing</>}
                {activeTab === "visitors" && <><Users className="h-5 w-5 text-[#5B2C93]" /> Visitor Management</>}
                {activeTab === "specific" && <><Settings className="h-5 w-5 text-[#5B2C93]" /> {requestType} Specifics</>}
                {activeTab === "attachments" && <><Paperclip className="h-5 w-5 text-[#5B2C93]" /> Documents & Attachments</>}
                {activeTab === "review" && <><ShieldCheck className="h-5 w-5 text-[#5B2C93]" /> Review & Submit</>}
              </h2>
              <span className="text-xs text-[#6B6B6B] italic">* Indicates mandatory field</span>
            </div>

            <div className="p-8">
              {/* BASIC INFO TAB */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Requestor Full Name <span className="text-[#FF6B6B]">*</span></Label>
                    <Input defaultValue={user?.name || "User"} className="bg-[#F5F5F5]" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Requestor Company <span className="text-[#FF6B6B]">*</span></Label>
                    <Input defaultValue="Centre3" className="bg-[#F5F5F5]" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Email Address <span className="text-[#FF6B6B]">*</span></Label>
                    <Input defaultValue={user?.email || "user@centre3.com"} className="bg-[#F5F5F5]" readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Mobile Number</Label>
                    <Input 
                      placeholder="+966 5XX XXX XXXX" 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Department <span className="text-[#FF6B6B]">*</span></Label>
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
                    <Label className="text-sm font-medium text-[#2C2C2C]">Request Sub-Type</Label>
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
                    <Label className="text-sm font-medium text-[#2C2C2C]">Purpose of Visit <span className="text-[#FF6B6B]">*</span></Label>
                    <Textarea 
                      placeholder="Describe the purpose of this visit..." 
                      className="h-24"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-sm font-medium text-[#2C2C2C]">Additional Notes</Label>
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
                    <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#5B2C93]" />
                      Select Site <span className="text-[#FF6B6B]">*</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-[#2C2C2C]">Data Center / Site <span className="text-[#FF6B6B]">*</span></Label>
                        <Select value={siteId} onValueChange={(v) => { setSiteId(v); setSelectedZoneId(""); setSelectedAreaId(""); }}>
                          <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                          <SelectContent>
                            {sitesData?.filter((site: any) => site.id != null).map((site: any) => (
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
                      <div className="bg-[#E8DCF5] border border-[#5B2C93] rounded-md p-4">
                        <h4 className="font-medium text-[#5B2C93] text-sm mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Site Location (Auto-populated)
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-[#5B2C93] font-medium">Country:</span>
                            <p className="text-[#5B2C93] font-medium">{selectedSite.countryName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#5B2C93] font-medium">Region:</span>
                            <p className="text-[#5B2C93] font-medium">{selectedSite.regionName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#5B2C93] font-medium">City:</span>
                            <p className="text-[#5B2C93] font-medium">{selectedSite.cityName || "N/A"}</p>
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
                        <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#5B2C93]" />
                          Select Zone
                          <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                        </h3>
                        <p className="text-sm text-[#6B6B6B]">
                          Leave blank to request access to the entire site, or select a specific zone.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Zone</Label>
                            <Select 
                              value={selectedZoneId} 
                              onValueChange={(v) => { setSelectedZoneId(v); setSelectedAreaId(""); }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select Zone (Optional)" /></SelectTrigger>
                              <SelectContent>
                                {zonesData?.filter((zone: any) => zone.id != null).map((zone: any) => (
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
                                ${selectedZone.securityLevel === 'critical' ? 'bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]' : ''}
                                ${selectedZone.securityLevel === 'high' ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]' : ''}
                                ${selectedZone.securityLevel === 'medium' ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]' : ''}
                                ${selectedZone.securityLevel === 'low' ? 'bg-[#D1FAE5] text-[#059669] border-[#059669]' : ''}
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
                        <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#5B2C93]" />
                          Select Area
                          <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                        </h3>
                        <p className="text-sm text-[#6B6B6B]">
                          Leave blank to request access to the entire zone, or select a specific area.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Area</Label>
                            <Select 
                              value={selectedAreaId} 
                              onValueChange={setSelectedAreaId}
                            >
                              <SelectTrigger><SelectValue placeholder="Select Area (Optional)" /></SelectTrigger>
                              <SelectContent>
                                {areasData?.filter((area: any) => area.id != null).map((area: any) => (
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
                      <div className="bg-[#D1FAE5] border border-[#059669] rounded-md p-4">
                        <h4 className="font-medium text-[#059669] text-sm mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Access Scope
                        </h4>
                        <p className="text-sm text-[#059669]">
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
                        <Label className="text-sm font-medium text-[#2C2C2C]">Cabinet / Rack Reference</Label>
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
                      <Label className="text-sm font-medium text-[#2C2C2C]">Start Date <span className="text-[#FF6B6B]">*</span></Label>
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-[#2C2C2C]">Start Time</Label>
                      <Input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-[#2C2C2C]">End Date <span className="text-[#FF6B6B]">*</span></Label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-[#2C2C2C]">End Time</Label>
                      <Input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-[#E8DCF5] p-4 rounded-md border border-[#5B2C93]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-[#5B2C93]" />
                      <span className="font-medium text-[#5B2C93] text-sm">Duration Calculation</span>
                    </div>
                    <p className="text-sm text-[#5B2C93]">
                      Total Duration: <span className="font-mono font-medium">{duration.days} Days, {duration.hours} Hours</span>
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
                    <h3 className="font-medium text-[#2C2C2C]">Visitor List (Minimum 1 Required)</h3>
                    <Dialog open={yakeenOpen} onOpenChange={(open) => { setYakeenOpen(open); if (!open) resetYakeenForm(); }}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#5B2C93] hover:bg-[#5B2C93]/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Visitor
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[650px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-[#5B2C93]">
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
                                  <Label>ID Type <span className="text-[#FF6B6B]">*</span></Label>
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
                                    <span className="text-[#FF6B6B]">*</span>
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
                                        className={isValidated ? "bg-[#059669] hover:bg-[#059669]" : "bg-[#5B2C93]"}
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
                                <Alert className="bg-[#FEF3C7] border-[#D97706]">
                                  <XCircle className="h-4 w-4 text-[#D97706]" />
                                  <AlertTitle className="text-[#D97706]">Cannot identify through Yakeen</AlertTitle>
                                  <AlertDescription className="text-[#D97706]">
                                    <p className="mb-2">The ID could not be verified through Yakeen. You can enter the visitor details manually.</p>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setManualEntry(true)}
                                      className="border-[#D97706] text-[#D97706] hover:bg-[#FEF3C7]"
                                    >
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      Enter Manually
                                    </Button>
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {/* Passport note */}
                              {visitorIdType === "passport" && !manualEntry && (
                                <Alert className="bg-[#E8DCF5] border-[#5B2C93]">
                                  <Globe className="h-4 w-4 text-[#5B2C93]" />
                                  <AlertTitle className="text-[#5B2C93]">Passport Verification</AlertTitle>
                                  <AlertDescription className="text-[#5B2C93]">
                                    Passport numbers are alphanumeric. Yakeen verification is not available for passports - manual entry will be required.
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {isValidated && !manualEntry && (
                                <Alert className="bg-[#D1FAE5] border-[#059669]">
                                  <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                  <AlertTitle className="text-[#059669]">Identity Verified</AlertTitle>
                                  <AlertDescription className="text-[#059669]">
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
                                  <h4 className="font-medium text-[#2C2C2C]">Verified Details</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <Label className="text-[#6B6B6B]">Full Name</Label>
                                      <Input value={validatedVisitor.name} readOnly className="bg-[#F5F5F5] font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[#6B6B6B]">Nationality</Label>
                                      <Input value={validatedVisitor.nationality} readOnly className="bg-[#F5F5F5]" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[#6B6B6B]">Phone</Label>
                                      <Input value={validatedVisitor.phone} readOnly className="bg-[#F5F5F5]" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[#6B6B6B]">Company</Label>
                                      <Input value={validatedVisitor.company} readOnly className="bg-[#F5F5F5]" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                      <Label className="text-[#6B6B6B]">Email</Label>
                                      <Input value={validatedVisitor.email} readOnly className="bg-[#F5F5F5]" />
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
                                  <h4 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                                    <Edit3 className="h-4 w-4" />
                                    Manual Entry
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <Label>Full Name <span className="text-[#FF6B6B]">*</span></Label>
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
                              className="bg-[#5B2C93]" 
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
                    <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-8 text-center">
                      <Users className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
                      <h4 className="font-medium text-[#6B6B6B] mb-2">No Visitors Added</h4>
                      <p className="text-sm text-[#6B6B6B]">Click "Add Visitor" to verify and add visitors to this request.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F5F5F5]">
                          <tr>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">Name</th>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">ID Type</th>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">ID Number</th>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">Nationality</th>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">Company</th>
                            <th className="p-3 text-left font-medium text-[#6B6B6B]">Status</th>
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
                                  <Badge className="bg-[#D1FAE5] text-[#059669] border-[#059669]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-[#FEF3C7] text-[#D97706] border-[#D97706]">
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Manual
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
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
                    <Alert className="bg-[#E8DCF5] border-[#5B2C93]">
                      <Info className="h-4 w-4 text-[#5B2C93]" />
                      <AlertTitle className="text-[#5B2C93]">Admin Visit</AlertTitle>
                      <AlertDescription className="text-[#5B2C93]">
                        Standard administrative visit. No additional details required.
                      </AlertDescription>
                    </Alert>
                  )}

                  {requestType === "TEP" && (
                    <div className="space-y-6">
                      <Alert className="bg-[#FEF3C7] border-[#D97706]">
                        <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                        <AlertTitle className="text-[#D97706]">Temporary Entry Permit</AlertTitle>
                        <AlertDescription className="text-[#D97706]">
                          TEP requires zone-level access approval. Select zone in the Location tab if needed.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-[#2C2C2C]">Work Order Reference</Label>
                          <Input 
                            placeholder="WO-XXXX" 
                            value={workOrderRef}
                            onChange={(e) => setWorkOrderRef(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-[#2C2C2C]">Escort Required</Label>
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
                      <Alert className="bg-[#FEF3C7] border-[#D97706]">
                        <HardHat className="h-4 w-4 text-[#D97706]" />
                        <AlertTitle className="text-[#D97706]">Work Permit</AlertTitle>
                        <AlertDescription className="text-[#D97706]">
                          Work permits require detailed safety documentation and risk assessment.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-[#2C2C2C]">Work Type</Label>
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
                          <Label className="text-sm font-medium text-[#2C2C2C]">Risk Level</Label>
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
                      <Alert className="bg-[#E8DCF5] border-[#5B2C93]">
                        <Settings className="h-4 w-4 text-[#5B2C93]" />
                        <AlertTitle className="text-[#5B2C93]">Method of Procedure</AlertTitle>
                        <AlertDescription className="text-[#5B2C93]">
                          MOP requires detailed step-by-step procedure documentation and CAB approval.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-[#2C2C2C]">Change Ticket</Label>
                          <Input 
                            placeholder="CHG-XXXX" 
                            value={changeTicket}
                            onChange={(e) => setChangeTicket(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-[#2C2C2C]">Impact Level</Label>
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
                      <Alert className="bg-[#D1FAE5] border-[#059669]">
                        <Truck className="h-4 w-4 text-[#059669]" />
                        <AlertTitle className="text-[#059669]">Material Entry Permit</AlertTitle>
                        <AlertDescription className="text-[#059669]">
                          List all materials to be brought into the facility.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-[#2C2C2C]">Materials List</h4>
                          <Button variant="outline" size="sm" onClick={handleAddMaterial}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-[#F5F5F5]">
                              <tr>
                                <th className="p-2 text-left">Description *</th>
                                <th className="p-2 w-24 text-left">Qty *</th>
                                <th className="p-2 text-left">Serial Number</th>
                                <th className="p-2 w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {materials.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-[#6B6B6B]">No items added.</td></tr>
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
                                        className="h-8 w-8 text-[#FF6B6B]"
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
                  <Alert className="bg-[#E8DCF5] border-[#5B2C93]">
                    <Info className="h-4 w-4 text-[#5B2C93]" />
                    <AlertTitle className="text-[#5B2C93]">Required Documents</AlertTitle>
                    <AlertDescription className="text-[#5B2C93]">
                      Based on your request type ({requestType}), please upload the following documents.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                      <div className="bg-[#E8DCF5] p-3 rounded-full mb-3">
                        <Paperclip className="h-6 w-6 text-[#5B2C93]" />
                      </div>
                      <h4 className="font-medium text-[#2C2C2C]">Visitor ID Copies</h4>
                      <p className="text-xs text-[#6B6B6B] mt-1">Upload scanned copies of ID for all visitors.</p>
                      <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
                    </div>

                    {(requestType === "WP" || requestType === "MOP") && (
                      <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                        <div className="bg-[#E8DCF5] p-3 rounded-full mb-3">
                          <FileText className="h-6 w-6 text-[#5B2C93]" />
                        </div>
                        <h4 className="font-medium text-[#2C2C2C]">Method Statement / Risk Assessment</h4>
                        <p className="text-xs text-[#6B6B6B] mt-1">Upload approved technical documents.</p>
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
                    <div className="bg-[#FEF3C7] border border-[#D97706] p-4 rounded-md flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-[#D97706] mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[#D97706]">Missing Information</h4>
                        <p className="text-sm text-[#D97706]">{validateForm()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#D1FAE5] border border-[#059669] p-4 rounded-md flex items-start gap-3">
                      <CheckSquare className="h-5 w-5 text-[#059669] mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[#059669]">Ready to Submit</h4>
                        <p className="text-sm text-[#059669]">
                          All mandatory fields have been filled. Please review the complete summary below before submitting.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Basic Information Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                      <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#5B2C93]" />
                        Basic Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Request Type</span>
                          <span className="font-medium text-[#5B2C93]">{requestType}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Requestor</span>
                          {renderFieldValue(user?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Email</span>
                          {renderFieldValue(user?.email)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Mobile</span>
                          {renderFieldValue(mobileNumber)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Department</span>
                          {renderFieldValue(selectedDepartment?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Sub-Type</span>
                          {renderFieldValue(subType ? subType.charAt(0).toUpperCase() + subType.slice(1) : "")}
                        </div>
                        <div className="col-span-2 py-2 border-b">
                          <span className="text-[#6B6B6B] block mb-1">Purpose of Visit</span>
                          {renderFieldValue(purpose)}
                        </div>
                        <div className="col-span-2 py-2">
                          <span className="text-[#6B6B6B] block mb-1">Additional Notes</span>
                          {renderFieldValue(notes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                      <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#5B2C93]" />
                        Location Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Site</span>
                          {renderFieldValue(selectedSite?.name)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Country</span>
                          {renderFieldValue(selectedSite?.countryName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Region</span>
                          {renderFieldValue(selectedSite?.regionName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">City</span>
                          {renderFieldValue(selectedSite?.cityName)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Zone</span>
                          {renderFieldValue(selectedZone?.name, "Entire Site")}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Area</span>
                          {renderFieldValue(selectedArea?.name, selectedZone ? "Entire Zone" : "N/A")}
                        </div>
                        {(requestType === "WP" || requestType === "MOP") && (
                          <div className="flex justify-between py-2">
                            <span className="text-[#6B6B6B]">Rack Reference</span>
                            {renderFieldValue(rackReference)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                      <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#5B2C93]" />
                        Schedule & Timing
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Start Date</span>
                          {renderFieldValue(startDate)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Start Time</span>
                          {renderFieldValue(startTime)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">End Date</span>
                          {renderFieldValue(endDate)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">End Time</span>
                          {renderFieldValue(endTime)}
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Duration</span>
                          <span className="font-mono font-medium">{duration.days}d {duration.hours}h</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">After-Hours</span>
                          <span className={afterHours ? "text-[#059669] font-medium" : "text-[#9CA3AF]"}>{afterHours ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-[#6B6B6B]">Weekend Access</span>
                          <span className={weekend ? "text-[#059669] font-medium" : "text-[#9CA3AF]"}>{weekend ? "Yes" : "No"}</span>
                        </div>
                        {requestType === "TEP" && (
                          <div className="flex justify-between py-2">
                            <span className="text-[#6B6B6B]">Recurring</span>
                            <span className={recurring ? "text-[#059669] font-medium" : "text-[#9CA3AF]"}>{recurring ? "Yes" : "No"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visitors Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                      <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#5B2C93]" />
                        Visitors ({visitors.length})
                      </h3>
                    </div>
                    <div className="p-4">
                      {visitors.length === 0 ? (
                        <p className="text-[#9CA3AF] italic text-sm">No visitors added</p>
                      ) : (
                        <div className="space-y-3">
                          {visitors.map((v, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <div>
                                <span className="font-medium">{v.name}</span>
                                <span className="text-[#6B6B6B] text-sm ml-2">({v.idType.replace("_", " ")} - {v.idNumber})</span>
                              </div>
                              <Badge className={v.verified ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FEF3C7] text-[#D97706]"}>
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
                      <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                        <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Settings className="h-4 w-4 text-[#5B2C93]" />
                          {requestType} Details
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {requestType === "TEP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Work Order Ref</span>
                                {renderFieldValue(workOrderRef)}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Escort Required</span>
                                {renderFieldValue(escortRequired ? (escortRequired === "yes" ? "Yes" : "No") : "")}
                              </div>
                            </>
                          )}
                          {requestType === "WP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Work Type</span>
                                {renderFieldValue(workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : "")}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Risk Level</span>
                                {renderFieldValue(riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : "")}
                              </div>
                            </>
                          )}
                          {requestType === "MOP" && (
                            <>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Change Ticket</span>
                                {renderFieldValue(changeTicket)}
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-[#6B6B6B]">Impact Level</span>
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
                      <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                        <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#5B2C93]" />
                          Materials ({materials.length})
                        </h3>
                      </div>
                      <div className="p-4">
                        {materials.length === 0 ? (
                          <p className="text-[#9CA3AF] italic text-sm">No materials added</p>
                        ) : (
                          <div className="space-y-2">
                            {materials.map((m, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
                                <span>{m.description || <span className="text-[#9CA3AF] italic">No description</span>}</span>
                                <span className="text-[#6B6B6B]">Qty: {m.quantity} {m.serialNumber && `| S/N: ${m.serialNumber}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Approval Path */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-4 py-3 border-b">
                      <h3 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#5B2C93]" />
                        Approval Path
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center text-xs font-medium">1</div>
                          <span className="text-sm font-medium">L1 Approval (Security Supervisor)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#F5F5F5] text-[#6B6B6B] flex items-center justify-center text-xs font-medium">2</div>
                          <span className="text-sm text-[#6B6B6B]">L2 Approval (Data Center Manager)</span>
                        </div>
                        {requestType === "MOP" && (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#F5F5F5] text-[#6B6B6B] flex items-center justify-center text-xs font-medium">3</div>
                            <span className="text-sm text-[#6B6B6B]">Change Advisory Board (CAB)</span>
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
                      className="bg-[#5B2C93] hover:bg-[#5B2C93]/90 px-8"
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
