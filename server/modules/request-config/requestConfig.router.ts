import { z } from "zod";
import { router, protectedProcedure, adminProcedure, publicProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import mysql from "mysql2/promise";
import { ENV } from "../../_core/env";

// Helper to get database connection
async function getConnection() {
  return mysql.createConnection(ENV.databaseUrl);
}

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
      const connection = await getConnection();
      try {
        let query = `
          SELECT 
            rc.*,
            (SELECT COUNT(*) FROM requestTypes rt WHERE rt.categoryId = rc.id AND rt.isActive = true) as typeCount
          FROM requestCategories rc
          WHERE 1=1
        `;
        
        if (!input?.includeInactive) {
          query += ` AND rc.isActive = true`;
        }
        
        query += ` ORDER BY rc.displayOrder ASC`;
        
        const [categories] = await connection.execute(query);
        
        // Get types for each category
        for (const cat of categories as any[]) {
          const [types] = await connection.execute(`
            SELECT id, code, name, nameAr, shortCode, description, isExclusive, maxDurationDays, displayOrder
            FROM requestTypes 
            WHERE categoryId = ? AND isActive = true
            ORDER BY displayOrder ASC
          `, [cat.id]);
          cat.types = types;
        }
        
        return categories;
      } finally {
        await connection.end();
      }
    }),

  // Get category by ID with full details
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const connection = await getConnection();
      try {
        const [[category]] = await connection.execute(`
          SELECT * FROM requestCategories WHERE id = ?
        `, [input.id]) as any;
        
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        }
        
        // Get types
        const [types] = await connection.execute(`
          SELECT * FROM requestTypes WHERE categoryId = ? ORDER BY displayOrder ASC
        `, [input.id]);
        category.types = types;
        
        return category;
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const [result] = await connection.execute(`
          INSERT INTO requestCategories (
            code, name, nameAr, description, icon, displayOrder,
            requiresInternalOnly, allowMultipleTypes, typeCombinationRules,
            hasRequestorSection, hasLocationSection, hasScheduleSection,
            hasVisitorSection, hasAttachmentSection
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.code,
          input.name,
          input.nameAr || null,
          input.description || null,
          input.icon || null,
          input.displayOrder || 0,
          input.requiresInternalOnly || false,
          input.allowMultipleTypes || false,
          input.typeCombinationRules ? JSON.stringify(input.typeCombinationRules) : null,
          input.hasRequestorSection ?? true,
          input.hasLocationSection ?? true,
          input.hasScheduleSection ?? true,
          input.hasVisitorSection ?? true,
          input.hasAttachmentSection ?? true,
        ]);
        
        return { id: (result as any).insertId, success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const { id, ...data } = input;
        const updates: string[] = [];
        const values: any[] = [];
        
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'typeCombinationRules') {
              updates.push(`${key} = ?`);
              values.push(JSON.stringify(value));
            } else {
              updates.push(`${key} = ?`);
              values.push(value);
            }
          }
        });
        
        if (updates.length > 0) {
          values.push(id);
          await connection.execute(
            `UPDATE requestCategories SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        return { success: true };
      } finally {
        await connection.end();
      }
    }),

  // Delete category (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const connection = await getConnection();
      try {
        // Soft delete by setting isActive to false
        await connection.execute(
          `UPDATE requestCategories SET isActive = false WHERE id = ?`,
          [input.id]
        );
        return { success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        let query = `
          SELECT rt.*, rc.name as categoryName, rc.code as categoryCode
          FROM requestTypes rt
          LEFT JOIN requestCategories rc ON rt.categoryId = rc.id
          WHERE 1=1
        `;
        const params: any[] = [];
        
        if (input?.categoryId) {
          query += ` AND rt.categoryId = ?`;
          params.push(input.categoryId);
        }
        
        if (!input?.includeInactive) {
          query += ` AND rt.isActive = true`;
        }
        
        query += ` ORDER BY rt.displayOrder ASC`;
        
        const [types] = await connection.execute(query, params);
        return types;
      } finally {
        await connection.end();
      }
    }),

  // Get type by ID with sections and fields
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const connection = await getConnection();
      try {
        const [[type]] = await connection.execute(`
          SELECT rt.*, rc.name as categoryName, rc.code as categoryCode
          FROM requestTypes rt
          LEFT JOIN requestCategories rc ON rt.categoryId = rc.id
          WHERE rt.id = ?
        `, [input.id]) as any;
        
        if (!type) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request type not found" });
        }
        
        return type;
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const [result] = await connection.execute(`
          INSERT INTO requestTypes (
            categoryId, code, name, nameAr, shortCode, description,
            displayOrder, isExclusive, maxDurationDays, workflowId,
            generateQrCode, generateDcpForm, notifyEmail, notifySms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.categoryId,
          input.code,
          input.name,
          input.nameAr || null,
          input.shortCode || null,
          input.description || null,
          input.displayOrder || 0,
          input.isExclusive || false,
          input.maxDurationDays || null,
          input.workflowId || null,
          input.generateQrCode ?? true,
          input.generateDcpForm ?? true,
          input.notifyEmail ?? true,
          input.notifySms ?? true,
        ]);
        
        return { id: (result as any).insertId, success: true };
      } finally {
        await connection.end();
      }
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
      })
    )
    .mutation(async ({ input }) => {
      const connection = await getConnection();
      try {
        const { id, ...data } = input;
        const updates: string[] = [];
        const values: any[] = [];
        
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            updates.push(`${key} = ?`);
            values.push(value);
          }
        });
        
        if (updates.length > 0) {
          values.push(id);
          await connection.execute(
            `UPDATE requestTypes SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        return { success: true };
      } finally {
        await connection.end();
      }
    }),

  // Delete type (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const connection = await getConnection();
      try {
        await connection.execute(
          `UPDATE requestTypes SET isActive = false WHERE id = ?`,
          [input.id]
        );
        return { success: true };
      } finally {
        await connection.end();
      }
    }),
});

// ============================================================================
// FORM DEFINITION ROUTER (User-facing API for getting form structure)
// ============================================================================

export const formDefinitionRouter = router({
  // Get form definition for a request type (or multiple types for combined forms)
  getFormDefinition: protectedProcedure
    .input(
      z.object({
        typeIds: z.array(z.number()).min(1),
      })
    )
    .query(async ({ input }) => {
      const connection = await getConnection();
      try {
        // Get all types
        const [types] = await connection.execute(`
          SELECT rt.*, rc.name as categoryName, rc.code as categoryCode,
                 rc.allowMultipleTypes, rc.typeCombinationRules
          FROM requestTypes rt
          LEFT JOIN requestCategories rc ON rt.categoryId = rc.id
          WHERE rt.id IN (${input.typeIds.map(() => '?').join(',')})
        `, input.typeIds) as any;
        
        if (types.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request types not found" });
        }
        
        // Collect all sections from all types
        const allSections: any[] = [];
        const sectionMap = new Map<string, any>();
        
        for (const type of types) {
          const [sections] = await connection.execute(`
            SELECT * FROM formSections 
            WHERE requestTypeId = ? AND isActive = true
            ORDER BY displayOrder ASC
          `, [type.id]) as any;
          
          for (const section of sections) {
            // Get fields for this section
            const [fields] = await connection.execute(`
              SELECT * FROM formFields 
              WHERE sectionId = ? AND isActive = true
              ORDER BY displayOrder ASC
            `, [section.id]) as any;
            
            // Parse JSON fields (mysql2 may already parse JSON columns)
            section.fields = fields.map((f: any) => ({
              ...f,
              options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options,
              validation: typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation,
              showCondition: typeof f.showCondition === 'string' ? JSON.parse(f.showCondition) : f.showCondition,
            }));
            section.showCondition = typeof section.showCondition === 'string' ? JSON.parse(section.showCondition) : section.showCondition;
            
            // Use section code as key to avoid duplicates
            const key = `${type.code}_${section.code}`;
            if (!sectionMap.has(key)) {
              sectionMap.set(key, {
                ...section,
                typeCode: type.code,
                typeName: type.name,
              });
            }
          }
        }
        
        // Convert map to array and sort by display order
        const sections = Array.from(sectionMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
        
        return {
          types: types.map((t: any) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            nameAr: t.nameAr,
            shortCode: t.shortCode,
            maxDurationDays: t.maxDurationDays,
            isExclusive: t.isExclusive,
          })),
          categoryCode: types[0].categoryCode,
          categoryName: types[0].categoryName,
          allowMultipleTypes: types[0].allowMultipleTypes,
          typeCombinationRules: typeof types[0].typeCombinationRules === 'string' ? JSON.parse(types[0].typeCombinationRules) : types[0].typeCombinationRules,
          sections,
        };
      } finally {
        await connection.end();
      }
    }),

  // Get form definition by category (for initial form loading)
  getByCategory: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      const connection = await getConnection();
      try {
        // Get category
        const [[category]] = await connection.execute(`
          SELECT * FROM requestCategories WHERE id = ? AND isActive = true
        `, [input.categoryId]) as any;
        
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        }
        
        // Get types
        const [types] = await connection.execute(`
          SELECT * FROM requestTypes 
          WHERE categoryId = ? AND isActive = true
          ORDER BY displayOrder ASC
        `, [input.categoryId]) as any;
        
        return {
          category: {
            ...category,
            typeCombinationRules: typeof category.typeCombinationRules === 'string' ? JSON.parse(category.typeCombinationRules) : category.typeCombinationRules,
          },
          types: types.map((t: any) => ({
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
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const [sections] = await connection.execute(`
          SELECT fs.*, 
                 (SELECT COUNT(*) FROM formFields ff WHERE ff.sectionId = fs.id) as fieldCount
          FROM formSections fs
          WHERE fs.requestTypeId = ?
          ORDER BY fs.displayOrder ASC
        `, [input.requestTypeId]) as any;
        
        return sections.map((s: any) => ({
          ...s,
          showCondition: typeof s.showCondition === 'string' ? JSON.parse(s.showCondition) : s.showCondition,
        }));
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const [result] = await connection.execute(`
          INSERT INTO formSections (
            requestTypeId, code, name, nameAr, icon, displayOrder,
            isRepeatable, minItems, maxItems, showCondition
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.requestTypeId,
          input.code,
          input.name,
          input.nameAr || null,
          input.icon || null,
          input.displayOrder || 0,
          input.isRepeatable || false,
          input.minItems || 0,
          input.maxItems || 100,
          input.showCondition ? JSON.stringify(input.showCondition) : null,
        ]);
        
        return { id: (result as any).insertId, success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const { id, showCondition, ...data } = input;
        const updates: string[] = [];
        const values: any[] = [];
        
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            updates.push(`${key} = ?`);
            values.push(value);
          }
        });
        
        if (showCondition !== undefined) {
          updates.push(`showCondition = ?`);
          values.push(showCondition ? JSON.stringify(showCondition) : null);
        }
        
        if (updates.length > 0) {
          values.push(id);
          await connection.execute(
            `UPDATE formSections SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        return { success: true };
      } finally {
        await connection.end();
      }
    }),

  // Delete section (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const connection = await getConnection();
      try {
        await connection.execute(
          `UPDATE formSections SET isActive = false WHERE id = ?`,
          [input.id]
        );
        return { success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        for (const update of input.updates) {
          await connection.execute(
            `UPDATE formSections SET displayOrder = ? WHERE id = ?`,
            [update.displayOrder, update.id]
          );
        }
        return { success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        const [fields] = await connection.execute(`
          SELECT * FROM formFields
          WHERE sectionId = ?
          ORDER BY displayOrder ASC
        `, [input.sectionId]) as any;
        
        return fields.map((f: any) => ({
          ...f,
          options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options,
          validation: typeof f.validation === 'string' ? JSON.parse(f.validation) : f.validation,
          showCondition: typeof f.showCondition === 'string' ? JSON.parse(f.showCondition) : f.showCondition,
        }));
      } finally {
        await connection.end();
      }
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
        optionsSource: z.enum(["static", "api", "dependent"]).optional(),
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
      const connection = await getConnection();
      try {
        const [result] = await connection.execute(`
          INSERT INTO formFields (
            sectionId, code, name, nameAr, fieldType, isRequired, displayOrder,
            columnSpan, placeholder, placeholderAr, helpText, helpTextAr, defaultValue,
            options, optionsSource, optionsApi, dependsOnField, validation, showCondition
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.sectionId,
          input.code,
          input.name,
          input.nameAr || null,
          input.fieldType,
          input.isRequired || false,
          input.displayOrder || 0,
          input.columnSpan || 6,
          input.placeholder || null,
          input.placeholderAr || null,
          input.helpText || null,
          input.helpTextAr || null,
          input.defaultValue || null,
          input.options ? JSON.stringify(input.options) : null,
          input.optionsSource || 'static',
          input.optionsApi || null,
          input.dependsOnField || null,
          input.validation ? JSON.stringify(input.validation) : null,
          input.showCondition ? JSON.stringify(input.showCondition) : null,
        ]);
        
        return { id: (result as any).insertId, success: true };
      } finally {
        await connection.end();
      }
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
        optionsSource: z.enum(["static", "api", "dependent"]).optional(),
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
      const connection = await getConnection();
      try {
        const { id, options, validation, showCondition, ...data } = input;
        const updates: string[] = [];
        const values: any[] = [];
        
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            updates.push(`${key} = ?`);
            values.push(value);
          }
        });
        
        if (options !== undefined) {
          updates.push(`options = ?`);
          values.push(options ? JSON.stringify(options) : null);
        }
        
        if (validation !== undefined) {
          updates.push(`validation = ?`);
          values.push(validation ? JSON.stringify(validation) : null);
        }
        
        if (showCondition !== undefined) {
          updates.push(`showCondition = ?`);
          values.push(showCondition ? JSON.stringify(showCondition) : null);
        }
        
        if (updates.length > 0) {
          values.push(id);
          await connection.execute(
            `UPDATE formFields SET ${updates.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        return { success: true };
      } finally {
        await connection.end();
      }
    }),

  // Delete field (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const connection = await getConnection();
      try {
        await connection.execute(
          `UPDATE formFields SET isActive = false WHERE id = ?`,
          [input.id]
        );
        return { success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        for (const update of input.updates) {
          await connection.execute(
            `UPDATE formFields SET displayOrder = ? WHERE id = ?`,
            [update.displayOrder, update.id]
          );
        }
        return { success: true };
      } finally {
        await connection.end();
      }
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
      const connection = await getConnection();
      try {
        // First check if field has static options
        const [[field]] = await connection.execute(`
          SELECT options, optionsSource, optionsApi FROM formFields WHERE id = ?
        `, [input.fieldId]) as any;
        
        if (!field) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
        }
        
        if (field.optionsSource === 'static' && field.options) {
          return typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
        }
        
        // Check fieldOptions table
        let query = `SELECT value, label, labelAr FROM fieldOptions WHERE fieldId = ? AND isActive = true`;
        const params: any[] = [input.fieldId];
        
        if (input.parentValue) {
          query += ` AND parentValue = ?`;
          params.push(input.parentValue);
        }
        
        query += ` ORDER BY displayOrder ASC`;
        
        const [options] = await connection.execute(query, params);
        return options;
      } finally {
        await connection.end();
      }
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
