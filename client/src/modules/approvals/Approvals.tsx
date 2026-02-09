import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User,
  Building2,
  Calendar,
  MapPin,
  Shield,
  AlertTriangle,
  Loader2,
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
  UserCheck,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriStatusBadge,
} from "@/components/fiori";

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
  material_entry: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  tep: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]/20",
  mop: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  escort: "bg-[#D1FAE5] text-[#059669] border-[#059669]",
};

const stageColors = [
  "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  "bg-[#D1FAE5] text-[#059669] border-[#059669]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]/30",
  "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
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
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "clarification" | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [clarificationTarget, setClarificationTarget] = useState<"last_approver" | "requestor">("requestor");
  
  const [accessGrantDialogOpen, setAccessGrantDialogOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [rfidTag, setRfidTag] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  
  const [qrResultDialogOpen, setQrResultDialogOpen] = useState(false);
  const [generatedQrCode, setGeneratedQrCode] = useState<string>("");
  const [generatedQrData, setGeneratedQrData] = useState<string>("");
  const [qrRequestId, setQrRequestId] = useState<number | null>(null);
  
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: approvalStats } = trpc.requests.getApprovalStats.useQuery();
  
  const approveTask = trpc.requests.approveTask.useMutation({
    onSuccess: async (result: any) => {
      if (result.isFinalApproval && result.entryMethod === "qr_code" && result.qrCodeData) {
        if (result.requestId) setQrRequestId(result.requestId);
        else if (selectedRequest?.request?.id) setQrRequestId(selectedRequest.request.id);
        try {
          const qrDataUrl = await QRCode.toDataURL(result.qrCodeData, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
          setGeneratedQrCode(qrDataUrl);
          setGeneratedQrData(result.qrCodeData);
          setQrResultDialogOpen(true);
        } catch (err) { console.error("Failed to generate QR code image:", err); }
        toast.success("Request fully approved", { description: "QR code has been generated for access" });
      } else {
        toast.success("Request approved", { description: result.message || "Moved to next approval stage" });
      }
      refetch();
      resetAllDialogs();
    },
    onError: (error) => { toast.error("Failed to approve", { description: error.message }); setProcessingId(null); }
  });
  
  const rejectTask = trpc.requests.rejectTask.useMutation({
    onSuccess: () => { toast.error("Request rejected"); refetch(); resetAllDialogs(); },
    onError: (error) => { toast.error("Failed to reject", { description: error.message }); setProcessingId(null); }
  });
  
  const needClarification = trpc.requests.needClarification.useMutation({
    onSuccess: (result) => { toast.info("Clarification requested", { description: result.message }); refetch(); resetAllDialogs(); },
    onError: (error) => { toast.error("Failed to request clarification", { description: error.message }); setProcessingId(null); }
  });
  
  const resetAllDialogs = () => {
    setSelectedRequest(null); setProcessingId(null); setActionDialogOpen(false); setActionType(null);
    setActionComments(""); setClarificationTarget("requestor"); setAccessGrantDialogOpen(false);
    setEntryMethod("qr_code"); setRfidTag(""); setCardNumber(""); setDetailsDialogOpen(false);
  };
  
  const tasksByStage = (pendingTasks || []).reduce((acc: Record<string, { count: number; order: number }>, task: any) => {
    const stageName = task.stageName || `Stage ${task.stageOrder}`;
    if (!acc[stageName]) acc[stageName] = { count: 0, order: task.stageOrder || 1 };
    acc[stageName].count++;
    return acc;
  }, {});
  
  const uniqueStages = Object.entries(tasksByStage).sort(([, a], [, b]) => a.order - b.order).map(([name, data]) => ({ name, ...data }));
  const uniqueTypes = Array.from(new Set((pendingTasks || []).map((t: any) => t.request?.type).filter(Boolean))) as string[];
  const uniqueSites = Array.from(new Set((pendingTasks || []).map((t: any) => t.request?.siteName).filter(Boolean))) as string[];
  
  const filteredTasks = (pendingTasks || []).filter((task: any) => {
    if (stageFilter !== "all") { const taskStageName = task.stageName || `Stage ${task.stageOrder}`; if (taskStageName !== stageFilter) return false; }
    if (typeFilter !== "all" && task.request?.type !== typeFilter) return false;
    if (siteFilter !== "all" && task.request?.siteName !== siteFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.request?.requestNumber?.toLowerCase().includes(query) ||
      task.request?.visitorName?.toLowerCase().includes(query) ||
      task.request?.visitorCompany?.toLowerCase().includes(query) ||
      task.stageName?.toLowerCase().includes(query)
    );
  });
  
  const isFinalStage = (task: any) => {
    if (!task || task.stageOrder == null || task.totalStages == null) return false;
    return task.stageOrder === task.totalStages;
  };
  
  const openActionDialog = (task: any, type: "approve" | "reject" | "clarification") => {
    setSelectedRequest(task); setActionType(type); setActionComments(""); setClarificationTarget("requestor");
    if (type === "approve" && isFinalStage(task)) setAccessGrantDialogOpen(true);
    else setActionDialogOpen(true);
  };
  
  const handleActionConfirm = () => {
    if (!selectedRequest) return;
    if (actionType === "approve") { setProcessingId(selectedRequest.taskId); approveTask.mutate({ taskId: selectedRequest.taskId, comments: actionComments || undefined }); }
    else if (actionType === "reject") {
      if (!actionComments.trim()) { toast.error("Rejection reason is required"); return; }
      setProcessingId(selectedRequest.taskId); rejectTask.mutate({ taskId: selectedRequest.taskId, comments: actionComments });
    } else if (actionType === "clarification") {
      if (!actionComments.trim()) { toast.error("Please specify what clarification is needed"); return; }
      setProcessingId(selectedRequest.taskId); needClarification.mutate({ taskId: selectedRequest.taskId, comments: actionComments, target: clarificationTarget });
    }
  };
  
  const handleFinalApprove = () => {
    if (!selectedRequest) return;
    if (entryMethod === "rfid" && !rfidTag.trim()) { toast.error("Please enter the RFID tag number"); return; }
    if (entryMethod === "card" && !cardNumber.trim()) { toast.error("Please enter the card number"); return; }
    setProcessingId(selectedRequest.taskId);
    approveTask.mutate({
      taskId: selectedRequest.taskId,
      comments: actionComments || `Final approval - Access granted via ${entryMethod.replace("_", " ")}`,
      entryMethod, rfidTag: entryMethod === "rfid" ? rfidTag : undefined,
      cardNumber: entryMethod === "card" ? cardNumber : undefined, isFinalApproval: true,
    });
  };
  
  const handleViewDetails = (task: any) => { setSelectedRequest(task); setDetailsDialogOpen(true); };
  const handleCopyQrData = () => { navigator.clipboard.writeText(generatedQrData); toast.success("QR code data copied to clipboard"); };
  const handleDownloadQr = () => { const link = document.createElement("a"); link.download = `access-qr-${generatedQrData}.png`; link.href = generatedQrCode; link.click(); };
  const handleDownloadPdf = (requestId: number) => {
    const token = localStorage.getItem("centre3_token");
    const url = `/api/forms/pdf/${requestId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  };
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);

  const StageProgress = ({ currentStage, totalStages, stageName }: { currentStage: number; totalStages: number; stageName: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalStages }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < currentStage ? "bg-[#059669]" : i === currentStage - 1 ? "bg-[#D97706]" : "bg-[#E0E0E0]"}`} />
        ))}
      </div>
      <span className="text-xs text-[#6B6B6B]">{currentStage}/{totalStages}</span>
    </div>
  );

  const activeFilters = [
    ...(stageFilter !== "all" ? [{ key: "stage", label: `Stage: ${stageFilter}`, onRemove: () => setStageFilter("all") }] : []),
    ...(typeFilter !== "all" ? [{ key: "type", label: `Type: ${typeLabels[typeFilter] || typeFilter}`, onRemove: () => setTypeFilter("all") }] : []),
    ...(siteFilter !== "all" ? [{ key: "site", label: `Site: ${siteFilter}`, onRemove: () => setSiteFilter("all") }] : []),
  ];

  return (
    <div className="space-y-0">
      <FioriPageHeader
        title={t("approvals.title", "My Approvals")}
        subtitle={t("approvals.subtitle", "Review and process pending approval requests")}
        icon={<ClipboardCheck className="h-5 w-5" />}
        count={filteredTasks.length}
        onRefresh={() => refetch()}
      />

      {/* KPI Summary Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 px-0 py-4">
        <div
          className={`bg-white border rounded-lg px-4 py-3 cursor-pointer transition-all ${
            stageFilter === "all" ? "border-[#5B2C93] ring-1 ring-[#5B2C93]/20 shadow-sm" : "border-[#E0E0E0] hover:border-[#5B2C93]/40"
          }`}
          onClick={() => setStageFilter("all")}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#E8DCF5] flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-[#5B2C93]" />
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B] font-medium">Total Pending</p>
              <p className="text-xl font-semibold text-[#2C2C2C]">{pendingTasks?.length || 0}</p>
            </div>
          </div>
        </div>
        {uniqueStages.map((stage, index) => {
          const colors = [
            { bg: "bg-[#FEF3C7]", icon: "text-[#D97706]" },
            { bg: "bg-[#E8DCF5]", icon: "text-[#5B2C93]" },
            { bg: "bg-[#D1FAE5]", icon: "text-[#059669]" },
            { bg: "bg-[#FFE5E5]", icon: "text-[#FF6B6B]" },
          ];
          const color = colors[index % colors.length];
          const icons = [Clock, Shield, UserCheck, AlertTriangle];
          const StageIcon = icons[index % icons.length];
          return (
            <div
              key={stage.name}
              className={`bg-white border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                stageFilter === stage.name ? "border-[#5B2C93] ring-1 ring-[#5B2C93]/20 shadow-sm" : "border-[#E0E0E0] hover:border-[#5B2C93]/40"
              }`}
              onClick={() => setStageFilter(stageFilter === stage.name ? "all" : stage.name)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${color.bg} flex items-center justify-center`}>
                  <StageIcon className={`h-4 w-4 ${color.icon}`} />
                </div>
                <div>
                  <p className="text-xs text-[#6B6B6B] font-medium truncate max-w-[120px]">{stage.name}</p>
                  <p className="text-xl font-semibold text-[#2C2C2C]">{stage.count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <FioriFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("approvals.searchPlaceholder", "Search by request number, visitor, or company...")}
        activeFilters={activeFilters}
        onClearAll={() => { setStageFilter("all"); setTypeFilter("all"); setSiteFilter("all"); }}
        filters={
          <>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder={t("approvals.filterByStage", "All Stages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("approvals.allStages", "All Stages")}</SelectItem>
                {uniqueStages.filter((stage) => stage.name).map((stage) => (
                  <SelectItem key={stage.name} value={stage.name}>{stage.name} ({stage.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder={t("approvals.filterByType", "All Types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("approvals.allTypes", "All Types")}</SelectItem>
                {uniqueTypes.filter((type) => type).map((type) => (
                  <SelectItem key={type} value={type}>{typeLabels[type] || type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                <SelectValue placeholder={t("approvals.filterBySite", "All Sites")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("approvals.allSites", "All Sites")}</SelectItem>
                {uniqueSites.filter((site) => site).map((site) => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Task List - SAP Fiori Table Style */}
      <div className="mt-4">
        {isLoading ? (
          <div className="bg-white border border-[#E0E0E0] rounded-lg flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-[#E0E0E0] rounded-lg flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-3">
              <CheckCheck className="h-6 w-6 text-[#059669]" />
            </div>
            <h3 className="text-sm font-medium text-[#2C2C2C]">{t("approvals.noPending", "No Pending Approvals")}</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">{t("approvals.noPendingDesc", "You're all caught up! Check back later for new requests.")}</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_100px_90px_120px_100px_80px_310px] gap-2 px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E0E0E0] text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
              <span>Request</span>
              <span>Type</span>
              <span>Stage</span>
              <span>Visitor</span>
              <span>Site</span>
              <span>Date</span>
              <span className="text-right">Actions</span>
            </div>
            {/* Table Rows */}
            {filteredTasks.map((task: any) => (
              <div
                key={task.taskId}
                className="grid grid-cols-[1fr_100px_90px_120px_100px_80px_310px] gap-2 px-4 py-3 border-b border-[#F0F0F0] hover:bg-[#FAFAFA] cursor-pointer items-center"
                onClick={() => handleViewDetails(task)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-[#5B2C93]">{task.request?.requestNumber}</span>
                  <StageProgress currentStage={task.stageOrder || 1} totalStages={task.totalStages || 1} stageName={task.stageName} />
                </div>
                <div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeColors[task.request?.type] || "bg-[#F5F5F5] text-[#6B6B6B]"}`}>
                    {typeLabels[task.request?.type] || task.request?.type}
                  </span>
                </div>
                <div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStageColor(task.stageOrder || 1)}`}>
                    {task.stageName || `S${task.stageOrder}`}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-sm text-[#2C2C2C]">{task.request?.visitorName || "N/A"}</span>
                  {task.request?.visitorCompany && (
                    <p className="text-xs text-[#6B6B6B] truncate">{task.request.visitorCompany}</p>
                  )}
                </div>
                <span className="text-xs text-[#6B6B6B] truncate">{task.request?.siteName || "—"}</span>
                <span className="text-xs text-[#6B6B6B]">
                  {task.request?.startDate ? format(new Date(task.request.startDate), "MMM d") : "—"}
                </span>
                <div className="flex items-center justify-end gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B0B0B0] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(task); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-[#D97706] hover:text-[#D97706] hover:bg-[#FEF3C7] border-[#E0E0E0]"
                    onClick={(e) => { e.stopPropagation(); openActionDialog(task, "clarification"); }} disabled={processingId === task.taskId}>
                    <HelpCircle className="h-3.5 w-3.5 mr-1" /> Clarify
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5] border-[#E0E0E0]"
                    onClick={(e) => { e.stopPropagation(); openActionDialog(task, "reject"); }} disabled={processingId === task.taskId}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                  <Button size="sm" className="h-7 px-2 text-xs bg-[#5B2C93] hover:bg-[#4A2378] text-white"
                    onClick={(e) => { e.stopPropagation(); openActionDialog(task, "approve"); }} disabled={processingId === task.taskId}>
                    {processingId === task.taskId ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                    {isFinalStage(task) ? "Grant" : "Approve"}
                  </Button>
                </div>
              </div>
            ))}
            {/* Footer */}
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E0E0E0] text-xs text-[#6B6B6B]">
              Showing {filteredTasks.length} of {pendingTasks?.length || 0} pending approvals
            </div>
          </div>
        )}
      </div>

      {/* ─── DIALOGS (preserved from original) ─── */}

      {/* Unified Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={(open) => { if (!open) resetAllDialogs(); else setActionDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "approve" ? "text-[#5B2C93]" : actionType === "reject" ? "text-[#FF6B6B]" : "text-[#D97706]"}`}>
              {actionType === "approve" && <CheckCircle2 className="h-5 w-5" />}
              {actionType === "reject" && <XCircle className="h-5 w-5" />}
              {actionType === "clarification" && <HelpCircle className="h-5 w-5" />}
              {actionType === "approve" && t("approvals.approveRequest", "Approve Request")}
              {actionType === "reject" && t("approvals.rejectRequest", "Reject Request")}
              {actionType === "clarification" && t("approvals.needClarificationTitle", "Request Clarification")}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && t("approvals.approveDescription", "Add optional comments for this approval.")}
              {actionType === "reject" && t("approvals.rejectDescription", "Please provide a reason for rejecting this request.")}
              {actionType === "clarification" && t("approvals.clarificationDescription", "Specify what information you need and who should provide it.")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium text-[#5B2C93]">{selectedRequest.request?.requestNumber}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStageColor(selectedRequest.stageOrder || 1)}`}>
                    {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}
                  </span>
                </div>
                <p className="text-sm text-[#6B6B6B]">{selectedRequest.request?.visitorName} — {selectedRequest.request?.visitorCompany}</p>
              </div>
              
              {actionType === "clarification" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t("approvals.sendClarificationTo", "Send clarification request to:")}</Label>
                  <RadioGroup value={clarificationTarget} onValueChange={(v) => setClarificationTarget(v as any)} className="grid gap-3">
                    {[
                      { value: "requestor", label: t("approvals.requestor", "Requestor"), desc: t("approvals.requestorDesc", "Send back to the person who submitted"), icon: <User className="h-5 w-5 text-[#D97706]" />, bg: "bg-[#FEF3C7]", active: "border-[#D97706] bg-[#FEF3C7]" },
                      { value: "last_approver", label: t("approvals.lastApprover", "Last Approver"), desc: t("approvals.lastApproverDesc", "Send back to the previous stage approver"), icon: <UserCheck className="h-5 w-5 text-[#5B2C93]" />, bg: "bg-[#E8DCF5]", active: "border-[#5B2C93] bg-[#E8DCF5]" },
                    ].map((opt) => (
                      <div key={opt.value} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${clarificationTarget === opt.value ? opt.active : "border-[#E0E0E0] hover:bg-[#FAFAFA]"}`}>
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label htmlFor={opt.value} className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className={`p-2 ${opt.bg} rounded-lg`}>{opt.icon}</div>
                          <div><p className="font-medium text-[#2C2C2C]">{opt.label}</p><p className="text-xs text-[#6B6B6B]">{opt.desc}</p></div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {actionType === "approve" && <>{t("approvals.comments", "Comments")} ({t("common.optional", "Optional")})</>}
                  {actionType === "reject" && <>{t("approvals.rejectionReason", "Rejection Reason")} <span className="text-[#DC2626]">*</span></>}
                  {actionType === "clarification" && <>{t("approvals.clarificationDetails", "What clarification do you need?")} <span className="text-[#DC2626]">*</span></>}
                </Label>
                <Textarea
                  placeholder={actionType === "approve" ? t("approvals.approveCommentsPlaceholder", "Add any notes...") : actionType === "reject" ? t("approvals.rejectReasonPlaceholder", "Enter rejection reason...") : t("approvals.clarificationPlaceholder", "Describe what information you need...")}
                  value={actionComments} onChange={(e) => setActionComments(e.target.value)} rows={3}
                  className={actionType !== "approve" && !actionComments.trim() ? "border-[#DC2626]" : ""}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => resetAllDialogs()} className="border-[#E0E0E0]">{t("common.cancel", "Cancel")}</Button>
            <Button
              className={actionType === "approve" ? "bg-[#5B2C93] hover:bg-[#4A2378] text-white" : actionType === "reject" ? "bg-[#FF6B6B] hover:bg-[#EF4444] text-white" : "bg-[#D97706] hover:bg-[#B45309] text-white"}
              onClick={handleActionConfirm}
              disabled={processingId !== null || (actionType !== "approve" && !actionComments.trim())}
            >
              {processingId !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                <>{actionType === "approve" && <CheckCircle2 className="h-4 w-4 mr-2" />}{actionType === "reject" && <XCircle className="h-4 w-4 mr-2" />}{actionType === "clarification" && <Send className="h-4 w-4 mr-2" />}</>
              )}
              {actionType === "approve" && t("approvals.confirmApprove", "Confirm Approval")}
              {actionType === "reject" && t("approvals.confirmReject", "Confirm Rejection")}
              {actionType === "clarification" && t("approvals.sendClarification", "Send Clarification Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Grant Dialog */}
      <Dialog open={accessGrantDialogOpen} onOpenChange={(open) => { if (!open) resetAllDialogs(); else setAccessGrantDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#059669]"><Shield className="h-5 w-5" /> {t("approvals.grantAccessTitle", "Grant Access")}</DialogTitle>
            <DialogDescription>{t("approvals.grantAccessDescription", "This is the final approval stage. Select how the visitor will gain access.")}</DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-5">
              <div className="p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium text-[#5B2C93]">{selectedRequest.request?.requestNumber}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#059669]">Final Stage</span>
                </div>
                <p className="text-sm text-[#6B6B6B]">{selectedRequest.request?.visitorName} — {selectedRequest.request?.visitorCompany}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{selectedRequest.request?.siteName} — {selectedRequest.request?.startDate} - {selectedRequest.request?.endDate}</p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("approvals.selectEntryMethod", "Select Entry Method")}</Label>
                <RadioGroup value={entryMethod} onValueChange={(v) => setEntryMethod(v as any)} className="grid gap-3">
                  {[
                    { value: "qr_code", label: t("approvals.qrCode", "QR Code"), desc: t("approvals.qrCodeDesc", "Generate a unique QR code"), icon: <QrCode className="h-5 w-5 text-[#0D9488]" />, bg: "bg-[#E8F9F8]", active: "border-[#4ECDC4] bg-[#E8F9F8]" },
                    { value: "rfid", label: t("approvals.rfid", "RFID Tag"), desc: t("approvals.rfidDesc", "Assign an RFID tag"), icon: <Radio className="h-5 w-5 text-[#5B2C93]" />, bg: "bg-[#E8DCF5]", active: "border-[#5B2C93] bg-[#E8DCF5]" },
                    { value: "card", label: t("approvals.accessCard", "Access Card"), desc: t("approvals.accessCardDesc", "Issue a physical card"), icon: <CreditCard className="h-5 w-5 text-[#5B2C93]" />, bg: "bg-[#E8DCF5]", active: "border-[#5B2C93] bg-[#E8DCF5]" },
                  ].map((m) => (
                    <div key={m.value} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${entryMethod === m.value ? m.active : "border-[#E0E0E0] hover:bg-[#FAFAFA]"}`}>
                      <RadioGroupItem value={m.value} id={m.value} />
                      <Label htmlFor={m.value} className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className={`p-2 ${m.bg} rounded-lg`}>{m.icon}</div>
                        <div><p className="font-medium text-[#2C2C2C]">{m.label}</p><p className="text-xs text-[#6B6B6B]">{m.desc}</p></div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {entryMethod === "rfid" && (
                <div className="space-y-1.5">
                  <Label htmlFor="rfidTag" className="text-sm">{t("approvals.rfidTagNumber", "RFID Tag Number")}</Label>
                  <Input id="rfidTag" placeholder={t("approvals.rfidTagPlaceholder", "Enter RFID tag number...")} value={rfidTag} onChange={(e) => setRfidTag(e.target.value)} />
                </div>
              )}
              {entryMethod === "card" && (
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber" className="text-sm">{t("approvals.cardNumber", "Card Number")}</Label>
                  <Input id="cardNumber" placeholder={t("approvals.cardNumberPlaceholder", "Enter access card number...")} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="comments" className="text-sm">{t("approvals.comments", "Comments")} ({t("common.optional", "Optional")})</Label>
                <Textarea id="comments" placeholder={t("approvals.commentsPlaceholder", "Add any notes...")} value={actionComments} onChange={(e) => setActionComments(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => resetAllDialogs()} className="border-[#E0E0E0]">{t("common.cancel", "Cancel")}</Button>
            <Button className="bg-[#5B2C93] hover:bg-[#4A2378] text-white" onClick={handleFinalApprove} disabled={processingId !== null}>
              {processingId !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {t("approvals.approveAndGrant", "Approve & Grant Access")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Result Dialog */}
      <Dialog open={qrResultDialogOpen} onOpenChange={setQrResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#5B2C93]"><CheckCircle2 className="h-5 w-5" /> {t("approvals.accessGranted", "Access Granted")}</DialogTitle>
            <DialogDescription>{t("approvals.accessGrantedDesc", "The request has been fully approved and access credentials have been generated.")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[#059669]" />
            </div>
            <p className="text-sm text-center text-[#2C2C2C]">{t("approvals.accessCredentialsReady", "Access credentials have been generated successfully.")}</p>
            {generatedQrData && (
              <div className="w-full p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">
                <Label className="text-xs text-[#6B6B6B]">{t("approvals.accessCode", "Access Code")}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border border-[#E0E0E0] truncate">{generatedQrData}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopyQrData}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {(qrRequestId || selectedRequest?.request?.id) && (
              <Button variant="outline" onClick={() => handleDownloadPdf(qrRequestId || selectedRequest?.request?.id)} className="gap-2 text-[#5B2C93] hover:bg-[#E8DCF5] border-[#E0E0E0]">
                <FileText className="h-4 w-4" /> {t("approvals.downloadPdf", "Download Form PDF")}
              </Button>
            )}
            <Button onClick={() => { setQrResultDialogOpen(false); setQrRequestId(null); }} className="bg-[#5B2C93] hover:bg-[#3D1C5E]">{t("common.done", "Done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B2C93]" /> {t("approvals.requestDetails", "Request Details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">
                <div>
                  <span className="font-mono text-xl font-medium text-[#5B2C93]">{selectedRequest.request?.requestNumber}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeColors[selectedRequest.request?.type] || "bg-[#F5F5F5]"}`}>
                      {typeLabels[selectedRequest.request?.type] || selectedRequest.request?.type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStageColor(selectedRequest.stageOrder || 1)}`}>
                      {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}{isFinalStage(selectedRequest) && " (Final)"}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#F5F5F5] text-[#2C2C2C] uppercase">
                      {selectedRequest.request?.status?.replace(/_/g, " ") || "PENDING"}
                    </span>
                  </div>
                </div>
                <StageProgress currentStage={selectedRequest.stageOrder || 1} totalStages={selectedRequest.totalStages || 1} stageName={selectedRequest.stageName} />
              </div>
              
              {/* 3-column detail grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Visitor Info */}
                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#5B2C93]" /> {t("approvals.visitorInfo", "Visitor Information")}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: t("approvals.fullName", "Full Name"), value: selectedRequest.request?.visitorName },
                      { label: t("approvals.company", "Company"), value: selectedRequest.request?.visitorCompany },
                      { label: t("approvals.idType", "ID Type"), value: selectedRequest.request?.visitorIdType?.replace(/_/g, " ").toUpperCase() },
                      { label: t("approvals.idNumber", "ID Number"), value: selectedRequest.request?.visitorIdNumber, mono: true },
                      { label: t("approvals.phone", "Phone"), value: selectedRequest.request?.visitorPhone },
                      { label: t("approvals.email", "Email"), value: selectedRequest.request?.visitorEmail },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-[#6B6B6B] text-xs">{item.label}</span>
                        <p className={`text-sm font-medium text-[#2C2C2C] ${item.mono ? "font-mono" : ""}`}>{item.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Visit Details */}
                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#5B2C93]" /> {t("approvals.visitDetails", "Visit Details")}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: t("approvals.purpose", "Purpose"), value: selectedRequest.request?.purpose },
                      { label: t("approvals.startDate", "Start Date"), value: selectedRequest.request?.startDate ? format(new Date(selectedRequest.request.startDate), "EEEE, MMM d, yyyy") : null },
                      { label: t("approvals.endDate", "End Date"), value: selectedRequest.request?.endDate ? format(new Date(selectedRequest.request.endDate), "EEEE, MMM d, yyyy") : null },
                      { label: t("approvals.visitTime", "Visit Time"), value: `${selectedRequest.request?.startTime || "00:00"} - ${selectedRequest.request?.endTime || "23:59"}` },
                      { label: t("approvals.createdAt", "Submitted On"), value: selectedRequest.request?.createdAt ? format(new Date(selectedRequest.request.createdAt), "MMM d, yyyy 'at' HH:mm") : null },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-[#6B6B6B] text-xs">{item.label}</span>
                        <p className="text-sm font-medium text-[#2C2C2C]">{item.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Location & Workflow */}
                <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#059669]" /> {t("approvals.locationWorkflow", "Location & Workflow")}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: t("approvals.site", "Site"), value: selectedRequest.request?.siteName },
                      { label: t("approvals.workflow", "Workflow"), value: selectedRequest.workflowName || "Default" },
                      { label: t("approvals.currentStage", "Current Stage"), value: selectedRequest.stageName },
                      { label: t("approvals.progress", "Progress"), value: `Stage ${selectedRequest.stageOrder || 1} of ${selectedRequest.totalStages || 1}` },
                      { label: t("approvals.assignedTo", "Assigned To"), value: selectedRequest.assignedToId ? `User #${selectedRequest.assignedToId}` : "Unassigned" },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-[#6B6B6B] text-xs">{item.label}</span>
                        <p className="text-sm font-medium text-[#2C2C2C]">{item.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Approval Timeline */}
              <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                  <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-[#D97706]" /> {t("approvals.approvalTimeline", "Approval Timeline")}
                  </h4>
                </div>
                <div className="p-4">
                  {/* Stage Progress Indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: selectedRequest.totalStages || 1 }).map((_, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          idx + 1 < (selectedRequest.stageOrder || 1) ? "bg-[#D1FAE5] text-[#059669] border-2 border-[#059669]" :
                          idx + 1 === (selectedRequest.stageOrder || 1) ? "bg-[#FEF3C7] text-[#D97706] border-2 border-[#D97706]" :
                          "bg-[#F5F5F5] text-[#6B6B6B] border-2 border-[#E0E0E0]"
                        }`}>
                          {idx + 1 < (selectedRequest.stageOrder || 1) ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        {idx < (selectedRequest.totalStages || 1) - 1 && (
                          <div className={`w-8 h-0.5 ${idx + 1 < (selectedRequest.stageOrder || 1) ? "bg-[#059669]" : "bg-[#E0E0E0]"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {selectedRequest.approvalHistory && selectedRequest.approvalHistory.length > 0 ? (
                    <div className="space-y-0 max-h-[400px] overflow-y-auto relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#E0E0E0]" />
                      {selectedRequest.approvalHistory.map((history: any, idx: number) => {
                        const actionColors: Record<string, string> = {
                          approved: "border-[#059669]", rejected: "border-[#FF6B6B]", decision_made: "border-[#5B2C93]",
                          info_requested: "border-[#D97706]", submitted: "border-[#5B2C93]", escalated: "border-[#5B2C93]",
                          workflow_started: "border-[#B0B0B0]", workflow_completed: "border-[#059669]", stage_completed: "border-[#059669]",
                          task_assigned: "border-[#5B2C93]", sent_back: "border-[#D97706]", clarification_requested: "border-[#D97706]",
                          clarification_provided: "border-[#5B2C93]", task_reassigned: "border-[#5B2C93]",
                        };
                        const actionBgColors: Record<string, string> = {
                          approved: "bg-[#059669]", rejected: "bg-[#FF6B6B]", decision_made: "bg-[#5B2C93]",
                          info_requested: "bg-[#D97706]", submitted: "bg-[#5B2C93]", escalated: "bg-[#5B2C93]",
                          workflow_started: "bg-[#B0B0B0]", workflow_completed: "bg-[#059669]", stage_completed: "bg-[#059669]",
                          task_assigned: "bg-[#5B2C93]", sent_back: "bg-[#D97706]", clarification_requested: "bg-[#D97706]",
                          clarification_provided: "bg-[#5B2C93]", task_reassigned: "bg-[#5B2C93]",
                        };
                        const actionIcons: Record<string, React.ReactNode> = {
                          approved: <CheckCircle2 className="h-3 w-3 text-white" />, rejected: <XCircle className="h-3 w-3 text-white" />,
                          decision_made: <CheckCircle2 className="h-3 w-3 text-white" />, info_requested: <HelpCircle className="h-3 w-3 text-white" />,
                          submitted: <Send className="h-3 w-3 text-white" />, escalated: <ArrowUpRight className="h-3 w-3 text-white" />,
                          workflow_started: <Zap className="h-3 w-3 text-white" />, workflow_completed: <CheckCheck className="h-3 w-3 text-white" />,
                          stage_completed: <CheckCircle2 className="h-3 w-3 text-white" />, task_assigned: <User className="h-3 w-3 text-white" />,
                          sent_back: <ArrowLeft className="h-3 w-3 text-white" />, clarification_requested: <HelpCircle className="h-3 w-3 text-white" />,
                          clarification_provided: <MessageSquare className="h-3 w-3 text-white" />, task_reassigned: <RefreshCw className="h-3 w-3 text-white" />,
                        };
                        const actionLabels: Record<string, string> = {
                          approved: "Approved", rejected: "Rejected", decision_made: "Decision Made",
                          info_requested: "Clarification Requested", submitted: "Submitted", escalated: "Escalated",
                          workflow_started: "Workflow Started", workflow_completed: "Workflow Completed", stage_completed: "Stage Completed",
                          task_assigned: "Task Assigned", sent_back: "Sent Back", clarification_requested: "Clarification Requested",
                          clarification_provided: "Clarification Provided", task_reassigned: "Task Reassigned",
                        };
                        
                        const details = history.details as any || {};
                        const stageName = details.stageName || details.workflowName ||
                          (history.actionType === "workflow_started" ? "Initiated" :
                           history.actionType === "workflow_completed" ? (details.newStatus === "approved" ? "Final Approval" : details.newStatus === "rejected" ? "Rejected" : "Completed") :
                           history.actionType === "task_assigned" ? "Assignment" : "Stage");
                        const comments = details.comments || details.reason || details.response || "";
                        const decision = details.decision || details.newStatus || "";
                        const decisionLabel = history.actionType === "decision_made"
                          ? (decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : decision.replace(/_/g, " "))
                          : "";
                        
                        return (
                          <div key={idx} className="relative pl-10 pb-4">
                            <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 ${actionBgColors[history.actionType] || "bg-[#B0B0B0]"}`}>
                              {actionIcons[history.actionType] || <Clock className="h-3 w-3 text-white" />}
                            </div>
                            <div className={`border-l-2 pl-3 py-1 ${actionColors[history.actionType] || "border-[#E0E0E0]"}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{actionLabels[history.actionType] || history.actionType.replace(/_/g, " ")}</span>
                                  <span className="text-xs px-1.5 py-0 rounded border border-[#E0E0E0] text-[#6B6B6B]">{stageName}</span>
                                  {decisionLabel && history.actionType === "decision_made" && (
                                    <span className={`text-xs px-1.5 py-0 rounded ${decision === "approved" ? "bg-[#D1FAE5] text-[#059669]" : decision === "rejected" ? "bg-[#FFE5E5] text-[#FF6B6B]" : "bg-[#F5F5F5] text-[#2C2C2C]"}`}>
                                      {decisionLabel}
                                    </span>
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
                                <div className="mt-1.5 p-2 bg-white rounded border border-[#E0E0E0] text-sm">
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
                    <p className="text-sm text-[#6B6B6B] italic">{t("approvals.noHistoryYet", "No approval history yet.")}</p>
                  )}
                </div>
              </div>
              
              {/* Comments Section */}
              {selectedRequest?.request?.id && (
                <div className="pt-2">
                  <RequestComments requestId={selectedRequest.request.id} instanceId={selectedRequest.instanceId} taskId={selectedRequest.taskId} />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t border-[#E0E0E0] pt-4">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="border-[#E0E0E0]">{t("common.close", "Close")}</Button>
            {/* Download Form PDF is only available on the All Requests page for fully approved requests */}
            <Button variant="outline" className="text-[#D97706] hover:bg-[#FEF3C7] border-[#E0E0E0]"
              onClick={() => { setDetailsDialogOpen(false); openActionDialog(selectedRequest, "clarification"); }}>
              <HelpCircle className="h-4 w-4 mr-2" /> {t("approvals.needClarification", "Clarify")}
            </Button>
            <Button variant="outline" className="text-[#FF6B6B] hover:bg-[#FFE5E5] border-[#E0E0E0]"
              onClick={() => { setDetailsDialogOpen(false); openActionDialog(selectedRequest, "reject"); }}>
              <XCircle className="h-4 w-4 mr-2" /> {t("common.reject", "Reject")}
            </Button>
            <Button className="bg-[#5B2C93] hover:bg-[#4A2378] text-white"
              onClick={() => { setDetailsDialogOpen(false); openActionDialog(selectedRequest, "approve"); }}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isFinalStage(selectedRequest) ? t("approvals.grantAccess", "Grant Access") : t("common.approve", "Approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
