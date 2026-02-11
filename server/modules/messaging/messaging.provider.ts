/**
 * Messaging Provider Abstraction Layer
 * 
 * This module defines the provider-agnostic interface for sending messages.
 * Each provider (Twilio, Vonage, etc.) implements this interface.
 * The system can swap providers without changing any business logic.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SendSmsRequest {
  to: string;           // E.164 format: +966501234567
  body: string;
  from?: string;        // override sender number
}

export interface SendWhatsAppRequest {
  to: string;           // E.164 format: +966501234567
  body: string;
  from?: string;        // override WhatsApp sender number
  mediaUrl?: string;    // optional media attachment URL
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;   // e.g. Twilio SID
  status?: string;              // provider-specific status
  errorCode?: string;
  errorMessage?: string;
}

export interface ProviderCredentials {
  [key: string]: string | undefined;
}

export interface ProviderHealthCheck {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

// ============================================================================
// ABSTRACT PROVIDER INTERFACE
// ============================================================================

export interface MessagingProvider {
  /** Unique provider slug (e.g. "twilio", "vonage") */
  readonly slug: string;
  
  /** Human-readable provider name */
  readonly name: string;
  
  /** Initialize the provider with credentials */
  initialize(credentials: ProviderCredentials): void;
  
  /** Send an SMS message */
  sendSms(request: SendSmsRequest): Promise<SendResult>;
  
  /** Send a WhatsApp message */
  sendWhatsApp(request: SendWhatsAppRequest): Promise<SendResult>;
  
  /** Send an email message (optional — only email providers implement this) */
  sendEmail?(to: string, subject: string, body: string, html?: string): Promise<SendResult>;

  /** Test the provider connection with current credentials */
  testConnection(): Promise<ProviderHealthCheck>;
  
  /** Get the required credential fields for this provider */
  getRequiredCredentials(): CredentialField[];
}

export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "phone";
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

const providerRegistry = new Map<string, () => MessagingProvider>();

export function registerProvider(slug: string, factory: () => MessagingProvider) {
  providerRegistry.set(slug, factory);
}

export function createProvider(slug: string): MessagingProvider | null {
  const factory = providerRegistry.get(slug);
  if (!factory) return null;
  return factory();
}

export function getAvailableProviders(): string[] {
  return Array.from(providerRegistry.keys());
}
