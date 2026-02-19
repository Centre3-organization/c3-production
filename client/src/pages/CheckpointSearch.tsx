import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Clock, Camera } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { CameraCapture } from "@/components/CameraCapture";

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
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const logTransactionMutation = trpc.checkpoint.logTransaction.useMutation();
  const submitDenialMutation = trpc.checkpoint.submitDenialReport.useMutation();

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

  const handleCapturePhoto = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setShowCamera(false);
  };

  const handleAllow = async () => {
    try {
      await logTransactionMutation.mutateAsync({
        checkpointId: 1,
        requestId: request.id,
        visitorName: request.visitorName,
        visitorIdNumber: request.visitorIdNumber,
        transactionType: "person_entry",
        decision: "allowed",
        guardId: 1,
        notes: "Entry allowed after verification",
      });
      alert("Entry ALLOWED for " + request.visitorName);
      setLocation("/checkpoint");
    } catch (error) {
      alert("Failed to log transaction: " + (error as any).message);
    }
  };

  const handleDeny = async () => {
    if (!denialReason || !denialComments) {
      alert("Please select a reason and provide comments");
      return;
    }
    try {
      await submitDenialMutation.mutateAsync({
        checkpointId: 1,
        transactionId: 1,
        visitorName: request.visitorName,
        visitorIdNumber: request.visitorIdNumber,
        denialReason: denialReason as any,
        comments: denialComments,
        guardId: 1,
      });
      alert("Entry DENIED - Incident logged");
      setLocation("/checkpoint");
    } catch (error) {
      alert("Failed to submit denial: " + (error as any).message);
    }
  };

  return (
    <CheckpointLayout title="Request Verification">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => setLocation("/checkpoint")}
          className="mb-6 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold font-poppins"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        {/* Watchlist Alert */}
        {false && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ⚠️ WARNING: This person is on the watchlist. Severity: HIGH. Reason: Repeat denial attempts
            </AlertDescription>
          </Alert>
        )}

        {/* Status Alert */}
        <Alert
          className={`mb-6 border-2 ${
            isExpired
              ? "bg-red-100 border-red-300"
              : isNotYetValid
                ? "bg-amber-100 border-amber-300"
                : request.status === "approved"
                  ? "bg-green-100 border-green-300"
                  : "bg-yellow-100 border-yellow-300"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription
            className={
              isExpired
                ? "text-red-800"
                : isNotYetValid
                  ? "text-amber-800"
                  : request.status === "approved"
                    ? "text-green-800"
                    : "text-yellow-800"
            }
          >
            {isExpired
              ? "❌ Request has EXPIRED"
              : isNotYetValid
                ? "⏰ Request is not yet valid"
                : request.status === "approved"
                  ? "✅ Request is APPROVED"
                  : "⚠️ Request status: " + request.status}
          </AlertDescription>
        </Alert>

        {/* Visitor Information with Photo */}
        <Card className="bg-white border-2 border-purple-200 p-6 mb-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Visitor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 font-poppins">Name</div>
                  <div className="text-lg font-semibold text-slate-900 font-poppins">{request.visitorName}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 font-poppins">ID Number</div>
                  <div className="text-lg font-semibold text-slate-900 font-poppins">{request.visitorIdNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 font-poppins">ID Type</div>
                  <div className="text-lg font-semibold text-slate-900 font-poppins">{request.visitorIdType}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 font-poppins">Company</div>
                  <div className="text-lg font-semibold text-slate-900 font-poppins">{request.visitorCompany}</div>
                </div>
              </div>
            </div>
            <div>
              {capturedPhoto ? (
                <div className="flex flex-col gap-2">
                  <img
                    src={capturedPhoto}
                    alt="Captured visitor photo"
                    className="w-full h-40 object-cover rounded-lg border-2 border-green-300"
                  />
                  <Button
                    onClick={() => setShowCamera(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm font-poppins flex items-center justify-center gap-1"
                  >
                    <Camera className="w-4 h-4" />
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-40 flex flex-col items-center justify-center gap-2 font-poppins"
                >
                  <Camera className="w-8 h-8" />
                  <span>Capture Photo</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Request Details */}
        <Card className="bg-white border-2 border-slate-200 p-6 mb-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Request Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-600 font-poppins">Request Number</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.requestNumber}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 font-poppins">Request Type</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.requestType}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 font-poppins">Host Name</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.hostName}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 font-poppins">Department</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.hostDepartment}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 font-poppins">Valid From</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.validFrom}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 font-poppins">Valid Until</div>
              <div className="text-lg font-semibold text-slate-900 font-poppins">{request.validUntil}</div>
            </div>
          </div>
          {request.specialInstructions && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm font-semibold text-blue-900 font-poppins">Special Instructions:</div>
              <div className="text-blue-800 font-poppins">{request.specialInstructions}</div>
            </div>
          )}
        </Card>

        {/* Decision Section */}
        {!showDenialForm ? (
          <div className="flex gap-4 mb-8">
            <Button
              onClick={handleAllow}
              disabled={logTransactionMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold h-16 text-lg font-poppins"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {logTransactionMutation.isPending ? "Processing..." : "ALLOW ENTRY"}
            </Button>
            <Button
              onClick={() => setShowDenialForm(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-16 text-lg font-poppins"
            >
              <XCircle className="w-5 h-5 mr-2" />
              DENY ENTRY
            </Button>
          </div>
        ) : (
          <Card className="bg-white border-2 border-red-200 p-6 mb-8 shadow-md">
            <h3 className="text-lg font-bold text-red-900 mb-4 font-poppins">❌ Denial Report (Mandatory)</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Denial Reason *
                </label>
                <select
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-slate-900 font-poppins"
                >
                  <option value="">Select a reason...</option>
                  <option value="request_not_found">Request Not Found</option>
                  <option value="request_expired">Request Expired</option>
                  <option value="wrong_date_time">Wrong Date/Time</option>
                  <option value="fake_pass">Fake Pass</option>
                  <option value="escort_not_present">Escort Not Present</option>
                  <option value="safety_violation">Safety Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Comments (min. 20 characters) *
                </label>
                <textarea
                  value={denialComments}
                  onChange={(e) => setDenialComments(e.target.value)}
                  placeholder="Provide detailed reason for denial..."
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-slate-900 placeholder-slate-400 font-poppins h-24"
                />
                <div className="text-xs text-slate-600 mt-1 font-poppins">
                  {denialComments.length}/20 characters
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleDeny}
                disabled={submitDenialMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold h-14 text-lg font-poppins"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {submitDenialMutation.isPending ? "Submitting..." : "SUBMIT DENIAL"}
              </Button>
              <Button
                onClick={() => {
                  setShowDenialForm(false);
                  setDenialReason("");
                  setDenialComments("");
                }}
                className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-14 text-lg font-poppins"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
          title="Capture Visitor Photo"
        />
      )}
    </CheckpointLayout>
  );
}
