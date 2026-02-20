import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export function UnregisteredEntry() {
  const [, setLocation] = useLocation();
  const [visitorName, setVisitorName] = useState("");
  const [visitorIdNumber, setVisitorIdNumber] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hostName, setHostName] = useState("");
  const [comments, setComments] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    try {
      setSubmitStatus("submitting");
      setErrorMessage("");

      // Validate required fields
      if (!visitorName.trim()) {
        setErrorMessage("Visitor name is required");
        setSubmitStatus("error");
        return;
      }

      if (!visitorIdNumber.trim()) {
        setErrorMessage("Visitor ID number is required");
        setSubmitStatus("error");
        return;
      }

      if (!hostName.trim()) {
        setErrorMessage("Host name is required");
        setSubmitStatus("error");
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitStatus("success");
      setTimeout(() => {
        setLocation("/checkpoint");
      }, 2000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setSubmitStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation("/checkpoint")}
            className="mb-4 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold font-poppins"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkpoint
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-poppins">
            👤 Unregistered Entry Report
          </h1>
          <p className="text-gray-600 font-poppins">
            Report an unregistered visitor who arrived without a valid access request
          </p>
        </div>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <Alert className="mb-6 bg-green-100 border-2 border-green-300">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-poppins ml-2">
              ✅ Unregistered entry report submitted successfully
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-poppins ml-2">
              ❌ {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="bg-white border-2 border-amber-200 p-8 shadow-lg">
          <div className="space-y-6">
            {/* Visitor Information Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 font-poppins">Visitor Information</h2>

              <div className="space-y-4">
                {/* Visitor Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Visitor Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter full name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    ID Number *
                  </label>
                  <Input
                    type="text"
                    placeholder="National ID, Iqama, or Passport"
                    value={visitorIdNumber}
                    onChange={(e) => setVisitorIdNumber(e.target.value)}
                    className="border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Company/Organization
                  </label>
                  <Input
                    type="text"
                    placeholder="Visitor's company (optional)"
                    value={visitorCompany}
                    onChange={(e) => setVisitorCompany(e.target.value)}
                    className="border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>
              </div>
            </div>

            {/* Access Information Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 font-poppins">Access Information</h2>

              <div className="space-y-4">
                {/* Host Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Host Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Person they were visiting"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                    Purpose of Visit
                  </label>
                  <Input
                    type="text"
                    placeholder="Reason for visit"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                  />
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 font-poppins">Additional Information</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Comments/Notes
                </label>
                <textarea
                  placeholder="Any additional details about this unregistered entry..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border-2 border-slate-300 focus:border-amber-500 bg-white text-slate-900 placeholder-slate-400 font-poppins rounded-md p-3 min-h-24"
                />
              </div>
            </div>

            {/* Warning Alert */}
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-poppins">
                ⚠️ This report will be logged in the security system and reviewed by supervisors. Ensure all information is accurate.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleSubmit}
            disabled={submitStatus === "submitting"}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {submitStatus === "submitting" ? "Submitting..." : "Submit Report"}
          </Button>

          <Button
            onClick={() => setLocation("/checkpoint")}
            className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
