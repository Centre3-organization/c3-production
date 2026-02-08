import { useState } from "react";
import { 
  Shield, 
  Download, 
  Filter, 
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock
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
export default function SecurityReports() {
  const [dateRange, setDateRange] = useState("last30");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Sample stats - will be replaced with real data
  const criticalCount = 3;
  const highCount = 8;
  const resolvedCount = 45;
  const totalAlerts = 56;

  const stats = [
    { 
      title: "Total Alerts", 
      value: totalAlerts, 
      icon: ShieldAlert, 
      trend: "-15%",
      color: "text-[#5B2C93]",
      bgColor: "bg-[#E8DCF5]"
    },
    { 
      title: "Critical", 
      value: criticalCount, 
      icon: AlertTriangle, 
      trend: "-20%",
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FFE5E5]"
    },
    { 
      title: "High Priority", 
      value: highCount, 
      icon: Shield, 
      trend: "-10%",
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]"
    },
    { 
      title: "Resolved", 
      value: resolvedCount, 
      icon: ShieldCheck, 
      trend: "+25%",
      color: "text-[#059669]",
      bgColor: "bg-[#D1FAE5]"
    },
  ];

  // Sample security incidents
  const recentIncidents = [
    { id: "SEC-001", type: "Unauthorized Access Attempt", location: "Riyadh DC1 - Zone A", severity: "critical", status: "resolved", time: "2h ago" },
    { id: "SEC-002", type: "Badge Tailgating", location: "Jeddah DC2 - Main Entrance", severity: "high", status: "investigating", time: "4h ago" },
    { id: "SEC-003", type: "After-Hours Access", location: "Dammam DC3 - Server Room", severity: "medium", status: "resolved", time: "6h ago" },
    { id: "SEC-004", type: "Failed Authentication", location: "Riyadh DC1 - Zone B", severity: "low", status: "resolved", time: "8h ago" },
    { id: "SEC-005", type: "Perimeter Breach Alert", location: "Jeddah DC2 - Perimeter", severity: "critical", status: "resolved", time: "1d ago" },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-[#FFE5E5] text-[#FF6B6B] hover:bg-[#FFE5E5]">Critical</Badge>;
      case "high":
        return <Badge className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]">High</Badge>;
      case "medium":
        return <Badge className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]">Medium</Badge>;
      case "low":
        return <Badge className="bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-[#D1FAE5] text-[#059669] hover:bg-[#D1FAE5]">Resolved</Badge>;
      case "investigating":
        return <Badge className="bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]">Investigating</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Security Reports</h1>
          <p className="text-[#6B6B6B] mt-1">Monitor security incidents and alerts</p>
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
            <CardTitle className="text-lg">Incidents by Location</CardTitle>
            <CardDescription>Security incidents distribution across sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-[#9CA3AF]">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Incident Trends</CardTitle>
            <CardDescription>Security incidents over time</CardDescription>
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

      {/* Recent Incidents Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Security Incidents</CardTitle>
              <CardDescription>Latest security events and alerts</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.id}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell className="text-[#6B6B6B]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {incident.time}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
