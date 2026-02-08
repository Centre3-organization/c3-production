import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Star, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

// Sample reports data
const reportsData = [
  { id: 1, name: "Access Requests by Site", description: "Which sites have the most access requests?", folder: "Access Reports", createdBy: "System", createdOn: "2026-01-15", type: "access" },
  { id: 2, name: "Monthly Visitor Trends", description: "How many visitors per month by category?", folder: "Access Reports", createdBy: "System", createdOn: "2026-01-15", type: "access" },
  { id: 3, name: "Security Alerts by Severity", description: "Which alerts need immediate attention?", folder: "Security Reports", createdBy: "System", createdOn: "2026-01-15", type: "security" },
  { id: 4, name: "Pending Approvals Summary", description: "How many approvals are pending by stage?", folder: "Approval Reports", createdBy: "System", createdOn: "2026-01-15", type: "approval" },
  { id: 5, name: "User Activity Log", description: "What actions have users performed recently?", folder: "Audit Reports", createdBy: "System", createdOn: "2026-01-15", type: "audit" },
  { id: 6, name: "Zone Access Frequency", description: "Which zones are accessed most frequently?", folder: "Access Reports", createdBy: "System", createdOn: "2026-01-15", type: "access" },
  { id: 7, name: "Contractor Compliance Report", description: "Are contractors meeting access requirements?", folder: "Compliance Reports", createdBy: "System", createdOn: "2026-01-15", type: "compliance" },
  { id: 8, name: "Card Issuance Summary", description: "How many cards issued by type and status?", folder: "Card Reports", createdBy: "System", createdOn: "2026-01-15", type: "cards" },
];

export default function Reports() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");

  const filteredReports = useMemo(() => {
    return reportsData.filter((report) => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = folderFilter === "all" || report.type === folderFilter;
      return matchesSearch && matchesFolder;
    });
  }, [searchQuery, folderFilter]);

  const folders = useMemo(() => {
    const unique = Array.from(new Set(reportsData.map(r => r.type)));
    return unique;
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (folderFilter !== "all") chips.push({ key: "folder", label: `Category: ${folderFilter}`, onRemove: () => setFolderFilter("all") });
    return chips;
  }, [folderFilter]);

  const columns: FioriColumn<typeof reportsData[0]>[] = useMemo(() => [
    {
      key: "name",
      header: "Report Name",
      render: (r) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#5B2C93]" />
          <span className="font-medium text-[#5B2C93]">{r.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => <span className="text-sm text-[#6B6B6B]">{r.description}</span>,
    },
    {
      key: "folder",
      header: "Category",
      render: (r) => (
        <FioriStatusBadge
          status={r.type === "access" ? "info" : r.type === "security" ? "warning" : r.type === "audit" ? "success" : "pending"}
          label={r.folder}
          showDot={false}
        />
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (r) => <span className="text-sm text-[#6B6B6B]">{r.createdBy}</span>,
    },
    {
      key: "createdOn",
      header: "Created On",
      render: (r) => <span className="text-sm text-[#6B6B6B]">{new Date(r.createdOn).toLocaleDateString("en-US")}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      width: "120px",
      render: (r) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedReport(r.id); }}>
            <Eye className="h-4 w-4 text-[#5B2C93]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toast.info("Export feature coming soon"); }}>
            <Download className="h-4 w-4 text-[#6B6B6B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toast.info("Subscribed to report"); }}>
            <Star className="h-4 w-4 text-[#6B6B6B]" />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-0">
      <FioriPageHeader
        title="Reports"
        subtitle="View and manage system reports and analytics"
        icon={<BarChart3 className="h-5 w-5" />}
        count={filteredReports.length}
      />

      <FioriFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reports..."
        activeFilters={activeFilterChips}
        onClearAll={() => setFolderFilter("all")}
        filters={
          <div className="flex gap-1">
            <Button variant={folderFilter === "all" ? "default" : "ghost"} size="sm"
              className={`h-8 text-xs ${folderFilter === "all" ? "bg-[#5B2C93] text-white hover:bg-[#3D1C5E]" : "text-[#6B6B6B]"}`}
              onClick={() => setFolderFilter("all")}>All</Button>
            {folders.map((f) => (
              <Button key={f} variant={folderFilter === f ? "default" : "ghost"} size="sm"
                className={`h-8 text-xs ${folderFilter === f ? "bg-[#5B2C93] text-white hover:bg-[#3D1C5E]" : "text-[#6B6B6B]"}`}
                onClick={() => setFolderFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</Button>
            ))}
          </div>
        }
      />

      <FioriTable
        columns={columns}
        data={filteredReports}
        isLoading={false}
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedReport(r.id)}
        emptyIcon={<BarChart3 className="h-10 w-10" />}
        emptyTitle="No reports found"
        emptyDescription="Try adjusting your search or filter criteria."
        footerInfo={`Showing ${filteredReports.length} of ${reportsData.length} reports`}
      />

      {/* Coming Soon Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#E8DCF5] rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-[#5B2C93]" />
              </div>
              <DialogTitle>Coming Soon</DialogTitle>
              <p className="text-sm text-[#6B6B6B] mt-2">
                This report is currently under development. Check back soon for detailed analytics and insights.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSelectedReport(null)} className="w-full bg-[#5B2C93] hover:bg-[#3D1C5E]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
