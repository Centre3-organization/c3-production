/**
 * Workflow Builder - Admin UI for creating and managing approval workflows
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Settings, 
  Trash2, 
  GripVertical, 
  ChevronRight,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Copy,
  MoreVertical,
  ArrowUpDown,
  Filter,
  Search,
  Workflow,
  GitBranch,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Process type options
const PROCESS_TYPES = [
  { value: "admin_visit", label: "Admin Visit" },
  { value: "work_permit", label: "Work Permit" },
  { value: "material_entry", label: "Material Entry" },
  { value: "tep", label: "TEP (Temporary Entry Pass)" },
  { value: "mop", label: "MOP (Method of Procedure)" },
  { value: "escort", label: "Escort Request" },
  { value: "mcm", label: "MCM (Managed Change Management)" },
  { value: "tdp", label: "TDP (Technical Data Package)" },
  { value: "mhv", label: "MHV (Material Handling Vehicle)" },
];

// Stage type options
const STAGE_TYPES = [
  { value: "individual", label: "Individual User" },
  { value: "role", label: "System Role" },
  { value: "approval_role", label: "Approval Role" },
  { value: "group", label: "Group Members" },
  { value: "group_role", label: "Group Role" },
  { value: "group_hierarchy", label: "Group Hierarchy" },
  { value: "dynamic_field", label: "Dynamic Field (e.g., Host)" },
  { value: "shift_based", label: "Shift-Based Assignment" },
  { value: "manager", label: "Manager" },
  { value: "external_manager", label: "External Manager" },
  { value: "site_manager", label: "Site Manager" },
  { value: "zone_owner", label: "Zone Owner" },
  { value: "custom_resolver", label: "Custom Resolver" },
];

// Approval mode options
const APPROVAL_MODES = [
  { value: "any", label: "Any (Single approval)" },
  { value: "all", label: "All (Everyone must approve)" },
  { value: "percentage", label: "Percentage (% must approve)" },
];

export function WorkflowBuilder() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProcessType, setFilterProcessType] = useState<string | null>(null);

  // Queries
  const { data: workflows, isLoading, refetch } = trpc.workflows.list.useQuery({
    includeInactive: true,
  });

  const { data: workflowDetails, refetch: refetchDetails } = trpc.workflows.getDetails.useQuery(
    { workflowId: selectedWorkflow! },
    { enabled: !!selectedWorkflow }
  );

  const { data: approvalRoles } = trpc.workflows.listApprovalRoles.useQuery();

  // Mutations
  const createWorkflow = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success("Workflow created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateWorkflow = trpc.workflows.update.useMutation({
    onSuccess: () => {
      toast.success("Workflow updated successfully");
      refetch();
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteWorkflow = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deactivated successfully");
      setSelectedWorkflow(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const addStage = trpc.workflows.addStage.useMutation({
    onSuccess: () => {
      toast.success("Stage added successfully");
      setIsStageDialogOpen(false);
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteStage = trpc.workflows.deleteStage.useMutation({
    onSuccess: () => {
      toast.success("Stage deleted successfully");
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  // Form state for creating workflow
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    processType: "",
    priority: 0,
    isDefault: false,
  });

  // Form state for creating stage
  const [newStage, setNewStage] = useState({
    stageName: "",
    stageType: "role" as string,
    approvalMode: "any" as string,
    requiredApprovals: 1,
    approvalPercentage: 100,
    canReject: true,
    canRequestInfo: true,
    slaHours: 24,
    autoApproveOnSla: false,
    autoRejectOnSla: false,
  });

  // Filter workflows
  const filteredWorkflows = workflows?.filter((w) => {
    if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterProcessType && w.processType !== filterProcessType) {
      return false;
    }
    return true;
  });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name) {
      toast.error("Workflow name is required");
      return;
    }
    createWorkflow.mutate({
      name: newWorkflow.name,
      description: newWorkflow.description || undefined,
      processType: newWorkflow.processType as any || undefined,
      priority: newWorkflow.priority,
      isDefault: newWorkflow.isDefault,
    });
  };

  const handleAddStage = () => {
    if (!selectedWorkflow || !newStage.stageName) {
      toast.error("Stage name is required");
      return;
    }
    addStage.mutate({
      workflowId: selectedWorkflow,
      stageName: newStage.stageName,
      stageType: newStage.stageType as "individual" | "role" | "group" | "group_hierarchy" | "dynamic_field" | "shift_based" | "manager" | "external_manager" | "site_manager" | "zone_owner" | "custom_resolver",
      approvalMode: newStage.approvalMode as "any" | "all" | "percentage",
      requiredApprovals: newStage.requiredApprovals,
      approvalPercentage: newStage.approvalPercentage,
      canReject: newStage.canReject,
      canRequestInfo: newStage.canRequestInfo,
      slaHours: newStage.slaHours,
      autoApproveOnSla: newStage.autoApproveOnSla,
      autoRejectOnSla: newStage.autoRejectOnSla,
    });
  };

  return (
    <div className="flex h-full">
      {/* Workflow List Panel */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Workflows</h2>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter */}
          <Select value={filterProcessType || "all"} onValueChange={(v) => setFilterProcessType(v === "all" ? null : v)}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Process Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Process Types</SelectItem>
              {PROCESS_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workflow List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : filteredWorkflows?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No workflows found</div>
          ) : (
            <div className="space-y-2">
              {filteredWorkflows?.map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedWorkflow === workflow.id ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Workflow className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium truncate">{workflow.name}</span>
                        </div>
                        {workflow.processType && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {PROCESS_TYPES.find((p) => p.value === workflow.processType)?.label || workflow.processType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {workflow.isDefault && (
                          <Badge variant="default" className="text-xs">Default</Badge>
                        )}
                        {!workflow.isActive && (
                          <Badge variant="destructive" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Details Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedWorkflow && workflowDetails ? (
          <div className="p-6">
            {/* Workflow Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{workflowDetails.workflow.name}</h1>
                {workflowDetails.workflow.description && (
                  <p className="text-muted-foreground mt-1">{workflowDetails.workflow.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {workflowDetails.workflow.processType && (
                    <Badge variant="outline">
                      {PROCESS_TYPES.find((p) => p.value === workflowDetails.workflow.processType)?.label}
                    </Badge>
                  )}
                  <Badge variant="secondary">Priority: {workflowDetails.workflow.priority}</Badge>
                  {workflowDetails.workflow.isDefault && <Badge>Default</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateWorkflow.mutate({
                    id: selectedWorkflow,
                    isActive: !workflowDetails.workflow.isActive,
                  })}
                >
                  {workflowDetails.workflow.isActive ? "Deactivate" : "Activate"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteWorkflow.mutate({ id: selectedWorkflow })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="stages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="stages">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Stages ({workflowDetails.stages.length})
                </TabsTrigger>
                <TabsTrigger value="conditions">
                  <Filter className="h-4 w-4 mr-2" />
                  Conditions ({workflowDetails.conditions.length})
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Stages Tab */}
              <TabsContent value="stages" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Approval Stages</h3>
                  <Button onClick={() => setIsStageDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stage
                  </Button>
                </div>

                {workflowDetails.stages.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No stages configured yet.</p>
                      <p className="text-sm">Add stages to define the approval flow.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {workflowDetails.stages.map((stage, index) => (
                      <Card key={stage.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{stage.stageName}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">
                                      {STAGE_TYPES.find((t) => t.value === stage.stageType)?.label || stage.stageType}
                                    </Badge>
                                    <Badge variant="secondary">
                                      {APPROVAL_MODES.find((m) => m.value === stage.approvalMode)?.label || stage.approvalMode}
                                    </Badge>
                                    {stage.slaHours && (
                                      <Badge variant="secondary">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {stage.slaHours}h SLA
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteStage.mutate({ id: stage.id })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {stage.canReject && (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Can Reject
                                  </span>
                                )}
                                {stage.canRequestInfo && (
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Can Request Info
                                  </span>
                                )}
                                {stage.autoApproveOnSla && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Auto-approve on SLA
                                  </span>
                                )}
                                {stage.autoRejectOnSla && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    Auto-reject on SLA
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {index < workflowDetails.stages.length - 1 && (
                            <div className="flex justify-center mt-3">
                              <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Conditions Tab */}
              <TabsContent value="conditions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Routing Conditions</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>

                {workflowDetails.conditions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conditions configured.</p>
                      <p className="text-sm">This workflow will match all requests of its process type.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Condition Type</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflowDetails.conditions.map((condition) => (
                        <TableRow key={condition.id}>
                          <TableCell className="font-medium">{condition.conditionType}</TableCell>
                          <TableCell>{condition.conditionOperator}</TableCell>
                          <TableCell>{JSON.stringify(condition.conditionValue)}</TableCell>
                          <TableCell>{condition.logicalGroup}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Settings</CardTitle>
                    <CardDescription>Configure general workflow behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={workflowDetails.workflow.priority}
                          onChange={(e) => updateWorkflow.mutate({
                            id: selectedWorkflow,
                            priority: parseInt(e.target.value),
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher priority workflows are evaluated first
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Default Workflow</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={workflowDetails.workflow.isDefault}
                            onCheckedChange={(checked) => updateWorkflow.mutate({
                              id: selectedWorkflow,
                              isDefault: checked,
                            })}
                          />
                          <span className="text-sm text-muted-foreground">
                            Use as default for this process type
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Workflow className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a workflow to view details</p>
              <p className="text-sm">or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Define a new approval workflow for processing requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workflow Name *</Label>
              <Input
                placeholder="e.g., Standard Admin Visit Approval"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the purpose of this workflow..."
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Process Type</Label>
              <Select
                value={newWorkflow.processType}
                onValueChange={(v) => setNewWorkflow({ ...newWorkflow, processType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select process type" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={newWorkflow.priority}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Workflow</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={newWorkflow.isDefault}
                    onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, isDefault: checked })}
                  />
                  <span className="text-sm">Set as default</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={createWorkflow.isPending}>
              {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Approval Stage</DialogTitle>
            <DialogDescription>
              Configure a new stage in the approval workflow
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stage Name *</Label>
              <Input
                placeholder="e.g., Manager Approval"
                value={newStage.stageName}
                onChange={(e) => setNewStage({ ...newStage, stageName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stage Type *</Label>
              <Select
                value={newStage.stageType}
                onValueChange={(v) => setNewStage({ ...newStage, stageType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_TYPES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Approval Mode</Label>
              <Select
                value={newStage.approvalMode}
                onValueChange={(v) => setNewStage({ ...newStage, approvalMode: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_MODES.map((am) => (
                    <SelectItem key={am.value} value={am.value}>{am.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SLA Hours</Label>
              <Input
                type="number"
                value={newStage.slaHours}
                onChange={(e) => setNewStage({ ...newStage, slaHours: parseInt(e.target.value) || 0 })}
              />
            </div>
         {newStage.approvalMode === "percentage" && (
              <div className="space-y-2">
                <Label>Required Percentage</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newStage.approvalPercentage}
                  onChange={(e) => setNewStage({ ...newStage, approvalPercentage: parseInt(e.target.value) || 100 })}
                />
              </div>
            )}
            <div className="col-span-2 grid grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newStage.canReject}
                  onCheckedChange={(checked) => setNewStage({ ...newStage, canReject: checked })}
                />
                <Label>Can Reject</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newStage.canRequestInfo}
                  onCheckedChange={(checked) => setNewStage({ ...newStage, canRequestInfo: checked })}
                />
                <Label>Can Request Info</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newStage.autoApproveOnSla}
                  onCheckedChange={(checked) => setNewStage({ ...newStage, autoApproveOnSla: checked })}
                />
                <Label>Auto-approve on SLA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newStage.autoRejectOnSla}
                  onCheckedChange={(checked) => setNewStage({ ...newStage, autoRejectOnSla: checked })}
                />
                <Label>Auto-reject on SLA</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStage} disabled={addStage.isPending}>
              {addStage.isPending ? "Adding..." : "Add Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
