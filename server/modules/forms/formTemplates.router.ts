import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../infra/db/connection";
import { formTemplates, generatedForms, requests, sites } from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import QRCode from "qrcode";

const fieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  labelAr: z.string().optional(),
  source: z.string(),
  type: z.enum(["text", "date", "phone", "email", "custom"]),
  isRequired: z.boolean(),
  sortOrder: z.number(),
});

const infoSectionSchema = z.object({
  icon: z.string(),
  title: z.string(),
  titleAr: z.string().optional(),
  content: z.string(),
  contentAr: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

const safetyRuleSchema = z.object({
  icon: z.string(),
  iconColor: z.string(),
  title: z.string(),
  titleAr: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleAr: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

export const formTemplatesRouter = router({
  // List all form templates
  list: protectedProcedure
    .input(z.object({
      requestType: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]).optional(),
      activeOnly: z.boolean().optional().default(true),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [];
      if (input?.activeOnly) {
        conditions.push(eq(formTemplates.isActive, true));
      }
      if (input?.requestType) {
        conditions.push(eq(formTemplates.requestType, input.requestType));
      }
      
      const results = await db
        .select()
        .from(formTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(formTemplates.createdAt));
      
      return results;
    }),

  // Get a single form template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [template] = await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.id, input.id));
      
      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form template not found" });
      }
      return template;
    }),

  // Create a new form template
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      requestType: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]),
      isDefault: z.boolean().optional().default(false),
      companyName: z.string().optional().default("Centre3"),
      companyNameAr: z.string().optional(),
      logoUrl: z.string().optional(),
      headerColor: z.string().optional().default("#6B21A8"),
      footerText: z.string().optional(),
      footerTextAr: z.string().optional(),
      footerPhone: z.string().optional(),
      footerEmail: z.string().optional(),
      footerDepartment: z.string().optional(),
      footerDepartmentAr: z.string().optional(),
      formTitle: z.string().optional().default("Visit Permission"),
      formTitleAr: z.string().optional(),
      formSubtitle: z.string().optional(),
      formSubtitleAr: z.string().optional(),
      fields: z.array(fieldSchema),
      infoSections: z.array(infoSectionSchema).optional(),
      safetyRules: z.array(safetyRuleSchema).optional(),
      disclaimerText: z.string().optional(),
      disclaimerTextAr: z.string().optional(),
      showQrCode: z.boolean().optional().default(true),
      qrCodePosition: z.enum(["top-right", "top-left", "bottom-right", "bottom-left"]).optional().default("top-right"),
      showWatermark: z.boolean().optional(),
      watermarkText: z.string().optional(),
      pageSize: z.enum(["a4", "letter"]).optional().default("a4"),
      orientation: z.enum(["portrait", "landscape"]).optional().default("portrait"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // If setting as default, unset other defaults for same request type
      if (input.isDefault) {
        await db
          .update(formTemplates)
          .set({ isDefault: false })
          .where(eq(formTemplates.requestType, input.requestType));
      }

      const [result] = await db.insert(formTemplates).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { id: result.insertId, success: true };
    }),

  // Update a form template
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      requestType: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]).optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
      companyName: z.string().optional(),
      companyNameAr: z.string().optional(),
      logoUrl: z.string().optional(),
      headerColor: z.string().optional(),
      footerText: z.string().optional(),
      footerTextAr: z.string().optional(),
      footerPhone: z.string().optional(),
      footerEmail: z.string().optional(),
      footerDepartment: z.string().optional(),
      footerDepartmentAr: z.string().optional(),
      formTitle: z.string().optional(),
      formTitleAr: z.string().optional(),
      formSubtitle: z.string().optional(),
      formSubtitleAr: z.string().optional(),
      fields: z.array(fieldSchema).optional(),
      infoSections: z.array(infoSectionSchema).optional(),
      safetyRules: z.array(safetyRuleSchema).optional(),
      disclaimerText: z.string().optional(),
      disclaimerTextAr: z.string().optional(),
      showQrCode: z.boolean().optional(),
      qrCodePosition: z.enum(["top-right", "top-left", "bottom-right", "bottom-left"]).optional(),
      showWatermark: z.boolean().optional(),
      watermarkText: z.string().optional(),
      pageSize: z.enum(["a4", "letter"]).optional(),
      orientation: z.enum(["portrait", "landscape"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const { id, ...data } = input;

      // If setting as default, unset other defaults for same request type
      if (data.isDefault && data.requestType) {
        await db
          .update(formTemplates)
          .set({ isDefault: false })
          .where(eq(formTemplates.requestType, data.requestType));
      }

      await db
        .update(formTemplates)
        .set(data)
        .where(eq(formTemplates.id, id));

      return { success: true };
    }),

  // Delete a form template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.delete(formTemplates).where(eq(formTemplates.id, input.id));
      return { success: true };
    }),

  // Generate QR code for a request
  generateQrCode: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      data: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const qrData = input.data || `CENTRE3-REQ-${input.requestId}-${Date.now()}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      return { qrCodeDataUrl, qrData };
    }),

  // Generate form for a request using a template
  generateForm: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      templateId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get the template
      const [template] = await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.id, input.templateId));

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form template not found" });
      }

      // Get the request data
      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      // Get site info
      let siteName = "";
      if (request.siteId) {
        const [site] = await db.select().from(sites).where(eq(sites.id, request.siteId));
        siteName = site?.name || "";
      }

      // Generate QR code
      const qrData = `CENTRE3-VP-${request.requestNumber}-${Date.now()}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      // Build form data from request
      const formData: Record<string, string> = {
        requestNumber: request.requestNumber,
        visitorName: request.visitorName,
        visitorIdType: request.visitorIdType,
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
        qrCodeDataUrl,
      };

      // Save the generated form
      const [result] = await db.insert(generatedForms).values({
        requestId: input.requestId,
        templateId: input.templateId,
        qrCodeData: qrData,
        formData,
        status: "active",
        generatedBy: ctx.user.id,
        expiresAt: new Date(request.endDate + "T23:59:59"),
      });

      return {
        id: result.insertId,
        formData,
        template,
        qrCodeDataUrl,
        qrData,
      };
    }),

  // Get generated forms for a request
  getGeneratedForms: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const forms = await db
        .select()
        .from(generatedForms)
        .where(eq(generatedForms.requestId, input.requestId))
        .orderBy(desc(generatedForms.generatedAt));
      return forms;
    }),

  // Get default template for a request type
  getDefaultTemplate: protectedProcedure
    .input(z.object({
      requestType: z.enum(["admin_visit", "work_permit", "material_entry", "tep", "mop", "escort"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [template] = await db
        .select()
        .from(formTemplates)
        .where(and(
          eq(formTemplates.requestType, input.requestType),
          eq(formTemplates.isDefault, true),
          eq(formTemplates.isActive, true),
        ));
      return template || null;
    }),
});
