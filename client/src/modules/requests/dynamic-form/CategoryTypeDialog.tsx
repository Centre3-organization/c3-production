import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Wrench,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface RequestCategory {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  allowMultipleTypes?: boolean;
  typeCombinationRules?: TypeCombinationRules | null;
  types?: RequestType[];
}

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

interface CategoryTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: RequestCategory[];
  loadingCategories?: boolean;
  onConfirm: (categoryId: number, typeIds: number[]) => void;
  initialCategoryId?: number | null;
  initialTypeIds?: number[];
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "clipboard-check": ClipboardCheck,
  wrench: Wrench,
};

export function CategoryTypeDialog({
  open,
  onOpenChange,
  categories,
  loadingCategories = false,
  onConfirm,
  initialCategoryId,
  initialTypeIds,
}: CategoryTypeDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Dialog state
  const [step, setStep] = useState<"category" | "type">(
    initialCategoryId ? "type" : "category"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId ?? null
  );
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>(
    initialTypeIds ?? []
  );

  // Get selected category
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

  // Get types for selected category
  const types = selectedCategory?.types || [];

  // Get combination rules
  const combinationRules = selectedCategory?.typeCombinationRules || null;
  const allowMultiple = selectedCategory?.allowMultipleTypes || false;

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

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("category");
      setSelectedCategoryId(null);
      setSelectedTypeIds([]);
    }
    onOpenChange(newOpen);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeIds([]);
    setStep("type");
  };

  // Handle type click
  const handleTypeClick = (type: RequestType) => {
    const isSelected = selectedTypeIds.includes(type.id);
    const isDisabled = disabledTypes.has(type.code);

    if (isDisabled && !isSelected) return;

    if (isSelected) {
      setSelectedTypeIds(selectedTypeIds.filter((id) => id !== type.id));
    } else {
      if (!allowMultiple || type.isExclusive || combinationRules?.[type.code]?.exclusive) {
        setSelectedTypeIds([type.id]);
      } else {
        setSelectedTypeIds([...selectedTypeIds, type.id]);
      }
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedCategoryId && selectedTypeIds.length > 0) {
      onConfirm(selectedCategoryId, selectedTypeIds);
      handleOpenChange(false);
    }
  };

  // Handle back
  const handleBack = () => {
    setStep("category");
    setSelectedTypeIds([]);
  };

  const getCategoryName = (category: RequestCategory) => {
    return isRTL && category.nameAr ? category.nameAr : category.name;
  };

  const getTypeName = (type: RequestType) => {
    return isRTL && type.nameAr ? type.nameAr : type.name;
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return ClipboardCheck;
    return iconMap[iconName] || ClipboardCheck;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {step === "category"
                ? t("requests.selectCategory", "Select Request Category")
                : t("requests.selectTypes", "Select Request Type(s)")}
            </DialogTitle>
            {step === "type" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back", "Back")}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Category Selection */}
          {step === "category" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t("requests.selectCategoryHint", "Select a request category to begin")}
              </p>

              {loadingCategories ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
                </div>
              ) : categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const Icon = getIcon(category.icon);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        className={cn(
                          "relative flex items-start gap-4 p-5 rounded-lg border-2 transition-all duration-200 text-left",
                          "border-gray-200 bg-white hover:border-[#0f62fe]/50 hover:shadow-sm"
                        )}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-gray-100">
                          <Icon className="h-6 w-6 text-gray-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-800">
                            {getCategoryName(category)}
                          </h3>

                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}

                          {/* Types preview */}
                          {category.types && category.types.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {category.types.slice(0, 4).map((type) => (
                                <Badge
                                  key={type.id}
                                  variant="outline"
                                  className="text-xs border-gray-300 text-gray-600"
                                >
                                  {type.shortCode || type.name}
                                </Badge>
                              ))}
                              {category.types.length > 4 && (
                                <Badge variant="outline" className="text-xs text-gray-500">
                                  +{category.types.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight
                          className={cn(
                            "flex-shrink-0 h-5 w-5 text-gray-400",
                            isRTL && "rotate-180"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>{t("requests.noCategories", "No categories available")}</p>
                </div>
              )}
            </div>
          )}

          {/* Type Selection */}
          {step === "type" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>
                  {allowMultiple
                    ? t("requests.selectOneOrMoreTypes", "Select one or more permit types")
                    : t("requests.selectRequestType", "Select a request type")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {types.map((type) => {
                  const isSelected = selectedTypeIds.includes(type.id);
                  const isDisabled = disabledTypes.has(type.code) && !isSelected;

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeClick(type)}
                      disabled={isDisabled}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200",
                        "min-h-[100px] text-center",
                        isSelected
                          ? "border-[#0f62fe] bg-[#e5f6ff] shadow-md"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 bg-white hover:border-[#0f62fe]/50 hover:shadow-sm cursor-pointer"
                      )}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="h-5 w-5 rounded-full bg-[#0f62fe] flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Type short code badge */}
                      {type.shortCode && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "mb-2 font-bold text-xs",
                            isSelected
                              ? "bg-[#0f62fe] text-white border-[#0f62fe]"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {type.shortCode}
                        </Badge>
                      )}

                      {/* Type name */}
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-[#0043ce]" : "text-gray-800"
                        )}
                      >
                        {getTypeName(type)}
                      </span>

                      {/* Exclusive indicator */}
                      {(type.isExclusive || combinationRules?.[type.code]?.exclusive) && (
                        <span className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t("requests.exclusiveType", "Exclusive")}
                        </span>
                      )}

                      {/* Max duration */}
                      {type.maxDurationDays && (
                        <span className="text-xs text-gray-500 mt-1">
                          {t("requests.maxDays", "Max {{days}} days", {
                            days: type.maxDurationDays,
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected types summary */}
              {selectedTypeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <span className="text-sm text-gray-600">
                    {t("requests.selectedTypes", "Selected:")}
                  </span>
                  {selectedTypeIds.map((typeId) => {
                    const type = types.find((t) => t.id === typeId);
                    if (!type) return null;
                    return (
                      <Badge
                        key={typeId}
                        variant="secondary"
                        className="bg-[#0f62fe] text-white"
                      >
                        {type.shortCode || getTypeName(type)}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "type" && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedTypeIds.length === 0}
              className="bg-[#0f62fe] hover:bg-[#0043ce] gap-2"
            >
              {t("common.continue", "Continue")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
