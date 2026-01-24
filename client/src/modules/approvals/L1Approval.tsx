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
  ArrowUpRight
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
  
  const { data: pendingRequests, isLoading, refetch } = trpc.requests.getPendingL1.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  
  const approveL1 = trpc.requests.approveL1.useMutation({
    onSuccess: () => {
      toast.success("Request approved", {
        description: "Moved to Manual Approval queue"
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
  
  const rejectL1 = trpc.requests.rejectL1.useMutation({
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
  
  const requests = pendingRequests || [];
  
  // Filter by search
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.requestNumber.toLowerCase().includes(query) ||
      req.visitorName.toLowerCase().includes(query) ||
      (req.visitorCompany?.toLowerCase().includes(query))
    );
  });
  
  const handleApprove = (request: any) => {
    setProcessingId(request.id);
    approveL1.mutate({ id: request.id });
  };
  
  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };
  
  const handleRejectConfirm = () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessingId(selectedRequest.id);
    rejectL1.mutate({ id: selectedRequest.id, comments: rejectReason });
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
            Quick review and forward requests to manual approval
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                <p className="text-sm font-medium text-amber-700">In Queue</p>
                <p className="text-3xl font-bold text-amber-900">{stats?.pendingL1 || 0}</p>
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
                <p className="text-sm font-medium text-blue-700">Pending Manual</p>
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
      ) : filteredRequests.length === 0 ? (
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
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-amber-400"
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Main Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={typeColors[request.type]}>
                          {typeLabels[request.type] || request.type}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {request.requestNumber}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {request.createdAt ? format(new Date(request.createdAt), "MMM dd, HH:mm") : ""}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-6">
                      {/* Visitor */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{request.visitorName}</p>
                          <p className="text-sm text-muted-foreground">{request.visitorCompany || "Individual"}</p>
                        </div>
                      </div>
                      
                      {/* Site */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{request.siteName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">Destination</p>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{request.startDate}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.startTime || "00:00"} - {request.endTime || "23:59"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Purpose */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {request.purpose ? request.purpose.slice(0, 30) + (request.purpose.length > 30 ? "..." : "") : "No purpose specified"}
                          </p>
                          <p className="text-sm text-muted-foreground">Purpose</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col border-l bg-muted/20 p-3 gap-2 justify-center min-w-[140px]">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      onClick={() => handleRejectClick(request)}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
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
              Please provide a reason for rejecting this request. This will be visible to the requestor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{selectedRequest?.requestNumber}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRequest?.visitorName} - {selectedRequest?.visitorCompany}
              </p>
            </div>
            
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
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
