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
  History,
  Loader2,
  RefreshCw,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// Dynamic stage badge colors
const stageColors = [
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
];

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

  // Stage progress component
  const StageProgress = ({ currentStage, totalStages }: { currentStage: number; totalStages: number }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalStages }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-full ${
            i < currentStage ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
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
            <History className="h-6 w-6 text-[#0f62fe]" />
            {t("approvals.history", "Approval History")}
          </h1>
          <p className="text-muted-foreground mt-1">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("approvals.searchPlaceholder", "Search by ID, visitor name, company...")}
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
          <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {t("approvals.noHistory", "No approval history")}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
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
                task.taskStatus === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
              }`}
              onClick={() => handleViewDetails(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Top row: Request number, type, stage, decision */}
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
                      <Badge 
                        variant="outline" 
                        className={task.taskStatus === 'approved' 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-red-100 text-red-800 border-red-300'
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("approvals.decidedAt", "Decided")}: {task.taskCompletedAt ? format(new Date(task.taskCompletedAt), "MMM d, yyyy HH:mm") : "N/A"}
                      </span>
                      <span className="text-gray-400">|</span>
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
          <p className="text-sm text-muted-foreground">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0f62fe]" />
              {t("approvals.decisionDetails", "Decision Details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-mono text-lg font-medium">{selectedTask.request?.requestNumber}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={typeColors[selectedTask.request?.type] || "bg-gray-100"}>
                      {typeLabels[selectedTask.request?.type] || selectedTask.request?.type}
                    </Badge>
                    <Badge variant="outline" className={getStageColor(selectedTask.stageOrder || 1)}>
                      {selectedTask.stageName || `Stage ${selectedTask.stageOrder}`}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={selectedTask.taskStatus === 'approved' 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : 'bg-red-100 text-red-800 border-red-300'
                      }
                    >
                      {selectedTask.taskStatus === 'approved' ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("approvals.approved", "Approved")}</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> {t("approvals.rejected", "Rejected")}</>
                      )}
                    </Badge>
                  </div>
                </div>
                <StageProgress 
                  currentStage={selectedTask.stageOrder || 1} 
                  totalStages={selectedTask.totalStages || 1}
                />
              </div>
              
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.visitor", "Visitor")}</label>
                    <p className="text-sm font-medium">{selectedTask.request?.visitorName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.company", "Company")}</label>
                    <p className="text-sm font-medium">{selectedTask.request?.visitorCompany || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.purpose", "Purpose")}</label>
                    <p className="text-sm font-medium">{selectedTask.request?.purpose || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.workflow", "Workflow")}</label>
                    <p className="text-sm font-medium">{selectedTask.workflowName || "Default"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.assignedAt", "Assigned At")}</label>
                    <p className="text-sm font-medium">
                      {selectedTask.taskCreatedAt ? format(new Date(selectedTask.taskCreatedAt), "MMM d, yyyy HH:mm") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("approvals.decidedAt", "Decided At")}</label>
                    <p className="text-sm font-medium">
                      {selectedTask.taskCompletedAt ? format(new Date(selectedTask.taskCompletedAt), "MMM d, yyyy HH:mm") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              {t("common.close", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
