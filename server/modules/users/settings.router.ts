import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../infra/db/connection";
import { systemSettings } from "../../../drizzle/schema";
import { adminProcedure, publicProcedure, router } from "../../_core/trpc";

// Default security settings
const DEFAULT_SECURITY_SETTINGS = {
  passwordExpiry: "90",
  sessionTimeout: "30",
  mfaEnabled: "false",
};

// Helper to get a setting value using direct query
async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

// Helper to set a setting value
async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  
  if (existing.length > 0) {
    await db.update(systemSettings)
      .set({ value })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({
      key,
      value,
    });
  }
}

export const settingsRouter = router({
  // Get all security policies
  getSecurityPolicies: publicProcedure.query(async () => {
    const passwordExpiry = await getSetting("passwordExpiry") ?? DEFAULT_SECURITY_SETTINGS.passwordExpiry;
    const sessionTimeout = await getSetting("sessionTimeout") ?? DEFAULT_SECURITY_SETTINGS.sessionTimeout;
    const mfaEnabled = await getSetting("mfaEnabled") ?? DEFAULT_SECURITY_SETTINGS.mfaEnabled;
    
    return {
      passwordExpiry: parseInt(passwordExpiry, 10),
      sessionTimeout: parseInt(sessionTimeout, 10),
      mfaEnabled: mfaEnabled === "true",
    };
  }),
  
  // Update security policies (admin only)
  updateSecurityPolicies: adminProcedure
    .input(z.object({
      passwordExpiry: z.number().min(1).max(365),
      sessionTimeout: z.number().min(5).max(480),
      mfaEnabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await setSetting("passwordExpiry", input.passwordExpiry.toString());
      await setSetting("sessionTimeout", input.sessionTimeout.toString());
      await setSetting("mfaEnabled", input.mfaEnabled.toString());
      
      return {
        success: true,
        message: "Security policies updated successfully",
      };
    }),
  
  // Get general settings
  getGeneralSettings: publicProcedure.query(async () => {
    const systemName = await getSetting("systemName") ?? "CENTRE3 Security Ops";
    const supportEmail = await getSetting("supportEmail") ?? "support@centre3.com";
    const timezone = await getSetting("timezone") ?? "Asia/Riyadh (GMT+3)";
    
    return {
      systemName,
      supportEmail,
      timezone,
    };
  }),
  
  // Update general settings (admin only)
  updateGeneralSettings: adminProcedure
    .input(z.object({
      systemName: z.string().min(1).max(100),
      supportEmail: z.string().email(),
      timezone: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      await setSetting("systemName", input.systemName);
      await setSetting("supportEmail", input.supportEmail);
      await setSetting("timezone", input.timezone);
      
      return {
        success: true,
        message: "General settings updated successfully",
      };
    }),
});
