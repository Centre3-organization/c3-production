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
  admin_visit: "bg-blue-100 text-blue-800 border-blue-200",
  work_permit: "bg-purple-100 text-purple-800 border-purple-200",
  material_entry: "bg-amber-100 text-amber-800 border-amber-200",
  tep: "bg-cyan-100 text-cyan-800 border-cyan-200",
  mop: "bg-rose-100 text-rose-800 border-rose-200",
  escort: "bg-green-100 text-green-800 border-green-200",
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            L1 Approval Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Initial review stage - Quick review and forward requests to security approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">In L1 Queue</p>
                <p className="text-3xl font-bold text-amber-900">{l1Tasks.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Pending L2</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.pendingManual || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats?.approved || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats?.rejected || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground mt-1">No pending L1 approvals at the moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-amber-400"
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Main Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={typeColors[task.type] || "bg-gray-100"}>
                          {typeLabels[task.type] || task.type}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {task.requestNumber}
                        </span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {task.workflowName || "Standard Workflow"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Stage {task.stageOrder}: {task.stageName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {task.createdAt ? format(new Date(task.createdAt), "MMM dd, HH:mm") : ""}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-6">
                      {/* Visitor */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{task.visitorName}</p>
                          <p className="text-sm text-muted-foreground">{task.visitorCompany || "Individual"}</p>
                        </div>
                      </div>
                      
                      {/* Site */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{task.siteName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">Destination</p>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {task.startDate ? format(new Date(task.startDate), "MMM dd") : "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {task.startTime || ""} - {task.endTime || ""}
                          </p>
                        </div>
                      </div>
                      
                      {/* Purpose */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{task.purpose || "General Visit"}</p>
                          <p className="text-sm text-muted-foreground">Purpose</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Panel */}
                  <div className="flex flex-col justify-center gap-2 px-5 py-4 bg-muted/30 border-l min-w-[180px]">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
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
              <FileText className="h-5 w-5 text-primary" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestNumber} - {selectedRequest?.workflowName || "Standard Workflow"}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Visitor</label>
                  <p className="font-semibold">{selectedRequest.visitorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="font-semibold">{selectedRequest.visitorCompany || "Individual"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Site</label>
                  <p className="font-semibold">{selectedRequest.siteName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Type</label>
                  <p className="font-semibold">{typeLabels[selectedRequest.type] || selectedRequest.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Visit Date</label>
                  <p className="font-semibold">
                    {selectedRequest.startDate ? format(new Date(selectedRequest.startDate), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <p className="font-semibold">{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                <p className="font-semibold">{selectedRequest.purpose || "General Visit"}</p>
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Workflow Information
                </label>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow:</span>
                    <Badge variant="outline">{selectedRequest.workflowName || "Standard Workflow"}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Current Stage:</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
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
