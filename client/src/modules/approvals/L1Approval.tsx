import { useState } from "react";
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
  History
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
  admin_visit: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  work_permit: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]",
  material_entry: "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]",
  tep: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]/20",
  mop: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  escort: "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]",
};

export default function L1Approval() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Use the new workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  
  // Use the new workflow-based approval mutation
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
  
  // Use the new workflow-based rejection mutation
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
  
  // Filter to only show L1 stage tasks
  const l1Tasks = (pendingTasks || []).filter((task: any) => 
    task.stageName?.toLowerCase().includes('l1') || task.stageOrder === 1
  );
  
  // Filter by search
  const filteredTasks = l1Tasks.filter((task: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.requestNumber?.toLowerCase().includes(query) ||
      task.visitorName?.toLowerCase().includes(query) ||
      (task.visitorCompany?.toLowerCase().includes(query))
    );
  });
  
  const handleApprove = (task: any) => {
    setProcessingId(task.taskId);
    approveTask.mutate({ 
      taskId: task.taskId,
      comments: "Approved at L1 review"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-[#2C2C2C] flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#FFB84D]" />
            L1 Approval Queue
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            Initial review stage - Quick review and forward requests to security approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]">
            <GitBranch className="h-3 w-3 mr-1" />
            Workflow-Based
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#FFF4E5] border-[#FFB84D]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#FFB84D]">In L1 Queue</p>
                <p className="text-3xl font-medium text-[#FFB84D]">{l1Tasks.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#FFF4E5] flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#FFB84D]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#E8DCF5] border-[#5B2C93]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5B2C93]">Pending L2</p>
                <p className="text-3xl font-medium text-[#5B2C93]">{stats?.pendingManual || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#E8DCF5] flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#5B2C93]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#E8F9F8] border-[#4ECDC4]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#4ECDC4]">Approved</p>
                <p className="text-3xl font-medium text-[#4ECDC4]">{stats?.approved || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#E8F9F8] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-[#4ECDC4]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#FFE5E5] border-[#FF6B6B]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#FF6B6B]">Rejected</p>
                <p className="text-3xl font-medium text-[#FF6B6B]">{stats?.rejected || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#FFE5E5] flex items-center justify-center">
                <XCircle className="h-6 w-6 text-[#FF6B6B]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
          <Input 
            placeholder="Search by ID, visitor name, company..." 
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Request Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-[#E8F9F8] flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#4ECDC4]" />
            </div>
            <h3 className="text-lg font-medium text-[#2C2C2C]">All caught up!</h3>
            <p className="text-[#6B6B6B] mt-1">No pending L1 approvals at the moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-[#FFB84D]"
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Main Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={typeColors[task.type] || "bg-[#F5F5F5]"}>
                          {typeLabels[task.type] || task.type}
                        </Badge>
                        <span className="text-sm font-mono text-[#6B6B6B]">
                          {task.requestNumber}
                        </span>
                        <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {task.workflowName || "Standard Workflow"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]">
                          Stage {task.stageOrder}: {task.stageName}
                        </Badge>
                        <span className="text-xs text-[#6B6B6B]">
                          {task.createdAt ? format(new Date(task.createdAt), "MMM dd, HH:mm") : ""}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-6">
                      {/* Visitor */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#5B2C93]/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-[#5B2C93]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2C2C2C]">{task.visitorName}</p>
                          <p className="text-sm text-[#6B6B6B]">{task.visitorCompany || "Individual"}</p>
                        </div>
                      </div>
                      
                      {/* Site */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E8DCF5] flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-[#5B2C93]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2C2C2C]">{task.siteName || "N/A"}</p>
                          <p className="text-sm text-[#6B6B6B]">Destination</p>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E8F9F8] flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-[#4ECDC4]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2C2C2C]">
                            {task.startDate ? format(new Date(task.startDate), "MMM dd") : "N/A"}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            {task.startTime || ""} - {task.endTime || ""}
                          </p>
                        </div>
                      </div>
                      
                      {/* Purpose */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E8DCF5] flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-[#5B2C93]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2C2C2C] line-clamp-1">{task.purpose || "General Visit"}</p>
                          <p className="text-sm text-[#6B6B6B]">Purpose</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Panel */}
                  <div className="flex flex-col justify-center gap-2 px-5 py-4 bg-[#F5F5F5]/30 border-l min-w-[180px]">
                    <Button 
                      size="sm" 
                      className="bg-[#4ECDC4] hover:bg-[#3DBDB4]"
                      onClick={() => handleApprove(task)}
                      disabled={processingId === task.taskId}
                    >
                      {processingId === task.taskId ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectClick(task)}
                      disabled={processingId === task.taskId}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(task)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Details
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
            <DialogTitle className="flex items-center gap-2 text-[#FF6B6B]">
              <AlertTriangle className="h-5 w-5" />
              Reject Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this access request. This will be recorded in the approval history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5B2C93]" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestNumber} - {selectedRequest?.workflowName || "Standard Workflow"}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Visitor & Visit Details */}
              <div className="border-l-4 border-[#5B2C93] bg-[#F5F5F5] rounded-r-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-[#2C2C2C] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#5B2C93]" />
                  Visitor & Visit Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Visitor</label>
                    <p className="text-sm font-medium">{selectedRequest.visitorName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Company</label>
                    <p className="text-sm font-medium">{selectedRequest.visitorCompany || "Individual"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Site</label>
                    <p className="text-sm font-medium">{selectedRequest.siteName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Request Type</label>
                    <p className="text-sm font-medium">{typeLabels[selectedRequest.type] || selectedRequest.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Visit Date</label>
                    <p className="text-sm font-medium">
                      {selectedRequest.startDate ? format(new Date(selectedRequest.startDate), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Time</label>
                    <p className="text-sm font-medium">{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2C2C2C]">Purpose</label>
                  <p className="text-sm font-medium">{selectedRequest.purpose || "General Visit"}</p>
                </div>
              </div>
              
              {/* Workflow Information */}
              <div className="border-l-4 border-[#4ECDC4] bg-[#F5F5F5] rounded-r-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-[#2C2C2C] flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#4ECDC4]" />
                  Workflow Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Workflow</label>
                    <p className="text-sm font-medium">{selectedRequest.workflowName || "Standard Workflow"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2C2C2C]">Current Stage</label>
                    <Badge variant="outline" className="bg-[#FFF4E5] text-[#FFB84D] mt-1">
                      Stage {selectedRequest.stageOrder}: {selectedRequest.stageName}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
