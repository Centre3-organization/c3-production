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
  Key
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
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function ManualApproval() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<"manual" | "rfid" | "card">("manual");
  const [cardNumber, setCardNumber] = useState("");
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const { data: pendingRequests, isLoading, refetch } = trpc.requests.getPendingManual.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  
  const approveManual = trpc.requests.approveManual.useMutation({
    onSuccess: () => {
      toast.success("Access Granted", {
        description: `Entry method: ${entryMethod === "manual" ? "Manual Entry" : entryMethod === "rfid" ? "RFID Tag" : "Access Card"}`
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
  
  const rejectManual = trpc.requests.rejectManual.useMutation({
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
    setEntryMethod("manual");
    setCardNumber("");
    setComments("");
    setRejectReason("");
  };
  
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
  
  const handleApproveClick = (request: any) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };
  
  const handleApproveConfirm = () => {
    if (!selectedRequest) return;
    
    if ((entryMethod === "rfid" || entryMethod === "card") && !cardNumber.trim()) {
      toast.error("Card/Tag number is required");
      return;
    }
    
    setProcessingId(selectedRequest.id);
    approveManual.mutate({
      id: selectedRequest.id,
      entryMethod,
      cardNumber: cardNumber || undefined,
      comments: comments || undefined,
    });
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
    rejectManual.mutate({ id: selectedRequest.id, comments: rejectReason });
  };
  
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            L2 Approval
          </h1>
          <p className="text-muted-foreground mt-1">
            Final security review and access credential issuance
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Awaiting Review</p>
                <p className="text-3xl font-bold text-indigo-900">{stats?.pendingManual || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Access Granted Today</p>
                <p className="text-3xl font-bold text-green-900">{stats?.approved || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <BadgeCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Total Processed</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.totalRequests || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <History className="h-6 w-6 text-slate-600" />
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

      {/* Request List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No pending reviews</h3>
            <p className="text-muted-foreground mt-1">All requests have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className="overflow-hidden border-l-4 border-l-indigo-500"
            >
              {/* Header Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(request.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{request.visitorName}</span>
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[request.type] || request.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{request.visitorCompany || "Individual"}</span>
                        <span>•</span>
                        <span className="font-mono">{request.requestNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{request.siteName}</p>
                      <p className="text-xs text-muted-foreground">{request.startDate}</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      L1 Approved
                    </Badge>
                    {expandedId === request.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedId === request.id && (
                <div className="border-t bg-muted/10">
                  <div className="p-6 grid grid-cols-3 gap-6">
                    {/* Visitor Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Visitor Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <IdCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">ID</p>
                            <p className="text-sm font-medium capitalize">
                              {request.visitorIdType?.replace("_", " ")} - {request.visitorIdNumber}
                            </p>
                          </div>
                        </div>
                        {request.visitorPhone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium">{request.visitorPhone}</p>
                            </div>
                          </div>
                        )}
                        {request.visitorEmail && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{request.visitorEmail}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Visit Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Visit Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Site</p>
                            <p className="text-sm font-medium">{request.siteName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Schedule</p>
                            <p className="text-sm font-medium">
                              {request.startDate} {request.startDate !== request.endDate && `→ ${request.endDate}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.startTime || "00:00"} - {request.endTime || "23:59"}
                            </p>
                          </div>
                        </div>
                        {request.purpose && (
                          <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Purpose</p>
                              <p className="text-sm">{request.purpose}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Zones & Actions */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Requested Zones
                      </h4>
                      {request.zones && request.zones.length > 0 ? (
                        <div className="space-y-2">
                          {request.zones.map((zone: any) => (
                            <div 
                              key={zone.id} 
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div>
                                <p className="text-sm font-medium">{zone.name}</p>
                                <p className="text-xs text-muted-foreground">{zone.code}</p>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={securityLevelColors[zone.securityLevel] || ""}
                              >
                                {zone.securityLevel}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific zones requested</p>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="pt-4 flex gap-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                          onClick={() => handleApproveClick(request)}
                        >
                          <Key className="h-4 w-4" />
                          Grant Access
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-2"
                          onClick={() => handleRejectClick(request)}
                        >
                          <XCircle className="h-4 w-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
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
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Key className="h-5 w-5" />
              Grant Access
            </DialogTitle>
            <DialogDescription>
              Select the entry method and issue access credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Request Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{selectedRequest?.requestNumber}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRequest?.visitorName} - {selectedRequest?.visitorCompany}
              </p>
            </div>
            
            {/* Entry Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Entry Method</Label>
              <RadioGroup value={entryMethod} onValueChange={(v: any) => setEntryMethod(v)}>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <RadioGroupItem value="manual" id="manual" className="peer sr-only" />
                    <Label
                      htmlFor="manual"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Fingerprint className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Manual</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="rfid" id="rfid" className="peer sr-only" />
                    <Label
                      htmlFor="rfid"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Scan className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">RFID</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label
                      htmlFor="card"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Card</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Card/RFID Number */}
            {(entryMethod === "rfid" || entryMethod === "card") && (
              <div className="space-y-2">
                <Label htmlFor="cardNumber">
                  {entryMethod === "rfid" ? "RFID Tag Number" : "Card Number"}
                </Label>
                <Input
                  id="cardNumber"
                  placeholder={entryMethod === "rfid" ? "Scan or enter tag number..." : "Enter card number..."}
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
                placeholder="Add any notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveConfirm}
              disabled={processingId !== null || ((entryMethod === "rfid" || entryMethod === "card") && !cardNumber.trim())}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Deny Access
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for denying access. This will be recorded in the audit log.
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
              placeholder="Enter reason for denial..."
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
              Confirm Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
