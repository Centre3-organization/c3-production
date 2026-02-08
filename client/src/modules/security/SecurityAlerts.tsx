import { useState } from "react";
import { 
  ShieldAlert, 
  Bell, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  AlertTriangle,
  Eye,
  MoreHorizontal,
  MapPin,
  Video,
  PhoneCall,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { toast } from "sonner";

// Mock data for alerts
const initialAlerts = [
  { 
    id: "ALT-2025-089", 
    type: "Breach Attempt", 
    severity: "Critical", 
    location: "Riyadh Main DC - Zone C", 
    timestamp: "Just now", 
    status: "New",
    description: "Unauthorized access attempt detected at Server Hall 1. Biometric mismatch repeated 3 times."
  },
  { 
    id: "ALT-2025-088", 
    type: "Door Forced", 
    severity: "High", 
    location: "Jeddah DR - Gate 1", 
    timestamp: "15 mins ago", 
    status: "Viewed",
    description: "Perimeter gate sensor indicates forced entry. CCTV shows vehicle impact."
  },
  { 
    id: "ALT-2025-087", 
    type: "Loitering", 
    severity: "Medium", 
    location: "Riyadh Main DC - Lobby", 
    timestamp: "1 hour ago", 
    status: "Action Taken",
    description: "Individual loitering near security desk for >20 minutes without badge."
  },
  { 
    id: "ALT-2025-086", 
    type: "Device Offline", 
    severity: "Low", 
    location: "Dammam Edge - Cam 04", 
    timestamp: "2 hours ago", 
    status: "Action Taken",
    description: "Camera feed signal lost. Maintenance ticket #4421 created."
  },
  { 
    id: "ALT-2025-085", 
    type: "Fire Alarm", 
    severity: "Critical", 
    location: "Riyadh Main DC - Zone B", 
    timestamp: "Yesterday", 
    status: "Resolved",
    description: "False alarm triggered by maintenance dust. System reset."
  }
];

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filteredAlerts = activeTab === "all" 
    ? alerts 
    : alerts.filter(a => 
        activeTab === "new" ? a.status === "New" : 
        activeTab === "critical" ? a.severity === "Critical" : true
      );

  const handleView = (alert: any) => {
    setSelectedAlert(alert);
    setViewOpen(true);
    
    // Mark as viewed if new
    if (alert.status === "New") {
      const updatedAlerts = alerts.map(a => 
        a.id === alert.id ? { ...a, status: "Viewed" } : a
      );
      setAlerts(updatedAlerts);
    }
  };

  const handleAction = (action: string) => {
    if (!selectedAlert) return;
    
    const updatedAlerts = alerts.map(a => 
      a.id === selectedAlert.id ? { ...a, status: "Action Taken" } : a
    );
    setAlerts(updatedAlerts);
    setViewOpen(false);
    
    toast.success(`Action Recorded: ${action}`, {
      description: `Alert ${selectedAlert.id} status updated to 'Action Taken'.`
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]";
      case "High": return "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]";
      case "Medium": return "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]";
      default: return "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93] animate-pulse";
      case "Viewed": return "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]";
      case "Action Taken": return "bg-[#E8F9F8] text-[#4ECDC4] border-[#4ECDC4]";
      case "Resolved": return "bg-[#F5F5F5] text-[#6B6B6B] border-[#E0E0E0]";
      default: return "bg-[#F5F5F5] text-[#6B6B6B]";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-[#FF6B6B]" />
            Security Alerts
          </h1>
          <p className="text-[#6B6B6B]">Real-time incident monitoring and response log.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            <Input placeholder="Search alerts..." className="pl-9 bg-white" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-[#FFE5E5] border-[#FF6B6B]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#FF6B6B]">Active Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-medium text-[#FF6B6B]">
              {alerts.filter(a => a.severity === "Critical" && a.status !== "Resolved").length}
            </div>
            <p className="text-xs text-[#FF6B6B] mt-1">Requires immediate response</p>
          </CardContent>
        </Card>
        <Card className="bg-[#E8DCF5] border-[#5B2C93]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#5B2C93]">New Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-medium text-[#5B2C93]">
              {alerts.filter(a => a.status === "New").length}
            </div>
            <p className="text-xs text-[#5B2C93] mt-1">Unacknowledged incidents</p>
          </CardContent>
        </Card>
        <Card className="bg-[#E8DCF5] border-[#5B2C93]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#5B2C93]">Under Investigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-medium text-[#5B2C93]">
              {alerts.filter(a => a.status === "Viewed").length}
            </div>
            <p className="text-xs text-[#5B2C93] mt-1">Being processed</p>
          </CardContent>
        </Card>
        <Card className="bg-[#E8F9F8] border-[#4ECDC4]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4ECDC4]">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-medium text-[#4ECDC4]">14</div>
            <p className="text-xs text-[#4ECDC4] mt-1">Incidents closed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="new" className="relative">
            New
            {alerts.filter(a => a.status === "New").length > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#FF6B6B]" />
            )}
          </TabsTrigger>
          <TabsTrigger value="critical">Critical Only</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={alert.status === "New" ? "bg-[#E8DCF5]/50" : ""}>
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{alert.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(alert)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="new" className="mt-4">
          {/* Same table structure, filtered by logic above */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className="bg-[#E8DCF5]/50">
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{alert.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(alert)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="mt-4">
           <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{alert.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(alert)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-[#FF6B6B]" />
              Incident Details
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.id} - {selectedAlert?.timestamp}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F5F5]/30 rounded-lg border">
                <div className="space-y-1">
                  <span className="text-sm text-[#6B6B6B]">Incident Type</span>
                  <p className="font-medium text-lg">{selectedAlert.type}</p>
                </div>
                <Badge className={`${getSeverityColor(selectedAlert.severity)} text-sm px-3 py-1`}>
                  {selectedAlert.severity} Severity
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-[#6B6B6B] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="font-medium">{selectedAlert.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-[#6B6B6B] flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Detected At
                  </span>
                  <p className="font-medium">{selectedAlert.timestamp}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Description</h4>
                <p className="text-sm text-[#6B6B6B] bg-[#F5F5F5] p-3 rounded-md border">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2">
                  <Video className="h-4 w-4" /> View Playback
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <PhoneCall className="h-4 w-4" /> Contact Guard
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#5B2C93] hover:bg-[#5B2C93] gap-2">
                  Take Action <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Response Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("Dispatch Patrol")}>
                  Dispatch Patrol Unit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("Lockdown Zone")}>
                  Initiate Zone Lockdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("False Alarm")}>
                  Mark as False Alarm
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("Escalate")} className="text-[#FF6B6B]">
                  Escalate to Supervisor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
