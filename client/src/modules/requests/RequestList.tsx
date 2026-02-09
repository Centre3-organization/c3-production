import { useState, useMemo } from "react";
import { useAuth } from "@/utils/useAuth";
import { RequestComments } from "@/modules/approvals/RequestComments";
import { FormDataDisplay } from "@/modules/requests/FormDataDisplay";
import { 
  Download, 
  ChevronDown, 
  Settings,
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
  Phone as PhoneIcon,
  Edit2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

const typeLabels: Record<string, string> = {
  admin_visit: "Admin Visit",
  work_permit: "Work Permit",
  material_entry: "Material Entry",
  tep: "TEP",
  mop: "MOP",
  escort: "Escort",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Draft", icon: <FileText className="h-3 w-3" />, color: "text-[#6B6B6B] bg-[#F5F5F5]" },
  pending_l1: { label: "Pending L1", icon: <Clock className="h-3 w-3" />, color: "text-[#D97706] bg-[#FEF3C7]" },
  pending_manual: { label: "Pending Manual", icon: <AlertCircle className="h-3 w-3" />, color: "text-[#5B2C93] bg-[#E8DCF5]" },
  pending_approval: { label: "Pending Approval", icon: <Clock className="h-3 w-3" />, color: "text-[#D97706] bg-[#FEF3C7]" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-[#059669] bg-[#D1FAE5]" },
  rejected: { label: "Rejected", icon: <XCircle className="h-3 w-3" />, color: "text-[#FF6B6B] bg-[#FFE5E5]" },
  need_clarification: { label: "Need Clarification", icon: <MessageSquare className="h-3 w-3" />, color: "text-[#B45309] bg-[#FEF3C7]" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-3 w-3" />, color: "text-[#2C2C2C] bg-[#F5F5F5]" },
  expired: { label: "Expired", icon: <Clock className="h-3 w-3" />, color: "text-[#2C2C2C] bg-[#F5F5F5]" },
};

const entryMethodConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  qr_code: { label: "QR Code", icon: <QrCode className="h-4 w-4" />, color: "text-[#059669] bg-[#D1FAE5]" },
  rfid: { label: "RFID Tag", icon: <Radio className="h-4 w-4" />, color: "text-[#5B2C93] bg-[#E8DCF5]" },
  card: { label: "Access Card", icon: <CreditCard className="h-4 w-4" />, color: "text-[#5B2C93] bg-[#E8DCF5]" },
};

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  
  const [editAccessMethodOpen, setEditAccessMethodOpen] = useState(false);
  const [newEntryMethod, setNewEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [newRfidTag, setNewRfidTag] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [resendingChannel, setResendingChannel] = useState<string | null>(null);
  const [resubmitComment, setResubmitComment] = useState("");
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  
  const { data, isLoading, refetch } = trpc.requests.getAll.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    limit: 100,
  });
  
  const { data: requestDetail, isLoading: detailLoading, refetch: refetchDetail } = trpc.requests.getById.useQuery(
    { id: selectedRequest! },
    { enabled: !!selectedRequest }
  );
  
  const resubmitMutation = trpc.requests.resubmitAfterClarification.useMutation({
    onSuccess: () => {
      toast.success("Request re-submitted successfully");
      setResubmitDialogOpen(false);
      setResubmitComment("");
      refetch();
      refetchDetail();
    },
    onError: (error) => toast.error("Failed to re-submit", { description: error.message }),
  });

  const updateAccessMethod = trpc.requests.updateAccessMethod.useMutation({
    onSuccess: async (result: any) => {
      toast.success("Access method updated");
      if (result.entryMethod === "qr_code" && result.qrCodeData) {
        try {
          const qrDataUrl = await QRCode.toDataURL(result.qrCodeData, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
          setQrCodeImage(qrDataUrl);
        } catch (err) { console.error("Failed to generate QR code:", err); }
      }
      refetchDetail();
      setEditAccessMethodOpen(false);
    },
    onError: (error) => toast.error("Failed to update access method", { description: error.message }),
  });
  
  const requests = data?.requests || [];
  
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        req.requestNumber.toLowerCase().includes(query) ||
        req.visitorName.toLowerCase().includes(query) ||
        req.visitorCompany?.toLowerCase().includes(query) ||
        req.siteName?.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);
  
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
    if (newEntryMethod === "rfid" && !newRfidTag.trim()) { toast.error("Please enter the RFID tag number"); return; }
    if (newEntryMethod === "card" && !newCardNumber.trim()) { toast.error("Please enter the card number"); return; }
    updateAccessMethod.mutate({
      requestId: selectedRequest,
      entryMethod: newEntryMethod,
      rfidTag: newEntryMethod === "rfid" ? newRfidTag : undefined,
      cardNumber: newEntryMethod === "card" ? newCardNumber : undefined,
    });
  };
  
  const handleRegenerateQr = () => {
    if (!selectedRequest) return;
    updateAccessMethod.mutate({ requestId: selectedRequest, entryMethod: "qr_code", regenerateQr: true });
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
    try {
      const visitorEmail = requestDetail.visitorEmail;
      const visitorPhone = requestDetail.visitorPhone;
      const accessMethod = requestDetail.accessMethod;
      
      if (channel === "email") {
        if (!visitorEmail) { toast.error("No email address available"); setResendingChannel(null); return; }
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Access credentials sent via Email", { description: `Sent to ${visitorEmail}` });
      } else if (channel === "sms") {
        if (!visitorPhone) { toast.error("No phone number available"); setResendingChannel(null); return; }
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Access credentials sent via SMS", { description: `Sent to ${visitorPhone}` });
      } else if (channel === "whatsapp") {
        if (!visitorPhone) { toast.error("No phone number available"); setResendingChannel(null); return; }
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
        toast.success("WhatsApp opened");
      }
    } catch { toast.error("Failed to send credentials"); }
    finally { setResendingChannel(null); }
  };
  
  const generateQrImage = async (qrData: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      setQrCodeImage(qrDataUrl);
    } catch (err) { console.error("Failed to generate QR code:", err); }
  };
  
  if (requestDetail?.accessMethod?.qrCodeData && !qrCodeImage) {
    generateQrImage(requestDetail.accessMethod.qrCodeData);
  }

  const activeFilters = [
    ...(statusFilter !== "all" ? [{ key: "status", label: `Status: ${statusConfig[statusFilter]?.label || statusFilter}`, onRemove: () => setStatusFilter("all") }] : []),
    ...(typeFilter !== "all" ? [{ key: "type", label: `Type: ${typeLabels[typeFilter] || typeFilter}`, onRemove: () => setTypeFilter("all") }] : []),
  ];

  type RequestItem = typeof requests[number];

  const columns: FioriColumn<RequestItem>[] = [
    {
      key: "requestNumber", header: "Request ID", width: "140px",
      render: (req) => (
        <span className="font-mono text-sm font-medium text-[#5B2C93] cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req.id); setQrCodeImage(""); }}>
          {req.requestNumber}
        </span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (req) => {
        const status = statusConfig[req.status] || statusConfig.draft;
        return (
          <Badge variant="secondary" className={`${status.color} gap-1`}>
            {status.icon}
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "type", header: "Type",
      render: (req) => (
        <span className="text-xs font-medium text-[#6B6B6B] bg-[#F5F5F5] px-2 py-0.5 rounded">
          {typeLabels[req.type] || req.type}
        </span>
      ),
    },
    {
      key: "visitor", header: "Visitor",
      render: (req) => (
        <div>
          <span className="font-medium text-[#2C2C2C]">{req.visitorName}</span>
          {req.visitorCompany && <p className="text-xs text-[#6B6B6B] mt-0.5">{req.visitorCompany}</p>}
        </div>
      ),
    },
    {
      key: "site", header: "Site",
      render: (req) => <span className="text-[#6B6B6B]">{req.siteName || "—"}</span>,
    },
    {
      key: "dateRange", header: "Date Range",
      render: (req) => (
        <span className="text-xs text-[#6B6B6B]">{req.startDate} → {req.endDate}</span>
      ),
    },
    {
      key: "created", header: "Created",
      render: (req) => (
        <span className="text-xs text-[#6B6B6B]">
          {req.createdAt ? format(new Date(req.createdAt), "MMM dd, yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "actions", header: "", width: "50px", align: "right",
      render: (req) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#B0B0B0] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req.id); setQrCodeImage(""); }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-0">
      <FioriPageHeader
        title="Requests"
        subtitle="Manage and track all access requests"
        icon={<FileText className="h-5 w-5" />}
        count={filteredRequests.length}
        onRefresh={() => refetch()}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Export feature coming soon")} className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Link href="/requests/new">
              <Button size="sm" className="gap-1.5 bg-[#5B2C93] hover:bg-[#3D1C5E]">
                <Plus className="h-4 w-4" /> New Request
              </Button>
            </Link>
          </>
        }
      />

      <FioriFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by request number, visitor, or company..."
        activeFilters={activeFilters}
        onClearAll={() => { setStatusFilter("all"); setTypeFilter("all"); }}
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="mt-4">
        <FioriTable
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          rowKey={(req) => req.id}
          emptyIcon={<FileText className="h-10 w-10" />}
          emptyTitle="No requests found"
          emptyDescription="Try adjusting your filters or create a new request."
          footerInfo={`Showing ${filteredRequests.length} of ${requests.length} requests`}
        />
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setQrCodeImage(""); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B2C93]" />
              Request Details
            </DialogTitle>
            <DialogDescription>{requestDetail?.requestNumber}</DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
            </div>
          ) : requestDetail ? (
            <div className="space-y-5">
              {/* Status & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`${statusConfig[requestDetail.status]?.color} gap-1 text-sm px-3 py-1`}>
                    {statusConfig[requestDetail.status]?.icon}
                    {statusConfig[requestDetail.status]?.label}
                  </Badge>
                  <span className="text-xs font-medium text-[#6B6B6B] bg-[#F5F5F5] px-2 py-0.5 rounded">
                    {typeLabels[requestDetail.type] || requestDetail.type}
                  </span>
                </div>
                {requestDetail.status === "draft" && (
                  <Link href={`/requests/${requestDetail.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2 border-[#E0E0E0]">
                      <Edit2 className="h-4 w-4" /> Edit Draft
                    </Button>
                  </Link>
                )}
                {requestDetail.status === "need_clarification" && (
                  <Button variant="outline" size="sm" className="gap-2 border-[#B45309] text-[#B45309]" onClick={() => setResubmitDialogOpen(true)}>
                    <Send className="h-4 w-4" /> Respond & Re-submit
                  </Button>
                )}
              </div>

              {/* Need Clarification Banner */}
              {requestDetail.status === "need_clarification" && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2 text-[#B45309]">
                    <MessageSquare className="h-4 w-4" /> Clarification Requested
                  </h4>
                  <p className="text-sm text-[#92400E]">
                    An approver has requested clarification on this request. Please review the comments below and respond to re-submit your request.
                  </p>
                </div>
              )}
              
              {/* Access Method Section */}
              {requestDetail.status === "approved" && (
                <div className="bg-[#E8F9F8] border border-[#4ECDC4] rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2 text-[#0D9488]">
                      <Shield className="h-4 w-4" /> Access Method
                    </h4>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={handleOpenAccessMethodEdit} className="border-[#4ECDC4] text-[#0D9488]">
                        <Settings className="h-4 w-4 mr-2" /> Change Method
                      </Button>
                    )}
                  </div>
                  
                  {requestDetail.accessMethod?.entryMethod ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`${entryMethodConfig[requestDetail.accessMethod.entryMethod]?.color} gap-2 text-sm px-3 py-2`}>
                          {entryMethodConfig[requestDetail.accessMethod.entryMethod]?.icon}
                          {entryMethodConfig[requestDetail.accessMethod.entryMethod]?.label}
                        </Badge>
                        {requestDetail.accessMethod.accessGrantedByName && (
                          <span className="text-sm text-[#6B6B6B]">Granted by {requestDetail.accessMethod.accessGrantedByName}</span>
                        )}
                      </div>
                      
                      {requestDetail.accessMethod.entryMethod === "qr_code" && requestDetail.accessMethod.qrCodeData && (
                        <div className="flex items-start gap-4 p-3 bg-white rounded-lg border border-[#E0E0E0]">
                          {qrCodeImage && <img src={qrCodeImage} alt="Access QR Code" className="w-32 h-32" />}
                          <div className="flex-1 space-y-2">
                            <div>
                              <Label className="text-xs text-[#6B6B6B]">QR Code Data</Label>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono bg-[#F5F5F5] px-2 py-1 rounded">{requestDetail.accessMethod.qrCodeData}</code>
                                <Button variant="ghost" size="sm" onClick={handleCopyQrData}><Copy className="h-4 w-4" /></Button>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button variant="outline" size="sm" onClick={handleRegenerateQr} className="border-[#E0E0E0]">
                                <RotateCcw className="h-4 w-4 mr-2" /> Regenerate QR
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {requestDetail.accessMethod.entryMethod === "rfid" && requestDetail.accessMethod.rfidTag && (
                        <div className="p-3 bg-white rounded-lg border border-[#E0E0E0]">
                          <Label className="text-xs text-[#6B6B6B]">RFID Tag Number</Label>
                          <p className="font-mono text-sm">{requestDetail.accessMethod.rfidTag}</p>
                        </div>
                      )}
                      
                      {requestDetail.accessMethod.entryMethod === "card" && requestDetail.accessMethod.cardNumber && (
                        <div className="p-3 bg-white rounded-lg border border-[#E0E0E0]">
                          <Label className="text-xs text-[#6B6B6B]">Card Number</Label>
                          <p className="font-mono text-sm">{requestDetail.accessMethod.cardNumber}</p>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-[#4ECDC4]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#0D9488]">Send access credentials to visitor</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 border-[#E0E0E0]" disabled={!!resendingChannel}>
                                {resendingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {resendingChannel ? "Sending..." : "Resend"}
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendCredentials("email")} className="gap-2"><Mail className="h-4 w-4" /> Send via Email</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendCredentials("sms")} className="gap-2"><MessageSquare className="h-4 w-4" /> Send via SMS</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendCredentials("whatsapp")} className="gap-2"><PhoneIcon className="h-4 w-4" /> Send via WhatsApp</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-[#6B6B6B] mb-3">No access method assigned yet</p>
                      <Button variant="outline" size="sm" onClick={handleOpenAccessMethodEdit}>Assign Access Method</Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Visitor Info */}
              <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                  <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#5B2C93]" /> Visitor Information
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#6B6B6B] text-xs">Name</span><p className="font-medium text-[#2C2C2C]">{requestDetail.visitorName}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">Company</span><p className="font-medium text-[#2C2C2C]">{requestDetail.visitorCompany || "—"}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">ID Type</span><p className="font-medium text-[#2C2C2C] capitalize">{requestDetail.visitorIdType?.replace("_", " ")}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">ID Number</span><p className="font-medium text-[#2C2C2C]">{requestDetail.visitorIdNumber}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">Phone</span><p className="font-medium text-[#2C2C2C]">{requestDetail.visitorPhone || "—"}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">Email</span><p className="font-medium text-[#2C2C2C]">{requestDetail.visitorEmail || "—"}</p></div>
                </div>
              </div>
              
              {/* Visit Details */}
              <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                  <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[#5B2C93]" /> Visit Details
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#6B6B6B] text-xs">Site</span><p className="font-medium text-[#2C2C2C]">{requestDetail.siteName || "—"}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">Date Range</span><p className="font-medium text-[#2C2C2C]">{requestDetail.startDate} → {requestDetail.endDate}</p></div>
                  <div><span className="text-[#6B6B6B] text-xs">Time</span><p className="font-medium text-[#2C2C2C]">{requestDetail.startTime || "00:00"} — {requestDetail.endTime || "23:59"}</p></div>
                </div>
                {requestDetail.purpose && (
                  <div className="px-4 pb-4">
                    <span className="text-[#6B6B6B] text-xs">Purpose</span>
                    <p className="text-sm mt-1 text-[#2C2C2C]">{requestDetail.purpose}</p>
                  </div>
                )}
              </div>
              
              {/* Zones */}
              {requestDetail.zones && requestDetail.zones.length > 0 && (
                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide">Requested Zones</h4>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {requestDetail.zones.map((zone: any) => (
                      <Badge key={zone.id} variant="outline" className="gap-1 border-[#E0E0E0]">
                        {zone.name} <span className="text-xs text-[#6B6B6B]">({zone.securityLevel})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dynamic Form Data */}
              {requestDetail.formData && requestDetail.selectedTypeIds && (
                <FormDataDisplay
                  formData={requestDetail.formData as Record<string, any>}
                  selectedTypeIds={requestDetail.selectedTypeIds as number[]}
                  categoryId={requestDetail.categoryId}
                  compact={true}
                />
              )}
              
              {/* Download Form PDF (only for approved requests) */}
              {requestDetail.status === "approved" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-[#5B2C93] hover:bg-[#E8DCF5] border-[#E0E0E0]"
                    onClick={() => {
                      const token = localStorage.getItem("centre3_token");
                      const url = `/api/forms/pdf/${requestDetail.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <FileText className="h-4 w-4" /> Download Form PDF
                  </Button>
                </div>
              )}
              
              {/* Comments Section */}
              {requestDetail.id && (
                <div className="pt-2">
                  <RequestComments requestId={requestDetail.id} />
                </div>
              )}
              
              {/* Approval History */}
              {requestDetail.approvals && requestDetail.approvals.length > 0 && (
                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-[#5B2C93]" /> Approval History
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {requestDetail.approvals.map((approval: any) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-[#6B6B6B] bg-[#F5F5F5] px-2 py-0.5 rounded uppercase">{approval.stage}</span>
                          <span className="text-sm text-[#2C2C2C]">{approval.approverName || "Pending"}</span>
                        </div>
                        <FioriStatusBadge status={approval.status} />
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
            <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#5B2C93]" /> Change Access Method</DialogTitle>
            <DialogDescription>Update the access method for this approved request</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Entry Method</Label>
              <RadioGroup value={newEntryMethod} onValueChange={(v) => setNewEntryMethod(v as any)} className="grid gap-3">
                {[
                  { value: "qr_code", label: "QR Code", desc: "Generate a unique QR code for visitor check-in", icon: <QrCode className="h-5 w-5 text-[#0D9488]" />, bg: "bg-[#E8F9F8]", activeBorder: "border-[#4ECDC4] bg-[#E8F9F8]" },
                  { value: "rfid", label: "RFID Tag", desc: "Assign an RFID tag for contactless access", icon: <Radio className="h-5 w-5 text-[#5B2C93]" />, bg: "bg-[#E8DCF5]", activeBorder: "border-[#5B2C93] bg-[#E8DCF5]" },
                  { value: "card", label: "Access Card", desc: "Issue a physical access card", icon: <CreditCard className="h-5 w-5 text-[#5B2C93]" />, bg: "bg-[#E8DCF5]", activeBorder: "border-[#5B2C93] bg-[#E8DCF5]" },
                ].map((method) => (
                  <div key={method.value} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${newEntryMethod === method.value ? method.activeBorder : "border-[#E0E0E0] hover:bg-[#FAFAFA]"}`}>
                    <RadioGroupItem value={method.value} id={`edit_${method.value}`} />
                    <Label htmlFor={`edit_${method.value}`} className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className={`p-2 ${method.bg} rounded-lg`}>{method.icon}</div>
                      <div>
                        <p className="font-medium text-[#2C2C2C]">{method.label}</p>
                        <p className="text-xs text-[#6B6B6B]">{method.desc}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {newEntryMethod === "rfid" && (
              <div className="space-y-1.5">
                <Label htmlFor="newRfidTag" className="text-sm">RFID Tag Number</Label>
                <Input id="newRfidTag" placeholder="Enter RFID tag number..." value={newRfidTag} onChange={(e) => setNewRfidTag(e.target.value)} />
              </div>
            )}
            
            {newEntryMethod === "card" && (
              <div className="space-y-1.5">
                <Label htmlFor="newCardNumber" className="text-sm">Card Number</Label>
                <Input id="newCardNumber" placeholder="Enter access card number..." value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccessMethodOpen(false)} className="border-[#E0E0E0]">Cancel</Button>
            <Button onClick={handleSaveAccessMethod} disabled={updateAccessMethod.isPending} className="bg-[#5B2C93] hover:bg-[#3D1C5E]">
              {updateAccessMethod.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-submit After Clarification Dialog */}
      <Dialog open={resubmitDialogOpen} onOpenChange={setResubmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#B45309]" /> Respond & Re-submit</DialogTitle>
            <DialogDescription>Provide your response to the clarification request and re-submit for approval</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Response</Label>
              <Textarea
                placeholder="Provide your clarification response..."
                value={resubmitComment}
                onChange={(e) => setResubmitComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResubmitDialogOpen(false); setResubmitComment(""); }} className="border-[#E0E0E0]">Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedRequest) return;
                if (!resubmitComment.trim()) { toast.error("Please provide a response"); return; }
                resubmitMutation.mutate({ requestId: selectedRequest, comments: resubmitComment });
              }}
              disabled={resubmitMutation.isPending || !resubmitComment.trim()}
              className="bg-[#B45309] hover:bg-[#92400E] text-white"
            >
              {resubmitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Re-submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
