import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, QrCode, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface RecentTransaction {
  id: number;
  personName: string;
  decision: "allowed" | "denied";
  transactionType: string;
  createdAt: string;
}

export function CheckpointHome() {
  const [, setLocation] = useLocation();
  const [searchMethod, setSearchMethod] = useState<"qr" | "request_number" | "id_number" | "plate">("request_number");
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchMutation = trpc.checkpoint.searchRequest.useMutation();

  // Mock recent transactions
  const recentTransactions: RecentTransaction[] = [
    {
      id: 1,
      personName: "Ahmed Al-Rashid",
      decision: "allowed",
      transactionType: "person_entry",
      createdAt: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
    },
    {
      id: 2,
      personName: "Fatima Al-Dosari",
      decision: "denied",
      transactionType: "person_entry",
      createdAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
    },
    {
      id: 3,
      personName: "Mohammed Al-Otaibi",
      decision: "allowed",
      transactionType: "vehicle_entry",
      createdAt: new Date(Date.now() - 25 * 60000).toLocaleTimeString(),
    },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsSearching(true);
    try {
      await searchMutation.mutateAsync({
        method: searchMethod,
        value: searchValue,
      });
      setLocation(`/checkpoint/search?method=${searchMethod}&value=${encodeURIComponent(searchValue)}`);
    } catch (error) {
      alert("Search failed: " + (error as any).message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <CheckpointLayout title="Checkpoint Dashboard">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Search Section */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Search Request</h2>

            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Method Selector */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { value: "qr", label: "📱 QR Code", icon: QrCode },
                  { value: "request_number", label: "🔢 Request #", icon: Search },
                  { value: "id_number", label: "🆔 ID Number", icon: AlertCircle },
                  { value: "plate", label: "🚗 License Plate", icon: AlertCircle },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSearchMethod(method.value as any)}
                    className={`p-4 rounded-lg font-semibold transition-all ${
                      searchMethod === method.value
                        ? "bg-blue-600 text-white ring-2 ring-blue-400"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder={
                    searchMethod === "qr"
                      ? "Scan QR code..."
                      : searchMethod === "request_number"
                        ? "Enter request number (e.g., REQ-2026-001)"
                        : searchMethod === "id_number"
                          ? "Enter ID number"
                          : "Enter license plate"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-lg h-14 placeholder-slate-400"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isSearching || !searchValue.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8 text-lg"
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => setLocation("/checkpoint/unregistered")}
            className="bg-amber-600 hover:bg-amber-700 text-white h-20 text-lg font-bold"
          >
            📝 Log Unregistered Entry
          </Button>
          <Button
            onClick={() => setLocation("/checkpoint/fake-pass")}
            className="bg-red-600 hover:bg-red-700 text-white h-20 text-lg font-bold"
          >
            ⚠️ Report Fake Pass
          </Button>
          <Button
            onClick={() => setLocation("/checkpoint/watchlist")}
            className="bg-purple-600 hover:bg-purple-700 text-white h-20 text-lg font-bold"
          >
            👁️ View Watchlist
          </Button>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </h3>

            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {tx.decision === "allowed" ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{tx.personName}</div>
                      <div className="text-sm text-slate-400">{tx.transactionType.replace(/_/g, " ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold text-sm ${
                        tx.decision === "allowed" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {tx.decision.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-400">{tx.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* System Status */}
        <Alert className="mt-8 bg-blue-900 border-blue-700">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            System is online and operational. All features are available. Last sync: Just now
          </AlertDescription>
        </Alert>
      </div>
    </CheckpointLayout>
  );
}
