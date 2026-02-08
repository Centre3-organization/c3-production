import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  itemCount?: number;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Standardized page header per centre3 brand guidelines:
 * - H1: 24px Medium (500), #2C2C2C
 * - Subtitle: 14px Regular, #6B6B6B
 * - 24px spacing to content below
 * - Actions right-aligned
 */
export function PageHeader({ title, subtitle, itemCount, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#6B6B6B] mt-1">{subtitle}</p>
          )}
          {typeof itemCount === "number" && (
            <p className="text-sm text-[#6B6B6B] mt-1">{itemCount} items</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
