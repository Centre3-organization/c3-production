/**
 * Delegation Management - UI for managing approval delegations
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  UserCheck,
  ArrowRight,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export function DelegationManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Queries
  const { data: myDelegations, refetch: refetchMy } = trpc.workflows.delegations.myDelegations.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery({});
  const { data: me } = trpc.auth.me.useQuery();

  // Mutations
  const createDelegation = trpc.workflows.delegations.create.useMutation({
    onSuccess: () => {
      toast.success("Delegation created successfully");
      setIsCreateDialogOpen(false);
      refetchMy();
    },
    onError: (error) => toast.error(error.message),
  });

  const revokeDelegation = trpc.workflows.delegations.revoke.useMutation({
    onSuccess: () => {
      toast.success("Delegation revoked");
      refetchMy();
    },
    onError: (error) => toast.error(error.message),
  });

  // Form state
  const [newDelegation, setNewDelegation] = useState({
    delegateId: 0,
    delegationType: "full" as "full" | "partial",
    validFrom: "",
    validUntil: "",
    reason: "",
  });

  const handleCreateDelegation = () => {
    if (!newDelegation.delegateId) {
      toast.error("Please select a delegate");
      return;
    }
    if (!newDelegation.validFrom || !newDelegation.validUntil) {
      toast.error("Please select start and end dates");
      return;
    }
    createDelegation.mutate({
      delegateId: newDelegation.delegateId,
      delegationType: newDelegation.delegationType,
      validFrom: newDelegation.validFrom,
      validUntil: newDelegation.validUntil,
      reason: newDelegation.reason || undefined,
    });
  };

  const getDelegationStatus = (delegation: any) => {
    const now = new Date();
    const start = new Date(delegation.validFrom);
    const end = new Date(delegation.validUntil);
    
    if (!delegation.isActive) return { label: "Revoked", variant: "destructive" as const };
    if (now < start) return { label: "Scheduled", variant: "secondary" as const };
    if (now > end) return { label: "Expired", variant: "outline" as const };
    return { label: "Active", variant: "default" as const };
  };

  const asDelegator = myDelegations?.asDelegator || [];
  const asDelegate = myDelegations?.asDelegate || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Delegation Management</h1>
          <p className="text-[#6B6B6B]">Delegate your approval authority to other users</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Delegation
        </Button>
      </div>

      {/* Active Delegations Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#E8DCF5]">
                <ArrowRight className="h-6 w-6 text-[#5B2C93]" />
              </div>
              <div>
                <p className="text-2xl font-medium">
                  {asDelegator.filter((d: any) => d.isActive).length}
                </p>
                <p className="text-sm text-[#6B6B6B]">Active Delegations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#E8F9F8]">
                <UserCheck className="h-6 w-6 text-[#4ECDC4]" />
              </div>
              <div>
                <p className="text-2xl font-medium">
                  {asDelegate.filter((d: any) => d.isActive).length}
                </p>
                <p className="text-sm text-[#6B6B6B]">Delegated to Me</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#FFF4E5]">
                <Clock className="h-6 w-6 text-[#FFB84D]" />
              </div>
              <div>
                <p className="text-2xl font-medium">
                  {asDelegator.filter((d: any) => {
                    const now = new Date();
                    const start = new Date(d.validFrom);
                    return d.isActive && now < start;
                  }).length}
                </p>
                <p className="text-sm text-[#6B6B6B]">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Delegations */}
      <Card>
        <CardHeader>
          <CardTitle>My Delegations</CardTitle>
          <CardDescription>Approval authority you have delegated to others</CardDescription>
        </CardHeader>
        <CardContent>
          {asDelegator.length === 0 ? (
            <div className="text-center py-8 text-[#6B6B6B]">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't created any delegations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asDelegator.map((delegation: any) => {
                  const status = getDelegationStatus(delegation);
                  return (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delegation.delegateName} {delegation.delegateLastName}</p>
                          <p className="text-sm text-[#6B6B6B]">{delegation.delegateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {delegation.delegationType === "full" ? "Full Authority" : "Partial"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(delegation.validFrom), "MMM d, yyyy")}</p>
                          <p className="text-[#6B6B6B]">
                            to {format(new Date(delegation.validUntil), "MMM d, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{delegation.reason || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {delegation.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeDelegation.mutate({ id: delegation.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delegations to Me */}
      <Card>
        <CardHeader>
          <CardTitle>Delegated to Me</CardTitle>
          <CardDescription>Approval authority others have delegated to you</CardDescription>
        </CardHeader>
        <CardContent>
          {asDelegate.length === 0 ? (
            <div className="text-center py-8 text-[#6B6B6B]">
              <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No one has delegated authority to you</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asDelegate.map((delegation: any) => {
                  const status = getDelegationStatus(delegation);
                  return (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delegation.delegatorName} {delegation.delegatorLastName}</p>
                          <p className="text-sm text-[#6B6B6B]">{delegation.delegatorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {delegation.delegationType === "full" ? "Full Authority" : "Partial"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(delegation.validFrom), "MMM d, yyyy")}</p>
                          <p className="text-[#6B6B6B]">
                            to {format(new Date(delegation.validUntil), "MMM d, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{delegation.reason || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Delegation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Delegation</DialogTitle>
            <DialogDescription>
              Delegate your approval authority to another user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delegate To *</Label>
              <Select
                value={newDelegation.delegateId.toString()}
                onValueChange={(v) => setNewDelegation({ ...newDelegation, delegateId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.users?.filter((u: any) => u.id !== me?.id).map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delegation Type</Label>
              <Select
                value={newDelegation.delegationType}
                onValueChange={(v) => setNewDelegation({ ...newDelegation, delegationType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Authority</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newDelegation.validFrom}
                  onChange={(e) => setNewDelegation({ ...newDelegation, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={newDelegation.validUntil}
                  onChange={(e) => setNewDelegation({ ...newDelegation, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Out of office, vacation"
                value={newDelegation.reason}
                onChange={(e) => setNewDelegation({ ...newDelegation, reason: e.target.value })}
              />
            </div>

            <div className="bg-[#FFF4E5] border border-[#FFB84D] rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-[#FFB84D] shrink-0 mt-0.5" />
                <div className="text-sm text-[#FFB84D]">
                  <p className="font-medium">Important</p>
                  <p>The delegate will be able to approve or reject requests on your behalf during the specified period.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDelegation} disabled={createDelegation.isPending}>
              {createDelegation.isPending ? "Creating..." : "Create Delegation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
