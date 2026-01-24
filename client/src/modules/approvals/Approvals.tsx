import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Filter, 
  Search, 
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Scan,
  UserCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Mock data for approvals
const initialApprovals = [
  { id: "REQ-2025-002", type: "Work Permit", requestor: "Sarah Johnson", company: "Tech Solutions", zone: "Zone C", date: "Mar 04, 2025", status: "Pending L1", priority: "High" },
  { id: "REQ-2025-003", type: "TEP", requestor: "Mohammed Ali", company: "Audit Corp", zone: "Zone B", date: "Mar 02, 2025", status: "Pending L1", priority: "Medium" },
  { id: "REQ-2025-008", type: "MOP", requestor: "Network Team", company: "STC Bahrain", zone: "Core Network", date: "Mar 05, 2025", status: "Pending Manual", priority: "Critical" },
  { id: "REQ-2025-009", type: "Material Entry", requestor: "Logistics", company: "DHL", zone: "Loading Bay", date: "Mar 05, 2025", status: "Pending Manual", priority: "Low" },
  { id: "REQ-2025-012", type: "Admin Visit", requestor: "John Doe", company: "Centre3", zone: "Zone A", date: "Mar 06, 2025", status: "Pending L1", priority: "Low" },
];

export default function Approvals() {
  const [location] = useLocation();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<"manual" | "rfid" | "card">("manual");
  const [cardId, setCardId] = useState("");
  const [notes, setNotes] = useState("");

  // Determine current view based on URL query param
  const searchParams = new URLSearchParams(window.location.search);
  const typeParam = searchParams.get("type");
  const isManualApproval = typeParam === "manual";
  const pageTitle = isManualApproval ? "Manual Approvals" : "L1 Approvals";
  
  // Filter approvals based on current view
  const filteredApprovals = approvals.filter(req => 
    isManualApproval ? req.status === "Pending Manual" : req.status === "Pending L1"
  );

  const handleView = (req: any) => {
    setSelectedRequest(req);
    setViewOpen(true);
    // Reset manual entry state
    setEntryType("manual");
    setCardId("");
    setNotes("");
  };

  const handleL1Approve = () => {
    if (!selectedRequest) return;
    
    // Move to Manual Approval queue
    const updatedApprovals = approvals.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: "Pending Manual" } 
        : req
    );
    
    setApprovals(updatedApprovals);
    setViewOpen(false);
    toast.success(`Request ${selectedRequest.id} approved at L1 level`, {
      description: "Request has been moved to Manual Approval queue."
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    
    const updatedApprovals = approvals.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: "Rejected" } 
        : req
    );
    
    setApprovals(updatedApprovals);
    setViewOpen(false);
    toast.error(`Request ${selectedRequest.id} rejected`);
  };

  const handleManualApproveInit = () => {
    setManualEntryOpen(true);
  };

  const handleManualApproveConfirm = () => {
    if (!selectedRequest) return;
    
    // Validation for Card/RFID
    if ((entryType === "card" || entryType === "rfid") && !cardId) {
      toast.error("Card/Tag ID is required for this entry type");
      return;
    }

    const updatedApprovals = approvals.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: "Approved" } 
        : req
    );
    
    setApprovals(updatedApprovals);
    setManualEntryOpen(false);
    setViewOpen(false);
    
    const methodText = entryType === "manual" ? "Manual Entry" : 
                       entryType === "rfid" ? `RFID Tag (${cardId})` : 
                       `Access Card (${cardId})`;
                       
    toast.success(`Access Granted for ${selectedRequest.id}`, {
      description: `Method: ${methodText}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {isManualApproval 
              ? "Grant final entry access via Manual, RFID, or Card issuance." 
              : "Review requests and forward for manual approval."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search approvals..." className="pl-9 bg-white" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{filteredApprovals.length}</div>
            <p className="text-xs text-orange-700 mt-1">Requires your attention</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Processed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">12</div>
            <p className="text-xs text-blue-700 mt-1">Approved or rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Critical / High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {filteredApprovals.filter(r => r.priority === "Critical" || r.priority === "High").length}
            </div>
            <p className="text-xs text-red-700 mt-1">SLA breach risk</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApprovals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No pending approvals found in this queue.
                </TableCell>
              </TableRow>
            ) : (
              filteredApprovals.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.id}</TableCell>
                  <TableCell>{req.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{req.requestor}</span>
                      <span className="text-xs text-muted-foreground">{req.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>{req.zone}</TableCell>
                  <TableCell>{req.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      req.priority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                      req.priority === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    }>
                      {req.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleView(req)}
                        title="Review Request"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Request Details
              <Badge variant="outline">{selectedRequest?.id}</Badge>
              {isManualApproval && <Badge className="bg-purple-100 text-purple-800 border-purple-200">L1 Approved</Badge>}
            </DialogTitle>
            <DialogDescription>
              Review the full details of this request before taking action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && !manualEntryOpen && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Request Type</span>
                  <p className="font-medium">{selectedRequest.type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Priority</span>
                  <Badge variant="secondary">{selectedRequest.priority}</Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Requestor</span>
                  <p className="font-medium">{selectedRequest.requestor}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.company}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Location</span>
                  <p className="font-medium">{selectedRequest.zone}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Justification</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                  Routine maintenance of server rack 42 in Zone C. Requires access to power distribution unit for replacement of faulty breaker.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Visitors (2)</h4>
                <div className="border rounded-md divide-y">
                  <div className="flex items-center justify-between p-2 text-sm">
                    <span>Mohammed Al-Fulan</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 text-sm">
                    <span>John Smith</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedRequest.type === "MOP" && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-amber-800">High Risk Operation</h4>
                    <p className="text-xs text-amber-700">
                      This MOP involves critical power systems. Ensure backup generators are on standby before approval.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Workflow Step */}
          {manualEntryOpen && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  Grant Entry Access
                </h3>
                
                <RadioGroup value={entryType} onValueChange={(v: any) => setEntryType(v)} className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <RadioGroupItem value="manual" id="manual" className="peer sr-only" />
                    <Label
                      htmlFor="manual"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer h-full"
                    >
                      <UserCheck className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Manual</div>
                        <div className="text-xs text-muted-foreground mt-1">Direct Entry</div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="rfid" id="rfid" className="peer sr-only" />
                    <Label
                      htmlFor="rfid"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer h-full"
                    >
                      <Scan className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">RFID Tag</div>
                        <div className="text-xs text-muted-foreground mt-1">Issue Tag</div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label
                      htmlFor="card"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer h-full"
                    >
                      <CreditCard className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Access Card</div>
                        <div className="text-xs text-muted-foreground mt-1">Issue Card</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {(entryType === "card" || entryType === "rfid") && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="cardId">
                      {entryType === "rfid" ? "RFID Tag ID" : "Card Number"} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        id="cardId" 
                        placeholder={entryType === "rfid" ? "Scan or enter RFID tag..." : "Scan or enter card number..."}
                        value={cardId}
                        onChange={(e) => setCardId(e.target.value)}
                        autoFocus
                      />
                      <Button variant="secondary">Scan</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Place the {entryType === "rfid" ? "tag" : "card"} on the reader to scan automatically.
                    </p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Approval Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Add any additional notes regarding this entry..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!manualEntryOpen ? (
              <>
                <Button variant="outline" onClick={() => setViewOpen(false)}>Cancel</Button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="destructive" className="gap-2" onClick={handleReject}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  
                  {isManualApproval ? (
                    <Button className="bg-purple-600 hover:bg-purple-700 gap-2" onClick={handleManualApproveInit}>
                      <UserCheck className="h-4 w-4" /> Grant Entry
                    </Button>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleL1Approve}>
                      <CheckCircle2 className="h-4 w-4" /> L1 Approve
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setManualEntryOpen(false)}>Back</Button>
                <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleManualApproveConfirm}>
                  <CheckCircle2 className="h-4 w-4" /> Confirm & Issue
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
