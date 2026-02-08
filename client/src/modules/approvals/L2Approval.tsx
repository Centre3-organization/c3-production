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
  Shield,
  Loader2,
  RefreshCw,
  FileText,
  CreditCard,
  Scan,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  IdCard,
  MapPin,
  AlertCircle,
  BadgeCheck,
  History,
  Key,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

const securityLevelColors: Record<string, string> = {
  low: "bg-[#E8F9F8] text-[#4ECDC4]",
  medium: "bg-[#E8DCF5] text-[#5B2C93]",
  high: "bg-[#FFF4E5] text-[#FFB84D]",
  critical: "bg-[#FFE5E5] text-[#FF6B6B]",
};

export default function ManualApproval() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<"qr_code" | "rfid" | "card">("qr_code");
  const [cardNumber, setCardNumber] = useState("");
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Use the new workflow-based pending tasks query
  const { data: pendingTasks, isLoading, refetch } = trpc.requests.getMyPendingApprovals.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  
  // Use the new workflow-based approval mutation
  const approveTask = trpc.requests.approveTask.useMutation({
    onSuccess: (result) => {
      toast.success("Access Granted", {
        description: result.message || `Entry method: ${entryMethod === "qr_code" ? "QR Code" : entryMethod === "rfid" ? "RFID Tag" : "Access Card"}`
      });
      refetch();
      setSelectedRequest(null);
      setApprovalDialogOpen(false);
      resetForm();
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
      resetForm();
      setProcessingId(null);
    },
    onError: (error) => {
      toast.error("Failed to reject", { description: error.message });
      setProcessingId(null);
    }
  });
  
  const resetForm = () => {
    setEntryMethod("qr_code");
    setCardNumber("");
    setComments("");
    setRejectReason("");
  };
  
  // Filter to only show L2/Security stage tasks
  const l2Tasks = (pendingTasks || []).filter((task: any) => 
    task.stageName?.toLowerCase().includes('l2') || 
    task.stageName?.toLowerCase().includes('security') ||
    task.stageOrder === 2
  );
  
  // Filter by search
  const filteredTasks = l2Tasks.filter((task: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.requestNumber?.toLowerCase().includes(query) ||
      task.visitorName?.toLowerCase().includes(query) ||
      (task.visitorCompany?.toLowerCase().includes(query))
    );
  });
  
  const handleApproveClick = (task: any) => {
    setSelectedRequest(task);
    setApprovalDialogOpen(true);
  };
  
  const handleApproveConfirm = () => {
    if (!selectedRequest) return;
    
    if ((entryMethod === "rfid" || entryMethod === "card") && !cardNumber.trim()) {
      toast.error("Card/Tag number is required");
      return;
    }
    
    setProcessingId(selectedRequest.taskId);
    approveTask.mutate({
      taskId: selectedRequest.taskId,
      comments: comments || `Approved with ${entryMethod === "qr_code" ? "QR Code" : entryMethod === "rfid" ? "RFID Tag" : "Access Card"}`,
      entryMethod,
      cardNumber: cardNumber || undefined,
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
  
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#5B2C93]" />
            L2 Security Approval
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            Final security review and access credential issuance
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-[#5B2C93]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5B2C93]">In L2 Queue</p>
                <p className="text-3xl font-medium text-[#5B2C93]">{l2Tasks.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#E8DCF5] flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#5B2C93]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-[#4ECDC4]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#4ECDC4]">Access Granted Today</p>
                <p className="text-3xl font-medium text-[#4ECDC4]">{stats?.approved || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#E8F9F8] flex items-center justify-center">
                <BadgeCheck className="h-6 w-6 text-[#4ECDC4]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-[#E0E0E0]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#2C2C2C]">Total Processed</p>
                <p className="text-3xl font-medium text-[#2C2C2C]">{stats?.totalRequests || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <History className="h-6 w-6 text-[#6B6B6B]" />
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

      {/* Request List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-[#E8DCF5] flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-[#5B2C93]" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No pending L2 reviews</h3>
            <p className="text-[#6B6B6B] mt-1">All security reviews have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task: any) => (
            <Card 
              key={task.taskId} 
              className="overflow-hidden border-l-4 border-l-indigo-500"
            >
              {/* Header Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-[#F5F5F5]/30 transition-colors"
                onClick={() => toggleExpand(task.taskId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#E8DCF5] flex items-center justify-center">
                      <User className="h-6 w-6 text-[#5B2C93]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{task.visitorName}</span>
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[task.type] || task.type}
                        </Badge>
                        <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93] text-xs">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {task.workflowName || "Standard Workflow"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-[#6B6B6B]">
                        <span className="font-mono">{task.requestNumber}</span>
                        <span>•</span>
                        <span>{task.visitorCompany || "Individual"}</span>
                        <span>•</span>
                        <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] text-xs">
                          Stage {task.stageOrder}: {task.stageName}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {task.startDate ? format(new Date(task.startDate), "MMM dd, yyyy") : "N/A"}
                      </p>
                      <p className="text-xs text-[#6B6B6B]">
                        {task.startTime} - {task.endTime}
                      </p>
                    </div>
                    {expandedId === task.taskId ? (
                      <ChevronUp className="h-5 w-5 text-[#6B6B6B]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#6B6B6B]" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedId === task.taskId && (
                <div className="border-t bg-[#F5F5F5]/20">
                  <div className="p-5 grid grid-cols-3 gap-6">
                    {/* Visitor Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-[#6B6B6B] uppercase tracking-wide">
                        Visitor Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <IdCard className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.visitorIdType}: {task.visitorIdNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.visitorPhone || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.visitorEmail || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visit Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-[#6B6B6B] uppercase tracking-wide">
                        Visit Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.siteName || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.purpose || "General Visit"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">Host: {task.hostName || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Workflow Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-[#6B6B6B] uppercase tracking-wide">
                        Workflow Status
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">{task.workflowName || "Standard Workflow"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">Stage {task.stageOrder}: {task.stageName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#6B6B6B]" />
                          <span className="text-sm">
                            Assigned: {task.assignedAt ? format(new Date(task.assignedAt), "MMM dd, HH:mm") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="px-5 pb-5 flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectClick(task)}
                      disabled={processingId === task.taskId}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-[#5B2C93] hover:bg-[#3D1C5E]"
                      onClick={() => handleApproveClick(task)}
                      disabled={processingId === task.taskId}
                    >
                      {processingId === task.taskId ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4 mr-2" />
                      )}
                      Grant Access
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#5B2C93]" />
              Grant Access
            </DialogTitle>
            <DialogDescription>
              Select entry method and issue access credentials for {selectedRequest?.visitorName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Entry Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Entry Method</Label>
              <RadioGroup 
                value={entryMethod} 
                onValueChange={(v) => setEntryMethod(v as "qr_code" | "rfid" | "card")}
                className="grid grid-cols-3 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem value="qr_code" id="qr_code" className="peer sr-only" />
                  <Label 
                    htmlFor="qr_code" 
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#5B2C93] cursor-pointer"
                  >
                    <Scan className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium">QR Code</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="rfid" id="rfid" className="peer sr-only" />
                  <Label 
                    htmlFor="rfid" 
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#5B2C93] cursor-pointer"
                  >
                    <Scan className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium">RFID Tag</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label 
                    htmlFor="card" 
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#5B2C93] cursor-pointer"
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium">Access Card</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Card Number (if applicable) */}
            {(entryMethod === "rfid" || entryMethod === "card") && (
              <div className="space-y-2">
                <Label htmlFor="cardNumber">
                  {entryMethod === "rfid" ? "RFID Tag Number" : "Card Number"} *
                </Label>
                <Input 
                  id="cardNumber"
                  placeholder={entryMethod === "rfid" ? "Enter RFID tag number..." : "Enter card number..."}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
            )}
            
            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea 
                id="comments"
                placeholder="Add any notes about this approval..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#5B2C93] hover:bg-[#3D1C5E]"
              onClick={handleApproveConfirm}
              disabled={processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#FF6B6B]">
              <AlertCircle className="h-5 w-5" />
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
    </div>
  );
}
