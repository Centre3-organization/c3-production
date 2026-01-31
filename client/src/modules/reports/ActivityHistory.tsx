import { useState } from "react";
import { 
  History, 
  Download, 
  Filter, 
  Calendar,
  User,
  Clock,
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActivityHistory() {
  const [dateRange, setDateRange] = useState("last30");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample activity data grouped by date
  const activityGroups = [
    {
      date: "Today",
      activities: [
        { id: 1, user: "Mohsin Qureshi", initials: "MQ", action: "approved", target: "Access Request REQ-2024-001", time: "2 hours ago", status: "success" },
        { id: 2, user: "Abdullah Alzakari", initials: "AA", action: "created", target: "New workflow 'VIP Access'", time: "4 hours ago", status: "info" },
        { id: 3, user: "Dev Dev", initials: "DD", action: "updated", target: "Site settings for Riyadh DC1", time: "5 hours ago", status: "info" },
      ]
    },
    {
      date: "Yesterday",
      activities: [
        { id: 4, user: "Talha Burney", initials: "TB", action: "rejected", target: "Access Request REQ-2024-002", time: "1 day ago", status: "error" },
        { id: 5, user: "Muhammad Shaykhu", initials: "MS", action: "resolved", target: "Security Alert SEC-001", time: "1 day ago", status: "success" },
        { id: 6, user: "Mohsin Qureshi", initials: "MQ", action: "created", target: "New user 'John Smith'", time: "1 day ago", status: "info" },
        { id: 7, user: "Abdullah Alzakari", initials: "AA", action: "updated", target: "Role permissions for 'Administrator'", time: "1 day ago", status: "warning" },
      ]
    },
    {
      date: "This Week",
      activities: [
        { id: 8, user: "Dev Dev", initials: "DD", action: "approved", target: "Access Request REQ-2024-003", time: "3 days ago", status: "success" },
        { id: 9, user: "Talha Burney", initials: "TB", action: "created", target: "New zone 'Server Room B'", time: "4 days ago", status: "info" },
        { id: 10, user: "Muhammad Shaykhu", initials: "MS", action: "updated", target: "Shift schedule for Security Team", time: "5 days ago", status: "info" },
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      created: "bg-blue-100 text-blue-700",
      updated: "bg-amber-100 text-amber-700",
      resolved: "bg-purple-100 text-purple-700",
      deleted: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={`${colors[action] || "bg-gray-100 text-gray-700"} hover:${colors[action] || "bg-gray-100"}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
          <p className="text-gray-500 mt-1">View timeline of all user activities</p>
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
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search activities..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {activityGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-sm font-semibold text-gray-500 mb-4">{group.date}</h3>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  {group.activities.map((activity, index) => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 bg-purple-100">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-medium">
                            {activity.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{activity.user}</span>
                            {getActionBadge(activity.action)}
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{activity.target}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusIcon(activity.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">
          Load More Activities
        </Button>
      </div>
    </div>
  );
}
