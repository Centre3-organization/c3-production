import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock, User, Building2, MapPin, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/utils/trpc";

interface Material {
  id: string;
  name: string;
  quantity: number;
  status: "present" | "missing" | "damaged" | "unchecked";
  notes: string;
}

interface Escalation {
  type: string;
  description: string;
  timestamp: Date;
}

export function CheckpointSearchEnhanced() {
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
  
  // Materials verification state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showMaterialsChecklist, setShowMaterialsChecklist] = useState(false);
  
  // Escalation state
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationType, setEscalationType] = useState("");
  const [escalationDescription, setEscalationDescription] = useState("");
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  // Fetch all requests
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

  // Search for the request
  useEffect(() => {
    if (!isFetching && response?.requests) {
      setLoading(true);
      const requests = response.requests as any[];
      
      let foundRequest = null;

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
        
        // Initialize materials from request
        if (foundRequest.materials) {
          const parsedMaterials = typeof foundRequest.materials === 'string' 
            ? JSON.parse(foundRequest.materials) 
            : foundRequest.materials;
          setMaterials(
            parsedMaterials.map((m: any, idx: number) => ({
              id: `${idx}`,
              name: m.name || m,
              quantity: m.quantity || 1,
              status: "unchecked",
              notes: "",
            }))
          );
        }
      } else {
        setError("Request not found. Please check the search value and try again.");
        setRequestDetails(null);
      }
      setLoading(false);
    }
  }, [isFetching, response, searchMethod, searchValue]);

  const handleAllowEntry = () => {
    if (!requestDetails) return;

    const allMaterialsChecked = materials.every(m => m.status !== "unchecked");
    const partialMaterials = materials.some(m => m.status === "missing" || m.status === "damaged");

    logTransactionMutation.mutate({
      checkpointId: 1,
      visitorName: requestDetails.visitorName,
      visitorIdNumber: requestDetails.visitorIdNumber || "",
      transactionType: "person_entry",
      decision: "allowed",
      guardId: 1,
      notes: `Entry allowed. Materials: ${partialMaterials ? "Partial" : "Complete"}. Escalations: ${escalations.length}`,
    });
  };

  const handleDenyEntry = () => {
    if (denialComments.length < 20) {
      alert("Please provide at least 20 characters for denial reason");
      return;
    }

    submitDenialMutation.mutate({
      checkpointId: 1,
      transactionId: requestDetails.id,
      visitorName: requestDetails.visitorName,
      visitorIdNumber: requestDetails.visitorIdNumber || "",
      denialReason: (denialReason || "other") as any,
      comments: denialComments,
      guardId: 1,
    });
  };

  const handleMaterialStatusChange = (materialId: string, status: "present" | "missing" | "damaged") => {
    setMaterials(materials.map(m => 
      m.id === materialId ? { ...m, status } : m
    ));
  };

  const handleAddEscalation = () => {
    if (!escalationType || !escalationDescription) {
      alert("Please select escalation type and description");
      return;
    }

    setEscalations([...escalations, {
      type: escalationType,
      description: escalationDescription,
      timestamp: new Date(),
    }]);

    setEscalationType("");
    setEscalationDescription("");
  };

  const materialsVerified = materials.every(m => m.status !== "unchecked");
  const materialsComplete = materials.every(m => m.status === "present");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">{error}</h2>
                <Button onClick={() => setLocation("/checkpoint")} className="mt-4">
                  Back to Checkpoint
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!requestDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-600">No request found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation("/checkpoint")} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Check-In Verification</h1>
        </div>

        {/* Request Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Request ID</p>
              <p className="text-lg font-medium text-slate-900">{requestDetails.requestNumber}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Visitor Name</p>
              <p className="text-lg font-medium text-slate-900">{requestDetails.visitorName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Company</p>
              <p className="text-lg font-medium text-slate-900">{requestDetails.company}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Access Zone</p>
              <Badge className="mt-1">{requestDetails.accessZone || "Not specified"}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Valid Time Window</p>
              <p className="text-lg font-medium text-slate-900">
                {requestDetails.visitDate ? new Date(requestDetails.visitDate).toLocaleDateString() : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Risk Level</p>
              <Badge className={requestDetails.riskLevel === "high" ? "bg-red-500" : requestDetails.riskLevel === "medium" ? "bg-yellow-500" : "bg-green-500"}>
                {requestDetails.riskLevel || "Unknown"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Materials Verification */}
        {materials.length > 0 && (
          <Card className="p-6 mb-6">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowMaterialsChecklist(!showMaterialsChecklist)}
            >
              <h2 className="text-lg font-semibold text-slate-900">Materials Verification Checklist</h2>
              {showMaterialsChecklist ? <ChevronUp /> : <ChevronDown />}
            </div>

            {showMaterialsChecklist && (
              <div className="mt-4 space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{material.name}</p>
                        <p className="text-sm text-slate-600">Quantity: {material.quantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={material.status === "present" ? "default" : "outline"}
                          onClick={() => handleMaterialStatusChange(material.id, "present")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ✓ Present
                        </Button>
                        <Button
                          size="sm"
                          variant={material.status === "missing" ? "default" : "outline"}
                          onClick={() => handleMaterialStatusChange(material.id, "missing")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          ✗ Missing
                        </Button>
                        <Button
                          size="sm"
                          variant={material.status === "damaged" ? "default" : "outline"}
                          onClick={() => handleMaterialStatusChange(material.id, "damaged")}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          ⚠ Damaged
                        </Button>
                      </div>
                    </div>
                    <textarea
                      placeholder="Add notes..."
                      value={material.notes}
                      onChange={(e) => setMaterials(materials.map(m => 
                        m.id === material.id ? { ...m, notes: e.target.value } : m
                      ))}
                      className="w-full p-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Visitors can be approved even with partial materials. Missing items can be delivered during the approved visit window.
              </p>
            </div>
          </Card>
        )}

        {/* Escalations */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Escalations</h2>
            {escalations.length > 0 && (
              <Badge className="bg-red-500">{escalations.length} escalation(s)</Badge>
            )}
          </div>

          {escalations.length > 0 && (
            <div className="space-y-2 mb-4">
              {escalations.map((esc, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-medium text-red-900">{esc.type}</p>
                  <p className="text-sm text-red-800">{esc.description}</p>
                  <p className="text-xs text-red-700 mt-1">{esc.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <select
              value={escalationType}
              onChange={(e) => setEscalationType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded"
            >
              <option value="">Select escalation type...</option>
              <option value="behavior_concern">Behavior Concern</option>
              <option value="unauthorized_person">Unauthorized Extra Person</option>
              <option value="expired_id">Expired ID</option>
              <option value="materials_mismatch">Materials Mismatch</option>
              <option value="access_violation">Access Zone Violation</option>
              <option value="watchlist_match">Watchlist Match</option>
              <option value="anomaly">Anomaly Detected</option>
              <option value="other">Other</option>
            </select>

            <textarea
              placeholder="Describe the escalation incident..."
              value={escalationDescription}
              onChange={(e) => setEscalationDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm"
              rows={3}
            />

            <Button
              onClick={handleAddEscalation}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Add Escalation
            </Button>
          </div>
        </Card>

        {/* Decision Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleAllowEntry}
            disabled={!materialsVerified}
            className="bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {materialsComplete ? "Approve Entry" : "Approve Entry (Partial Materials)"}
          </Button>

          <Button
            onClick={() => setShowDenialForm(!showDenialForm)}
            className="bg-red-600 hover:bg-red-700 text-white py-3 text-lg"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Deny Entry
          </Button>
        </div>

        {/* Denial Form */}
        {showDenialForm && (
          <Card className="p-6 border-l-4 border-l-red-500">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Denial Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Reason for Denial *</label>
                <select
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="">Select reason...</option>
                  <option value="invalid_id">Invalid ID</option>
                  <option value="expired_pass">Expired Pass</option>
                  <option value="unauthorized_access">Unauthorized Access</option>
                  <option value="watchlist">Watchlist Match</option>
                  <option value="materials_missing">Required Materials Missing</option>
                  <option value="security_concern">Security Concern</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Comments (minimum 20 characters) *
                </label>
                <textarea
                  value={denialComments}
                  onChange={(e) => setDenialComments(e.target.value)}
                  placeholder="Provide detailed reason for denial..."
                  className="w-full p-2 border border-slate-300 rounded text-sm"
                  rows={4}
                />
                <p className="text-xs text-slate-600 mt-1">
                  {denialComments.length}/20 characters minimum
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDenyEntry}
                  disabled={denialComments.length < 20}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Submit Denial
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
    </div>
  );
}
