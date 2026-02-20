import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock, User, Building2, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { trpc } from "@/utils/trpc";

export function CheckpointSearch() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const searchMethod = params.get("method") || "request_number";
  const searchValue = params.get("value") || "";

  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDenialForm, setShowDenialForm] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [denialComments, setDenialComments] = useState("");

  // Fetch all requests to find the matching one
  const { data: response, isLoading: isFetching } = trpc.requests.getAll.useQuery({});

  // Log transaction (allow entry)
  const logTransactionMutation = trpc.checkpoint.logTransaction.useMutation({
    onSuccess: () => {
      alert("Entry logged successfully");
      setLocation("/checkpoint");
    },
    onError: () => {
      alert("Failed to log transaction");
    },
  });

  // Submit denial report
  const submitDenialMutation = trpc.checkpoint.submitDenialReport.useMutation({
    onSuccess: () => {
      alert("Denial report submitted successfully");
      setLocation("/checkpoint");
    },
    onError: () => {
      alert("Failed to submit denial report");
    },
  });

  // Search for the request in the fetched data
  useEffect(() => {
    if (!isFetching && response?.requests) {
      setLoading(true);
      const requests = response.requests as any[];
      
      let foundRequest = null;

      // Search based on the selected method
      if (searchMethod === "request_number") {
        foundRequest = requests.find(
          (req) => req.requestNumber?.toLowerCase() === searchValue.toLowerCase()
        );
      } else if (searchMethod === "id_number") {
        foundRequest = requests.find(
          (req) => req.visitorIdNumber?.toLowerCase() === searchValue.toLowerCase()
        );
      } else if (searchMethod === "plate") {
        foundRequest = requests.find(
          (req) => req.vehicleLicensePlate?.toLowerCase() === searchValue.toLowerCase()
        );
      } else if (searchMethod === "qr") {
        foundRequest = requests.find(
          (req) => req.qrCode?.toLowerCase() === searchValue.toLowerCase()
        );
      }

      if (foundRequest) {
        setRequestDetails(foundRequest);
        setError("");
      } else {
        setError("Request not found. Please check the search value and try again.");
        setRequestDetails(null);
      }
      setLoading(false);
    }
  }, [isFetching, response, searchMethod, searchValue]);

  const handleAllowEntry = () => {
    if (!requestDetails) return;
    logTransactionMutation.mutate({
      checkpointId: 1, // Default checkpoint
      requestId: requestDetails.id,
      visitorName: requestDetails.visitorName,
      visitorIdNumber: requestDetails.visitorIdNumber || "",
      transactionType: "person_entry",
      decision: "allowed",
      guardId: 1, // Current guard ID
      notes: "Entry allowed at checkpoint",
    });
  };

  const handleDenyEntry = () => {
    if (!requestDetails) return;
    if (!denialReason.trim()) {
      alert("Please select a denial reason");
      return;
    }
    if (denialComments.length < 20) {
      alert("Comments must be at least 20 characters");
      return;
    }
    submitDenialMutation.mutate({
      checkpointId: 1, // Default checkpoint
      transactionId: Math.floor(Math.random() * 10000),
      visitorName: requestDetails.visitorName,
      visitorIdNumber: requestDetails.visitorIdNumber || "",
      denialReason: denialReason as any,
      comments: denialComments,
      photoUrl: "",
      guardId: 1, // Current guard ID
    });
  };

  const isExpired = requestDetails && new Date(requestDetails.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isNotYetValid = false; // Not applicable for current data structure
  const isApproved = requestDetails?.status === "approved";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            onClick={() => setLocation("/checkpoint")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-poppins">Checkpoint Verification</h1>
            <p className="text-gray-600">Request: {searchValue}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading || isFetching ? (
          <Card className="p-8 text-center">
            <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Searching for request...</p>
          </Card>
        ) : error ? (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900">Request Not Found</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        ) : requestDetails ? (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-lg border-l-4 ${
                isExpired
                  ? "bg-red-50 border-red-500 text-red-700"
                  : isNotYetValid
                  ? "bg-amber-50 border-amber-500 text-amber-700"
                  : isApproved
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "bg-blue-50 border-blue-500 text-blue-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {isExpired ? (
                  <XCircle size={20} />
                ) : isNotYetValid ? (
                  <Clock size={20} />
                ) : isApproved ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="font-semibold">
                  {isExpired
                    ? "Request Expired"
                    : isNotYetValid
                    ? "Request Not Yet Valid"
                    : isApproved
                    ? "Request Approved"
                    : "Request Pending Approval"}
                </span>
              </div>
            </div>

            {/* Visitor Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">Visitor Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-purple-600" />
                    <span className="text-sm text-gray-600">Name</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{requestDetails.visitorName || "Unknown"}</p>
                </div>
                {requestDetails.visitorEmail && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={18} className="text-purple-600" />
                      <span className="text-sm text-gray-600">Email</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{requestDetails.visitorEmail}</p>
                  </div>
                )}
                {requestDetails.visitorPhone && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={18} className="text-purple-600" />
                      <span className="text-sm text-gray-600">Phone</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{requestDetails.visitorPhone}</p>
                  </div>
                )}
                  {requestDetails.visitorIdNumber && (
                  <div>
                    <span className="text-sm text-gray-600">ID Number</span>
                    <p className="text-lg font-semibold text-gray-900">{requestDetails.visitorIdNumber}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Host Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">Host Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={18} className="text-purple-600" />
                    <span className="text-sm text-gray-600">Host Name</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{requestDetails.hostName || "Unknown"}</p>
                </div>
                {requestDetails.hostDepartment && (
                  <div>
                    <span className="text-sm text-gray-600">Department</span>
                    <p className="text-lg font-semibold text-gray-900">{requestDetails.hostDepartment}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Access Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">Access Details</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Purpose</span>
                  <p className="text-lg font-semibold text-gray-900">{requestDetails.purpose || "Not specified"}</p>
                </div>
                {requestDetails.accessZones && requestDetails.accessZones.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Access Zones</span>
                    <div className="flex flex-wrap gap-2">
                      {requestDetails.accessZones && requestDetails.accessZones.length > 0 ? (
                        requestDetails.accessZones.map((zone: any) => (
                          <Badge key={zone.id || zone} variant="secondary">
                            {typeof zone === "string" ? zone : zone.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500">No specific zones</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Created</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(requestDetails.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <p className="text-lg font-semibold">
                      <Badge variant={isApproved ? "default" : "secondary"}>
                        {requestDetails.status || "pending"}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vehicle Information (if applicable) */}
            {requestDetails.vehicleLicensePlate && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">Vehicle Information</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">License Plate</span>
                    <p className="text-lg font-semibold text-gray-900">{requestDetails.vehicleLicensePlate}</p>
                  </div>
                  {requestDetails.vehicleType && (
                    <div>
                      <span className="text-sm text-gray-600">Vehicle Type</span>
                      <p className="text-lg font-semibold text-gray-900">{requestDetails.vehicleType}</p>
                    </div>
                  )}
                  {requestDetails.vehicleColor && (
                    <div>
                      <span className="text-sm text-gray-600">Color</span>
                      <p className="text-lg font-semibold text-gray-900">{requestDetails.vehicleColor}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Special Instructions */}
            {requestDetails.specialInstructions && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <h2 className="text-xl font-bold text-amber-900 mb-2 font-poppins">Special Instructions</h2>
                <p className="text-amber-800">{requestDetails.specialInstructions}</p>
              </Card>
            )}

            {/* Decision Buttons */}
            {!isExpired && isApproved && !showDenialForm && (
              <div className="flex gap-4">
                <Button
                  onClick={handleAllowEntry}
                  disabled={logTransactionMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-bold font-poppins"
                >
                  <CheckCircle className="mr-2" size={20} />
                  {logTransactionMutation.isPending ? "Processing..." : "ALLOW ENTRY"}
                </Button>
                <Button
                  onClick={() => setShowDenialForm(true)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 py-3 text-lg font-bold font-poppins"
                >
                  <XCircle className="mr-2" size={20} />
                  DENY ENTRY
                </Button>
              </div>
            )}

            {/* Denial Form */}
            {showDenialForm && (
              <Card className="p-6 bg-red-50 border-red-200">
                <h2 className="text-xl font-bold text-red-900 mb-4 font-poppins">Denial Report</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Reason for Denial *</label>
                    <select
                      value={denialReason}
                      onChange={(e) => setDenialReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a reason...</option>
                      <option value="invalid_id">Invalid ID/Documents</option>
                      <option value="not_authorized">Not Authorized</option>
                      <option value="expired_pass">Expired Pass</option>
                      <option value="security_concern">Security Concern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Comments</label>
                    <textarea
                      value={denialComments}
                      onChange={(e) => setDenialComments(e.target.value)}
                      placeholder="Add any additional details about the denial..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDenyEntry}
                      disabled={submitDenialMutation.isPending || !denialReason}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-poppins"
                    >
                      {submitDenialMutation.isPending ? "Submitting..." : "Submit Denial Report"}
                    </Button>
                    <Button
                      onClick={() => setShowDenialForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
