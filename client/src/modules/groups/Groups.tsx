import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useErrorDialog } from "@/components/ui/error-dialog";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Building2,
  ChevronRight,
  ChevronDown,
  Shield,
  Settings,
  UserPlus,
  FolderTree,
  Globe,
  Building,
  RefreshCw,
  Download,
  HelpCircle,
} from "lucide-react";

interface GroupWithChildren {
  id: number;
  name: string;
  groupType: "internal" | "contractor" | "client";
  companyId: number | null;
  parentGroupId: number | null;
  description: string | null;
  status: "active" | "inactive";
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  children: GroupWithChildren[];
}

export default function Groups() {
  // Permission checks
  const { canCreate, canUpdate, canDelete, canRead, hasPermission } = usePermissions('groups');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "internal" | "contractor" | "client">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isAccessPolicyDialogOpen, setIsAccessPolicyDialogOpen] = useState(false);
  const [isSecuritySettingsDialogOpen, setIsSecuritySettingsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithChildren | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([1, 2])); // Expand top-level by default

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    groupType: "internal" as "internal" | "contractor" | "client",
    companyId: null as number | null,
    parentGroupId: null as number | null,
    description: "",
    metadata: {
      contactEmail: "",
      contactPhone: "",
      contractNumber: "",
      contractStartDate: "",
      contractEndDate: "",
      notes: "",
    },
  });

  // Queries
  const { data: groupHierarchy, refetch: refetchGroups } = trpc.groups.getHierarchy.useQuery();
  const { data: allGroups } = trpc.groups.list.useQuery({});
  const { data: stats } = trpc.groups.getStats.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery({});
  const { data: companiesData } = trpc.masterData.getAllCompanies.useQuery({ isActive: true });
  const { data: memberCounts } = trpc.groups.getMemberCounts.useQuery();
  
  // Filter companies based on group type
  const filteredCompanies = companiesData?.filter((c: { type: string }) => {
    if (formData.groupType === "contractor") return c.type === "contractor" || c.type === "subcontractor";
    if (formData.groupType === "client") return c.type === "client";
    return false;
  }) || [];

  // Mutations
  const createGroup = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast.success("Group created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      refetchGroups();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateGroup = trpc.groups.update.useMutation({
    onSuccess: () => {
      toast.success("Group updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      refetchGroups();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteGroup = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
      refetchGroups();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      groupType: "internal",
      companyId: null,
      parentGroupId: null,
      description: "",
      metadata: {
        contactEmail: "",
        contactPhone: "",
        contractNumber: "",
        contractStartDate: "",
        contractEndDate: "",
        notes: "",
      },
    });
  };

  const handleCreateGroup = () => {
    createGroup.mutate({
      name: formData.name,
      groupType: formData.groupType,
      companyId: formData.companyId,
      parentGroupId: formData.parentGroupId,
      description: formData.description || undefined,
      metadata: formData.groupType !== "internal" ? formData.metadata : undefined,
    });
  };

  const handleUpdateGroup = () => {
    if (!selectedGroup) return;
    updateGroup.mutate({
      id: selectedGroup.id,
      name: formData.name,
      description: formData.description || undefined,
      metadata: formData.groupType !== "internal" ? formData.metadata : undefined,
    });
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    deleteGroup.mutate({ id: selectedGroup.id });
  };

  const openEditDialog = (group: GroupWithChildren) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      groupType: group.groupType,
      companyId: group.companyId,
      parentGroupId: group.parentGroupId,
      description: group.description || "",
      metadata: group.metadata || {
        contactEmail: "",
        contactPhone: "",
        contractNumber: "",
        contractStartDate: "",
        contractEndDate: "",
        notes: "",
      },
    });
    setIsEditDialogOpen(true);
  };

  const toggleExpand = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filterGroups = (groups: GroupWithChildren[]): GroupWithChildren[] => {
    return groups
      .filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab =
          selectedTab === "all" || group.groupType === selectedTab;
        return matchesSearch && matchesTab;
      })
      .map((group) => ({
        ...group,
        children: filterGroups(group.children),
      }));
  };

  const renderGroupTree = (groups: GroupWithChildren[], level: number = 0) => {
    return groups.map((group) => {
      const hasChildren = group.children && group.children.length > 0;
      const isExpanded = expandedGroups.has(group.id);

      return (
        <div key={group.id}>
          <div
            className={`flex items-center justify-between p-3 hover:bg-[#F5F5F5]/50 rounded-lg transition-colors ${
              level > 0 ? "ml-" + (level * 6) : ""
            }`}
            style={{ marginLeft: level * 24 }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleExpand(group.id)}
                className={`p-1 rounded hover:bg-[#F5F5F5] ${!hasChildren ? "invisible" : ""}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <div
                className={`p-2 rounded-lg ${
                  group.groupType === "internal"
                    ? "bg-[#5B2C93]/10 text-[#5B2C93]"
                    : "bg-[#FFF4E5] text-[#FFB84D]"
                }`}
              >
                {group.groupType === "internal" ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="font-medium">{group.name}</div>
                {group.description && (
                  <div className="text-sm text-[#6B6B6B] truncate max-w-md">
                    {group.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {memberCounts?.[group.id] || 0}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Number of users in this group</TooltipContent>
              </Tooltip>
              <Badge variant={group.groupType === "internal" ? "default" : "secondary"}>
                {group.groupType}
              </Badge>
              <Badge variant={group.status === "active" ? "outline" : "destructive"}>
                {group.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdate && (
                    <DropdownMenuItem onClick={() => openEditDialog(group)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Group
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsMembersDialogOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsAccessPolicyDialogOpen(true);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Access Policies
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsSecuritySettingsDialogOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Security Settings
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-[#FF6B6B]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {hasChildren && isExpanded && renderGroupTree(group.children, level + 1)}
        </div>
      );
    });
  };

  const filteredGroups = groupHierarchy ? filterGroups(groupHierarchy) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Group Management</h1>
          <p className="text-sm text-[#6B6B6B]">Manage organizational groups and access hierarchies</p>
          <p className="text-[#6B6B6B]">
            Manage organizational groups and access hierarchies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchGroups()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#5B2C93]/10 rounded-lg">
                <FolderTree className="h-6 w-6 text-[#5B2C93]" />
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Total Groups</p>
                <p className="text-2xl font-medium">{stats?.totalGroups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#E8DCF5] rounded-lg">
                <Building2 className="h-6 w-6 text-[#5B2C93]" />
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Internal Groups</p>
                <p className="text-2xl font-medium">{stats?.internalGroups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#FFF4E5] rounded-lg">
                <Globe className="h-6 w-6 text-[#FFB84D]" />
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Contractor Groups</p>
                <p className="text-2xl font-medium">{stats?.contractorGroups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#E8F9F8] rounded-lg">
                <Users className="h-6 w-6 text-[#4ECDC4]" />
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Total Members</p>
                <p className="text-2xl font-medium">{stats?.totalMembers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Group Hierarchy</CardTitle>
              <CardDescription>
                View and manage organizational structure
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All Groups</TabsTrigger>
              <TabsTrigger value="internal">Internal</TabsTrigger>
              <TabsTrigger value="contractor">Contractors</TabsTrigger>
              <TabsTrigger value="client">Clients</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedTab} className="mt-4">
              <div className="border rounded-lg">
                {filteredGroups.length > 0 ? (
                  renderGroupTree(filteredGroups)
                ) : (
                  <div className="p-8 text-center text-[#6B6B6B]">
                    No groups found
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new group to the organizational hierarchy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupType">Group Type *</Label>
                <Select
                  value={formData.groupType}
                  onValueChange={(v) => setFormData({ ...formData, groupType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Centre3 Employee)</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentGroup">Parent Group</Label>
              <Select
                value={formData.parentGroupId?.toString() || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, parentGroupId: v === "none" ? null : parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent (Top Level)</SelectItem>
                  {allGroups?.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter group description"
                rows={3}
              />
            </div>

            {/* Contractor/Client Group - Company Selection */}
            {formData.groupType !== "internal" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Company Information</h4>
                <div className="space-y-2">
                  <Label>Select Company *</Label>
                  <Select
                    value={formData.companyId?.toString() || ""}
                    onValueChange={(v) => {
                      const companyId = parseInt(v);
                      const company = companiesData?.find((c: any) => c.id === companyId);
                      if (company) {
                        setFormData({
                          ...formData,
                          companyId,
                          name: company.name,
                          metadata: {
                            ...formData.metadata,
                            contactEmail: company.contactPersonEmail || "",
                            contactPhone: company.contactPersonPhone || "",
                            contractNumber: company.contractReference || "",
                            contractStartDate: company.contractStartDate ? new Date(company.contractStartDate).toISOString().split('T')[0] : "",
                            contractEndDate: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
                          },
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company from Master Data" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCompanies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#6B6B6B]">
                    Company details will be auto-populated from Master Data
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      value={formData.metadata.contactEmail}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.metadata.contactPhone}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Number</Label>
                    <Input
                      value={formData.metadata.contractNumber}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Start Date</Label>
                    <Input
                      type="date"
                      value={formData.metadata.contractStartDate}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract End Date</Label>
                    <Input
                      type="date"
                      value={formData.metadata.contractEndDate}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.metadata.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, notes: e.target.value },
                      })
                    }
                    placeholder="Additional notes about this vendor"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!formData.name || createGroup.isPending}>
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter group description"
                rows={3}
              />
            </div>

            {/* Contractor/Client Group - Company Selection */}
            {formData.groupType !== "internal" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Company Information</h4>
                <div className="space-y-2">
                  <Label>Select Company *</Label>
                  <Select
                    value={formData.companyId?.toString() || ""}
                    onValueChange={(v) => {
                      const companyId = parseInt(v);
                      const company = companiesData?.find((c: any) => c.id === companyId);
                      if (company) {
                        setFormData({
                          ...formData,
                          companyId,
                          name: company.name,
                          metadata: {
                            ...formData.metadata,
                            contactEmail: company.contactPersonEmail || "",
                            contactPhone: company.contactPersonPhone || "",
                            contractNumber: company.contractReference || "",
                            contractStartDate: company.contractStartDate ? new Date(company.contractStartDate).toISOString().split('T')[0] : "",
                            contractEndDate: company.contractEndDate ? new Date(company.contractEndDate).toISOString().split('T')[0] : "",
                          },
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company from Master Data" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCompanies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#6B6B6B]">
                    Company details will be auto-populated from Master Data
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      value={formData.metadata.contactEmail}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.metadata.contactPhone}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Number</Label>
                    <Input
                      value={formData.metadata.contractNumber}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Start Date</Label>
                    <Input
                      type="date"
                      value={formData.metadata.contractStartDate}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract End Date</Label>
                    <Input
                      type="date"
                      value={formData.metadata.contractEndDate}
                      readOnly
                      className="bg-[#F5F5F5]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.metadata.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, notes: e.target.value },
                      })
                    }
                    placeholder="Additional notes about this vendor"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={!formData.name || updateGroup.isPending}>
              {updateGroup.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <GroupMembersDialog
        group={selectedGroup}
        isOpen={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
        allUsers={allUsers?.users || []}
      />

      {/* Access Policy Dialog */}
      <GroupAccessPolicyDialog
        group={selectedGroup}
        isOpen={isAccessPolicyDialogOpen}
        onClose={() => setIsAccessPolicyDialogOpen(false)}
      />

      {/* Security Settings Dialog */}
      <GroupSecuritySettingsDialog
        group={selectedGroup}
        isOpen={isSecuritySettingsDialogOpen}
        onClose={() => setIsSecuritySettingsDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteGroup}
        title={`Delete ${selectedGroup?.name || 'Group'}`}
        message="Are you sure you want to delete this group? This action cannot be undone. The group must have no sub-groups or active members to be deleted."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteGroup.isPending}
      />

    </div>
  );
}

// Group Members Dialog Component
function GroupMembersDialog({
  group,
  isOpen,
  onClose,
  allUsers,
}: {
  group: GroupWithChildren | null;
  isOpen: boolean;
  onClose: () => void;
  allUsers: any[];
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: members, refetch: refetchMembers } = trpc.groups.getMembers.useQuery(
    { groupId: group?.id || 0 },
    { enabled: !!group }
  );

  const addMember = trpc.groups.addMember.useMutation({
    onSuccess: () => {
      toast.success("Member added successfully");
      setSelectedUserId("");
      setIsPrimary(false);
      refetchMembers();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMember = trpc.groups.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully");
      refetchMembers();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAddMember = () => {
    if (!group || !selectedUserId) return;
    addMember.mutate({
      userId: parseInt(selectedUserId),
      groupId: group.id,
      isPrimaryGroup: isPrimary,
    });
  };

  const handleRemoveMember = (userId: number) => {
    if (!group) return;
    removeMember.mutate({ userId, groupId: group.id });
  };

  // Filter out users who are already members
  const memberUserIds = new Set(members?.map((m) => m.userId) || []);
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Members - {group?.name}</DialogTitle>
          <DialogDescription>Add or remove users from this group</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add Member Form */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Add User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
              <Label>Primary</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex cursor-help"
                    title="Primary: Main contact for this group. Receives notifications and approval requests first. Secondary: Regular member. May receive notifications if primary is unavailable."
                  >
                    <HelpCircle className="h-4 w-4 text-[#6B6B6B]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Primary vs Secondary</p>
                  <p><strong>Primary:</strong> Main contact for this group. Receives notifications and approval requests first.</p>
                  <p className="mt-1"><strong>Secondary:</strong> Regular member. May receive notifications if primary is unavailable.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button onClick={handleAddMember} disabled={!selectedUserId || addMember.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Members Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Primary
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            type="button" 
                            className="inline-flex cursor-help"
                            title="Primary: Main contact for this group. Receives notifications and approval requests first. Secondary: Regular member. May receive notifications if primary is unavailable."
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-[#6B6B6B]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Primary vs Secondary</p>
                          <p><strong>Primary:</strong> Main contact for this group. Receives notifications and approval requests first.</p>
                          <p className="mt-1"><strong>Secondary:</strong> Regular member. May receive notifications if primary is unavailable.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members && members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user.name || "N/A"}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        {member.isPrimaryGroup ? (
                          <Badge variant="default">Primary</Badge>
                        ) : (
                          <Badge variant="outline">Secondary</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.status === "active" ? "default" : "secondary"}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="h-4 w-4 text-[#FF6B6B]" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[#6B6B6B] py-8">
                      No members in this group
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Group Access Policy Dialog Component
function GroupAccessPolicyDialog({
  group,
  isOpen,
  onClose,
}: {
  group: GroupWithChildren | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    resourceType: "site" as "site" | "zone" | "area" | "system" | "application" | "data",
    resourceId: null as number | null,
    accessLevel: "read" as "none" | "read" | "write" | "execute" | "delete" | "admin",
    requiresMfa: false,
    requiresApproval: false,
    requiresEscort: false,
  });

  const { data: policies, refetch: refetchPolicies } = trpc.groups.getAccessPolicies.useQuery(
    { groupId: group?.id || 0 },
    { enabled: !!group }
  );

  const { data: sites } = trpc.sites.getAll.useQuery();
  const { data: zones } = trpc.zones.getAll.useQuery();
  const { data: areas } = trpc.areas.getAll.useQuery();

  const createPolicy = trpc.groups.createAccessPolicy.useMutation({
    onSuccess: () => {
      toast.success("Access policy created");
      setIsAddingPolicy(false);
      resetPolicyForm();
      refetchPolicies();
    },
    onError: (error) => toast.error(error.message),
  });

  const deletePolicy = trpc.groups.deleteAccessPolicy.useMutation({
    onSuccess: () => {
      toast.success("Access policy deleted");
      refetchPolicies();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetPolicyForm = () => {
    setPolicyForm({
      resourceType: "site",
      resourceId: null,
      accessLevel: "read",
      requiresMfa: false,
      requiresApproval: false,
      requiresEscort: false,
    });
  };

  const handleCreatePolicy = () => {
    if (!group) return;
    createPolicy.mutate({
      groupId: group.id,
      ...policyForm,
    });
  };

  const getResourceOptions = () => {
    switch (policyForm.resourceType) {
      case "site":
        return sites?.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })) || [];
      case "zone":
        return zones?.map((z: { id: number; name: string }) => ({ id: z.id, name: z.name })) || [];
      case "area":
        return areas?.map((a: { id: number; name: string }) => ({ id: a.id, name: a.name })) || [];
      default:
        return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access Policies - {group?.name}</DialogTitle>
          <DialogDescription>
            Define what resources this group can access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add Policy Form */}
          {isAddingPolicy ? (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Resource Type</Label>
                    <Select
                      value={policyForm.resourceType}
                      onValueChange={(v) =>
                        setPolicyForm({ ...policyForm, resourceType: v as any, resourceId: null })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="zone">Zone</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="application">Application</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Specific Resource (Optional)</Label>
                    <Select
                      value={policyForm.resourceId?.toString() || "all"}
                      onValueChange={(v) =>
                        setPolicyForm({
                          ...policyForm,
                          resourceId: v === "all" ? null : parseInt(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All resources of this type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {policyForm.resourceType}s</SelectItem>
                        {getResourceOptions().map((r: { id: number; name: string }) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select
                      value={policyForm.accessLevel}
                      onValueChange={(v) => setPolicyForm({ ...policyForm, accessLevel: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                        <SelectItem value="execute">Execute</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policyForm.requiresMfa}
                      onCheckedChange={(v) => setPolicyForm({ ...policyForm, requiresMfa: v })}
                    />
                    <Label className="whitespace-nowrap">Requires MFA</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policyForm.requiresApproval}
                      onCheckedChange={(v) => setPolicyForm({ ...policyForm, requiresApproval: v })}
                    />
                    <Label className="whitespace-nowrap">Requires Approval</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policyForm.requiresEscort}
                      onCheckedChange={(v) => setPolicyForm({ ...policyForm, requiresEscort: v })}
                    />
                    <Label className="whitespace-nowrap">Requires Escort</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingPolicy(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePolicy} disabled={createPolicy.isPending}>
                    Add Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAddingPolicy(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Access Policy
            </Button>
          )}

          {/* Policies Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Resource Type</TableHead>
                  <TableHead className="min-w-[180px]">Resource</TableHead>
                  <TableHead className="min-w-[120px]">Access Level</TableHead>
                  <TableHead className="min-w-[200px]">Requirements</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies && policies.length > 0 ? (
                  policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="capitalize">{policy.resourceType}</TableCell>
                      <TableCell>{policy.resourceName || "All"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {policy.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {policy.requiresMfa && <Badge variant="secondary">MFA</Badge>}
                          {policy.requiresApproval && <Badge variant="secondary">Approval</Badge>}
                          {policy.requiresEscort && <Badge variant="secondary">Escort</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePolicy.mutate({ id: policy.id })}
                        >
                          <Trash2 className="h-4 w-4 text-[#FF6B6B]" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[#6B6B6B] py-8">
                      No access policies defined
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Group Security Settings Dialog Component
function GroupSecuritySettingsDialog({
  group,
  isOpen,
  onClose,
}: {
  group: GroupWithChildren | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState({
    sessionTimeoutMinutes: 30,
    passwordComplexityLevel: "standard" as "basic" | "standard" | "high",
    mfaRequired: false,
    auditLevel: "basic" as "basic" | "detailed" | "comprehensive",
    accessReviewFrequency: "quarterly" as "monthly" | "quarterly" | "annually" | "never",
    maxConcurrentSessions: 3,
  });

  const { data: existingSettings, refetch } = trpc.groups.getSecuritySettings.useQuery(
    { groupId: group?.id || 0 },
    { enabled: !!group }
  );

  const upsertSettings = trpc.groups.upsertSecuritySettings.useMutation({
    onSuccess: () => {
      toast.success("Security settings saved");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Update local state when existing settings load
  useState(() => {
    if (existingSettings) {
      setSettings({
        sessionTimeoutMinutes: existingSettings.sessionTimeoutMinutes,
        passwordComplexityLevel: existingSettings.passwordComplexityLevel,
        mfaRequired: existingSettings.mfaRequired,
        auditLevel: existingSettings.auditLevel,
        accessReviewFrequency: existingSettings.accessReviewFrequency,
        maxConcurrentSessions: existingSettings.maxConcurrentSessions,
      });
    }
  });

  const handleSave = () => {
    if (!group) return;
    upsertSettings.mutate({
      groupId: group.id,
      ...settings,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Security Settings - {group?.name}</DialogTitle>
          <DialogDescription>
            Configure security requirements for this group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })
                }
                min={5}
                max={480}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Concurrent Sessions</Label>
              <Input
                type="number"
                value={settings.maxConcurrentSessions}
                onChange={(e) =>
                  setSettings({ ...settings, maxConcurrentSessions: parseInt(e.target.value) || 3 })
                }
                min={1}
                max={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Password Complexity</Label>
              <Select
                value={settings.passwordComplexityLevel}
                onValueChange={(v) =>
                  setSettings({ ...settings, passwordComplexityLevel: v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audit Level</Label>
              <Select
                value={settings.auditLevel}
                onValueChange={(v) => setSettings({ ...settings, auditLevel: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Review Frequency</Label>
              <Select
                value={settings.accessReviewFrequency}
                onValueChange={(v) =>
                  setSettings({ ...settings, accessReviewFrequency: v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.mfaRequired}
              onCheckedChange={(v) => setSettings({ ...settings, mfaRequired: v })}
            />
            <Label>Require Multi-Factor Authentication (MFA)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={upsertSettings.isPending}>
            {upsertSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
