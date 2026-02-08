import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RequestType {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  shortCode?: string;
  description?: string;
  isExclusive: boolean;
  maxDurationDays?: number;
}

interface TypeCombinationRules {
  [typeCode: string]: {
    exclusive?: boolean;
    canCombine?: string[];
    disables?: string[];
  };
}

interface TypeSelectorProps {
  types: RequestType[];
  selectedTypeIds: number[];
  onSelectionChange: (typeIds: number[]) => void;
  allowMultiple: boolean;
  combinationRules?: TypeCombinationRules | null;
  disabled?: boolean;
}

export function TypeSelector({
  types,
  selectedTypeIds,
  onSelectionChange,
  allowMultiple,
  combinationRules,
  disabled = false,
}: TypeSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get disabled types based on current selection
  const disabledTypes = useMemo(() => {
    if (!combinationRules || selectedTypeIds.length === 0) return new Set<string>();

    const disabled = new Set<string>();
    
    selectedTypeIds.forEach((typeId) => {
      const type = types.find((t) => t.id === typeId);
      if (!type) return;
      
      const rules = combinationRules[type.code];
      if (rules?.disables) {
        rules.disables.forEach((code) => disabled.add(code));
      }
      
      // If exclusive type is selected, disable all others
      if (rules?.exclusive || type.isExclusive) {
        types.forEach((t) => {
          if (t.id !== typeId) disabled.add(t.code);
        });
      }
    });

    return disabled;
  }, [selectedTypeIds, types, combinationRules]);

  // Check if a type can be combined with current selection
  const canCombineWith = (typeCode: string): boolean => {
    if (!combinationRules || selectedTypeIds.length === 0) return true;
    
    // Check if any selected type allows combining with this type
    for (const typeId of selectedTypeIds) {
      const type = types.find((t) => t.id === typeId);
      if (!type) continue;
      
      const rules = combinationRules[type.code];
      if (rules?.canCombine?.includes(typeCode)) {
        return true;
      }
    }
    
    return false;
  };

  const handleTypeClick = (type: RequestType) => {
    if (disabled) return;
    
    const isSelected = selectedTypeIds.includes(type.id);
    const isDisabled = disabledTypes.has(type.code);
    
    if (isDisabled && !isSelected) return;
    
    if (isSelected) {
      // Deselect
      onSelectionChange(selectedTypeIds.filter((id) => id !== type.id));
    } else {
      // Select
      if (!allowMultiple || type.isExclusive || combinationRules?.[type.code]?.exclusive) {
        // Exclusive type - replace selection
        onSelectionChange([type.id]);
      } else {
        // Multiple selection allowed
        onSelectionChange([...selectedTypeIds, type.id]);
      }
    }
  };

  const getTypeName = (type: RequestType) => {
    return isRTL && type.nameAr ? type.nameAr : type.name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
        <Info className="h-4 w-4" />
        <span>
          {allowMultiple
            ? t("requests.selectOneOrMoreTypes", "Select one or more permit types")
            : t("requests.selectRequestType", "Select a request type")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((type) => {
          const isSelected = selectedTypeIds.includes(type.id);
          const isDisabled = disabledTypes.has(type.code) && !isSelected;
          const canCombine = !isDisabled && canCombineWith(type.code);

          return (
            <TooltipProvider key={type.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleTypeClick(type)}
                    disabled={disabled || isDisabled}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200",
                      "min-h-[100px] text-center",
                      isSelected
                        ? "border-[#5B2C93] bg-[#D1FAE5] shadow-md"
                        : isDisabled
                        ? "border-[#E0E0E0] bg-[#F5F5F5] opacity-50 cursor-not-allowed"
                        : "border-[#E0E0E0] bg-white hover:border-[#5B2C93]/50 hover:shadow-sm cursor-pointer"
                    )}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="h-5 w-5 rounded-full bg-[#5B2C93] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Type short code badge */}
                    {type.shortCode && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "mb-2 font-medium text-xs",
                          isSelected
                            ? "bg-[#5B2C93] text-white border-[#5B2C93]"
                            : "bg-[#F5F5F5] text-[#2C2C2C]"
                        )}
                      >
                        {type.shortCode}
                      </Badge>
                    )}

                    {/* Type name */}
                    <span
                      className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-[#3D1C5E]" : "text-[#2C2C2C]"
                      )}
                    >
                      {getTypeName(type)}
                    </span>

                    {/* Exclusive indicator */}
                    {(type.isExclusive || combinationRules?.[type.code]?.exclusive) && (
                      <span className="text-xs text-[#D97706] mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {t("requests.exclusiveType", "Exclusive")}
                      </span>
                    )}

                    {/* Max duration */}
                    {type.maxDurationDays && (
                      <span className="text-xs text-[#6B6B6B] mt-1">
                        {t("requests.maxDays", "Max {{days}} days", {
                          days: type.maxDurationDays,
                        })}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{getTypeName(type)}</p>
                  {type.description && (
                    <p className="text-sm text-[#6B6B6B] mt-1">{type.description}</p>
                  )}
                  {isDisabled && (
                    <p className="text-sm text-[#D97706] mt-1">
                      {t(
                        "requests.typeDisabledBySelection",
                        "Cannot be combined with current selection"
                      )}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Selected types summary */}
      {selectedTypeIds.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-[#6B6B6B]">
            {t("requests.selectedTypes", "Selected:")}
          </span>
          {selectedTypeIds.map((typeId) => {
            const type = types.find((t) => t.id === typeId);
            if (!type) return null;
            return (
              <Badge
                key={typeId}
                variant="secondary"
                className="bg-[#5B2C93] text-white"
              >
                {type.shortCode || getTypeName(type)}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
