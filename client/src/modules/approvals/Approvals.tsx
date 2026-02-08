import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  User,
  Building2,
  Calendar,
  MapPin,
  Shield,
  ChevronRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
  Zap,
  ArrowUpRight,
  GitBranch,
  History,
  ClipboardCheck,
  Eye,
  CheckCheck,
  Send,
  QrCode,
  CreditCard,
  Radio,
  Download,
  Copy,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { RequestComments } from "./RequestComments";
import { format } from "date-fns";
import QRCode from "qrcode";

const typeLabels: Record<string, string> = {
  admin_visit: "Admin Visit",
  work_permit: "Work Permit",
  material_entry: "Material Entry",
  tep: "TEP",
  mop: "MOP",
  escort: "Escort",
};

const typeColors: Record<string, string> = {
  admin_visit: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  work_permit: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  material_entry: "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]",
  tep: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]/20",
  mop: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  escort: "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]",
};

// Dynamic stage badge colors - cycles through for any number of stages
const stageColors = [
  "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]/30",
  "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
];

function getStageColor(stageOrder: number): string {
  return stageColors[(stageOrder - 1) % stageColors.length];
}

export default function Approvals() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Unified action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "clarification" | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [clarificationTarget, setClarificationTarget] = useState<"last_approver" | "requestor">("requestor");
  
  // Access grant dialog state (for final approval)
  const [accessGrantDialogOpen, setAccessGrantDialogOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [rfidTag, setRfidTag] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  
  // QR Code result state
  const [qrResultDialogOpen, setQrResultDialogOpen] = useState(false);
  const [generatedQrCode, setGeneratedQrCode] = useState<string>("");
  const [generatedQrData, setGeneratedQrData] = useState<string>("");
  const [qrRequestId, setQrRequestId] = useState<number | null>(null);
  
  // Use the workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: approvalStats } = trpc.requests.getApprovalStats.useQuery();
  
  // Use the workflow-based approval mutation
  const approveTask = trpc.requests.approveTask.useMutation({
    onSuccess: async (result: any) => {
      // Check if this was a final approval with QR code
      if (result.isFinalApproval && result.entryMethod === "qr_code" && result.qrCodeData) {
        // Save the request ID before resetAllDialogs clears selectedRequest
        if (result.requestId) {
          setQrRequestId(result.requestId);
        } else if (selectedRequest?.request?.id) {
          setQrRequestId(selectedRequest.request.id);
        }
        // Generate QR code image
        try {
          const qrDataUrl = await QRCode.toDataURL(result.qrCodeData, {
            width: 300,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" }
          });
          setGeneratedQrCode(qrDataUrl);
          setGeneratedQrData(result.qrCodeData);
          setQrResultDialogOpen(true);
        } catch (err) {
          console.error("Failed to generate QR code image:", err);
        }
        toast.success("Request fully approved", {
          description: "QR code has been generated for access"
        });
      } else {
        toast.success("Request approved", {
          description: result.message || "Moved to next approval stage"
        });
      }
      refetch();
      resetAllDialogs();
    },
    onError: (error) => {
      toast.error("Failed to approve", { description: error.message });
      setProcessingId(null);
    }
  });
  
  // Use the workflow-based rejection mutation
  const rejectTask = trpc.requests.rejectTask.useMutation({
    onSuccess: () => {
      toast.error("Request rejected");
      refetch();
      resetAllDialogs();
    },
    onError: (error) => {
      toast.error("Failed to reject", { description: error.message });
      setProcessingId(null);
    }
  });
  
  // Need clarification mutation
  const needClarification = trpc.requests.needClarification.useMutation({
    onSuccess: (result) => {
      toast.info("Clarification requested", {
        description: result.message
      });
      refetch();
      resetAllDialogs();
    },
    onError: (error) => {
      toast.error("Failed to request clarification", { description: error.message });
      setProcessingId(null);
    }
  });
  
  const resetAllDialogs = () => {
    setSelectedRequest(null);
    setProcessingId(null);
    setActionDialogOpen(false);
    setActionType(null);
    setActionComments("");
    setClarificationTarget("requestor");
    setAccessGrantDialogOpen(false);
    setEntryMethod("qr_code");
    setRfidTag("");
    setCardNumber("");
    setDetailsDialogOpen(false);
  };
  
  // Group tasks by stage name for dynamic stats
  const tasksByStage = (pendingTasks || []).reduce((acc: Record<string, { count: number; order: number }>, task: any) => {
    const stageName = task.stageName || `Stage ${task.stageOrder}`;
    if (!acc[stageName]) {
      acc[stageName] = { count: 0, order: task.stageOrder || 1 };
    }
    acc[stageName].count++;
    return acc;
  }, {});
  
  // Get unique stages sorted by order
  const uniqueStages = Object.entries(tasksByStage)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name, data]) => ({ name, ...data }));
  
  // Get unique types and sites for filters
  const uniqueTypes = Array.from(new Set((pendingTasks || []).map((t: any) => t.request?.type).filter(Boolean))) as string[];
  const uniqueSites = Array.from(new Set((pendingTasks || []).map((t: any) => t.request?.siteName).filter(Boolean))) as string[];
  
  // Filter by search, stage, type, and site
  const filteredTasks = (pendingTasks || []).filter((task: any) => {
    // Stage filter
    if (stageFilter !== "all") {
      const taskStageName = task.stageName || `Stage ${task.stageOrder}`;
      if (taskStageName !== stageFilter) return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && task.request?.type !== typeFilter) return false;
    
    // Site filter
    if (siteFilter !== "all" && task.request?.siteName !== siteFilter) return false;
    
    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.request?.requestNumber?.toLowerCase().includes(query) ||
      task.request?.visitorName?.toLowerCase().includes(query) ||
      task.request?.visitorCompany?.toLowerCase().includes(query) ||
      task.stageName?.toLowerCase().includes(query)
    );
  });
  
  // Check if this is the final stage
  const isFinalStage = (task: any) => {
    if (!task || task.stageOrder == null || task.totalStages == null) return false;
    return task.stageOrder === task.totalStages;
  };
  
  // Open action dialog
  const openActionDialog = (task: any, type: "approve" | "reject" | "clarification") => {
    setSelectedRequest(task);
    setActionType(type);
    setActionComments("");
    setClarificationTarget("requestor");
    
    // For final stage approval, show access grant dialog instead
    if (type === "approve" && isFinalStage(task)) {
      setAccessGrantDialogOpen(true);
    } else {
      setActionDialogOpen(true);
    }
  };
  
  const handleActionConfirm = () => {
    if (!selectedRequest) return;
    
    if (actionType === "approve") {
      setProcessingId(selectedRequest.taskId);
      approveTask.mutate({ 
        taskId: selectedRequest.taskId,
        comments: actionComments || undefined
      });
    } else if (actionType === "reject") {
      if (!actionComments.trim()) {
        toast.error("Rejection reason is required");
        return;
      }
      setProcessingId(selectedRequest.taskId);
      rejectTask.mutate({ 
        taskId: selectedRequest.taskId, 
        comments: actionComments 
      });
    } else if (actionType === "clarification") {
      if (!actionComments.trim()) {
        toast.error("Please specify what clarification is needed");
        return;
      }
      setProcessingId(selectedRequest.taskId);
      needClarification.mutate({
        taskId: selectedRequest.taskId,
        comments: actionComments,
        target: clarificationTarget
      });
    }
  };
  
  const handleFinalApprove = () => {
    if (!selectedRequest) return;
    
    // Validate based on entry method
    if (entryMethod === "rfid" && !rfidTag.trim()) {
      toast.error("Please enter the RFID tag number");
      return;
    }
    if (entryMethod === "card" && !cardNumber.trim()) {
      toast.error("Please enter the card number");
      return;
    }
    
    setProcessingId(selectedRequest.taskId);
    approveTask.mutate({
      taskId: selectedRequest.taskId,
      comments: actionComments || `Final approval - Access granted via ${entryMethod.replace("_", " ")}`,
      entryMethod: entryMethod,
      rfidTag: entryMethod === "rfid" ? rfidTag : undefined,
      cardNumber: entryMethod === "card" ? cardNumber : undefined,
      isFinalApproval: true,
    });
  };
  
  const handleViewDetails = (task: any) => {
    setSelectedRequest(task);
    setDetailsDialogOpen(true);
  };
  
  const handleCopyQrData = () => {
    navigator.clipboard.writeText(generatedQrData);
    toast.success("QR code data copied to clipboard");
  };
  
  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.download = `access-qr-${generatedQrData}.png`;
    link.href = generatedQrCode;
    link.click();
  };
  
  const handleDownloadPdf = (requestId: number) => {
    // Open the PDF in a new tab for print/download
    const token = localStorage.getItem("centre3_token");
    const url = `/api/forms/pdf/${requestId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  };
  
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);

  // Stage progress component
  const StageProgress = ({ currentStage, totalStages, stageName }: { currentStage: number; totalStages: number; stageName: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalStages }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < currentStage ? "bg-[#E8F9F8]" : i === currentStage - 1 ? "bg-[#FFF4E5]" : "bg-[#E0E0E0]"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-[#6B6B6B]">
        {currentStage}/{totalStages}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{t("approvals.title", "My Approvals")}</h1>
          <p className="text-sm text-[#6B6B6B]">{t("approvals.subtitle", "Review and process pending approval requests")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Stats Cards - Dynamic based on stages */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#5B2C93]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.totalPending", "Total Pending")}</p>
                <p className="text-2xl font-medium">{pendingTasks?.length || 0}</p>
              </div>
              <div className="p-2 bg-[#E8DCF5] rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-[#5B2C93]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {uniqueStages.slice(0, 3).map((stage, index) => (
          <Card key={stage.name} className={`border-l-4 ${index === 0 ? "border-l-amber-500" : index === 1 ? "border-l-purple-500" : "border-l-emerald-500"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase">{stage.name}</p>
                  <p className="text-2xl font-medium">{stage.count}</p>
                </div>
                <div className={`p-2 rounded-lg ${index === 0 ? "bg-[#FFF4E5]" : index === 1 ? "bg-[#E8DCF5]" : "bg-[#E8F9F8]"}`}>
                  <GitBranch className={`h-5 w-5 ${index === 0 ? "text-[#FFB84D]" : index === 1 ? "text-[#5B2C93]" : "text-[#4ECDC4]"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input
            placeholder={t("approvals.searchPlaceholder", "Search by request number, visitor, or company...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("approvals.filterByStage", "All Stages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("approvals.allStages", "All Stages")}</SelectItem>
            {uniqueStages.filter((stage) => stage.name).map((stage) => (
              <SelectItem key={stage.name} value={stage.name}>
                {stage.name} ({stage.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <FileText className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("approvals.filterByType", "All Types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("approvals.allTypes", "All Types")}</SelectItem>
            {uniqueTypes.filter((type) => type).map((type) => (
              <SelectItem key={type} value={type}>
                {typeLabels[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[180px]">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("approvals.filterBySite", "All Sites")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("approvals.allSites", "All Sites")}</SelectItem>
            {uniqueSites.filter((site) => site).map((site) => (
              <SelectItem key={site} value={site}>
                {site}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6B6B6B]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCheck className="h-12 w-12 text-[#4ECDC4] mb-4" />
            <h3 className="text-lg font-medium">{t("approvals.noPending", "No Pending Approvals")}</h3>
            <p className="text-sm text-[#6B6B6B]">{t("approvals.noPendingDesc", "You're all caught up! Check back later for new requests.")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <Card key={task.taskId} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(task)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left side - Request info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-medium">{task.request?.requestNumber}</span>
                      <Badge variant="outline" className={typeColors[task.request?.type] || "bg-[#F5F5F5]"}>
                        {typeLabels[task.request?.type] || task.request?.type}
                      </Badge>
                      <Badge variant="outline" className={getStageColor(task.stageOrder || 1)}>
                        {task.stageName || `Stage ${task.stageOrder}`}
                      </Badge>
                      <StageProgress 
                        currentStage={task.stageOrder || 1} 
                        totalStages={task.totalStages || 1}
                        stageName={task.stageName}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {task.request?.visitorName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {task.request?.visitorCompany || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {task.request?.siteName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {task.request?.startDate ? format(new Date(task.request.startDate), "MMM d") : "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(task);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#FFB84D] hover:text-[#FFB84D] hover:bg-[#FFF4E5]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionDialog(task, "clarification");
                      }}
                      disabled={processingId === task.taskId}
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      {t("approvals.needClarification", "Clarify")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionDialog(task, "reject");
                      }}
                      disabled={processingId === task.taskId}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("common.reject", "Reject")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#4ECDC4] hover:bg-[#3DBDB4] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionDialog(task, "approve");
                      }}
                      disabled={processingId === task.taskId}
                    >
                      {processingId === task.taskId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      )}
                      {isFinalStage(task) ? t("approvals.grantAccess", "Grant Access") : t("common.approve", "Approve")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unified Action Dialog (Approve/Reject/Clarification) */}
      <Dialog open={actionDialogOpen} onOpenChange={(open) => {
        if (!open) resetAllDialogs();
        else setActionDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              actionType === "approve" ? "text-[#4ECDC4]" : 
              actionType === "reject" ? "text-[#FF6B6B]" : 
              "text-[#FFB84D]"
            }`}>
              {actionType === "approve" && <CheckCircle2 className="h-5 w-5" />}
              {actionType === "reject" && <XCircle className="h-5 w-5" />}
              {actionType === "clarification" && <HelpCircle className="h-5 w-5" />}
              {actionType === "approve" && t("approvals.approveRequest", "Approve Request")}
              {actionType === "reject" && t("approvals.rejectRequest", "Reject Request")}
              {actionType === "clarification" && t("approvals.needClarificationTitle", "Request Clarification")}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && t("approvals.approveDescription", "Add optional comments for this approval.")}
              {actionType === "reject" && t("approvals.rejectDescription", "Please provide a reason for rejecting this request. This is mandatory and will be visible to the requestor.")}
              {actionType === "clarification" && t("approvals.clarificationDescription", "Specify what information you need and who should provide it.")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Summary */}
              <div className="p-3 bg-[#F5F5F5] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-medium">{selectedRequest.request?.requestNumber}</span>
                  <Badge variant="outline" className={getStageColor(selectedRequest.stageOrder || 1)}>
                    {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}
                  </Badge>
                </div>
                <p className="text-sm text-[#6B6B6B]">
                  {selectedRequest.request?.visitorName} • {selectedRequest.request?.visitorCompany}
                </p>
              </div>
              
              {/* Clarification Target Selection */}
              {actionType === "clarification" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t("approvals.sendClarificationTo", "Send clarification request to:")}</Label>
                  <RadioGroup value={clarificationTarget} onValueChange={(v) => setClarificationTarget(v as any)} className="grid gap-3">
                    <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${clarificationTarget === "requestor" ? "border-[#FFB84D] bg-[#FFF4E5]" : "hover:bg-[#F5F5F5]"}`}>
                      <RadioGroupItem value="requestor" id="requestor" />
                      <Label htmlFor="requestor" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="p-2 bg-[#FFF4E5] rounded-lg">
                          <User className="h-5 w-5 text-[#FFB84D]" />
                        </div>
                        <div>
                          <p className="font-medium">{t("approvals.requestor", "Requestor")}</p>
                          <p className="text-xs text-[#6B6B6B]">{t("approvals.requestorDesc", "Send back to the person who submitted this request")}</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${clarificationTarget === "last_approver" ? "border-[#5B2C93] bg-[#E8DCF5]" : "hover:bg-[#F5F5F5]"}`}>
                      <RadioGroupItem value="last_approver" id="last_approver" />
                      <Label htmlFor="last_approver" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="p-2 bg-[#E8DCF5] rounded-lg">
                          <UserCheck className="h-5 w-5 text-[#5B2C93]" />
                        </div>
                        <div>
                          <p className="font-medium">{t("approvals.lastApprover", "Last Approver")}</p>
                          <p className="text-xs text-[#6B6B6B]">{t("approvals.lastApproverDesc", "Send back to the previous stage approver")}</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {/* Comments Field */}
              <div className="space-y-2">
                <Label>
                  {actionType === "approve" && <>{t("approvals.comments", "Comments")} ({t("common.optional", "Optional")})</>}
                  {actionType === "reject" && <>{t("approvals.rejectionReason", "Rejection Reason")} <span className="text-[#FF6B6B]">*</span></>}
                  {actionType === "clarification" && <>{t("approvals.clarificationDetails", "What clarification do you need?")} <span className="text-[#FF6B6B]">*</span></>}
                </Label>
                <Textarea
                  placeholder={
                    actionType === "approve" ? t("approvals.approveCommentsPlaceholder", "Add any notes about this approval...") :
                    actionType === "reject" ? t("approvals.rejectReasonPlaceholder", "Enter rejection reason...") :
                    t("approvals.clarificationPlaceholder", "Describe what information or documents you need...")
                  }
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  rows={4}
                  className={actionType !== "approve" && !actionComments.trim() ? "border-[#FF6B6B]" : ""}
                />
                {actionType !== "approve" && !actionComments.trim() && (
                  <p className="text-xs text-[#FF6B6B]">{t("common.required", "This field is required")}</p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => resetAllDialogs()}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button 
              className={
                actionType === "approve" ? "bg-[#4ECDC4] hover:bg-[#3DBDB4] text-white" :
                actionType === "reject" ? "bg-[#FF6B6B] hover:bg-[#FF6B6B] text-white" :
                "bg-[#FFB84D] hover:bg-[#FFB84D] text-white"
              }
              onClick={handleActionConfirm}
              disabled={processingId !== null || (actionType !== "approve" && !actionComments.trim())}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  {actionType === "approve" && <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {actionType === "reject" && <XCircle className="h-4 w-4 mr-2" />}
                  {actionType === "clarification" && <Send className="h-4 w-4 mr-2" />}
                </>
              )}
              {actionType === "approve" && t("approvals.confirmApprove", "Confirm Approval")}
              {actionType === "reject" && t("approvals.confirmReject", "Confirm Rejection")}
              {actionType === "clarification" && t("approvals.sendClarification", "Send Clarification Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Grant Dialog - For Final Approval */}
      <Dialog open={accessGrantDialogOpen} onOpenChange={(open) => {
        if (!open) resetAllDialogs();
        else setAccessGrantDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4ECDC4]">
              <Shield className="h-5 w-5" />
              {t("approvals.grantAccessTitle", "Grant Access")}
            </DialogTitle>
            <DialogDescription>
              {t("approvals.grantAccessDescription", "This is the final approval stage. Select how the visitor will gain access to the facility.")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="p-3 bg-[#F5F5F5] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-medium">{selectedRequest.request?.requestNumber}</span>
                  <Badge variant="outline" className="bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]">
                    Final Stage
                  </Badge>
                </div>
                <p className="text-sm text-[#6B6B6B]">
                  {selectedRequest.request?.visitorName} • {selectedRequest.request?.visitorCompany}
                </p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {selectedRequest.request?.siteName} • {selectedRequest.request?.startDate} - {selectedRequest.request?.endDate}
                </p>
              </div>
              
              {/* Entry Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("approvals.selectEntryMethod", "Select Entry Method")}</Label>
                <RadioGroup value={entryMethod} onValueChange={(v) => setEntryMethod(v as any)} className="grid gap-3">
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "qr_code" ? "border-[#4ECDC4] bg-[#E8F9F8]" : "hover:bg-[#F5F5F5]"}`}>
                    <RadioGroupItem value="qr_code" id="qr_code" />
                    <Label htmlFor="qr_code" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-[#E8F9F8] rounded-lg">
                        <QrCode className="h-5 w-5 text-[#4ECDC4]" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.qrCode", "QR Code")}</p>
                        <p className="text-xs text-[#6B6B6B]">{t("approvals.qrCodeDesc", "Generate a unique QR code for visitor check-in")}</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "rfid" ? "border-[#5B2C93] bg-[#E8DCF5]" : "hover:bg-[#F5F5F5]"}`}>
                    <RadioGroupItem value="rfid" id="rfid" />
                    <Label htmlFor="rfid" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-[#E8DCF5] rounded-lg">
                        <Radio className="h-5 w-5 text-[#5B2C93]" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.rfid", "RFID Tag")}</p>
                        <p className="text-xs text-[#6B6B6B]">{t("approvals.rfidDesc", "Assign an RFID tag for contactless access")}</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "card" ? "border-[#5B2C93] bg-[#E8DCF5]" : "hover:bg-[#F5F5F5]"}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-[#E8DCF5] rounded-lg">
                        <CreditCard className="h-5 w-5 text-[#5B2C93]" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.accessCard", "Access Card")}</p>
                        <p className="text-xs text-[#6B6B6B]">{t("approvals.accessCardDesc", "Issue a physical access card")}</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Conditional Input Fields */}
              {entryMethod === "rfid" && (
                <div className="space-y-2">
                  <Label htmlFor="rfidTag">{t("approvals.rfidTagNumber", "RFID Tag Number")}</Label>
                  <Input
                    id="rfidTag"
                    placeholder={t("approvals.rfidTagPlaceholder", "Enter RFID tag number...")}
                    value={rfidTag}
                    onChange={(e) => setRfidTag(e.target.value)}
                  />
                </div>
              )}
              
              {entryMethod === "card" && (
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">{t("approvals.cardNumber", "Card Number")}</Label>
                  <Input
                    id="cardNumber"
                    placeholder={t("approvals.cardNumberPlaceholder", "Enter access card number...")}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
              )}
              
              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">{t("approvals.comments", "Comments")} ({t("common.optional", "Optional")})</Label>
                <Textarea
                  id="comments"
                  placeholder={t("approvals.commentsPlaceholder", "Add any notes about this approval...")}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => resetAllDialogs()}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button 
              className="bg-[#4ECDC4] hover:bg-[#3DBDB4] text-white"
              onClick={handleFinalApprove}
              disabled={processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {t("approvals.approveAndGrant", "Approve & Grant Access")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Granted Confirmation Dialog */}
      <Dialog open={qrResultDialogOpen} onOpenChange={setQrResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4ECDC4]">
              <CheckCircle2 className="h-5 w-5" />
              {t("approvals.accessGranted", "Access Granted")}
            </DialogTitle>
            <DialogDescription>
              {t("approvals.accessGrantedDesc", "The request has been fully approved and access credentials have been generated.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#E8F9F8] flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-[#4ECDC4]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#2C2C2C]">{t("approvals.accessCredentialsReady", "Access credentials have been generated successfully.")}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">{t("approvals.downloadPdfToShare", "Download the form PDF to share with the visitor.")}</p>
            </div>
            
            {generatedQrData && (
              <div className="w-full p-3 bg-[#F5F5F5] rounded-lg">
                <Label className="text-xs text-[#6B6B6B]">{t("approvals.accessCode", "Access Code")}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border truncate">
                    {generatedQrData}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopyQrData}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            {(qrRequestId || selectedRequest?.request?.id) && (
              <Button 
                variant="outline" 
                onClick={() => handleDownloadPdf(qrRequestId || selectedRequest?.request?.id)} 
                className="gap-2 text-[#5B2C93] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
              >
                <FileText className="h-4 w-4" />
                {t("approvals.downloadPdf", "Download Form PDF")}
              </Button>
            )}
            <Button onClick={() => { setQrResultDialogOpen(false); setQrRequestId(null); }}>
              {t("common.done", "Done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B2C93]" />
              {t("approvals.requestDetails", "Request Details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Header info */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-[#5B2C93]/20">
                <div>
                  <span className="font-mono text-xl font-medium text-[#2C2C2C]">{selectedRequest.request?.requestNumber}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={typeColors[selectedRequest.request?.type] || "bg-[#F5F5F5]"}>
                      {typeLabels[selectedRequest.request?.type] || selectedRequest.request?.type}
                    </Badge>
                    <Badge variant="outline" className={getStageColor(selectedRequest.stageOrder || 1)}>
                      {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}
                      {isFinalStage(selectedRequest) && " (Final)"}
                    </Badge>
                    <Badge variant="outline" className="bg-[#F5F5F5] text-[#2C2C2C]">
                      {selectedRequest.request?.status?.replace(/_/g, " ").toUpperCase() || "PENDING"}
                    </Badge>
                  </div>
                </div>
                <StageProgress 
                  currentStage={selectedRequest.stageOrder || 1} 
                  totalStages={selectedRequest.totalStages || 1}
                  stageName={selectedRequest.stageName}
                />
              </div>
              
              {/* Main Details Grid - 3 columns */}
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1: Visitor Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] border-b pb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#5B2C93]" />
                    {t("approvals.visitorInfo", "Visitor Information")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.fullName", "Full Name")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.visitorName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.company", "Company")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.visitorCompany || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.idType", "ID Type")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.visitorIdType?.replace(/_/g, " ").toUpperCase() || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.idNumber", "ID Number")}</label>
                      <p className="text-sm font-medium font-mono">{selectedRequest.request?.visitorIdNumber || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.phone", "Phone")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.visitorPhone || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.email", "Email")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.visitorEmail || "N/A"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Column 2: Visit Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] border-b pb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#5B2C93]" />
                    {t("approvals.visitDetails", "Visit Details")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.purpose", "Purpose")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.purpose || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.startDate", "Start Date")}</label>
                      <p className="text-sm font-medium">
                        {selectedRequest.request?.startDate ? format(new Date(selectedRequest.request.startDate), "EEEE, MMM d, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.endDate", "End Date")}</label>
                      <p className="text-sm font-medium">
                        {selectedRequest.request?.endDate ? format(new Date(selectedRequest.request.endDate), "EEEE, MMM d, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.visitTime", "Visit Time")}</label>
                      <p className="text-sm font-medium">
                        {selectedRequest.request?.startTime || "00:00"} - {selectedRequest.request?.endTime || "23:59"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.createdAt", "Submitted On")}</label>
                      <p className="text-sm font-medium">
                        {selectedRequest.request?.createdAt ? format(new Date(selectedRequest.request.createdAt), "MMM d, yyyy 'at' HH:mm") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Column 3: Location & Workflow */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] border-b pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#4ECDC4]" />
                    {t("approvals.locationWorkflow", "Location & Workflow")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.site", "Site")}</label>
                      <p className="text-sm font-medium">{selectedRequest.request?.siteName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.workflow", "Workflow")}</label>
                      <p className="text-sm font-medium">{selectedRequest.workflowName || "Default"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.currentStage", "Current Stage")}</label>
                      <p className="text-sm font-medium">{selectedRequest.stageName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.progress", "Progress")}</label>
                      <p className="text-sm font-medium">
                        Stage {selectedRequest.stageOrder || 1} of {selectedRequest.totalStages || 1}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B6B6B] uppercase">{t("approvals.assignedTo", "Assigned To")}</label>
                      <p className="text-sm font-medium">
                        {selectedRequest.assignedToId ? `User #${selectedRequest.assignedToId}` : "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Approval Timeline with Comments */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-[#FFB84D]" />
                  {t("approvals.approvalTimeline", "Approval Timeline")}
                </h4>
                
                {/* Stage Progress Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: selectedRequest.totalStages || 1 }).map((_, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        idx + 1 < (selectedRequest.stageOrder || 1) 
                          ? "bg-[#E8F9F8] text-[#4ECDC4] border-2 border-[#4ECDC4]" 
                          : idx + 1 === (selectedRequest.stageOrder || 1)
                            ? "bg-[#FFF4E5] text-[#FFB84D] border-2 border-[#FFB84D]"
                            : "bg-[#F5F5F5] text-[#6B6B6B] border-2 border-[#E0E0E0]"
                      }`}>
                        {idx + 1 < (selectedRequest.stageOrder || 1) ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      {idx < (selectedRequest.totalStages || 1) - 1 && (
                        <div className={`w-8 h-0.5 ${
                          idx + 1 < (selectedRequest.stageOrder || 1) ? "bg-[#E8F9F8]" : "bg-[#E0E0E0]"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Detailed History with Comments */}
                {selectedRequest.approvalHistory && selectedRequest.approvalHistory.length > 0 ? (
                  <div className="space-y-0 max-h-[400px] overflow-y-auto relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#E0E0E0]" />
                    
                    {selectedRequest.approvalHistory.map((history: any, idx: number) => {
                      const actionColors: Record<string, string> = {
                        approved: "border-[#4ECDC4]",
                        rejected: "border-[#FF6B6B]",
                        decision_made: "border-[#5B2C93]",
                        info_requested: "border-[#FFB84D]",
                        submitted: "border-[#5B2C93]",
                        escalated: "border-[#5B2C93]",
                        workflow_started: "border-[#B0B0B0]",
                        workflow_completed: "border-[#4ECDC4]",
                        stage_completed: "border-[#4ECDC4]",
                        task_assigned: "border-[#5B2C93]",
                        sent_back: "border-[#FFB84D]",
                        clarification_requested: "border-[#FFB84D]",
                        clarification_provided: "border-[#5B2C93]",
                        task_reassigned: "border-[#5B2C93]",
                      };
                      const actionBgColors: Record<string, string> = {
                        approved: "bg-[#E8F9F8]",
                        rejected: "bg-[#FF6B6B]",
                        decision_made: "bg-[#E8DCF5]",
                        info_requested: "bg-[#FFF4E5]",
                        submitted: "bg-[#E8DCF5]",
                        escalated: "bg-[#E8DCF5]0",
                        workflow_started: "bg-[#F5F5F5]0",
                        workflow_completed: "bg-[#4ECDC4]",
                        stage_completed: "bg-[#E8F9F8]",
                        task_assigned: "bg-[#5B2C93]",
                        sent_back: "bg-[#FFF4E5]",
                        clarification_requested: "bg-[#FFF4E5]",
                        clarification_provided: "bg-[#5B2C93]",
                        task_reassigned: "bg-[#E8DCF5]0",
                      };
                      const actionIcons: Record<string, React.ReactNode> = {
                        approved: <CheckCircle2 className="h-3 w-3 text-white" />,
                        rejected: <XCircle className="h-3 w-3 text-white" />,
                        decision_made: <CheckCircle2 className="h-3 w-3 text-white" />,
                        info_requested: <HelpCircle className="h-3 w-3 text-white" />,
                        submitted: <Send className="h-3 w-3 text-white" />,
                        escalated: <ArrowUpRight className="h-3 w-3 text-white" />,
                        workflow_started: <Zap className="h-3 w-3 text-white" />,
                        workflow_completed: <CheckCheck className="h-3 w-3 text-white" />,
                        stage_completed: <CheckCircle2 className="h-3 w-3 text-white" />,
                        task_assigned: <User className="h-3 w-3 text-white" />,
                        sent_back: <ArrowLeft className="h-3 w-3 text-white" />,
                        clarification_requested: <HelpCircle className="h-3 w-3 text-white" />,
                        clarification_provided: <MessageSquare className="h-3 w-3 text-white" />,
                        task_reassigned: <RefreshCw className="h-3 w-3 text-white" />,
                      };
                      const actionLabels: Record<string, string> = {
                        approved: "Approved",
                        rejected: "Rejected",
                        decision_made: "Decision Made",
                        info_requested: "Clarification Requested",
                        submitted: "Submitted",
                        escalated: "Escalated",
                        workflow_started: "Workflow Started",
                        workflow_completed: "Workflow Completed",
                        stage_completed: "Stage Completed",
                        task_assigned: "Task Assigned",
                        sent_back: "Sent Back",
                        clarification_requested: "Clarification Requested",
                        clarification_provided: "Clarification Provided",
                        task_reassigned: "Task Reassigned",
                      };
                      
                      const details = history.details as any || {};
                      const stageName = details.stageName || details.workflowName || 
                        (history.actionType === "workflow_started" ? "Initiated" :
                         history.actionType === "workflow_completed" ? (details.newStatus === "approved" ? "Final Approval" : details.newStatus === "rejected" ? "Rejected" : "Completed") :
                         history.actionType === "task_assigned" ? "Assignment" : 
                         "Stage");
                      const comments = details.comments || details.reason || details.response || "";
                      const decision = details.decision || details.newStatus || "";
                      
                      // Determine decision label for decision_made entries
                      const decisionLabel = history.actionType === "decision_made" 
                        ? (decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : decision.replace(/_/g, " "))
                        : "";
                      
                      return (
                        <div key={idx} className="relative pl-10 pb-4">
                          {/* Timeline dot */}
                          <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 ${actionBgColors[history.actionType] || "bg-[#B0B0B0]"}`}>
                            {actionIcons[history.actionType] || <Clock className="h-3 w-3 text-white" />}
                          </div>
                          
                          <div className={`border-l-2 pl-3 py-1 ${actionColors[history.actionType] || "border-[#E0E0E0]"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {actionLabels[history.actionType] || history.actionType.replace(/_/g, " ")}
                                </span>
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  {stageName}
                                </Badge>
                                {decisionLabel && history.actionType === "decision_made" && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-1.5 py-0 ${
                                      decision === "approved" ? "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]" :
                                      decision === "rejected" ? "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]" :
                                      "bg-[#F5F5F5] text-[#2C2C2C]"
                                    }`}
                                  >
                                    {decisionLabel}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-[#6B6B6B] whitespace-nowrap ml-2">
                                {history.actionAt ? format(new Date(history.actionAt), "MMM d, yyyy HH:mm") : ""}
                              </span>
                            </div>
                            <div className="text-xs text-[#6B6B6B] mt-0.5">
                              <span className="font-medium">{history.userName || history.userEmail || "System"}</span>
                              {details.target && <span> → {details.target}</span>}
                            </div>
                            {comments && (
                              <div className="mt-1.5 p-2 bg-[#F5F5F5] rounded border border-[#E0E0E0] text-sm">
                                <MessageSquare className="h-3 w-3 inline-block mr-1 text-[#6B6B6B]" />
                                <span className="italic text-[#6B6B6B]">"{comments}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6B6B] italic">
                    {t("approvals.noHistoryYet", "No approval history yet. This request is awaiting first approval.")}
                  </p>
                )}
              </div>
              
              {/* Internal Comments Section */}
              {selectedRequest?.request?.id && (
                <div className="mt-4 pt-4 border-t">
                  <RequestComments 
                    requestId={selectedRequest.request.id}
                    instanceId={selectedRequest.instanceId}
                    taskId={selectedRequest.taskId}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              {t("common.close", "Close")}
            </Button>
            {selectedRequest?.request?.id && selectedRequest?.request?.status === 'approved' && (
              <Button
                variant="outline"
                className="text-[#5B2C93] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
                onClick={() => handleDownloadPdf(selectedRequest.request.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t("approvals.downloadPdf", "Download Form PDF")}
              </Button>
            )}
            <Button
              variant="outline"
              className="text-[#FFB84D] hover:text-[#FFB84D] hover:bg-[#FFF4E5]"
              onClick={() => {
                setDetailsDialogOpen(false);
                openActionDialog(selectedRequest, "clarification");
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("approvals.needClarification", "Clarify")}
            </Button>
            <Button
              variant="outline"
              className="text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
              onClick={() => {
                setDetailsDialogOpen(false);
                openActionDialog(selectedRequest, "reject");
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t("common.reject", "Reject")}
            </Button>
            <Button
              className="bg-[#4ECDC4] hover:bg-[#3DBDB4] text-white"
              onClick={() => {
                setDetailsDialogOpen(false);
                openActionDialog(selectedRequest, "approve");
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isFinalStage(selectedRequest) ? t("approvals.grantAccess", "Grant Access") : t("common.approve", "Approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
