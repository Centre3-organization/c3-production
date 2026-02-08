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
        return <CheckCircle2 className="h-4 w-4 text-[#059669]" />;
      case "error":
        return <XCircle className="h-4 w-4 text-[#FF6B6B]" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-[#D97706]" />;
      default:
        return <FileText className="h-4 w-4 text-[#5B2C93]" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      approved: "bg-[#D1FAE5] text-[#059669]",
      rejected: "bg-[#FFE5E5] text-[#FF6B6B]",
      created: "bg-[#E8DCF5] text-[#5B2C93]",
      updated: "bg-[#FEF3C7] text-[#D97706]",
      resolved: "bg-[#E8DCF5] text-[#5B2C93]",
      deleted: "bg-[#F5F5F5] text-[#2C2C2C]",
    };
    return (
      <Badge className={`${colors[action] || "bg-[#F5F5F5] text-[#2C2C2C]"} hover:${colors[action] || "bg-[#F5F5F5]"}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Activity History</h1>
          <p className="text-[#6B6B6B] mt-1">View timeline of all user activities</p>
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
            Export History
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
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
            <h3 className="text-sm font-medium text-[#6B6B6B] mb-4">{group.date}</h3>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  {group.activities.map((activity, index) => (
                    <div key={activity.id} className="p-4 hover:bg-[#F5F5F5] transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 bg-[#E8DCF5]">
                          <AvatarFallback className="bg-[#E8DCF5] text-[#5B2C93] text-sm font-medium">
                            {activity.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[#2C2C2C]">{activity.user}</span>
                            {getActionBadge(activity.action)}
                            <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                            <span className="text-[#6B6B6B]">{activity.target}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-[#6B6B6B]">
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
