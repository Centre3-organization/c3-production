import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FioriFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilters?: FilterChip[];
  onClearAll?: () => void;
  /** Extra content on the right side of the filter bar */
  trailing?: ReactNode;
}

/**
 * SAP Fiori-style Filter Bar
 * - Horizontal bar with search + filter dropdowns
 * - Active filter chips below with clear-all
 * - Sits between page header and data table
 */
export function FioriFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  activeFilters = [],
  onClearAll,
  trailing,
}: FioriFilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-3">
      {/* Filter Row */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B0B0]" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 bg-[#F5F5F5] border-[#E0E0E0] focus:bg-white text-sm"
            />
          </div>

          {/* Separator */}
          {filters && <div className="h-6 w-px bg-[#E0E0E0]" />}

          {/* Filter Controls */}
          {filters}

          {/* Trailing */}
          {trailing && (
            <>
              <div className="flex-1" />
              {trailing}
            </>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-xs text-[#6B6B6B] font-medium">Filtered by:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5] text-xs h-6"
            >
              {filter.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-[#3D1C5E]"
                onClick={filter.onRemove}
              />
            </Badge>
          ))}
          {onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs text-[#6B6B6B] hover:text-[#5B2C93]"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
