import React, { useState, useEffect } from "react";
import { CheckpointLayout } from "@/components/CheckpointLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { cameraService } from "@/services/cameraService";
import { aiService } from "@/services/aiService";

export function CheckpointSettings() {
  const [, setLocation] = useLocation();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Load settings on mount
  useEffect(() => {
    const cameraSettings = cameraService.getSettings();
    const aiSettings = aiService.getSettings();

    setCameraEnabled(cameraSettings.cameraEnabled ?? true);
    setAiEnabled(aiSettings.aiEnabled ?? false);
    setClaudeApiKey(aiSettings.claudeApiKey ?? "");
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

      // Save camera settings
      cameraService.saveSettings({
        cameraEnabled,
      });

      // Save AI settings
      aiService.saveSettings({
        aiEnabled,
        claudeApiKey: claudeApiKey.trim(),
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setSaveStatus("error");
    }
  };

  return (
    <CheckpointLayout title="Settings">
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
        {saveStatus === "success" && (
          <Alert className="mb-6 bg-green-100 border-2 border-green-300">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-poppins">
              ✅ Settings saved successfully
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-100 border-2 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-poppins">
              ❌ {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Settings */}
        <Card className="bg-white border-2 border-purple-200 p-6 mb-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">📷 Camera Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 font-poppins">
                  Enable Camera for Photo Capture
                </label>
                <p className="text-xs text-slate-600 mt-1 font-poppins">
                  Allow guards to capture visitor photos during verification
                </p>
              </div>
              <input
                type="checkbox"
                checked={cameraEnabled}
                onChange={(e) => setCameraEnabled(e.target.checked)}
                className="w-6 h-6 cursor-pointer"
              />
            </div>

            {cameraEnabled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-poppins">
                  ℹ️ Camera access requires browser permission. Guards will be prompted to allow camera access when capturing photos.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* AI Settings */}
        <Card className="bg-white border-2 border-purple-200 p-6 mb-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">🤖 AI Features</h2>

          <div className="space-y-4">
            {/* AI Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 font-poppins">
                  Enable AI Face Matching & Document Validation
                </label>
                <p className="text-xs text-slate-600 mt-1 font-poppins">
                  Use Claude API for automated face matching and document verification
                </p>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-6 h-6 cursor-pointer"
              />
            </div>

            {/* Claude API Key Input */}
            {aiEnabled && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                  Claude API Key *
                </label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                />
                <p className="text-xs text-slate-600 mt-2 font-poppins">
                  Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">console.anthropic.com</a>
                </p>
              </div>
            )}

            {aiEnabled && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-poppins">
                  ⚠️ AI features require valid Claude API credentials. Ensure your API key has sufficient quota and permissions for vision tasks.
                </p>
              </div>
            )}

            {/* AI Features List */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3 font-poppins">Available AI Features:</p>
              <ul className="space-y-2 text-sm text-slate-600 font-poppins">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Face matching between visitor photo and ID document</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Document validation (ID, Iqama, Passport)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Anomaly detection for suspicious behavior</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>License plate recognition and validation</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSaveSettings}
            disabled={saveStatus === "saving"}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saveStatus === "saving" ? "Saving..." : "Save Settings"}
          </Button>

          <Button
            onClick={() => setLocation("/checkpoint")}
            className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
          >
            Cancel
          </Button>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-2 border-blue-200 p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-900 mb-3 font-poppins">ℹ️ About These Settings</h3>
          <div className="space-y-2 text-sm text-blue-800 font-poppins">
            <p>
              <strong>Camera:</strong> Enables guards to capture photos during verification for ID matching and denial evidence documentation.
            </p>
            <p>
              <strong>AI Features:</strong> Automates verification using Claude Vision API. When disabled, guards must manually verify documents and faces.
            </p>
            <p>
              <strong>Graceful Degradation:</strong> If AI is disabled or API fails, the checkpoint interface continues to work with manual verification.
            </p>
          </div>
        </Card>
      </div>
    </CheckpointLayout>
  );
}
