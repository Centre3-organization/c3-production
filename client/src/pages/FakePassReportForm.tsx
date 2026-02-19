import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Camera, AlertCircle, Send, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { CameraCapture } from "@/components/CameraCapture";

export function FakePassReportForm() {
  const [, setLocation] = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [suspectedPersonName, setSuspectedPersonName] = useState("");
  const [suspectedPersonDescription, setSuspectedPersonDescription] = useState("");
  const [passDetails, setPassDetails] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [escalateToSecurity, setEscalateToSecurity] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCapturePhoto = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setShowCamera(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!suspectedPersonName.trim()) {
      setErrorMessage("Suspected person name/description is required");
      return;
    }
    if (!incidentDescription.trim()) {
      setErrorMessage("Incident description is required");
      return;
    }
    if (!capturedPhoto) {
      setErrorMessage("Photo evidence is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Log the fake pass report
      const reportData = {
        suspectedPersonName,
        suspectedPersonDescription,
        passDetails,
        incidentDescription,
        riskLevel,
        escalateToSecurity,
        photo: capturedPhoto,
        timestamp: new Date().toISOString(),
      };

      console.log("Fake Pass Report:", reportData);

      // If escalate is true, add to watchlist
      if (escalateToSecurity) {
        console.log("Adding to watchlist with risk level:", riskLevel);
      }

      setSubmitStatus("success");
      setTimeout(() => {
        setLocation("/checkpoint");
      }, 2000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CheckpointLayout title="Fake Pass Report">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => setLocation("/checkpoint")}
          className="mb-6 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold font-poppins"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <Alert className="mb-6 bg-green-100 border-2 border-green-300">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-poppins">
              ✅ Fake pass report submitted successfully. Security management has been notified and person added to watchlist.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-poppins">
              ❌ {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        <Alert className="mb-6 bg-amber-100 border-2 border-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-poppins">
            ⚠️ This is a serious security incident report. All information will be escalated to security management and the person will be added to the watchlist.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Suspected Person Information */}
          <Card className="bg-white border-2 border-red-300 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-red-900 mb-4 font-poppins">🚨 Suspected Person Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Name or Description *
                </label>
                <Input
                  type="text"
                  placeholder="Name or physical description"
                  value={suspectedPersonName}
                  onChange={(e) => setSuspectedPersonName(e.target.value)}
                  className="border-2 border-slate-300 focus:border-red-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Physical Description
                </label>
                <textarea
                  placeholder="Height, build, clothing, distinguishing features..."
                  value={suspectedPersonDescription}
                  onChange={(e) => setSuspectedPersonDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-red-500 bg-white text-slate-900 placeholder-slate-400 font-poppins h-20"
                />
              </div>
            </div>
          </Card>

          {/* Fake Pass Details */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">🎫 Fake Pass Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Pass Details / Information
                </label>
                <textarea
                  placeholder="Pass number, forged details, claimed access zones, etc..."
                  value={passDetails}
                  onChange={(e) => setPassDetails(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins h-20"
                />
              </div>
            </div>
          </Card>

          {/* Incident Details */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">📋 Incident Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Incident Description *
                </label>
                <textarea
                  placeholder="Describe what happened, how you detected the fake pass, suspicious behavior, etc..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Risk Level *
                </label>
                <div className="flex gap-4">
                  {["low", "medium", "high"].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="riskLevel"
                        value={level}
                        checked={riskLevel === level}
                        onChange={(e) => setRiskLevel(e.target.value as "low" | "medium" | "high")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-slate-700 font-poppins capitalize">
                        {level === "low" && "🟢 Low"}
                        {level === "medium" && "🟡 Medium"}
                        {level === "high" && "🔴 High"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Escalation */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">🔒 Escalate to Security Management</h3>
                <p className="text-sm text-slate-600 mt-1 font-poppins">
                  Add person to watchlist and notify security team
                </p>
              </div>
              <input
                type="checkbox"
                checked={escalateToSecurity}
                onChange={(e) => setEscalateToSecurity(e.target.checked)}
                className="w-6 h-6 cursor-pointer"
              />
            </div>
          </Card>

          {/* Photo Evidence */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">📸 Photo Evidence *</h2>

            {capturedPhoto ? (
              <div className="flex flex-col gap-3">
                <img
                  src={capturedPhoto}
                  alt="Incident photo"
                  className="w-full h-64 object-cover rounded-lg border-2 border-green-300"
                />
                <Button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold font-poppins flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Retake Photo
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-40 flex flex-col items-center justify-center gap-2 font-poppins"
              >
                <Camera className="w-8 h-8" />
                <span>Capture Photo</span>
              </Button>
            )}
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => setLocation("/checkpoint")}
              className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
          title="Capture Evidence Photo"
        />
      )}
    </CheckpointLayout>
  );
}
