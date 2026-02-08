import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Key,
  Bell,
  LogOut,
  Loader2,
  AlertCircle,
  Save
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Fetch current user data
  const { data: user, isLoading, error, refetch } = trpc.users.me.useQuery();

  // Update profile mutation
  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to update profile", { description: error.message });
    },
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Failed to logout", { description: error.message });
    },
  });

  const handleEditClick = () => {
    if (!isEditing && user) {
      // Initialize form with current values
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
        <span className="ml-2 text-[#6B6B6B]">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#FF6B6B]">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error loading profile: {error.message}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#6B6B6B]">
        <span>No user data available. Please log in.</span>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "";
  const lastName = user.name?.split(" ").slice(1).join(" ") || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Profile</h1>
          <p className="text-[#6B6B6B]">Manage your account settings</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button 
                className="bg-[#5B2C93] hover:bg-[#5B2C93]"
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleEditClick}>Edit Profile</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-2xl bg-[#E8DCF5] text-[#5B2C93]">
                    {(user.name || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-medium">{user.name || "Unknown User"}</h2>
              <p className="text-sm text-[#6B6B6B] mb-2">{user.email}</p>
              <Badge variant="secondary" className={`mb-4 ${
                user.role === "admin" 
                  ? "bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]" 
                  : "bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]"
              }`}>
                {user.role === "admin" ? "Administrator" : "User"}
              </Badge>
              
              <div className="w-full space-y-2 text-left mt-4">
                <div className="flex items-center justify-between text-sm py-2 border-b">
                  <span className="text-[#6B6B6B]">System Role</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-[#6B6B6B]">Joined</span>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Feature coming soon")}>
                <Key className="mr-2 h-4 w-4" /> Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Feature coming soon")}>
                <Bell className="mr-2 h-4 w-4" /> Notification Settings
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={isEditing ? formData.firstName : firstName}
                        onChange={(e) => {
                          setFormData({ ...formData, firstName: e.target.value });
                        }}
                        disabled={!isEditing} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={isEditing ? formData.lastName : lastName}
                        onChange={(e) => {
                          setFormData({ ...formData, lastName: e.target.value });
                        }}
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                      <Input 
                        id="email" 
                        value={user.email || ""} 
                        className="pl-9" 
                        disabled 
                      />
                    </div>
                    <p className="text-xs text-[#6B6B6B]">Email cannot be changed. Contact an administrator.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Sign In</Label>
                    <Input 
                      value={formatDate(user.lastSignedIn)} 
                      disabled 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Recent activity on your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-[#6B6B6B]">
                    <p>Activity logging coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
