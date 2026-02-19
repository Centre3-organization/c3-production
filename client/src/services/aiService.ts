/**
 * AI Service for Face Matching and Document Validation
 * Integrates with Claude API via backend
 * Can be toggled on/off via settings
 */

export interface AIConfig {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
}

export interface FaceMatchResult {
  match: boolean;
  confidence: number;
  message: string;
}

export interface DocumentValidationResult {
  valid: boolean;
  documentType: string;
  extractedData: Record<string, any>;
  confidence: number;
  message: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      enabled: false,
      ...config,
    };
  }

  /**
   * Check if AI features are enabled in settings
   */
  isEnabled(): boolean {
    const settings = this.getSettings();
    return settings.aiEnabled ?? false;
  }

  /**
   * Get AI settings from localStorage
   */
  getSettings() {
    try {
      const settings = localStorage.getItem('checkpoint_ai_settings');
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save AI settings to localStorage
   */
  saveSettings(settings: Record<string, any>) {
    localStorage.setItem('checkpoint_ai_settings', JSON.stringify(settings));
  }

  /**
   * Get API key from settings
   */
  getApiKey(): string | null {
    const settings = this.getSettings();
    return settings.claudeApiKey || null;
  }

  /**
   * Set API key in settings
   */
  setApiKey(apiKey: string) {
    const settings = this.getSettings();
    settings.claudeApiKey = apiKey;
    this.saveSettings(settings);
  }

  /**
   * Match face between visitor photo and ID document
   * Calls backend endpoint which uses Claude Vision API
   */
  async matchFace(visitorPhotoUrl: string, idPhotoUrl: string): Promise<FaceMatchResult> {
    if (!this.isEnabled()) {
      return {
        match: false,
        confidence: 0,
        message: 'AI face matching is disabled in settings',
      };
    }

    try {
      const response = await fetch('/api/checkpoint/ai/match-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorPhotoUrl,
          idPhotoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Face matching failed:', error);
      return {
        match: false,
        confidence: 0,
        message: `Face matching error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate document (ID, Iqama, Passport)
   * Calls backend endpoint which uses Claude Vision API
   */
  async validateDocument(documentPhotoUrl: string, documentType: string): Promise<DocumentValidationResult> {
    if (!this.isEnabled()) {
      return {
        valid: false,
        documentType,
        extractedData: {},
        confidence: 0,
        message: 'AI document validation is disabled in settings',
      };
    }

    try {
      const response = await fetch('/api/checkpoint/ai/validate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentPhotoUrl,
          documentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document validation failed:', error);
      return {
        valid: false,
        documentType,
        extractedData: {},
        confidence: 0,
        message: `Document validation error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Analyze visitor for anomalies (suspicious behavior)
   */
  async analyzeAnomaly(visitorData: Record<string, any>): Promise<{ anomaly: boolean; risk: string; message: string }> {
    if (!this.isEnabled()) {
      return {
        anomaly: false,
        risk: 'low',
        message: 'AI anomaly detection is disabled in settings',
      };
    }

    try {
      const response = await fetch('/api/checkpoint/ai/analyze-anomaly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitorData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Anomaly analysis failed:', error);
      return {
        anomaly: false,
        risk: 'low',
        message: `Anomaly analysis error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Extract text from document (OCR-like functionality)
   */
  async extractDocumentText(documentPhotoUrl: string): Promise<{ text: string; confidence: number }> {
    if (!this.isEnabled()) {
      return {
        text: '',
        confidence: 0,
      };
    }

    try {
      const response = await fetch('/api/checkpoint/ai/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentPhotoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Text extraction failed:', error);
      return {
        text: '',
        confidence: 0,
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
