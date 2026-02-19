/**
 * Camera Service
 * Handles WebRTC camera access and photo capture
 * Can be toggled on/off via settings
 */

export interface CameraConfig {
  enabled: boolean;
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: CameraConfig;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = {
      enabled: true,
      facingMode: 'user',
      width: 1280,
      height: 720,
      ...config,
    };
  }

  /**
   * Check if camera is enabled in settings
   */
  isEnabled(): boolean {
    const settings = this.getSettings();
    return settings.cameraEnabled ?? true;
  }

  /**
   * Get camera settings from localStorage
   */
  getSettings() {
    try {
      const settings = localStorage.getItem('checkpoint_camera_settings');
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save camera settings to localStorage
   */
  saveSettings(settings: Record<string, any>) {
    localStorage.setItem('checkpoint_camera_settings', JSON.stringify(settings));
  }

  /**
   * Initialize camera stream
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Camera is disabled in settings');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported on this device');
    }

    try {
      this.videoElement = videoElement;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.config.facingMode,
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
        },
        audio: false,
      });

      videoElement.srcObject = this.stream;
      videoElement.play();
    } catch (error) {
      throw new Error(`Failed to access camera: ${(error as Error).message}`);
    }
  }

  /**
   * Capture photo from video stream
   */
  async capturePhoto(): Promise<Blob | null> {
    if (!this.videoElement) {
      console.error('Video element not initialized');
      return null;
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
    }

    const context = this.canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }

    context.drawImage(this.videoElement, 0, 0);

    return new Promise((resolve) => {
      this.canvas!.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  }

  /**
   * Get photo as data URL
   */
  capturePhotoAsDataUrl(): string | null {
    if (!this.videoElement) {
      console.error('Video element not initialized');
      return null;
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
    }

    const context = this.canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }

    context.drawImage(this.videoElement, 0, 0);
    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Stop camera stream
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Check if camera is currently active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    this.config.facingMode = this.config.facingMode === 'user' ? 'environment' : 'user';

    if (this.videoElement) {
      this.stop();
      await this.initialize(this.videoElement);
    }
  }
}

// Export singleton instance
export const cameraService = new CameraService();
