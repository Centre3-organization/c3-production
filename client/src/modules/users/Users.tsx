import { useState, useMemo } from "react";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  MoreHorizontal, 
  Mail, 
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  Key,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/utils/trpc";
import NewUserForm from "./NewUserForm";
import ViewUserDialog from "./ViewUserDialog";
import EditUserDialog from "./EditUserDialog";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

// Permission definitions for the UI
const permissionModules = [
  { 
    id: "dashboard", 
    label: "Dashboard & Analytics", 
    actions: [
      { id: "view", label: "View Dashboard" },
      { id: "analytics", label: "View Analytics" },
      { id: "export", label: "Export Reports" }
    ] 
  },
  { 
    id: "requests", 
    label: "Access Requests", 
    actions: [
      { id: "view", label: "View All Requests" },
      { id: "create", label: "Create Request" },
      { id: "update", label: "Edit Request" },
      { id: "delete", label: "Delete Request" }
    ] 
  },
  { 
    id: "approvals", 
    label: "Approvals", 
    actions: [
      { id: "l1", label: "L1 Approval" },
      { id: "manual", label: "Manual Approval" }
    ] 
  },
  { 
    id: "sites", 
    label: "Site Management", 
    actions: [
      { id: "create", label: "Create Sites" },
      { id: "read", label: "View Sites" },
      { id: "update", label: "Update Sites" },
      { id: "delete", label: "Delete Sites" }
    ] 
  },
  { 
    id: "zones", 
    label: "Zone Management", 
    actions: [
      { id: "create", label: "Create Zones" },
      { id: "read", label: "View Zones" },
      { id: "update", label: "Update Zones" },
      { id: "lock", label: "Lock/Unlock Zones" }
    ] 
  },
  { 
    id: "areas", 
    label: "Area Management", 
    actions: [
      { id: "create", label: "Create Areas" },
      { id: "read", label: "View Areas" },
      { id: "update", label: "Update Areas" },
      { id: "delete", label: "Delete Areas" }
    ] 
  },
  { 
    id: "alerts", 
    label: "Security Alerts", 
    actions: [
      { id: "view", label: "View Alerts" },
      { id: "resolve", label: "Resolve Alerts" }
    ] 
  },
  { 
    id: "users", 
    label: "User Administration", 
    actions: [
      { id: "create", label: "Create User" },
      { id: "read", label: "View Users" },
      { id: "update", label: "Edit User" },
      { id: "delete", label: "Delete User" }
    ] 
  },
  { 
    id: "groups", 
    label: "Groups", 
    actions: [
      { id: "view", label: "View Groups" },
      { id: "create", label: "Create Group" },
      { id: "update", label: "Edit Group" },
      { id: "delete", label: "Delete Group" }
    ] 
  },
  { 
    id: "workflows", 
    label: "Workflow Management", 
    actions: [
      { id: "view", label: "View Workflows" },
      { id: "create", label: "Create Workflow" },
      { id: "update", label: "Edit Workflow" },
      { id: "delete", label: "Delete Workflow" }
    ] 
  },
  { 
    id: "requestTypes", 
    label: "Request Types", 
    actions: [
      { id: "view", label: "View Request Types" },
      { id: "create", label: "Create Request Type" },
      { id: "update", label: "Edit Request Type" },
      { id: "delete", label: "Delete Request Type" }
    ] 
  },
  { 
    id: "shifts", 
    label: "Shift Management", 
    actions: [
      { id: "view", label: "View Shifts" },
      { id: "create", label: "Create Shift" },
      { id: "update", label: "Edit Shift" },
      { id: "delete", label: "Delete Shift" }
    ] 
  },
  { 
    id: "delegations", 
    label: "Delegations", 
    actions: [
      { id: "view", label: "View Delegations" },
      { id: "create", label: "Create Delegation" },
      { id: "update", label: "Edit Delegation" },
      { id: "delete", label: "Delete Delegation" }
    ] 
  },
  { 
    id: "cards", 
    label: "Card Management", 
    actions: [
      { id: "view", label: "View Cards" },
      { id: "issue", label: "Issue Card" },
      { id: "revoke", label: "Revoke Card" },
      { id: "control", label: "Control Card" }
    ] 
  },
  { 
    id: "hardware", 
    label: "Hardware", 
    actions: [
      { id: "view", label: "View Hardware" },
      { id: "control", label: "Control Hardware" }
    ] 
  },
  { 
    id: "reports", 
    label: "Reports", 
    actions: [
      { id: "view", label: "View Reports" },
      { id: "export", label: "Export Reports" }
    ] 
  },
  { 
    id: "settings", 
    label: "Settings", 
    actions: [
      { id: "view", label: "View Settings" },
      { id: "update", label: "Update Settings" }
    ] 
  },
  { 
    id: "integrations", 
    label: "Integration Hub", 
    actions: [
      { id: "view", label: "View Integrations" },
      { id: "configure", label: "Configure Integrations" }
    ] 
  }
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editUserRoleOpen, setEditUserRoleOpen] = useState(false);
  const [editUserRoleUser, setEditUserRoleUser] = useState<any>(null);
  const [selectedRoleValue, setSelectedRoleValue] = useState<string>("");
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  
  // Change password dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Queries
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = trpc.users.list.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    departmentId: departmentFilter || undefined,
    groupId: groupFilter || undefined,
  });

  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = trpc.roles.list.useQuery({});
  const { data: systemRolesData } = trpc.users.getSystemRoles.useQuery();
  const { data: departmentsData } = trpc.departments.list.useQuery({});
  const { data: groupsData } = trpc.groups.list.useQuery({});

  // Mutations
  const assignRoleMutation = trpc.users.assignRole.useMutation({
    onSuccess: () => {
      toast.success("Role assigned successfully");
      refetchUsers();
      setEditUserRoleOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to assign role", { description: error.message });
    },
  });

  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setChangePasswordOpen(false);
      setChangePasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error("Failed to change password", { description: error.message });
    },
  });

  const activateMutation = trpc.users.activate.useMutation({
    onSuccess: () => {
      toast.success("User activated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error("Failed to activate user", { description: error.message });
    },
  });

  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => {
      toast.success("User deactivated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error("Failed to deactivate user", { description: error.message });
    },
  });

  const createRoleMutation = trpc.roles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      refetchRoles();
      setEditRoleOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to create role", { description: error.message });
    },
  });

  const updateRoleMutation = trpc.roles.update.useMutation({
    onSuccess: () => {
      if (selectedRole && selectedRole.id) {
        const permissionCodes = convertPermissionsToArray(selectedRole.permissions);
        updatePermissionsMutation.mutate({
          roleId: selectedRole.id,
          permissions: permissionCodes,
        });
      } else {
        toast.success("Role updated successfully");
        refetchRoles();
        setEditRoleOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error("Failed to update role", { description: error.message });
    },
  });

  const updatePermissionsMutation = trpc.roles.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Role and permissions updated successfully");
      refetchRoles();
      setEditRoleOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update permissions", { 
        description: error.message.includes("permission") 
          ? "You need Admin or Super Admin access to modify role permissions." 
          : error.message,
        duration: 5000
      });
      refetchRoles();
      setEditRoleOpen(false);
    },
  });

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully", {
        description: "The new user account has been created."
      });
      refetchUsers();
      setNewUserOpen(false);
      setNewUserForm({ 
        firstName: "", lastName: "", email: "", phone: "",
        temporaryPassword: "", role: "user", departmentId: null
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });

  const [newUserForm, setNewUserForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    temporaryPassword: "", role: "user" as "user" | "admin",
    departmentId: null as number | null,
  });

  // Derived data
  const users = usersData?.users || [];
  const roles = rolesData || [];
  const departments = departmentsData || [];
  const groups = groupsData || [];

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      (user.name?.toLowerCase() || "").includes(term) ||
      (user.email?.toLowerCase() || "").includes(term) ||
      (user.firstName?.toLowerCase() || "").includes(term) ||
      (user.lastName?.toLowerCase() || "").includes(term)
    );
  }, [users, searchTerm]);

  // Helper functions
  const convertPermissionsToArray = (permissions: Record<string, Record<string, boolean>> | undefined): string[] => {
    if (!permissions) return [];
    const codes: string[] = [];
    for (const [module, actions] of Object.entries(permissions)) {
      for (const [action, enabled] of Object.entries(actions || {})) {
        if (enabled) codes.push(`${module}:${action}`);
      }
    }
    return codes;
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setViewUserOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRoleOpen(true);
  };

  const handleCreateRole = () => {
    setSelectedRole({
      id: null, name: "New Role", description: "Description of the new role",
      isNew: true, permissions: {}
    });
    setEditRoleOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    if (selectedRole.isNew) {
      const code = selectedRole.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      createRoleMutation.mutate({
        name: selectedRole.name, code,
        description: selectedRole.description, level: 50, permissions: [],
      });
    } else {
      updateRoleMutation.mutate({
        id: selectedRole.id, name: selectedRole.name,
        description: selectedRole.description,
      });
    }
  };

  const handleEmailUser = (user: any) => {
    if (user.email) window.location.href = `mailto:${user.email}`;
    else toast.error("User does not have an email address");
  };

  const handleChangePassword = (user: any) => {
    setChangePasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordOpen(true);
  };

  const handleSubmitPasswordChange = () => {
    if (!changePasswordUser) return;
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    changePasswordMutation.mutate({ userId: changePasswordUser.id, newPassword });
  };

  const handleActivateUser = (user: any) => activateMutation.mutate({ id: user.id });
  const handleDeactivateUser = (user: any) => deactivateMutation.mutate({ id: user.id });

  const clearFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setDepartmentFilter(null);
    setGroupFilter(null);
  };

  const hasActiveFilters = statusFilter !== "all" || roleFilter !== "all" || departmentFilter !== null || groupFilter !== null;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs < 60000) return "Just now";
    if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" });
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.name || "Unknown";
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user.name) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return user.name[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "\u2014";
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept?.name || "\u2014";
  };

  // Build active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (statusFilter !== "all") chips.push({ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") });
    if (roleFilter !== "all") chips.push({ key: "role", label: `Role: ${roleFilter}`, onRemove: () => setRoleFilter("all") });
    if (departmentFilter) chips.push({ key: "dept", label: `Dept: ${getDepartmentName(departmentFilter)}`, onRemove: () => setDepartmentFilter(null) });
    if (groupFilter) chips.push({ key: "group", label: `Group: ${groups.find((g: any) => g.id === groupFilter)?.name || groupFilter}`, onRemove: () => setGroupFilter(null) });
    return chips;
  }, [statusFilter, roleFilter, departmentFilter, groupFilter, departments, groups]);

  // Table columns definition
  const userColumns: FioriColumn<any>[] = useMemo(() => [
    {
      key: "user",
      header: "User",
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-[#E8DCF5] text-[#5B2C93] text-xs font-medium">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-[#2C2C2C]">{getUserDisplayName(user)}</p>
            <p className="text-xs text-[#6B6B6B]">{user.email || "No email"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "System Role",
      render: (user: any) => (
        <FioriStatusBadge
          status="info"
          label={(user as any).systemRole?.name || (user.role === "admin" ? "Administrator" : "Requestor")}
          showDot={false}
        />
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (user: any) => (
        <div className="flex items-center gap-1.5 text-sm text-[#6B6B6B]">
          <Building2 className="h-3.5 w-3.5" />
          {getDepartmentName(user.departmentId)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: any) => (
        <FioriStatusBadge status={(user as any).status || "active"} />
      ),
    },
    {
      key: "lastActive",
      header: "Last Active",
      render: (user: any) => (
        <span className="text-sm text-[#6B6B6B]">{formatDate(user.lastSignedIn)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      width: "80px",
      render: (user: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-[#6B6B6B]">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewUser(user); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { 
              e.stopPropagation(); 
              setEditUserRoleUser(user);
              setSelectedRoleValue((user as any).systemRole?.code || "");
              setEditUserRoleOpen(true);
            }}>
              <Edit2 className="h-4 w-4 mr-2" /> Change Role
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEmailUser(user); }}>
              <Mail className="h-4 w-4 mr-2" /> Email User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleChangePassword(user); }}>
              <Key className="h-4 w-4 mr-2" /> Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-[#6B6B6B] font-normal">Change Status</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); handleActivateUser(user); }}
              className="text-[#059669]"
              disabled={(user as any).status === "active"}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); handleDeactivateUser(user); }}
              className="text-[#FF6B6B]"
              disabled={(user as any).status === "inactive"}
            >
              <XCircle className="h-4 w-4 mr-2" /> Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [departments, groups]);

  return (
    <div className="space-y-0">
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title="User Management"
        subtitle="Manage system access, roles, and permissions"
        icon={<UsersIcon className="h-5 w-5" />}
        count={filteredUsers.length}
        onRefresh={() => { refetchUsers(); refetchRoles(); }}
        actions={
          <Button onClick={() => setNewUserOpen(true)} className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2" size="sm">
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
        }
      />

      {/* Add User Dialog */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden" showCloseButton={false}>
          <NewUserForm
            onSuccess={() => { setNewUserOpen(false); refetchUsers(); }}
            onCancel={() => setNewUserOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {changePasswordUser?.name || changePasswordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="••••••" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button className="bg-[#5B2C93] hover:bg-[#3D1C5E]" disabled={changePasswordMutation.isPending}
              onClick={handleSubmitPasswordChange}>
              {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabbed Content */}
      <Tabs defaultValue="users" className="w-full">
        <div className="bg-white border-b border-[#E0E0E0] -mx-6 px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B2C93] data-[state=active]:bg-transparent data-[state=active]:text-[#5B2C93] data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-[#6B6B6B]">
              Users Directory
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B2C93] data-[state=active]:bg-transparent data-[state=active]:text-[#5B2C93] data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-[#6B6B6B]">
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Users Directory Tab */}
        <TabsContent value="users" className="mt-5 space-y-4">
          {/* SAP Fiori Filter Bar */}
          <FioriFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name, email..."
            activeFilters={activeFilterChips}
            onClearAll={clearFilters}
            filters={
              <>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[140px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                  <SelectTrigger className="w-[140px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter?.toString() || "all"} onValueChange={(v) => setDepartmentFilter(v === "all" ? null : parseInt(v))}>
                  <SelectTrigger className="w-[160px] h-9 text-sm bg-[#F5F5F5] border-[#E0E0E0]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            trailing={
              <Button variant="outline" size="sm" className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0]" onClick={() => toast.info("Export feature coming soon")}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            }
          />

          {/* SAP Fiori Table */}
          <FioriTable
            columns={userColumns}
            data={filteredUsers}
            isLoading={usersLoading}
            rowKey={(user: any) => user.id}
            onRowClick={handleViewUser}
            emptyIcon={<UsersIcon className="h-10 w-10" />}
            emptyTitle="No users found"
            emptyDescription="Click 'Add User' to create a new user account."
            footerInfo={`Showing ${filteredUsers.length} of ${users.length} users`}
          />
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B6B6B]">
              Define roles and their associated permissions
            </p>
            <Button onClick={handleCreateRole} className="gap-2 bg-[#5B2C93] hover:bg-[#3D1C5E]" size="sm">
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-[#5B2C93]" />
              <span className="ml-3 text-sm text-[#6B6B6B]">Loading roles...</span>
            </div>
          ) : rolesError ? (
            <div className="flex items-center justify-center py-12 text-[#FF6B6B]">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Error loading roles: {rolesError.message}</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-[#B0B0B0]" />
              <p className="text-base font-medium text-[#2C2C2C]">No custom roles defined</p>
              <p className="text-sm text-[#6B6B6B] mb-4">Create roles to define specific permissions for users</p>
              <Button onClick={handleCreateRole} className="gap-2 bg-[#5B2C93] hover:bg-[#3D1C5E]" size="sm">
                <Plus className="h-4 w-4" /> Create First Role
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role: any) => (
                <div
                  key={role.id}
                  className="bg-white border border-[#E0E0E0] rounded-lg p-5 hover:border-[#5B2C93] transition-colors cursor-pointer"
                  onClick={() => handleEditRole(role)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium text-[#2C2C2C]">{role.name}</h3>
                    <FioriStatusBadge status="info" label={`${role.userCount || 0} users`} showDot={false} />
                  </div>
                  <p className="text-sm text-[#6B6B6B] mb-3">{role.description || "No description"}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions || {} as Record<string, unknown>).slice(0, 3).map(([key, value]) => (
                      value ? (
                        <Badge key={key} variant="secondary" className="text-xs bg-[#F5F5F5] text-[#6B6B6B]">
                          {key}
                        </Badge>
                      ) : null
                    ))}
                    {Object.keys(role.permissions || {}).length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-[#F5F5F5] text-[#6B6B6B]">
                        +{Object.keys(role.permissions || {}).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <ViewUserDialog
        user={selectedUser}
        open={viewUserOpen}
        onOpenChange={setViewUserOpen}
        onEdit={() => { setViewUserOpen(false); setEditUserOpen(true); }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        onSuccess={() => refetchUsers()}
      />

      {/* Edit User Role Dialog */}
      <Dialog open={editUserRoleOpen} onOpenChange={setEditUserRoleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#5B2C93]" />
              Assign System Role
            </DialogTitle>
            <DialogDescription>
              Change the system role for <span className="font-medium">{editUserRoleUser?.name || (editUserRoleUser?.firstName ? editUserRoleUser.firstName + ' ' + editUserRoleUser.lastName : editUserRoleUser?.email)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="p-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg">
                <span className="font-medium text-sm">{editUserRoleUser?.systemRole?.name || 'No role assigned'}</span>
                {editUserRoleUser?.systemRole?.description && (
                  <p className="text-xs text-[#6B6B6B] mt-1">{editUserRoleUser?.systemRole?.description}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>New System Role</Label>
              <Select value={selectedRoleValue} onValueChange={setSelectedRoleValue}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(systemRolesData || []).map((role: any) => (
                    <SelectItem key={role.code} value={role.code}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        <span className="text-xs text-[#6B6B6B]">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoleValue && (
              <div className="p-3 bg-[#E8DCF5] border border-[#5B2C93] rounded-lg">
                <p className="text-sm text-[#5B2C93]">
                  <strong>Note:</strong> Changing a user's role will immediately update their permissions and access levels.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserRoleOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#5B2C93] hover:bg-[#3D1C5E]"
              disabled={assignRoleMutation.isPending || !selectedRoleValue}
              onClick={() => {
                if (editUserRoleUser && selectedRoleValue) {
                  assignRoleMutation.mutate({ userId: editUserRoleUser.id, roleCode: selectedRoleValue });
                }
              }}
            >
              {assignRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog - SAP-style Authorization Management */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0] bg-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-medium text-[#2C2C2C]">
                  {selectedRole?.isNew ? "Create New Role" : "Edit Role"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  Configure role properties and authorization objects
                </DialogDescription>
              </div>
              <FioriStatusBadge status="info" label={selectedRole?.isNew ? "New" : "Editing"} showDot={false} />
            </div>
          </div>
          
          {selectedRole && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Role Properties */}
              <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-4 mb-6">
                <h3 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#5B2C93]" />
                  Role Properties
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleName" className="text-sm font-medium text-[#2C2C2C]">
                      Role Name <span className="text-[#DC2626]">*</span>
                    </Label>
                    <Input id="roleName" value={selectedRole.name}
                      onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                      className="h-9 bg-white" placeholder="Enter role name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="roleDescription" className="text-sm font-medium text-[#2C2C2C]">Description</Label>
                    <Input id="roleDescription" value={selectedRole.description || ""}
                      onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                      className="h-9 bg-white" placeholder="Role description" />
                  </div>
                </div>
              </div>

              {/* Authorization Objects */}
              <div className="border border-[#E0E0E0] rounded-lg overflow-hidden">
                <div className="bg-[#5B2C93] text-white px-4 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Authorization Objects
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary"
                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => {
                        const allPerms: Record<string, Record<string, boolean>> = {};
                        permissionModules.forEach(m => {
                          allPerms[m.id] = {};
                          m.actions.forEach(a => { allPerms[m.id][a.id] = true; });
                        });
                        setSelectedRole({...selectedRole, permissions: allPerms});
                      }}>Select All</Button>
                    <Button size="sm" variant="secondary"
                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => setSelectedRole({...selectedRole, permissions: {}})}>Clear All</Button>
                  </div>
                </div>
                
                <div className="divide-y divide-[#F0F0F0]">
                  {permissionModules.map((module, idx) => {
                    const modulePerms = selectedRole.permissions?.[module.id] || {};
                    const allChecked = module.actions.every(a => modulePerms[a.id]);
                    const someChecked = module.actions.some(a => modulePerms[a.id]);
                    
                    return (
                      <div key={module.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                        <div className="flex items-center px-4 py-2.5 border-b border-[#F0F0F0]">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox id={`module-${module.id}`} checked={allChecked}
                              className={someChecked && !allChecked ? 'data-[state=checked]:bg-[#E8DCF5]' : ''}
                              onCheckedChange={(checked) => {
                                const newModulePerms: Record<string, boolean> = {};
                                module.actions.forEach(a => { newModulePerms[a.id] = !!checked; });
                                setSelectedRole({
                                  ...selectedRole,
                                  permissions: { ...selectedRole.permissions, [module.id]: newModulePerms }
                                });
                              }} />
                            <span className="font-medium text-sm text-[#2C2C2C]">{module.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[#6B6B6B]">
                              {module.actions.filter(a => modulePerms[a.id]).length}/{module.actions.length}
                            </span>
                          </div>
                        </div>
                        <div className="px-4 py-3 pl-10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                            {module.actions.map((action) => (
                              <div key={action.id} className="flex items-center gap-2">
                                <Checkbox id={`${module.id}-${action.id}`}
                                  checked={modulePerms[action.id] || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedRole({
                                      ...selectedRole,
                                      permissions: {
                                        ...selectedRole.permissions,
                                        [module.id]: { ...selectedRole.permissions?.[module.id], [action.id]: checked }
                                      }
                                    });
                                  }}
                                  className="h-4 w-4" />
                                <Label htmlFor={`${module.id}-${action.id}`}
                                  className="text-sm text-[#2C2C2C] cursor-pointer hover:text-[#5B2C93] transition-colors">
                                  {action.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
            <div className="text-xs text-[#6B6B6B]">
              {selectedRole && (
                <span>
                  {Object.values(selectedRole.permissions || {}).reduce((acc: number, mod: any) => 
                    acc + Object.values(mod || {}).filter(Boolean).length, 0
                  )} permissions selected
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Cancel</Button>
              <Button className="bg-[#5B2C93] hover:bg-[#3D1C5E] min-w-[140px]"
                onClick={handleSaveRole}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {selectedRole?.isNew ? "Create Role" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
