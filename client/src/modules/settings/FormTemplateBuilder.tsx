import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit2, Save, Eye, Copy, GripVertical, ChevronDown, ChevronUp,
  Wifi, Building, Car, Shield, AlertTriangle, HardHat, Phone, Cigarette,
  Camera, Footprints, FileText, QrCode, Loader2, X, Check, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// Types
interface FormField {
  key: string;
  label: string;
  labelAr?: string;
  source: string;
  type: "text" | "date" | "phone" | "email" | "custom";
  isRequired: boolean;
  sortOrder: number;
}

interface InfoSection {
  icon: string;
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
  isActive: boolean;
  sortOrder: number;
}

interface SafetyRule {
  icon: string;
  iconColor: string;
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormTemplateData {
  name: string;
  description: string;
  requestType: "admin_visit" | "work_permit" | "material_entry" | "tep" | "mop" | "escort";
  isDefault: boolean;
  companyName: string;
  companyNameAr: string;
  logoUrl: string;
  headerColor: string;
  footerText: string;
  footerTextAr: string;
  footerPhone: string;
  footerEmail: string;
  footerDepartment: string;
  footerDepartmentAr: string;
  formTitle: string;
  formTitleAr: string;
  formSubtitle: string;
  formSubtitleAr: string;
  fields: FormField[];
  infoSections: InfoSection[];
  safetyRules: SafetyRule[];
  disclaimerText: string;
  disclaimerTextAr: string;
  showQrCode: boolean;
  qrCodePosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  pageSize: "a4" | "letter";
  orientation: "portrait" | "landscape";
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  admin_visit: "Admin Visit",
  work_permit: "Work Permit",
  material_entry: "Material Entry",
  tep: "TEP",
  mop: "MOP",
  escort: "Escort",
};

const AVAILABLE_ICONS: Record<string, any> = {
  wifi: Wifi,
  building: Building,
  car: Car,
  shield: Shield,
  alert: AlertTriangle,
  hardhat: HardHat,
  phone: Phone,
  cigarette: Cigarette,
  camera: Camera,
  footprints: Footprints,
  file: FileText,
  qrcode: QrCode,
};

const DEFAULT_FIELDS: FormField[] = [
  { key: "visitorName", label: "Visitor Name", labelAr: "اسم الزائر", source: "request.visitorName", type: "text", isRequired: true, sortOrder: 1 },
  { key: "visitorIdNumber", label: "ID / Iqama Number", labelAr: "رقم الهوية / الإقامة", source: "request.visitorIdNumber", type: "text", isRequired: true, sortOrder: 2 },
  { key: "visitorCompany", label: "Company", labelAr: "الشركة", source: "request.visitorCompany", type: "text", isRequired: true, sortOrder: 3 },
  { key: "purpose", label: "Purpose of Visit", labelAr: "الغرض من الزيارة", source: "request.purpose", type: "text", isRequired: true, sortOrder: 4 },
  { key: "startDate", label: "Valid From", labelAr: "صالح من", source: "request.startDate", type: "date", isRequired: true, sortOrder: 5 },
  { key: "endDate", label: "Valid Until", labelAr: "صالح حتى", source: "request.endDate", type: "date", isRequired: true, sortOrder: 6 },
  { key: "siteName", label: "Site / Building", labelAr: "الموقع / المبنى", source: "request.siteName", type: "text", isRequired: true, sortOrder: 7 },
  { key: "visitorPhone", label: "Phone Number", labelAr: "رقم الهاتف", source: "request.visitorPhone", type: "phone", isRequired: false, sortOrder: 8 },
];

const DEFAULT_INFO_SECTIONS: InfoSection[] = [
  { icon: "wifi", title: "Internet", titleAr: "الإنترنت", content: "Guest WiFi: Centre3-Guest", contentAr: "واي فاي الضيوف: Centre3-Guest", isActive: true, sortOrder: 1 },
  { icon: "building", title: "Building / Site", titleAr: "المبنى / الموقع", content: "Follow escort at all times", contentAr: "اتبع المرافق في جميع الأوقات", isActive: true, sortOrder: 2 },
  { icon: "car", title: "Parking", titleAr: "موقف السيارات", content: "Visitor parking available at Gate 1", contentAr: "موقف الزوار متاح عند البوابة 1", isActive: true, sortOrder: 3 },
];

const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  { icon: "shield", iconColor: "#FF6B6B", title: "Safety First", titleAr: "السلامة أولاً", subtitle: "Follow all safety instructions", subtitleAr: "اتبع جميع تعليمات السلامة", isActive: true, sortOrder: 1 },
  { icon: "hardhat", iconColor: "#D97706", title: "PPE Required", titleAr: "معدات الحماية مطلوبة", subtitle: "Wear required protective equipment", subtitleAr: "ارتد معدات الحماية المطلوبة", isActive: true, sortOrder: 2 },
  { icon: "cigarette", iconColor: "#FF6B6B", title: "No Smoking", titleAr: "ممنوع التدخين", subtitle: "Smoking is strictly prohibited", subtitleAr: "التدخين ممنوع منعاً باتاً", isActive: true, sortOrder: 3 },
  { icon: "camera", iconColor: "#5B2C93", title: "No Photography", titleAr: "ممنوع التصوير", subtitle: "Photography is not allowed", subtitleAr: "التصوير غير مسموح", isActive: true, sortOrder: 4 },
  { icon: "phone", iconColor: "#5B2C93", title: "Emergency", titleAr: "الطوارئ", subtitle: "Call 911 for emergencies", subtitleAr: "اتصل 911 للطوارئ", isActive: true, sortOrder: 5 },
  { icon: "footprints", iconColor: "#059669", title: "Restricted Areas", titleAr: "مناطق محظورة", subtitle: "Stay in authorized areas only", subtitleAr: "ابق في المناطق المصرح بها فقط", isActive: true, sortOrder: 6 },
];

const getDefaultTemplate = (): FormTemplateData => ({
  name: "",
  description: "",
  requestType: "admin_visit",
  isDefault: false,
  companyName: "Centre3",
  companyNameAr: "سنتر3",
  logoUrl: "",
  headerColor: "#5B2C93",
  footerText: "This pass must be displayed at all times while on premises.",
  footerTextAr: "يجب عرض هذا التصريح في جميع الأوقات أثناء التواجد في المبنى.",
  footerPhone: "+966 11 000 0000",
  footerEmail: "security@centre3.com",
  footerDepartment: "Security Operations Centre",
  footerDepartmentAr: "مركز العمليات الأمنية",
  formTitle: "Visit Permission",
  formTitleAr: "تصريح زيارة",
  formSubtitle: "Visitor Access Pass",
  formSubtitleAr: "بطاقة دخول الزائر",
  fields: [...DEFAULT_FIELDS],
  infoSections: [...DEFAULT_INFO_SECTIONS],
  safetyRules: [...DEFAULT_SAFETY_RULES],
  disclaimerText: "This visitor pass is non-transferable and must be returned upon departure. The holder agrees to comply with all site safety and security regulations.",
  disclaimerTextAr: "تصريح الزيارة هذا غير قابل للتحويل ويجب إعادته عند المغادرة. يوافق حامله على الامتثال لجميع لوائح السلامة والأمن في الموقع.",
  showQrCode: true,
  qrCodePosition: "top-right",
  pageSize: "a4",
  orientation: "portrait",
});

// ============================================================================
// FORM PREVIEW COMPONENT
// ============================================================================
function FormPreview({ template }: { template: FormTemplateData }) {
  const IconComponent = ({ name, color, size = 20 }: { name: string; color?: string; size?: number }) => {
    const Icon = AVAILABLE_ICONS[name] || Shield;
    return <Icon size={size} color={color} />;
  };

  // Sample data for preview
  const sampleData: Record<string, string> = {
    visitorName: "Ahmed Al-Rashid",
    visitorIdNumber: "1234567890",
    visitorCompany: "Amazon Web Services",
    purpose: "Data Center Maintenance",
    startDate: "2026-02-08",
    endDate: "2026-02-10",
    siteName: "RDC46 Data Centre - Riyadh",
    visitorPhone: "+966 50 123 4567",
    visitorEmail: "ahmed@aws.com",
    requestNumber: "REQ-20260208-001",
  };

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden" style={{ width: "100%", maxWidth: 595 }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: template.headerColor }}>
        <div className="flex items-center gap-3">
          {template.logoUrl ? (
            <img src={template.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-white font-medium text-lg">{template.companyName}</h1>
            {template.companyNameAr && (
              <p className="text-white/80 text-sm" dir="rtl">{template.companyNameAr}</p>
            )}
          </div>
        </div>
        {template.showQrCode && (
          <div className="bg-white p-2 rounded-lg">
            <QrCode className="h-16 w-16 text-[#2C2C2C]" />
          </div>
        )}
      </div>

      {/* Form Title */}
      <div className="px-6 py-3 border-b bg-[#F5F5F5]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-medium text-lg text-[#2C2C2C]">{template.formTitle}</h2>
            {template.formSubtitle && (
              <p className="text-sm text-[#6B6B6B]">{template.formSubtitle}</p>
            )}
          </div>
          <div className="text-right" dir="rtl">
            {template.formTitleAr && <h2 className="font-medium text-lg text-[#2C2C2C]">{template.formTitleAr}</h2>}
            {template.formSubtitleAr && <p className="text-sm text-[#6B6B6B]">{template.formSubtitleAr}</p>}
          </div>
        </div>
        <div className="mt-1">
          <Badge variant="outline" className="text-xs">{sampleData.requestNumber}</Badge>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {template.fields.filter(f => f.isRequired || sampleData[f.key]).sort((a, b) => a.sortOrder - b.sortOrder).map((field) => (
            <div key={field.key} className="border-b border-[#E0E0E0] pb-2">
              <div className="flex justify-between">
                <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">{field.label}</span>
                {field.labelAr && <span className="text-xs text-[#9CA3AF]" dir="rtl">{field.labelAr}</span>}
              </div>
              <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">
                {sampleData[field.key] || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Sections */}
      {template.infoSections && template.infoSections.filter(s => s.isActive).length > 0 && (
        <div className="px-6 py-3 bg-[#F5F5F5] border-t">
          <div className="grid grid-cols-3 gap-3">
            {template.infoSections.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((section, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="mt-0.5">
                  <IconComponent name={section.icon} color={template.headerColor} size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2C2C2C]">{section.title}</p>
                  <p className="text-xs text-[#6B6B6B]">{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Rules */}
      {template.safetyRules && template.safetyRules.filter(r => r.isActive).length > 0 && (
        <div className="px-6 py-3 border-t">
          <p className="text-sm font-medium text-[#2C2C2C] tracking-wider mb-2">Safety Rules / قواعد السلامة</p>
          <div className="grid grid-cols-3 gap-2">
            {template.safetyRules.filter(r => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg p-2">
                <div className="shrink-0">
                  <IconComponent name={rule.icon} color={rule.iconColor} size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2C2C2C] leading-tight">{rule.title}</p>
                  {rule.subtitle && <p className="text-[10px] text-[#9CA3AF] leading-tight">{rule.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {template.disclaimerText && (
        <div className="px-6 py-2 bg-[#FEF3C7] border-t border-[#D97706]">
          <p className="text-[10px] text-[#D97706] leading-relaxed">{template.disclaimerText}</p>
          {template.disclaimerTextAr && (
            <p className="text-[10px] text-[#D97706] leading-relaxed mt-1" dir="rtl">{template.disclaimerTextAr}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t bg-[#F5F5F5]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-[#6B6B6B]">{template.footerDepartment}</p>
            {template.footerPhone && <p className="text-[10px] text-[#9CA3AF]">{template.footerPhone}</p>}
            {template.footerEmail && <p className="text-[10px] text-[#9CA3AF]">{template.footerEmail}</p>}
          </div>
          <div className="text-right" dir="rtl">
            {template.footerDepartmentAr && <p className="text-xs font-medium text-[#6B6B6B]">{template.footerDepartmentAr}</p>}
          </div>
        </div>
        {template.footerText && (
          <p className="text-[10px] text-[#6B6B6B] mt-1 border-t border-[#E0E0E0] pt-1">{template.footerText}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function FormTemplateBuilder() {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [template, setTemplate] = useState<FormTemplateData>(getDefaultTemplate());
  const [builderTab, setBuilderTab] = useState("branding");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries
  const { data: templates, isLoading, refetch } = trpc.formTemplates.list.useQuery({ activeOnly: false });

  // Mutations
  const createMutation = trpc.formTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Form template created successfully");
      refetch();
      setMode("list");
    },
    onError: (err) => toast.error("Failed to create template", { description: err.message }),
  });

  const updateMutation = trpc.formTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Form template updated successfully");
      refetch();
      setMode("list");
    },
    onError: (err) => toast.error("Failed to update template", { description: err.message }),
  });

  const deleteMutation = trpc.formTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Form template deleted");
      refetch();
    },
    onError: (err) => toast.error("Failed to delete template", { description: err.message }),
  });

  const handleSave = () => {
    if (!template.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (template.fields.length === 0) {
      toast.error("At least one field is required");
      return;
    }

    if (mode === "edit" && editingId) {
      updateMutation.mutate({ id: editingId, ...template });
    } else {
      createMutation.mutate(template);
    }
  };

  const handleEdit = (t: any) => {
    setTemplate({
      name: t.name || "",
      description: t.description || "",
      requestType: t.requestType,
      isDefault: t.isDefault || false,
      companyName: t.companyName || "Centre3",
      companyNameAr: t.companyNameAr || "",
      logoUrl: t.logoUrl || "",
      headerColor: t.headerColor || "#5B2C93",
      footerText: t.footerText || "",
      footerTextAr: t.footerTextAr || "",
      footerPhone: t.footerPhone || "",
      footerEmail: t.footerEmail || "",
      footerDepartment: t.footerDepartment || "",
      footerDepartmentAr: t.footerDepartmentAr || "",
      formTitle: t.formTitle || "Visit Permission",
      formTitleAr: t.formTitleAr || "",
      formSubtitle: t.formSubtitle || "",
      formSubtitleAr: t.formSubtitleAr || "",
      fields: t.fields || DEFAULT_FIELDS,
      infoSections: t.infoSections || DEFAULT_INFO_SECTIONS,
      safetyRules: t.safetyRules || DEFAULT_SAFETY_RULES,
      disclaimerText: t.disclaimerText || "",
      disclaimerTextAr: t.disclaimerTextAr || "",
      showQrCode: t.showQrCode ?? true,
      qrCodePosition: t.qrCodePosition || "top-right",
      pageSize: t.pageSize || "a4",
      orientation: t.orientation || "portrait",
    });
    setEditingId(t.id);
    setMode("edit");
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this form template?")) {
      deleteMutation.mutate({ id });
    }
  };

  const addField = () => {
    const newField: FormField = {
      key: `custom_${Date.now()}`,
      label: "New Field",
      source: "custom",
      type: "text",
      isRequired: false,
      sortOrder: template.fields.length + 1,
    };
    setTemplate({ ...template, fields: [...template.fields, newField] });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const fields = [...template.fields];
    fields[index] = { ...fields[index], ...updates };
    setTemplate({ ...template, fields });
  };

  const removeField = (index: number) => {
    const fields = template.fields.filter((_, i) => i !== index);
    setTemplate({ ...template, fields });
  };

  const addInfoSection = () => {
    const newSection: InfoSection = {
      icon: "building",
      title: "New Section",
      content: "Section content here",
      isActive: true,
      sortOrder: (template.infoSections?.length || 0) + 1,
    };
    setTemplate({ ...template, infoSections: [...(template.infoSections || []), newSection] });
  };

  const updateInfoSection = (index: number, updates: Partial<InfoSection>) => {
    const sections = [...(template.infoSections || [])];
    sections[index] = { ...sections[index], ...updates };
    setTemplate({ ...template, infoSections: sections });
  };

  const removeInfoSection = (index: number) => {
    const sections = (template.infoSections || []).filter((_, i) => i !== index);
    setTemplate({ ...template, infoSections: sections });
  };

  const addSafetyRule = () => {
    const newRule: SafetyRule = {
      icon: "shield",
      iconColor: "#FF6B6B",
      title: "New Rule",
      isActive: true,
      sortOrder: (template.safetyRules?.length || 0) + 1,
    };
    setTemplate({ ...template, safetyRules: [...(template.safetyRules || []), newRule] });
  };

  const updateSafetyRule = (index: number, updates: Partial<SafetyRule>) => {
    const rules = [...(template.safetyRules || [])];
    rules[index] = { ...rules[index], ...updates };
    setTemplate({ ...template, safetyRules: rules });
  };

  const removeSafetyRule = (index: number) => {
    const rules = (template.safetyRules || []).filter((_, i) => i !== index);
    setTemplate({ ...template, safetyRules: rules });
  };

  // ============================================================================
  // LIST VIEW
  // ============================================================================
  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#2C2C2C]">Form Templates</h3>
            <p className="text-sm text-[#6B6B6B]">
              Customize the visit permission forms that are generated with approved requests.
            </p>
          </div>
          <Button
            className="bg-[#5B2C93] hover:bg-[#5B2C93]"
            onClick={() => { setTemplate(getDefaultTemplate()); setEditingId(null); setMode("create"); }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-[#6B6B6B] mb-4" />
              <h3 className="text-lg font-medium text-[#2C2C2C] mb-2">No Form Templates</h3>
              <p className="text-[#6B6B6B] mb-4">Create your first form template to generate visit permission forms.</p>
              <Button
                className="bg-[#5B2C93] hover:bg-[#5B2C93]"
                onClick={() => { setTemplate(getDefaultTemplate()); setEditingId(null); setMode("create"); }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t: any) => (
              <Card key={t.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <CardDescription className="mt-1">{t.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {t.isDefault && <Badge className="bg-[#E8DCF5] text-[#5B2C93] text-xs">Default</Badge>}
                      <Badge variant={t.isActive ? "default" : "secondary"} className="text-xs">
                        {t.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Badge variant="outline">{REQUEST_TYPE_LABELS[t.requestType] || t.requestType}</Badge>
                    <span>{t.fields?.length || 0} fields</span>
                  </div>
                  {/* Mini preview */}
                  <div className="mt-3 border rounded-lg overflow-hidden" style={{ height: 120 }}>
                    <div className="transform scale-[0.2] origin-top-left" style={{ width: 500 }}>
                      <FormPreview template={{
                        ...getDefaultTemplate(),
                        ...t,
                        fields: t.fields || DEFAULT_FIELDS,
                        infoSections: t.infoSections || DEFAULT_INFO_SECTIONS,
                        safetyRules: t.safetyRules || DEFAULT_SAFETY_RULES,
                      }} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { handleEdit(t); setPreviewOpen(true); }}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button size="sm" variant="outline" className="text-[#FF6B6B] hover:text-[#FF6B6B] ml-auto" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // BUILDER VIEW
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {mode === "create" ? "Create Form Template" : "Edit Form Template"}
            </h3>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Button
            className="bg-[#5B2C93] hover:bg-[#5B2C93]"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {/* Builder Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <Tabs value={builderTab} onValueChange={setBuilderTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="info">Info Sections</TabsTrigger>
              <TabsTrigger value="safety">Safety Rules</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* BRANDING TAB */}
            <TabsContent value="branding" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Template Name *</Label>
                      <Input value={template.name} onChange={e => setTemplate({ ...template, name: e.target.value })} placeholder="e.g., Admin Visit Form" />
                    </div>
                    <div>
                      <Label className="text-xs">Request Type *</Label>
                      <Select value={template.requestType} onValueChange={(v: any) => setTemplate({ ...template, requestType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={template.description} onChange={e => setTemplate({ ...template, description: e.target.value })} rows={2} placeholder="Brief description of this template" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Company Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Company Name (EN)</Label>
                      <Input value={template.companyName} onChange={e => setTemplate({ ...template, companyName: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Company Name (AR)</Label>
                      <Input value={template.companyNameAr} onChange={e => setTemplate({ ...template, companyNameAr: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Header Color</Label>
                      <div className="flex gap-2">
                        <input type="color" value={template.headerColor} onChange={e => setTemplate({ ...template, headerColor: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                        <Input value={template.headerColor} onChange={e => setTemplate({ ...template, headerColor: e.target.value })} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Logo URL</Label>
                      <Input value={template.logoUrl} onChange={e => setTemplate({ ...template, logoUrl: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Form Title</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Title (EN)</Label>
                      <Input value={template.formTitle} onChange={e => setTemplate({ ...template, formTitle: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Title (AR)</Label>
                      <Input value={template.formTitleAr} onChange={e => setTemplate({ ...template, formTitleAr: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Subtitle (EN)</Label>
                      <Input value={template.formSubtitle} onChange={e => setTemplate({ ...template, formSubtitle: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle (AR)</Label>
                      <Input value={template.formSubtitleAr} onChange={e => setTemplate({ ...template, formSubtitleAr: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Footer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Department (EN)</Label>
                      <Input value={template.footerDepartment} onChange={e => setTemplate({ ...template, footerDepartment: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Department (AR)</Label>
                      <Input value={template.footerDepartmentAr} onChange={e => setTemplate({ ...template, footerDepartmentAr: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={template.footerPhone} onChange={e => setTemplate({ ...template, footerPhone: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input value={template.footerEmail} onChange={e => setTemplate({ ...template, footerEmail: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Footer Text</Label>
                    <Textarea value={template.footerText} onChange={e => setTemplate({ ...template, footerText: e.target.value })} rows={2} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FIELDS TAB */}
            <TabsContent value="fields" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Form Fields ({template.fields.length})</CardTitle>
                    <Button size="sm" variant="outline" onClick={addField}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.fields.sort((a, b) => a.sortOrder - b.sortOrder).map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-[#F5F5F5]/30">
                      <GripVertical className="h-4 w-4 text-[#6B6B6B] shrink-0" />
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <Input
                          value={field.label}
                          onChange={e => updateField(idx, { label: e.target.value })}
                          placeholder="Label"
                          className="text-sm h-8"
                        />
                        <Input
                          value={field.labelAr || ""}
                          onChange={e => updateField(idx, { labelAr: e.target.value })}
                          placeholder="Arabic Label"
                          className="text-sm h-8"
                          dir="rtl"
                        />
                        <Select value={field.source} onValueChange={v => updateField(idx, { source: v, key: v.replace("request.", "") })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="request.visitorName">Visitor Name</SelectItem>
                            <SelectItem value="request.visitorIdNumber">ID Number</SelectItem>
                            <SelectItem value="request.visitorCompany">Company</SelectItem>
                            <SelectItem value="request.purpose">Purpose</SelectItem>
                            <SelectItem value="request.startDate">Start Date</SelectItem>
                            <SelectItem value="request.endDate">End Date</SelectItem>
                            <SelectItem value="request.siteName">Site Name</SelectItem>
                            <SelectItem value="request.visitorPhone">Phone</SelectItem>
                            <SelectItem value="request.visitorEmail">Email</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.isRequired}
                            onCheckedChange={v => updateField(idx, { isRequired: v })}
                          />
                          <span className="text-xs text-[#6B6B6B]">Req</span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#FF6B6B] ml-auto" onClick={() => removeField(idx)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INFO SECTIONS TAB */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Information Sections ({template.infoSections?.length || 0})</CardTitle>
                    <Button size="sm" variant="outline" onClick={addInfoSection}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(template.infoSections || []).map((section, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Select value={section.icon} onValueChange={v => updateInfoSection(idx, { icon: v })}>
                            <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.keys(AVAILABLE_ICONS).map(k => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Switch checked={section.isActive} onCheckedChange={v => updateInfoSection(idx, { isActive: v })} />
                        </div>
                        <Button size="sm" variant="ghost" className="text-[#FF6B6B]" onClick={() => removeInfoSection(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={section.title} onChange={e => updateInfoSection(idx, { title: e.target.value })} placeholder="Title (EN)" className="text-sm h-8" />
                        <Input value={section.titleAr || ""} onChange={e => updateInfoSection(idx, { titleAr: e.target.value })} placeholder="Title (AR)" className="text-sm h-8" dir="rtl" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={section.content} onChange={e => updateInfoSection(idx, { content: e.target.value })} placeholder="Content (EN)" className="text-sm h-8" />
                        <Input value={section.contentAr || ""} onChange={e => updateInfoSection(idx, { contentAr: e.target.value })} placeholder="Content (AR)" className="text-sm h-8" dir="rtl" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SAFETY RULES TAB */}
            <TabsContent value="safety" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Safety Rules ({template.safetyRules?.length || 0})</CardTitle>
                    <Button size="sm" variant="outline" onClick={addSafetyRule}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(template.safetyRules || []).map((rule, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Select value={rule.icon} onValueChange={v => updateSafetyRule(idx, { icon: v })}>
                            <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.keys(AVAILABLE_ICONS).map(k => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input type="color" value={rule.iconColor} onChange={e => updateSafetyRule(idx, { iconColor: e.target.value })} className="h-8 w-10 rounded border cursor-pointer" />
                          <Switch checked={rule.isActive} onCheckedChange={v => updateSafetyRule(idx, { isActive: v })} />
                        </div>
                        <Button size="sm" variant="ghost" className="text-[#FF6B6B]" onClick={() => removeSafetyRule(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={rule.title} onChange={e => updateSafetyRule(idx, { title: e.target.value })} placeholder="Title (EN)" className="text-sm h-8" />
                        <Input value={rule.titleAr || ""} onChange={e => updateSafetyRule(idx, { titleAr: e.target.value })} placeholder="Title (AR)" className="text-sm h-8" dir="rtl" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={rule.subtitle || ""} onChange={e => updateSafetyRule(idx, { subtitle: e.target.value })} placeholder="Subtitle (EN)" className="text-sm h-8" />
                        <Input value={rule.subtitleAr || ""} onChange={e => updateSafetyRule(idx, { subtitleAr: e.target.value })} placeholder="Subtitle (AR)" className="text-sm h-8" dir="rtl" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={template.showQrCode} onCheckedChange={v => setTemplate({ ...template, showQrCode: v })} />
                    <Label>Show QR Code on form</Label>
                  </div>
                  {template.showQrCode && (
                    <div>
                      <Label className="text-xs">QR Code Position</Label>
                      <Select value={template.qrCodePosition} onValueChange={(v: any) => setTemplate({ ...template, qrCodePosition: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Page Size</Label>
                      <Select value={template.pageSize} onValueChange={(v: any) => setTemplate({ ...template, pageSize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Orientation</Label>
                      <Select value={template.orientation} onValueChange={(v: any) => setTemplate({ ...template, orientation: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={template.isDefault} onCheckedChange={v => setTemplate({ ...template, isDefault: v })} />
                    <Label>Set as default template for this request type</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Disclaimer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Disclaimer Text (EN)</Label>
                    <Textarea value={template.disclaimerText} onChange={e => setTemplate({ ...template, disclaimerText: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <Label className="text-xs">Disclaimer Text (AR)</Label>
                    <Textarea value={template.disclaimerTextAr} onChange={e => setTemplate({ ...template, disclaimerTextAr: e.target.value })} rows={3} dir="rtl" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-4">
            <h4 className="text-sm font-medium text-[#6B6B6B] mb-3">LIVE PREVIEW</h4>
            <div className="border rounded-lg p-4 bg-[#F5F5F5] overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
              <FormPreview template={template} />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog (for mobile / smaller screens) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[650px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <FormPreview template={template} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
