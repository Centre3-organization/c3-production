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
  Copy
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
  admin_visit: "bg-blue-100 text-blue-800 border-blue-200",
  work_permit: "bg-purple-100 text-purple-800 border-purple-200",
  material_entry: "bg-amber-100 text-amber-800 border-amber-200",
  tep: "bg-cyan-100 text-cyan-800 border-cyan-200",
  mop: "bg-rose-100 text-rose-800 border-rose-200",
  escort: "bg-green-100 text-green-800 border-green-200",
};

// Dynamic stage badge colors - cycles through for any number of stages
const stageColors = [
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
];

function getStageColor(stageOrder: number): string {
  return stageColors[(stageOrder - 1) % stageColors.length];
}

export default function Approvals() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Access grant dialog state
  const [accessGrantDialogOpen, setAccessGrantDialogOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [rfidTag, setRfidTag] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  
  // QR Code result state
  const [qrResultDialogOpen, setQrResultDialogOpen] = useState(false);
  const [generatedQrCode, setGeneratedQrCode] = useState<string>("");
  const [generatedQrData, setGeneratedQrData] = useState<string>("");
  
  // Use the workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: approvalStats } = trpc.requests.getApprovalStats.useQuery();
  
  // Use the workflow-based approval mutation
  const approveTask = trpc.requests.approveTask.useMutation({
    onSuccess: async (result: any) => {
      // Check if this was a final approval with QR code
      if (result.isFinalApproval && result.entryMethod === "qr_code" && result.qrCodeData) {
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
      setSelectedRequest(null);
      setProcessingId(null);
      setAccessGrantDialogOpen(false);
      resetAccessGrantForm();
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
      setSelectedRequest(null);
      setRejectDialogOpen(false);
      setRejectReason("");
      setProcessingId(null);
    },
    onError: (error) => {
      toast.error("Failed to reject", { description: error.message });
      setProcessingId(null);
    }
  });
  
  const resetAccessGrantForm = () => {
    setEntryMethod("qr_code");
    setRfidTag("");
    setCardNumber("");
    setApprovalComments("");
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
  
  // Filter by search and stage
  const filteredTasks = (pendingTasks || []).filter((task: any) => {
    // Stage filter
    if (stageFilter !== "all") {
      const taskStageName = task.stageName || `Stage ${task.stageOrder}`;
      if (taskStageName !== stageFilter) return false;
    }
    
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
  
  const handleApprove = (task: any) => {
    // If this is the final stage, show access grant dialog
    if (isFinalStage(task)) {
      setSelectedRequest(task);
      setAccessGrantDialogOpen(true);
    } else {
      // Regular approval for non-final stages
      setProcessingId(task.taskId);
      approveTask.mutate({ 
        taskId: task.taskId,
        comments: `Approved at ${task.stageName || 'Stage ' + task.stageOrder} review`
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
      comments: approvalComments || `Final approval - Access granted via ${entryMethod.replace("_", " ")}`,
      entryMethod: entryMethod,
      rfidTag: entryMethod === "rfid" ? rfidTag : undefined,
      cardNumber: entryMethod === "card" ? cardNumber : undefined,
      isFinalApproval: true,
    });
  };
  
  const handleRejectClick = (task: any) => {
    setSelectedRequest(task);
    setRejectDialogOpen(true);
  };
  
  const handleRejectConfirm = () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessingId(selectedRequest.taskId);
    rejectTask.mutate({ 
      taskId: selectedRequest.taskId, 
      comments: rejectReason 
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

  // Stage progress component
  const StageProgress = ({ currentStage, totalStages, stageName }: { currentStage: number; totalStages: number; stageName: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalStages }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < currentStage ? "bg-green-500" : i === currentStage - 1 ? "bg-amber-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {currentStage}/{totalStages}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("approvals.title", "My Approvals")}</h1>
          <p className="text-sm text-muted-foreground">{t("approvals.subtitle", "Review and process pending approval requests")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Stats Cards - Dynamic based on stages */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#0f62fe]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.totalPending", "Total Pending")}</p>
                <p className="text-2xl font-bold">{pendingTasks?.length || 0}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-[#0f62fe]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {uniqueStages.slice(0, 3).map((stage, index) => (
          <Card key={stage.name} className={`border-l-4 ${index === 0 ? "border-l-amber-500" : index === 1 ? "border-l-purple-500" : "border-l-emerald-500"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{stage.name}</p>
                  <p className="text-2xl font-bold">{stage.count}</p>
                </div>
                <div className={`p-2 rounded-lg ${index === 0 ? "bg-amber-50" : index === 1 ? "bg-purple-50" : "bg-emerald-50"}`}>
                  <GitBranch className={`h-5 w-5 ${index === 0 ? "text-amber-500" : index === 1 ? "text-purple-500" : "text-emerald-500"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("approvals.searchPlaceholder", "Search by request number, visitor, or company...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("approvals.filterByStage", "Filter by stage")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("approvals.allStages", "All Stages")}</SelectItem>
            {uniqueStages.map((stage) => (
              <SelectItem key={stage.name} value={stage.name}>
                {stage.name} ({stage.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("approvals.noTasks", "No pending approvals")}</h3>
            <p className="text-sm text-muted-foreground">{t("approvals.noTasksDescription", "You're all caught up! Check back later for new requests.")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">{task.request?.requestNumber}</span>
                        <Badge variant="outline" className={typeColors[task.request?.type] || "bg-gray-100"}>
                          {typeLabels[task.request?.type] || task.request?.type}
                        </Badge>
                        <Badge variant="outline" className={getStageColor(task.stageOrder || 1)}>
                          {task.stageName || `Stage ${task.stageOrder}`}
                          {isFinalStage(task) && " (Final)"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{task.request?.visitorName}</span>
                        {task.request?.visitorCompany && ` • ${task.request.visitorCompany}`}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.request?.siteName || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.request?.startDate ? format(new Date(task.request.startDate), "MMM d") : "N/A"}
                        </span>
                        <StageProgress 
                          currentStage={task.stageOrder || 1} 
                          totalStages={task.totalStages || 1}
                          stageName={task.stageName}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectClick(task);
                      }}
                      disabled={processingId === task.taskId}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("common.reject", "Reject")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(task);
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {t("approvals.rejectRequest", "Reject Request")}
            </DialogTitle>
            <DialogDescription>
              {t("approvals.rejectDescription", "Please provide a reason for rejecting this request. This will be visible to the requestor.")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-medium">{selectedRequest.request?.requestNumber}</span>
                  <Badge variant="outline" className={getStageColor(selectedRequest.stageOrder || 1)}>
                    {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.request?.visitorName} • {selectedRequest.request?.visitorCompany}
                </p>
              </div>
              
              <Textarea
                placeholder={t("approvals.rejectReasonPlaceholder", "Enter rejection reason...")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {t("approvals.confirmReject", "Confirm Rejection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Grant Dialog - For Final Approval */}
      <Dialog open={accessGrantDialogOpen} onOpenChange={(open) => {
        setAccessGrantDialogOpen(open);
        if (!open) resetAccessGrantForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
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
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-medium">{selectedRequest.request?.requestNumber}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Final Stage
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.request?.visitorName} • {selectedRequest.request?.visitorCompany}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRequest.request?.siteName} • {selectedRequest.request?.startDate} - {selectedRequest.request?.endDate}
                </p>
              </div>
              
              {/* Entry Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("approvals.selectEntryMethod", "Select Entry Method")}</Label>
                <RadioGroup value={entryMethod} onValueChange={(v) => setEntryMethod(v as any)} className="grid gap-3">
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "qr_code" ? "border-green-500 bg-green-50" : "hover:bg-gray-50"}`}>
                    <RadioGroupItem value="qr_code" id="qr_code" />
                    <Label htmlFor="qr_code" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <QrCode className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.qrCode", "QR Code")}</p>
                        <p className="text-xs text-muted-foreground">{t("approvals.qrCodeDesc", "Generate a unique QR code for visitor check-in")}</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "rfid" ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                    <RadioGroupItem value="rfid" id="rfid" />
                    <Label htmlFor="rfid" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Radio className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.rfid", "RFID Tag")}</p>
                        <p className="text-xs text-muted-foreground">{t("approvals.rfidDesc", "Assign an RFID tag for contactless access")}</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${entryMethod === "card" ? "border-purple-500 bg-purple-50" : "hover:bg-gray-50"}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{t("approvals.accessCard", "Access Card")}</p>
                        <p className="text-xs text-muted-foreground">{t("approvals.accessCardDesc", "Issue a physical access card")}</p>
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
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAccessGrantDialogOpen(false);
              resetAccessGrantForm();
            }}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
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

      {/* QR Code Result Dialog */}
      <Dialog open={qrResultDialogOpen} onOpenChange={setQrResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <QrCode className="h-5 w-5" />
              {t("approvals.qrCodeGenerated", "QR Code Generated")}
            </DialogTitle>
            <DialogDescription>
              {t("approvals.qrCodeGeneratedDesc", "The access QR code has been generated. Share this with the visitor for check-in.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {generatedQrCode && (
              <div className="p-4 bg-white border rounded-lg shadow-sm">
                <img src={generatedQrCode} alt="Access QR Code" className="w-64 h-64" />
              </div>
            )}
            
            <div className="w-full p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-muted-foreground">{t("approvals.qrCodeData", "QR Code Data")}</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border truncate">
                  {generatedQrData}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyQrData}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadQr} className="gap-2">
              <Download className="h-4 w-4" />
              {t("approvals.downloadQr", "Download")}
            </Button>
            <Button onClick={() => setQrResultDialogOpen(false)}>
              {t("common.done", "Done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0f62fe]" />
              {t("approvals.requestDetails", "Request Details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-mono text-lg font-medium">{selectedRequest.request?.requestNumber}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={typeColors[selectedRequest.request?.type] || "bg-gray-100"}>
                      {typeLabels[selectedRequest.request?.type] || selectedRequest.request?.type}
                    </Badge>
                    <Badge variant="outline" className={getStageColor(selectedRequest.stageOrder || 1)}>
                      {selectedRequest.stageName || `Stage ${selectedRequest.stageOrder}`}
                      {isFinalStage(selectedRequest) && " (Final)"}
                    </Badge>
                  </div>
                </div>
                <StageProgress 
                  currentStage={selectedRequest.stageOrder || 1} 
                  totalStages={selectedRequest.totalStages || 1}
                  stageName={selectedRequest.stageName}
                />
              </div>
              
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.visitor", "Visitor")}</label>
                    <p className="text-sm font-medium">{selectedRequest.request?.visitorName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.company", "Company")}</label>
                    <p className="text-sm font-medium">{selectedRequest.request?.visitorCompany || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.site", "Site")}</label>
                    <p className="text-sm font-medium">{selectedRequest.request?.siteName || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.purpose", "Purpose")}</label>
                    <p className="text-sm font-medium">{selectedRequest.request?.purpose || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.dates", "Dates")}</label>
                    <p className="text-sm font-medium">
                      {selectedRequest.request?.startDate ? format(new Date(selectedRequest.request.startDate), "MMM d, yyyy") : "N/A"}
                      {selectedRequest.request?.endDate && selectedRequest.request.endDate !== selectedRequest.request.startDate && (
                        <> - {format(new Date(selectedRequest.request.endDate), "MMM d, yyyy")}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.workflow", "Workflow")}</label>
                    <p className="text-sm font-medium">{selectedRequest.workflowName || "Default"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              {t("common.close", "Close")}
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setDetailsDialogOpen(false);
                handleRejectClick(selectedRequest);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t("common.reject", "Reject")}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setDetailsDialogOpen(false);
                handleApprove(selectedRequest);
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
