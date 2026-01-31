import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  BarChart3, 
  Shield, 
  ClipboardList, 
  History,
  Clock,
  Folder,
  Star,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";

// Report categories for left sidebar
const reportCategories = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "created", label: "Created by Me", icon: FileText },
  { id: "private", label: "Private Reports", icon: Star },
  { id: "public", label: "Public Reports", icon: Users },
  { id: "all", label: "All Reports", icon: BarChart3 },
];

const reportFolders = [
  { id: "all-folders", label: "All Folders", icon: Folder },
  { id: "created-folders", label: "Created by Me", icon: FileText },
  { id: "shared", label: "Shared with Me", icon: Users },
];

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
  const [selectedCategory, setSelectedCategory] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  const handleReportClick = (reportId: number) => {
    setSelectedReport(reportId);
  };

  const filteredReports = reportsData.filter(report => 
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Report Categories */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Reports Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Reports</h2>
        </div>
        
        {/* Categories */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            {reportCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary/10 text-primary border-l-4 border-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100 border-l-4 border-transparent"
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </button>
            ))}
          </nav>

          {/* Folders Section */}
          <div className="px-4 py-3 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Folders</h3>
          </div>
          <nav className="py-2">
            {reportFolders.map((folder) => (
              <button
                key={folder.id}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border-l-4 border-transparent transition-colors"
              >
                <folder.icon className="h-4 w-4" />
                {folder.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reports</p>
              <h1 className="text-xl font-semibold text-gray-900">
                {reportCategories.find(c => c.id === selectedCategory)?.label || "Recent"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{filteredReports.length} items</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
              <Button variant="outline" className="gap-2">
                <Folder className="h-4 w-4" />
                New Folder
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleReportClick(report.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-primary hover:underline font-medium">
                        {report.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
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
                    <td className="px-6 py-4 text-sm text-gray-600">
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
                        <Star className="h-4 w-4 text-gray-400" />
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                This report is currently under development. Check back soon for detailed analytics and insights.
              </p>
              <Button onClick={() => setSelectedReport(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
