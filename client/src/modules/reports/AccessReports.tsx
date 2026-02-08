import { useState } from "react";
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  Building2,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { trpc } from "@/utils/trpc";

export default function AccessReports() {
  const [dateRange, setDateRange] = useState("last30");
  const [siteFilter, setSiteFilter] = useState("all");

  // Fetch stats
  const { data: requestStats } = trpc.requests.getStats.useQuery();

  const stats = [
    { 
      title: "Total Requests", 
      value: requestStats?.totalRequests || 0, 
      icon: FileText, 
      trend: "+12%",
      color: "text-[#5B2C93]",
      bgColor: "bg-[#E8DCF5]"
    },
    { 
      title: "Approved", 
      value: requestStats?.approved || 0, 
      icon: CheckCircle2, 
      trend: "+8%",
      color: "text-[#059669]",
      bgColor: "bg-[#D1FAE5]"
    },
    { 
      title: "Pending", 
      value: (requestStats?.pendingL1 || 0) + (requestStats?.pendingManual || 0) + (requestStats?.pendingApproval || 0), 
      icon: Clock, 
      trend: "-5%",
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]"
    },
    { 
      title: "Rejected", 
      value: requestStats?.rejected || 0, 
      icon: XCircle, 
      trend: "-2%",
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FFE5E5]"
    },
  ];

  // Sample data for the table
  const recentRequests = [
    { id: "REQ-001", requester: "John Smith", site: "Riyadh DC1", type: "Visitor Access", status: "approved", date: "2026-01-31" },
    { id: "REQ-002", requester: "Sarah Johnson", site: "Jeddah DC2", type: "Contractor Entry", status: "pending", date: "2026-01-30" },
    { id: "REQ-003", requester: "Ahmed Ali", site: "Dammam DC3", type: "Equipment Delivery", status: "approved", date: "2026-01-30" },
    { id: "REQ-004", requester: "Maria Garcia", site: "Riyadh DC1", type: "Visitor Access", status: "rejected", date: "2026-01-29" },
    { id: "REQ-005", requester: "James Wilson", site: "Jeddah DC2", type: "Maintenance Work", status: "approved", date: "2026-01-29" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-[#D1FAE5] text-[#059669] hover:bg-[#D1FAE5]">Approved</Badge>;
      case "pending":
        return <Badge className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-[#FFE5E5] text-[#FF6B6B] hover:bg-[#FFE5E5]">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Access Reports</h1>
          <p className="text-[#6B6B6B] mt-1">Analyze access request patterns and trends</p>
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
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-[#5B2C93] hover:bg-[#5B2C93]">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B]">{stat.title}</p>
                  <p className="text-3xl font-medium mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 mr-1 ${stat.trend.startsWith('+') ? 'text-[#059669]' : 'text-[#FF6B6B]'}`} />
                    <span className={`text-sm ${stat.trend.startsWith('+') ? 'text-[#059669]' : 'text-[#FF6B6B]'}`}>
                      {stat.trend} vs last period
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Requests by Site</CardTitle>
            <CardDescription>Distribution of access requests across sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-[#9CA3AF]">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Request Trends</CardTitle>
            <CardDescription>Daily request volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-[#9CA3AF]">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Access Requests</CardTitle>
              <CardDescription>Latest requests across all sites</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.requester}</TableCell>
                  <TableCell>{request.site}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{request.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
