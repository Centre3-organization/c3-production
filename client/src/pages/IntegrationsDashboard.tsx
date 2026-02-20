import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, Settings, Loader2, CheckCircle, XCircle } from "lucide-react";

export function IntegrationsDashboard() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"camera" | "ai" | "notifications" | "watchlist">("camera");

  // Set active tab from URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "ai" || tabParam === "camera" || tabParam === "notifications" || tabParam === "watchlist") {
      setActiveTab(tabParam);
    }
  }, [location]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Camera Settings
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraResolution, setCameraResolution] = useState("1280x720");
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");

  // AI Settings
  const [aiEnabled, setAiEnabled] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [faceMatchingEnabled, setFaceMatchingEnabled] = useState(false);
  const [documentValidationEnabled, setDocumentValidationEnabled] = useState(false);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(false);
  const [plateRecognitionEnabled, setPlateRecognitionEnabled] = useState(false);

  // Notification Settings
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [supervisorEmail, setSupervisorEmail] = useState("supervisor@centre3.com");
  const [supervisorPhone, setSupervisorPhone] = useState("+966501234567");

  // Watchlist Settings
  const [watchlistEnabled, setWatchlistEnabled] = useState(true);
  const [autoFlagHighRisk, setAutoFlagHighRisk] = useState(true);
  const [watchlistRetentionDays, setWatchlistRetentionDays] = useState("90");

  // Reset save status after 3 seconds
  useEffect(() => {
    if (saveStatus !== "idle") {
      const timer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");

      // Validate AI settings if enabled
      if (aiEnabled && !claudeApiKey.trim()) {
        setErrorMessage("Claude API key is required when AI is enabled");
        setSaveStatus("error");
        setIsSaving(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save settings to localStorage
      const settings = {
        camera: { enabled: cameraEnabled, resolution: cameraResolution, facingMode: cameraFacingMode },
        ai: {
          enabled: aiEnabled,
          claudeApiKey,
          faceMatching: faceMatchingEnabled,
          documentValidation: documentValidationEnabled,
          anomalyDetection: anomalyDetectionEnabled,
          plateRecognition: plateRecognitionEnabled,
        },
        notifications: {
          email: emailNotificationsEnabled,
          sms: smsNotificationsEnabled,
          supervisorEmail,
          supervisorPhone,
        },
        watchlist: {
          enabled: watchlistEnabled,
          autoFlagHighRisk,
          retentionDays: watchlistRetentionDays,
        },
      };

      localStorage.setItem("checkpoint_integrations", JSON.stringify(settings));
      setSaveStatus("success");
      setErrorMessage("");
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage("Failed to save settings. Please try again.");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-poppins">🔗 Integrations</h1>
          <p className="text-slate-600 font-poppins">Configure and manage Security Checkpoint features</p>
        </div>

        {/* Status Messages */}
        {saveStatus === "success" && (
          <Alert className="mb-6 bg-green-100 border-2 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-600" />
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

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
          {["camera", "ai", "notifications", "watchlist"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                // Update URL with tab parameter
                const url = new URL(window.location.href);
                url.searchParams.set("tab", tab);
                window.history.replaceState({}, "", url.toString());
              }}
              className={`px-6 py-3 font-semibold font-poppins border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "camera" && "📷 Camera"}
              {tab === "ai" && "🤖 AI Services"}
              {tab === "notifications" && "📧 Notifications"}
              {tab === "watchlist" && "📋 Watchlist"}
            </button>
          ))}
        </div>

        {/* Camera Settings */}
        {activeTab === "camera" && (
          <div className="space-y-6">
            <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Camera Configuration</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 font-poppins">
                      Enable Camera Service
                    </label>
                    <p className="text-xs text-slate-600 mt-1 font-poppins">
                      Allow guards to capture photos during verification
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
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                        Camera Resolution
                      </label>
                      <select
                        value={cameraResolution}
                        onChange={(e) => setCameraResolution(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
                      >
                        <option value="640x480">640x480 (VGA)</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="1920x1080">1920x1080 (Full HD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                        Default Camera
                      </label>
                      <select
                        value={cameraFacingMode}
                        onChange={(e) => setCameraFacingMode(e.target.value as any)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white text-slate-900 font-poppins"
                      >
                        <option value="user">Front Camera (Selfie)</option>
                        <option value="environment">Back Camera</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* AI Services Settings */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">AI Services Configuration</h2>

              <div className="space-y-4">
                {/* AI Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 font-poppins">
                      Enable AI Services
                    </label>
                    <p className="text-xs text-slate-600 mt-1 font-poppins">
                      Use Claude API for advanced verification
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                {aiEnabled && (
                  <>
                    {/* Claude API Key */}
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
                        Get from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">console.anthropic.com</a>
                      </p>
                    </div>

                    {/* AI Features */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 font-poppins">AI Features</h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <label className="text-sm font-semibold text-slate-700 font-poppins">
                            Face Matching
                          </label>
                          <input
                            type="checkbox"
                            checked={faceMatchingEnabled}
                            onChange={(e) => setFaceMatchingEnabled(e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <label className="text-sm font-semibold text-slate-700 font-poppins">
                            Document Validation
                          </label>
                          <input
                            type="checkbox"
                            checked={documentValidationEnabled}
                            onChange={(e) => setDocumentValidationEnabled(e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <label className="text-sm font-semibold text-slate-700 font-poppins">
                            Anomaly Detection
                          </label>
                          <input
                            type="checkbox"
                            checked={anomalyDetectionEnabled}
                            onChange={(e) => setAnomalyDetectionEnabled(e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <label className="text-sm font-semibold text-slate-700 font-poppins">
                            License Plate Recognition
                          </label>
                          <input
                            type="checkbox"
                            checked={plateRecognitionEnabled}
                            onChange={(e) => setPlateRecognitionEnabled(e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Notification Channels</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 font-poppins">
                    Email Notifications
                  </label>
                  <input
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 font-poppins">
                    SMS Notifications
                  </label>
                  <input
                    type="checkbox"
                    checked={smsNotificationsEnabled}
                    onChange={(e) => setSmsNotificationsEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 font-poppins">Supervisor Contacts</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                        Supervisor Email
                      </label>
                      <Input
                        type="email"
                        value={supervisorEmail}
                        onChange={(e) => setSupervisorEmail(e.target.value)}
                        className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                        Supervisor Phone
                      </label>
                      <Input
                        type="tel"
                        value={supervisorPhone}
                        onChange={(e) => setSupervisorPhone(e.target.value)}
                        className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Watchlist Settings */}
        {activeTab === "watchlist" && (
          <div className="space-y-6">
            <Card className="bg-white border-2 border-purple-200 p-6 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">Watchlist Configuration</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 font-poppins">
                      Enable Watchlist
                    </label>
                    <p className="text-xs text-slate-600 mt-1 font-poppins">
                      Track flagged persons and vehicles
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={watchlistEnabled}
                    onChange={(e) => setWatchlistEnabled(e.target.checked)}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>

                {watchlistEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 font-poppins">
                          Auto-flag High Risk Entries
                        </label>
                        <p className="text-xs text-slate-600 mt-1 font-poppins">
                          Automatically add high-risk incidents to watchlist
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoFlagHighRisk}
                        onChange={(e) => setAutoFlagHighRisk(e.target.checked)}
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 font-poppins">
                        Watchlist Retention (Days)
                      </label>
                      <Input
                        type="number"
                        value={watchlistRetentionDays}
                        onChange={(e) => setWatchlistRetentionDays(e.target.value)}
                        className="border-2 border-slate-300 focus:border-purple-500 bg-white text-slate-900 placeholder-slate-400 font-poppins"
                      />
                      <p className="text-xs text-slate-600 mt-2 font-poppins">
                        Entries older than this will be archived
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Settings
              </>
            )}
          </Button>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-2 border-blue-200 p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-900 mb-3 font-poppins">ℹ️ Integration Information</h3>
          <div className="space-y-2 text-sm text-blue-800 font-poppins">
            <p>
              <strong>Camera:</strong> Enables photo capture during verification. Requires browser permission.
            </p>
            <p>
              <strong>AI Services:</strong> Automates verification using Claude Vision API. Requires valid API key.
            </p>
            <p>
              <strong>Notifications:</strong> Alerts supervisors about incidents via email or SMS.
            </p>
            <p>
              <strong>Watchlist:</strong> Tracks flagged persons and vehicles for security monitoring.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
