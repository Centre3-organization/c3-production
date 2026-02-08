import { useState } from "react";
import { 
  ClipboardList, 
  Download, 
  Filter, 
  Calendar,
  User,
  Settings,
  FileText,
  Shield,
  Clock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AuditLogs() {
  const [dateRange, setDateRange] = useState("last30");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample audit log data
  const auditLogs = [
    { id: 1, user: "Mohsin Qureshi", action: "User Created", target: "John Smith", category: "user", timestamp: "2026-01-31 14:30:00", ip: "192.168.1.100" },
    { id: 2, user: "Abdullah Alzakari", action: "Role Updated", target: "Administrator", category: "role", timestamp: "2026-01-31 14:15:00", ip: "192.168.1.101" },
    { id: 3, user: "Dev Dev", action: "Request Approved", target: "REQ-2024-001", category: "request", timestamp: "2026-01-31 13:45:00", ip: "192.168.1.102" },
    { id: 4, user: "Talha Burney", action: "Site Created", target: "Riyadh DC4", category: "site", timestamp: "2026-01-31 12:30:00", ip: "192.168.1.103" },
    { id: 5, user: "Mohsin Qureshi", action: "Settings Updated", target: "System Settings", category: "settings", timestamp: "2026-01-31 11:00:00", ip: "192.168.1.100" },
    { id: 6, user: "Muhammad Shaykhu", action: "User Deactivated", target: "Old User", category: "user", timestamp: "2026-01-30 16:00:00", ip: "192.168.1.104" },
    { id: 7, user: "Abdullah Alzakari", action: "Workflow Created", target: "VIP Access Workflow", category: "workflow", timestamp: "2026-01-30 14:00:00", ip: "192.168.1.101" },
    { id: 8, user: "Dev Dev", action: "Alert Resolved", target: "SEC-001", category: "security", timestamp: "2026-01-30 10:30:00", ip: "192.168.1.102" },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "user":
        return <User className="h-4 w-4" />;
      case "role":
        return <Shield className="h-4 w-4" />;
      case "request":
        return <FileText className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      user: "bg-[#E8DCF5] text-[#5B2C93]",
      role: "bg-[#E8DCF5] text-[#5B2C93]",
      request: "bg-[#D1FAE5] text-[#059669]",
      site: "bg-[#FEF3C7] text-[#D97706]",
      settings: "bg-[#F5F5F5] text-[#2C2C2C]",
      workflow: "bg-[#E8DCF5] text-[#5B2C93]",
      security: "bg-[#FFE5E5] text-[#FF6B6B]",
    };
    return (
      <Badge className={`${colors[category] || "bg-[#F5F5F5] text-[#2C2C2C]"} hover:${colors[category] || "bg-[#F5F5F5]"}`}>
        <span className="flex items-center gap-1">
          {getCategoryIcon(category)}
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </span>
      </Badge>
    );
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return log.user.toLowerCase().includes(term) || 
             log.action.toLowerCase().includes(term) ||
             log.target.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Audit Logs</h1>
          <p className="text-[#6B6B6B] mt-1">Track all system activities and changes</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="last90">Last 90 days</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#5B2C93] hover:bg-[#5B2C93]">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input 
                placeholder="Search by user, action, or target..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>Showing {filteredLogs.length} entries</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-[#6B6B6B]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.timestamp}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.target}</TableCell>
                  <TableCell>{getCategoryBadge(log.category)}</TableCell>
                  <TableCell className="text-[#6B6B6B] font-mono text-sm">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
