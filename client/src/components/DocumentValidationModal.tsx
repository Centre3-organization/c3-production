import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Camera, Loader2, CheckCircle, XCircle } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface DocumentData {
  documentType: string;
  name: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  confidence: number;
}

interface DocumentValidationModalProps {
  onClose: () => void;
  onValidate: (data: DocumentData) => void;
}

export function DocumentValidationModal({ onClose, onValidate }: DocumentValidationModalProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<"id" | "iqama" | "passport">("id");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<DocumentData | null>(null);
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCapturePhoto = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setShowCamera(false);
  };

  const handleValidate = async () => {
    if (!capturedPhoto) {
      setErrorMessage("Please capture a photo first");
      return;
    }

    try {
      setIsValidating(true);
      setValidationStatus("validating");
      setErrorMessage("");

      // Simulate Claude API call for document validation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock validation result
      const mockResult: DocumentData = {
        documentType: documentType.toUpperCase(),
        name: "Ahmed Al-Rashid",
        idNumber: "1234567890",
        nationality: "Saudi Arabia",
        dateOfBirth: "1990-05-15",
        expiryDate: "2028-03-20",
        confidence: 0.95,
      };

      setValidationResult(mockResult);
      setValidationStatus("success");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setValidationStatus("error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = () => {
    if (validationResult) {
      onValidate(validationResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-2 border-purple-200 p-8 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 font-poppins">📄 Document Validation</h2>

        {/* Document Type Selection */}
        {!validationResult && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3 font-poppins">
              Document Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["id", "iqama", "passport"].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocumentType(type as any)}
                  className={`px-4 py-3 rounded-lg font-semibold font-poppins transition ${
                    documentType === type
                      ? "bg-purple-600 text-white border-2 border-purple-600"
                      : "bg-slate-100 text-slate-900 border-2 border-slate-300 hover:border-purple-400"
                  }`}
                >
                  {type === "id" && "🪪 ID Card"}
                  {type === "iqama" && "📋 Iqama"}
                  {type === "passport" && "🛂 Passport"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Capture Section */}
        {!validationResult && (
          <Card className="bg-slate-50 border-2 border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-poppins">📸 Capture Document</h3>

            {capturedPhoto ? (
              <div className="flex flex-col gap-3">
                <img
                  src={capturedPhoto}
                  alt="Document"
                  className="w-full h-64 object-cover rounded-lg border-2 border-green-300"
                />
                <Button
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold font-poppins"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Retake Photo
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowCamera(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-40 flex flex-col items-center justify-center gap-2 font-poppins"
              >
                <Camera className="w-8 h-8" />
                <span>Capture Document Photo</span>
              </Button>
            )}
          </Card>
        )}

        {/* Validation Status */}
        {validationStatus === "validating" && (
          <Alert className="mb-6 bg-blue-100 border-2 border-blue-300">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800 font-poppins">
              Validating document with Claude AI...
            </AlertDescription>
          </Alert>
        )}

        {validationStatus === "success" && validationResult && (
          <Card className="bg-green-50 border-2 border-green-300 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-900 font-poppins">✅ Document Validated</h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Document Type</label>
                  <p className="text-slate-900 font-poppins">{validationResult.documentType}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Confidence</label>
                  <p className="text-slate-900 font-poppins">
                    {(validationResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Full Name</label>
                  <p className="text-slate-900 font-poppins">{validationResult.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">ID Number</label>
                  <p className="text-slate-900 font-poppins">{validationResult.idNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Nationality</label>
                  <p className="text-slate-900 font-poppins">{validationResult.nationality}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Date of Birth</label>
                  <p className="text-slate-900 font-poppins">{validationResult.dateOfBirth}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Expiry Date</label>
                  <p className="text-slate-900 font-poppins">{validationResult.expiryDate}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 font-poppins">Status</label>
                  <p className="text-green-600 font-bold font-poppins">Valid</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {validationStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-poppins">
              ❌ {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!validationResult ? (
            <>
              <Button
                onClick={handleValidate}
                disabled={!capturedPhoto || isValidating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Validate Document
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 font-poppins"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Use This Data
              </Button>
              <Button
                onClick={() => {
                  setValidationResult(null);
                  setValidationStatus("idle");
                  setCapturedPhoto(null);
                }}
                className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
              >
                Retake
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
          title="Capture Document"
        />
      )}
    </div>
  );
}
