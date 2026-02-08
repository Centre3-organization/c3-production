import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleReportClick = (reportId: number) => {
    setSelectedReport(reportId);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0] px-6 py-4">
        <div>
          <p className="text-sm text-[#6B6B6B]">Reports</p>
          <h1 className="text-xl font-medium text-[#2C2C2C]">All Reports</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">{reportsData.length} items</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-[#E0E0E0] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Folder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Created On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportsData.map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                  onClick={() => handleReportClick(report.id)}
                >
                  <td className="px-6 py-4">
                    <span className="text-primary hover:underline font-medium">
                      {report.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B6B6B]">
                    {report.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary hover:underline text-sm">
                      {report.folder}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary hover:underline text-sm">
                      {report.createdBy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B6B6B]">
                    {new Date(report.createdOn).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Star className="h-4 w-4 text-[#B0B0B0]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coming Soon Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
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
