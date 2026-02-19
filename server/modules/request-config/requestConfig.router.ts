import { z } from "zod";
import { router, protectedProcedure, adminProcedure, publicProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../infra/db/connection";
import { eq, and, asc, desc, like, or, inArray, sql, count } from "drizzle-orm";
import {
  requestCategories,
  requestTypes,
  formSections,
  formFields,
  fieldOptions,
  countries,
  regions,
  cities,
  sites,
  zones,
  areas,
  departments,
  groups,
  users,
  userGroupMembership,
  groupAccessPolicies,
  approvalRoles,
  cardCompanies,
  materialTypes,
} from "../../../drizzle/schema";

// ============================================================================
// REQUEST CATEGORIES ROUTER
// ============================================================================

export const requestCategoriesRouter = router({
  // List all categories (for users - filtered by access)
  list: protectedProcedure
    .input(
      z.object({
        includeInactive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [];
      if (!input?.includeInactive) {
        conditions.push(eq(requestCategories.isActive, true));
      }

      const cats = await db
        .select()
        .from(requestCategories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(requestCategories.displayOrder));

      // Get types for each category
      const result = [];
      for (const cat of cats) {
        const types = await db
          .select({
            id: requestTypes.id,
            code: requestTypes.code,
            name: requestTypes.name,
            nameAr: requestTypes.nameAr,
            shortCode: requestTypes.shortCode,
            description: requestTypes.description,
            isExclusive: requestTypes.isExclusive,
            maxDurationDays: requestTypes.maxDurationDays,
            displayOrder: requestTypes.displayOrder,
          })
          .from(requestTypes)
          .where(and(eq(requestTypes.categoryId, cat.id), eq(requestTypes.isActive, true)))
          .orderBy(asc(requestTypes.displayOrder));

        const typeCount = types.length;
        result.push({ ...cat, types, typeCount });
      }

      return result;
    }),

  // Get category by ID with full details
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [category] = await db
        .select()
        .from(requestCategories)
        .where(eq(requestCategories.id, input.id));

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      const types = await db
        .select()
        .from(requestTypes)
        .where(eq(requestTypes.categoryId, input.id))
        .orderBy(asc(requestTypes.displayOrder));

      return { ...category, types };
    }),

  // Create category (admin only)
  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        nameAr: z.string().max(255).optional(),
        description: z.string().optional(),
        icon: z.string().max(100).optional(),
        displayOrder: z.number().optional(),
        requiresInternalOnly: z.boolean().optional(),
        allowMultipleTypes: z.boolean().optional(),
        typeCombinationRules: z.record(z.string(), z.any()).optional(),
        hasRequestorSection: z.boolean().optional(),
        hasLocationSection: z.boolean().optional(),
        hasScheduleSection: z.boolean().optional(),
        hasVisitorSection: z.boolean().optional(),
        hasAttachmentSection: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(requestCategories).values({
        code: input.code,
        name: input.name,
        nameAr: input.nameAr ?? null,
        description: input.description ?? null,
        icon: input.icon ?? null,
        displayOrder: input.displayOrder ?? 0,
        requiresInternalOnly: input.requiresInternalOnly ?? false,
        allowMultipleTypes: input.allowMultipleTypes ?? false,
        typeCombinationRules: input.typeCombinationRules ?? null,
        hasRequestorSection: input.hasRequestorSection ?? true,
        hasLocationSection: input.hasLocationSection ?? true,
        hasScheduleSection: input.hasScheduleSection ?? true,
        hasVisitorSection: input.hasVisitorSection ?? true,
        hasAttachmentSection: input.hasAttachmentSection ?? true,
      });

      return { id: result.insertId, success: true };
    }),

  // Update category (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        nameAr: z.string().max(255).optional(),
        description: z.string().optional(),
        icon: z.string().max(100).optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        requiresInternalOnly: z.boolean().optional(),
        allowMultipleTypes: z.boolean().optional(),
        typeCombinationRules: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, ...data } = input;
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(requestCategories).set(updateData).where(eq(requestCategories.id, id));
      }

      return { success: true };
    }),

  // Delete category (admin only - soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(requestCategories).set({ isActive: false }).where(eq(requestCategories.id, input.id));
      return { success: true };
    }),
});

// ============================================================================
// REQUEST TYPES ROUTER
// ============================================================================

export const requestTypesRouter = router({
  // List all types
  list: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        includeInactive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [];
      if (input?.categoryId) {
        conditions.push(eq(requestTypes.categoryId, input.categoryId));
      }
      if (!input?.includeInactive) {
        conditions.push(eq(requestTypes.isActive, true));
      }

      const types = await db
        .select({
          id: requestTypes.id,
          categoryId: requestTypes.categoryId,
          code: requestTypes.code,
          name: requestTypes.name,
          nameAr: requestTypes.nameAr,
          shortCode: requestTypes.shortCode,
          description: requestTypes.description,
          displayOrder: requestTypes.displayOrder,
          isActive: requestTypes.isActive,
          isExclusive: requestTypes.isExclusive,
          maxDurationDays: requestTypes.maxDurationDays,
          workflowId: requestTypes.workflowId,
          generateQrCode: requestTypes.generateQrCode,
          generateDcpForm: requestTypes.generateDcpForm,
          notifyEmail: requestTypes.notifyEmail,
          notifySms: requestTypes.notifySms,
          categoryName: requestCategories.name,
          categoryCode: requestCategories.code,
        })
        .from(requestTypes)
        .leftJoin(requestCategories, eq(requestTypes.categoryId, requestCategories.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(requestTypes.displayOrder));

      return types;
    }),

  // Get type by ID with sections and fields
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [type] = await db
        .select({
          id: requestTypes.id,
          categoryId: requestTypes.categoryId,
          code: requestTypes.code,
          name: requestTypes.name,
          nameAr: requestTypes.nameAr,
          shortCode: requestTypes.shortCode,
          description: requestTypes.description,
          displayOrder: requestTypes.displayOrder,
          isActive: requestTypes.isActive,
          isExclusive: requestTypes.isExclusive,
          maxDurationDays: requestTypes.maxDurationDays,
          workflowId: requestTypes.workflowId,
          generateQrCode: requestTypes.generateQrCode,
          generateDcpForm: requestTypes.generateDcpForm,
          notifyEmail: requestTypes.notifyEmail,
          notifySms: requestTypes.notifySms,
          categoryName: requestCategories.name,
          categoryCode: requestCategories.code,
        })
        .from(requestTypes)
        .leftJoin(requestCategories, eq(requestTypes.categoryId, requestCategories.id))
        .where(eq(requestTypes.id, input.id));

      if (!type) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request type not found" });
      }

      return type;
    }),

  // Create type (admin only)
  create: adminProcedure
    .input(
      z.object({
        categoryId: z.number(),
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        nameAr: z.string().max(255).optional(),
        shortCode: z.string().max(10).optional(),
        description: z.string().optional(),
        displayOrder: z.number().optional(),
        isExclusive: z.boolean().optional(),
        maxDurationDays: z.number().optional(),
        workflowId: z.number().optional(),
        generateQrCode: z.boolean().optional(),
        generateDcpForm: z.boolean().optional(),
        notifyEmail: z.boolean().optional(),
        notifySms: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(requestTypes).values({
        categoryId: input.categoryId,
        code: input.code,
        name: input.name,
        nameAr: input.nameAr ?? null,
        shortCode: input.shortCode ?? null,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        isExclusive: input.isExclusive ?? false,
        maxDurationDays: input.maxDurationDays ?? null,
        workflowId: input.workflowId ?? null,
        generateQrCode: input.generateQrCode ?? false,
        generateDcpForm: input.generateDcpForm ?? false,
        notifyEmail: input.notifyEmail ?? false,
        notifySms: input.notifySms ?? false,
      });

      return { id: result.insertId, success: true };
    }),

  // Update type (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        nameAr: z.string().max(255).optional(),
        shortCode: z.string().max(10).optional(),
        description: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        isExclusive: z.boolean().optional(),
        maxDurationDays: z.number().optional(),
        workflowId: z.number().optional(),
        generateQrCode: z.boolean().optional(),
        generateDcpForm: z.boolean().optional(),
        notifyEmail: z.boolean().optional(),
        notifySms: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, ...data } = input;
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(requestTypes).set(updateData).where(eq(requestTypes.id, id));
      }

      return { success: true };
    }),

  // Delete type (admin only - soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(requestTypes).set({ isActive: false }).where(eq(requestTypes.id, input.id));
      return { success: true };
    }),
});

// ============================================================================
// FORM DEFINITION ROUTER (User-facing)
// ============================================================================

export const formDefinitionRouter = router({
  // Get form definition for selected types (used during request creation)
  getForTypes: protectedProcedure
    .input(z.object({ typeIds: z.array(z.number()).min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get types with category info
      const typesData = await db
        .select({
          id: requestTypes.id,
          code: requestTypes.code,
          name: requestTypes.name,
          nameAr: requestTypes.nameAr,
          shortCode: requestTypes.shortCode,
          maxDurationDays: requestTypes.maxDurationDays,
          isExclusive: requestTypes.isExclusive,
          categoryCode: requestCategories.code,
          categoryName: requestCategories.name,
          allowMultipleTypes: requestCategories.allowMultipleTypes,
          typeCombinationRules: requestCategories.typeCombinationRules,
        })
        .from(requestTypes)
        .leftJoin(requestCategories, eq(requestTypes.categoryId, requestCategories.id))
        .where(inArray(requestTypes.id, input.typeIds));

      if (typesData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No types found" });
      }

      // Build a type order map for sorting
      const typeOrderMap = new Map<string, number>();
      typesData.forEach((t, i) => typeOrderMap.set(t.code, i));

      // Get sections for all selected types
      const allSections = await db
        .select()
        .from(formSections)
        .where(
          and(
            inArray(formSections.requestTypeId, input.typeIds),
            eq(formSections.isActive, true)
          )
        )
        .orderBy(asc(formSections.displayOrder));

      // Get fields for all sections
      const sectionIds = allSections.map(s => s.id);
      let allFields: any[] = [];
      if (sectionIds.length > 0) {
        allFields = await db
          .select()
          .from(formFields)
          .where(
            and(
              inArray(formFields.sectionId, sectionIds),
              eq(formFields.isActive, true)
            )
          )
          .orderBy(asc(formFields.displayOrder));
      }

      // Group fields by section
      const fieldsBySection = new Map<number, any[]>();
      for (const field of allFields) {
        const list = fieldsBySection.get(field.sectionId) || [];
        list.push(field);
        fieldsBySection.set(field.sectionId, list);
      }

      // Build sections with fields, including typeCode
      const sections = allSections.map(s => {
        const typeData = typesData.find(t => t.id === s.requestTypeId);
        return {
          ...s,
          typeCode: typeData?.code || '',
          fields: fieldsBySection.get(s.id) || [],
        };
      });

      // Sort: type-specific sections grouped by type order, then display order
      sections.sort((a, b) => {
        const typeOrderA = typeOrderMap.get(a.typeCode) ?? 999;
        const typeOrderB = typeOrderMap.get(b.typeCode) ?? 999;
        if (typeOrderA !== typeOrderB) return typeOrderA - typeOrderB;
        return a.displayOrder - b.displayOrder;
      });

      return {
        types: typesData.map(t => ({
          id: t.id,
          code: t.code,
          name: t.name,
          nameAr: t.nameAr,
          shortCode: t.shortCode,
          maxDurationDays: t.maxDurationDays,
          isExclusive: t.isExclusive,
        })),
        categoryCode: typesData[0].categoryCode,
        categoryName: typesData[0].categoryName,
        allowMultipleTypes: typesData[0].allowMultipleTypes,
        typeCombinationRules: typesData[0].typeCombinationRules,
        sections,
      };
    }),

  // Get form definition by category (for initial form loading)
  getByCategory: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [category] = await db
        .select()
        .from(requestCategories)
        .where(and(eq(requestCategories.id, input.categoryId), eq(requestCategories.isActive, true)));

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      const typesData = await db
        .select()
        .from(requestTypes)
        .where(and(eq(requestTypes.categoryId, input.categoryId), eq(requestTypes.isActive, true)))
        .orderBy(asc(requestTypes.displayOrder));

      return {
        category,
        types: typesData.map(t => ({
          id: t.id,
          code: t.code,
          name: t.name,
          nameAr: t.nameAr,
          shortCode: t.shortCode,
          description: t.description,
          isExclusive: t.isExclusive,
          maxDurationDays: t.maxDurationDays,
        })),
      };
    }),
});

// ============================================================================
// FORM SECTIONS ROUTER (Admin)
// ============================================================================

export const formSectionsRouter = router({
  // List sections for a type
  list: protectedProcedure
    .input(z.object({ requestTypeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const sectionsList = await db
        .select()
        .from(formSections)
        .where(eq(formSections.requestTypeId, input.requestTypeId))
        .orderBy(asc(formSections.displayOrder));

      // Get field counts for each section
      const result = [];
      for (const s of sectionsList) {
        const [countRow] = await db
          .select({ value: count() })
          .from(formFields)
          .where(eq(formFields.sectionId, s.id));
        result.push({ ...s, fieldCount: countRow?.value ?? 0 });
      }

      return result;
    }),

  // Create section (admin only)
  create: adminProcedure
    .input(
      z.object({
        requestTypeId: z.number(),
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        nameAr: z.string().max(255).optional(),
        icon: z.string().max(100).optional(),
        displayOrder: z.number().optional(),
        isRepeatable: z.boolean().optional(),
        minItems: z.number().optional(),
        maxItems: z.number().optional(),
        showCondition: z.object({
          field: z.string(),
          operator: z.enum(["equals", "not_equals", "in", "not_empty", "empty"]).optional(),
          value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(formSections).values({
        requestTypeId: input.requestTypeId,
        code: input.code,
        name: input.name,
        nameAr: input.nameAr ?? null,
        icon: input.icon ?? null,
        displayOrder: input.displayOrder ?? 0,
        isRepeatable: input.isRepeatable ?? false,
        minItems: input.minItems ?? 0,
        maxItems: input.maxItems ?? 100,
        showCondition: input.showCondition ?? null,
      });

      return { id: result.insertId, success: true };
    }),

  // Update section (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        nameAr: z.string().max(255).optional(),
        icon: z.string().max(100).optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        isRepeatable: z.boolean().optional(),
        minItems: z.number().optional(),
        maxItems: z.number().optional(),
        showCondition: z.object({
          field: z.string(),
          operator: z.enum(["equals", "not_equals", "in", "not_empty", "empty"]).optional(),
          value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
        }).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, ...data } = input;
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(formSections).set(updateData).where(eq(formSections.id, id));
      }

      return { success: true };
    }),

  // Delete section (admin only - soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(formSections).set({ isActive: false }).where(eq(formSections.id, input.id));
      return { success: true };
    }),

  // Update section order (admin only)
  updateOrder: adminProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.number(),
            displayOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      for (const update of input.updates) {
        await db.update(formSections).set({ displayOrder: update.displayOrder }).where(eq(formSections.id, update.id));
      }

      return { success: true };
    }),
});

// ============================================================================
// FORM FIELDS ROUTER (Admin)
// ============================================================================

export const formFieldsRouter = router({
  // List fields for a section
  list: protectedProcedure
    .input(z.object({ sectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const fields = await db
        .select()
        .from(formFields)
        .where(eq(formFields.sectionId, input.sectionId))
        .orderBy(asc(formFields.displayOrder));

      return fields;
    }),

  // Create field (admin only)
  create: adminProcedure
    .input(
      z.object({
        sectionId: z.number(),
        code: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
        nameAr: z.string().max(255).optional(),
        fieldType: z.enum([
          "text", "textarea", "number", "email", "phone", "date", "datetime",
          "dropdown", "dropdown_multi", "radio", "checkbox", "checkbox_group",
          "file", "file_multi", "user_lookup", "readonly"
        ]),
        isRequired: z.boolean().optional(),
        displayOrder: z.number().optional(),
        columnSpan: z.number().min(1).max(12).optional(),
        placeholder: z.string().max(255).optional(),
        placeholderAr: z.string().max(255).optional(),
        helpText: z.string().optional(),
        helpTextAr: z.string().optional(),
        defaultValue: z.string().max(500).optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
          labelAr: z.string().optional(),
        })).optional(),
        optionsSource: z.enum([
          "static", "api", "dependent",
          "countries", "regions", "cities",
          "sites", "zones", "areas",
          "departments", "groups", "users", "contractors",
          "request_types", "approval_roles",
          "user_sites", "user_groups", "user_departments"
        ]).optional(),
        filterByField: z.string().max(100).optional(),
        optionsApi: z.string().max(500).optional(),
        dependsOnField: z.string().max(100).optional(),
        validation: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          minLength: z.number().optional(),
          maxLength: z.number().optional(),
          pattern: z.string().optional(),
          patternMessage: z.string().optional(),
          accept: z.string().optional(),
          maxSizeMB: z.number().optional(),
          maxFiles: z.number().optional(),
        }).optional(),
        showCondition: z.object({
          field: z.string(),
          operator: z.enum(["equals", "not_equals", "in", "not_empty", "empty"]).optional(),
          value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(formFields).values({
        sectionId: input.sectionId,
        code: input.code,
        name: input.name,
        nameAr: input.nameAr ?? null,
        fieldType: input.fieldType,
        isRequired: input.isRequired ?? false,
        displayOrder: input.displayOrder ?? 0,
        columnSpan: input.columnSpan ?? 6,
        placeholder: input.placeholder ?? null,
        placeholderAr: input.placeholderAr ?? null,
        helpText: input.helpText ?? null,
        helpTextAr: input.helpTextAr ?? null,
        defaultValue: input.defaultValue ?? null,
        options: input.options ?? null,
        optionsSource: input.optionsSource ?? 'static',
        optionsApi: input.optionsApi ?? null,
        dependsOnField: input.dependsOnField ?? null,
        validation: input.validation ?? null,
        showCondition: input.showCondition ?? null,
      });

      return { id: result.insertId, success: true };
    }),

  // Update field (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        nameAr: z.string().max(255).optional(),
        fieldType: z.enum([
          "text", "textarea", "number", "email", "phone", "date", "datetime",
          "dropdown", "dropdown_multi", "radio", "checkbox", "checkbox_group",
          "file", "file_multi", "user_lookup", "readonly"
        ]).optional(),
        isRequired: z.boolean().optional(),
        displayOrder: z.number().optional(),
        columnSpan: z.number().min(1).max(12).optional(),
        isActive: z.boolean().optional(),
        placeholder: z.string().max(255).optional(),
        helpText: z.string().optional(),
        defaultValue: z.string().max(500).optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
          labelAr: z.string().optional(),
        })).nullable().optional(),
        optionsSource: z.enum([
          "static", "api", "dependent",
          "countries", "regions", "cities",
          "sites", "zones", "areas",
          "departments", "groups", "users", "contractors",
          "request_types", "approval_roles",
          "user_sites", "user_groups", "user_departments"
        ]).optional(),
        filterByField: z.string().max(100).optional(),
        optionsApi: z.string().max(500).nullable().optional(),
        dependsOnField: z.string().max(100).nullable().optional(),
        validation: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          minLength: z.number().optional(),
          maxLength: z.number().optional(),
          pattern: z.string().optional(),
          patternMessage: z.string().optional(),
          accept: z.string().optional(),
          maxSizeMB: z.number().optional(),
          maxFiles: z.number().optional(),
        }).nullable().optional(),
        showCondition: z.object({
          field: z.string(),
          operator: z.enum(["equals", "not_equals", "in", "not_empty", "empty"]).optional(),
          value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
        }).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, ...data } = input;
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(formFields).set(updateData).where(eq(formFields.id, id));
      }

      return { success: true };
    }),

  // Delete field (admin only - soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(formFields).set({ isActive: false }).where(eq(formFields.id, input.id));
      return { success: true };
    }),

  // Update field order (admin only)
  updateOrder: adminProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.number(),
            displayOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      for (const update of input.updates) {
        await db.update(formFields).set({ displayOrder: update.displayOrder }).where(eq(formFields.id, update.id));
      }

      return { success: true };
    }),

  // Get dependent field options
  getOptions: publicProcedure
    .input(
      z.object({
        fieldId: z.number(),
        parentValue: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // First check if field has static options
      const [field] = await db
        .select({
          options: formFields.options,
          optionsSource: formFields.optionsSource,
          optionsApi: formFields.optionsApi,
        })
        .from(formFields)
        .where(eq(formFields.id, input.fieldId));

      if (!field) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
      }

      if (field.optionsSource === 'static' && field.options) {
        return field.options;
      }

      // Check fieldOptions table
      const conditions = [
        eq(fieldOptions.fieldId, input.fieldId),
        eq(fieldOptions.isActive, true),
      ];
      if (input.parentValue) {
        conditions.push(eq(fieldOptions.parentValue, input.parentValue));
      }

      const options = await db
        .select({
          value: fieldOptions.value,
          label: fieldOptions.label,
          labelAr: fieldOptions.labelAr,
        })
        .from(fieldOptions)
        .where(and(...conditions))
        .orderBy(asc(fieldOptions.displayOrder));

      return options;
    }),

  // Get options from data source (comprehensive portal-wide data sources)
  getDataSourceOptions: protectedProcedure
    .input(
      z.object({
        source: z.enum([
          "static", "api", "dependent",
          "countries", "regions", "cities",
          "sites", "zones", "areas",
          "departments", "groups", "users", "contractors",
          "request_types", "approval_roles",
          "user_sites", "user_groups", "user_departments",
          "user_profile", "material_types"
        ]),
        filterValue: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().max(500).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input.limit || 100;
      let options: Array<{ value: string; label: string; labelAr?: string | null; qtyEnabled?: boolean }> = [];

      switch (input.source) {
        // ============ MASTER DATA SOURCES ============
        case "countries": {
          const rows = await db
            .select({ value: countries.id, label: countries.name, labelAr: countries.name })
            .from(countries)
            .where(eq(countries.isActive, true))
            .orderBy(asc(countries.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "regions": {
          const conditions = [eq(regions.isActive, true)];
          if (input.filterValue) {
            // Filter regions that have sites in the given country
            conditions.push(
              sql`${regions.id} IN (SELECT DISTINCT regionId FROM sites WHERE countryId = ${Number(input.filterValue)})`
            );
          }
          const rows = await db
            .select({ value: regions.id, label: regions.name, labelAr: regions.name })
            .from(regions)
            .where(and(...conditions))
            .orderBy(asc(regions.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "cities": {
          const conditions = [eq(cities.isActive, true)];
          if (input.filterValue) {
            conditions.push(eq(cities.countryId, Number(input.filterValue)));
          }
          const rows = await db
            .select({ value: cities.id, label: cities.name, labelAr: cities.name })
            .from(cities)
            .where(and(...conditions))
            .orderBy(asc(cities.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        // ============ FACILITY SOURCES ============
        case "sites": {
          const conditions = [eq(sites.status, 'active')];
          if (input.filterValue) {
            conditions.push(eq(sites.cityId, Number(input.filterValue)));
          }
          if (input.search) {
            conditions.push(
              or(
                like(sites.name, `%${input.search}%`),
                like(sites.code, `%${input.search}%`)
              )!
            );
          }
          const rows = await db
            .select({ value: sites.id, label: sites.name, labelAr: sites.name })
            .from(sites)
            .where(and(...conditions))
            .orderBy(asc(sites.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "zones": {
          const conditions = [eq(zones.status, 'active')];
          if (input.filterValue) {
            conditions.push(eq(zones.siteId, Number(input.filterValue)));
          }
          const rows = await db
            .select({ value: zones.id, label: zones.name, labelAr: zones.name })
            .from(zones)
            .where(and(...conditions))
            .orderBy(asc(zones.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "areas": {
          const conditions = [eq(areas.status, 'active')];
          if (input.filterValue) {
            conditions.push(eq(areas.zoneId, Number(input.filterValue)));
          }
          const rows = await db
            .select({ value: areas.id, label: areas.name, labelAr: areas.name })
            .from(areas)
            .where(and(...conditions))
            .orderBy(asc(areas.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        // ============ ORGANIZATION SOURCES ============
        case "departments": {
          const rows = await db
            .select({ value: departments.id, label: departments.name, labelAr: departments.name })
            .from(departments)
            .where(eq(departments.isActive, true))
            .orderBy(asc(departments.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "groups": {
          const conditions = [eq(groups.status, 'active')];
          if (input.search) {
            conditions.push(like(groups.name, `%${input.search}%`));
          }
          const rows = await db
            .select({ value: groups.id, label: groups.name, labelAr: groups.name })
            .from(groups)
            .where(and(...conditions))
            .orderBy(asc(groups.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "users": {
          const conditions = [eq(users.status, 'active')];
          if (input.filterValue) {
            conditions.push(eq(users.departmentId, Number(input.filterValue)));
          }
          if (input.search) {
            conditions.push(
              or(
                like(users.name, `%${input.search}%`),
                like(users.email, `%${input.search}%`)
              )!
            );
          }
          const rows = await db
            .select({ value: users.id, label: users.name, labelAr: users.email })
            .from(users)
            .where(and(...conditions))
            .orderBy(asc(users.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label || '', labelAr: r.labelAr }));
          break;
        }

        case "contractors": {
          const rows = await db
            .select({ value: cardCompanies.id, label: cardCompanies.name, labelAr: cardCompanies.nameAr })
            .from(cardCompanies)
            .where(
              and(
                eq(cardCompanies.isActive, true),
                inArray(cardCompanies.type, ['contractor', 'subcontractor'])
              )
            )
            .orderBy(asc(cardCompanies.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        // ============ CONFIGURATION SOURCES ============
        case "request_types": {
          const conditions = [eq(requestTypes.isActive, true)];
          if (input.filterValue) {
            conditions.push(eq(requestTypes.categoryId, Number(input.filterValue)));
          }
          const rows = await db
            .select({ value: requestTypes.id, label: requestTypes.name, labelAr: requestTypes.nameAr })
            .from(requestTypes)
            .where(and(...conditions))
            .orderBy(asc(requestTypes.displayOrder))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "approval_roles": {
          const rows = await db
            .select({ value: approvalRoles.id, label: approvalRoles.name, labelAr: approvalRoles.description })
            .from(approvalRoles)
            .where(eq(approvalRoles.isActive, true))
            .orderBy(asc(approvalRoles.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        // ============ USER PROFILE SOURCES ============
        case "user_sites": {
          const rows = await db
            .select({
              value: sites.id,
              label: sites.name,
              labelAr: sites.name,
            })
            .from(sites)
            .leftJoin(groupAccessPolicies, eq(groupAccessPolicies.siteId, sites.id))
            .leftJoin(
              userGroupMembership,
              and(
                eq(userGroupMembership.groupId, groupAccessPolicies.groupId),
                eq(userGroupMembership.userId, ctx.user.id)
              )
            )
            .where(
              and(
                eq(sites.status, 'active'),
                or(
                  sql`${userGroupMembership.userId} IS NOT NULL`,
                  sql`${sites.id} = (SELECT defaultSiteId FROM users WHERE id = ${ctx.user.id})`
                )
              )
            )
            .orderBy(asc(sites.name))
            .limit(limit);

          // Deduplicate
          const seen = new Set<number>();
          options = [];
          for (const r of rows) {
            if (!seen.has(r.value)) {
              seen.add(r.value);
              options.push({ value: String(r.value), label: r.label, labelAr: r.labelAr });
            }
          }
          break;
        }

        case "user_groups": {
          const rows = await db
            .select({ value: groups.id, label: groups.name, labelAr: groups.name })
            .from(groups)
            .innerJoin(userGroupMembership, eq(userGroupMembership.groupId, groups.id))
            .where(and(eq(userGroupMembership.userId, ctx.user.id), eq(groups.status, 'active')))
            .orderBy(asc(groups.name))
            .limit(limit);
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        case "user_departments": {
          const rows = await db
            .select({ value: departments.id, label: departments.name, labelAr: departments.name })
            .from(departments)
            .innerJoin(users, eq(users.departmentId, departments.id))
            .where(and(eq(users.id, ctx.user.id), eq(departments.isActive, true)));
          options = rows.map(r => ({ value: String(r.value), label: r.label, labelAr: r.labelAr }));
          break;
        }

        // ============ MATERIAL TYPES ============
        case "material_types": {
          const rows = await db
            .select({
              value: materialTypes.id,
              label: materialTypes.name,
              labelAr: materialTypes.nameAr,
              qtyEnabled: materialTypes.qtyEnabled,
            })
            .from(materialTypes)
            .where(eq(materialTypes.isActive, true))
            .orderBy(asc(materialTypes.displayOrder), asc(materialTypes.name))
            .limit(limit);
          options = rows.map(r => ({
            value: String(r.value),
            label: r.label,
            labelAr: r.labelAr,
            qtyEnabled: !!r.qtyEnabled,
          }));
          break;
        }

        case "user_profile":
        default:
          options = [];
      }

      // Ensure consistent string values
      return options.map(opt => ({
        value: String(opt.value),
        label: opt.label || '',
        labelAr: opt.labelAr || undefined,
        ...(opt.qtyEnabled !== undefined ? { qtyEnabled: opt.qtyEnabled } : {}),
      }));
    }),
});

// ============================================================================
// COMBINED ROUTER
// ============================================================================

export const requestConfigRouter = router({
  categories: requestCategoriesRouter,
  types: requestTypesRouter,
  formDefinition: formDefinitionRouter,
  sections: formSectionsRouter,
  fields: formFieldsRouter,
});
