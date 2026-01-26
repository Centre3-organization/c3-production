import { useTranslation } from "react-i18next";
import { ClipboardCheck, Wrench, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RequestCategory {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  typeCount?: number;
  types?: Array<{
    id: number;
    code: string;
    name: string;
    nameAr?: string;
    shortCode?: string;
  }>;
}

interface CategorySelectorProps {
  categories: RequestCategory[];
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number) => void;
  disabled?: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "clipboard-check": ClipboardCheck,
  wrench: Wrench,
};

export function CategorySelector({
  categories,
  selectedCategoryId,
  onCategorySelect,
  disabled = false,
}: CategorySelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const getCategoryName = (category: RequestCategory) => {
    return isRTL && category.nameAr ? category.nameAr : category.name;
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return ClipboardCheck;
    return iconMap[iconName] || ClipboardCheck;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {t("requests.selectCategory", "Select a request category to begin")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const Icon = getIcon(category.icon);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              disabled={disabled}
              className={cn(
                "relative flex items-start gap-4 p-5 rounded-lg border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-[#0f62fe] bg-[#e5f6ff] shadow-md"
                  : "border-gray-200 bg-white hover:border-[#0f62fe]/50 hover:shadow-sm",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-[#0f62fe]" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isSelected ? "text-white" : "text-gray-600"
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "font-bold text-base",
                      isSelected ? "text-[#0043ce]" : "text-gray-800"
                    )}
                  >
                    {getCategoryName(category)}
                  </h3>
                  {isSelected && (
                    <Badge className="bg-[#0f62fe] text-white text-xs">
                      {t("common.selected", "Selected")}
                    </Badge>
                  )}
                </div>

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
                        className={cn(
                          "text-xs",
                          isSelected
                            ? "border-[#0f62fe]/30 text-[#0043ce]"
                            : "border-gray-300 text-gray-600"
                        )}
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
                  "flex-shrink-0 h-5 w-5 transition-transform",
                  isSelected ? "text-[#0f62fe] translate-x-1" : "text-gray-400",
                  isRTL && "rotate-180"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
