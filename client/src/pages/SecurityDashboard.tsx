import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle, User, Building2, MapPin, AlertTriangle } from "lucide-react";
import { trpc } from "@/utils/trpc";

export function SecurityDashboard() {
  const [, setLocation] = useLocation();
  const [visitorStats, setVisitorStats] = useState({
    expectedToday: 0,
    waitingCheckIn: 0,
    activeInside: 0,
  });

  // Fetch all requests
  const { data: response, isLoading } = trpc.requests.getAll.useQuery({});

  useEffect(() => {
    if (!isLoading && response?.requests) {
      const requests = response.requests as any[];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let expected = 0;
      let waiting = 0;
      let active = 0;

      requests.forEach((req) => {
        const reqDate = new Date(req.visitDate || req.createdAt);
        reqDate.setHours(0, 0, 0, 0);

        if (reqDate.getTime() === today.getTime()) {
          expected++;
          if (req.status === "approved" && !req.checkInTime) {
            waiting++;
          } else if (req.status === "checked_in") {
            active++;
          }
        }
      });

      setVisitorStats({
        expectedToday: expected,
        waitingCheckIn: waiting,
        activeInside: active,
      });
    }
  }, [isLoading, response]);

  const requests = response?.requests || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter requests for today
  const todayRequests = requests.filter((req: any) => {
    const reqDate = new Date(req.visitDate || req.createdAt);
    reqDate.setHours(0, 0, 0, 0);
    return reqDate.getTime() === today.getTime();
  });

  // Categorize visitors
  const expectedVisitors = todayRequests.filter((req: any) => req.status === "approved");
  const waitingVisitors = expectedVisitors.filter((req: any) => !req.checkInTime);
  const activeVisitors = todayRequests.filter((req: any) => req.status === "checked_in");

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return <Badge className="bg-red-500">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case "low":
        return <Badge className="bg-green-500">Low Risk</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const handleCheckIn = (visitorId: number) => {
    setLocation(`/checkpoint/search?method=request_number&value=${visitorId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Security Dashboard</h1>
          <p className="text-slate-600">Real-time visitor monitoring and checkpoint management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Expected Today */}
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Expected Today</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{visitorStats.expectedToday}</p>
              </div>
              <User className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </Card>

          {/* Waiting Check-In */}
          <Card className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Waiting Check-In</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{visitorStats.waitingCheckIn}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </Card>

          {/* Active Inside */}
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Inside</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{visitorStats.activeInside}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visitors Expected Today */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Visitors Expected Today</h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {expectedVisitors.length > 0 ? (
                expectedVisitors.map((visitor: any) => (
                  <div key={visitor.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{visitor.visitorName}</p>
                        <p className="text-sm text-slate-600">{visitor.company}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{visitor.accessZone || "Not specified"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {getRiskBadge(visitor.riskLevel)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">No visitors expected today</p>
              )}
            </div>
          </Card>

          {/* Visitors Waiting Check-In */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Waiting Check-In</h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {waitingVisitors.length > 0 ? (
                waitingVisitors.map((visitor: any) => (
                  <div key={visitor.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:border-yellow-400 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{visitor.visitorName}</p>
                        <p className="text-sm text-slate-600">{visitor.company}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>Arrived at {new Date(visitor.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(visitor.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Check-In
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">No visitors waiting</p>
              )}
            </div>
          </Card>

          {/* Active Visitors Inside */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Active Visitors Inside</h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeVisitors.length > 0 ? (
                activeVisitors.map((visitor: any) => (
                  <div key={visitor.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium">Visitor</p>
                        <p className="text-slate-900">{visitor.visitorName}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Company</p>
                        <p className="text-slate-900">{visitor.company}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Zone</p>
                        <p className="text-slate-900">{visitor.accessZone}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Duration Remaining</p>
                        <p className="text-slate-900">
                          {visitor.visitDuration ? `${visitor.visitDuration} hours` : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Materials</p>
                        <Badge className="bg-green-600">
                          {visitor.materialsVerified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-8">No active visitors inside</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
