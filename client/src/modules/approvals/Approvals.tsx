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
  Send
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
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

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
  
  // Use the workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: approvalStats } = trpc.requests.getApprovalStats.useQuery();
  
  // Use the workflow-based approval mutation
  const approveTask = trpc.requests.approveTask.useMutation({
    onSuccess: (result) => {
      toast.success("Request approved", {
        description: result.message || "Moved to next approval stage"
      });
      refetch();
      setSelectedRequest(null);
      setProcessingId(null);
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
  
  const handleApprove = (task: any) => {
    setProcessingId(task.taskId);
    approveTask.mutate({ 
      taskId: task.taskId,
      comments: `Approved at ${task.stageName || 'Stage ' + task.stageOrder} review`
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

  // Stage progress component
  const StageProgress = ({ currentStage, totalStages, stageName }: { currentStage: number; totalStages: number; stageName: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalStages }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-full transition-colors ${
              i < currentStage 
                ? 'bg-green-500' 
                : i === currentStage - 1 
                  ? 'bg-[#0f62fe]' 
                  : 'bg-gray-200'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#0f62fe]" />
            {t("approvals.myApprovals", "My Approvals")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("approvals.description", "All pending approval tasks assigned to you across all workflow stages")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <GitBranch className="h-3 w-3 mr-1" />
            {t("approvals.workflowBased", "Workflow-Based")}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("common.refresh", "Refresh")}
          </Button>
        </div>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* My Pending */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">{t("approvals.myPending", "My Pending")}</p>
                <p className="text-3xl font-bold text-amber-900">{approvalStats?.pending || (pendingTasks || []).length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Today */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">{t("approvals.completedToday", "Completed Today")}</p>
                <p className="text-3xl font-bold text-green-900">{approvalStats?.completedToday || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Awaiting Others */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">{t("approvals.awaitingOthers", "Awaiting Others")}</p>
                <p className="text-3xl font-bold text-blue-900">{approvalStats?.awaitingOthers || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Dynamic Stage Summary */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">{t("approvals.activeStages", "Active Stages")}</p>
                <p className="text-3xl font-bold text-purple-900">{uniqueStages.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown - Dynamic chips */}
      {uniqueStages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border">
          <span className="text-sm font-medium text-gray-600 mr-2">{t("approvals.byStage", "By Stage")}:</span>
          {uniqueStages.map((stage) => (
            <Badge 
              key={stage.name}
              variant="outline" 
              className={`${getStageColor(stage.order)} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setStageFilter(stageFilter === stage.name ? "all" : stage.name)}
            >
              {stage.name}: {stage.count}
            </Badge>
          ))}
          {stageFilter !== "all" && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setStageFilter("all")}
            >
              {t("common.clearFilter", "Clear filter")}
            </Button>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("approvals.searchPlaceholder", "Search by ID, visitor name, company, stage...")}
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("approvals.filterByStage", "Filter by Stage")} />
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

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {t("approvals.noTasks", "No pending approvals")}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {stageFilter !== "all" 
                ? t("approvals.noTasksFiltered", "No tasks found for the selected stage filter")
                : t("approvals.noTasksDescription", "You're all caught up! There are no approval tasks waiting for your review.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
              style={{ borderLeftColor: task.stageOrder === 1 ? '#f59e0b' : task.stageOrder === 2 ? '#3b82f6' : '#8b5cf6' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Top row: Request number, type, stage */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium text-[#0f62fe]">
                        {task.request?.requestNumber}
                      </span>
                      <Badge variant="outline" className={typeColors[task.request?.type] || "bg-gray-100"}>
                        {typeLabels[task.request?.type] || task.request?.type}
                      </Badge>
                      <Badge variant="outline" className={getStageColor(task.stageOrder || 1)}>
                        {task.stageName || `Stage ${task.stageOrder}`}
                      </Badge>
                      {/* Stage progress */}
                      <StageProgress 
                        currentStage={task.stageOrder || 1} 
                        totalStages={task.totalStages || 1}
                        stageName={task.stageName}
                      />
                    </div>
                    
                    {/* Visitor info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.request?.visitorName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {task.request?.visitorCompany || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {task.request?.siteName || "N/A"}
                      </span>
                    </div>
                    
                    {/* Date info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.request?.startDate ? format(new Date(task.request.startDate), "MMM d, yyyy") : "N/A"}
                        {task.request?.endDate && task.request.endDate !== task.request.startDate && (
                          <> - {format(new Date(task.request.endDate), "MMM d, yyyy")}</>
                        )}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>
                        {t("approvals.workflow", "Workflow")}: {task.workflowName || "Default"}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>
                        {t("approvals.assigned", "Assigned")}: {task.taskCreatedAt ? format(new Date(task.taskCreatedAt), "MMM d, HH:mm") : "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
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
                      {t("common.approve", "Approve")}
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
              {t("common.approve", "Approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
