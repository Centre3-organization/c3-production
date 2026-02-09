import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronDown, ChevronUp, Copy, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { FieldRenderer } from "./FieldRenderer";

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
  filterByField?: string;
  validation?: any;
  showCondition?: any;
}

interface RepeatableSectionProps {
  sectionCode: string;
  sectionName: string;
  sectionNameAr?: string;
  fields: FormField[];
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  minItems?: number;
  maxItems?: number;
  disabled?: boolean;
  itemLabel?: string;
  itemLabelAr?: string;
  getItemSummary?: (item: Record<string, any>, index: number) => string;
}

export function RepeatableSection({
  sectionCode,
  sectionName,
  sectionNameAr,
  fields,
  items,
  onChange,
  minItems = 0,
  maxItems = 100,
  disabled = false,
  itemLabel,
  itemLabelAr,
  getItemSummary,
}: RepeatableSectionProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const getName = () => (isRTL && sectionNameAr ? sectionNameAr : sectionName);
  const getItemLabel = () => (isRTL && itemLabelAr ? itemLabelAr : itemLabel || "Item");

  // Create default item with default values from fields
  const createDefaultItem = (): Record<string, any> => {
    const item: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue) {
        item[field.code] = field.defaultValue;
      }
    });
    return item;
  };

  const handleAddItem = () => {
    if (items.length >= maxItems) return;
    const newItems = [...items, createDefaultItem()];
    onChange(newItems);
    setExpandedItems(new Set([...Array.from(expandedItems), newItems.length - 1]));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= minItems) return;
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    // Update expanded items indices
    const newExpanded = new Set<number>();
    expandedItems.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedItems(newExpanded);
  };

  const handleDuplicateItem = (index: number) => {
    if (items.length >= maxItems) return;
    const newItems = [...items];
    newItems.splice(index + 1, 0, { ...items[index] });
    onChange(newItems);
    setExpandedItems(new Set([...Array.from(expandedItems), index + 1]));
  };

  const handleFieldChange = (itemIndex: number, fieldCode: string, value: any) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [fieldCode]: value,
    };
    onChange(newItems);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getDefaultItemSummary = (item: Record<string, any>, index: number): string => {
    // Try to find a name-like field for summary
    const nameFields = ["full_name", "name", "title", "description", "material_type", "type"];
    for (const fieldCode of nameFields) {
      if (item[fieldCode]) {
        return String(item[fieldCode]);
      }
    }
    return `${getItemLabel()} ${index + 1}`;
  };

  // Sort fields by display order
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-2">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#2C2C2C]">{getName()}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length} / {maxItems}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled || items.length >= maxItems}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          {t("common.add", "Add")} {getItemLabel()}
        </Button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-8 text-center">
          <p className="text-[#6B6B6B] mb-4">
            {t("common.noItemsYet", "No {{item}} added yet", { item: getItemLabel().toLowerCase() })}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("common.addFirst", "Add first {{item}}", { item: getItemLabel().toLowerCase() })}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const summary = getItemSummary
              ? getItemSummary(item, index)
              : getDefaultItemSummary(item, index);

            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(index)}
              >
                <Card className={cn(
                  "transition-shadow",
                  isExpanded && "shadow-md border-[#5B2C93]/30"
                )}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-2 px-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-[#9CA3AF] cursor-grab" />
                        <div className="flex-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <CardTitle className="text-sm font-medium truncate">
                            {summary}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateItem(index);
                            }}
                            disabled={disabled || items.length >= maxItems}
                            title={t("common.duplicate", "Duplicate")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(index);
                            }}
                            disabled={disabled || items.length <= minItems}
                            title={t("common.remove", "Remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[#6B6B6B]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-3">
                      <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                        {sortedFields.map((field) => (
                          <div
                            key={field.id}
                            className={`col-span-12 md:col-span-${field.columnSpan || 6}`}
                            style={{
                              gridColumn: `span ${Math.min(field.columnSpan || 6, 12)} / span ${Math.min(field.columnSpan || 6, 12)}`,
                            }}
                          >
                            <FieldRenderer
                              field={field}
                              value={item[field.code]}
                              onChange={(value) => handleFieldChange(index, field.code, value)}
                              formValues={item}
                              disabled={disabled}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Min/max items hint */}
      {(minItems > 0 || maxItems < 100) && (
        <p className="text-xs text-[#6B6B6B]">
          {minItems > 0 && maxItems < 100
            ? t("common.itemsRange", "{{min}} to {{max}} items required", { min: minItems, max: maxItems })
            : minItems > 0
            ? t("common.minItems", "Minimum {{min}} items required", { min: minItems })
            : t("common.maxItems", "Maximum {{max}} items allowed", { max: maxItems })}
        </p>
      )}
    </div>
  );
}
