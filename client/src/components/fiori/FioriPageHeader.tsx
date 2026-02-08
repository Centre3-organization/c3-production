import { ReactNode } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FioriPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  count?: number;
  onBack?: () => void;
  onRefresh?: () => void;
  actions?: ReactNode;
}

/**
 * SAP Fiori-style Object Page Header
 * - Flat white background with bottom border
 * - Title + subtitle + optional item count
 * - Back navigation for detail/form pages
 * - Right-aligned action buttons
 */
export function FioriPageHeader({
  title,
  subtitle,
  icon,
  count,
  onBack,
  onRefresh,
  actions,
}: FioriPageHeaderProps) {
  return (
    <div className="bg-white border-b border-[#E0E0E0] -mx-6 -mt-6 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#6B6B6B] hover:text-[#5B2C93] hover:bg-[#E8DCF5]"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {icon && (
            <div className="h-9 w-9 rounded-lg bg-[#E8DCF5] flex items-center justify-center text-[#5B2C93]">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium text-[#2C2C2C] leading-7">{title}</h1>
              {count !== undefined && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[#E8DCF5] text-[#5B2C93] text-xs font-medium">
                  {count}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-[#6B6B6B] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-1.5 text-[#6B6B6B] border-[#E0E0E0] hover:border-[#5B2C93] hover:text-[#5B2C93]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
