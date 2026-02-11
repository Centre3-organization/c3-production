/**
 * Email Adapters — SMTP and SendGrid provider implementations
 * 
 * These providers implement the MessagingProvider interface but only support
 * the email channel. sendSms and sendWhatsApp return errors gracefully.
 * 
 * Supports two email provider types:
 * - smtp: Direct SMTP connection (any SMTP server)
 * - sendgrid: SendGrid API integration
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

// ============================================================================
// SMTP Provider
// ============================================================================

class SmtpProvider implements MessagingProvider {
  readonly slug = "smtp";
  readonly name = "SMTP Email";

  private host = "";
  private port = 587;
  private secure = false;
  private user = "";
  private password = "";
  private fromEmail = "";
  private fromName = "Centre3";

  initialize(credentials: ProviderCredentials): void {
    this.host = credentials.smtp_host || "";
    this.port = parseInt(credentials.smtp_port || "587");
    this.secure = credentials.smtp_secure === "true";
    this.user = credentials.smtp_user || "";
    this.password = credentials.smtp_password || "";
    this.fromEmail = credentials.from_email || "";
    this.fromName = credentials.from_name || "Centre3";
  }

  getRequiredCredentials(): CredentialField[] {
    return [
      { key: "smtp_host", label: "SMTP Host", type: "text", required: true, placeholder: "smtp.gmail.com", helpText: "SMTP server hostname" },
      { key: "smtp_port", label: "SMTP Port", type: "text", required: true, placeholder: "587", helpText: "Usually 587 (TLS) or 465 (SSL)" },
      { key: "smtp_secure", label: "Use SSL/TLS", type: "text", required: false, placeholder: "true or false", helpText: "Set to 'true' for port 465" },
      { key: "smtp_user", label: "SMTP Username", type: "text", required: true, placeholder: "user@example.com" },
      { key: "smtp_password", label: "SMTP Password", type: "password", required: true, placeholder: "••••••••" },
      { key: "from_email", label: "From Email", type: "text", required: true, placeholder: "noreply@centre3.com", helpText: "Sender email address" },
      { key: "from_name", label: "From Name", type: "text", required: false, placeholder: "Centre3", helpText: "Display name for the sender" },
    ];
  }

  async sendSms(_request: SendSmsRequest): Promise<SendResult> {
    return { success: false, errorCode: "UNSUPPORTED", errorMessage: "SMTP provider does not support SMS" };
  }

  async sendWhatsApp(_request: SendWhatsAppRequest): Promise<SendResult> {
    return { success: false, errorCode: "UNSUPPORTED", errorMessage: "SMTP provider does not support WhatsApp" };
  }

  /**
   * Send email via SMTP using nodemailer.
   * We dynamically import nodemailer to avoid breaking if it's not installed.
   */
  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<SendResult> {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: { user: this.user, pass: this.password },
      });

      const info = await transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        text: body,
        html: html || body.replace(/\n/g, "<br>"),
      });

      return { success: true, providerMessageId: info.messageId, status: "sent" };
    } catch (err: any) {
      return { success: false, errorCode: "SMTP_ERROR", errorMessage: err.message || "SMTP send failed" };
    }
  }

  async testConnection(): Promise<ProviderHealthCheck> {
    const start = Date.now();
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: { user: this.user, pass: this.password },
      });
      await transporter.verify();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}

// ============================================================================
// SendGrid Provider
// ============================================================================

class SendGridProvider implements MessagingProvider {
  readonly slug = "sendgrid";
  readonly name = "SendGrid";

  private apiKey = "";
  private fromEmail = "";
  private fromName = "Centre3";

  initialize(credentials: ProviderCredentials): void {
    this.apiKey = credentials.sendgrid_api_key || "";
    this.fromEmail = credentials.from_email || "";
    this.fromName = credentials.from_name || "Centre3";
  }

  getRequiredCredentials(): CredentialField[] {
    return [
      { key: "sendgrid_api_key", label: "SendGrid API Key", type: "password", required: true, placeholder: "SG.xxxx", helpText: "Found in SendGrid Dashboard → Settings → API Keys" },
      { key: "from_email", label: "From Email", type: "text", required: true, placeholder: "noreply@centre3.com", helpText: "Must be a verified sender in SendGrid" },
      { key: "from_name", label: "From Name", type: "text", required: false, placeholder: "Centre3", helpText: "Display name for the sender" },
    ];
  }

  async sendSms(_request: SendSmsRequest): Promise<SendResult> {
    return { success: false, errorCode: "UNSUPPORTED", errorMessage: "SendGrid provider does not support SMS" };
  }

  async sendWhatsApp(_request: SendWhatsAppRequest): Promise<SendResult> {
    return { success: false, errorCode: "UNSUPPORTED", errorMessage: "SendGrid provider does not support WhatsApp" };
  }

  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<SendResult> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.fromEmail, name: this.fromName },
          subject,
          content: [
            { type: "text/plain", value: body },
            ...(html ? [{ type: "text/html", value: html }] : []),
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        const messageId = response.headers.get("X-Message-Id") || undefined;
        return { success: true, providerMessageId: messageId, status: "sent" };
      } else {
        const errorBody = await response.text();
        return { success: false, errorCode: `HTTP_${response.status}`, errorMessage: `SendGrid error: ${errorBody}` };
      }
    } catch (err: any) {
      return { success: false, errorCode: "NETWORK_ERROR", errorMessage: err.message || "SendGrid send failed" };
    }
  }

  async testConnection(): Promise<ProviderHealthCheck> {
    const start = Date.now();
    try {
      const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
        headers: { "Authorization": `Bearer ${this.apiKey}` },
      });
      if (response.ok) {
        return { healthy: true, latencyMs: Date.now() - start };
      }
      return { healthy: false, latencyMs: Date.now() - start, error: `HTTP ${response.status}` };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}

// ============================================================================
// Register providers
// ============================================================================

registerProvider("smtp", () => new SmtpProvider());
registerProvider("sendgrid", () => new SendGridProvider());

export { SmtpProvider, SendGridProvider };
