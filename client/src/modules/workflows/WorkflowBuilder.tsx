/**
 * Workflow Builder - Admin UI for creating and managing approval workflows
 */

import { useState, useMemo } from "react";
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
  Building2,
  MapPin,
  Layers,
  Calendar,
  UserCog,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useErrorDialog } from "@/components/ui/error-dialog";

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

// Condition type options with categories
const CONDITION_TYPES = [
  // Location-based conditions
  { value: "site_id", label: "Site", category: "Location", icon: Building2 },
  { value: "zone_id", label: "Zone", category: "Location", icon: MapPin },
  { value: "area_id", label: "Area", category: "Location", icon: Layers },
  { value: "region", label: "Region", category: "Location", icon: MapPin },
  
  // Request-based conditions
  { value: "process_type", label: "Process Type", category: "Request", icon: Workflow },
  { value: "category", label: "Category", category: "Request", icon: Filter },
  { value: "sub_category", label: "Sub-Category", category: "Request", icon: Filter },
  { value: "activity_risk", label: "Activity Risk Level", category: "Request", icon: AlertTriangle },
  { value: "visitor_count", label: "Visitor Count", category: "Request", icon: Users },
  { value: "request_duration", label: "Request Duration (hours)", category: "Request", icon: Clock },
  { value: "vip_visit", label: "VIP Visit", category: "Request", icon: Shield },
  { value: "escort_required", label: "Escort Required", category: "Request", icon: UserCheck },
  { value: "access_level", label: "Access Level", category: "Request", icon: Shield },
  
  // Requester-based conditions
  { value: "requester_group", label: "Requester Group", category: "Requester", icon: Users },
  { value: "requester_type", label: "Requester Type", category: "Requester", icon: UserCog },
  { value: "requester_department", label: "Requester Department", category: "Requester", icon: Building2 },
  { value: "requester_role", label: "Requester Role", category: "Requester", icon: UserCog },
  
  // Special conditions
  { value: "has_mop", label: "Has MOP", category: "Special", icon: CheckCircle },
  { value: "has_mhv", label: "Has MHV", category: "Special", icon: CheckCircle },
  
  // Time-based conditions
  { value: "time_range", label: "Time Range", category: "Time", icon: Clock },
  { value: "working_hours", label: "Working Hours", category: "Time", icon: Clock },
  { value: "shift_id", label: "Shift", category: "Time", icon: Calendar },
  { value: "day_of_week", label: "Day of Week", category: "Time", icon: Calendar },
];

// Condition operators
const CONDITION_OPERATORS = [
  { value: "equals", label: "Equals", types: ["all"] },
  { value: "not_equals", label: "Not Equals", types: ["all"] },
  { value: "in", label: "Is One Of", types: ["select", "multi"] },
  { value: "not_in", label: "Is Not One Of", types: ["select", "multi"] },
  { value: "greater_than", label: "Greater Than", types: ["number"] },
  { value: "less_than", label: "Less Than", types: ["number"] },
  { value: "between", label: "Between", types: ["number", "time"] },
  { value: "contains", label: "Contains", types: ["text"] },
  { value: "starts_with", label: "Starts With", types: ["text"] },
  { value: "is_null", label: "Is Empty", types: ["all"] },
  { value: "is_not_null", label: "Is Not Empty", types: ["all"] },
];

// Days of week
const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

// Risk levels
const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// Requester types
const REQUESTER_TYPES = [
  { value: "internal", label: "Internal Employee" },
  { value: "external", label: "External Visitor" },
  { value: "contractor", label: "Contractor" },
  { value: "vendor", label: "Vendor" },
];

// Access levels
const ACCESS_LEVELS = [
  { value: "1", label: "Level 1 - Public Areas" },
  { value: "2", label: "Level 2 - Restricted Areas" },
  { value: "3", label: "Level 3 - Secure Areas" },
  { value: "4", label: "Level 4 - High Security" },
  { value: "5", label: "Level 5 - Critical Infrastructure" },
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
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false);
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
  
  // Fetch data for condition value dropdowns
  const { data: sites } = trpc.sites.getAll.useQuery();
  const { data: zones } = trpc.zones.getAll.useQuery();
  const { data: areas } = trpc.areas.getAll.useQuery();
  const { data: groups } = trpc.groups.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: roles } = trpc.roles.list.useQuery();
  // Shifts query - placeholder until shifts router is available
  const shifts: { id: number; name: string }[] = [];

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

  // Confirmation and error dialogs
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { showError, ErrorDialogComponent } = useErrorDialog();

  const deleteWorkflow = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deleted successfully");
      setSelectedWorkflow(null);
      refetch();
    },
    onError: (error) => showError(error.message || "Failed to delete workflow", "Delete Failed"),
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
    onError: (error) => showError(error.message || "Failed to delete stage", "Delete Failed"),
  });

  const addCondition = trpc.workflows.addCondition.useMutation({
    onSuccess: () => {
      toast.success("Condition added successfully");
      setIsConditionDialogOpen(false);
      refetchDetails();
      // Reset form
      setNewCondition({
        conditionType: "",
        conditionOperator: "equals",
        conditionValue: "",
        logicalGroup: 0,
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const removeCondition = trpc.workflows.removeCondition.useMutation({
    onSuccess: () => {
      toast.success("Condition removed successfully");
      refetchDetails();
    },
    onError: (error) => showError(error.message || "Failed to remove condition", "Delete Failed"),
  });

  // Handle delete workflow with confirmation
  const handleDeleteWorkflow = async (workflowId: number, workflowName: string) => {
    const confirmed = await confirm({
      title: `Delete ${workflowName}`,
      message: "Are you sure you want to delete this workflow? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      deleteWorkflow.mutate({ id: workflowId });
    }
  };

  // Handle delete stage with confirmation
  const handleDeleteStage = async (stageId: number, stageName: string) => {
    const confirmed = await confirm({
      title: `Delete ${stageName}`,
      message: "Are you sure you want to delete this approval stage? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      deleteStage.mutate({ id: stageId });
    }
  };

  // Handle delete condition with confirmation
  const handleDeleteCondition = async (conditionId: number) => {
    const confirmed = await confirm({
      title: "Delete Condition",
      message: "Are you sure you want to delete this condition? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      removeCondition.mutate({ id: conditionId });
    }
  };

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

  // Form state for creating condition
  const [newCondition, setNewCondition] = useState({
    conditionType: "",
    conditionOperator: "equals",
    conditionValue: "" as any,
    logicalGroup: 0,
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

  const handleAddCondition = () => {
    if (!selectedWorkflow || !newCondition.conditionType) {
      toast.error("Condition type is required");
      return;
    }
    if (!newCondition.conditionValue && !["is_null", "is_not_null"].includes(newCondition.conditionOperator)) {
      toast.error("Condition value is required");
      return;
    }
    
    // Format the value based on condition type
    let formattedValue = newCondition.conditionValue;
    
    // For numeric conditions, ensure value is a number
    if (["visitor_count", "request_duration", "access_level"].includes(newCondition.conditionType)) {
      formattedValue = Number(newCondition.conditionValue);
    }
    
    // For boolean conditions
    if (["has_mop", "has_mhv", "vip_visit", "escort_required"].includes(newCondition.conditionType)) {
      formattedValue = newCondition.conditionValue === "true";
    }

    addCondition.mutate({
      workflowId: selectedWorkflow,
      conditionType: newCondition.conditionType as any,
      conditionOperator: newCondition.conditionOperator as any,
      conditionValue: formattedValue,
      logicalGroup: newCondition.logicalGroup,
    });
  };

  // Get value options based on condition type
  const getValueOptions = (conditionType: string) => {
    switch (conditionType) {
      case "site_id":
        return sites?.map((s: { id: number; name: string }) => ({ value: String(s.id), label: s.name })) || [];
      case "zone_id":
        return zones?.map((z: { id: number; name: string }) => ({ value: String(z.id), label: z.name })) || [];
      case "area_id":
        return areas?.map((a: { id: number; name: string }) => ({ value: String(a.id), label: a.name })) || [];
      case "requester_group":
        return groups?.map((g: { id: number; name: string }) => ({ value: String(g.id), label: g.name })) || [];
      case "requester_department":
        return departments?.map((d: { id: number; name: string }) => ({ value: String(d.id), label: d.name })) || [];
      case "requester_role":
        return roles?.map((r: { id: number; name: string }) => ({ value: String(r.id), label: r.name })) || [];
      case "process_type":
        return PROCESS_TYPES;
      case "requester_type":
        return REQUESTER_TYPES;
      case "activity_risk":
        return RISK_LEVELS;
      case "day_of_week":
        return DAYS_OF_WEEK;
      case "access_level":
        return ACCESS_LEVELS;
      case "shift_id":
        return shifts?.map((s: { id: number; name: string }) => ({ value: String(s.id), label: s.name })) || [];
      case "has_mop":
      case "has_mhv":
      case "vip_visit":
      case "escort_required":
        return [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ];
      default:
        return [];
    }
  };

  // Determine if condition type needs a dropdown or text input
  const isDropdownCondition = (conditionType: string) => {
    return [
      "site_id", "zone_id", "area_id", "requester_group", "requester_department",
      "requester_role", "process_type", "requester_type", "activity_risk",
      "day_of_week", "access_level", "shift_id", "has_mop", "has_mhv",
      "vip_visit", "escort_required"
    ].includes(conditionType);
  };

  // Get display value for condition
  const getConditionDisplayValue = (condition: any) => {
    const value = condition.conditionValue;
    const type = condition.conditionType;
    
    // Try to find a label for the value
    const options = getValueOptions(type);
    if (options.length > 0) {
      const option = options.find((o: { value: string; label: string }) => o.value === String(value));
      if (option) return option.label;
    }
    
    // For boolean values
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    return JSON.stringify(value);
  };

  // Get condition type label
  const getConditionTypeLabel = (type: string) => {
    const conditionType = CONDITION_TYPES.find(ct => ct.value === type);
    return conditionType?.label || type;
  };

  // Get operator label
  const getOperatorLabel = (operator: string) => {
    const op = CONDITION_OPERATORS.find(o => o.value === operator);
    return op?.label || operator;
  };

  // Group condition types by category
  const groupedConditionTypes = useMemo(() => {
    const groups: Record<string, typeof CONDITION_TYPES> = {};
    CONDITION_TYPES.forEach(ct => {
      if (!groups[ct.category]) {
        groups[ct.category] = [];
      }
      groups[ct.category].push(ct);
    });
    return groups;
  }, []);

  return (
    <>
      <ConfirmDialogComponent />
      <ErrorDialogComponent />
      <div className="flex h-full">
      {/* Workflow List Panel */}
      <div className="w-80 border-r bg-[#F5F5F5]/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Workflows</h2>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
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
            <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
          ) : filteredWorkflows?.length === 0 ? (
            <div className="text-center py-8 text-[#6B6B6B]">
              <Workflow className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No workflows found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkflows?.map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`cursor-pointer transition-colors ${
                    selectedWorkflow === workflow.id
                      ? "border-primary bg-[#5B2C93]/5"
                      : "hover:bg-[#F5F5F5]/50"
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Workflow className="h-4 w-4 text-[#5B2C93] shrink-0" />
                          <span className="font-medium truncate">{workflow.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {workflow.processType && (
                            <Badge variant="secondary" className="text-xs">
                              {PROCESS_TYPES.find(pt => pt.value === workflow.processType)?.label || workflow.processType}
                            </Badge>
                          )}
                          {workflow.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                          {!workflow.isActive && (
                            <Badge variant="outline" className="text-xs text-[#FFB84D]">Inactive</Badge>
                          )}
                        </div>
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
      {selectedWorkflow && workflowDetails ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-medium">{workflowDetails.workflow.name}</h1>
              <p className="text-[#6B6B6B] mt-1">
                {workflowDetails.workflow.description || "Default workflow for all access requests with L1 (Initial Review) and L2 (Security Approval) stages"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {workflowDetails.workflow.processType && (
                  <Badge variant="secondary">
                    {PROCESS_TYPES.find(pt => pt.value === workflowDetails.workflow.processType)?.label}
                  </Badge>
                )}
                <Badge variant="outline">Priority: {workflowDetails.workflow.priority}</Badge>
                {workflowDetails.workflow.isDefault && (
                  <Badge>Default</Badge>
                )}
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
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[#FF6B6B]"
                    onClick={() => handleDeleteWorkflow(selectedWorkflow, workflowDetails.workflow.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="stages">
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
                <h3 className="text-lg font-medium">Approval Stages</h3>
                <Button onClick={() => setIsStageDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
              </div>

              {workflowDetails.stages.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-[#6B6B6B]">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stages configured.</p>
                    <p className="text-sm">Add stages to define the approval flow.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {workflowDetails.stages.map((stage, index) => (
                    <Card key={stage.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5B2C93] text-white font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{stage.stageName}</h4>
                              <div className="flex items-center gap-2 mt-1 text-sm text-[#6B6B6B]">
                                <Badge variant="outline">
                                  {STAGE_TYPES.find(st => st.value === stage.stageType)?.label || stage.stageType}
                                </Badge>
                                <Badge variant="secondary">
                                  {APPROVAL_MODES.find(am => am.value === stage.approvalMode)?.label}
                                </Badge>
                                {stage.slaHours && (
                                  <Badge variant="secondary">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {stage.slaHours}h SLA
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-[#6B6B6B]">
                                {stage.canReject && (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Can Reject
                                  </span>
                                )}
                                {stage.canRequestInfo && (
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Can Request Info
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStage(stage.id, stage.stageName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {index < workflowDetails.stages.length - 1 && (
                          <div className="flex justify-center mt-3">
                            <ChevronRight className="h-5 w-5 text-[#6B6B6B] rotate-90" />
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
                <h3 className="text-lg font-medium">Routing Conditions</h3>
                <Button onClick={() => setIsConditionDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {workflowDetails.conditions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-[#6B6B6B]">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conditions configured.</p>
                    <p className="text-sm">This workflow will match all requests of its process type.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
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
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const ct = CONDITION_TYPES.find(c => c.value === condition.conditionType);
                                const Icon = ct?.icon || Filter;
                                return <Icon className="h-4 w-4 text-[#6B6B6B]" />;
                              })()}
                              {getConditionTypeLabel(condition.conditionType)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getOperatorLabel(condition.conditionOperator)}</Badge>
                          </TableCell>
                          <TableCell>{getConditionDisplayValue(condition)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Group {condition.logicalGroup}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCondition(condition.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {workflowDetails.conditions.length > 0 && (
                <Card className="bg-[#F5F5F5]/50">
                  <CardContent className="py-4">
                    <p className="text-sm text-[#6B6B6B]">
                      <strong>Note:</strong> Conditions within the same group are combined with AND logic.
                      Different groups are combined with OR logic.
                    </p>
                  </CardContent>
                </Card>
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
                      <p className="text-xs text-[#6B6B6B]">
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
                        <span className="text-sm text-[#6B6B6B]">
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
        <div className="flex items-center justify-center h-full text-[#6B6B6B]">
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

    {/* Add Condition Dialog */}
    <Dialog open={isConditionDialogOpen} onOpenChange={setIsConditionDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Routing Condition</DialogTitle>
          <DialogDescription>
            Define when this workflow should be applied to a request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Condition Type Selection */}
          <div className="space-y-2">
            <Label>Condition Type *</Label>
            <Select
              value={newCondition.conditionType}
              onValueChange={(v) => setNewCondition({ 
                ...newCondition, 
                conditionType: v,
                conditionValue: "", // Reset value when type changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedConditionTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-medium text-[#6B6B6B] bg-[#F5F5F5]">
                      {category}
                    </div>
                    {types.map((ct) => {
                      const Icon = ct.icon;
                      return (
                        <SelectItem key={ct.value} value={ct.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {ct.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <Label>Operator *</Label>
            <Select
              value={newCondition.conditionOperator}
              onValueChange={(v) => setNewCondition({ ...newCondition, conditionOperator: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Selection - Dynamic based on condition type */}
          {newCondition.conditionType && !["is_null", "is_not_null"].includes(newCondition.conditionOperator) && (
            <div className="space-y-2">
              <Label>Value *</Label>
              {isDropdownCondition(newCondition.conditionType) ? (
                <Select
                  value={String(newCondition.conditionValue)}
                  onValueChange={(v) => setNewCondition({ ...newCondition, conditionValue: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {getValueOptions(newCondition.conditionType).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={["visitor_count", "request_duration"].includes(newCondition.conditionType) ? "number" : "text"}
                  placeholder={
                    newCondition.conditionType === "visitor_count" ? "e.g., 5" :
                    newCondition.conditionType === "request_duration" ? "e.g., 24 (hours)" :
                    newCondition.conditionType === "time_range" ? "e.g., 09:00-17:00" :
                    "Enter value"
                  }
                  value={newCondition.conditionValue}
                  onChange={(e) => setNewCondition({ ...newCondition, conditionValue: e.target.value })}
                />
              )}
            </div>
          )}

          {/* Logical Group */}
          <div className="space-y-2">
            <Label>Logical Group</Label>
            <Select
              value={String(newCondition.logicalGroup)}
              onValueChange={(v) => setNewCondition({ ...newCondition, logicalGroup: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Group 0 (Default)</SelectItem>
                <SelectItem value="1">Group 1</SelectItem>
                <SelectItem value="2">Group 2</SelectItem>
                <SelectItem value="3">Group 3</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6B6B6B]">
              Conditions in the same group are combined with AND. Different groups are combined with OR.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsConditionDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCondition} disabled={addCondition.isPending}>
            {addCondition.isPending ? "Adding..." : "Add Condition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
