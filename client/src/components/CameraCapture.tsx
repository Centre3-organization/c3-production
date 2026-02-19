import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCw, Loader2 } from "lucide-react";
import { cameraService } from "@/services/cameraService";

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
  title?: string;
}

export function CameraCapture({ onCapture, onClose, title = "Capture Photo" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!cameraService.isEnabled()) {
          setError("Camera is disabled in settings");
          setIsLoading(false);
          return;
        }

        if (videoRef.current) {
          await cameraService.initialize(videoRef.current);
          setIsCameraActive(true);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error("Camera initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCamera();

    return () => {
      cameraService.stop();
      setIsCameraActive(false);
    };
  }, []);

  const handleCapture = async () => {
    try {
      const photoDataUrl = cameraService.capturePhotoAsDataUrl();
      if (photoDataUrl) {
        onCapture(photoDataUrl);
        cameraService.stop();
        setIsCameraActive(false);
      } else {
        setError("Failed to capture photo");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSwitchCamera = async () => {
    try {
      setIsLoading(true);
      await cameraService.switchCamera();
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold font-poppins">{title}</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-poppins">{error}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-100 rounded-lg">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-slate-600 font-poppins">Initializing camera...</p>
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-96 object-cover"
                playsInline
              />
              {isCameraActive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-poppins">Recording</span>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={handleCapture}
              disabled={isLoading || !isCameraActive}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture Photo
            </Button>

            <Button
              onClick={handleSwitchCamera}
              disabled={isLoading || !isCameraActive}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold h-12 font-poppins flex items-center justify-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              Switch Camera
            </Button>

            <Button
              onClick={onClose}
              className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold h-12 font-poppins"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
