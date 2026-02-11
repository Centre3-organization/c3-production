import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Trash2, Pencil, Loader2, CheckCircle2, XCircle,
  Smartphone, MessageSquare, Mail, Send, TestTube, Power, Settings2,
  FileText, Zap, ScrollText, Shield, Users, ChevronDown, Eye, Code
} from "lucide-react";

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CommunicationsIntegration() {
  const { t } = useTranslation();
  const [, params] = useRoute("/integration-hub/communications/:tab");
  const [, setLocation] = useLocation();
  const activeTab = params?.tab || "providers";

  const setActiveTab = (tab: string) => {
    setLocation(`/integration-hub/communications/${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/integration-hub")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("integrationHub.communications", "Communications")}</h1>
          <p className="text-muted-foreground">{t("integrationHub.communicationsDesc", "Manage SMS, WhatsApp, and Email messaging — providers, templates, trigger rules, and delivery logs")}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="gap-2">
            <Settings2 className="h-4 w-4" />
            {t("integrationHub.providers", "Providers")}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            {t("integrationHub.templates", "Templates")}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Zap className="h-4 w-4" />
            {t("integrationHub.triggerRules", "Trigger Rules")}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            {t("integrationHub.messageLogs", "Message Logs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers"><ProvidersTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="rules"><TriggerRulesTab /></TabsContent>
        <TabsContent value="logs"><MessageLogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// CHANNEL HELPERS
// ============================================================================

const CHANNELS = [
  { value: "sms", label: "SMS", icon: Smartphone, color: "text-blue-500" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-500" },
  { value: "email", label: "Email", icon: Mail, color: "text-orange-500" },
] as const;

function ChannelBadge({ channel }: { channel: string }) {
  const ch = CHANNELS.find(c => c.value === channel);
  if (!ch) return <Badge variant="outline">{channel}</Badge>;
  const Icon = ch.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${ch.color}`}>
      <Icon className="h-3 w-3" />
      {ch.label}
    </Badge>
  );
}

// Event type categories for the trigger rule builder
const EVENT_CATEGORIES = [
  {
    label: "Request Lifecycle",
    events: [
      { value: "request_created", label: "Request Created" },
      { value: "request_submitted", label: "Request Submitted" },
      { value: "request_approved", label: "Request Approved" },
      { value: "request_rejected", label: "Request Rejected" },
      { value: "request_cancelled", label: "Request Cancelled" },
      { value: "access_granted", label: "Access Granted" },
      { value: "request_expired", label: "Request Expired" },
    ],
  },
  {
    label: "Approval Workflow",
    events: [
      { value: "task_assigned", label: "Task Assigned" },
      { value: "task_approved", label: "Task Approved" },
      { value: "task_rejected", label: "Task Rejected" },
      { value: "clarification_requested", label: "Clarification Requested" },
      { value: "clarification_responded", label: "Clarification Responded" },
      { value: "send_back", label: "Send Back" },
    ],
  },
  {
    label: "Security Alerts",
    events: [
      { value: "security_breach", label: "Security Breach" },
      { value: "zone_capacity_exceeded", label: "Zone Capacity Exceeded" },
      { value: "asset_gate_exit", label: "Asset / MHV Gate Exit" },
      { value: "security_alert_custom", label: "Custom Security Alert" },
    ],
  },
  {
    label: "Visitor Operations",
    events: [
      { value: "visitor_checked_in", label: "Visitor Checked In" },
      { value: "visitor_checked_out", label: "Visitor Checked Out" },
      { value: "visitor_overstay", label: "Visitor Overstay" },
    ],
  },
];

const RECIPIENT_TYPES = [
  { value: "requester", label: "Requester", description: "Person who created the request" },
  { value: "approver", label: "Approver", description: "Assigned approver for current stage" },
  { value: "host", label: "Host", description: "Host user for the visit" },
  { value: "visitor", label: "Visitor(s)", description: "Visitors on the request" },
  { value: "group", label: "User Group", description: "All members of a specific group" },
  { value: "site_manager", label: "Site Manager", description: "Manager of the request's site" },
  { value: "specific_user", label: "Specific User", description: "A particular user by ID" },
  { value: "specific_number", label: "Specific Number/Email", description: "A hardcoded phone number or email" },
];

// ============================================================================
// PROVIDERS TAB
// ============================================================================

function ProvidersTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [showDialog, setShowDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [testChannel, setTestChannel] = useState<"sms" | "whatsapp" | "email">("sms");
  const [testTo, setTestTo] = useState("");
  const [testBody, setTestBody] = useState("Test message from Centre3 Integration Hub");
  const [testSubject, setTestSubject] = useState("Test Email from Centre3");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formProviderType, setFormProviderType] = useState("twilio");
  const [formSupportsSms, setFormSupportsSms] = useState(true);
  const [formSupportsWhatsapp, setFormSupportsWhatsapp] = useState(true);
  const [formSupportsEmail, setFormSupportsEmail] = useState(false);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formCredentials, setFormCredentials] = useState<Record<string, string>>({});

  const { data: integrationsList, isLoading } = trpc.messaging.listIntegrations.useQuery();
  const { data: providerTypes } = trpc.messaging.getProviderTypes.useQuery();

  const createMutation = trpc.messaging.createIntegration.useMutation({
    onSuccess: () => { toast.success("Provider created"); utils.messaging.listIntegrations.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.messaging.updateIntegration.useMutation({
    onSuccess: () => { toast.success("Provider updated"); utils.messaging.listIntegrations.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.messaging.deleteIntegration.useMutation({
    onSuccess: () => { toast.success("Provider deleted"); utils.messaging.listIntegrations.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const testMutation = trpc.messaging.testIntegration.useMutation({
    onSuccess: (data) => {
      if (data.healthy) toast.success(`Connection healthy (${data.latencyMs}ms)`);
      else toast.error(`Connection failed: ${data.error}`);
    },
    onError: (err) => toast.error(err.message),
  });
  const sendTestMutation = trpc.messaging.sendTestMessage.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success("Test message sent successfully!");
      else toast.error(`Failed: ${data.errorMessage}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingProvider(null);
    setFormName(""); setFormSlug(""); setFormProviderType("twilio");
    setFormSupportsSms(true); setFormSupportsWhatsapp(true); setFormSupportsEmail(false);
    setFormIsDefault(false); setFormCredentials({});
  };

  const openEdit = (provider: any) => {
    setEditingProvider(provider);
    setFormName(provider.name);
    setFormSlug(provider.slug);
    setFormProviderType(provider.providerType);
    setFormSupportsSms(provider.supportsSms);
    setFormSupportsWhatsapp(provider.supportsWhatsapp);
    setFormSupportsEmail(provider.supportsEmail);
    setFormIsDefault(provider.isDefault);
    setFormCredentials(provider.credentials ? JSON.parse(provider.credentials) : {});
    setShowDialog(true);
  };

  const handleSave = () => {
    const data = {
      name: formName,
      slug: formSlug,
      providerType: formProviderType,
      supportsSms: formSupportsSms,
      supportsWhatsapp: formSupportsWhatsapp,
      supportsEmail: formSupportsEmail,
      isDefault: formIsDefault,
      credentials: formCredentials,
    };
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedProviderTypeConfig = providerTypes?.find(p => p.slug === formProviderType);

  // Determine available test channels based on selected provider capabilities
  const getTestChannels = (provider: any) => {
    const channels: { value: "sms" | "whatsapp" | "email"; label: string }[] = [];
    if (provider?.supportsSms) channels.push({ value: "sms", label: "SMS" });
    if (provider?.supportsWhatsapp) channels.push({ value: "whatsapp", label: "WhatsApp" });
    if (provider?.supportsEmail) channels.push({ value: "email", label: "Email" });
    return channels;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("integrationHub.totalProviders", "Total Providers")}</p>
            <p className="text-2xl font-semibold">{integrationsList?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("integrationHub.active", "Active")}</p>
            <p className="text-2xl font-semibold text-green-600">{integrationsList?.filter(i => i.isEnabled).length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("integrationHub.healthy", "Healthy")}</p>
            <p className="text-2xl font-semibold text-blue-600">{integrationsList?.filter(i => i.lastTestStatus === "success").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("integrationHub.defaultProvider", "Default")}</p>
            <p className="text-2xl font-semibold">{integrationsList?.find(i => i.isDefault)?.name || "None"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.messagingProviders", "Messaging Providers")}</CardTitle>
            <CardDescription>{t("integrationHub.providerDesc", "Configure SMS, WhatsApp, and Email delivery providers")}</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("integrationHub.addProvider", "Add Provider")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !integrationsList?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No providers configured yet. Add your first messaging provider.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name", "Name")}</TableHead>
                  <TableHead>{t("integrationHub.providerType", "Type")}</TableHead>
                  <TableHead>{t("integrationHub.channels", "Channels")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead>{t("integrationHub.health", "Health")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrationsList.map(provider => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{provider.providerType}</Badge>
                      {provider.isDefault && <Badge variant="default" className="ml-1">Default</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {provider.supportsSms && <ChannelBadge channel="sms" />}
                        {provider.supportsWhatsapp && <ChannelBadge channel="whatsapp" />}
                        {provider.supportsEmail && <ChannelBadge channel="email" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {provider.isEnabled ? (
                        <Badge variant="default" className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.lastTestStatus === "success" ? (
                        <span className="text-green-600 text-sm">Healthy</span>
                      ) : provider.lastTestStatus === "failed" ? (
                        <span className="text-red-600 text-sm">Failed</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not tested</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => testMutation.mutate({ id: provider.id })} disabled={testMutation.isPending}>
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedProvider(provider);
                          const channels = getTestChannels(provider);
                          if (channels.length > 0) setTestChannel(channels[0].value);
                          setShowTestDialog(true);
                        }}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(provider)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                          if (confirm("Delete this provider?")) deleteMutation.mutate({ id: provider.id });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Provider Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add Provider"}</DialogTitle>
            <DialogDescription>Configure a messaging provider for SMS, WhatsApp, and/or Email delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Twilio Production" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="e.g., twilio-prod" disabled={!!editingProvider} />
              </div>
            </div>

            <div>
              <Label>Provider Type</Label>
              <Select value={formProviderType} onValueChange={setFormProviderType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providerTypes?.map(pt => (
                    <SelectItem key={pt.slug} value={pt.slug}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supported Channels */}
            <div>
              <Label className="mb-2 block">Supported Channels</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={formSupportsSms} onCheckedChange={setFormSupportsSms} />
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  <span>SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={formSupportsWhatsapp} onCheckedChange={setFormSupportsWhatsapp} />
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span>WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={formSupportsEmail} onCheckedChange={setFormSupportsEmail} />
                  <Mail className="h-4 w-4 text-orange-500" />
                  <span>Email</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
              <span>Set as default provider</span>
            </label>

            {/* Credentials */}
            {selectedProviderTypeConfig?.requiredCredentials && selectedProviderTypeConfig.requiredCredentials.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Credentials</h4>
                {selectedProviderTypeConfig.requiredCredentials.map((field: any) => (
                  <div key={field.key}>
                    <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                    <Input
                      type={field.type === "password" ? "password" : "text"}
                      value={formCredentials[field.key] || ""}
                      onChange={e => setFormCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                    />
                    {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || !formSlug || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingProvider ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test Message Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
            <DialogDescription>Send a test message via {selectedProvider?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel</Label>
              <Select value={testChannel} onValueChange={(v: "sms" | "whatsapp" | "email") => setTestChannel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {selectedProvider && getTestChannels(selectedProvider).map(ch => (
                    <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{testChannel === "email" ? "To Email" : "To Phone"}</Label>
              <Input
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                placeholder={testChannel === "email" ? "user@example.com" : "+966..."}
              />
            </div>
            {testChannel === "email" && (
              <div>
                <Label>Subject</Label>
                <Input value={testSubject} onChange={e => setTestSubject(e.target.value)} placeholder="Test Email from Centre3" />
              </div>
            )}
            <div>
              <Label>Message Body</Label>
              <Textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedProvider) return;
                sendTestMutation.mutate({
                  integrationId: selectedProvider.id,
                  channel: testChannel,
                  to: testTo,
                  body: testBody,
                  ...(testChannel === "email" ? { subject: testSubject } : {}),
                });
              }}
              disabled={!testTo || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB
// ============================================================================

function TemplatesTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [emailEditorMode, setEmailEditorMode] = useState<"visual" | "html">("visual");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formChannel, setFormChannel] = useState<"sms" | "whatsapp" | "email">("sms");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formHtmlBody, setFormHtmlBody] = useState("");
  const [formBodyAr, setFormBodyAr] = useState("");
  const [formVariables, setFormVariables] = useState<string[]>([]);

  const { data: templates, isLoading } = trpc.messaging.listTemplates.useQuery();
  const { data: availableVariables } = trpc.messaging.getTemplateVariables.useQuery();

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (channelFilter === "all") return templates;
    return templates.filter(t => t.channel === channelFilter);
  }, [templates, channelFilter]);

  const createMutation = trpc.messaging.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template created"); utils.messaging.listTemplates.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.messaging.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated"); utils.messaging.listTemplates.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.messaging.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template deleted"); utils.messaging.listTemplates.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setFormName(""); setFormSlug(""); setFormDescription(""); setFormChannel("sms");
    setFormSubject(""); setFormBody(""); setFormHtmlBody(""); setFormBodyAr(""); setFormVariables([]);
    setEmailEditorMode("visual");
  };

  const openEdit = (template: any) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSlug(template.slug);
    setFormDescription(template.description || "");
    setFormChannel(template.channel);
    setFormSubject(template.subject || "");
    setFormBody(template.body);
    setFormHtmlBody(template.htmlBody || "");
    setFormBodyAr(template.bodyAr || "");
    setFormVariables(template.variables ? JSON.parse(template.variables) : []);
    setShowDialog(true);
  };

  const handleSave = () => {
    const data: any = {
      name: formName,
      description: formDescription,
      channel: formChannel,
      body: formBody,
      bodyAr: formBodyAr || undefined,
      variables: formVariables,
      ...(formChannel === "email" ? { subject: formSubject, htmlBody: formHtmlBody || undefined } : {}),
    };
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate({ ...data, slug: formSlug });
    }
  };

  const insertVariable = (key: string, target: "body" | "html" | "subject") => {
    const tag = `{{${key}}}`;
    if (target === "body") setFormBody(prev => prev + tag);
    else if (target === "html") setFormHtmlBody(prev => prev + tag);
    else if (target === "subject") setFormSubject(prev => prev + tag);
    if (!formVariables.includes(key)) setFormVariables(prev => [...prev, key]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.messageTemplates", "Message Templates")}</CardTitle>
            <CardDescription>Create reusable message templates with dynamic variables for SMS, WhatsApp, and Email</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filteredTemplates.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No templates found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell><ChannelBadge channel={template.channel} /></TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {template.channel === "email" && template.subject ? (
                          <><strong>Subject:</strong> {template.subject}</>
                        ) : (
                          template.body?.substring(0, 80) + (template.body?.length > 80 ? "..." : "")
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(template)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                          if (confirm("Delete this template?")) deleteMutation.mutate({ id: template.id });
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Template Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>Create a message template with dynamic {"{{variable}}"} placeholders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Request Approved" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="e.g., request-approved-sms" disabled={!!editingTemplate} />
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={formChannel} onValueChange={(v: "sms" | "whatsapp" | "email") => setFormChannel(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description of when this template is used" />
            </div>

            {/* Email-specific: Subject */}
            {formChannel === "email" && (
              <div>
                <Label>Subject Line</Label>
                <div className="flex gap-2">
                  <Input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="e.g., Your request {{requestId}} has been approved" className="flex-1" />
                  <Select onValueChange={(v) => insertVariable(v, "subject")}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Insert var..." /></SelectTrigger>
                    <SelectContent>
                      {availableVariables?.map((v: any) => (
                        <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Variables insert bar */}
            <div>
              <Label className="mb-2 block">Insert Variable</Label>
              <div className="flex flex-wrap gap-1">
                {availableVariables?.map((v: any) => (
                  <Button key={v.key} variant="outline" size="sm" className="text-xs h-7"
                    onClick={() => insertVariable(v.key, formChannel === "email" && emailEditorMode === "html" ? "html" : "body")}
                    title={v.description}
                  >
                    {`{{${v.key}}}`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Body — plain text for SMS/WhatsApp, dual editor for Email */}
            {formChannel === "email" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Email Body</Label>
                  <div className="flex items-center gap-1 border rounded-md p-0.5">
                    <Button variant={emailEditorMode === "visual" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
                      onClick={() => setEmailEditorMode("visual")}>
                      <Eye className="h-3 w-3" /> Plain Text
                    </Button>
                    <Button variant={emailEditorMode === "html" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
                      onClick={() => setEmailEditorMode("html")}>
                      <Code className="h-3 w-3" /> HTML
                    </Button>
                  </div>
                </div>
                {emailEditorMode === "visual" ? (
                  <Textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={6}
                    placeholder="Plain text version of the email (used as fallback)" />
                ) : (
                  <div className="space-y-2">
                    <Textarea value={formHtmlBody} onChange={e => setFormHtmlBody(e.target.value)} rows={10}
                      className="font-mono text-sm"
                      placeholder="<html><body><h1>Hello {{requesterName}}</h1><p>Your request {{requestId}} has been approved.</p></body></html>" />
                    {formHtmlBody && (
                      <div className="border rounded-lg p-4 bg-white">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formHtmlBody.replace(/\{\{(\w+)\}\}/g, '<span class="bg-yellow-100 px-1 rounded text-yellow-800 font-mono text-xs">{{$1}}</span>') }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label>Message Body</Label>
                <Textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={5}
                  placeholder={formChannel === "whatsapp" ? "Supports *bold*, _italic_, ~strikethrough~ formatting" : "Plain text message body"} />
              </div>
            )}

            {/* Arabic version */}
            <div>
              <Label>Arabic Version (optional)</Label>
              <Textarea value={formBodyAr} onChange={e => setFormBodyAr(e.target.value)} rows={3} dir="rtl" placeholder="النسخة العربية من الرسالة" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || !formBody || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// TRIGGER RULES TAB
// ============================================================================

function TriggerRulesTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEventType, setFormEventType] = useState("");
  const [formTemplateId, setFormTemplateId] = useState<number | null>(null);
  const [formIntegrationId, setFormIntegrationId] = useState<number | null>(null);
  const [formRecipientType, setFormRecipientType] = useState("requester");
  const [formRecipientConfig, setFormRecipientConfig] = useState<Record<string, any>>({});
  const [formSiteId, setFormSiteId] = useState<number | null>(null);
  const [formRequestTypeSlug, setFormRequestTypeSlug] = useState("");

  const { data: rules, isLoading } = trpc.messaging.listTriggerRules.useQuery();
  const { data: templates } = trpc.messaging.listTemplates.useQuery();
  const { data: integrationsList } = trpc.messaging.listIntegrations.useQuery();
  const { data: sitesData } = trpc.sites.getAll.useQuery();
  const { data: groupsData } = trpc.groups.list.useQuery();

  const filteredRules = useMemo(() => {
    if (!rules) return [];
    if (eventFilter === "all") return rules;
    // Filter by category
    const category = EVENT_CATEGORIES.find(c => c.label === eventFilter);
    if (category) {
      const eventValues = category.events.map(e => e.value);
      return rules.filter(r => eventValues.includes(r.eventType));
    }
    return rules.filter(r => r.eventType === eventFilter);
  }, [rules, eventFilter]);

  const createMutation = trpc.messaging.createTriggerRule.useMutation({
    onSuccess: () => { toast.success("Trigger rule created"); utils.messaging.listTriggerRules.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.messaging.updateTriggerRule.useMutation({
    onSuccess: () => { toast.success("Trigger rule updated"); utils.messaging.listTriggerRules.invalidate(); setShowDialog(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const toggleMutation = trpc.messaging.toggleTriggerRule.useMutation({
    onSuccess: () => { utils.messaging.listTriggerRules.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.messaging.deleteTriggerRule.useMutation({
    onSuccess: () => { toast.success("Trigger rule deleted"); utils.messaging.listTriggerRules.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingRule(null);
    setFormName(""); setFormDescription(""); setFormEventType(""); setFormTemplateId(null);
    setFormIntegrationId(null); setFormRecipientType("requester"); setFormRecipientConfig({});
    setFormSiteId(null); setFormRequestTypeSlug("");
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormEventType(rule.eventType);
    setFormTemplateId(rule.templateId);
    setFormIntegrationId(rule.integrationId);
    setFormRecipientType(rule.recipientType);
    setFormRecipientConfig(rule.recipientConfig ? JSON.parse(rule.recipientConfig) : {});
    setFormSiteId(rule.siteId);
    setFormRequestTypeSlug(rule.requestTypeSlug || "");
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formEventType || !formTemplateId) {
      toast.error("Event type and template are required");
      return;
    }
    const data: any = {
      name: formName,
      description: formDescription || undefined,
      eventType: formEventType,
      templateId: formTemplateId,
      integrationId: formIntegrationId || undefined,
      recipientType: formRecipientType,
      recipientConfig: Object.keys(formRecipientConfig).length > 0 ? formRecipientConfig : undefined,
      siteId: formSiteId || undefined,
      requestTypeSlug: formRequestTypeSlug || undefined,
    };
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Get the event label
  const getEventLabel = (eventType: string) => {
    for (const cat of EVENT_CATEGORIES) {
      const ev = cat.events.find(e => e.value === eventType);
      if (ev) return ev.label;
    }
    return eventType;
  };

  // Get the event category
  const getEventCategory = (eventType: string) => {
    for (const cat of EVENT_CATEGORIES) {
      if (cat.events.some(e => e.value === eventType)) return cat.label;
    }
    return "Other";
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Request Lifecycle": return "bg-blue-100 text-blue-800";
      case "Approval Workflow": return "bg-purple-100 text-purple-800";
      case "Security Alerts": return "bg-red-100 text-red-800";
      case "Visitor Operations": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.triggerRules", "Trigger Rules")}</CardTitle>
            <CardDescription>Define when messages are sent, to whom, and which template to use</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {EVENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.label} value={cat.label}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !filteredRules.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No trigger rules found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map(rule => {
                  const template = templates?.find(t => t.id === rule.templateId);
                  const category = getEventCategory(rule.eventType);
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(category)}`}>{category}</Badge>
                          <p className="text-xs">{getEventLabel(rule.eventType)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template ? (
                          <div className="flex items-center gap-1">
                            <ChannelBadge channel={template.channel} />
                            <span className="text-sm">{template.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {rule.recipientType === "group" ? (
                            <><Users className="h-3 w-3 mr-1" />{RECIPIENT_TYPES.find(r => r.value === "group")?.label}</>
                          ) : (
                            RECIPIENT_TYPES.find(r => r.value === rule.recipientType)?.label || rule.recipientType
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {rule.siteId ? <span>Site: {sitesData?.find((s: any) => s.id === rule.siteId)?.name || rule.siteId}</span> : <span>All sites</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.isEnabled} onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, isEnabled: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                            if (confirm("Delete this rule?")) deleteMutation.mutate({ id: rule.id });
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Trigger Rule" : "New Trigger Rule"}</DialogTitle>
            <DialogDescription>Define when a message should be sent and to whom</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Notify requester on approval" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Optional description" />
              </div>
            </div>

            {/* Event Type — grouped by category */}
            <div>
              <Label>Event Type</Label>
              <Select value={formEventType} onValueChange={setFormEventType}>
                <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map(cat => (
                    <div key={cat.label}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat.label}</div>
                      {cat.events.map(ev => (
                        <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template */}
            <div>
              <Label>Message Template</Label>
              <Select value={formTemplateId?.toString() || ""} onValueChange={v => setFormTemplateId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                  {templates?.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={t.channel} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider (optional override) */}
            <div>
              <Label>Provider (optional — uses default if not set)</Label>
              <Select value={formIntegrationId?.toString() || "default"} onValueChange={v => setFormIntegrationId(v === "default" ? null : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use Default Provider</SelectItem>
                  {integrationsList?.map(i => (
                    <SelectItem key={i.id} value={i.id.toString()}>{i.name} ({i.providerType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Type */}
            <div>
              <Label>Recipient</Label>
              <Select value={formRecipientType} onValueChange={setFormRecipientType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECIPIENT_TYPES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group selector — shown when recipientType is "group" */}
            {formRecipientType === "group" && (
              <div>
                <Label>Select Group</Label>
                <Select
                  value={formRecipientConfig.groupId?.toString() || ""}
                  onValueChange={v => setFormRecipientConfig(prev => ({ ...prev, groupId: Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select a user group..." /></SelectTrigger>
                  <SelectContent>
                    {groupsData?.map((g: any) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {g.name}
                          {g.groupType && <Badge variant="outline" className="text-xs ml-1">{g.groupType}</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Message will be sent to all active members of this group</p>
              </div>
            )}

            {/* Specific user config */}
            {formRecipientType === "specific_user" && (
              <div>
                <Label>User ID</Label>
                <Input type="number" value={formRecipientConfig.userId || ""} onChange={e => setFormRecipientConfig(prev => ({ ...prev, userId: Number(e.target.value) }))} placeholder="Enter user ID" />
              </div>
            )}

            {/* Specific number config */}
            {formRecipientType === "specific_number" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number / Email</Label>
                  <Input value={formRecipientConfig.phoneNumber || ""} onChange={e => setFormRecipientConfig(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="+966..." />
                </div>
                <div>
                  <Label>Name (optional)</Label>
                  <Input value={formRecipientConfig.name || ""} onChange={e => setFormRecipientConfig(prev => ({ ...prev, name: e.target.value }))} placeholder="Recipient name" />
                </div>
              </div>
            )}

            {/* Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site Scope (optional)</Label>
                <Select value={formSiteId?.toString() || "all"} onValueChange={v => setFormSiteId(v === "all" ? null : Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sitesData?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Request Type (optional)</Label>
                <Input value={formRequestTypeSlug} onChange={e => setFormRequestTypeSlug(e.target.value)} placeholder="e.g., admin_visit" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || !formEventType || !formTemplateId || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// MESSAGE LOGS TAB
// ============================================================================

function MessageLogsTab() {
  const { t } = useTranslation();
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const queryInput = useMemo(() => ({
    limit: 25,
    offset: (page - 1) * 25,
    ...(channelFilter ? { channel: channelFilter as "sms" | "whatsapp" | "email" } : {}),
    ...(statusFilter ? { status: statusFilter as "pending" | "sent" | "delivered" | "failed" } : {}),
  }), [page, channelFilter, statusFilter]);

  const { data: logsData, isLoading } = trpc.messaging.listLogs.useQuery(queryInput);
  const { data: stats } = trpc.messaging.getLogStats.useQuery();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Messages</p>
            <p className="text-2xl font-semibold">{stats?.totalMessages || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Sent</p>
            <p className="text-2xl font-semibold text-green-600">{stats?.sentMessages || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-semibold text-blue-600">{stats?.todayMessages || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{stats?.failedMessages || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{(stats?.totalMessages || 0) - (stats?.sentMessages || 0) - (stats?.failedMessages || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.messageLogs", "Message Logs")}</CardTitle>
            <CardDescription>Track all message delivery attempts across all channels</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={channelFilter || "all"} onValueChange={v => { setChannelFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "all"} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !logsData?.logs?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No message logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.eventType}</Badge>
                      </TableCell>
                      <TableCell><ChannelBadge channel={log.channel} /></TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.recipientName && <p className="font-medium">{log.recipientName}</p>}
                          <p className="text-xs text-muted-foreground">{log.recipientPhone || log.recipientEmail || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]">{log.messageBody}</p>
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" || log.status === "delivered" ? (
                          <Badge variant="default" className="bg-green-600 text-xs">{log.status}</Badge>
                        ) : log.status === "failed" ? (
                          <Badge variant="destructive" className="text-xs" title={log.errorMessage}>{log.status}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{log.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, logsData.total)} of {logsData.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page * 25 >= logsData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
