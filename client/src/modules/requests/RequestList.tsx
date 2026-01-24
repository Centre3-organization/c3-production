import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronDown, 
  Calendar,
  Settings,
  RefreshCw,
  Maximize2,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  Building2,
  User,
  Briefcase
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
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

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Draft", icon: <FileText className="h-3 w-3" />, color: "text-muted-foreground bg-muted" },
  pending_l1: { label: "Pending L1", icon: <Clock className="h-3 w-3" />, color: "text-amber-700 bg-amber-100" },
  pending_manual: { label: "Pending Manual", icon: <AlertCircle className="h-3 w-3" />, color: "text-blue-700 bg-blue-100" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-green-700 bg-green-100" },
  rejected: { label: "Rejected", icon: <XCircle className="h-3 w-3" />, color: "text-red-700 bg-red-100" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-3 w-3" />, color: "text-gray-700 bg-gray-100" },
  expired: { label: "Expired", icon: <Clock className="h-3 w-3" />, color: "text-gray-700 bg-gray-100" },
};

export default function Requests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  
  const { data, isLoading, refetch } = trpc.requests.getAll.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    limit: 100,
  });
  
  const { data: requestDetail, isLoading: detailLoading } = trpc.requests.getById.useQuery(
    { id: selectedRequest! },
    { enabled: !!selectedRequest }
  );
  
  const { data: sites } = trpc.sites.getForDropdown.useQuery();
  
  const requests = data?.requests || [];
  
  // Filter by search query
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.requestNumber.toLowerCase().includes(query) ||
      req.visitorName.toLowerCase().includes(query) ||
      (req.visitorCompany?.toLowerCase().includes(query)) ||
      (req.siteName?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-foreground">All Requests</span>
            <Badge variant="secondary" className="font-normal">
              {data?.total || 0} total
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/requests/new">
            <Button size="sm" className="bg-primary text-primary-foreground">
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, visitor, company..." 
                className="pl-9 bg-muted/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-muted/30">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_l1">Pending L1</SelectItem>
                <SelectItem value="pending_manual">Pending Manual</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Request Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-muted/30">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="admin_visit">Admin Visit</SelectItem>
                <SelectItem value="work_permit">Work Permit</SelectItem>
                <SelectItem value="material_entry">Material Entry</SelectItem>
                <SelectItem value="tep">TEP</SelectItem>
                <SelectItem value="mop">MOP</SelectItem>
                <SelectItem value="escort">Escort</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Table Toolbar */}
        <div className="p-2 border-b flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2 px-2">
            <span className="font-semibold text-sm">Requests ({filteredRequests.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-sm">Try adjusting your filters or create a new request</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2 border-border">
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead className="font-semibold text-foreground">Request ID</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Visitor</TableHead>
                <TableHead className="font-semibold text-foreground">Company</TableHead>
                <TableHead className="font-semibold text-foreground">Site</TableHead>
                <TableHead className="font-semibold text-foreground">Date Range</TableHead>
                <TableHead className="font-semibold text-foreground">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const status = statusConfig[req.status] || statusConfig.draft;
                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 h-12">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-primary cursor-pointer hover:underline" onClick={() => setSelectedRequest(req.id)}>
                      {req.requestNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${status.color} gap-1`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{req.visitorName}</TableCell>
                    <TableCell className="text-muted-foreground">{req.visitorCompany || "-"}</TableCell>
                    <TableCell>{req.siteName || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {req.startDate} → {req.endDate}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.createdAt ? format(new Date(req.createdAt), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setSelectedRequest(req.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              {requestDetail?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requestDetail ? (
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`${statusConfig[requestDetail.status]?.color} gap-1 text-sm px-3 py-1`}>
                  {statusConfig[requestDetail.status]?.icon}
                  {statusConfig[requestDetail.status]?.label}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {typeLabels[requestDetail.type] || requestDetail.type}
                </Badge>
              </div>
              
              {/* Visitor Info */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Visitor Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{requestDetail.visitorName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-medium">{requestDetail.visitorCompany || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Type:</span>
                    <p className="font-medium capitalize">{requestDetail.visitorIdType?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Number:</span>
                    <p className="font-medium">{requestDetail.visitorIdNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{requestDetail.visitorPhone || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{requestDetail.visitorEmail || "-"}</p>
                  </div>
                </div>
              </div>
              
              {/* Visit Details */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Visit Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Site:</span>
                    <p className="font-medium">{requestDetail.siteName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Range:</span>
                    <p className="font-medium">{requestDetail.startDate} → {requestDetail.endDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">{requestDetail.startTime || "00:00"} - {requestDetail.endTime || "23:59"}</p>
                  </div>
                </div>
                {requestDetail.purpose && (
                  <div>
                    <span className="text-muted-foreground text-sm">Purpose:</span>
                    <p className="text-sm mt-1">{requestDetail.purpose}</p>
                  </div>
                )}
              </div>
              
              {/* Zones */}
              {requestDetail.zones && requestDetail.zones.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">Requested Zones</h4>
                  <div className="flex flex-wrap gap-2">
                    {requestDetail.zones.map((zone: any) => (
                      <Badge key={zone.id} variant="outline" className="gap-1">
                        {zone.name}
                        <span className="text-xs text-muted-foreground">({zone.securityLevel})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Approval History */}
              {requestDetail.approvals && requestDetail.approvals.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Approval History
                  </h4>
                  <div className="space-y-2">
                    {requestDetail.approvals.map((approval: any) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="uppercase text-xs">
                            {approval.stage}
                          </Badge>
                          <span className="text-sm">{approval.approverName || "Pending"}</span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={
                            approval.status === "approved" ? "text-green-700 bg-green-100" :
                            approval.status === "rejected" ? "text-red-700 bg-red-100" :
                            "text-amber-700 bg-amber-100"
                          }
                        >
                          {approval.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
