import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Radio,
  Plug,
  Plus,
  Edit2,
  Trash2,
  TestTube2,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Zap,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IntegrationHub() {
  const { t } = useTranslation();
  const [, params] = useRoute("/integration-hub/:tab");
  const [, setLocation] = useLocation();
  const activeTab = params?.tab || "providers";

  const setActiveTab = (tab: string) => {
    setLocation(`/integration-hub/${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C]">
            {t("integrationHub.title", "Integration Hub")}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {t("integrationHub.subtitle", "Manage messaging providers, templates, and automation rules")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="providers" className="gap-2">
            <Plug className="h-4 w-4" />
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
            <Activity className="h-4 w-4" />
            {t("integrationHub.messageLogs", "Message Logs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-6">
          <ProvidersTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="rules" className="mt-6">
          <TriggerRulesTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-6">
          <MessageLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// PROVIDERS TAB
// ============================================================================

function ProvidersTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [testChannel, setTestChannel] = useState<"sms" | "whatsapp">("sms");
  const [testPhone, setTestPhone] = useState("");
  const [testBody, setTestBody] = useState("Test message from Centre3 Integration Hub");

  // Form state for new/edit provider
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formProviderType, setFormProviderType] = useState("twilio");
  const [formDescription, setFormDescription] = useState("");
  const [formSupportsSms, setFormSupportsSms] = useState(true);
  const [formSupportsWhatsapp, setFormSupportsWhatsapp] = useState(true);
  const [formCredentials, setFormCredentials] = useState<Record<string, string>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  const { data: integrationsList, isLoading } = trpc.messaging.listIntegrations.useQuery();
  const { data: providerTypes } = trpc.messaging.getProviderTypes.useQuery();
  
  const createMutation = trpc.messaging.createIntegration.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.providerCreated", "Provider created successfully"));
      utils.messaging.listIntegrations.invalidate();
      setShowAddDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.messaging.updateIntegration.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.providerUpdated", "Provider updated successfully"));
      utils.messaging.listIntegrations.invalidate();
      setShowConfigDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.messaging.deleteIntegration.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.providerDeleted", "Provider deleted"));
      utils.messaging.listIntegrations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.messaging.testIntegration.useMutation({
    onSuccess: (result) => {
      if (result.healthy) {
        toast.success(t("integrationHub.connectionSuccess", "Connection successful") + ` (${result.latencyMs}ms)`);
      } else {
        toast.error(t("integrationHub.connectionFailed", "Connection failed") + `: ${result.error}`);
      }
      utils.messaging.listIntegrations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendTestMutation = trpc.messaging.sendTestMessage.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("integrationHub.testMessageSent", "Test message sent successfully"));
        setShowTestDialog(false);
      } else {
        toast.error(`Failed: ${result.errorMessage}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormProviderType("twilio");
    setFormDescription("");
    setFormSupportsSms(true);
    setFormSupportsWhatsapp(true);
    setFormCredentials({});
    setShowCredentials({});
  };

  const openConfigDialog = (integration: any) => {
    setSelectedProvider(integration);
    setFormName(integration.name);
    setFormDescription(integration.description || "");
    setFormSupportsSms(integration.supportsSms);
    setFormSupportsWhatsapp(integration.supportsWhatsapp);
    setFormCredentials({});
    setShowConfigDialog(true);
  };

  const selectedProviderCredFields = useMemo(() => {
    const pt = providerTypes?.find(p => p.slug === (selectedProvider?.providerType || formProviderType));
    return pt?.requiredCredentials || [];
  }, [providerTypes, selectedProvider, formProviderType]);

  const handleCreate = () => {
    createMutation.mutate({
      name: formName,
      slug: formSlug,
      providerType: formProviderType,
      description: formDescription,
      supportsSms: formSupportsSms,
      supportsWhatsapp: formSupportsWhatsapp,
      credentials: formCredentials,
    });
  };

  const handleUpdate = () => {
    if (!selectedProvider) return;
    const updateData: any = {
      id: selectedProvider.id,
      name: formName,
      description: formDescription,
      supportsSms: formSupportsSms,
      supportsWhatsapp: formSupportsWhatsapp,
    };
    if (Object.keys(formCredentials).length > 0) {
      updateData.credentials = formCredentials;
    }
    updateMutation.mutate(updateData);
  };

  const handleToggleEnabled = (integration: any) => {
    updateMutation.mutate({
      id: integration.id,
      isEnabled: !integration.isEnabled,
    });
  };

  const handleSetDefault = (integration: any) => {
    updateMutation.mutate({
      id: integration.id,
      isDefault: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{integrationsList?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.totalProviders", "Total Providers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Power className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{integrationsList?.filter(i => i.isEnabled).length || 0}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.activeProviders", "Active Providers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{integrationsList?.filter(i => i.lastTestStatus === "success").length || 0}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.verifiedProviders", "Verified")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.messagingProviders", "Messaging Providers")}</CardTitle>
            <CardDescription>{t("integrationHub.providerDesc", "Configure SMS and WhatsApp providers")}</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("integrationHub.addProvider", "Add Provider")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !integrationsList?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plug className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("integrationHub.noProviders", "No providers configured yet")}</p>
              <p className="text-sm mt-1">{t("integrationHub.addProviderHint", "Add a Twilio provider to start sending SMS and WhatsApp messages")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrationsList.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${integration.isEnabled ? "bg-primary/10" : "bg-muted"}`}>
                      <MessageSquare className={`h-6 w-6 ${integration.isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{integration.name}</h4>
                        {integration.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {integration.isEnabled ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{integration.description || integration.providerType}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {integration.supportsSms && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Smartphone className="h-3 w-3" /> SMS
                          </span>
                        )}
                        {integration.supportsWhatsapp && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" /> WhatsApp
                          </span>
                        )}
                        {integration.lastTestStatus && (
                          <span className={`flex items-center gap-1 text-xs ${integration.lastTestStatus === "success" ? "text-green-600" : "text-red-500"}`}>
                            {integration.lastTestStatus === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {integration.lastTestStatus === "success" ? "Verified" : "Failed"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleEnabled(integration)} className="gap-1">
                      {integration.isEnabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      {integration.isEnabled ? t("common.disable", "Disable") : t("common.enable", "Enable")}
                    </Button>
                    {!integration.isDefault && integration.isEnabled && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(integration)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => testMutation.mutate({ id: integration.id })} disabled={testMutation.isPending}>
                      <TestTube2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedProvider(integration); setShowTestDialog(true); }}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openConfigDialog(integration)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { if (confirm("Delete this provider?")) deleteMutation.mutate({ id: integration.id }); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("integrationHub.addProvider", "Add Provider")}</DialogTitle>
            <DialogDescription>{t("integrationHub.addProviderDesc", "Configure a new messaging provider")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("common.name", "Name")}</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Twilio Production" />
              </div>
              <div>
                <Label>{t("integrationHub.slug", "Slug")}</Label>
                <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="twilio" />
              </div>
            </div>
            <div>
              <Label>{t("integrationHub.providerType", "Provider Type")}</Label>
              <Select value={formProviderType} onValueChange={setFormProviderType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providerTypes?.map(pt => (
                    <SelectItem key={pt.slug} value={pt.slug}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("common.description", "Description")}</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Production Twilio account" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formSupportsSms} onCheckedChange={setFormSupportsSms} />
                <Label>SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formSupportsWhatsapp} onCheckedChange={setFormSupportsWhatsapp} />
                <Label>WhatsApp</Label>
              </div>
            </div>
            <Separator />
            <h4 className="font-medium text-sm">{t("integrationHub.credentials", "Credentials")}</h4>
            {selectedProviderCredFields.map(field => (
              <div key={field.key}>
                <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                <div className="relative">
                  <Input
                    type={showCredentials[field.key] ? "text" : (field.type === "password" ? "password" : "text")}
                    value={formCredentials[field.key] || ""}
                    onChange={e => setFormCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCredentials(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    >
                      {showCredentials[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !formName || !formSlug}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("common.create", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("integrationHub.editProvider", "Edit Provider")}</DialogTitle>
            <DialogDescription>{selectedProvider?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("common.name", "Name")}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>{t("common.description", "Description")}</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formSupportsSms} onCheckedChange={setFormSupportsSms} />
                <Label>SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formSupportsWhatsapp} onCheckedChange={setFormSupportsWhatsapp} />
                <Label>WhatsApp</Label>
              </div>
            </div>
            <Separator />
            <h4 className="font-medium text-sm">{t("integrationHub.updateCredentials", "Update Credentials")} <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></h4>
            {selectedProviderCredFields.map(field => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Input
                  type={showCredentials[field.key] ? "text" : (field.type === "password" ? "password" : "text")}
                  value={formCredentials[field.key] || ""}
                  onChange={e => setFormCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={`Current: ****`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("integrationHub.sendTestMessage", "Send Test Message")}</DialogTitle>
            <DialogDescription>{selectedProvider?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("integrationHub.channel", "Channel")}</Label>
              <Select value={testChannel} onValueChange={(v: "sms" | "whatsapp") => setTestChannel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("integrationHub.recipientPhone", "Recipient Phone")}</Label>
              <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+966501234567" />
              <p className="text-xs text-muted-foreground mt-1">E.164 format with country code</p>
            </div>
            <div>
              <Label>{t("integrationHub.messageBody", "Message")}</Label>
              <Textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button
              onClick={() => selectedProvider && sendTestMutation.mutate({ integrationId: selectedProvider.id, channel: testChannel, to: testPhone, body: testBody })}
              disabled={sendTestMutation.isPending || !testPhone}
            >
              {sendTestMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              {t("integrationHub.send", "Send")}
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

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formChannel, setFormChannel] = useState<"sms" | "whatsapp" | "email">("sms");
  const [formBody, setFormBody] = useState("");
  const [formBodyAr, setFormBodyAr] = useState("");
  const [formVariables, setFormVariables] = useState<string[]>([]);

  const { data: templates, isLoading } = trpc.messaging.listTemplates.useQuery();
  const { data: availableVariables } = trpc.messaging.getTemplateVariables.useQuery();

  const createMutation = trpc.messaging.createTemplate.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.templateCreated", "Template created"));
      utils.messaging.listTemplates.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.messaging.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.templateUpdated", "Template updated"));
      utils.messaging.listTemplates.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.messaging.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.templateDeleted", "Template deleted"));
      utils.messaging.listTemplates.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormChannel("sms");
    setFormBody("");
    setFormBodyAr("");
    setFormVariables([]);
  };

  const openEdit = (template: any) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSlug(template.slug);
    setFormDescription(template.description || "");
    setFormChannel(template.channel);
    setFormBody(template.body);
    setFormBodyAr(template.bodyAr || "");
    setFormVariables(template.variables ? JSON.parse(template.variables) : []);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        name: formName,
        description: formDescription,
        channel: formChannel,
        body: formBody,
        bodyAr: formBodyAr || undefined,
        variables: formVariables,
      });
    } else {
      createMutation.mutate({
        name: formName,
        slug: formSlug,
        description: formDescription,
        channel: formChannel,
        body: formBody,
        bodyAr: formBodyAr || undefined,
        variables: formVariables,
      });
    }
  };

  const insertVariable = (key: string) => {
    setFormBody(prev => prev + `{{${key}}}`);
    if (!formVariables.includes(key)) {
      setFormVariables(prev => [...prev, key]);
    }
  };

  const channelIcon = (ch: string) => {
    switch (ch) {
      case "sms": return <Smartphone className="h-4 w-4" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.messageTemplates", "Message Templates")}</CardTitle>
            <CardDescription>{t("integrationHub.templateDesc", "Create reusable message templates with dynamic variables")}</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("integrationHub.addTemplate", "Add Template")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !templates?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("integrationHub.noTemplates", "No templates created yet")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name", "Name")}</TableHead>
                  <TableHead>{t("integrationHub.channel", "Channel")}</TableHead>
                  <TableHead>{t("integrationHub.preview", "Preview")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {channelIcon(template.channel)}
                        {template.channel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {template.body.substring(0, 80)}{template.body.length > 80 ? "..." : ""}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate({ id: template.id }); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

      {/* Template Editor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t("integrationHub.editTemplate", "Edit Template") : t("integrationHub.addTemplate", "Add Template")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("common.name", "Name")}</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Task Assignment Notification" />
              </div>
              {!editingTemplate && (
                <div>
                  <Label>{t("integrationHub.slug", "Slug")}</Label>
                  <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="task_assigned_sms" />
                </div>
              )}
              {editingTemplate && (
                <div>
                  <Label>{t("integrationHub.channel", "Channel")}</Label>
                  <Select value={formChannel} onValueChange={(v: "sms" | "whatsapp" | "email") => setFormChannel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {!editingTemplate && (
              <div>
                <Label>{t("integrationHub.channel", "Channel")}</Label>
                <Select value={formChannel} onValueChange={(v: "sms" | "whatsapp" | "email") => setFormChannel(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{t("common.description", "Description")}</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Sent when an approval task is assigned" />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("integrationHub.messageBody", "Message Body (English)")}</Label>
                <span className="text-xs text-muted-foreground">{formBody.length} chars</span>
              </div>
              <Textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={5} placeholder="Hello {{requesterName}}, your request {{requestRefNo}} has been..." />
            </div>
            <div>
              <Label className="mb-2 block">{t("integrationHub.insertVariable", "Insert Variable")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableVariables?.map(v => (
                  <Button key={v.key} variant="outline" size="sm" className="text-xs h-7" onClick={() => insertVariable(v.key)} title={v.description}>
                    {`{{${v.key}}}`}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("integrationHub.messageBodyAr", "Message Body (Arabic)")} <span className="text-muted-foreground font-normal">— optional</span></Label>
              </div>
              <Textarea value={formBodyAr} onChange={e => setFormBodyAr(e.target.value)} rows={3} dir="rtl" placeholder="مرحبا {{requesterName}}..." />
            </div>
            {/* Preview */}
            {formBody && (
              <div>
                <Label>{t("integrationHub.preview", "Preview")}</Label>
                <div className="mt-1 p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                  {formBody.replace(/\{\{(\w+)\}\}/g, (_, key) => `[${key}]`)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !formName || !formBody}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTemplate ? t("common.save", "Save") : t("common.create", "Create")}
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

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEventType, setFormEventType] = useState("");
  const [formTemplateId, setFormTemplateId] = useState<number | null>(null);
  const [formRecipientType, setFormRecipientType] = useState<string>("requester");
  const [formRecipientConfig, setFormRecipientConfig] = useState<Record<string, any>>({});
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  const { data: rules, isLoading } = trpc.messaging.listTriggerRules.useQuery();
  const { data: eventTypes } = trpc.messaging.getEventTypes.useQuery();
  const { data: templates } = trpc.messaging.listTemplates.useQuery();

  const createMutation = trpc.messaging.createTriggerRule.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.ruleCreated", "Trigger rule created"));
      utils.messaging.listTriggerRules.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.messaging.updateTriggerRule.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.ruleUpdated", "Trigger rule updated"));
      utils.messaging.listTriggerRules.invalidate();
      setShowDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.messaging.toggleTriggerRule.useMutation({
    onSuccess: () => {
      utils.messaging.listTriggerRules.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.messaging.deleteTriggerRule.useMutation({
    onSuccess: () => {
      toast.success(t("integrationHub.ruleDeleted", "Rule deleted"));
      utils.messaging.listTriggerRules.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingRule(null);
    setFormName("");
    setFormDescription("");
    setFormEventType("");
    setFormTemplateId(null);
    setFormRecipientType("requester");
    setFormRecipientConfig({});
    setFormIsEnabled(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormEventType(rule.eventType);
    setFormTemplateId(rule.templateId);
    setFormRecipientType(rule.recipientType);
    setFormRecipientConfig(rule.recipientConfig ? JSON.parse(rule.recipientConfig) : {});
    setFormIsEnabled(rule.isEnabled);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id,
        name: formName,
        description: formDescription,
        eventType: formEventType,
        templateId: formTemplateId!,
        recipientType: formRecipientType as any,
        recipientConfig: Object.keys(formRecipientConfig).length > 0 ? formRecipientConfig : undefined,
        isEnabled: formIsEnabled,
      });
    } else {
      createMutation.mutate({
        name: formName,
        description: formDescription,
        eventType: formEventType,
        templateId: formTemplateId!,
        recipientType: formRecipientType as any,
        recipientConfig: Object.keys(formRecipientConfig).length > 0 ? formRecipientConfig : undefined,
        isEnabled: formIsEnabled,
      });
    }
  };

  const recipientTypes = [
    { value: "requester", label: "Requester (who created the request)" },
    { value: "approver", label: "Approver (assigned to the task)" },
    { value: "visitor", label: "Visitor(s) on the request" },
    { value: "host", label: "Host user" },
    { value: "specific_user", label: "Specific User" },
    { value: "specific_number", label: "Specific Phone Number" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("integrationHub.triggerRules", "Trigger Rules")}</CardTitle>
            <CardDescription>{t("integrationHub.triggerRulesDesc", "Define when messages are sent automatically based on system events")}</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("integrationHub.addRule", "Add Rule")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !rules?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("integrationHub.noRules", "No trigger rules configured")}</p>
              <p className="text-sm mt-1">{t("integrationHub.noRulesHint", "Create rules to automatically send messages when events occur")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name", "Name")}</TableHead>
                  <TableHead>{t("integrationHub.event", "Event")}</TableHead>
                  <TableHead>{t("integrationHub.template", "Template")}</TableHead>
                  <TableHead>{t("integrationHub.recipient", "Recipient")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        {rule.eventType.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{rule.templateName}</TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{rule.recipientType.replace(/_/g, " ")}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isEnabled}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isEnabled: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this rule?")) deleteMutation.mutate({ id: rule.id }); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

      {/* Rule Editor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? t("integrationHub.editRule", "Edit Rule") : t("integrationHub.addRule", "Add Rule")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("common.name", "Name")}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Notify approver on task assignment" />
            </div>
            <div>
              <Label>{t("common.description", "Description")}</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Sends SMS when a new approval task is assigned" />
            </div>
            <div>
              <Label>{t("integrationHub.eventType", "Event Type")}</Label>
              <Select value={formEventType} onValueChange={setFormEventType}>
                <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                <SelectContent>
                  {eventTypes?.map(et => (
                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("integrationHub.template", "Message Template")}</Label>
              <Select value={formTemplateId ? String(formTemplateId) : ""} onValueChange={v => setFormTemplateId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                  {templates?.map(tmpl => (
                    <SelectItem key={tmpl.id} value={String(tmpl.id)}>{tmpl.name} ({tmpl.channel})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("integrationHub.recipientType", "Recipient")}</Label>
              <Select value={formRecipientType} onValueChange={setFormRecipientType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recipientTypes.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formRecipientType === "specific_number" && (
              <div>
                <Label>{t("integrationHub.phoneNumber", "Phone Number")}</Label>
                <Input
                  value={formRecipientConfig.phoneNumber || ""}
                  onChange={e => setFormRecipientConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+966501234567"
                />
              </div>
            )}
            {formRecipientType === "specific_user" && (
              <div>
                <Label>{t("integrationHub.userId", "User ID")}</Label>
                <Input
                  type="number"
                  value={formRecipientConfig.userId || ""}
                  onChange={e => setFormRecipientConfig(prev => ({ ...prev, userId: Number(e.target.value) }))}
                  placeholder="Enter user ID"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={formIsEnabled} onCheckedChange={setFormIsEnabled} />
              <Label>{t("integrationHub.enabledOnCreate", "Enabled")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !formName || !formEventType || !formTemplateId}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRule ? t("common.save", "Save") : t("common.create", "Create")}
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
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const queryInput = useMemo(() => ({
    page,
    pageSize: 25,
    ...(channelFilter ? { channel: channelFilter as "sms" | "whatsapp" | "email" } : {}),
    ...(statusFilter ? { status: statusFilter as "pending" | "sent" | "delivered" | "failed" | "rejected" } : {}),
    ...(search ? { search } : {}),
  }), [page, channelFilter, statusFilter, search]);

  const { data: logsData, isLoading } = trpc.messaging.listLogs.useQuery(queryInput);
  const { data: stats } = trpc.messaging.getLogStats.useQuery();

  const totalPages = logsData ? Math.ceil(logsData.total / logsData.pageSize) : 0;

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-green-500/10 text-green-700 border-green-200">Sent</Badge>;
      case "delivered": return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Delivered</Badge>;
      case "failed": return <Badge className="bg-red-500/10 text-red-700 border-red-200">Failed</Badge>;
      case "rejected": return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">Rejected</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-semibold">{stats?.totalMessages || 0}</p>
              <p className="text-sm text-muted-foreground">{t("integrationHub.totalMessages", "Total Messages")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">{stats?.sentMessages || 0}</p>
              <p className="text-sm text-muted-foreground">{t("integrationHub.sentMessages", "Sent")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-500">{stats?.failedMessages || 0}</p>
              <p className="text-sm text-muted-foreground">{t("integrationHub.failedMessages", "Failed")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-primary">{stats?.todayMessages || 0}</p>
              <p className="text-sm text-muted-foreground">{t("integrationHub.todayMessages", "Today")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("integrationHub.messageLogs", "Message Logs")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("integrationHub.searchLogs", "Search by phone, name, or event...")}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={channelFilter} onValueChange={v => { setChannelFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !logsData?.logs.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("integrationHub.noLogs", "No messages logged yet")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("integrationHub.timestamp", "Timestamp")}</TableHead>
                    <TableHead>{t("integrationHub.channel", "Channel")}</TableHead>
                    <TableHead>{t("integrationHub.recipient", "Recipient")}</TableHead>
                    <TableHead>{t("integrationHub.event", "Event")}</TableHead>
                    <TableHead>{t("common.status", "Status")}</TableHead>
                    <TableHead>{t("integrationHub.message", "Message")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.channel.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{log.recipientName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{log.recipientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.eventType.replace(/_/g, " ")}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate text-muted-foreground">{log.messageBody?.substring(0, 60)}</p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3" />
                            {log.errorMessage.substring(0, 60)}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("integrationHub.showingLogs", "Showing")} {((page - 1) * 25) + 1}–{Math.min(page * 25, logsData.total)} {t("integrationHub.of", "of")} {logsData.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
