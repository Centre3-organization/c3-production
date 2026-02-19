import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation, useSearch } from "wouter";

interface RequestDetails {
  id: number;
  requestNumber: string;
  visitorName: string;
  visitorIdNumber: string;
  visitorIdType: string;
  visitorPhotoUrl?: string;
  visitorCompany: string;
  requestType: string;
  hostName: string;
  hostDepartment: string;
  validFrom: string;
  validUntil: string;
  accessZones: string[];
  status: "approved" | "pending" | "expired" | "cancelled";
  specialInstructions?: string;
  vehicleRegistrationNumber?: string;
  vehicleType?: string;
}

export function CheckpointSearch() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [showDenialForm, setShowDenialForm] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [denialComments, setDenialComments] = useState("");

  // Mock request data
  const request: RequestDetails = {
    id: 1,
    requestNumber: "REQ-2026-001234",
    visitorName: "Ahmed Al-Rashid",
    visitorIdNumber: "1234567890",
    visitorIdType: "National ID",
    visitorPhotoUrl: "https://via.placeholder.com/200",
    visitorCompany: "Tech Solutions LLC",
    requestType: "Contractor Visit",
    hostName: "Mohammed Al-Otaibi",
    hostDepartment: "IT Department",
    validFrom: "2026-02-19 08:00",
    validUntil: "2026-02-19 17:00",
    accessZones: ["Zone A", "Zone B", "Server Room"],
    status: "approved",
    specialInstructions: "Must wear safety helmet. Requires escort in restricted areas.",
    vehicleRegistrationNumber: "ABC-123-CD",
    vehicleType: "Toyota Camry",
  };

  const isExpired = new Date(request.validUntil) < new Date();
  const isNotYetValid = new Date(request.validFrom) > new Date();

  const handleAllow = () => {
    // Mock allow action
    alert("Entry ALLOWED for " + request.visitorName);
    setLocation("/checkpoint");
  };

  const handleDeny = () => {
    if (!denialReason || !denialComments) {
      alert("Please select a reason and provide comments");
      return;
    }
    // Mock deny action
    alert("Entry DENIED - Incident logged");
    setLocation("/checkpoint");
  };

  return (
    <CheckpointLayout title="Request Verification">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => setLocation("/checkpoint")}
          variant="outline"
          className="mb-6 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        {/* Watchlist Alert */}
        {false && (
          <Alert className="mb-6 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              ⚠️ WARNING: This person is on the watchlist. Severity: HIGH. Reason: Repeat denial attempts
            </AlertDescription>
          </Alert>
        )}

        {/* Status Alert */}
        <Alert
          className={`mb-6 ${
            isExpired
              ? "bg-red-900 border-red-700"
              : isNotYetValid
                ? "bg-amber-900 border-amber-700"
                : request.status === "approved"
                  ? "bg-green-900 border-green-700"
                  : "bg-yellow-900 border-yellow-700"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription
            className={
              isExpired
                ? "text-red-200"
                : isNotYetValid
                  ? "text-amber-200"
                  : request.status === "approved"
                    ? "text-green-200"
                    : "text-yellow-200"
            }
          >
            {isExpired
              ? "❌ REQUEST EXPIRED - Entry should be DENIED"
              : isNotYetValid
                ? "⏰ Request not yet valid - Entry should be DENIED"
                : request.status === "approved"
                  ? "✅ REQUEST APPROVED - Entry may be allowed"
                  : "⏳ REQUEST PENDING - Verify with supervisor"}
          </AlertDescription>
        </Alert>

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Left Column - Visitor Info */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">👤 Visitor Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400">Name</div>
                <div className="font-semibold text-white">{request.visitorName}</div>
              </div>
              <div>
                <div className="text-slate-400">ID Type</div>
                <div className="font-semibold text-white">{request.visitorIdType}</div>
              </div>
              <div>
                <div className="text-slate-400">ID Number</div>
                <div className="font-semibold text-white font-mono">{request.visitorIdNumber}</div>
              </div>
              <div>
                <div className="text-slate-400">Company</div>
                <div className="font-semibold text-white">{request.visitorCompany}</div>
              </div>
              <div>
                <div className="text-slate-400">Request Type</div>
                <div className="font-semibold text-white">{request.requestType}</div>
              </div>
            </div>
          </Card>

          {/* Right Column - Host & Access Info */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🏢 Host & Access</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400">Host Name</div>
                <div className="font-semibold text-white">{request.hostName}</div>
              </div>
              <div>
                <div className="text-slate-400">Department</div>
                <div className="font-semibold text-white">{request.hostDepartment}</div>
              </div>
              <div>
                <div className="text-slate-400">Valid From</div>
                <div className="font-semibold text-white">{request.validFrom}</div>
              </div>
              <div>
                <div className="text-slate-400">Valid Until</div>
                <div className={`font-semibold ${isExpired ? "text-red-400" : "text-white"}`}>
                  {request.validUntil}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Access Zones</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.accessZones.map((zone) => (
                    <span key={zone} className="bg-blue-700 text-blue-100 px-2 py-1 rounded text-xs font-semibold">
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Special Instructions */}
        {request.specialInstructions && (
          <Card className="bg-amber-900 border-amber-700 p-4 mb-8">
            <div className="text-amber-200 font-semibold mb-2">📋 Special Instructions</div>
            <div className="text-amber-100">{request.specialInstructions}</div>
          </Card>
        )}

        {/* Vehicle Info (if applicable) */}
        {request.vehicleRegistrationNumber && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">🚗 Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">License Plate</div>
                <div className="font-semibold text-white font-mono text-lg">{request.vehicleRegistrationNumber}</div>
              </div>
              <div>
                <div className="text-slate-400">Vehicle Type</div>
                <div className="font-semibold text-white">{request.vehicleType}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Decision Section */}
        {!showDenialForm ? (
          <div className="flex gap-4 mb-8">
            <Button
              onClick={handleAllow}
              disabled={isExpired || isNotYetValid || request.status !== "approved"}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold h-16 text-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              ALLOW ENTRY
            </Button>
            <Button
              onClick={handleDeny}
              disabled={submitDenialMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold h-16 text-lg"
            >
              <XCircle className="w-5 h-5 mr-2" />
              {submitDenialMutation.isPending ? "Processing..." : "DENY ENTRY"}
            </Button>
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">❌ Denial Report (Mandatory)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Denial Reason *</label>
                <select
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded"
                >
                  <option value="">Select a reason...</option>
                  <option value="request_not_found">Request not found in system</option>
                  <option value="request_expired">Request expired</option>
                  <option value="wrong_date_time">Wrong date/time</option>
                  <option value="fake_pass">Suspected fake pass</option>
                  <option value="escort_not_present">Escort not present</option>
                  <option value="safety_violation">Safety violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Comments (Mandatory) *</label>
                <textarea
                  value={denialComments}
                  onChange={(e) => setDenialComments(e.target.value)}
                  placeholder="Provide detailed reason for denial (minimum 20 characters)..."
                  className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded h-24"
                  minLength={20}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeny}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Submit Denial Report
                </Button>
                <Button
                  onClick={() => setShowDenialForm(false)}
                  variant="outline"
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </CheckpointLayout>
  );
}
