import React, { useState } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Camera, AlertCircle, Send, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { CameraCapture } from "@/components/CameraCapture";

export function UnregisteredEntryForm() {
  const [, setLocation] = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [reason, setReason] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
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
    if (!visitorName.trim()) {
      setErrorMessage("Visitor name is required");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Reason for entry is required");
      return;
    }
    if (!supervisorName.trim()) {
      setErrorMessage("Supervisor name is required");
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

      // Log the unregistered entry
      console.log({
        visitorName,
        visitorCompany,
        visitorPhone,
        reason,
        supervisorName,
        supervisorPhone,
        photo: capturedPhoto,
        timestamp: new Date().toISOString(),
      });

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
    <CheckpointLayout title="Unregistered Entry Report">
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
              ✅ Unregistered entry reported successfully. Supervisor has been notified.
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

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-100 border-2 border-blue-300">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 font-poppins">
            ℹ️ This form is for documenting walk-in visitors without prior authorization. All fields are mandatory and will be escalated to the supervisor.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visitor Information */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">👤 Visitor Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Visitor Name *
                </label>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Company/Organization
                  </label>
                  <Input
                    type="text"
                    placeholder="Company name"
                    value={visitorCompany}
                    onChange={(e) => setVisitorCompany(e.target.value)}
                    className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+966 50 123 4567"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Reason for Entry *
                </label>
                <textarea
                  placeholder="Describe the reason for unregistered entry..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins h-24"
                />
              </div>
            </div>
          </Card>

          {/* Supervisor Information */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">👨‍💼 Supervisor Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Supervisor Name *
                </label>
                <Input
                  type="text"
                  placeholder="Supervisor full name"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Supervisor Phone *
                </label>
                <Input
                  type="tel"
                  placeholder="+966 50 123 4567"
                  value={supervisorPhone}
                  onChange={(e) => setSupervisorPhone(e.target.value)}
                  className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                />
              </div>
            </div>
          </Card>

          {/* Photo Evidence */}
          <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">📸 Photo Evidence *</h2>

            {capturedPhoto ? (
              <div className="flex flex-col gap-3">
                <img
                  src={capturedPhoto}
                  alt="Visitor photo"
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
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
          title="Capture Visitor Photo"
        />
      )}
    </CheckpointLayout>
  );
}
