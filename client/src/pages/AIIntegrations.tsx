import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle, Lock, Zap, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/utils/useAuth";

export function AIIntegrations() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // AI Settings
  const [aiEnabled, setAiEnabled] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [faceMatchingEnabled, setFaceMatchingEnabled] = useState(false);
  const [documentValidationEnabled, setDocumentValidationEnabled] = useState(false);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(false);
  const [plateRecognitionEnabled, setPlateRecognitionEnabled] = useState(false);

  // Check if user is super-admin
  const isSuperAdmin = user?.role === "admin" || user?.email === "mohsiin@gmail.com";

  // Load settings on mount
  useEffect(() => {
    try {
      const settings = localStorage.getItem("checkpoint_ai_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setAiEnabled(parsed.aiEnabled ?? false);
        setClaudeApiKey(parsed.claudeApiKey ?? "");
        setFaceMatchingEnabled(parsed.faceMatching ?? false);
        setDocumentValidationEnabled(parsed.documentValidation ?? false);
        setAnomalyDetectionEnabled(parsed.anomalyDetection ?? false);
        setPlateRecognitionEnabled(parsed.plateRecognition ?? false);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaveStatus("saving");
      setErrorMessage("");

      // Validate Claude API key if AI is enabled
      if (aiEnabled && !claudeApiKey.trim()) {
        setErrorMessage("Claude API key is required when AI is enabled");
        setSaveStatus("error");
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save settings to localStorage
      const settings = {
        aiEnabled,
        claudeApiKey: claudeApiKey.trim(),
        faceMatching: faceMatchingEnabled,
        documentValidation: documentValidationEnabled,
        anomalyDetection: anomalyDetectionEnabled,
        plateRecognition: plateRecognitionEnabled,
      };

      localStorage.setItem("checkpoint_ai_settings", JSON.stringify(settings));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setSaveStatus("error");
    }
  };

  // Show access denied if not super-admin
  if (!loading && !isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="p-8 text-center bg-red-50 border-2 border-red-300">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2 font-poppins">Access Denied</h1>
          <p className="text-red-700 mb-6 font-poppins">
            Only super-admin users can access AI Integrations settings. Please contact your administrator.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-red-600 hover:bg-red-700 text-white font-poppins"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-gray-600 font-poppins">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation("/")}
            className="mb-4 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold font-poppins"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-poppins flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-600" />
            AI Integrations
          </h1>
          <p className="text-gray-600 font-poppins">
            Configure AI-powered features for checkpoint verification and security operations
          </p>
        </div>

        {/* Status Messages */}
        {saveStatus === "success" && (
          <Alert className="mb-6 bg-green-100 border-2 border-green-300">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-poppins ml-2">
              ✅ AI settings saved successfully
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-poppins ml-2">
              ❌ {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Main AI Settings Card */}
        <Card className="bg-white border-2 border-purple-200 p-8 mb-6 shadow-lg">
          <div className="space-y-6">
            {/* AI Master Toggle */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 font-poppins">
                    🤖 Enable AI Features
                  </h2>
                  <p className="text-sm text-slate-600 font-poppins">
                    Activate Claude Vision API for automated verification and security analysis
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-8 h-8 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Claude API Key Input */}
            {aiEnabled && (
              <div className="p-6 bg-slate-50 rounded-lg border-2 border-slate-200">
                <label className="block text-sm font-bold text-slate-900 mb-3 font-poppins">
                  Claude API Key *
                </label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins mb-3"
                />
                <p className="text-xs text-slate-600 font-poppins">
                  Get your API key from{" "}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline font-bold"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            )}

            {/* Feature Toggles */}
            {aiEnabled && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Available Features</h3>

                {/* Face Matching */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 font-poppins">👤 Face Matching</p>
                    <p className="text-xs text-slate-600 font-poppins">
                      Compare visitor photo with ID document photo
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={faceMatchingEnabled}
                    onChange={(e) => setFaceMatchingEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                {/* Document Validation */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 font-poppins">📄 Document Validation</p>
                    <p className="text-xs text-slate-600 font-poppins">
                      Verify ID, Iqama, and Passport documents
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={documentValidationEnabled}
                    onChange={(e) => setDocumentValidationEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                {/* Anomaly Detection */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 font-poppins">🚨 Anomaly Detection</p>
                    <p className="text-xs text-slate-600 font-poppins">
                      Detect suspicious behavior and patterns
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={anomalyDetectionEnabled}
                    onChange={(e) => setAnomalyDetectionEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                {/* Plate Recognition */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 font-poppins">🚗 License Plate Recognition</p>
                    <p className="text-xs text-slate-600 font-poppins">
                      Automatically recognize and validate vehicle plates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={plateRecognitionEnabled}
                    onChange={(e) => setPlateRecognitionEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Warning Message */}
            {aiEnabled && (
              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-poppins">
                  ⚠️ Ensure your Claude API key has sufficient quota and permissions for vision tasks. Each verification
                  will consume API credits.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 border-2 border-blue-200 p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 font-poppins">ℹ️ About AI Integrations</h3>
          <div className="space-y-2 text-sm text-blue-800 font-poppins">
            <p>
              <strong>What is this?</strong> AI Integrations allow guards to use Claude Vision API for automated
              verification of visitor documents and faces.
            </p>
            <p>
              <strong>How does it work?</strong> When enabled, guards can upload photos during checkpoint verification.
              Claude analyzes the images to verify authenticity and extract information.
            </p>
            <p>
              <strong>Cost:</strong> Each verification uses Claude API credits. Monitor your usage in the Anthropic
              console.
            </p>
            <p>
              <strong>Graceful Degradation:</strong> If AI is disabled or API fails, checkpoint operations continue with
              manual verification.
            </p>
          </div>
        </Card>

        {/* Save Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleSaveSettings}
            disabled={saveStatus === "saving"}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saveStatus === "saving" ? "Saving..." : "Save Settings"}
          </Button>

          <Button
            onClick={() => setLocation("/")}
            className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
