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
  Eye
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

// Level badge colors
const levelColors: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 border-amber-300",
  2: "bg-blue-100 text-blue-800 border-blue-300",
  3: "bg-purple-100 text-purple-800 border-purple-300",
  4: "bg-rose-100 text-rose-800 border-rose-300",
  5: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function Approvals() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Use the workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  
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
  
  // Group tasks by level for stats
  const tasksByLevel = (pendingTasks || []).reduce((acc: Record<number, number>, task: any) => {
    const level = task.stageOrder || 1;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  
  // Filter by search and level
  const filteredTasks = (pendingTasks || []).filter((task: any) => {
    // Level filter
    if (levelFilter !== "all") {
      const filterLevel = parseInt(levelFilter);
      if (task.stageOrder !== filterLevel) return false;
    }
    
    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.request?.requestNumber?.toLowerCase().includes(query) ||
      task.request?.visitorName?.toLowerCase().includes(query) ||
      task.request?.visitorCompany?.toLowerCase().includes(query)
    );
  });
  
  const handleApprove = (task: any) => {
    setProcessingId(task.taskId);
    approveTask.mutate({ 
      taskId: task.taskId,
      comments: `Approved at L${task.stageOrder} review`
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

  // Get unique levels from tasks
  const uniqueLevels = Array.from(new Set((pendingTasks || []).map((t: any) => t.stageOrder || 1))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#0f62fe]" />
            Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            All pending approval tasks assigned to you across all workflow stages
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

      {/* Stats Bar - Show counts by level */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900">{(pendingTasks || []).length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">L1 Queue</p>
                <p className="text-3xl font-bold text-amber-900">{tasksByLevel[1] || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Badge className="bg-amber-500 text-white text-xs px-2">L1</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">L2 Queue</p>
                <p className="text-3xl font-bold text-blue-900">{tasksByLevel[2] || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Badge className="bg-blue-500 text-white text-xs px-2">L2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">L3 Queue</p>
                <p className="text-3xl font-bold text-purple-900">{tasksByLevel[3] || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Badge className="bg-purple-500 text-white text-xs px-2">L3</Badge>
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
      </div>

      {/* Search and Filters */}
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
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="1">L1 - Initial Review</SelectItem>
            <SelectItem value="2">L2 - Security Review</SelectItem>
            <SelectItem value="3">L3 - Final Approval</SelectItem>
            <SelectItem value="4">L4</SelectItem>
            <SelectItem value="5">L5</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Request Table */}
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
            <p className="text-muted-foreground mt-1">No pending approvals at the moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Request #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task: any) => (
                <tr key={task.taskId} className="hover:bg-gray-50 transition-colors">
                  {/* Level Badge */}
                  <td className="px-4 py-4">
                    <Badge 
                      variant="outline" 
                      className={`font-bold ${levelColors[task.stageOrder] || levelColors[1]}`}
                    >
                      L{task.stageOrder || 1}
                    </Badge>
                  </td>
                  
                  {/* Request Number */}
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-gray-900">
                      {task.request?.requestNumber || '-'}
                    </span>
                  </td>
                  
                  {/* Type */}
                  <td className="px-4 py-4">
                    <Badge variant="outline" className={typeColors[task.request?.type] || "bg-gray-100"}>
                      {typeLabels[task.request?.type] || task.request?.type}
                    </Badge>
                  </td>
                  
                  {/* Visitor */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.request?.visitorName || '-'}</p>
                      <p className="text-xs text-gray-500">{task.request?.visitorCompany || '-'}</p>
                    </div>
                  </td>
                  
                  {/* Site */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{task.request?.siteName || '-'}</span>
                    </div>
                  </td>
                  
                  {/* Schedule */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {task.request?.startDate || '-'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Stage Name */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {task.stageName || `Stage ${task.stageOrder}`}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(task)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(task)}
                        disabled={processingId === task.taskId}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        {processingId === task.taskId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectClick(task)}
                        disabled={processingId === task.taskId}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will be visible to the requestor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Request:</span> {selectedRequest?.request?.requestNumber}
              </p>
              <p className="text-sm">
                <span className="font-medium">Visitor:</span> {selectedRequest?.request?.visitorName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Level:</span> L{selectedRequest?.stageOrder || 1}
              </p>
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
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
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
              <FileText className="h-5 w-5 text-[#0f62fe]" />
              Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Level & Status */}
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`font-bold text-lg px-3 py-1 ${levelColors[selectedRequest.stageOrder] || levelColors[1]}`}
                >
                  L{selectedRequest.stageOrder || 1}
                </Badge>
                <span className="text-gray-600">{selectedRequest.stageName}</span>
                <Badge variant="outline" className={typeColors[selectedRequest.request?.type] || "bg-gray-100"}>
                  {typeLabels[selectedRequest.request?.type] || selectedRequest.request?.type}
                </Badge>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">Request Number</p>
                  <p className="font-mono">{selectedRequest.request?.requestNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">Workflow</p>
                  <p>{selectedRequest.workflowName}</p>
                </div>
              </div>

              {/* Visitor Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Visitor Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedRequest.request?.visitorName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Company:</span>
                    <p className="font-medium">{selectedRequest.request?.visitorCompany || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ID Type:</span>
                    <p className="font-medium capitalize">{selectedRequest.request?.visitorIdType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ID Number:</span>
                    <p className="font-mono">{selectedRequest.request?.visitorIdNumber}</p>
                  </div>
                </div>
              </div>

              {/* Location & Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Location
                  </h4>
                  <p className="text-blue-900">{selectedRequest.request?.siteName}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </h4>
                  <p className="text-green-900">
                    {selectedRequest.request?.startDate} - {selectedRequest.request?.endDate}
                  </p>
                </div>
              </div>

              {/* Purpose */}
              {selectedRequest.request?.purpose && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Purpose of Visit</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedRequest.request?.purpose}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDetailsDialogOpen(false);
                handleRejectClick(selectedRequest);
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                handleApprove(selectedRequest);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
