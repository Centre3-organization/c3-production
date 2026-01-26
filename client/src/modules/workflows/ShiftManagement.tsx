/**
 * Shift Management - Admin UI for managing shift schedules and assignments
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Clock, 
  Calendar,
  Users,
  Edit,
  Trash2,
  Sun,
  Moon,
  CheckCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export function ShiftManagement() {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  // Queries
  const { data: schedules, isLoading, refetch } = trpc.workflows.shifts.listSchedules.useQuery({
    includeInactive: true,
  });

  const { data: scheduleDetails, refetch: refetchDetails } = trpc.workflows.shifts.getScheduleDetails.useQuery(
    { scheduleId: selectedSchedule! },
    { enabled: !!selectedSchedule }
  );

  const { data: currentShift } = trpc.workflows.shifts.getCurrentShift.useQuery({});
  const { data: shiftRoles } = trpc.workflows.shifts.getShiftRoles.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery({});

  // Mutations
  const createSchedule = trpc.workflows.shifts.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setIsCreateScheduleOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const createShift = trpc.workflows.shifts.createShift.useMutation({
    onSuccess: () => {
      toast.success("Shift created successfully");
      setIsCreateShiftOpen(false);
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteShift = trpc.workflows.shifts.deleteShift.useMutation({
    onSuccess: () => {
      toast.success("Shift deleted successfully");
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  const assignUser = trpc.workflows.shifts.assignUser.useMutation({
    onSuccess: () => {
      toast.success("User assigned successfully");
      setIsAssignUserOpen(false);
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeAssignment = trpc.workflows.shifts.removeAssignment.useMutation({
    onSuccess: () => {
      toast.success("Assignment removed");
      refetchDetails();
    },
    onError: (error) => toast.error(error.message),
  });

  // Form state
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    timezone: "Asia/Riyadh",
    isDefault: false,
  });

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "08:00",
    endTime: "16:00",
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
  });

  const [newAssignment, setNewAssignment] = useState({
    userId: 0,
    roleInShift: "",
    isPrimary: true,
  });

  const handleCreateSchedule = () => {
    if (!newSchedule.name) {
      toast.error("Schedule name is required");
      return;
    }
    createSchedule.mutate(newSchedule);
  };

  const handleCreateShift = () => {
    if (!selectedSchedule || !newShift.name) {
      toast.error("Shift name is required");
      return;
    }
    createShift.mutate({
      scheduleId: selectedSchedule,
      ...newShift,
    });
  };

  const handleAssignUser = () => {
    if (!selectedShiftId || !newAssignment.userId || !newAssignment.roleInShift) {
      toast.error("Please fill all required fields");
      return;
    }
    assignUser.mutate({
      shiftId: selectedShiftId,
      ...newAssignment,
    });
  };

  const toggleDay = (day: number) => {
    setNewShift((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Management</h1>
          <p className="text-muted-foreground">Configure shift schedules for time-based approval routing</p>
        </div>
        <Button onClick={() => setIsCreateScheduleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Current Shift Info */}
      {currentShift && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                {new Date().getHours() >= 6 && new Date().getHours() < 18 ? (
                  <Sun className="h-6 w-6 text-primary" />
                ) : (
                  <Moon className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold">Current Shift: {currentShift.shift.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentShift.shift.startTime} - {currentShift.shift.endTime} ({currentShift.schedule.name})
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {currentShift.assignments.length} assigned
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Schedules List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Schedules</h2>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : schedules?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No schedules configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {schedules?.map((schedule) => (
                <Card
                  key={schedule.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedSchedule === schedule.id ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedSchedule(schedule.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-muted-foreground">{schedule.timezone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {schedule.isDefault && <Badge>Default</Badge>}
                        {!schedule.isActive && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Details */}
        <div className="col-span-2">
          {selectedSchedule && scheduleDetails ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{scheduleDetails.schedule.name}</h2>
                  <p className="text-sm text-muted-foreground">Timezone: {scheduleDetails.schedule.timezone}</p>
                </div>
                <Button onClick={() => setIsCreateShiftOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              </div>

              {scheduleDetails.shifts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shifts configured for this schedule</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {scheduleDetails.shifts.map((shift) => (
                    <Card key={shift.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{shift.name}</CardTitle>
                            <CardDescription>
                              {shift.startTime} - {shift.endTime}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {DAYS_OF_WEEK.map((day) => (
                                <Badge
                                  key={day.value}
                                  variant={(shift.daysOfWeek as number[]).includes(day.value) ? "default" : "outline"}
                                  className="w-8 justify-center text-xs"
                                >
                                  {day.short.charAt(0)}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedShiftId(shift.id);
                                setIsAssignUserOpen(true);
                              }}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteShift.mutate({ id: shift.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {shift.assignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No users assigned to this shift</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Primary</TableHead>
                                <TableHead className="w-[80px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {shift.assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                  <TableCell>
                                    {assignment.userName} {assignment.userLastName}
                                    <span className="text-muted-foreground text-xs block">
                                      {assignment.userEmail}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{assignment.roleInShift}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {assignment.isPrimary && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeAssignment.mutate({ id: assignment.id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a schedule to view shifts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shift Schedule</DialogTitle>
            <DialogDescription>
              Create a new shift schedule for time-based approval routing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Name *</Label>
              <Input
                placeholder="e.g., Default Schedule"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={newSchedule.timezone}
                onValueChange={(v) => setNewSchedule({ ...newSchedule, timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newSchedule.isDefault}
                onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, isDefault: checked })}
              />
              <Label>Set as default schedule</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={createSchedule.isPending}>
              {createSchedule.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shift Dialog */}
      <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
            <DialogDescription>
              Define a new shift for this schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shift Name *</Label>
              <Input
                placeholder="e.g., Day Shift"
                value={newShift.name}
                onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.value}
                    className={`flex items-center justify-center w-10 h-10 rounded-md cursor-pointer border transition-colors ${
                      newShift.daysOfWeek.includes(day.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.short.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShift} disabled={createShift.isPending}>
              {createShift.isPending ? "Creating..." : "Add Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={isAssignUserOpen} onOpenChange={setIsAssignUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Shift</DialogTitle>
            <DialogDescription>
              Assign a user to this shift with a specific role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User *</Label>
              <Select
                value={newAssignment.userId.toString()}
                onValueChange={(v) => setNewAssignment({ ...newAssignment, userId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role in Shift *</Label>
              <Select
                value={newAssignment.roleInShift}
                onValueChange={(v) => setNewAssignment({ ...newAssignment, roleInShift: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {shiftRoles?.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newAssignment.isPrimary}
                onCheckedChange={(checked) => setNewAssignment({ ...newAssignment, isPrimary: checked })}
              />
              <Label>Primary assignment (receives tasks first)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignUser} disabled={assignUser.isPending}>
              {assignUser.isPending ? "Assigning..." : "Assign User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
