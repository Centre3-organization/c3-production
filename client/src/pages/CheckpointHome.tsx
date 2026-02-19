import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, QrCode, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

interface RecentTransaction {
  id: number;
  personName: string;
  transactionType: string;
  createdAt: string;
}

export function CheckpointHome() {
  const [, setLocation] = useLocation();
  const [searchMethod, setSearchMethod] = useState<"qr" | "request_number" | "id_number" | "plate">("request_number");
  const [searchValue, setSearchValue] = useState("");

  // Mock recent transactions
  const recentTransactions: RecentTransaction[] = [
    {
      id: 1,
      personName: "Ahmed Al-Rashid",
      transactionType: "Entry Allowed",
      createdAt: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
    },
    {
      id: 2,
      personName: "Fatima Al-Dosari",
      transactionType: "Entry Denied",
      createdAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
    },
    {
      id: 3,
      personName: "Mohammed Al-Otaibi",
      transactionType: "Entry Allowed",
      createdAt: new Date(Date.now() - 25 * 60000).toLocaleTimeString(),
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    // Navigate to search page with parameters
    setLocation(`/checkpoint/search?method=${searchMethod}&value=${encodeURIComponent(searchValue)}`);
  };

  return (
    <CheckpointLayout title="Checkpoint Dashboard">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 font-poppins">Search Request</h2>
          
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Search Method
                  </label>
                  <select
                    value={searchMethod}
                    onChange={(e) => setSearchMethod(e.target.value as any)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
                  >
                    <option value="request_number">Request Number</option>
                    <option value="id_number">ID Number</option>
                    <option value="qr">QR Code</option>
                    <option value="plate">License Plate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Search Value
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter search value..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-12 font-poppins text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Request
              </Button>
            </form>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => alert("Unregistered entry form coming soon")}
              className="bg-blue-600 hover:bg-blue-700 text-white h-20 text-lg font-bold font-poppins"
            >
              👤 Unregistered Entry
            </Button>
            <Button
              onClick={() => alert("Fake pass reporting coming soon")}
              className="bg-red-600 hover:bg-red-700 text-white h-20 text-lg font-bold font-poppins"
            >
              ⚠️ Report Fake Pass
            </Button>
            <Button
              onClick={() => alert("Watchlist feature coming soon")}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-20 text-lg font-poppins"
            >
              📋 View Watchlist
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white border-2 border-slate-200 shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600" />
              Recent Activity
            </h2>

            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-4">
                    {transaction.transactionType.includes("Allowed") ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900 font-poppins">{transaction.personName}</div>
                      <div className="text-sm text-slate-600">{transaction.transactionType}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">{transaction.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </CheckpointLayout>
  );
}
