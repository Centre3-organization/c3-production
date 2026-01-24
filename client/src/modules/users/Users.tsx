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
  Eye
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
import { trpc } from "@/utils/trpc";

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
  }
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editUserRoleOpen, setEditUserRoleOpen] = useState(false);
  const [editUserRoleUser, setEditUserRoleUser] = useState<any>(null);
  const [selectedRoleValue, setSelectedRoleValue] = useState<string>("");

  // Fetch users from backend
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = trpc.users.list.useQuery({
    search: searchTerm || undefined,
  });

  // Fetch roles from backend
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = trpc.roles.list.useQuery({});

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
      toast.success("Role updated successfully");
      refetchRoles();
      setEditRoleOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update role", { description: error.message });
    },
  });

  // Create user mutation
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully", {
        description: "The new user account has been created."
      });
      refetchUsers();
      setNewUserOpen(false);
      // Reset form
      setNewUserForm({ firstName: "", lastName: "", email: "", role: "user" });
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user" as "user" | "admin",
  });

  const users = usersData?.users || [];
  const roles = rolesData || [];

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      (user.name?.toLowerCase() || "").includes(term) ||
      (user.email?.toLowerCase() || "").includes(term)
    );
  }, [users, searchTerm]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullName = `${newUserForm.firstName} ${newUserForm.lastName}`.trim();
    
    createUserMutation.mutate({
      name: fullName,
      email: newUserForm.email,
      role: newUserForm.role,
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
      createRoleMutation.mutate({
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions || {},
      });
    } else {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions,
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "user": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and roles for the system</p>
        </div>
        <Button onClick={() => setNewUserOpen(true)} className="bg-purple-600 hover:bg-purple-700 gap-2">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Add User Dialog */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will be able to log in via OAuth.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@company.com" 
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">System Role</Label>
                <Select 
                  value={newUserForm.role} 
                  onValueChange={(value: "user" | "admin") => setNewUserForm({...newUserForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewUserOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users" className="gap-2">
            <UsersIcon className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" /> Roles
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

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
                <p className="text-sm">Users will appear here after they log in via OAuth.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewUser(user)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{(user.name || "U").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{user.email || "No email"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.lastSignedIn)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditUserRoleUser(user); setEditUserRoleOpen(true); }}>
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" /> Email User
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
        
        <TabsContent value="roles" className="mt-4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">System Roles</h2>
            <Button onClick={handleCreateRole} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="h-4 w-4" /> Create New Role
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
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {roles.map((role) => (
                <Card key={role.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription>{role.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions && Object.entries(role.permissions).map(([module, actions]) => {
                          const enabledActions = Object.entries(actions as Record<string, boolean>)
                            .filter(([_, enabled]) => enabled)
                            .map(([action]) => action);
                          
                          if (enabledActions.length === 0) return null;
                          
                          return (
                            <Badge key={module} variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 capitalize">
                              {module}: {enabledActions.length}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={viewUserOpen} onOpenChange={setViewUserOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{(selectedUser.name || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name || "Unknown"}</h3>
                  <p className="text-muted-foreground">{selectedUser.email || "No email"}</p>
                  <Badge variant="outline" className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">System Role</Label>
                  <p className="font-medium capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Sign In</Label>
                  <p className="font-medium">{formatDate(selectedUser.lastSignedIn)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated At</Label>
                  <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole?.isNew ? "Create New Role" : "Edit Role"}</DialogTitle>
            <DialogDescription>
              Configure role permissions for different system modules.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input 
                    value={selectedRole.name} 
                    onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                    disabled={selectedRole.isSystem}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={selectedRole.description || ""} 
                    onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Permissions</h4>
                {permissionModules.map((module) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-3">{module.label}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {module.actions.map((action) => {
                        const isChecked = selectedRole.permissions?.[module.id]?.[action.id] || false;
                        return (
                          <div key={action.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`${module.id}-${action.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const newPermissions = {
                                  ...selectedRole.permissions,
                                  [module.id]: {
                                    ...selectedRole.permissions?.[module.id],
                                    [action.id]: checked
                                  }
                                };
                                setSelectedRole({...selectedRole, permissions: newPermissions});
                              }}
                            />
                            <Label htmlFor={`${module.id}-${action.id}`} className="text-sm">
                              {action.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Cancel</Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={handleSaveRole}
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
            >
              {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" /> Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Role Dialog */}
      <Dialog open={editUserRoleOpen} onOpenChange={(open) => {
        setEditUserRoleOpen(open);
        if (!open) {
          setEditUserRoleUser(null);
          setSelectedRoleValue("");
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the system role for {editUserRoleUser?.name || "this user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="text-sm text-muted-foreground capitalize">
                {editUserRoleUser?.role || "No role assigned"}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select 
                value={selectedRoleValue || editUserRoleUser?.role || ""} 
                onValueChange={setSelectedRoleValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setEditUserRoleOpen(false); setSelectedRoleValue(""); }}>
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateUserMutation.isPending || !selectedRoleValue}
              onClick={() => {
                if (editUserRoleUser && selectedRoleValue) {
                  updateUserMutation.mutate({ 
                    id: editUserRoleUser.id, 
                    role: selectedRoleValue as "user" | "admin"
                  }, {
                    onSuccess: () => {
                      setEditUserRoleOpen(false);
                      setSelectedRoleValue("");
                      setEditUserRoleUser(null);
                    }
                  });
                }
              }}
            >
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
