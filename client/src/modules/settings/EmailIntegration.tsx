import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Mail,
  Plus,
  Settings2,
  Trash2,
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Zap,
  ScrollText,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// CONSTANTS
// ============================================================================

const EMAIL_PROVIDER_TYPES = [
  { value: "smtp", label: "SMTP", description: "Direct SMTP connection (Gmail, Outlook, custom)" },
  { value: "sendgrid", label: "SendGrid", description: "SendGrid API integration" },
];

const EVENT_TYPES = [
  { value: "request_created", label: "Request Created" },
  { value: "request_submitted", label: "Request Submitted" },
  { value: "request_approved", label: "Request Approved" },
  { value: "request_rejected", label: "Request Rejected" },
  { value: "request_cancelled", label: "Request Cancelled" },
  { value: "access_granted", label: "Access Granted" },
  { value: "task_assigned", label: "Task Assigned" },
  { value: "task_approved", label: "Task Approved" },
  { value: "task_rejected", label: "Task Rejected" },
  { value: "clarification_requested", label: "Clarification Requested" },
  { value: "clarification_responded", label: "Clarification Responded" },
  { value: "send_back", label: "Send Back" },
  { value: "request_expired", label: "Request Expired" },
];

const RECIPIENT_TYPES = [
  { value: "requester", label: "Requester" },
  { value: "approver", label: "Current Approver" },
  { value: "visitor", label: "Visitor(s)" },
  { value: "host", label: "Host" },
  { value: "site_manager", label: "Site Manager" },
  { value: "specific_user", label: "Specific User" },
  { value: "specific_email", label: "Specific Email Address" },
];

const TEMPLATE_VARIABLES = [
  "requestId", "requestRefNo", "requesterName", "requesterEmail", "requesterPhone",
  "approverName", "siteName", "requestType", "stageName", "status",
  "comment", "visitorName", "visitorPhone", "accessCode", "portalUrl", "date", "time",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmailIntegration() {
  const { t } = useTranslation();
  const [, params] = useRoute("/integration-hub/email/:tab");
  const [, setLocation] = useLocation();
  const activeTab = params?.tab || "providers";
  const setActiveTab = (tab: string) => {
    setLocation(`/integration-hub/email/${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/integration-hub")} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-2xl font-semibold text-[#2C2C2C]">
                {t("integrationHub.email", "Email")}
              </h1>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1 ml-10">
              {t("integrationHub.emailDesc", "Manage email providers, templates, and automation rules")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="providers" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            {t("integrationHub.providers", "Providers")}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="h-4 w-4" />
            {t("integrationHub.templates", "Templates")}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Zap className="h-4 w-4" />
            {t("integrationHub.triggerRules", "Trigger Rules")}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            {t("integrationHub.messageLogs", "Logs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <EmailProvidersTab />
        </TabsContent>
        <TabsContent value="templates">
          <EmailTemplatesTab />
        </TabsContent>
        <TabsContent value="rules">
          <EmailRulesTab />
        </TabsContent>
        <TabsContent value="logs">
          <EmailLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// PROVIDERS TAB
// ============================================================================

function EmailProvidersTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: allIntegrations, isLoading } = trpc.messaging.listIntegrations.useQuery();
  // Filter to only email providers
  const integrationsList = useMemo(() =>
    (allIntegrations || []).filter(i => i.providerType === "smtp" || i.providerType === "sendgrid"),
    [allIntegrations]
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("smtp");
  const [formCredentials, setFormCredentials] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<number | null>(null);

  const createMutation = trpc.messaging.createIntegration.useMutation({
    onSuccess: () => {
      utils.messaging.listIntegrations.invalidate();
      setShowAddDialog(false);
      resetForm();
      toast.success("Email provider added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.messaging.updateIntegration.useMutation({
    onSuccess: () => {
      utils.messaging.listIntegrations.invalidate();
      setEditingProvider(null);
      resetForm();
      toast.success("Provider updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.messaging.deleteIntegration.useMutation({
    onSuccess: () => {
      utils.messaging.listIntegrations.invalidate();
      toast.success("Provider deleted");
    },
  });

  const toggleMutation = trpc.messaging.updateIntegration.useMutation({
    onSuccess: () => utils.messaging.listIntegrations.invalidate(),
  });

  const testMutation = trpc.messaging.testIntegration.useMutation({
    onSuccess: (data) => {
      setTestingId(null);
      if (data.healthy) {
        toast.success(`Connection Healthy — Latency: ${data.latencyMs}ms`);
      } else {
        toast.error(data.error || "Connection failed");
      }
    },
    onError: (err) => {
      setTestingId(null);
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormType("smtp");
    setFormCredentials({});
  };

  const openEdit = (provider: any) => {
    setEditingProvider(provider);
    setFormName(provider.name);
    setFormType(provider.providerType);
    setFormCredentials(provider.credentials ? (typeof provider.credentials === 'string' ? JSON.parse(provider.credentials) : provider.credentials) : {});
  };

  const getCredentialFields = (type: string) => {
    if (type === "smtp") {
      return [
        { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
        { key: "smtp_port", label: "SMTP Port", type: "text", placeholder: "587" },
        { key: "smtp_secure", label: "Use SSL/TLS", type: "text", placeholder: "true or false" },
        { key: "smtp_user", label: "SMTP Username", type: "text", placeholder: "user@example.com" },
        { key: "smtp_password", label: "SMTP Password", type: "password", placeholder: "••••••••" },
        { key: "from_email", label: "From Email", type: "text", placeholder: "noreply@centre3.com" },
        { key: "from_name", label: "From Name", type: "text", placeholder: "Centre3" },
      ];
    }
    if (type === "sendgrid") {
      return [
        { key: "sendgrid_api_key", label: "SendGrid API Key", type: "password", placeholder: "SG.xxxx" },
        { key: "from_email", label: "From Email", type: "text", placeholder: "noreply@centre3.com" },
        { key: "from_name", label: "From Name", type: "text", placeholder: "Centre3" },
      ];
    }
    return [];
  };

  const handleSave = () => {
    if (editingProvider) {
      updateMutation.mutate({
        id: editingProvider.id,
        name: formName,
        credentials: formCredentials,
        supportsEmail: true,
      });
    } else {
      const slug = formType + "_email_" + Date.now();
      createMutation.mutate({
        name: formName,
        slug,
        providerType: formType,
        supportsEmail: true,
        credentials: formCredentials,
      });
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {t("integrationHub.emailProvidersDesc", "Configure SMTP or SendGrid email providers")}
        </p>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("integrationHub.addProvider", "Add Provider")}
        </Button>
      </div>

      {integrationsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No email providers configured yet</p>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add your first email provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrationsList.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{integration.providerType}</p>
                    </div>
                    <Badge variant={integration.isEnabled ? "default" : "secondary"}>
                      {integration.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.isEnabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: integration.id, isEnabled: checked })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setTestingId(integration.id); testMutation.mutate({ id: integration.id }); }}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(integration)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate({ id: integration.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingProvider} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setEditingProvider(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Email Provider" : "Add Email Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Provider Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Production SMTP" />
            </div>
            {!editingProvider && (
              <div>
                <Label>Provider Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_PROVIDER_TYPES.map(pt => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label} — {pt.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Credentials</Label>
              {getCredentialFields(editingProvider?.providerType || formType).map(field => (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    type={field.type}
                    value={formCredentials[field.key] || ""}
                    onChange={(e) => setFormCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingProvider(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProvider ? "Update" : "Add Provider"}
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

function EmailTemplatesTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: allTemplates, isLoading } = trpc.messaging.listTemplates.useQuery();
  // Filter to only email templates
  const templatesList = useMemo(() =>
    (allTemplates || []).filter(tmpl => tmpl.channel === "email"),
    [allTemplates]
  );

  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formBodyAr, setFormBodyAr] = useState("");
  const [formVariables, setFormVariables] = useState<string[]>([]);

  const createMutation = trpc.messaging.createTemplate.useMutation({
    onSuccess: () => {
      utils.messaging.listTemplates.invalidate();
      setShowDialog(false);
      resetForm();
      toast.success("Email template created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.messaging.updateTemplate.useMutation({
    onSuccess: () => {
      utils.messaging.listTemplates.invalidate();
      setEditingTemplate(null);
      setShowDialog(false);
      resetForm();
      toast.success("Template updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.messaging.deleteTemplate.useMutation({
    onSuccess: () => {
      utils.messaging.listTemplates.invalidate();
      toast.success("Template deleted");
    },
  });

  const toggleMutation = trpc.messaging.updateTemplate.useMutation({
    onSuccess: () => utils.messaging.listTemplates.invalidate(),
  });

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormSubject("");
    setFormBody("");
    setFormBodyAr("");
    setFormVariables([]);
  };

  const openEdit = (tmpl: any) => {
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);
    setFormSlug(tmpl.slug);
    setFormDescription(tmpl.description || "");
    setFormSubject(tmpl.subject || "");
    setFormBody(tmpl.body);
    setFormBodyAr(tmpl.bodyAr || "");
    setFormVariables(tmpl.variables ? JSON.parse(tmpl.variables) : []);
    setShowDialog(true);
  };

  const handleSave = () => {
    const data = {
      name: formName,
      slug: formSlug,
      description: formDescription,
      channel: "email" as const,
      subject: formSubject,
      body: formBody,
      bodyAr: formBodyAr,
      variables: formVariables,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const insertVariable = (variable: string) => {
    setFormBody(prev => prev + `{{${variable}}}`);
    if (!formVariables.includes(variable)) {
      setFormVariables(prev => [...prev, variable]);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Email notification templates with HTML support</p>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </div>

      {templatesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No email templates yet</p>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create your first email template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templatesList.map((tmpl) => (
            <Card key={tmpl.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{tmpl.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                      <Badge variant={tmpl.isActive ? "default" : "secondary"} className="text-xs">
                        {tmpl.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {tmpl.description && <p className="text-sm text-muted-foreground mt-1">{tmpl.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{tmpl.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tmpl.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: tmpl.id, isActive: checked })}
                    />
                    <Button variant="outline" size="sm" onClick={() => openEdit(tmpl)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate({ id: tmpl.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditingTemplate(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Email Template" : "New Email Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Request Approved Notification" />
              </div>
              <div>
                <Label>Slug (unique key)</Label>
                <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="e.g. email_request_approved" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of when this template is used" />
            </div>
            <div>
              <Label>Email Subject</Label>
              <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="e.g. Your Request {{requestRefNo}} has been approved" />
            </div>
            <div>
              <Label>Email Body (EN)</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {TEMPLATE_VARIABLES.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
              <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} rows={6} placeholder="Email body with {{variables}}" />
            </div>
            <div>
              <Label>Email Body (AR) — Optional</Label>
              <Textarea value={formBodyAr} onChange={(e) => setFormBodyAr(e.target.value)} rows={4} placeholder="Arabic version of the email body" dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingTemplate(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? "Update" : "Create Template"}
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

function EmailRulesTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: allRules, isLoading } = trpc.messaging.listTriggerRules.useQuery();
  const { data: allTemplates } = trpc.messaging.listTemplates.useQuery();
  const { data: allIntegrations } = trpc.messaging.listIntegrations.useQuery();
  const { data: sitesList } = trpc.sites.getAll.useQuery();

  // Filter to email-only rules (rules whose template has channel=email)
  const emailTemplates = useMemo(() =>
    (allTemplates || []).filter(t => t.channel === "email"),
    [allTemplates]
  );
  const emailTemplateIds = useMemo(() => new Set(emailTemplates.map(t => t.id)), [emailTemplates]);
  const emailIntegrations = useMemo(() =>
    (allIntegrations || []).filter(i => i.providerType === "smtp" || i.providerType === "sendgrid"),
    [allIntegrations]
  );

  const rulesList = useMemo(() =>
    (allRules || []).filter(r => emailTemplateIds.has(r.templateId)),
    [allRules, emailTemplateIds]
  );

  const [showDialog, setShowDialog] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEventType, setFormEventType] = useState("request_submitted");
  const [formTemplateId, setFormTemplateId] = useState<number | null>(null);
  const [formIntegrationId, setFormIntegrationId] = useState<number | null>(null);
  const [formRecipientType, setFormRecipientType] = useState("requester");
  const [formSiteId, setFormSiteId] = useState<number | null>(null);

  const createMutation = trpc.messaging.createTriggerRule.useMutation({
    onSuccess: () => {
      utils.messaging.listTriggerRules.invalidate();
      setShowDialog(false);
      toast.success("Trigger rule created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = trpc.messaging.toggleTriggerRule.useMutation({
    onSuccess: () => utils.messaging.listTriggerRules.invalidate(),
  });

  const deleteMutation = trpc.messaging.deleteTriggerRule.useMutation({
    onSuccess: () => {
      utils.messaging.listTriggerRules.invalidate();
      toast.success("Rule deleted");
    },
  });

  const getTemplateName = (id: number) => emailTemplates.find(t => t.id === id)?.name || `Template #${id}`;
  const getIntegrationName = (id: number | null) => {
    if (!id) return "Default";
    return emailIntegrations.find(i => i.id === id)?.name || `Provider #${id}`;
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Define when email notifications are sent automatically</p>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rulesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No email trigger rules yet</p>
            <Button onClick={() => setShowDialog(true)} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create your first email rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesList.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{rule.eventType}</Badge>
                </TableCell>
                <TableCell className="text-sm">{getTemplateName(rule.templateId)}</TableCell>
                <TableCell className="text-sm capitalize">{rule.recipientType.replace(/_/g, " ")}</TableCell>
                <TableCell className="text-sm">{getIntegrationName(rule.integrationId)}</TableCell>
                <TableCell>
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isEnabled: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: rule.id })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Rule Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Email Trigger Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Email requester on approval" />
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={formEventType} onValueChange={setFormEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(et => (
                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Template</Label>
              <Select value={formTemplateId ? String(formTemplateId) : ""} onValueChange={(v) => setFormTemplateId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(tmpl => (
                    <SelectItem key={tmpl.id} value={String(tmpl.id)}>{tmpl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient</Label>
              <Select value={formRecipientType} onValueChange={setFormRecipientType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECIPIENT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Provider</Label>
              <Select value={formIntegrationId ? String(formIntegrationId) : "default"} onValueChange={(v) => setFormIntegrationId(v === "default" ? null : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Provider</SelectItem>
                  {emailIntegrations.map(i => (
                    <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Scope: Site (optional)</Label>
              <Select value={formSiteId ? String(formSiteId) : "all"} onValueChange={(v) => setFormSiteId(v === "all" ? null : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {(sitesList || []).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!formTemplateId) { toast.error("Please select a template"); return; }
                createMutation.mutate({
                  name: formName,
                  eventType: formEventType,
                  templateId: formTemplateId,
                  integrationId: formIntegrationId || undefined,
                  recipientType: formRecipientType as any,
                  siteId: formSiteId || undefined,
                });
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// LOGS TAB
// ============================================================================

function EmailLogsTab() {
  const { t } = useTranslation();
  const { data: allLogs, isLoading } = trpc.messaging.listLogs.useQuery({ channel: "email", pageSize: 100 });

  const logsList = useMemo(() =>
    allLogs?.logs || [],
    [allLogs]
  );

  const [viewingLog, setViewingLog] = useState<any>(null);

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending": return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Email delivery history and status tracking
      </p>

      {logsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No email messages sent yet</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsList.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{statusIcon(log.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{log.eventType}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.recipientEmail || log.recipientName || "—"}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {log.messageBody?.substring(0, 60) || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setViewingLog(log)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={!!viewingLog} onOpenChange={(open) => { if (!open) setViewingLog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Log Detail</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={viewingLog.status === "sent" ? "default" : "destructive"}>{viewingLog.status}</Badge></div>
                <div><span className="text-muted-foreground">Event:</span> {viewingLog.eventType}</div>
                <div><span className="text-muted-foreground">Provider:</span> {viewingLog.providerType}</div>
                <div><span className="text-muted-foreground">Channel:</span> Email</div>
              </div>
              <div>
                <span className="text-muted-foreground">Recipient:</span> {viewingLog.recipientEmail || viewingLog.recipientName}
              </div>
              <div>
                <span className="text-muted-foreground">Message Body:</span>
                <pre className="mt-1 p-3 bg-muted rounded text-xs whitespace-pre-wrap">{viewingLog.messageBody}</pre>
              </div>
              {viewingLog.errorMessage && (
                <div className="text-destructive">
                  <span className="text-muted-foreground">Error:</span> {viewingLog.errorMessage}
                </div>
              )}
              <div className="text-muted-foreground text-xs">
                Created: {new Date(viewingLog.createdAt).toLocaleString()}
                {viewingLog.sentAt && ` | Sent: ${new Date(viewingLog.sentAt).toLocaleString()}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
