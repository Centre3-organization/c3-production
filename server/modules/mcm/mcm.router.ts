import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../infra/db/connection";
import { 
  magneticCards, 
  cardAccessLevels, 
  cardAuditLog, 
  cardCompanies,
  mcmAccessLevels,
  mcmRequests,
  users,
  sites
} from "../../../drizzle/schema";
import { eq, and, or, like, desc, asc, sql, inArray, isNull, gte, lte } from "drizzle-orm";

// Helper to generate card number
function generateCardNumber(): string {
  const prefix = "MCM";
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = "MCM-REQ";
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

// Helper to log card audit
async function logCardAudit(
  cardId: number,
  operation: string,
  performedBy: number,
  reason?: string,
  previousData?: Record<string, any>,
  newData?: Record<string, any>,
  requestId?: number
) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(cardAuditLog).values({
    cardId,
    operation: operation as any,
    performedBy,
    reason,
    previousData,
    newData,
    requestId,
  });
}

export const mcmRouter = router({
  // ============================================================================
  // DASHBOARD & STATISTICS
  // ============================================================================
  
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { activeCards: 0, pendingRequests: 0, expiringSoon: 0, blockedCards: 0 };
    
    const [activeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magneticCards)
      .where(eq(magneticCards.status, "active"));
    
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mcmRequests)
      .where(eq(mcmRequests.status, "pending"));
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const [expiringCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magneticCards)
      .where(
        and(
          eq(magneticCards.status, "active"),
          lte(magneticCards.expiryDate, thirtyDaysFromNow)
        )
      );
    
    const [blockedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(magneticCards)
      .where(eq(magneticCards.status, "blocked"));
    
    return {
      activeCards: Number(activeCount?.count || 0),
      pendingRequests: Number(pendingCount?.count || 0),
      expiringSoon: Number(expiringCount?.count || 0),
      blockedCards: Number(blockedCount?.count || 0),
    };
  }),

  // ============================================================================
  // CARD COMPANIES (Contractors, Sub-Contractors, Clients)
  // ============================================================================
  
  companies: router({
    list: protectedProcedure
      .input(z.object({
        type: z.enum(["contractor", "subcontractor", "client"]).optional(),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        
        if (input?.type) {
          conditions.push(eq(cardCompanies.type, input.type));
        }
        if (input?.isActive !== undefined) {
          conditions.push(eq(cardCompanies.isActive, input.isActive));
        }
        if (input?.search) {
          conditions.push(
            or(
              like(cardCompanies.name, `%${input.search}%`),
              like(cardCompanies.code, `%${input.search}%`)
            )
          );
        }
        
        const result = await db
          .select()
          .from(cardCompanies)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(cardCompanies.name));
        
        return result;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameAr: z.string().optional(),
        type: z.enum(["contractor", "subcontractor", "client"]),
        code: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [result] = await db.insert(cardCompanies).values(input);
        return { id: result.insertId, ...input };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameAr: z.string().optional(),
        code: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const { id, ...data } = input;
        await db.update(cardCompanies).set(data).where(eq(cardCompanies.id, id));
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db.delete(cardCompanies).where(eq(cardCompanies.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================================================
  // ACCESS LEVELS
  // ============================================================================
  
  accessLevels: router({
    list: protectedProcedure
      .input(z.object({
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input?.isActive !== undefined) {
          conditions.push(eq(mcmAccessLevels.isActive, input.isActive));
        }
        
        const result = await db
          .select()
          .from(mcmAccessLevels)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(mcmAccessLevels.sortOrder), asc(mcmAccessLevels.name));
        
        return result;
      }),
    
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        siportZoneMapping: z.record(z.string(), z.array(z.string())).optional(),
        requiresApproval: z.boolean().optional(),
        maxValidityDays: z.number().optional(),
        allowedCompanyTypes: z.array(z.string()).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [result] = await db.insert(mcmAccessLevels).values({
          ...input,
          siportZoneMapping: input.siportZoneMapping as Record<string, string[]> | undefined,
        });
        return { id: result.insertId, ...input };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        siportZoneMapping: z.record(z.string(), z.array(z.string())).optional(),
        requiresApproval: z.boolean().optional(),
        maxValidityDays: z.number().optional(),
        allowedCompanyTypes: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const { id, ...data } = input;
        await db.update(mcmAccessLevels).set({
          ...data,
          siportZoneMapping: data.siportZoneMapping as Record<string, string[]> | undefined,
        }).where(eq(mcmAccessLevels.id, id));
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db.delete(mcmAccessLevels).where(eq(mcmAccessLevels.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================================================
  // CARDS - Main CRUD Operations
  // ============================================================================
  
  cards: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "active", "inactive", "blocked", "expired"]).optional(),
        companyType: z.enum(["centre3", "contractor", "subcontractor", "client"]).optional(),
        companyId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { cards: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        
        const page = input?.page || 1;
        const limit = input?.limit || 20;
        const offset = (page - 1) * limit;
        
        const conditions = [];
        
        if (input?.status) {
          conditions.push(eq(magneticCards.status, input.status));
        }
        if (input?.companyType) {
          conditions.push(eq(magneticCards.companyType, input.companyType));
        }
        if (input?.companyId) {
          conditions.push(eq(magneticCards.companyId, input.companyId));
        }
        if (input?.search) {
          conditions.push(
            or(
              like(magneticCards.cardNumber, `%${input.search}%`),
              like(magneticCards.fullName, `%${input.search}%`),
              like(magneticCards.idNumber, `%${input.search}%`),
              like(magneticCards.mobile, `%${input.search}%`)
            )
          );
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const [cards, [countResult]] = await Promise.all([
          db
            .select({
              id: magneticCards.id,
              cardNumber: magneticCards.cardNumber,
              status: magneticCards.status,
              companyType: magneticCards.companyType,
              fullName: magneticCards.fullName,
              idNumber: magneticCards.idNumber,
              mobile: magneticCards.mobile,
              photoUrl: magneticCards.photoUrl,
              issueDate: magneticCards.issueDate,
              expiryDate: magneticCards.expiryDate,
              createdAt: magneticCards.createdAt,
            })
            .from(magneticCards)
            .where(whereClause)
            .orderBy(desc(magneticCards.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(magneticCards)
            .where(whereClause),
        ]);
        
        return {
          cards,
          total: Number(countResult?.count || 0),
          page,
          limit,
          totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
        };
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.id));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        // Get access levels
        const accessLevels = await db
          .select()
          .from(cardAccessLevels)
          .where(eq(cardAccessLevels.cardId, input.id));
        
        // Get company info if applicable
        let company = null;
        if (card.companyId) {
          const [companyResult] = await db
            .select()
            .from(cardCompanies)
            .where(eq(cardCompanies.id, card.companyId));
          company = companyResult;
        }
        
        return { ...card, accessLevels, company };
      }),
    
    getByIdNumber: protectedProcedure
      .input(z.object({ idNumber: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(
            and(
              eq(magneticCards.idNumber, input.idNumber),
              or(
                eq(magneticCards.status, "active"),
                eq(magneticCards.status, "pending")
              )
            )
          );
        
        return card || null;
      }),
    
    // Get my card (for employees)
    getMyCard: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      // Find card by user's ID number or email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));
      
      if (!user) {
        return null;
      }
      
      // Try to find card by email
      const [card] = await db
        .select()
        .from(magneticCards)
        .where(
          and(
            eq(magneticCards.email, user.email || ""),
            or(
              eq(magneticCards.status, "active"),
              eq(magneticCards.status, "pending")
            )
          )
        );
      
      if (!card) {
        return null;
      }
      
      // Get access levels
      const accessLevels = await db
        .select()
        .from(cardAccessLevels)
        .where(eq(cardAccessLevels.cardId, card.id));
      
      return { ...card, accessLevels };
    }),
    
    // Get expiring cards (for admin dashboard)
    getExpiring: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.days);
        
        const cards = await db
          .select({
            id: magneticCards.id,
            cardNumber: magneticCards.cardNumber,
            fullName: magneticCards.fullName,
            expiryDate: magneticCards.expiryDate,
            mobile: magneticCards.mobile,
            email: magneticCards.email,
          })
          .from(magneticCards)
          .where(
            and(
              eq(magneticCards.status, "active"),
              lte(magneticCards.expiryDate, futureDate)
            )
          )
          .orderBy(asc(magneticCards.expiryDate));
        
        return cards;
      }),
    
    // Get blocked cards (for admin)
    getBlocked: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const cards = await db
        .select({
          id: magneticCards.id,
          cardNumber: magneticCards.cardNumber,
          fullName: magneticCards.fullName,
          blockReason: magneticCards.blockReason,
          blockType: magneticCards.blockType,
          blockUntil: magneticCards.blockUntil,
          blockedAt: magneticCards.blockedAt,
        })
        .from(magneticCards)
        .where(eq(magneticCards.status, "blocked"))
        .orderBy(desc(magneticCards.blockedAt));
      
      return cards;
    }),
  }),

  // ============================================================================
  // CARD REQUESTS - Operations that require workflow approval
  // ============================================================================
  
  requests: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["draft", "pending", "approved", "rejected", "cancelled"]).optional(),
        operationType: z.enum(["create", "modify", "deactivate", "renew", "replace_lost", "replace_damaged"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { requests: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        
        const page = input?.page || 1;
        const limit = input?.limit || 20;
        const offset = (page - 1) * limit;
        
        const conditions = [];
        
        if (input?.status) {
          conditions.push(eq(mcmRequests.status, input.status));
        }
        if (input?.operationType) {
          conditions.push(eq(mcmRequests.operationType, input.operationType));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const [requests, [countResult]] = await Promise.all([
          db
            .select()
            .from(mcmRequests)
            .where(whereClause)
            .orderBy(desc(mcmRequests.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(mcmRequests)
            .where(whereClause),
        ]);
        
        return {
          requests,
          total: Number(countResult?.count || 0),
          page,
          limit,
          totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
        };
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [request] = await db
          .select()
          .from(mcmRequests)
          .where(eq(mcmRequests.id, input.id));
        
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        return request;
      }),
    
    // Create new card request
    createCardRequest: protectedProcedure
      .input(z.object({
        // Company info
        companyType: z.enum(["centre3", "contractor", "subcontractor", "client"]),
        companyId: z.number().optional(),
        
        // Personal info
        idType: z.enum(["saudi_id", "iqama"]),
        idNumber: z.string().min(1),
        fullName: z.string().min(1),
        fullNameAr: z.string().optional(),
        birthDate: z.string(),
        nationality: z.string().optional(),
        gender: z.enum(["male", "female"]),
        bloodType: z.string().optional(),
        mobile: z.string().min(1),
        email: z.string().email().optional(),
        profession: z.string().optional(),
        
        // ID document details
        idIssueDate: z.string().optional(),
        idIssuePlace: z.string().optional(),
        idExpiryDate: z.string(),
        
        // Documents (S3 URLs)
        photoUrl: z.string().optional(),
        idDocumentUrl: z.string().optional(),
        contractUrl: z.string().optional(),
        
        // Access levels
        accessLevels: z.array(z.object({
          countryCode: z.string(),
          siteId: z.number(),
          accessLevelId: z.number(),
          roomIds: z.array(z.number()).optional(),
        })),
        
        // For requesting on behalf of someone
        requestedFor: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        // Check if person already has an active card
        const existingCard = await db
          .select()
          .from(magneticCards)
          .where(
            and(
              eq(magneticCards.idNumber, input.idNumber),
              or(
                eq(magneticCards.status, "active"),
                eq(magneticCards.status, "pending")
              )
            )
          );
        
        if (existingCard.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This person already has an active or pending card",
          });
        }
        
        const requestNumber = generateRequestNumber();
        
        // Create the request
        const [result] = await db.insert(mcmRequests).values({
          requestNumber,
          operationType: "create",
          status: "pending",
          requestedBy: ctx.user.id,
          requestedFor: input.requestedFor,
          formData: input,
          accessLevelsRequested: input.accessLevels,
        });
        
        return {
          id: result.insertId,
          requestNumber,
          status: "pending",
        };
      }),
    
    // Modify card access request
    modifyAccessRequest: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        modificationType: z.enum(["add_access", "remove_access", "change_access"]),
        modificationReason: z.string().min(1),
        accessLevels: z.array(z.object({
          countryCode: z.string(),
          siteId: z.number(),
          accessLevelId: z.number(),
          roomIds: z.array(z.number()).optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        // Verify card exists and is active
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        if (card.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only modify active cards",
          });
        }
        
        const requestNumber = generateRequestNumber();
        
        const [result] = await db.insert(mcmRequests).values({
          requestNumber,
          operationType: "modify",
          cardId: input.cardId,
          status: "pending",
          requestedBy: ctx.user.id,
          modificationType: input.modificationType,
          modificationReason: input.modificationReason,
          accessLevelsRequested: input.accessLevels,
        });
        
        return {
          id: result.insertId,
          requestNumber,
          status: "pending",
        };
      }),
    
    // Deactivate card request
    deactivateRequest: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        deactivationReason: z.enum(["resignation", "termination", "contract_ended", "security_concern", "other"]),
        notes: z.string().optional(),
        effectiveDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        const requestNumber = generateRequestNumber();
        
        const [result] = await db.insert(mcmRequests).values({
          requestNumber,
          operationType: "deactivate",
          cardId: input.cardId,
          status: "pending",
          requestedBy: ctx.user.id,
          deactivationReason: input.deactivationReason,
          formData: { notes: input.notes },
          effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        });
        
        return {
          id: result.insertId,
          requestNumber,
          status: "pending",
        };
      }),
    
    // Report lost/damaged card
    reportLostDamaged: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        type: z.enum(["lost", "stolen", "damaged"]),
        details: z.string().optional(),
        createReplacement: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        // IMMEDIATELY deactivate the card (no approval needed for deactivation)
        await db
          .update(magneticCards)
          .set({
            status: "inactive",
            deactivatedBy: ctx.user.id,
            deactivatedAt: new Date(),
            deactivationReason: input.type,
            deactivationNotes: input.details,
            lostReportCount: sql`${magneticCards.lostReportCount} + 1`,
            lastLostReportAt: new Date(),
          })
          .where(eq(magneticCards.id, input.cardId));
        
        // Log the deactivation
        await logCardAudit(
          input.cardId,
          "deactivated",
          ctx.user.id,
          `Card reported as ${input.type}: ${input.details || "No details provided"}`,
          { status: card.status },
          { status: "inactive", deactivationReason: input.type }
        );
        
        // If replacement requested, create a new request
        if (input.createReplacement) {
          const requestNumber = generateRequestNumber();
          const operationType = input.type === "damaged" ? "replace_damaged" : "replace_lost";
          
          // Get current access levels
          const currentAccessLevels = await db
            .select()
            .from(cardAccessLevels)
            .where(eq(cardAccessLevels.cardId, input.cardId));
          
          const [result] = await db.insert(mcmRequests).values({
            requestNumber,
            operationType,
            cardId: input.cardId,
            status: "pending",
            requestedBy: ctx.user.id,
            lostDamagedType: input.type,
            lostDamagedDetails: input.details,
            createReplacement: true,
            accessLevelsRequested: currentAccessLevels.map(l => ({
              countryCode: l.countryCode,
              siteId: l.siteId,
              accessLevelId: l.accessLevelId,
              roomIds: l.roomIds || undefined,
            })),
          });
          
          return {
            cardDeactivated: true,
            replacementRequestId: result.insertId,
            replacementRequestNumber: requestNumber,
          };
        }
        
        return {
          cardDeactivated: true,
          replacementRequestId: null,
          replacementRequestNumber: null,
        };
      }),
    
    // Renew card request
    renewRequest: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        newExpiryDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        const requestNumber = generateRequestNumber();
        
        const [result] = await db.insert(mcmRequests).values({
          requestNumber,
          operationType: "renew",
          cardId: input.cardId,
          status: "pending",
          requestedBy: ctx.user.id,
          formData: { newExpiryDate: input.newExpiryDate },
        });
        
        return {
          id: result.insertId,
          requestNumber,
          status: "pending",
        };
      }),
  }),

  // ============================================================================
  // ADMIN ACTIONS - No workflow required
  // ============================================================================
  
  admin: router({
    // Block card (immediate, no workflow)
    blockCard: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        blockReason: z.enum(["security_incident", "policy_violation", "investigation", "emergency"]),
        blockType: z.enum(["temporary", "permanent"]),
        blockUntil: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        if (card.status === "blocked") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Card is already blocked" });
        }
        
        const previousStatus = card.status;
        
        // Immediately block the card
        await db
          .update(magneticCards)
          .set({
            status: "blocked",
            blockReason: input.blockReason,
            blockType: input.blockType,
            blockUntil: input.blockUntil ? new Date(input.blockUntil) : null,
            blockedBy: ctx.user.id,
            blockedAt: new Date(),
          })
          .where(eq(magneticCards.id, input.cardId));
        
        // Log the action
        await logCardAudit(
          input.cardId,
          "blocked",
          ctx.user.id,
          `${input.blockReason}: ${input.notes || "No notes"}`,
          { status: previousStatus },
          { status: "blocked", blockReason: input.blockReason, blockType: input.blockType }
        );
        
        return { success: true, message: "Card blocked successfully" };
      }),
    
    // Unblock card (admin only)
    unblockCard: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        reason: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [card] = await db
          .select()
          .from(magneticCards)
          .where(eq(magneticCards.id, input.cardId));
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
        }
        
        if (card.status !== "blocked") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Card is not blocked" });
        }
        
        if (card.blockType === "permanent") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot unblock permanently blocked cards",
          });
        }
        
        // Restore to active
        await db
          .update(magneticCards)
          .set({
            status: "active",
            blockReason: null,
            blockType: null,
            blockUntil: null,
            blockedBy: null,
            blockedAt: null,
          })
          .where(eq(magneticCards.id, input.cardId));
        
        // Log the action
        await logCardAudit(
          input.cardId,
          "unblocked",
          ctx.user.id,
          input.reason,
          { status: "blocked" },
          { status: "active" }
        );
        
        return { success: true, message: "Card unblocked successfully" };
      }),
    
    // Approve request and create/update card
    approveRequest: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [request] = await db
          .select()
          .from(mcmRequests)
          .where(eq(mcmRequests.id, input.requestId));
        
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        if (request.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request is not pending" });
        }
        
        let resultCardId: number | null = null;
        
        // Handle different operation types
        switch (request.operationType) {
          case "create":
          case "replace_lost":
          case "replace_damaged": {
            const formData = request.formData as any;
            const cardNumber = generateCardNumber();
            
            // Calculate expiry date (min of ID expiry and 1 year from now)
            const idExpiry = new Date(formData.idExpiryDate);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            const expiryDate = idExpiry < oneYearFromNow ? idExpiry : oneYearFromNow;
            
            // Create the card
            const [cardResult] = await db.insert(magneticCards).values({
              cardNumber,
              status: "active",
              companyType: formData.companyType,
              companyId: formData.companyId,
              idType: formData.idType,
              idNumber: formData.idNumber,
              fullName: formData.fullName,
              fullNameAr: formData.fullNameAr,
              birthDate: new Date(formData.birthDate),
              nationality: formData.nationality,
              gender: formData.gender,
              bloodType: formData.bloodType,
              mobile: formData.mobile,
              email: formData.email,
              profession: formData.profession,
              idIssueDate: formData.idIssueDate ? new Date(formData.idIssueDate) : null,
              idIssuePlace: formData.idIssuePlace,
              idExpiryDate: new Date(formData.idExpiryDate),
              photoUrl: formData.photoUrl,
              idDocumentUrl: formData.idDocumentUrl,
              contractUrl: formData.contractUrl,
              issueDate: new Date(),
              expiryDate,
              requestId: request.id,
              requestedBy: request.requestedBy,
              approvedBy: ctx.user.id,
              approvedAt: new Date(),
              replacesCardId: request.cardId,
            });
            
            resultCardId = cardResult.insertId;
            
            // Create access levels
            const accessLevels = request.accessLevelsRequested as any[];
            if (accessLevels && accessLevels.length > 0) {
              for (const level of accessLevels) {
                await db.insert(cardAccessLevels).values({
                  cardId: resultCardId,
                  countryCode: level.countryCode,
                  siteId: level.siteId,
                  accessLevelId: level.accessLevelId,
                  roomIds: level.roomIds,
                  isActive: true,
                });
              }
            }
            
            // Log the creation
            await logCardAudit(
              resultCardId,
              "created",
              ctx.user.id,
              `Card created via request ${request.requestNumber}`,
              undefined,
              { cardNumber, status: "active" },
              request.id
            );
            
            // If this is a replacement, mark the old card
            if (request.cardId) {
              await db
                .update(magneticCards)
                .set({ replacedByCardId: resultCardId })
                .where(eq(magneticCards.id, request.cardId));
            }
            
            break;
          }
          
          case "modify": {
            if (!request.cardId) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "No card ID for modification" });
            }
            
            // Get current access levels
            const currentLevels = await db
              .select()
              .from(cardAccessLevels)
              .where(eq(cardAccessLevels.cardId, request.cardId));
            
            // Deactivate old access levels
            await db
              .update(cardAccessLevels)
              .set({ isActive: false })
              .where(eq(cardAccessLevels.cardId, request.cardId));
            
            // Create new access levels
            const newLevels = request.accessLevelsRequested as any[];
            if (newLevels && newLevels.length > 0) {
              for (const level of newLevels) {
                await db.insert(cardAccessLevels).values({
                  cardId: request.cardId,
                  countryCode: level.countryCode,
                  siteId: level.siteId,
                  accessLevelId: level.accessLevelId,
                  roomIds: level.roomIds,
                  isActive: true,
                });
              }
            }
            
            // Log the modification
            await logCardAudit(
              request.cardId,
              "access_modified",
              ctx.user.id,
              request.modificationReason || "Access levels modified",
              { accessLevels: currentLevels },
              { accessLevels: newLevels },
              request.id
            );
            
            resultCardId = request.cardId;
            break;
          }
          
          case "deactivate": {
            if (!request.cardId) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "No card ID for deactivation" });
            }
            
            await db
              .update(magneticCards)
              .set({
                status: "inactive",
                deactivatedBy: ctx.user.id,
                deactivatedAt: new Date(),
                deactivationReason: request.deactivationReason,
                deactivationNotes: (request.formData as any)?.notes,
              })
              .where(eq(magneticCards.id, request.cardId));
            
            // Deactivate all access levels
            await db
              .update(cardAccessLevels)
              .set({ isActive: false })
              .where(eq(cardAccessLevels.cardId, request.cardId));
            
            // Log the deactivation
            await logCardAudit(
              request.cardId,
              "deactivated",
              ctx.user.id,
              `Deactivated: ${request.deactivationReason}`,
              { status: "active" },
              { status: "inactive" },
              request.id
            );
            
            resultCardId = request.cardId;
            break;
          }
          
          case "renew": {
            if (!request.cardId) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "No card ID for renewal" });
            }
            
            const formData = request.formData as any;
            const newExpiry = formData?.newExpiryDate 
              ? new Date(formData.newExpiryDate)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            
            await db
              .update(magneticCards)
              .set({
                expiryDate: newExpiry,
                status: "active",
              })
              .where(eq(magneticCards.id, request.cardId));
            
            // Log the renewal
            await logCardAudit(
              request.cardId,
              "renewed",
              ctx.user.id,
              `Card renewed until ${newExpiry.toISOString()}`,
              undefined,
              { expiryDate: newExpiry },
              request.id
            );
            
            resultCardId = request.cardId;
            break;
          }
        }
        
        // Update request status
        await db
          .update(mcmRequests)
          .set({
            status: "approved",
            completedAt: new Date(),
            completedBy: ctx.user.id,
            resultCardId,
          })
          .where(eq(mcmRequests.id, input.requestId));
        
        return {
          success: true,
          cardId: resultCardId,
        };
      }),
    
    // Reject request
    rejectRequest: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        reason: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const [request] = await db
          .select()
          .from(mcmRequests)
          .where(eq(mcmRequests.id, input.requestId));
        
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        
        if (request.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request is not pending" });
        }
        
        await db
          .update(mcmRequests)
          .set({
            status: "rejected",
            completedAt: new Date(),
            completedBy: ctx.user.id,
            formData: {
              ...(request.formData as any),
              rejectionReason: input.reason,
            },
          })
          .where(eq(mcmRequests.id, input.requestId));
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // AUDIT LOG
  // ============================================================================
  
  auditLog: router({
    getByCardId: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const logs = await db
          .select()
          .from(cardAuditLog)
          .where(eq(cardAuditLog.cardId, input.cardId))
          .orderBy(desc(cardAuditLog.performedAt))
          .limit(input.limit);
        
        return logs;
      }),
    
    getRecent: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
        operation: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.operation) {
          conditions.push(eq(cardAuditLog.operation, input.operation as any));
        }
        
        const logs = await db
          .select({
            id: cardAuditLog.id,
            cardId: cardAuditLog.cardId,
            operation: cardAuditLog.operation,
            performedBy: cardAuditLog.performedBy,
            performedAt: cardAuditLog.performedAt,
            reason: cardAuditLog.reason,
          })
          .from(cardAuditLog)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(cardAuditLog.performedAt))
          .limit(input.limit);
        
        return logs;
      }),
  }),
});

export type McmRouter = typeof mcmRouter;
