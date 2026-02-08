import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FioriEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * SAP Fiori-style Illustrated Empty State
 * - Centered layout with icon, title, description
 * - Optional CTA button
 */
export function FioriEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: FioriEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4 text-[#B0B0B0]">
        {icon}
      </div>
      <h3 className="text-base font-medium text-[#2C2C2C] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B6B6B] max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-[#5B2C93] hover:bg-[#3D1C5E]"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
