import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  MapPin,
  Calendar,
  Users,
  Settings,
  Paperclip,
  ShieldCheck,
  Info,
  Package,
  Truck,
  AlertTriangle,
  List,
  Folder,
  Building,
  Zap,
  Server,
  CheckCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FieldRenderer } from "./FieldRenderer";
import { RepeatableSection } from "./RepeatableSection";
import { RepeatableSectionWithYakeen } from "./RepeatableSectionWithYakeen";

// Icon mapping for sections
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  "map-pin": MapPin,
  calendar: Calendar,
  users: Users,
  settings: Settings,
  paperclip: Paperclip,
  "shield-check": ShieldCheck,
  package: Package,
  truck: Truck,
  "alert-triangle": AlertTriangle,
  list: List,
  folder: Folder,
  building: Building,
  zap: Zap,
  server: Server,
  "check-circle": CheckCircle,
  star: Star,
  wrench: Settings,
  "file-text": FileText,
};

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
  options?: any[];
  optionsSource?: "static" | "api" | "dependent" | 
    "countries" | "regions" | "cities" | 
    "sites" | "zones" | "areas" | 
    "departments" | "groups" | "users" | "contractors" | 
    "request_types" | "approval_roles" | 
    "user_sites" | "user_groups" | "user_departments" | "user_profile" | "material_types";
  optionsApi?: string;
  dependsOnField?: string;
  filterByField?: string; // Field code to filter options by
  validation?: any;
  showCondition?: any;
}

interface FormSection {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  icon?: string;
  displayOrder: number;
  isRepeatable: boolean;
  minItems?: number;
  maxItems?: number;
  showCondition?: any;
  fields: FormField[];
  typeCode?: string;
  typeName?: string;
}

interface DynamicFormProps {
  sections: FormSection[];
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  activeSection?: string;
  onActiveSectionChange?: (sectionCode: string) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export function DynamicForm({
  sections,
  formData,
  onFormDataChange,
  activeSection,
  onActiveSectionChange,
  disabled = false,
  errors = {},
}: DynamicFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Group sections by type for combined forms
  const groupedSections = useMemo(() => {
    const groups: Record<string, FormSection[]> = {};
    sections.forEach((section) => {
      const key = section.typeCode || "common";
      if (!groups[key]) groups[key] = [];
      groups[key].push(section);
    });
    return groups;
  }, [sections]);

  // Flatten sections for tab navigation
  const flatSections = useMemo(() => {
    return sections.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [sections]);

  // Set initial active section
  const [currentSection, setCurrentSection] = useState(
    activeSection || flatSections[0]?.code || ""
  );

  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  const handleSectionChange = (sectionCode: string) => {
    setCurrentSection(sectionCode);
    onActiveSectionChange?.(sectionCode);
  };

  const getSectionName = (section: FormSection) => {
    return isRTL && section.nameAr ? section.nameAr : section.name;
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return FileText;
    return iconMap[iconName] || FileText;
  };

  // Check if section should be visible based on conditions
  const isSectionVisible = (section: FormSection): boolean => {
    if (!section.showCondition) return true;

    const { field, operator = "equals", value } = section.showCondition;
    const fieldValue = formData[field];

    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "in":
        return Array.isArray(value) && value.includes(fieldValue);
      case "not_empty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      case "empty":
        return fieldValue === undefined || fieldValue === null || fieldValue === "";
      default:
        return true;
    }
  };

  // Get visible sections
  const visibleSections = flatSections.filter(isSectionVisible);

  // Get current section data
  const currentSectionData = visibleSections.find((s) => s.code === currentSection);

  // Build a map of field dependencies for cascading clears
  const dependencyMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const allFields = flatSections.flatMap(s => s.fields);
    for (const f of allFields) {
      if (f.filterByField) {
        if (!map[f.filterByField]) map[f.filterByField] = [];
        if (!map[f.filterByField].includes(f.code)) {
          map[f.filterByField].push(f.code);
        }
      }
      if (f.dependsOnField && f.dependsOnField !== f.filterByField) {
        if (!map[f.dependsOnField]) map[f.dependsOnField] = [];
        if (!map[f.dependsOnField].includes(f.code)) {
          map[f.dependsOnField].push(f.code);
        }
      }
    }
    return map;
  }, [flatSections]);

  // Recursively collect all descendant field codes that should be cleared
  const getDescendants = (fieldCode: string, visited = new Set<string>()): string[] => {
    if (visited.has(fieldCode)) return [];
    visited.add(fieldCode);
    const children = dependencyMap[fieldCode] || [];
    const all: string[] = [...children];
    for (const child of children) {
      all.push(...getDescendants(child, visited));
    }
    return all;
  };

  // Handle field value change with cascading clear of dependent fields
  const handleFieldChange = (fieldCode: string, value: any) => {
    const updated: Record<string, any> = {
      ...formData,
      [fieldCode]: value,
    };
    // Clear all descendant fields when a parent value changes
    const descendants = getDescendants(fieldCode);
    for (const desc of descendants) {
      if (updated[desc] !== undefined && updated[desc] !== "" && updated[desc] !== null) {
        updated[desc] = "";
      }
    }
    onFormDataChange(updated);
  };

  // Handle repeatable section change
  const handleRepeatableChange = (sectionCode: string, items: Record<string, any>[]) => {
    onFormDataChange({
      ...formData,
      [sectionCode]: items,
    });
  };

  // Count errors per section
  const getSectionErrorCount = (section: FormSection): number => {
    let count = 0;
    if (section.isRepeatable) {
      // Check errors in repeatable items
      const items = formData[section.code] || [];
      items.forEach((item: any, index: number) => {
        section.fields.forEach((field) => {
          if (errors[`${section.code}[${index}].${field.code}`]) {
            count++;
          }
        });
      });
    } else {
      section.fields.forEach((field) => {
        if (errors[field.code]) {
          count++;
        }
      });
    }
    return count;
  };

  // Sort fields by display order
  const getSortedFields = (fields: FormField[]) => {
    return [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  };

  return (
    <div className="flex h-full">
      {/* Left Navigation Tabs (Vertical) */}
      <div className="w-64 bg-white border-r flex flex-col overflow-y-auto">
        <div className="p-4 border-b bg-[#F5F5F5]">
          <h3 className="font-medium text-[#2C2C2C] text-sm uppercase">
            {t("requests.sections", "Sections")}
          </h3>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {visibleSections.map((section) => {
            const Icon = getIcon(section.icon);
            const errorCount = getSectionErrorCount(section);
            const isActive = currentSection === section.code;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-[#E8DCF5] text-[#5B2C93] border-l-4 border-[#5B2C93]"
                    : "text-[#6B6B6B] hover:bg-[#F5F5F5] border-l-4 border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-[#5B2C93]" : "text-[#9CA3AF]"
                  )}
                />
                <span className="flex-1 text-left truncate">{getSectionName(section)}</span>
                {section.typeCode && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5",
                      isActive ? "border-[#5B2C93]/30" : "border-[#E0E0E0]"
                    )}
                  >
                    {section.typeCode.toUpperCase()}
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5">
                    {errorCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F5F5F5]">
        <div className="max-w-5xl mx-auto bg-white border shadow-sm rounded-sm min-h-[500px]">
          {currentSectionData ? (
            <>
              {/* Section Header */}
              <div className="px-6 py-4 border-b bg-[#F5F5F5] flex justify-between items-center">
                <h2 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                  {(() => {
                    const Icon = getIcon(currentSectionData.icon);
                    return <Icon className="h-5 w-5 text-[#5B2C93]" />;
                  })()}
                  {getSectionName(currentSectionData)}
                  {currentSectionData.typeCode && (
                    <Badge variant="outline" className="ml-2">
                      {currentSectionData.typeName || currentSectionData.typeCode.toUpperCase()}
                    </Badge>
                  )}
                </h2>
                <span className="text-xs text-[#6B6B6B] italic">
                  {t("common.requiredIndicator", "* Indicates mandatory field")}
                </span>
              </div>

              {/* Section Content */}
              <div className="p-6">
                {currentSectionData.isRepeatable ? (
                  // Use Yakeen-enabled component for visitor sections
                  currentSectionData.code === "visitors" ? (
                    <RepeatableSectionWithYakeen
                      sectionCode={currentSectionData.code}
                      sectionName={currentSectionData.name}
                      sectionNameAr={currentSectionData.nameAr}
                      fields={getSortedFields(currentSectionData.fields)}
                      items={formData[currentSectionData.code] || []}
                      onChange={(items) =>
                        handleRepeatableChange(currentSectionData.code, items)
                      }
                      minItems={currentSectionData.minItems}
                      maxItems={currentSectionData.maxItems}
                      disabled={disabled}
                      itemLabel={t("requests.visitor", "Visitor")}
                      enableYakeenVerification={true}
                    />
                  ) : (
                    <RepeatableSection
                      sectionCode={currentSectionData.code}
                      sectionName={currentSectionData.name}
                      sectionNameAr={currentSectionData.nameAr}
                      fields={getSortedFields(currentSectionData.fields)}
                      items={formData[currentSectionData.code] || []}
                      onChange={(items) =>
                        handleRepeatableChange(currentSectionData.code, items)
                      }
                      minItems={currentSectionData.minItems}
                      maxItems={currentSectionData.maxItems}
                      disabled={disabled}
                      itemLabel={
                        currentSectionData.code === "materials" || currentSectionData.code === "material_entry" || currentSectionData.code === "material_exit"
                          ? t("requests.material", "Material")
                          : currentSectionData.code === "method_statement"
                          ? t("requests.step", "Step")
                          : currentSectionData.code === "risk_assessment"
                          ? t("requests.risk", "Risk")
                          : currentSectionData.code === "affected_systems"
                          ? t("requests.system", "System")
                          : t("common.item", "Item")
                      }
                    />
                  )
                ) : (
                  <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                    {getSortedFields(currentSectionData.fields).map((field) => (
                      <div
                        key={field.id}
                        className={`col-span-12 md:col-span-${field.columnSpan || 6}`}
                        style={{
                          gridColumn: `span ${Math.min(field.columnSpan || 6, 12)} / span ${Math.min(field.columnSpan || 6, 12)}`,
                        }}
                      >
                        <FieldRenderer
                          field={field}
                          value={formData[field.code]}
                          onChange={(value) => handleFieldChange(field.code, value)}
                          formValues={formData}
                          disabled={disabled}
                          error={errors[field.code]}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#6B6B6B]">
              {t("requests.selectSection", "Select a section to begin")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export types for use in other components
export type { FormSection, FormField };
