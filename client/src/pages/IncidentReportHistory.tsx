import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Filter, BarChart3, TrendingUp } from "lucide-react";

interface IncidentReport {
  id: string;
  type: "denial" | "fake_pass" | "unregistered";
  date: string;
  time: string;
  personName: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "reported" | "investigating" | "resolved";
  supervisor: string;
}

export function IncidentReportHistory() {
  const [filterType, setFilterType] = useState<"all" | "denial" | "fake_pass" | "unregistered">("all");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "low" | "medium" | "high">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "reported" | "investigating" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Mock incident data
  const mockIncidents: IncidentReport[] = [
    {
      id: "1",
      type: "denial",
      date: "2026-02-19",
      time: "14:35",
      personName: "Ahmed Al-Rashid",
      reason: "Attempted unauthorized access with fake pass",
      severity: "high",
      status: "investigating",
      supervisor: "Mohammed Hassan",
    },
    {
      id: "2",
      type: "fake_pass",
      date: "2026-02-19",
      time: "12:15",
      personName: "Fatima Al-Dosari",
      reason: "Forged visitor pass detected",
      severity: "high",
      status: "reported",
      supervisor: "Sarah Al-Otaibi",
    },
    {
      id: "3",
      type: "unregistered",
      date: "2026-02-18",
      time: "16:45",
      personName: "Unknown Visitor",
      reason: "Walk-in without appointment",
      severity: "medium",
      status: "resolved",
      supervisor: "Ali Al-Shehri",
    },
    {
      id: "4",
      type: "denial",
      date: "2026-02-18",
      time: "10:20",
      personName: "Hassan Al-Qahtani",
      reason: "Access zone restricted",
      severity: "low",
      status: "resolved",
      supervisor: "Mohammed Hassan",
    },
    {
      id: "5",
      type: "fake_pass",
      date: "2026-02-17",
      time: "15:30",
      personName: "Unknown Person",
      reason: "Suspicious document presented",
      severity: "high",
      status: "investigating",
      supervisor: "Sarah Al-Otaibi",
    },
  ];

  // Filter incidents
  const filteredIncidents = mockIncidents.filter((incident) => {
    const matchesType = filterType === "all" || incident.type === filterType;
    const matchesSeverity = filterSeverity === "all" || incident.severity === filterSeverity;
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
    const matchesSearch =
      incident.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.reason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: mockIncidents.length,
    highSeverity: mockIncidents.filter((i) => i.severity === "high").length,
    investigating: mockIncidents.filter((i) => i.status === "investigating").length,
    resolved: mockIncidents.filter((i) => i.status === "resolved").length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "denial":
        return "🚫";
      case "fake_pass":
        return "⚠️";
      case "unregistered":
        return "❓";
      default:
        return "📋";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "denial":
        return "Denial Report";
      case "fake_pass":
        return "Fake Pass";
      case "unregistered":
        return "Unregistered Entry";
      default:
        return "Report";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-100 text-blue-800";
      case "investigating":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleExport = () => {
    // Create CSV data
    const headers = ["ID", "Type", "Date", "Time", "Person", "Reason", "Severity", "Status", "Supervisor"];
    const rows = filteredIncidents.map((incident) => [
      incident.id,
      getTypeLabel(incident.type),
      incident.date,
      incident.time,
      incident.personName,
      incident.reason,
      incident.severity,
      incident.status,
      incident.supervisor,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 font-poppins">📊 Incident Report History</h1>
            <p className="text-slate-600 font-poppins">View and analyze security incidents and denials</p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 font-poppins flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-2 border-slate-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1 font-poppins">{stats.total}</div>
              <div className="text-sm text-slate-600 font-poppins">Total Incidents</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-red-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1 font-poppins">{stats.highSeverity}</div>
              <div className="text-sm text-slate-600 font-poppins">🔴 High Severity</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1 font-poppins">{stats.investigating}</div>
              <div className="text-sm text-slate-600 font-poppins">Investigating</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-green-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1 font-poppins">{stats.resolved}</div>
              <div className="text-sm text-slate-600 font-poppins">✅ Resolved</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border-2 border-slate-200 p-6 shadow-md mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-poppins flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Search</label>
              <Input
                type="text"
                placeholder="Person name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
              >
                <option value="all">All Types</option>
                <option value="denial">🚫 Denial</option>
                <option value="fake_pass">⚠️ Fake Pass</option>
                <option value="unregistered">❓ Unregistered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
              >
                <option value="all">All Levels</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
              >
                <option value="all">All Status</option>
                <option value="reported">📋 Reported</option>
                <option value="investigating">🔍 Investigating</option>
                <option value="resolved">✅ Resolved</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterSeverity("all");
                  setFilterStatus("all");
                }}
                className="w-full bg-slate-400 hover:bg-slate-500 text-white font-bold font-poppins"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Incidents Table */}
        <Card className="bg-white border-2 border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Person</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Severity</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900 font-poppins">
                        <span className="mr-2">{getTypeIcon(incident.type)}</span>
                        {getTypeLabel(incident.type)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-poppins text-sm">
                        {incident.date} {incident.time}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-poppins">{incident.personName}</td>
                      <td className="px-6 py-4 text-slate-700 font-poppins text-sm">{incident.reason}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(
                            incident.severity
                          )} font-poppins`}
                        >
                          {incident.severity === "high" && "🔴 High"}
                          {incident.severity === "medium" && "🟡 Medium"}
                          {incident.severity === "low" && "🟢 Low"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            incident.status
                          )} font-poppins`}
                        >
                          {incident.status === "reported" && "📋 Reported"}
                          {incident.status === "investigating" && "🔍 Investigating"}
                          {incident.status === "resolved" && "✅ Resolved"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-poppins text-sm">{incident.supervisor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-600 font-poppins">
                      No incidents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Analytics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-2 border-slate-200 p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-poppins flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Incidents by Type
            </h3>
            <div className="space-y-3">
              {[
                { type: "Denial Reports", count: mockIncidents.filter((i) => i.type === "denial").length },
                { type: "Fake Pass", count: mockIncidents.filter((i) => i.type === "fake_pass").length },
                { type: "Unregistered Entry", count: mockIncidents.filter((i) => i.type === "unregistered").length },
              ].map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-slate-700 font-poppins">{item.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        style={{ width: `${(item.count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-slate-900 font-bold font-poppins w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white border-2 border-slate-200 p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-poppins flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { status: "Reported", count: mockIncidents.filter((i) => i.status === "reported").length },
                { status: "Investigating", count: mockIncidents.filter((i) => i.status === "investigating").length },
                { status: "Resolved", count: mockIncidents.filter((i) => i.status === "resolved").length },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-slate-700 font-poppins">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-emerald-600"
                        style={{ width: `${(item.count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-slate-900 font-bold font-poppins w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
