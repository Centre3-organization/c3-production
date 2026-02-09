import { ReactNode } from "react";

type StatusType =
  | "active"
  | "inactive"
  | "maintenance"
  | "offline"
  | "pending"
  | "pending_approval"
  | "pending_l1"
  | "pending_manual"
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "completed"
  | "in_progress"
  | "draft"
  | "open"
  | "supervised"
  | "restricted"
  | "prohibited"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "info"
  | "warning"
  | "success"
  | "error";

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  // Operational statuses
  active: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  inactive: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]", dot: "bg-[#B0B0B0]" },
  maintenance: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  offline: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", dot: "bg-[#FF6B6B]" },

  // Workflow statuses
  draft: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]", dot: "bg-[#B0B0B0]" },
  pending: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  pending_approval: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  pending_l1: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  pending_manual: { bg: "bg-[#E8DCF5]", text: "text-[#5B2C93]", dot: "bg-[#5B2C93]" },
  pending_review: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  in_progress: { bg: "bg-[#E8DCF5]", text: "text-[#5B2C93]", dot: "bg-[#5B2C93]" },
  approved: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  completed: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  rejected: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", dot: "bg-[#FF6B6B]" },
  cancelled: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]", dot: "bg-[#B0B0B0]" },
  expired: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]", dot: "bg-[#B0B0B0]" },
  need_clarification: { bg: "bg-[#FEF3C7]", text: "text-[#B45309]", dot: "bg-[#F59E0B]" },

  // Security levels
  low: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  medium: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  high: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", dot: "bg-[#FF6B6B]" },
  critical: { bg: "bg-[#FFE5E5]", text: "text-[#991B1B]", dot: "bg-[#DC2626]" },

  // Access policies
  open: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  supervised: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  restricted: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", dot: "bg-[#FF6B6B]" },
  prohibited: { bg: "bg-[#FFE5E5]", text: "text-[#991B1B]", dot: "bg-[#DC2626]" },

  // Semantic
  info: { bg: "bg-[#E8DCF5]", text: "text-[#5B2C93]", dot: "bg-[#5B2C93]" },
  warning: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]", dot: "bg-[#FFB84D]" },
  success: { bg: "bg-[#E8F9F8]", text: "text-[#0D9488]", dot: "bg-[#4ECDC4]" },
  error: { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]", dot: "bg-[#FF6B6B]" },
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  maintenance: "Maintenance",
  offline: "Offline",
  draft: "Draft",
  pending: "Pending",
  pending_approval: "Pending Approval",
  pending_l1: "Pending L1",
  pending_manual: "Pending Manual",
  pending_review: "Pending Review",
  in_progress: "In Progress",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
  need_clarification: "Need Clarification",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  open: "Open",
  supervised: "Supervised",
  restricted: "Restricted",
  prohibited: "Prohibited",
  info: "Info",
  warning: "Warning",
  success: "Success",
  error: "Error",
};

interface FioriStatusBadgeProps {
  status: string;
  /** Override the displayed label */
  label?: string;
  /** Show a leading dot indicator */
  showDot?: boolean;
  /** Custom icon to show instead of dot */
  icon?: ReactNode;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * SAP Fiori-style Status Indicator / Semantic Badge
 * - Colored background with matching text
 * - Optional leading dot or icon
 * - Consistent sizing across the app
 */
export function FioriStatusBadge({
  status,
  label,
  showDot = true,
  icon,
  size = "sm",
}: FioriStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const style = statusStyles[normalizedStatus] || statusStyles.info;
  const displayLabel = label || statusLabels[normalizedStatus] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bg} ${style.text} ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {icon ? (
        icon
      ) : showDot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      ) : null}
      {displayLabel}
    </span>
  );
}
