/**
 * "Other" Provider Adapter
 * 
 * A generic/manual provider that allows users to configure custom
 * API endpoints for SMS, WhatsApp, and Email delivery.
 * This is useful when the provider is not natively supported.
 */
import {
  type MessagingProvider,
  type SendSmsRequest,
  type SendWhatsAppRequest,
  type SendResult,
  type ProviderCredentials,
  type ProviderHealthCheck,
  type CredentialField,
  registerProvider,
} from "./messaging.provider";

class OtherProvider implements MessagingProvider {
  readonly slug = "other";
  readonly name = "Other / Custom";

  private credentials: ProviderCredentials = {};

  initialize(credentials: ProviderCredentials): void {
    this.credentials = credentials;
  }

  async sendSms(request: SendSmsRequest): Promise<SendResult> {
    const apiUrl = this.credentials.api_url;
    const apiKey = this.credentials.api_key;

    if (!apiUrl) {
      return { success: false, errorMessage: "No API URL configured for custom provider" };
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          channel: "sms",
          to: request.to,
          body: request.body,
          from: request.from || this.credentials.sender_id,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          providerMessageId: data.messageId || data.id || "custom-" + Date.now(),
          status: "sent",
        };
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, errorCode: String(response.status), errorMessage: errorText };
      }
    } catch (error: any) {
      return { success: false, errorMessage: error.message || "Failed to reach custom API" };
    }
  }

  async sendWhatsApp(request: SendWhatsAppRequest): Promise<SendResult> {
    const apiUrl = this.credentials.api_url;
    const apiKey = this.credentials.api_key;

    if (!apiUrl) {
      return { success: false, errorMessage: "No API URL configured for custom provider" };
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          channel: "whatsapp",
          to: request.to,
          body: request.body,
          from: request.from || this.credentials.whatsapp_sender,
          mediaUrl: request.mediaUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          providerMessageId: data.messageId || data.id || "custom-" + Date.now(),
          status: "sent",
        };
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, errorCode: String(response.status), errorMessage: errorText };
      }
    } catch (error: any) {
      return { success: false, errorMessage: error.message || "Failed to reach custom API" };
    }
  }

  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<SendResult> {
    const apiUrl = this.credentials.api_url;
    const apiKey = this.credentials.api_key;

    if (!apiUrl) {
      return { success: false, errorMessage: "No API URL configured for custom provider" };
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          channel: "email",
          to,
          subject,
          body,
          html,
          from: this.credentials.from_email,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          providerMessageId: data.messageId || data.id || "custom-" + Date.now(),
          status: "sent",
        };
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, errorCode: String(response.status), errorMessage: errorText };
      }
    } catch (error: any) {
      return { success: false, errorMessage: error.message || "Failed to reach custom API" };
    }
  }

  async testConnection(): Promise<ProviderHealthCheck> {
    const apiUrl = this.credentials.api_url;
    if (!apiUrl) {
      return { healthy: false, error: "No API URL configured" };
    }

    const start = Date.now();
    try {
      const response = await fetch(apiUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      }).catch(() => fetch(apiUrl, { method: "GET", signal: AbortSignal.timeout(5000) }));
      const latencyMs = Date.now() - start;
      return { healthy: response.ok || response.status < 500, latencyMs };
    } catch (error: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: error.message };
    }
  }

  getRequiredCredentials(): CredentialField[] {
    return [
      {
        key: "api_url",
        label: "API Endpoint URL",
        type: "text",
        required: true,
        placeholder: "https://api.yourprovider.com/v1/messages",
        helpText: "The REST API endpoint that accepts message delivery requests",
      },
      {
        key: "api_key",
        label: "API Key / Token",
        type: "password",
        required: false,
        placeholder: "Bearer token or API key",
        helpText: "Sent as Authorization: Bearer header (leave blank if not required)",
      },
      {
        key: "sender_id",
        label: "SMS Sender ID",
        type: "text",
        required: false,
        placeholder: "CENTRE3",
        helpText: "Sender ID or phone number for SMS messages",
      },
      {
        key: "whatsapp_sender",
        label: "WhatsApp Sender Number",
        type: "phone",
        required: false,
        placeholder: "+966...",
        helpText: "WhatsApp business number for outbound messages",
      },
      {
        key: "from_email",
        label: "From Email Address",
        type: "text",
        required: false,
        placeholder: "noreply@centre3.com",
        helpText: "Email address used as the sender for email messages",
      },
    ];
  }
}

// Self-register
registerProvider("other", () => new OtherProvider());
