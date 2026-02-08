import express from "express";
import { getDb } from "../../infra/db/connection";
import { formTemplates, generatedForms, requests, sites } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";
import { sdk } from "../../_core/sdk";
import { COOKIE_NAME } from "../../../shared/const";

const router = express.Router();

// Helper to map request type to template requestType
const typeMapping: Record<string, string> = {
  admin_visit: "admin_visit",
  work_permit: "work_permit",
  material_entry: "material_entry",
  tep: "tep",
  mop: "mop",
  escort: "escort",
};

// Safety rule icon SVGs (inline for PDF rendering)
const safetyIconSvgs: Record<string, string> = {
  "hard-hat": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 15V6a2 2 0 0 1 4 0v9"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></svg>`,
  "shield-alert": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  "eye": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  "camera": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  "cigarette-off": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M12 12H2v4h14"/><path d="M22 12v4"/><path d="M18 12h-.5"/></svg>`,
  "phone-off": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67"/></svg>`,
  "alert-triangle": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  "badge-check": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
};

function generateFormHtml(
  template: any,
  formData: Record<string, string>,
  qrCodeDataUrl: string
): string {
  const headerColor = template.headerColor || "#6B21A8";
  const fields = (template.fields as any[]) || [];
  const safetyRules = (template.safetyRules as any[]) || [];
  const infoSections = (template.infoSections as any[]) || [];

  // Build field rows HTML
  const fieldRows = fields
    .filter((f: any) => f.isRequired || formData[f.key])
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((field: any) => {
      let value = formData[field.key] || "N/A";
      if (field.type === "date" && value && value !== "N/A") {
        try {
          value = new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch {}
      }
      return `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background: #f9fafb; width: 35%; font-size: 12px; color: #374151;">
            ${field.label}${field.labelAr ? `<br/><span style="font-size: 11px; color: #6b7280; direction: rtl;">${field.labelAr}</span>` : ""}
          </td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 12px; color: #111827;">
            ${value}
          </td>
        </tr>
      `;
    })
    .join("");

  // Build safety rules HTML
  const safetyRulesHtml = safetyRules
    .filter((r: any) => r.isActive)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((rule: any) => {
      const iconSvg = safetyIconSvgs[rule.icon] || safetyIconSvgs["alert-triangle"];
      return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 6px 0;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${rule.iconColor || "#dc2626"}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${rule.iconColor || "#dc2626"};">
            ${iconSvg}
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #111827;">${rule.title}${rule.titleAr ? ` / <span style="direction: rtl;">${rule.titleAr}</span>` : ""}</div>
            ${rule.subtitle ? `<div style="font-size: 10px; color: #6b7280;">${rule.subtitle}${rule.subtitleAr ? ` / <span style="direction: rtl;">${rule.subtitleAr}</span>` : ""}</div>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  // Build info sections HTML
  const infoSectionsHtml = infoSections
    .filter((s: any) => s.isActive)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map((section: any) => {
      return `
        <div style="margin-bottom: 8px; padding: 8px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid ${headerColor};">
          <div style="font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 4px;">
            ${section.title}${section.titleAr ? ` / <span style="direction: rtl;">${section.titleAr}</span>` : ""}
          </div>
          <div style="font-size: 10px; color: #374151;">
            ${section.content}${section.contentAr ? `<br/><span style="direction: rtl;">${section.contentAr}</span>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', 'Segoe UI', sans-serif; 
      background: white; 
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background: white;
      position: relative;
    }
    
    @media print {
      .page { 
        width: 100%;
        min-height: auto;
        page-break-after: always;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); padding: 20px 30px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        ${template.logoUrl ? `<img src="${template.logoUrl}" style="height: 40px; margin-bottom: 8px;" />` : ""}
        <div style="font-size: 22px; font-weight: 700; color: white; letter-spacing: 0.5px;">
          ${template.companyName || "Centre3"}
          ${template.companyNameAr ? `<span style="font-size: 16px; margin-left: 12px; opacity: 0.9; direction: rtl;">${template.companyNameAr}</span>` : ""}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: 600; color: white;">
          ${template.formTitle || "Visit Permission"}
        </div>
        ${template.formTitleAr ? `<div style="font-size: 13px; color: rgba(255,255,255,0.9); direction: rtl;">${template.formTitleAr}</div>` : ""}
        ${template.formSubtitle ? `<div style="font-size: 10px; color: rgba(255,255,255,0.8); margin-top: 4px;">${template.formSubtitle}</div>` : ""}
      </div>
    </div>

    <!-- Content Area -->
    <div style="padding: 20px 30px;">
      <!-- QR Code and Request Number -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Request Number</div>
          <div style="font-size: 16px; font-weight: 700; color: ${headerColor}; font-family: monospace;">${formData.requestNumber || "N/A"}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">
            Type: ${formData.type ? formData.type.replace(/_/g, " ").toUpperCase() : "N/A"}
          </div>
        </div>
        ${template.showQrCode !== false ? `
          <div style="text-align: center;">
            <img src="${qrCodeDataUrl}" style="width: 100px; height: 100px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px;" />
            <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">Scan for verification</div>
          </div>
        ` : ""}
      </div>

      <!-- Visitor Information Table -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: ${headerColor}; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid ${headerColor};">
          Visitor Information / <span style="direction: rtl;">معلومات الزائر</span>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${fieldRows}
        </table>
      </div>

      <!-- Info Sections -->
      ${infoSectionsHtml ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: ${headerColor}; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid ${headerColor};">
            Important Information / <span style="direction: rtl;">معلومات هامة</span>
          </div>
          ${infoSectionsHtml}
        </div>
      ` : ""}

      <!-- Safety Rules -->
      ${safetyRulesHtml ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #dc2626;">
            Safety Rules & Instructions / <span style="direction: rtl;">قواعد وتعليمات السلامة</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            ${safetyRulesHtml}
          </div>
        </div>
      ` : ""}

      <!-- Disclaimer -->
      ${template.disclaimerText ? `
        <div style="margin-bottom: 16px; padding: 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px;">
          <div style="font-size: 10px; font-weight: 600; color: #92400e;">⚠ Disclaimer / إخلاء المسؤولية</div>
          <div style="font-size: 9px; color: #78350f; margin-top: 4px;">
            ${template.disclaimerText}
            ${template.disclaimerTextAr ? `<br/><span style="direction: rtl;">${template.disclaimerTextAr}</span>` : ""}
          </div>
        </div>
      ` : ""}

      <!-- Signature Area -->
      <div style="margin-top: 20px; display: flex; justify-content: space-between; gap: 30px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-bottom: 1px solid #d1d5db; height: 40px; margin-bottom: 6px;"></div>
          <div style="font-size: 10px; color: #6b7280;">Visitor Signature / <span style="direction: rtl;">توقيع الزائر</span></div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-bottom: 1px solid #d1d5db; height: 40px; margin-bottom: 6px;"></div>
          <div style="font-size: 10px; color: #6b7280;">Security Officer / <span style="direction: rtl;">ضابط الأمن</span></div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-bottom: 1px solid #d1d5db; height: 40px; margin-bottom: 6px;"></div>
          <div style="font-size: 10px; color: #6b7280;">Authorized By / <span style="direction: rtl;">مصرح من قبل</span></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: ${headerColor}; padding: 12px 30px; display: flex; justify-content: space-between; align-items: center;">
      <div style="color: rgba(255,255,255,0.9); font-size: 9px;">
        ${template.footerDepartment || "Security Operations Department"}
        ${template.footerDepartmentAr ? ` / <span style="direction: rtl;">${template.footerDepartmentAr}</span>` : ""}
      </div>
      <div style="color: rgba(255,255,255,0.8); font-size: 9px;">
        ${template.footerPhone ? `📞 ${template.footerPhone}` : ""}
        ${template.footerEmail ? ` | ✉ ${template.footerEmail}` : ""}
      </div>
      <div style="color: rgba(255,255,255,0.7); font-size: 8px;">
        ${template.footerText || `© ${new Date().getFullYear()} ${template.companyName || "Centre3"}. All rights reserved.`}
      </div>
    </div>

    ${template.showWatermark ? `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: 700; color: rgba(0,0,0,0.03); pointer-events: none; white-space: nowrap;">
        ${template.watermarkText || template.companyName || "Centre3"}
      </div>
    ` : ""}
  </div>

  <!-- Print Button (hidden in print) -->
  <div class="no-print" style="text-align: center; padding: 20px;">
    <button onclick="window.print()" style="padding: 12px 32px; background: ${headerColor}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;">
      🖨️ Print / Download PDF
    </button>
  </div>
</body>
</html>
  `;
}

// GET /api/forms/pdf/:requestId - Generate and serve the form as printable HTML
router.get("/pdf/:requestId", async (req, res) => {
  try {
    // Authenticate user from cookie, Authorization header, or query token
    let user;
    try {
      // If token is in query param, add it as Authorization header for SDK
      if (req.query.token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${req.query.token}`;
      }
      user = await sdk.authenticateRequest(req as any);
    } catch (e) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Get the request
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId));

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Get site info
    let siteName = "";
    if (request.siteId) {
      const [site] = await db
        .select()
        .from(sites)
        .where(eq(sites.id, request.siteId));
      siteName = site?.name || "";
    }

    // Find the matching template for this request type
    const requestType = typeMapping[request.type] || request.type;
    let [template] = await db
      .select()
      .from(formTemplates)
      .where(
        and(
          eq(formTemplates.requestType, requestType as any),
          eq(formTemplates.isDefault, true),
          eq(formTemplates.isActive, true)
        )
      );

    // If no default template, get any active template for this type
    if (!template) {
      [template] = await db
        .select()
        .from(formTemplates)
        .where(
          and(
            eq(formTemplates.requestType, requestType as any),
            eq(formTemplates.isActive, true)
          )
        );
    }

    // If still no template, use a generic one
    if (!template) {
      [template] = await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.isActive, true));
    }

    if (!template) {
      return res.status(404).json({ error: "No form template found" });
    }

    // Generate QR code
    const qrData = `CENTRE3-VP-${request.requestNumber}-${requestId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Build form data
    const formData: Record<string, string> = {
      requestNumber: request.requestNumber,
      visitorName: request.visitorName,
      visitorIdType: request.visitorIdType?.replace(/_/g, " ").toUpperCase() || "",
      visitorIdNumber: request.visitorIdNumber,
      visitorCompany: request.visitorCompany || "",
      visitorPhone: request.visitorPhone || "",
      visitorEmail: request.visitorEmail || "",
      purpose: request.purpose || "",
      startDate: request.startDate,
      endDate: request.endDate,
      startTime: request.startTime || "",
      endTime: request.endTime || "",
      siteName,
      type: request.type,
    };

    // Generate the HTML
    const html = generateFormHtml(template, formData, qrCodeDataUrl);

    // Return as HTML (user can print to PDF from browser)
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate form" });
  }
});

export default router;
