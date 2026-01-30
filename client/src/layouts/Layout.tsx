import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@/utils/useAuth";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Lock, 
  AlertTriangle, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  Bell,
  ChevronLeft,
  CreditCard,
  Building2,
  Map,
  Radio,
  Users,
  FileCheck,
  ShieldAlert,
  User,
  Loader2,
  FolderTree,
  Workflow,
  Clock,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LanguageSelector } from "@/components/LanguageSelector";

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  icon: any;
  labelKey: string; // Translation key
  label: string; // Fallback label
  href?: string;
  children?: { labelKey: string; label: string; href: string }[];
  badge?: number;
  requiredPermission?: string;
};

type NavSection = {
  titleKey?: string; // Translation key for section title
  title?: string; // Fallback title
  items: NavItem[];
  requiredPermission?: string;
};

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  // Use the auth hook with redirect enabled
  const { user: authUser, loading: authLoading, isAuthenticated, logout } = useAuth({
    redirectOnUnauthenticated: true,
  });
  
  // Fetch current user data from our database
  const { data: currentUser, isLoading: userLoading, error: userError } = trpc.users.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // Fetch user's permissions
  const { data: permissions } = trpc.users.getMyPermissions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // Redirect to access-denied if user is not authorized
  useEffect(() => {
    if (userError?.message?.includes('Access denied') || userError?.message?.includes('not authorized')) {
      setLocation('/access-denied');
    }
  }, [userError, setLocation]);
  
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Requests": true,
    "Site and Facilities": true,
    "Hardware": false
  });

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user has a specific permission
  const hasPermission = (permissionPath: string): boolean => {
    if (!permissions) return false;
    
    // Admin has all permissions
    if (currentUser?.role === 'admin') return true;
    
    const [category, action] = permissionPath.split('.');
    const categoryPerms = (permissions as any)?.[category];
    if (!categoryPerms) return false;
    
    return categoryPerms[action] === true;
  };

  // Define all navigation sections with permission requirements
  const allNavSections: NavSection[] = [
    {
      items: [
        { icon: LayoutDashboard, labelKey: "nav.dashboard", label: "Dashboard", href: "/" },
      ]
    },
    {
      titleKey: "nav.requests",
      title: "Requests",
      items: [
        { icon: FileText, labelKey: "nav.allRequests", label: "All Requests", href: "/requests", requiredPermission: "requests.read" },
        { icon: CreditCard, labelKey: "nav.newRequest", label: "New Request", href: "/requests/new", requiredPermission: "requests.create" },
      ]
    },
    {
      titleKey: "nav.approvals",
      title: "Approvals",
      items: [
        { icon: FileCheck, labelKey: "nav.myApprovals", label: "My Approvals", href: "/approvals", requiredPermission: "approvals.l1" },
        { icon: Clock, labelKey: "nav.approvalHistory", label: "Approval History", href: "/approvals/history", requiredPermission: "approvals.l1" },
      ]
    },
    {
      titleKey: "nav.facilities",
      title: "Site and Facilities",
      items: [
        { icon: Building2, labelKey: "nav.sites", label: "Sites", href: "/sites", requiredPermission: "sites.read" },
        { icon: Map, labelKey: "nav.zones", label: "Zones", href: "/zones", requiredPermission: "zones.read" },
        { icon: Radio, labelKey: "nav.areas", label: "Areas", href: "/areas", requiredPermission: "zones.read" },
      ]
    },
    {
      titleKey: "nav.security",
      title: "Security Operations",
      requiredPermission: "alerts.view",
      items: [
        { icon: MapPin, labelKey: "nav.globalOverwatch", label: "Global Overwatch", href: "/global-overwatch", requiredPermission: "alerts.view" },
        { icon: ShieldAlert, labelKey: "nav.securityAlerts", label: "Security Alerts", href: "/alerts", badge: 3, requiredPermission: "alerts.view" },
      ]
    },
    {
      titleKey: "nav.workflowManagement",
      title: "Workflow Management",
      requiredPermission: "users.read",
      items: [
        { icon: Workflow, labelKey: "nav.workflows", label: "Workflow Builder", href: "/workflows", requiredPermission: "users.read" },
        { icon: FileText, labelKey: "nav.requestTypes", label: "Request Types", href: "/settings/request-types", requiredPermission: "users.read" },
        { icon: Clock, labelKey: "nav.shiftManagement", label: "Shift Management", href: "/shifts", requiredPermission: "users.read" },
        { icon: UserCheck, labelKey: "nav.delegations", label: "Delegations", href: "/delegations" },
      ]
    },
    {
      titleKey: "nav.mcm",
      title: "Card Management",
      items: [
        { icon: CreditCard, labelKey: "nav.cardControl", label: "Card Control", href: "/mcm" },
      ]
    },
    {
      titleKey: "nav.administration",
      title: "Administration",
      requiredPermission: "users.read",
      items: [
        { icon: FolderTree, labelKey: "nav.groups", label: "Groups", href: "/groups", requiredPermission: "users.read" },
        { icon: Users, labelKey: "nav.users", label: "Users & Roles", href: "/users", requiredPermission: "users.read" },
        { icon: Settings, labelKey: "nav.settings", label: "Settings", href: "/settings", requiredPermission: "users.read" },
      ]
    }
  ];

  // Filter navigation based on permissions
  const navSections = useMemo(() => {
    return allNavSections
      .map(section => {
        // Filter items based on permissions
        const filteredItems = section.items.filter(item => {
          if (!item.requiredPermission) return true;
          return hasPermission(item.requiredPermission);
        });
        
        return { ...section, items: filteredItems };
      })
      .filter(section => {
        // Remove empty sections
        if (section.items.length === 0) return false;
        // Check section-level permission
        if (section.requiredPermission && !hasPermission(section.requiredPermission)) return false;
        return true;
      });
  }, [permissions, currentUser?.role]);

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    window.location.href = '/api/auth/logout';
  };

  // Show loading state while checking authentication
  if (authLoading || (!isAuthenticated && !userError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('common.loading', 'Authenticating...')}</p>
        </div>
      </div>
    );
  }

  // Get user display info - prioritize currentUser from database over authUser from OAuth
  const userName = currentUser?.name || authUser?.name || "User";
  const userEmail = currentUser?.email || authUser?.email || "";
  const userRoleName = currentUser?.role === 'admin' 
    ? (isRTL ? 'مدير النظام' : 'Administrator') 
    : (isRTL ? 'مستخدم' : 'User');
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U";

  // Get translated label
  const getLabel = (labelKey: string, fallback: string) => {
    const translated = t(labelKey);
    return translated !== labelKey ? translated : fallback;
  };

  return (
    <div className="min-h-screen bg-background flex w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 h-full z-50 flex flex-col transition-all duration-300 bg-sidebar text-sidebar-foreground",
        isRTL ? "right-0" : "left-0",
        isMobile 
          ? (sidebarOpen 
              ? "w-64 translate-x-0" 
              : (isRTL ? "translate-x-full w-64" : "-translate-x-full w-64"))
          : (sidebarOpen ? "w-64" : "w-20")
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border/30 px-4",
          !sidebarOpen && !isMobile && "justify-center px-0"
        )}>
          {(sidebarOpen || isMobile) ? (
            <div className="flex items-center gap-3">
              <img 
                src="/center3-logo-white.png" 
                alt="center3" 
                className="h-[50px] w-[200px] object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              <img 
                src="/center3-icon.png" 
                alt="center3" 
                className="h-6 w-6 object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={section.title ? "mt-4 first:mt-0" : ""}>
              {section.title && (sidebarOpen || isMobile) && (
                <div className="px-3 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                    {section.titleKey ? getLabel(section.titleKey, section.title) : section.title}
                  </span>
                </div>
              )}
              {section.items.map((item) => {
                // Handle items with children (collapsible)
                if (item.children) {
                  const isOpen = openSections[item.label] ?? false;
                  const hasActiveChild = item.children.some(child => location === child.href);
                  
                  return (
                    <Collapsible key={item.label} open={isOpen} onOpenChange={() => toggleSection(item.label)}>
                      <CollapsibleTrigger asChild>
                        <div 
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                            hasActiveChild 
                              ? "bg-white/15 text-white" 
                              : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0 opacity-80" />
                          {(sidebarOpen || isMobile) && (
                            <>
                              <span className="flex-1">{getLabel(item.labelKey, item.label)}</span>
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : (isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                            </>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className={cn("space-y-1 mt-1", isRTL ? "pr-8" : "pl-8")}>
                        {item.children.map((child) => {
                          const isChildActive = location === child.href;
                          return (
                            <Link key={child.href} href={child.href}>
                              <div 
                                className={cn(
                                  "px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                                  isChildActive 
                                    ? "bg-white/20 text-white font-medium" 
                                    : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
                                )}
                                onClick={() => isMobile && setSidebarOpen(false)}
                              >
                                {getLabel(child.labelKey, child.label)}
                              </div>
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                // Handle regular items
                const isActive = location === item.href || (item.href !== "/" && location?.startsWith(item.href || ""));
                
                return (
                  <Link key={item.label} href={item.href || "#"}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group relative cursor-pointer",
                        isActive 
                          ? "bg-white/20 text-white shadow-sm" 
                          : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => isMobile && setSidebarOpen(false)}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "opacity-80 group-hover:opacity-100")} />
                      {(sidebarOpen || isMobile) && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{getLabel(item.labelKey, item.label)}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!sidebarOpen && !isMobile && (
                        <div className={cn(
                          "absolute px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border",
                          isRTL ? "right-full mr-2" : "left-full ml-2"
                        )}>
                          {getLabel(item.labelKey, item.label)}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 mt-auto mb-4">
          <div 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/80 hover:bg-white/10 hover:text-white cursor-pointer",
              !sidebarOpen && !isMobile && "justify-center px-0"
            )}>
            <LogOut className="h-5 w-5 shrink-0 opacity-80" />
            {(sidebarOpen || isMobile) && <span>{t('auth.logout', 'Logout')}</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full", 
        !isMobile && (sidebarOpen 
          ? (isRTL ? "mr-64" : "ml-64") 
          : (isRTL ? "mr-20" : "ml-20"))
      )}>
        {/* Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              {sidebarOpen 
                ? (isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />) 
                : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="relative max-w-md flex-1 hidden md:block">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input 
                placeholder={t('requests.searchPlaceholder', 'Search requests, visitors, zones...')}
                className={cn("bg-muted/50 border-0 focus-visible:ring-1", isRTL ? "pr-9" : "pl-9")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(currentUser as any)?.avatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("hidden md:block", isRTL ? "text-right" : "text-left")}>
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRoleName}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('nav.profile', 'Profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('nav.settings', 'Settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('auth.logout', 'Logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
