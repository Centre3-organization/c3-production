import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  Bell,
  Settings,
  Users,
  Zap,
  Save
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import {
  PREDEFINED_TRIGGER_CONDITIONS,
  STATUS_ON_TRIGGER_OPTIONS,
  ACTION_POINT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TRIGGERS
} from "@shared/trigger-conditions";

interface SecurityAlertConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId?: number;
}

type AlertType = "breach" | "impact" | "status" | "view" | "action";
type Severity = "low" | "medium" | "high" | "critical";
type ImpactLevel = "low" | "medium" | "high" | "critical";
type NotificationChannel = "email" | "sms" | "whatsapp" | "in_app" | "webhook";
type ActionType = "deny_entry" | "alert_supervisor" | "call_security" | "escalate" | "monitor" | "log_incident";

interface TriggerCondition {
  id: string;
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "between" | "in" | "greaterThan" | "lessThan";
  value: any;
}

interface ViewableUser {
  type: "role" | "group" | "user";
  id: number;
  name: string;
}

interface ActionPoint {
  id: string;
  name: string;
  type: ActionType;
  conditions?: any;
  order: number;
}

interface NotificationRule {
  id?: number;
  triggerOn: "alert_created" | "alert_escalated" | "action_taken" | "alert_resolved";
  channel: NotificationChannel;
  recipients: Array<{
    type: "role" | "group" | "user" | "email";
    id?: number;
    name: string;
    value: string;
  }>;
  messageTemplate?: string;
  messageVariables?: Array<{
    name: string;
    placeholder: string;
    description: string;
  }>;
  sendImmediately: boolean;
  delayMinutes: number;
  escalationLevel: number;
  escalateAfterMinutes?: number;
}

export function SecurityAlertConfigModal({ open, onOpenChange, configId }: SecurityAlertConfigModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  
  // Form state
  const [alertTypeId, setAlertTypeId] = useState<number>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [impactLevel, setImpactLevel] = useState<ImpactLevel>("medium");
  const [statusOnTrigger, setStatusOnTrigger] = useState("alert_triggered");
  const [autoResolve, setAutoResolve] = useState(false);
  const [autoResolveMinutes, setAutoResolveMinutes] = useState(0);
  
  // Conditions
  const [conditions, setConditions] = useState<TriggerCondition[]>([]);
  const [newCondition, setNewCondition] = useState<Partial<TriggerCondition>>({});
  
  // Viewable users
  const [viewableUsers, setViewableUsers] = useState<ViewableUser[]>([]);
  const [newViewableUser, setNewViewableUser] = useState<Partial<ViewableUser>>({});
  
  // Action points
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [newActionPoint, setNewActionPoint] = useState<Partial<ActionPoint>>({});
  
  // Notifications
  const [notifications, setNotifications] = useState<NotificationRule[]>([]);
  const [newNotification, setNewNotification] = useState<Partial<NotificationRule>>({});
  
  // Queries
  const { data: alertTypes } = trpc.alertConfig.getAlertTypes.useQuery();
  const { data: existingConfig } = trpc.alertConfig.getConfigById.useQuery(
    { id: configId! },
    { enabled: !!configId }
  );
  
  // Mutations
  const createConfig = trpc.alertConfig.createConfig.useMutation();
  const updateConfig = trpc.alertConfig.updateConfig.useMutation();
  const createNotification = trpc.alertConfig.createNotification.useMutation();
  
  // Load existing config
  useEffect(() => {
    if (existingConfig) {
      setAlertTypeId(existingConfig.alertTypeId);
      setName(existingConfig.name);
      setDescription(existingConfig.description || "");
      setImpactLevel(existingConfig.impactLevel);
      setStatusOnTrigger(existingConfig.statusOnTrigger || "alert_triggered");
      setAutoResolve(existingConfig.autoResolve || false);
      setAutoResolveMinutes(existingConfig.autoResolveAfterMinutes || 0);
      
      // Parse JSON fields
      if (typeof existingConfig.triggerConditions === "string") {
        setConditions(JSON.parse(existingConfig.triggerConditions));
      }
      if (typeof existingConfig.viewableBy === "string") {
        setViewableUsers(JSON.parse(existingConfig.viewableBy));
      }
      if (typeof existingConfig.actionPoints === "string") {
        setActionPoints(JSON.parse(existingConfig.actionPoints));
      }
      if (existingConfig.notifications) {
        const notifs = existingConfig.notifications.map((n: any) => ({
          id: n.id,
          triggerOn: n.triggerOn,
          channel: n.channel,
          recipients: n.recipients,
          messageTemplate: n.messageTemplate || undefined,
          messageVariables: n.messageVariables || undefined,
          sendImmediately: n.sendImmediately,
          delayMinutes: n.delayMinutes,
          escalationLevel: n.escalationLevel,
          escalateAfterMinutes: n.escalateAfterMinutes,
        }));
        setNotifications(notifs);
      }
    }
  }, [existingConfig]);
  
  // Add condition
  const handleAddCondition = () => {
    if (!newCondition.field || !newCondition.operator || newCondition.value === undefined) {
      alert("Please fill all condition fields");
      return;
    }
    
    const conditionWithId = { ...newCondition, id: `cond-${Date.now()}` } as TriggerCondition;
    setConditions([...conditions, conditionWithId]);
    setNewCondition({});
  };
  
  // Remove condition
  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };
  
  // Add viewable user
  const handleAddViewableUser = () => {
    if (!newViewableUser.type || !newViewableUser.id || !newViewableUser.name) {
      alert("Please fill all user fields");
      return;
    }
    
    setViewableUsers([...viewableUsers, newViewableUser as ViewableUser]);
    setNewViewableUser({});
  };
  
  // Remove viewable user
  const handleRemoveViewableUser = (id: number, type: string) => {
    setViewableUsers(viewableUsers.filter(u => !(u.id === id && u.type === type)));
  };
  
  // Add action point
  const handleAddActionPoint = () => {
    if (!newActionPoint.name || !newActionPoint.type) {
      alert("Please fill action point fields");
      return;
    }
    
    const order = Math.max(...actionPoints.map(a => a.order), 0) + 1;
    const actionWithId = { ...newActionPoint, id: `action-${Date.now()}`, order } as ActionPoint;
    setActionPoints([...actionPoints, actionWithId]);
    setNewActionPoint({});
  };
  
  // Remove action point
  const handleRemoveActionPoint = (id: string) => {
    setActionPoints(actionPoints.filter(a => a.id !== id));
  };
  
  // Add notification
  const handleAddNotification = () => {
    if (!newNotification.channel || !newNotification.recipients || newNotification.recipients.length === 0) {
      alert("Please fill notification fields");
      return;
    }
    
    const notifWithId = { ...newNotification, id: Date.now() } as NotificationRule;
    setNotifications([...notifications, notifWithId]);
    setNewNotification({});
  };
  
  // Remove notification
  const handleRemoveNotification = (id?: number) => {
    if (id) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };
  
  // Save configuration
  const handleSave = async () => {
    if (!alertTypeId || !name) {
      alert("Alert type and name are required");
      return;
    }
    
    try {
      if (configId) {
        await updateConfig.mutateAsync({
          id: configId,
          name,
          description,
          triggerConditions: conditions as any,
          impactLevel,
          statusOnTrigger,
          autoResolve,
          autoResolveAfterMinutes: autoResolveMinutes || undefined,
          viewableBy: viewableUsers,
          actionPoints,
        });
      } else {
        const result = await createConfig.mutateAsync({
          alertTypeId,
          name,
          description,
          triggerConditions: conditions as any,
          impactLevel,
          affectedAreas: [],
          statusOnTrigger,
          autoResolve,
          autoResolveAfterMinutes: autoResolveMinutes || undefined,
          viewableBy: viewableUsers,
          actionPoints,
        });
        
        // Create notifications for this config
        for (const notif of notifications) {
          await createNotification.mutateAsync({
            alertConfigId: result.configId,
            triggerOn: notif.triggerOn,
            channel: notif.channel,
            recipients: notif.recipients,
            messageTemplate: notif.messageTemplate,
            messageVariables: notif.messageVariables,
            sendImmediately: notif.sendImmediately,
            delayMinutes: notif.delayMinutes,
            escalationLevel: notif.escalationLevel,
            escalateAfterMinutes: notif.escalateAfterMinutes,
          });
        }
      }
      
      alert("Alert configuration saved successfully!");
      onOpenChange(false);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            {configId ? "Edit" : "Create"} Security Alert Configuration
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="conditions" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Conditions</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
              <TabsTrigger value="viewers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Viewers</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Configuration Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Configuration</CardTitle>
                  <CardDescription>Define the basic alert properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Alert Type *</label>
                      <select
                        value={alertTypeId}
                        onChange={(e) => setAlertTypeId(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Select alert type...</option>
                        {alertTypes?.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Impact Level *</label>
                      <select
                        value={impactLevel}
                        onChange={(e) => setImpactLevel(e.target.value as ImpactLevel)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Configuration Name *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Unauthorized Access Alert"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this alert configuration does..."
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status on Trigger</label>
                      <Input
                        value={statusOnTrigger}
                        onChange={(e) => setStatusOnTrigger(e.target.value)}
                        placeholder="e.g., alert_triggered"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mt-1">
                        <input
                          type="checkbox"
                          checked={autoResolve}
                          onChange={(e) => setAutoResolve(e.target.checked)}
                          className="rounded"
                        />
                        Auto-resolve after (minutes)
                      </label>
                      <Input
                        type="number"
                        value={autoResolveMinutes}
                        onChange={(e) => setAutoResolveMinutes(Number(e.target.value))}
                        disabled={!autoResolve}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Trigger Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trigger Conditions</CardTitle>
                  <CardDescription>Define when this alert should be triggered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conditions.length > 0 && (
                    <div className="space-y-2">
                      {conditions.map((cond, idx) => (
                        <div key={cond.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="text-sm">
                            <Badge variant="outline">{cond.field}</Badge>
                            <span className="mx-2">{cond.operator}</span>
                            <Badge variant="secondary">{String(cond.value)}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCondition(cond.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Add New Condition</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newCondition.field || ""}
                        onChange={(e) => {
                          const template = PREDEFINED_TRIGGER_CONDITIONS.find(c => c.field === e.target.value);
                          setNewCondition({
                            field: e.target.value,
                            operator: (template?.defaultOperator || "") as any,
                            value: undefined
                          });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select condition...</option>
                        {PREDEFINED_TRIGGER_CONDITIONS.map((cond) => (
                          <option key={cond.id} value={cond.field}>
                            {cond.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newCondition.operator || ""}
                        onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select operator...</option>
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greaterThan">Greater Than</option>
                        <option value="lessThan">Less Than</option>
                        <option value="in">In</option>
                      </select>
                      <Input
                        placeholder="Value"
                        value={newCondition.value || ""}
                        onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddCondition} className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Action Points Tab */}
            <TabsContent value="actions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Action Points</CardTitle>
                  <CardDescription>Define actions to take when alert is triggered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actionPoints.length > 0 && (
                    <div className="space-y-2">
                      {actionPoints.map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="text-sm">
                            <Badge>{action.order}</Badge>
                            <span className="mx-2 font-medium">{action.name}</span>
                            <Badge variant="secondary">{action.type}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveActionPoint(action.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Add New Action</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Action name"
                        value={newActionPoint.name || ""}
                        onChange={(e) => setNewActionPoint({ ...newActionPoint, name: e.target.value })}
                      />
                      <select
                        value={newActionPoint.type || ""}
                        onChange={(e) => setNewActionPoint({ ...newActionPoint, type: e.target.value as ActionType })}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select action type...</option>
                        <option value="deny_entry">Deny Entry</option>
                        <option value="alert_supervisor">Alert Supervisor</option>
                        <option value="call_security">Call Security</option>
                        <option value="escalate">Escalate</option>
                        <option value="monitor">Monitor</option>
                        <option value="log_incident">Log Incident</option>
                      </select>
                    </div>
                    <Button onClick={handleAddActionPoint} className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Viewable Users Tab */}
            <TabsContent value="viewers" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Who Can View This Alert</CardTitle>
                  <CardDescription>Select roles, groups, or users who can see this alert</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {viewableUsers.length > 0 && (
                    <div className="space-y-2">
                      {viewableUsers.map((user) => (
                        <div key={`${user.type}-${user.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="text-sm">
                            <Badge variant="outline">{user.type}</Badge>
                            <span className="mx-2 font-medium">{user.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveViewableUser(user.id, user.type)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Add Viewer</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newViewableUser.type || ""}
                        onChange={(e) => setNewViewableUser({ ...newViewableUser, type: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select type...</option>
                        <option value="role">Role</option>
                        <option value="group">Group</option>
                        <option value="user">User</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="ID"
                        value={newViewableUser.id || ""}
                        onChange={(e) => setNewViewableUser({ ...newViewableUser, id: Number(e.target.value) })}
                      />
                      <Input
                        placeholder="Name"
                        value={newViewableUser.name || ""}
                        onChange={(e) => setNewViewableUser({ ...newViewableUser, name: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddViewableUser} className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Viewer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Rules</CardTitle>
                  <CardDescription>Configure who gets notified and how</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.length > 0 && (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="text-sm">
                            <Badge>{notif.channel}</Badge>
                            <span className="mx-2">{notif.triggerOn}</span>
                            <Badge variant="secondary">{notif.recipients.length} recipients</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveNotification(notif.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Alert>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>
                      Add notification rules to send alerts via email, SMS, WhatsApp, or in-app messages
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Add Notification Rule</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newNotification.triggerOn || ""}
                        onChange={(e) => setNewNotification({ ...newNotification, triggerOn: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Trigger on...</option>
                        <option value="alert_created">Alert Created</option>
                        <option value="alert_escalated">Alert Escalated</option>
                        <option value="action_taken">Action Taken</option>
                        <option value="alert_resolved">Alert Resolved</option>
                      </select>
                      <select
                        value={newNotification.channel || ""}
                        onChange={(e) => setNewNotification({ ...newNotification, channel: e.target.value as NotificationChannel })}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Channel...</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="in_app">In-App</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>
                    <Input
                      placeholder="Recipient email or phone (comma-separated)"
                      value={newNotification.recipients?.map(r => r.value).join(", ") || ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map(v => v.trim());
                        setNewNotification({
                          ...newNotification,
                          recipients: values.map(v => ({
                            type: "email" as const,
                            name: v,
                            value: v,
                          })),
                        });
                      }}
                    />
                    <Button onClick={handleAddNotification} className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Notification Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createConfig.isPending || updateConfig.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createConfig.isPending || updateConfig.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
