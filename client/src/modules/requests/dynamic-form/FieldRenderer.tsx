import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, User, Search, Loader2, Activity, AlertTriangle, FileCheck, ClipboardList, MapPin as RoomIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { HierarchicalTypeSelector } from "./HierarchicalTypeSelector";

interface FieldOption {
  value: string;
  label: string;
  labelAr?: string;
}

interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
}

interface ShowCondition {
  field: string;
  operator?: "equals" | "not_equals" | "in" | "not_empty" | "empty";
  value?: string | string[] | boolean;
}

interface FormField {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  columnSpan: number;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  defaultValue?: string;
  options?: FieldOption[];
  optionsSource?: "static" | "api" | "dependent";
  optionsApi?: string;
  dependsOnField?: string;
  validation?: FieldValidation;
  showCondition?: ShowCondition;
}

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  formValues: Record<string, any>;
  disabled?: boolean;
  error?: string;
}

// Site Type Field Component
function SiteTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: siteTypes, isLoading } = trpc.masterData.getSiteTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
          {getLabel()}
          {field.isRequired && <span className="text-red-600">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (siteTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-gray-500">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Zone Type Field Component
function ZoneTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: zoneTypes, isLoading } = trpc.masterData.getZoneTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
          {getLabel()}
          {field.isRequired && <span className="text-red-600">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (zoneTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-gray-500">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Area Type Field Component
function AreaTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: areaTypes, isLoading } = trpc.masterData.getAreaTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
          {getLabel()}
          {field.isRequired && <span className="text-red-600">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (areaTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-gray-500">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Activity Selector Field Component - shows main activity and sub-activity with requirements
function ActivitySelectorField({
  field,
  value,
  onChange,
  onRequirementsChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onRequirementsChange?: (requirements: { needsRFC: boolean; needsHRS: boolean; needsMOP: boolean; needsMHV: boolean; needsRoomSelection: boolean }) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { t } = useTranslation();
  const [selectedMainActivityId, setSelectedMainActivityId] = useState<number | null>(value?.mainActivityId || null);
  const [selectedSubActivityId, setSelectedSubActivityId] = useState<number | null>(value?.subActivityId || null);

  const { data: mainActivities, isLoading: loadingMain } = trpc.masterData.getAllMainActivities.useQuery();
  const { data: subActivities, isLoading: loadingSub } = trpc.masterData.getAllSubActivities.useQuery();

  // Filter sub-activities based on selected main activity
  const filteredSubActivities = useMemo(() => {
    if (!selectedMainActivityId || !subActivities) return [];
    return subActivities.filter((s: any) => s.mainActivityId === selectedMainActivityId && s.isActive);
  }, [selectedMainActivityId, subActivities]);

  // Get selected sub-activity details for requirements
  const selectedSubActivity = useMemo(() => {
    if (!selectedSubActivityId || !subActivities) return null;
    return subActivities.find((s: any) => s.id === selectedSubActivityId);
  }, [selectedSubActivityId, subActivities]);

  // Update parent when selection changes
  useEffect(() => {
    if (selectedMainActivityId && selectedSubActivityId) {
      const mainActivity = mainActivities?.find((m: any) => m.id === selectedMainActivityId);
      const subActivity = subActivities?.find((s: any) => s.id === selectedSubActivityId);
      onChange({
        mainActivityId: selectedMainActivityId,
        mainActivityName: mainActivity?.name,
        subActivityId: selectedSubActivityId,
        subActivityName: subActivity?.name,
        requirements: {
          needsRFC: subActivity?.needsRFC || false,
          needsHRS: subActivity?.needsHRS || false,
          needsMOP: subActivity?.needsMOP || false,
          needsMHV: subActivity?.needsMHV || false,
          needsRoomSelection: subActivity?.needsRoomSelection || false,
        }
      });
      // Notify parent about requirements
      if (onRequirementsChange && subActivity) {
        onRequirementsChange({
          needsRFC: subActivity.needsRFC || false,
          needsHRS: subActivity.needsHRS || false,
          needsMOP: subActivity.needsMOP || false,
          needsMHV: subActivity.needsMHV || false,
          needsRoomSelection: subActivity.needsRoomSelection || false,
        });
      }
    }
  }, [selectedMainActivityId, selectedSubActivityId, mainActivities, subActivities]);

  // Reset sub-activity when main activity changes
  useEffect(() => {
    if (selectedMainActivityId !== value?.mainActivityId) {
      setSelectedSubActivityId(null);
    }
  }, [selectedMainActivityId]);

  if (loadingMain) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
          {getLabel()}
          {field.isRequired && <span className="text-red-600">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Activity Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
          <Activity className="h-3.5 w-3.5" />
          {isRTL ? "النشاط الرئيسي" : "Main Activity"}
          {field.isRequired && <span className="text-red-600">*</span>}
        </Label>
        <Select
          value={selectedMainActivityId?.toString() || ""}
          onValueChange={(v) => setSelectedMainActivityId(parseInt(v))}
          disabled={disabled}
        >
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder={isRTL ? "اختر النشاط الرئيسي" : "Select main activity"} />
          </SelectTrigger>
          <SelectContent>
            {mainActivities?.filter((a: any) => a.isActive).map((activity: any) => (
              <SelectItem key={activity.id} value={activity.id.toString()}>
                {isRTL && activity.nameAr ? activity.nameAr : activity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-Activity Selector */}
      {selectedMainActivityId && (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {isRTL ? "النشاط الفرعي" : "Sub-Activity"}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          {loadingSub ? (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select
              value={selectedSubActivityId?.toString() || ""}
              onValueChange={(v) => setSelectedSubActivityId(parseInt(v))}
              disabled={disabled || filteredSubActivities.length === 0}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder={isRTL ? "اختر النشاط الفرعي" : "Select sub-activity"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubActivities.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {isRTL && sub.nameAr ? sub.nameAr : sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filteredSubActivities.length === 0 && !loadingSub && (
            <p className="text-xs text-muted-foreground">
              {isRTL ? "لا توجد أنشطة فرعية لهذا النشاط الرئيسي" : "No sub-activities available for this main activity"}
            </p>
          )}
        </div>
      )}

      {/* Requirements Display */}
      {selectedSubActivity && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
          <Label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1">
            <FileCheck className="h-3.5 w-3.5" />
            {isRTL ? "المتطلبات" : "Requirements"}
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedSubActivity.needsRFC && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                RFC
              </Badge>
            )}
            {selectedSubActivity.needsHRS && (
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                <FileCheck className="h-3 w-3 mr-1" />
                HRS
              </Badge>
            )}
            {selectedSubActivity.needsMOP && (
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                <ClipboardList className="h-3 w-3 mr-1" />
                MOP
              </Badge>
            )}
            {selectedSubActivity.needsMHV && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <FileCheck className="h-3 w-3 mr-1" />
                MHV
              </Badge>
            )}
            {selectedSubActivity.needsRoomSelection && (
              <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                <RoomIcon className="h-3 w-3 mr-1" />
                {isRTL ? "اختيار الغرفة" : "Room Selection"}
              </Badge>
            )}
            {!selectedSubActivity.needsRFC && !selectedSubActivity.needsHRS && !selectedSubActivity.needsMOP && !selectedSubActivity.needsMHV && !selectedSubActivity.needsRoomSelection && (
              <span className="text-xs text-blue-600">
                {isRTL ? "لا توجد متطلبات إضافية" : "No additional requirements"}
              </span>
            )}
          </div>
        </div>
      )}

      {getHelpText() && (
        <p className="text-xs text-gray-500">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FieldRenderer({
  field,
  value,
  onChange,
  formValues,
  disabled = false,
  error,
}: FieldRendererProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [dynamicOptions, setDynamicOptions] = useState<FieldOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Get localized text
  const getLabel = () => (isRTL && field.nameAr ? field.nameAr : field.name);
  const getPlaceholder = () =>
    isRTL && field.placeholderAr ? field.placeholderAr : field.placeholder;
  const getHelpText = () =>
    isRTL && field.helpTextAr ? field.helpTextAr : field.helpText;
  const getOptionLabel = (opt: FieldOption) =>
    isRTL && opt.labelAr ? opt.labelAr : opt.label;

  // Check if field should be visible based on conditions
  const isVisible = (): boolean => {
    if (!field.showCondition) return true;

    const { field: condField, operator = "equals", value: condValue } = field.showCondition;
    const fieldValue = formValues[condField];

    switch (operator) {
      case "equals":
        return fieldValue === condValue;
      case "not_equals":
        return fieldValue !== condValue;
      case "in":
        return Array.isArray(condValue) && condValue.includes(fieldValue);
      case "not_empty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      case "empty":
        return fieldValue === undefined || fieldValue === null || fieldValue === "";
      default:
        return true;
    }
  };

  // Load dependent options when parent value changes
  useEffect(() => {
    if (field.optionsSource === "dependent" && field.dependsOnField) {
      const parentValue = formValues[field.dependsOnField];
      if (parentValue) {
        loadDependentOptions(parentValue);
      } else {
        setDynamicOptions([]);
      }
    }
  }, [field.dependsOnField, formValues]);

  const loadDependentOptions = async (parentValue: string) => {
    setIsLoadingOptions(true);
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Options would come from API
      setDynamicOptions([]);
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Get options to display
  const getOptions = (): FieldOption[] => {
    if (field.optionsSource === "dependent") {
      return dynamicOptions;
    }
    return field.options || [];
  };

  if (!isVisible()) return null;

  const baseInputClass = cn(
    "w-full",
    error && "border-red-500 focus:ring-red-500"
  );

  // Render based on field type
  switch (field.fieldType) {
    case "text":
    case "email":
    case "phone":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Input
            type={field.fieldType === "email" ? "email" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={baseInputClass}
            maxLength={field.validation?.maxLength}
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={baseInputClass}
            min={field.validation?.min}
            max={field.validation?.max}
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(baseInputClass, "min-h-[100px]")}
            maxLength={field.validation?.maxLength}
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "datetime":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Input
            type="datetime-local"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "dropdown":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <Select
            value={value || ""}
            onValueChange={onChange}
            disabled={disabled || isLoadingOptions}
          >
            <SelectTrigger className={baseInputClass}>
              <SelectValue placeholder={getPlaceholder() || t("common.select", "Select...")} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingOptions ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                getOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {getOptionLabel(opt)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "dropdown_multi":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <div className="border rounded-md p-3 space-y-2">
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.code}-${opt.value}`}
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, opt.value]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((v: string) => {
                const opt = getOptions().find((o) => o.value === v);
                return (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {opt ? getOptionLabel(opt) : v}
                    <button
                      type="button"
                      onClick={() => onChange(selectedValues.filter((sv: string) => sv !== v))}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "radio":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <RadioGroup
            value={value || ""}
            onValueChange={onChange}
            disabled={disabled}
            className="flex flex-wrap gap-4"
          >
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`${field.code}-${opt.value}`} />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.code}
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <Label
              htmlFor={field.code}
              className="text-sm font-medium cursor-pointer flex items-center gap-1"
            >
              {getLabel()}
              {field.isRequired && <span className="text-red-600">*</span>}
            </Label>
          </div>
          {getHelpText() && (
            <p className="text-xs text-gray-500 ml-6">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600 ml-6">{error}</p>}
        </div>
      );

    case "checkbox_group":
      const checkedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.code}-${opt.value}`}
                  checked={checkedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkedValues, opt.value]);
                    } else {
                      onChange(checkedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </div>
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "file":
    case "file_multi":
      const files = Array.isArray(value) ? value : value ? [value] : [];
      const isMulti = field.fieldType === "file_multi";
      const maxFiles = field.validation?.maxFiles || (isMulti ? 10 : 1);

      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0f62fe]/50 transition-colors">
            <input
              type="file"
              id={field.code}
              multiple={isMulti}
              accept={field.validation?.accept}
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                if (isMulti) {
                  onChange([...files, ...newFiles].slice(0, maxFiles));
                } else {
                  onChange(newFiles[0] || null);
                }
              }}
              disabled={disabled || files.length >= maxFiles}
              className="hidden"
            />
            <label
              htmlFor={field.code}
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {t("common.clickToUpload", "Click to upload")}
                {isMulti && ` (${files.length}/${maxFiles})`}
              </span>
              {field.validation?.accept && (
                <span className="text-xs text-gray-400">
                  {field.validation.accept}
                </span>
              )}
            </label>
          </div>
          {files.length > 0 && (
            <div className="space-y-2 mt-2">
              {files.map((file: File | string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm flex-1 truncate">
                    {typeof file === "string" ? file : file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        onChange(files.filter((_: any, i: number) => i !== index));
                      } else {
                        onChange(null);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "user_lookup":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
            {getLabel()}
            {field.isRequired && <span className="text-red-600">*</span>}
          </Label>
          <div className="relative">
            <Input
              type="text"
              value={value?.name || value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={getPlaceholder() || t("common.searchUser", "Search user...")}
              disabled={disabled}
              className={cn(baseInputClass, "pr-10")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              disabled={disabled}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );

    case "readonly":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase">
            {getLabel()}
          </Label>
          <Input
            type="text"
            value={value || field.defaultValue || ""}
            readOnly
            className="bg-gray-50"
          />
          {getHelpText() && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
        </div>
      );

    case "site_type":
      return (
        <SiteTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "zone_type":
      return (
        <ZoneTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "area_type":
      return (
        <AreaTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "activity_selector":
      return (
        <ActivitySelectorField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-600 uppercase">
            {getLabel()} (Unsupported: {field.fieldType})
          </Label>
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        </div>
      );
  }
}
