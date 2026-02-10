/**
 * Twilio Adapter
 * 
 * Implements the MessagingProvider interface for Twilio.
 * Supports both SMS and WhatsApp via Twilio's REST API.
 * WhatsApp uses Twilio's WhatsApp Business API (prefix: whatsapp:+...).
 */

import type {
  MessagingProvider,
  SendSmsRequest,
  SendWhatsAppRequest,
  SendResult,
  ProviderCredentials,
  ProviderHealthCheck,
  CredentialField,
} from "./messaging.provider";
import { registerProvider } from "./messaging.provider";

class TwilioProvider implements MessagingProvider {
  readonly slug = "twilio";
  readonly name = "Twilio";

  private accountSid = "";
  private authToken = "";
  private fromNumber = "";        // SMS sender number
  private whatsappNumber = "";    // WhatsApp sender number (without whatsapp: prefix)

  initialize(credentials: ProviderCredentials): void {
    this.accountSid = credentials.accountSid || "";
    this.authToken = credentials.authToken || "";
    this.fromNumber = credentials.fromNumber || "";
    this.whatsappNumber = credentials.whatsappNumber || "";
  }

  getRequiredCredentials(): CredentialField[] {
    return [
      {
        key: "accountSid",
        label: "Account SID",
        type: "text",
        required: true,
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        helpText: "Found in your Twilio Console Dashboard",
      },
      {
        key: "authToken",
        label: "Auth Token",
        type: "password",
        required: true,
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        helpText: "Found in your Twilio Console Dashboard",
      },
      {
        key: "fromNumber",
        label: "SMS Sender Number",
        type: "phone",
        required: true,
        placeholder: "+14155551234",
        helpText: "Your Twilio phone number for sending SMS (E.164 format)",
      },
      {
        key: "whatsappNumber",
        label: "WhatsApp Sender Number",
        type: "phone",
        required: false,
        placeholder: "+14155551234",
        helpText: "Your Twilio WhatsApp-enabled number (E.164 format). Leave empty if not using WhatsApp.",
      },
    ];
  }

  async sendSms(request: SendSmsRequest): Promise<SendResult> {
    try {
      const from = request.from || this.fromNumber;
      if (!from) {
        return { success: false, errorCode: "NO_SENDER", errorMessage: "No SMS sender number configured" };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: request.to,
        From: from,
        Body: request.body,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          errorCode: String(data.code || response.status),
          errorMessage: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        providerMessageId: data.sid,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: error.message || "Failed to connect to Twilio",
      };
    }
  }

  async sendWhatsApp(request: SendWhatsAppRequest): Promise<SendResult> {
    try {
      const from = request.from || this.whatsappNumber;
      if (!from) {
        return { success: false, errorCode: "NO_SENDER", errorMessage: "No WhatsApp sender number configured" };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params: Record<string, string> = {
        To: `whatsapp:${request.to}`,
        From: `whatsapp:${from}`,
        Body: request.body,
      };
      if (request.mediaUrl) {
        params.MediaUrl = request.mediaUrl;
      }

      const body = new URLSearchParams(params);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          errorCode: String(data.code || response.status),
          errorMessage: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        providerMessageId: data.sid,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: error.message || "Failed to connect to Twilio",
      };
    }
  }

  async testConnection(): Promise<ProviderHealthCheck> {
    const start = Date.now();
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
        },
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const data = await response.json() as any;
        return {
          healthy: false,
          latencyMs,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return { healthy: true, latencyMs };
    } catch (error: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: error.message || "Connection failed",
      };
    }
  }
}

// Register Twilio in the provider registry
registerProvider("twilio", () => new TwilioProvider());

export { TwilioProvider };
