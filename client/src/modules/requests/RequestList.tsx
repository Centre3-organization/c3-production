import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronDown, 
  Calendar,
  Settings,
  RefreshCw,
  Maximize2,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  Building2,
  User,
  Briefcase,
  QrCode,
  Radio,
  CreditCard,
  Copy,
  RotateCcw,
  Shield,
  Send,
  Mail,
  MessageSquare,
  Phone as PhoneIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";
import QRCode from "qrcode";

const typeLabels: Record<string, string> = {
  admin_visit: "Admin Visit",
  work_permit: "Work Permit",
  material_entry: "Material Entry",
  tep: "TEP",
  mop: "MOP",
  escort: "Escort",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Draft", icon: <FileText className="h-3 w-3" />, color: "text-muted-foreground bg-muted" },
  pending_l1: { label: "Pending L1", icon: <Clock className="h-3 w-3" />, color: "text-amber-700 bg-amber-100" },
  pending_manual: { label: "Pending Manual", icon: <AlertCircle className="h-3 w-3" />, color: "text-blue-700 bg-blue-100" },
  pending_approval: { label: "Pending Approval", icon: <Clock className="h-3 w-3" />, color: "text-amber-700 bg-amber-100" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-green-700 bg-green-100" },
  rejected: { label: "Rejected", icon: <XCircle className="h-3 w-3" />, color: "text-red-700 bg-red-100" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-3 w-3" />, color: "text-gray-700 bg-gray-100" },
  expired: { label: "Expired", icon: <Clock className="h-3 w-3" />, color: "text-gray-700 bg-gray-100" },
};

const entryMethodConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  qr_code: { label: "QR Code", icon: <QrCode className="h-4 w-4" />, color: "text-green-700 bg-green-100" },
  rfid: { label: "RFID Tag", icon: <Radio className="h-4 w-4" />, color: "text-blue-700 bg-blue-100" },
  card: { label: "Access Card", icon: <CreditCard className="h-4 w-4" />, color: "text-purple-700 bg-purple-100" },
};

export default function Requests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  
  // Access method edit state
  const [editAccessMethodOpen, setEditAccessMethodOpen] = useState(false);
  const [newEntryMethod, setNewEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [newRfidTag, setNewRfidTag] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [resendingChannel, setResendingChannel] = useState<string | null>(null);
  
  const { data, isLoading, refetch } = trpc.requests.getAll.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    limit: 100,
  });
  
  const { data: requestDetail, isLoading: detailLoading, refetch: refetchDetail } = trpc.requests.getById.useQuery(
    { id: selectedRequest! },
    { enabled: !!selectedRequest }
  );
  
  const { data: sites } = trpc.sites.getForDropdown.useQuery();
  
  const updateAccessMethod = trpc.requests.updateAccessMethod.useMutation({
    onSuccess: async (result: any) => {
      toast.success("Access method updated");
      if (result.entryMethod === "qr_code" && result.qrCodeData) {
        try {
          const qrDataUrl = await QRCode.toDataURL(result.qrCodeData, {
            width: 300,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" }
          });
          setQrCodeImage(qrDataUrl);
        } catch (err) {
          console.error("Failed to generate QR code:", err);
        }
      }
      refetchDetail();
      setEditAccessMethodOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update access method", { description: error.message });
    }
  });
  
  const requests = data?.requests || [];
  
  // Filter by search query
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.requestNumber.toLowerCase().includes(query) ||
      req.visitorName.toLowerCase().includes(query) ||
      req.visitorCompany?.toLowerCase().includes(query) ||
      req.siteName?.toLowerCase().includes(query)
    );
  });
  
  const handleOpenAccessMethodEdit = () => {
    if (requestDetail?.accessMethod) {
      setNewEntryMethod(requestDetail.accessMethod.entryMethod as any || "qr_code");
      setNewRfidTag(requestDetail.accessMethod.rfidTag || "");
      setNewCardNumber(requestDetail.accessMethod.cardNumber || "");
    }
    setEditAccessMethodOpen(true);
  };
  
  const handleSaveAccessMethod = () => {
    if (!selectedRequest) return;
    
    if (newEntryMethod === "rfid" && !newRfidTag.trim()) {
      toast.error("Please enter the RFID tag number");
      return;
    }
    if (newEntryMethod === "card" && !newCardNumber.trim()) {
      toast.error("Please enter the card number");
      return;
    }
    
    updateAccessMethod.mutate({
      requestId: selectedRequest,
      entryMethod: newEntryMethod,
      rfidTag: newEntryMethod === "rfid" ? newRfidTag : undefined,
      cardNumber: newEntryMethod === "card" ? newCardNumber : undefined,
    });
  };
  
  const handleRegenerateQr = () => {
    if (!selectedRequest) return;
    updateAccessMethod.mutate({
      requestId: selectedRequest,
      entryMethod: "qr_code",
      regenerateQr: true,
    });
  };
  
  const handleCopyQrData = () => {
    if (requestDetail?.accessMethod?.qrCodeData) {
      navigator.clipboard.writeText(requestDetail.accessMethod.qrCodeData);
      toast.success("QR code data copied to clipboard");
    }
  };
  
  const handleResendCredentials = async (channel: "email" | "sms" | "whatsapp") => {
    if (!requestDetail) return;
    
    setResendingChannel(channel);
    
    // Simulate sending - in production this would call a backend endpoint
    try {
      // Get visitor contact info
      const visitorEmail = requestDetail.visitorEmail;
      const visitorPhone = requestDetail.visitorPhone;
      const accessMethod = requestDetail.accessMethod;
      
      if (channel === "email") {
        if (!visitorEmail) {
          toast.error("No email address available", { description: "Visitor email is not provided" });
          setResendingChannel(null);
          return;
        }
        // In production: call backend to send email with QR code attachment
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Access credentials sent via Email", { 
          description: `Sent to ${visitorEmail}` 
        });
      } else if (channel === "sms") {
        if (!visitorPhone) {
          toast.error("No phone number available", { description: "Visitor phone is not provided" });
          setResendingChannel(null);
          return;
        }
        // In production: call backend to send SMS
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Access credentials sent via SMS", { 
          description: `Sent to ${visitorPhone}` 
        });
      } else if (channel === "whatsapp") {
        if (!visitorPhone) {
          toast.error("No phone number available", { description: "Visitor phone is not provided" });
          setResendingChannel(null);
          return;
        }
        // Open WhatsApp with pre-filled message
        const message = encodeURIComponent(
          `Your access credentials for ${requestDetail.siteName || 'the facility'}:\n\n` +
          `Request: ${requestDetail.requestNumber}\n` +
          `Valid: ${requestDetail.startDate ? format(new Date(requestDetail.startDate), "MMM d, yyyy") : "N/A"} - ${requestDetail.endDate ? format(new Date(requestDetail.endDate), "MMM d, yyyy") : "N/A"}\n` +
          (accessMethod?.entryMethod === "qr_code" ? `\nAccess Code: ${accessMethod.qrCodeData}` : "") +
          (accessMethod?.entryMethod === "rfid" ? `\nRFID Tag: ${accessMethod.rfidTag}` : "") +
          (accessMethod?.entryMethod === "card" ? `\nCard Number: ${accessMethod.cardNumber}` : "")
        );
        const phone = visitorPhone.replace(/[^0-9]/g, "");
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        toast.success("WhatsApp opened", { description: "Message prepared for sending" });
      }
    } catch (error) {
      toast.error("Failed to send credentials", { description: "Please try again" });
    } finally {
      setResendingChannel(null);
    }
  };
  
  // Generate QR code image when request detail loads
  const generateQrImage = async (qrData: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" }
      });
      setQrCodeImage(qrDataUrl);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    }
  };
  
  // Effect to generate QR when detail loads
  if (requestDetail?.accessMethod?.qrCodeData && !qrCodeImage) {
    generateQrImage(requestDetail.accessMethod.qrCodeData);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="text-sm text-muted-foreground">Manage and track all access requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/requests/new">
            <Button size="sm">
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request number, visitor, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="border rounded-lg bg-card">
        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-sm">Try adjusting your filters or create a new request</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2 border-border">
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead className="font-semibold text-foreground">Request ID</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Visitor</TableHead>
                <TableHead className="font-semibold text-foreground">Company</TableHead>
                <TableHead className="font-semibold text-foreground">Site</TableHead>
                <TableHead className="font-semibold text-foreground">Date Range</TableHead>
                <TableHead className="font-semibold text-foreground">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const status = statusConfig[req.status] || statusConfig.draft;
                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 h-12">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-primary cursor-pointer hover:underline" onClick={() => {
                      setSelectedRequest(req.id);
                      setQrCodeImage("");
                    }}>
                      {req.requestNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${status.color} gap-1`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{req.visitorName}</TableCell>
                    <TableCell className="text-muted-foreground">{req.visitorCompany || "-"}</TableCell>
                    <TableCell>{req.siteName || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {req.startDate} → {req.endDate}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.createdAt ? format(new Date(req.createdAt), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setSelectedRequest(req.id);
                          setQrCodeImage("");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => {
        if (!open) {
          setSelectedRequest(null);
          setQrCodeImage("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              {requestDetail?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requestDetail ? (
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`${statusConfig[requestDetail.status]?.color} gap-1 text-sm px-3 py-1`}>
                  {statusConfig[requestDetail.status]?.icon}
                  {statusConfig[requestDetail.status]?.label}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {typeLabels[requestDetail.type] || requestDetail.type}
                </Badge>
              </div>
              
              {/* Access Method Section - Only for approved requests */}
              {requestDetail.status === "approved" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2 text-green-800">
                      <Shield className="h-4 w-4" />
                      Access Method
                    </h4>
                    <Button variant="outline" size="sm" onClick={handleOpenAccessMethodEdit}>
                      <Settings className="h-4 w-4 mr-2" />
                      Change Method
                    </Button>
                  </div>
                  
                  {requestDetail.accessMethod?.entryMethod ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`${entryMethodConfig[requestDetail.accessMethod.entryMethod]?.color} gap-2 text-sm px-3 py-2`}>
                          {entryMethodConfig[requestDetail.accessMethod.entryMethod]?.icon}
                          {entryMethodConfig[requestDetail.accessMethod.entryMethod]?.label}
                        </Badge>
                        {requestDetail.accessMethod.accessGrantedByName && (
                          <span className="text-sm text-muted-foreground">
                            Granted by {requestDetail.accessMethod.accessGrantedByName}
                          </span>
                        )}
                      </div>
                      
                      {/* QR Code Display */}
                      {requestDetail.accessMethod.entryMethod === "qr_code" && requestDetail.accessMethod.qrCodeData && (
                        <div className="flex items-start gap-4 p-3 bg-white rounded-lg border">
                          {qrCodeImage && (
                            <img src={qrCodeImage} alt="Access QR Code" className="w-32 h-32" />
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">QR Code Data</Label>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {requestDetail.accessMethod.qrCodeData}
                                </code>
                                <Button variant="ghost" size="sm" onClick={handleCopyQrData}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleRegenerateQr}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Regenerate QR
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* RFID Display */}
                      {requestDetail.accessMethod.entryMethod === "rfid" && requestDetail.accessMethod.rfidTag && (
                        <div className="p-3 bg-white rounded-lg border">
                          <Label className="text-xs text-muted-foreground">RFID Tag Number</Label>
                          <p className="font-mono text-sm">{requestDetail.accessMethod.rfidTag}</p>
                        </div>
                      )}
                      
                      {/* Card Display */}
                      {requestDetail.accessMethod.entryMethod === "card" && requestDetail.accessMethod.cardNumber && (
                        <div className="p-3 bg-white rounded-lg border">
                          <Label className="text-xs text-muted-foreground">Card Number</Label>
                          <p className="font-mono text-sm">{requestDetail.accessMethod.cardNumber}</p>
                        </div>
                      )}
                      
                      {/* Resend Credentials Button */}
                      <div className="pt-3 border-t border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">Send access credentials to visitor</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2" disabled={!!resendingChannel}>
                                {resendingChannel ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                {resendingChannel ? "Sending..." : "Resend"}
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendCredentials("email")} className="gap-2">
                                <Mail className="h-4 w-4" />
                                Send via Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendCredentials("sms")} className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Send via SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendCredentials("whatsapp")} className="gap-2">
                                <PhoneIcon className="h-4 w-4" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No access method assigned yet</p>
                      <Button variant="outline" size="sm" onClick={handleOpenAccessMethodEdit}>
                        Assign Access Method
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Visitor Info */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Visitor Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{requestDetail.visitorName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-medium">{requestDetail.visitorCompany || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Type:</span>
                    <p className="font-medium capitalize">{requestDetail.visitorIdType?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Number:</span>
                    <p className="font-medium">{requestDetail.visitorIdNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{requestDetail.visitorPhone || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{requestDetail.visitorEmail || "-"}</p>
                  </div>
                </div>
              </div>
              
              {/* Visit Details */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Visit Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Site:</span>
                    <p className="font-medium">{requestDetail.siteName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Range:</span>
                    <p className="font-medium">{requestDetail.startDate} → {requestDetail.endDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">{requestDetail.startTime || "00:00"} - {requestDetail.endTime || "23:59"}</p>
                  </div>
                </div>
                {requestDetail.purpose && (
                  <div>
                    <span className="text-muted-foreground text-sm">Purpose:</span>
                    <p className="text-sm mt-1">{requestDetail.purpose}</p>
                  </div>
                )}
              </div>
              
              {/* Zones */}
              {requestDetail.zones && requestDetail.zones.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">Requested Zones</h4>
                  <div className="flex flex-wrap gap-2">
                    {requestDetail.zones.map((zone: any) => (
                      <Badge key={zone.id} variant="outline" className="gap-1">
                        {zone.name}
                        <span className="text-xs text-muted-foreground">({zone.securityLevel})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Approval History */}
              {requestDetail.approvals && requestDetail.approvals.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Approval History
                  </h4>
                  <div className="space-y-2">
                    {requestDetail.approvals.map((approval: any) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="uppercase text-xs">
                            {approval.stage}
                          </Badge>
                          <span className="text-sm">{approval.approverName || "Pending"}</span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={
                            approval.status === "approved" ? "text-green-700 bg-green-100" :
                            approval.status === "rejected" ? "text-red-700 bg-red-100" :
                            "text-amber-700 bg-amber-100"
                          }
                        >
                          {approval.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Access Method Dialog */}
      <Dialog open={editAccessMethodOpen} onOpenChange={setEditAccessMethodOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Access Method
            </DialogTitle>
            <DialogDescription>
              Update the access method for this approved request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Entry Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Entry Method</Label>
              <RadioGroup value={newEntryMethod} onValueChange={(v) => setNewEntryMethod(v as any)} className="grid gap-3">
                <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${newEntryMethod === "qr_code" ? "border-green-500 bg-green-50" : "hover:bg-gray-50"}`}>
                  <RadioGroupItem value="qr_code" id="edit_qr_code" />
                  <Label htmlFor="edit_qr_code" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <QrCode className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">QR Code</p>
                      <p className="text-xs text-muted-foreground">Generate a unique QR code for visitor check-in</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${newEntryMethod === "rfid" ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                  <RadioGroupItem value="rfid" id="edit_rfid" />
                  <Label htmlFor="edit_rfid" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Radio className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">RFID Tag</p>
                      <p className="text-xs text-muted-foreground">Assign an RFID tag for contactless access</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${newEntryMethod === "card" ? "border-purple-500 bg-purple-50" : "hover:bg-gray-50"}`}>
                  <RadioGroupItem value="card" id="edit_card" />
                  <Label htmlFor="edit_card" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Access Card</p>
                      <p className="text-xs text-muted-foreground">Issue a physical access card</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Conditional Input Fields */}
            {newEntryMethod === "rfid" && (
              <div className="space-y-2">
                <Label htmlFor="newRfidTag">RFID Tag Number</Label>
                <Input
                  id="newRfidTag"
                  placeholder="Enter RFID tag number..."
                  value={newRfidTag}
                  onChange={(e) => setNewRfidTag(e.target.value)}
                />
              </div>
            )}
            
            {newEntryMethod === "card" && (
              <div className="space-y-2">
                <Label htmlFor="newCardNumber">Card Number</Label>
                <Input
                  id="newCardNumber"
                  placeholder="Enter access card number..."
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccessMethodOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccessMethod} disabled={updateAccessMethod.isPending}>
              {updateAccessMethod.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
