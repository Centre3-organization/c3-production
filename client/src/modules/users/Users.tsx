import { useState, useMemo } from "react";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Search, 
  Filter, 
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
  Phone,
  Key,
  UserCheck,
  UserX,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/utils/trpc";
import NewUserForm from "./NewUserForm";
import ViewUserDialog from "./ViewUserDialog";
import EditUserDialog from "./EditUserDialog";

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
  
  // New state for filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  
  // New state for dialogs
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch users from backend with filters
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = trpc.users.list.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    departmentId: departmentFilter || undefined,
    groupId: groupFilter || undefined,
  });

  // Fetch roles from backend
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = trpc.roles.list.useQuery({});

  // Fetch system roles for role assignment
  const { data: systemRolesData } = trpc.users.getSystemRoles.useQuery();

  // Fetch departments from backend
  const { data: departmentsData } = trpc.departments.list.useQuery({});

  // Fetch groups from backend
  const { data: groupsData } = trpc.groups.list.useQuery({});

  // Update user mutation
  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error("Failed to update user", { description: error.message });
    },
  });

  // Assign role mutation
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

  // Change password mutation
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

  // Activate user mutation
  const activateMutation = trpc.users.activate.useMutation({
    onSuccess: () => {
      toast.success("User activated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error("Failed to activate user", { description: error.message });
    },
  });

  // Deactivate user mutation
  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => {
      toast.success("User deactivated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error("Failed to deactivate user", { description: error.message });
    },
  });

  // Create role mutation
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

  // Update role mutation
  const updateRoleMutation = trpc.roles.update.useMutation({
    onSuccess: () => {
      // After updating role name/description, also update permissions
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

  // Update permissions mutation
  const updatePermissionsMutation = trpc.roles.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Role and permissions updated successfully");
      refetchRoles();
      setEditRoleOpen(false);
    },
    onError: (error: any) => {
      // Show clear error message - permissions update failed
      toast.error("Failed to update permissions", { 
        description: error.message.includes("permission") 
          ? "You need Admin or Super Admin access to modify role permissions." 
          : error.message,
        duration: 5000
      });
      // Still close dialog and refetch to show current state
      refetchRoles();
      setEditRoleOpen(false);
    },
  });

  // Helper function to convert permissions object to array of permission codes
  const convertPermissionsToArray = (permissions: Record<string, Record<string, boolean>> | undefined): string[] => {
    if (!permissions) return [];
    const codes: string[] = [];
    for (const [module, actions] of Object.entries(permissions)) {
      for (const [action, enabled] of Object.entries(actions || {})) {
        if (enabled) {
          codes.push(`${module}:${action}`);
        }
      }
    }
    return codes;
  };

  // Create user mutation
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully", {
        description: "The new user account has been created. They will receive an email to set their password."
      });
      refetchUsers();
      setNewUserOpen(false);
      // Reset form
      setNewUserForm({ 
        firstName: "", 
        lastName: "", 
        email: "", 
        phone: "",
        temporaryPassword: "",
        role: "user",
        departmentId: null
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });

  // New user form state - matching the design screenshot
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    temporaryPassword: "",
    role: "user" as "user" | "admin",
    departmentId: null as number | null,
  });

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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserForm.temporaryPassword || newUserForm.temporaryPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    createUserMutation.mutate({
      userType: "centre3_employee",
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
      email: newUserForm.email,
      phone: newUserForm.phone || "+966",
      jobTitle: "Staff",
      temporaryPassword: newUserForm.temporaryPassword,
      role: newUserForm.role,
      departmentId: newUserForm.departmentId,
    });
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
    const newRole = {
      id: null,
      name: "New Role",
      description: "Description of the new role",
      isNew: true,
      permissions: {}
    };
    setSelectedRole(newRole);
    setEditRoleOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;

    if (selectedRole.isNew) {
      // Generate a code from the name
      const code = selectedRole.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      createRoleMutation.mutate({
        name: selectedRole.name,
        code: code,
        description: selectedRole.description,
        level: 50, // Default level for custom roles
        permissions: [], // Permissions will be set separately
      });
    } else {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        name: selectedRole.name,
        description: selectedRole.description,
      });
    }
  };

  const handleEmailUser = (user: any) => {
    if (user.email) {
      window.location.href = `mailto:${user.email}`;
    } else {
      toast.error("User does not have an email address");
    }
  };

  const handleChangePassword = (user: any) => {
    setChangePasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordOpen(true);
  };

  const handleSubmitPasswordChange = () => {
    if (!changePasswordUser) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    changePasswordMutation.mutate({
      userId: changePasswordUser.id,
      newPassword: newPassword,
    });
  };

  const handleActivateUser = (user: any) => {
    activateMutation.mutate({ id: user.id });
  };

  const handleDeactivateUser = (user: any) => {
    deactivateMutation.mutate({ id: user.id });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setDepartmentFilter(null);
    setGroupFilter(null);
  };

  const hasActiveFilters = statusFilter !== "all" || roleFilter !== "all" || departmentFilter !== null || groupFilter !== null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "user": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-500 border-gray-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

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
    
    return d.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "numeric", 
      day: "numeric",
    });
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || "Unknown";
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.name) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "—";
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept?.name || "—";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system access, roles, and permissions.</p>
        </div>
        <Button onClick={() => setNewUserOpen(true)} className="bg-purple-600 hover:bg-purple-700 gap-2">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Add User Dialog - Multi-step wizard */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="sm:max-w-[900px] h-[80vh] p-0 overflow-hidden" showCloseButton={false}>
          <NewUserForm
            onSuccess={() => {
              setNewUserOpen(false);
              refetchUsers();
            }}
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
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={changePasswordMutation.isPending}
              onClick={handleSubmitPasswordChange}
            >
              {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users" className="gap-2">
            Users Directory
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            Roles & Permissions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-white" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className={hasActiveFilters ? "border-purple-500 text-purple-600" : ""}>
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                        Clear all
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Status</Label>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Role</Label>
                    <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Department</Label>
                    <Select 
                      value={departmentFilter?.toString() || "all"} 
                      onValueChange={(v) => setDepartmentFilter(v === "all" ? null : parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Group</Label>
                    <Select 
                      value={groupFilter?.toString() || "all"} 
                      onValueChange={(v) => setGroupFilter(v === "all" ? null : parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {groups.map((group: any) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </Badge>
              )}
              {roleFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Role: {roleFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter("all")} />
                </Badge>
              )}
              {departmentFilter && (
                <Badge variant="secondary" className="gap-1">
                  Department: {getDepartmentName(departmentFilter)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setDepartmentFilter(null)} />
                </Badge>
              )}
              {groupFilter && (
                <Badge variant="secondary" className="gap-1">
                  Group: {groups.find((g: any) => g.id === groupFilter)?.name || groupFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setGroupFilter(null)} />
                </Badge>
              )}
            </div>
          )}

          <Card>
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-muted-foreground">Loading users...</span>
              </div>
            ) : usersError ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Error loading users: {usersError.message}</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UsersIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Click "Add User" to create a new user account.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewUser(user)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getUserDisplayName(user)}</p>
                            <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {(user as any).systemRole?.name || (user.role === "admin" ? "Administrator" : "Requestor")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {getDepartmentName(user.departmentId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor((user as any).status || "active")}>
                          {(user as any).status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.lastSignedIn)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Change Status</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleActivateUser(user); }}
                              className="text-green-600"
                              disabled={(user as any).status === "active"}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleDeactivateUser(user); }}
                              className="text-red-600"
                              disabled={(user as any).status === "inactive"}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define roles and their associated permissions
            </p>
            <Button onClick={handleCreateRole} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-muted-foreground">Loading roles...</span>
            </div>
          ) : rolesError ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Error loading roles: {rolesError.message}</span>
            </div>
          ) : roles.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No custom roles defined</p>
              <p className="text-sm text-muted-foreground mb-4">Create roles to define specific permissions for users</p>
              <Button onClick={handleCreateRole} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" /> Create First Role
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role: any) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEditRole(role)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {role.userCount || 0} users
                      </Badge>
                    </div>
                    <CardDescription>{role.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions || {} as Record<string, unknown>).slice(0, 3).map(([key, value]) => (
                        value ? (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}
                          </Badge>
                        ) : null
                      ))}
                      {Object.keys(role.permissions || {}).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{Object.keys(role.permissions || {}).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
        onEdit={() => {
          setViewUserOpen(false);
          setEditUserOpen(true);
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        onSuccess={() => {
          refetchUsers();
        }}
      />

      {/* Edit User Role Dialog */}
      <Dialog open={editUserRoleOpen} onOpenChange={setEditUserRoleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Assign System Role
            </DialogTitle>
            <DialogDescription>
              Change the system role for <span className="font-medium">{editUserRoleUser?.name || editUserRoleUser?.firstName + ' ' + editUserRoleUser?.lastName || editUserRoleUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="font-medium">{editUserRoleUser?.systemRole?.name || 'No role assigned'}</span>
                {editUserRoleUser?.systemRole?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{editUserRoleUser?.systemRole?.description}</p>
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
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoleValue && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> Changing a user's role will immediately update their permissions and access levels.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserRoleOpen(false)}>Cancel</Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={assignRoleMutation.isPending || !selectedRoleValue}
              onClick={() => {
                if (editUserRoleUser && selectedRoleValue) {
                  assignRoleMutation.mutate({
                    userId: editUserRoleUser.id,
                    roleCode: selectedRoleValue,
                  });
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
          {/* Header Section */}
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {selectedRole?.isNew ? "Create New Role" : "Edit Role"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Configure role properties and authorization objects
                </DialogDescription>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                {selectedRole?.isNew ? "New" : "Editing"}
              </Badge>
            </div>
          </div>
          
          {selectedRole && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Role Properties Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Properties
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleName" className="text-xs font-medium text-gray-600 uppercase">
                      Role Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="roleName" 
                      value={selectedRole.name}
                      onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                      className="h-9 bg-white"
                      placeholder="Enter role name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="roleDescription" className="text-xs font-medium text-gray-600 uppercase">
                      Description
                    </Label>
                    <Input 
                      id="roleDescription" 
                      value={selectedRole.description || ""}
                      onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                      className="h-9 bg-white"
                      placeholder="Role description"
                    />
                  </div>
                </div>
              </div>

              {/* Authorization Objects Section - SAP Style Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Authorization Objects
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => {
                        const allPerms: Record<string, Record<string, boolean>> = {};
                        permissionModules.forEach(m => {
                          allPerms[m.id] = {};
                          m.actions.forEach(a => { allPerms[m.id][a.id] = true; });
                        });
                        setSelectedRole({...selectedRole, permissions: allPerms});
                      }}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => setSelectedRole({...selectedRole, permissions: {}})}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Permission Table */}
                <div className="divide-y divide-gray-100">
                  {permissionModules.map((module, idx) => {
                    const modulePerms = selectedRole.permissions?.[module.id] || {};
                    const allChecked = module.actions.every(a => modulePerms[a.id]);
                    const someChecked = module.actions.some(a => modulePerms[a.id]);
                    
                    return (
                      <div key={module.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        {/* Module Header Row */}
                        <div className="flex items-center px-4 py-2.5 border-b border-gray-100">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox 
                              id={`module-${module.id}`}
                              checked={allChecked}
                              className={someChecked && !allChecked ? 'data-[state=checked]:bg-purple-300' : ''}
                              onCheckedChange={(checked) => {
                                const newModulePerms: Record<string, boolean> = {};
                                module.actions.forEach(a => { newModulePerms[a.id] = !!checked; });
                                setSelectedRole({
                                  ...selectedRole,
                                  permissions: {
                                    ...selectedRole.permissions,
                                    [module.id]: newModulePerms
                                  }
                                });
                              }}
                            />
                            <span className="font-medium text-sm text-gray-900">{module.label}</span>
                            <Badge variant="outline" className="text-[10px] h-5 bg-gray-100 text-gray-600 border-gray-200">
                              {module.actions.filter(a => modulePerms[a.id]).length}/{module.actions.length}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Actions Grid */}
                        <div className="px-4 py-3 pl-10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                            {module.actions.map((action) => (
                              <div key={action.id} className="flex items-center gap-2">
                                <Checkbox 
                                  id={`${module.id}-${action.id}`}
                                  checked={modulePerms[action.id] || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedRole({
                                      ...selectedRole,
                                      permissions: {
                                        ...selectedRole.permissions,
                                        [module.id]: {
                                          ...selectedRole.permissions?.[module.id],
                                          [action.id]: checked
                                        }
                                      }
                                    });
                                  }}
                                  className="h-4 w-4"
                                />
                                <Label 
                                  htmlFor={`${module.id}-${action.id}`} 
                                  className="text-sm text-gray-700 cursor-pointer hover:text-purple-600 transition-colors"
                                >
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
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {selectedRole && (
                <span>
                  {Object.values(selectedRole.permissions || {}).reduce((acc: number, mod: any) => 
                    acc + Object.values(mod || {}).filter(Boolean).length, 0
                  )} permissions selected
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
                onClick={handleSaveRole}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
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
