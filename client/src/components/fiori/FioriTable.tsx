import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface FioriColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (item: T, index: number) => ReactNode;
}

interface FioriTableProps<T> {
  columns: FioriColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string | number;
  /** Optional function to add extra CSS classes to a row */
  rowClassName?: (item: T) => string;
  /** Info text shown in the table footer, e.g. "Showing 10 of 50 items" */
  footerInfo?: string;
}

/**
 * SAP Fiori-style Responsive Table
 * - Clean white container with subtle border
 * - Sticky header with uppercase labels
 * - Zebra-free rows with hover highlight
 * - Loading spinner and empty state built-in
 * - Footer with item count
 */
export function FioriTable<T>({
  columns,
  data,
  isLoading = false,
  emptyIcon,
  emptyTitle = "No data available",
  emptyDescription = "There are no items to display.",
  onRowClick,
  rowKey,
  rowClassName,
  footerInfo,
}: FioriTableProps<T>) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B2C93]" />
          <span className="ml-3 text-sm text-[#6B6B6B]">Loading...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#6B6B6B]">
          {emptyIcon && <div className="mb-3 opacity-40">{emptyIcon}</div>}
          <p className="text-base font-medium">{emptyTitle}</p>
          <p className="text-sm mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFAFA] hover:bg-[#FAFAFA] border-b border-[#E0E0E0]">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`font-medium text-[11px] uppercase tracking-wider text-[#6B6B6B] py-3 ${
                      col.width ? `w-[${col.width}]` : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={rowKey(item)}
                  className={`border-b border-[#F0F0F0] last:border-b-0 ${
                    onRowClick
                      ? "cursor-pointer hover:bg-[#F5F8FF]"
                      : "hover:bg-[#FAFAFA]"
                  } ${rowClassName ? rowClassName(item) : ""}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`py-3 text-sm ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {col.render(item, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer */}
          {footerInfo && (
            <div className="px-4 py-2.5 border-t border-[#E0E0E0] bg-[#FAFAFA]">
              <span className="text-xs text-[#6B6B6B]">{footerInfo}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
