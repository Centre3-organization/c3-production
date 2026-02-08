import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Star, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample reports data
const reportsData = [
  { 
    id: 1, 
    name: "Access Requests by Site", 
    description: "Which sites have the most access requests?",
    folder: "Access Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "access"
  },
  { 
    id: 2, 
    name: "Monthly Visitor Trends", 
    description: "How many visitors per month by category?",
    folder: "Access Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "access"
  },
  { 
    id: 3, 
    name: "Security Alerts by Severity", 
    description: "Which alerts need immediate attention?",
    folder: "Security Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "security"
  },
  { 
    id: 4, 
    name: "Pending Approvals Summary", 
    description: "How many approvals are pending by stage?",
    folder: "Approval Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "approval"
  },
  { 
    id: 5, 
    name: "User Activity Log", 
    description: "What actions have users performed recently?",
    folder: "Audit Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "audit"
  },
  { 
    id: 6, 
    name: "Zone Access Frequency", 
    description: "Which zones are accessed most frequently?",
    folder: "Access Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "access"
  },
  { 
    id: 7, 
    name: "Contractor Compliance Report", 
    description: "Are contractors meeting access requirements?",
    folder: "Compliance Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "compliance"
  },
  { 
    id: 8, 
    name: "Card Issuance Summary", 
    description: "How many cards issued by type and status?",
    folder: "Card Reports",
    createdBy: "System",
    createdOn: "2026-01-15",
    type: "cards"
  },
];

export default function Reports() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reportsData.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReportClick = (reportId: number) => {
    setSelectedReport(reportId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header - same pattern as all other pages */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Reports</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            View and manage system reports and analytics.
          </p>
        </div>
      </div>

      {/* Search Bar - same pattern as Approvals/Requests */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B0B0]" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-[#6B6B6B]">{filteredReports.length} items</p>
      </div>

      {/* Reports Table - using shadcn Table component for consistency */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead className="w-[60px]">Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow
                key={report.id}
                className="cursor-pointer"
                onClick={() => handleReportClick(report.id)}
              >
                <TableCell>
                  <span className="text-[#5B2C93] hover:underline font-medium">
                    {report.name}
                  </span>
                </TableCell>
                <TableCell className="text-[#6B6B6B]">
                  {report.description}
                </TableCell>
                <TableCell>
                  <span className="text-[#5B2C93] text-sm">
                    {report.folder}
                  </span>
                </TableCell>
                <TableCell className="text-[#6B6B6B] text-sm">
                  {report.createdBy}
                </TableCell>
                <TableCell className="text-[#6B6B6B] text-sm">
                  {new Date(report.createdOn).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Star className="h-4 w-4 text-[#B0B0B0]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Coming Soon Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-[#E8DCF5] rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-[#5B2C93]" />
            </div>
            <h2 className="text-xl font-medium text-[#2C2C2C] mb-2">Coming Soon</h2>
            <p className="text-[#6B6B6B] mb-6">
              This report is currently under development. Check back soon for detailed analytics and insights.
            </p>
            <Button onClick={() => setSelectedReport(null)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
