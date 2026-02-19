import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search, Plus, Trash2, Edit2, Eye, Shield } from "lucide-react";

interface WatchlistEntry {
  id: string;
  type: "person" | "vehicle" | "company";
  name: string;
  identifier: string;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  addedDate: string;
  status: "active" | "archived";
  incidents: number;
}

export function WatchlistDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "person" | "vehicle" | "company">("all");
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("active");
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock watchlist data
  const mockWatchlist: WatchlistEntry[] = [
    {
      id: "1",
      type: "person",
      name: "Ahmed Al-Rashid",
      identifier: "1234567890",
      riskLevel: "high",
      reason: "Attempted unauthorized access with fake pass",
      addedDate: "2026-02-15",
      status: "active",
      incidents: 3,
    },
    {
      id: "2",
      type: "vehicle",
      name: "Silver BMW X5",
      identifier: "ABC-1234",
      riskLevel: "medium",
      reason: "Unauthorized parking in restricted zone",
      addedDate: "2026-02-10",
      status: "active",
      incidents: 2,
    },
    {
      id: "3",
      type: "company",
      name: "Tech Solutions Ltd",
      identifier: "TSL-2024",
      riskLevel: "low",
      reason: "Pending security clearance",
      addedDate: "2026-02-01",
      status: "active",
      incidents: 1,
    },
    {
      id: "4",
      type: "person",
      name: "Fatima Al-Dosari",
      identifier: "9876543210",
      riskLevel: "high",
      reason: "Attempted theft of sensitive documents",
      addedDate: "2026-01-20",
      status: "archived",
      incidents: 5,
    },
  ];

  // Filter watchlist
  const filteredWatchlist = mockWatchlist.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesRisk = filterRisk === "all" || entry.riskLevel === filterRisk;
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;

    return matchesSearch && matchesType && matchesRisk && matchesStatus;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "person":
        return "👤";
      case "vehicle":
        return "🚗";
      case "company":
        return "🏢";
      default:
        return "📋";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 font-poppins">📋 Watchlist Management</h1>
            <p className="text-slate-600 font-poppins">Monitor flagged persons, vehicles, and companies</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-12 font-poppins flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add to Watchlist
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1 font-poppins">
                {mockWatchlist.filter((e) => e.status === "active").length}
              </div>
              <div className="text-sm text-slate-600 font-poppins">Active Entries</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-red-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1 font-poppins">
                {mockWatchlist.filter((e) => e.riskLevel === "high").length}
              </div>
              <div className="text-sm text-slate-600 font-poppins">High Risk</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-amber-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1 font-poppins">
                {mockWatchlist.reduce((sum, e) => sum + e.incidents, 0)}
              </div>
              <div className="text-sm text-slate-600 font-poppins">Total Incidents</div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-blue-200 p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1 font-poppins">
                {mockWatchlist.length}
              </div>
              <div className="text-sm text-slate-600 font-poppins">Total Entries</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border-2 border-slate-200 p-6 shadow-md mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-poppins">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Search</label>
              <Input
                type="text"
                placeholder="Name, ID, or plate..."
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
                <option value="person">Person</option>
                <option value="vehicle">Vehicle</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">Risk Level</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
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
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterRisk("all");
                  setFilterStatus("active");
                }}
                className="w-full bg-slate-400 hover:bg-slate-500 text-white font-bold font-poppins"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Watchlist Table */}
        <Card className="bg-white border-2 border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Entry</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Identifier</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Risk</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Incidents</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Added</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 font-poppins">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatchlist.length > 0 ? (
                  filteredWatchlist.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 font-poppins">
                        <span className="mr-2">{getTypeIcon(entry.type)}</span>
                        {entry.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-poppins">{entry.identifier}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(
                            entry.riskLevel
                          )} font-poppins`}
                        >
                          {entry.riskLevel === "high" && "🔴 High"}
                          {entry.riskLevel === "medium" && "🟡 Medium"}
                          {entry.riskLevel === "low" && "🟢 Low"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-poppins text-sm">{entry.reason}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900 font-poppins">
                        {entry.incidents}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-poppins">{entry.addedDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowDetailModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 font-poppins"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 font-poppins"
                            size="sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 font-poppins"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-600 font-poppins">
                      No watchlist entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Modal */}
        {showDetailModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white border-2 border-purple-200 p-8 shadow-lg max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 font-poppins">
                {getTypeIcon(selectedEntry.type)} {selectedEntry.name}
              </h2>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Type</label>
                    <p className="text-lg text-slate-900 font-poppins capitalize">{selectedEntry.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Identifier</label>
                    <p className="text-lg text-slate-900 font-poppins">{selectedEntry.identifier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Risk Level</label>
                    <p className="text-lg text-slate-900 font-poppins capitalize">{selectedEntry.riskLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Status</label>
                    <p className="text-lg text-slate-900 font-poppins capitalize">{selectedEntry.status}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-600 font-poppins">Reason</label>
                  <p className="text-slate-900 font-poppins">{selectedEntry.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Added Date</label>
                    <p className="text-slate-900 font-poppins">{selectedEntry.addedDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 font-poppins">Total Incidents</label>
                    <p className="text-lg font-bold text-red-600 font-poppins">{selectedEntry.incidents}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-10 font-poppins"
                >
                  Close
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-10 font-poppins">
                  Edit Entry
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
