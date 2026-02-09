import { useState, useEffect } from "react";
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
  History,
  Loader2,
  RefreshCw,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Radio,
  CreditCard,
  Shield,
  Copy,
  Send,
  Mail,
  MessageSquare,
  Phone as PhoneIcon,
  ChevronDown,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { FormDataDisplay } from "@/modules/requests/FormDataDisplay";
import { toast } from "sonner";
// QR code image removed from dialog

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

// Dynamic stage badge colors
const stageColors = [
  "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  "bg-[#D1FAE5] text-[#059669] border-[#059669]",
];

const entryMethodConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  qr_code: { label: "QR Code", icon: <Shield className="h-4 w-4" />, color: "text-[#059669] bg-[#D1FAE5]" },
  rfid: { label: "RFID Tag", icon: <Radio className="h-4 w-4" />, color: "text-[#5B2C93] bg-[#E8DCF5]" },
  card: { label: "Access Card", icon: <CreditCard className="h-4 w-4" />, color: "text-[#5B2C93] bg-[#E8DCF5]" },
};

function getStageColor(stageOrder: number): string {
  return stageColors[(stageOrder - 1) % stageColors.length];
}

export default function ApprovalHistory() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [resendingChannel, setResendingChannel] = useState<string | null>(null);
  const pageSize = 20;
  
  const { data: historyTasks, isLoading, refetch } = trpc.requests.getMyApprovalHistory.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });
  

  
  // Filter by search and status
  const filteredTasks = (historyTasks || []).filter((task: any) => {
    // Status filter
    if (statusFilter !== "all" && task.taskStatus !== statusFilter) return false;
    
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
  
  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };
  
  const handleCopyQrData = () => {
    if (selectedTask?.accessMethod?.qrCodeData) {
      navigator.clipboard.writeText(selectedTask.accessMethod.qrCodeData);
      toast.success("QR code data copied to clipboard");
    }
  };
  
  const handleDownloadPdf = (requestId: number) => {
    // Open the PDF in a new tab for print/download
    const token = localStorage.getItem("centre3_token");
    const url = `/api/forms/pdf/${requestId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  };
  
  const handleResendCredentials = async (channel: "email" | "sms" | "whatsapp") => {
    if (!selectedTask) return;
    
    setResendingChannel(channel);
    
    try {
      const visitorEmail = selectedTask.request?.visitorEmail;
      const visitorPhone = selectedTask.request?.visitorPhone;
      const accessMethod = selectedTask.accessMethod;
      
      if (channel === "email") {
        if (!visitorEmail) {
          toast.error("No email address available", { description: "Visitor email is not provided" });
          setResendingChannel(null);
          return;
        }
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
        const message = encodeURIComponent(
          `Your access credentials for ${selectedTask.request?.siteName || 'the facility'}:\n\n` +
          `Request: ${selectedTask.request?.requestNumber}\n` +
          `Valid: ${selectedTask.request?.startDate ? format(new Date(selectedTask.request.startDate), "MMM d, yyyy") : "N/A"} - ${selectedTask.request?.endDate ? format(new Date(selectedTask.request.endDate), "MMM d, yyyy") : "N/A"}\n` +
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

  // Stage progress component
  const StageProgress = ({ currentStage, totalStages }: { currentStage: number; totalStages: number }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalStages }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-full ${
            i < currentStage ? 'bg-[#D1FAE5]' : 'bg-[#E0E0E0]'
          }`}
        />
      ))}
      <span className="text-xs text-[#6B6B6B] ml-1">
        {currentStage}/{totalStages}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8 flex items-center gap-2">
            <History className="h-6 w-6 text-[#5B2C93]" />
            {t("approvals.history", "Approval History")}
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            {t("approvals.historyDescription", "View your past approval decisions and actions")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input 
            placeholder={t("approvals.searchPlaceholder", "Search by ID, visitor name, company...")}
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <Filter className="h-4 w-4 mr-2 text-[#6B6B6B]" />
            <SelectValue placeholder={t("approvals.filterByStatus", "Filter by Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("approvals.allDecisions", "All Decisions")}</SelectItem>
            <SelectItem value="approved">{t("approvals.approved", "Approved")}</SelectItem>
            <SelectItem value="rejected">{t("approvals.rejected", "Rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-medium text-[#2C2C2C] mb-1">
              {t("approvals.noHistory", "No approval history")}
            </h3>
            <p className="text-sm text-[#6B6B6B] text-center max-w-sm">
              {t("approvals.noHistoryDescription", "Your approval decisions will appear here once you start reviewing requests.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                task.taskStatus === 'approved' ? 'border-l-[#059669]' : 'border-l-[#FF6B6B]'
              }`}
              onClick={() => handleViewDetails(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Top row: Request number, type, stage, decision */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium text-[#5B2C93]">
                        {task.request?.requestNumber}
                      </span>
                      <Badge variant="outline" className={typeColors[task.request?.type] || "bg-[#F5F5F5]"}>
                        {typeLabels[task.request?.type] || task.request?.type}
                      </Badge>
                      <Badge variant="outline" className={getStageColor(task.stageOrder || 1)}>
                        {task.stageName || `Stage ${task.stageOrder}`}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={task.taskStatus === 'approved' 
                          ? 'bg-[#D1FAE5] text-[#059669] border-[#059669]' 
                          : 'bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]'
                        }
                      >
                        {task.taskStatus === 'approved' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("approvals.approved", "Approved")}</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> {t("approvals.rejected", "Rejected")}</>
                        )}
                      </Badge>
                      <StageProgress 
                        currentStage={task.stageOrder || 1} 
                        totalStages={task.totalStages || 1}
                      />
                    </div>
                    
                    {/* Visitor info */}
                    <div className="flex items-center gap-4 text-sm text-[#6B6B6B] mb-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.request?.visitorName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {task.request?.visitorCompany || "N/A"}
                      </span>
                    </div>
                    
                    {/* Date info */}
                    <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("approvals.decidedAt", "Decided")}: {task.taskCompletedAt ? format(new Date(task.taskCompletedAt), "MMM d, yyyy HH:mm") : "N/A"}
                      </span>
                      <span className="text-[#9CA3AF]">|</span>
                      <span>
                        {t("approvals.workflow", "Workflow")}: {task.workflowName || "Default"}
                      </span>
                    </div>
                  </div>
                  
                  {/* View button */}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(historyTasks || []).length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-[#6B6B6B]">
            {t("approvals.showingPage", "Page")} {page + 1}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("common.previous", "Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={(historyTasks || []).length < pageSize}
            >
              {t("common.next", "Next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B2C93]" />
              {t("approvals.decisionDetails", "Decision Details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg">
                <div>
                  <span className="font-mono text-lg font-medium">{selectedTask.request?.requestNumber}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={typeColors[selectedTask.request?.type] || "bg-[#F5F5F5]"}>
                      {typeLabels[selectedTask.request?.type] || selectedTask.request?.type}
                    </Badge>
                    <Badge variant="outline" className={getStageColor(selectedTask.stageOrder || 1)}>
                      {selectedTask.stageName || `Stage ${selectedTask.stageOrder}`}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={selectedTask.taskStatus === 'approved' 
                        ? 'bg-[#D1FAE5] text-[#059669] border-[#059669]' 
                        : 'bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]'
                      }
                    >
                      {selectedTask.taskStatus === 'approved' ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("approvals.approved", "Approved")}</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> {t("approvals.rejected", "Rejected")}</>
                      )}
                    </Badge>
                    {/* Overall request status */}
                    {selectedTask.request?.status && (
                      <Badge variant="outline" className={`text-xs ${
                        selectedTask.request.status === 'approved' ? 'bg-[#D1FAE5] text-[#059669] border-[#059669]' :
                        selectedTask.request.status === 'rejected' ? 'bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]' :
                        'bg-[#FEF3C7] text-[#D97706] border-[#D97706]'
                      }`}>
                        Request: {selectedTask.request.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <StageProgress 
                  currentStage={selectedTask.stageOrder || 1} 
                  totalStages={selectedTask.totalStages || 1}
                />
              </div>
              
              {/* Access Method - Compact, no QR image */}
              {selectedTask.taskStatus === 'approved' && selectedTask.accessMethod?.entryMethod && (
                <div className="bg-[#D1FAE5] border border-[#059669] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-[#059669]" />
                      <Badge variant="secondary" className={`${entryMethodConfig[selectedTask.accessMethod.entryMethod]?.color} gap-2 text-sm px-3 py-1`}>
                        {entryMethodConfig[selectedTask.accessMethod.entryMethod]?.icon}
                        {entryMethodConfig[selectedTask.accessMethod.entryMethod]?.label}
                      </Badge>
                      {selectedTask.accessMethod.qrCodeData && (
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-white px-2 py-1 rounded border">{selectedTask.accessMethod.qrCodeData}</code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyQrData}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {selectedTask.accessMethod.rfidTag && (
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border">{selectedTask.accessMethod.rfidTag}</code>
                      )}
                      {selectedTask.accessMethod.cardNumber && (
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border">{selectedTask.accessMethod.cardNumber}</code>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTask.accessMethod.accessGrantedByName && (
                        <span className="text-xs text-[#6B6B6B]">by {selectedTask.accessMethod.accessGrantedByName}</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" disabled={!!resendingChannel}>
                            {resendingChannel ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Resend
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResendCredentials("email")} className="gap-2">
                            <Mail className="h-4 w-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendCredentials("sms")} className="gap-2">
                            <MessageSquare className="h-4 w-4" /> SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendCredentials("whatsapp")} className="gap-2">
                            <PhoneIcon className="h-4 w-4" /> WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 3-Column Details Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1: Visitor Information */}
                <div className="border-l-4 border-[#5B2C93] bg-[#F5F5F5] rounded-r-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#5B2C93]" />
                    Visitor Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Full Name</label>
                      <p className="text-sm font-medium">{selectedTask.request?.visitorName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Company</label>
                      <p className="text-sm font-medium">{selectedTask.request?.visitorCompany || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">ID Type</label>
                      <p className="text-sm font-medium">{selectedTask.request?.visitorIdType?.toUpperCase().replace(/_/g, ' ') || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">ID Number</label>
                      <p className="text-sm font-medium">{selectedTask.request?.visitorIdNumber || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Phone</label>
                      <p className="text-sm font-medium">{selectedTask.request?.visitorPhone || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Email</label>
                      <p className="text-sm font-medium truncate">{selectedTask.request?.visitorEmail || "N/A"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Column 2: Visit Details */}
                <div className="border-l-4 border-[#5B2C93] bg-[#F5F5F5] rounded-r-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#5B2C93]" />
                    Visit Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Purpose</label>
                      <p className="text-sm font-medium">{selectedTask.request?.purpose || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Start Date</label>
                      <p className="text-sm font-medium">
                        {selectedTask.request?.startDate ? format(new Date(selectedTask.request.startDate), "EEEE, MMM d, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">End Date</label>
                      <p className="text-sm font-medium">
                        {selectedTask.request?.endDate ? format(new Date(selectedTask.request.endDate), "EEEE, MMM d, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Visit Time</label>
                      <p className="text-sm font-medium">
                        {selectedTask.request?.startTime || "00:00"} - {selectedTask.request?.endTime || "23:59"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Submitted On</label>
                      <p className="text-sm font-medium">
                        {selectedTask.request?.createdAt ? format(new Date(selectedTask.request.createdAt), "MMM d, yyyy 'at' HH:mm") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Column 3: Location & Workflow */}
                <div className="border-l-4 border-[#059669] bg-[#F5F5F5] rounded-r-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-[#2C2C2C] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#059669]" />
                    Location & Workflow
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Site</label>
                      <p className="text-sm font-medium">{selectedTask.request?.siteName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Workflow</label>
                      <p className="text-sm font-medium">{selectedTask.workflowName || "Default"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Your Stage</label>
                      <p className="text-sm font-medium">{selectedTask.stageName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Assigned At</label>
                      <p className="text-sm font-medium">
                        {selectedTask.taskCreatedAt ? format(new Date(selectedTask.taskCreatedAt), "MMM d, yyyy HH:mm") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2C2C2C]">Decided At</label>
                      <p className="text-sm font-medium">
                        {selectedTask.taskCompletedAt ? format(new Date(selectedTask.taskCompletedAt), "MMM d, yyyy HH:mm") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dynamic Form Data */}
              {selectedTask.request?.formData && selectedTask.request?.selectedTypeIds && (
                <FormDataDisplay
                  formData={selectedTask.request.formData as Record<string, any>}
                  selectedTypeIds={selectedTask.request.selectedTypeIds as number[]}
                  categoryId={selectedTask.request.categoryId}
                  compact={false}
                />
              )}
              
              {/* Approval Timeline */}
              <div className="border-l-4 border-[#D97706] bg-[#F5F5F5] rounded-r-lg p-4">
                <h4 className="text-sm font-medium text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-[#D97706]" />
                  Approval Timeline
                </h4>
                
                {/* Stage Progress Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: selectedTask.totalStages || 1 }).map((_: unknown, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        idx + 1 < (selectedTask.stageOrder || 1) 
                          ? "bg-[#D1FAE5] text-[#059669] border-2 border-[#059669]" 
                          : idx + 1 === (selectedTask.stageOrder || 1)
                            ? selectedTask.taskStatus === 'approved' ? "bg-[#D1FAE5] text-[#059669] border-2 border-[#059669]" : "bg-[#FFE5E5] text-[#FF6B6B] border-2 border-[#FF6B6B]"
                            : "bg-[#F5F5F5] text-[#6B6B6B] border-2 border-[#E0E0E0]"
                      }`}>
                        {idx + 1 < (selectedTask.stageOrder || 1) || (idx + 1 === (selectedTask.stageOrder || 1) && selectedTask.taskStatus === 'approved') ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : idx + 1 === (selectedTask.stageOrder || 1) && selectedTask.taskStatus === 'rejected' ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      {idx < (selectedTask.totalStages || 1) - 1 && (
                        <div className={`w-8 h-0.5 ${
                          idx + 1 < (selectedTask.stageOrder || 1) ? "bg-[#D1FAE5]" : "bg-[#E0E0E0]"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Timeline Entries */}
                {selectedTask.approvalHistory && selectedTask.approvalHistory.length > 0 ? (
                  <div className="space-y-0 max-h-[350px] overflow-y-auto relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#E0E0E0]" />
                    
                    {selectedTask.approvalHistory.map((history: any, idx: number) => {
                      const actionBgColors: Record<string, string> = {
                        approved: "bg-[#D1FAE5]", rejected: "bg-[#FF6B6B]", decision_made: "bg-[#E8DCF5]",
                        info_requested: "bg-[#FEF3C7]", submitted: "bg-[#E8DCF5]", escalated: "bg-[#E8DCF5]",
                        workflow_started: "bg-[#F5F5F5]", workflow_completed: "bg-[#059669]",
                        stage_completed: "bg-[#D1FAE5]", task_assigned: "bg-[#5B2C93]",
                        sent_back: "bg-[#FEF3C7]", clarification_requested: "bg-[#FEF3C7]",
                        clarification_provided: "bg-[#5B2C93]", task_reassigned: "bg-[#E8DCF5]",
                      };
                      const actionColors: Record<string, string> = {
                        approved: "border-[#059669]", rejected: "border-[#FF6B6B]", decision_made: "border-[#5B2C93]",
                        info_requested: "border-[#D97706]", submitted: "border-[#5B2C93]", escalated: "border-[#5B2C93]",
                        workflow_started: "border-[#B0B0B0]", workflow_completed: "border-[#059669]",
                        stage_completed: "border-[#059669]", task_assigned: "border-[#5B2C93]",
                        sent_back: "border-[#D97706]", clarification_requested: "border-[#D97706]",
                        clarification_provided: "border-[#5B2C93]", task_reassigned: "border-[#5B2C93]",
                      };
                      const actionLabels: Record<string, string> = {
                        approved: "Approved", rejected: "Rejected", decision_made: "Decision Made",
                        info_requested: "Clarification Requested", submitted: "Submitted", escalated: "Escalated",
                        workflow_started: "Workflow Started", workflow_completed: "Workflow Completed",
                        stage_completed: "Stage Completed", task_assigned: "Task Assigned",
                        sent_back: "Sent Back", clarification_requested: "Clarification Requested",
                        clarification_provided: "Clarification Provided", task_reassigned: "Task Reassigned",
                      };
                      
                      const details = (history.details as any) || {};
                      const stageName = details.stageName || details.workflowName || 
                        (history.actionType === "workflow_started" ? "Initiated" :
                         history.actionType === "workflow_completed" ? (details.newStatus === "approved" ? "Final Approval" : "Completed") :
                         "Stage");
                      const comments = details.comments || details.reason || details.response || "";
                      const decision = details.decision || details.newStatus || "";
                      const decisionLabel = history.actionType === "decision_made" 
                        ? (decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : decision.replace(/_/g, " "))
                        : "";
                      
                      return (
                        <div key={idx} className="relative pl-10 pb-4">
                          <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 ${actionBgColors[history.actionType] || "bg-[#B0B0B0]"}`}>
                            {history.actionType === 'approved' || history.actionType === 'decision_made' ? <CheckCircle2 className="h-3 w-3 text-white" /> :
                             history.actionType === 'rejected' ? <XCircle className="h-3 w-3 text-white" /> :
                             <Clock className="h-3 w-3 text-white" />}
                          </div>
                          
                          <div className={`border-l-2 pl-3 py-1 ${actionColors[history.actionType] || "border-[#E0E0E0]"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {actionLabels[history.actionType] || history.actionType.replace(/_/g, " ")}
                                </span>
                                <Badge variant="outline" className="text-xs px-1.5 py-0">{stageName}</Badge>
                                {decisionLabel && history.actionType === "decision_made" && (
                                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${
                                    decision === "approved" ? "bg-[#D1FAE5] text-[#059669] border-[#059669]" :
                                    decision === "rejected" ? "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]" :
                                    "bg-[#F5F5F5] text-[#2C2C2C]"
                                  }`}>{decisionLabel}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-[#6B6B6B] whitespace-nowrap ml-2">
                                {history.actionAt ? format(new Date(history.actionAt), "MMM d, yyyy HH:mm") : ""}
                              </span>
                            </div>
                            <div className="text-xs text-[#6B6B6B] mt-0.5">
                              <span className="font-medium">{history.userName || history.userEmail || "System"}</span>
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
                  <p className="text-sm text-[#6B6B6B] italic">No approval history available for this request.</p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              {t("common.close", "Close")}
            </Button>
            {selectedTask?.request?.id && selectedTask?.request?.status === 'approved' && (
              <Button 
                variant="outline" 
                onClick={() => handleDownloadPdf(selectedTask.request.id)} 
                className="gap-2 text-[#5B2C93] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
              >
                <Download className="h-4 w-4" />
                {t("approvals.downloadPdf", "Download Form PDF")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
