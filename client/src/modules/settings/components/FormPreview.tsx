import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Upload, Plus, Trash2 } from "lucide-react";

type FormPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestTypeId: number;
  typeName: string;
};

type FieldOption = {
  value: string;
  label: string;
  labelAr: string;
};

type FormField = {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  columnSpan: number;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  options: FieldOption[] | null;
};

type FormSection = {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  icon: string | null;
  displayOrder: number;
  isRepeatable: boolean;
  minItems: number | null;
  maxItems: number | null;
  fields: FormField[];
};

export function FormPreview({ open, onOpenChange, requestTypeId, typeName }: FormPreviewProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState<string>("");

  const { data: formDefinition, isLoading } = trpc.requestConfig.formDefinition.getForTypes.useQuery(
    { typeIds: [requestTypeId] },
    { enabled: open && !!requestTypeId }
  );

  const sections = ((formDefinition as any)?.sections as FormSection[] | undefined) || [];

  // Set initial active tab when sections load
  if (sections.length > 0 && !activeTab) {
    setActiveTab(sections[0].code);
  }

  const renderField = (field: FormField) => {
    const label = isRTL ? field.nameAr : field.name;
    const placeholder = field.placeholder || "";
    const colSpanClass = {
      1: "col-span-3",
      2: "col-span-6",
      3: "col-span-9",
      4: "col-span-12",
    }[field.columnSpan] || "col-span-6";

    const options = field.options || [];

    return (
      <div key={field.id} className={colSpanClass}>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            {label}
            {field.isRequired && <span className="text-[#FF6B6B]">*</span>}
          </Label>

          {field.fieldType === "text" && (
            <Input placeholder={placeholder} disabled className="bg-[#F5F5F5]/50" />
          )}

          {field.fieldType === "textarea" && (
            <Textarea placeholder={placeholder} disabled className="bg-[#F5F5F5]/50" />
          )}

          {field.fieldType === "number" && (
            <Input type="number" placeholder={placeholder} disabled className="bg-[#F5F5F5]/50" />
          )}

          {field.fieldType === "email" && (
            <Input type="email" placeholder={placeholder} disabled className="bg-[#F5F5F5]/50" />
          )}

          {field.fieldType === "phone" && (
            <Input type="tel" placeholder={placeholder} disabled className="bg-[#F5F5F5]/50" />
          )}

          {field.fieldType === "date" && (
            <div className="relative">
              <Input placeholder="Select date" disabled className="bg-[#F5F5F5]/50" />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            </div>
          )}

          {field.fieldType === "time" && (
            <div className="relative">
              <Input placeholder="Select time" disabled className="bg-[#F5F5F5]/50" />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            </div>
          )}

          {field.fieldType === "datetime" && (
            <div className="relative">
              <Input placeholder="Select date and time" disabled className="bg-[#F5F5F5]/50" />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
            </div>
          )}

          {field.fieldType === "select" && (
            <Select disabled>
              <SelectTrigger className="bg-[#F5F5F5]/50">
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isRTL ? opt.labelAr || opt.label : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.fieldType === "radio" && (
            <RadioGroup disabled className="flex flex-wrap gap-4">
              {options.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`${field.code}_${opt.value}`} />
                  <Label htmlFor={`${field.code}_${opt.value}`} className="font-normal">
                    {isRTL ? opt.labelAr || opt.label : opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {field.fieldType === "checkbox" && (
            <div className="flex items-center space-x-2">
              <Checkbox disabled />
              <Label className="font-normal">{placeholder || label}</Label>
            </div>
          )}

          {field.fieldType === "file" && (
            <div className="border-2 border-dashed rounded-lg p-4 text-center bg-[#F5F5F5]/50">
              <Upload className="h-6 w-6 mx-auto text-[#6B6B6B] mb-2" />
              <p className="text-sm text-[#6B6B6B]">Click to upload or drag and drop</p>
            </div>
          )}

          {field.helpText && (
            <p className="text-xs text-[#6B6B6B]">{field.helpText}</p>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (section: FormSection) => {
    const fields = section.fields || [];

    if (section.isRepeatable) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#6B6B6B]">
              {section.minItems && section.maxItems
                ? `${section.minItems} to ${section.maxItems} items allowed`
                : section.maxItems
                ? `Up to ${section.maxItems} items`
                : "Add multiple items"}
            </div>
            <Button variant="outline" size="sm" disabled>
              <Plus className="h-4 w-4 mr-1" />
              Add {isRTL ? section.nameAr : section.name}
            </Button>
          </div>

          {/* Sample repeatable item */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Item 1</Badge>
              <Button variant="ghost" size="icon" disabled>
                <Trash2 className="h-4 w-4 text-[#6B6B6B]" />
              </Button>
            </div>
            <div className="grid grid-cols-12 gap-4">
              {fields.map(renderField)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-12 gap-4">
        {fields.map(renderField)}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Form Preview
            <Badge variant="outline">{typeName}</Badge>
          </DialogTitle>
          <DialogDescription>
            This is how the form will appear to users. Fields are disabled in preview mode.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B6B]">
            No sections defined for this request type.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-[#F5F5F5]/50 p-1">
              {sections.map((section) => (
                <TabsTrigger
                  key={section.code}
                  value={section.code}
                  className="flex-1 min-w-[120px] data-[state=active]:bg-[#F5F5F5]"
                >
                  {isRTL ? section.nameAr : section.name}
                  {section.isRepeatable && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      ×
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {sections.map((section) => (
              <TabsContent key={section.code} value={section.code} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      {isRTL ? section.nameAr : section.name}
                    </h3>
                    <span className="text-sm text-[#6B6B6B]">
                      {section.fields?.length || 0} fields
                    </span>
                  </div>
                  {renderSection(section)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
