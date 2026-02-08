import { useState } from "react";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Lock, 
  Unlock, 
  Video, 
  Bell, 
  HelpCircle, 
  AlertTriangle,
  ChevronRight,
  Building2,
  Server,
  Globe,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for multiple sites
const sites = [
  {
    id: "SITE-001",
    name: "Riyadh Main DC",
    location: "Riyadh, KSA",
    totalOccupancy: 145,
    maxCapacity: 500,
    status: "Normal",
    image: "https://images.unsplash.com/photo-1558494949-ef526b0042a0?w=800&q=80",
    zones: [
      {
        id: "ZONE-A",
        name: "Zone A (Lobby & Reception)",
        occupancy: 45,
        capacity: 100,
        locked: false,
        areas: [
          { id: "AREA-001", name: "Main Entrance", occupancy: 12, capacity: 30, locked: false },
          { id: "AREA-002", name: "Waiting Area", occupancy: 25, capacity: 50, locked: false },
          { id: "AREA-003", name: "Security Desk", occupancy: 8, capacity: 20, locked: false },
        ]
      },
      {
        id: "ZONE-B",
        name: "Zone B (Office & Admin)",
        occupancy: 85,
        capacity: 200,
        locked: false,
        areas: [
          { id: "AREA-004", name: "Open Office", occupancy: 60, capacity: 120, locked: false },
          { id: "AREA-005", name: "Meeting Rooms", occupancy: 25, capacity: 80, locked: false },
        ]
      },
      {
        id: "ZONE-C",
        name: "Zone C (Server Halls)",
        occupancy: 15,
        capacity: 50,
        locked: true,
        areas: [
          { id: "AREA-006", name: "Server Hall 1", occupancy: 8, capacity: 20, locked: true },
          { id: "AREA-007", name: "Server Hall 2", occupancy: 7, capacity: 20, locked: true },
          { id: "AREA-008", name: "NOC Room", occupancy: 0, capacity: 10, locked: true },
        ]
      }
    ]
  },
  {
    id: "SITE-002",
    name: "Jeddah DR Site",
    location: "Jeddah, KSA",
    totalOccupancy: 42,
    maxCapacity: 300,
    status: "Normal",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    zones: [
      {
        id: "ZONE-J1",
        name: "Zone A (Perimeter Security)",
        occupancy: 12,
        capacity: 50,
        locked: false,
        areas: [
          { id: "AREA-J01", name: "Gate 1", occupancy: 4, capacity: 10, locked: false },
          { id: "AREA-J02", name: "Patrol Route", occupancy: 8, capacity: 40, locked: false },
        ]
      },
      {
        id: "ZONE-J2",
        name: "Zone B (Data Halls)",
        occupancy: 30,
        capacity: 100,
        locked: true,
        areas: [
          { id: "AREA-J03", name: "Main Hall", occupancy: 28, capacity: 90, locked: true },
          { id: "AREA-J04", name: "Meet-Me Room", occupancy: 2, capacity: 10, locked: true },
        ]
      },
      {
        id: "ZONE-J3",
        name: "Zone C (Power Plant)",
        occupancy: 0,
        capacity: 20,
        locked: true,
        areas: [
          { id: "AREA-J05", name: "Generator Room", occupancy: 0, capacity: 10, locked: true },
          { id: "AREA-J06", name: "Fuel Storage", occupancy: 0, capacity: 10, locked: true },
        ]
      }
    ]
  },
  {
    id: "SITE-003",
    name: "Dammam Edge DC",
    location: "Dammam, KSA",
    totalOccupancy: 18,
    maxCapacity: 150,
    status: "Maintenance",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    zones: [
      {
        id: "ZONE-D1",
        name: "Zone A (Facility Core)",
        occupancy: 18,
        capacity: 150,
        locked: false,
        areas: [
          { id: "AREA-D01", name: "Control Room", occupancy: 5, capacity: 20, locked: false },
          { id: "AREA-D02", name: "Power Plant", occupancy: 13, capacity: 50, locked: false },
        ]
      },
      {
        id: "ZONE-D2",
        name: "Zone B (Cooling)",
        occupancy: 0,
        capacity: 30,
        locked: true,
        areas: [
          { id: "AREA-D03", name: "Chiller Plant", occupancy: 0, capacity: 15, locked: true },
          { id: "AREA-D04", name: "Pump Room", occupancy: 0, capacity: 15, locked: true },
        ]
      },
      {
        id: "ZONE-D3",
        name: "Zone C (Network)",
        occupancy: 0,
        capacity: 20,
        locked: true,
        areas: [
          { id: "AREA-D05", name: "MMR 1", occupancy: 0, capacity: 10, locked: true },
          { id: "AREA-D06", name: "MMR 2", occupancy: 0, capacity: 10, locked: true },
        ]
      }
    ]
  }
];

export default function ViewSite() {
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0].id);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [cctvOpen, setCctvOpen] = useState(false);
  const [cctvTarget, setCctvTarget] = useState("");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<any>(null);

  const selectedSite = sites.find(s => s.id === selectedSiteId) || sites[0];

  const handleLockToggle = (target: any, type: 'zone' | 'area') => {
    setLockTarget({ ...target, type });
    setLockDialogOpen(true);
  };

  const confirmLockAction = () => {
    if (!lockTarget) return;
    
    const action = lockTarget.locked ? "unlocked" : "locked";
    toast.success(`${lockTarget.name} has been ${action}`, {
      description: lockTarget.locked 
        ? "Access is now restored to normal operation." 
        : "Entry is restricted. Only emergency access allowed."
    });
    
    setLockDialogOpen(false);
  };

  const handleBuzzer = (areaName: string) => {
    toast.warning(`Emergency Buzzer Activated: ${areaName}`, {
      description: "Security team has been notified.",
      duration: 5000,
    });
  };

  const handleHelp = (areaName: string) => {
    toast.info(`Assistance Requested: ${areaName}`, {
      description: "Nearest patrol unit dispatched.",
    });
  };

  const openCCTV = (name: string) => {
    setCctvTarget(name);
    setCctvOpen(true);
  };

  const getOccupancyColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "bg-[#FF6B6B]";
    if (percentage >= 75) return "bg-[#FFF4E5]";
    return "bg-[#E8F9F8]";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-[#2C2C2C] flex items-center gap-2">
            <Globe className="h-8 w-8 text-[#5B2C93]" />
            Global Overwatch
          </h1>
          <p className="text-[#6B6B6B]">Centralized command for all data center facilities.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            <Input placeholder="Search global assets..." className="pl-9 bg-white" />
          </div>
        </div>
      </div>

      {/* Site Selector & Overview */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-4">
          <Card className="h-full border-none shadow-lg bg-[#2C2C2C] text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-[#B0B0B0]">Select Facility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white h-12 text-lg">
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#6B6B6B]" />
                        <span>{site.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="pt-4 space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#E8F9F8]/20 text-[#4ECDC4]">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B0B0B0]">System Status</p>
                      <p className="font-medium">{selectedSite.status}</p>
                    </div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${selectedSite.status === 'Normal' ? 'bg-[#E8F9F8]' : 'bg-[#FFF4E5]'} animate-pulse`}></div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#E8DCF5]/20 text-[#5B2C93]">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B0B0B0]">Total Personnel</p>
                      <p className="font-medium">{selectedSite.totalOccupancy} / {selectedSite.maxCapacity}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#E8DCF5]/20 text-[#5B2C93]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B0B0B0]">Security Level</p>
                      <p className="font-medium">DEFCON 4</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className="h-full border-none shadow-md overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <img 
              src={selectedSite.image} 
              alt={selectedSite.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
              <div className="flex items-end justify-between">
                <div>
                  <Badge className="mb-2 bg-[#5B2C93] hover:bg-[#5B2C93] border-none">Live Feed Active</Badge>
                  <h2 className="text-4xl font-medium mb-1">{selectedSite.name}</h2>
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">{selectedSite.location}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-none text-white">
                    <Video className="mr-2 h-4 w-4" /> View Perimeter
                  </Button>
                  <Button variant="destructive" className="backdrop-blur-md">
                    <Lock className="mr-2 h-4 w-4" /> Site Lockdown
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium flex items-center gap-2">
          <Server className="h-5 w-5 text-[#5B2C93]" />
          Zone Monitoring
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Expand All</Button>
          <Button variant="outline" size="sm">Collapse All</Button>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {selectedSite.zones.map((zone) => (
          <Card key={zone.id} className={`overflow-hidden transition-all ${zone.locked ? 'border-[#FF6B6B] bg-[#FFE5E5]/30' : 'hover:border-[#5B2C93] shadow-sm hover:shadow-md'}`}>
            <CardHeader className="pb-3 bg-[#F5F5F5]/20">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-[#F5F5F5] font-mono">{zone.id}</Badge>
                {zone.locked && (
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <Lock className="h-3 w-3" /> LOCKED
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-2">{zone.name}</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Occupancy</span>
                    <span className="font-medium">{zone.occupancy} / {zone.capacity}</span>
                  </div>
                  <Progress value={(zone.occupancy / zone.capacity) * 100} className="h-2" indicatorClassName={getOccupancyColor(zone.occupancy, zone.capacity)} />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openCCTV(zone.name)} title="View CCTV">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-[#FFB84D] hover:text-[#FFB84D] hover:bg-[#FFF4E5]" onClick={() => handleBuzzer(zone.name)} title="Sound Buzzer">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`lock-${zone.id}`} className="text-xs font-medium text-[#6B6B6B]">
                      {zone.locked ? "Unlock" : "Lock"}
                    </Label>
                    <Switch 
                      id={`lock-${zone.id}`} 
                      checked={zone.locked}
                      onCheckedChange={() => handleLockToggle(zone, 'zone')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-[#F5F5F5]/30 p-3 border-t">
              <Button variant="ghost" className="w-full justify-between h-auto py-2 text-sm font-normal hover:bg-white/50" onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}>
                View Areas ({zone.areas.length})
                <ChevronRight className={`h-4 w-4 transition-transform ${selectedZone?.id === zone.id ? 'rotate-90' : ''}`} />
              </Button>
            </CardFooter>
            
            {/* Expanded Areas List */}
            {selectedZone?.id === zone.id && (
              <div className="border-t bg-[#F5F5F5] p-3 space-y-3 animate-in slide-in-from-top-2">
                {zone.areas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-2 rounded-md border bg-[#F5F5F5]/10 hover:bg-[#F5F5F5]/20 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{area.name}</span>
                        {area.locked && <Lock className="h-3 w-3 text-[#FF6B6B]" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <Users className="h-3 w-3" />
                        {area.occupancy} / {area.capacity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openCCTV(area.name)}>
                        <Video className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#5B2C93]" onClick={() => handleHelp(area.name)}>
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Switch 
                        className="scale-75" 
                        checked={area.locked}
                        onCheckedChange={() => handleLockToggle(area, 'area')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* CCTV Dialog */}
      <Dialog open={cctvOpen} onOpenChange={setCctvOpen}>
        <DialogContent className="max-w-4xl bg-black border-[#2C2C2C] p-0 overflow-hidden">
          <div className="relative aspect-video bg-[#2C2C2C] flex items-center justify-center">
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded text-white text-sm backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-[#FF6B6B] animate-pulse" />
              LIVE REC
            </div>
            <div className="absolute top-4 right-4 text-white/80 text-sm font-mono">
              CAM-04: {cctvTarget}
            </div>
            <div className="text-[#6B6B6B] flex flex-col items-center gap-2">
              <Video className="h-12 w-12 opacity-20" />
              <p>Connecting to secure feed...</p>
            </div>
            
            {/* Mock Camera UI Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
              <div className="text-white/60 text-xs font-mono">
                {new Date().toLocaleString()} | 30 FPS | 1080p
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-8 bg-white/10 hover:bg-white/20 text-white border-none">
                  Playback
                </Button>
                <Button size="sm" variant="destructive" className="h-8">
                  Emergency Lock
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FFB84D]" />
              Confirm {lockTarget?.locked ? "Unlock" : "Lockdown"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {lockTarget?.locked ? "unlock" : "lock down"} <strong>{lockTarget?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {!lockTarget?.locked && (
              <div className="bg-[#FFE5E5] border border-[#FF6B6B]/20 rounded-md p-3 text-sm text-[#FF6B6B]">
                <strong>Warning:</strong> Locking this area will prevent any new entries. Current occupants will still be able to exit.
              </div>
            )}
            {lockTarget?.locked && (
              <div className="bg-[#E8F9F8] border border-[#4ECDC4]/20 rounded-md p-3 text-sm text-[#4ECDC4]">
                <strong>Note:</strong> Unlocking will restore normal access control operations.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>Cancel</Button>
            <Button 
              variant={lockTarget?.locked ? "default" : "destructive"} 
              onClick={confirmLockAction}
            >
              Confirm {lockTarget?.locked ? "Unlock" : "Lock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
