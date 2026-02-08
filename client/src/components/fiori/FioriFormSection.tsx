import { ReactNode } from "react";

interface FioriFormSectionProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  /** Show mandatory field indicator */
  showMandatory?: boolean;
}

/**
 * SAP Fiori-style Form Section / Object Page Section
 * - Section header with icon and title
 * - Optional mandatory field indicator
 * - Clean white card with border
 */
export function FioriFormSection({
  title,
  icon,
  description,
  children,
  showMandatory = false,
}: FioriFormSectionProps) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-3.5 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#5B2C93]">{icon}</span>}
          <h3 className="text-sm font-medium text-[#2C2C2C] uppercase tracking-wide">
            {title}
          </h3>
          {description && (
            <span className="text-xs text-[#6B6B6B] ml-2">{description}</span>
          )}
        </div>
        {showMandatory && (
          <span className="text-xs text-[#6B6B6B] italic">
            <span className="text-[#DC2626]">*</span> Required field
          </span>
        )}
      </div>

      {/* Section Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
