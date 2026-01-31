import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./infra/db/connection";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// Users Module
import { departmentsRouter } from "./modules/users/departments.router";
import { rolesRouter } from "./modules/users/roles.router";
import { usersRouter } from "./modules/users/users.router";
import { settingsRouter } from "./modules/users/settings.router";

// Facilities Module
import { masterDataRouter } from "./modules/facilities/masterData.router";
import { sitesRouter } from "./modules/facilities/sites.router";
import { zonesRouter } from "./modules/facilities/zones.router";
import { areasRouter } from "./modules/facilities/areas.router";

// Access Module
import { requestsRouter } from "./modules/access/requests.router";

// Dashboard Module
import { dashboardRouter } from "./modules/dashboard/dashboard.router";

// Security Module
import { securityAlertsRouter } from "./modules/security/alerts.router";

// Groups Module
import { groupsRouter } from "./modules/groups/groups.router";

// Workflows Module
import { workflowsRouter } from "./modules/workflows/workflows.router";

// Request Config Module
import { requestConfigRouter } from "./modules/request-config/requestConfig.router";

// MCM Module (Magnetic Card Management)
import { mcmRouter } from "./modules/mcm/mcm.router";

import { 
  seedDefaultRoles, 
  seedDefaultDepartments,
  seedSystemRoles,
  seedPermissions,
  seedRolePermissions,
  assignOwnerSuperAdmin
} from "./infra/db/connection";

// Initialize default data on server start
(async () => {
  try {
    await seedDefaultRoles();
    await seedDefaultDepartments();
    
    // Seed enterprise RBAC system
    await seedSystemRoles();
    await seedPermissions();
    await seedRolePermissions();
    await assignOwnerSuperAdmin();
    
    console.log("[Seed] Default data seeded successfully");
  } catch (error) {
    console.error("[Seed] Failed to seed default data:", error);
  }
})();

export const appRouter = router({
  // System routes
  system: systemRouter,
  
  // Auth routes
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required"),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        // Verify password
        if (!user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Password not set for this account. Please contact an administrator.",
          });
        }

        const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        await db.updateUser(user.id, {
          lastSignedIn: new Date(),
        });

        // Create a proper JWT session token using the SDK
        const { sdk } = await import("./_core/sdk");
        const expiresInMs = input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
        const sessionToken = await sdk.createSessionToken(user.openId, {
          expiresInMs,
          name: user.name || user.email || "User",
        });

        // Set the session cookie on the response
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: expiresInMs,
        });

        return {
          success: true,
          sessionToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
  }),

  // Users Module
  departments: departmentsRouter,
  roles: rolesRouter,
  users: usersRouter,
  settings: settingsRouter,
  
  // Facilities Module
  masterData: masterDataRouter,
  sites: sitesRouter,
  zones: zonesRouter,
  areas: areasRouter,
  
  // Access Module
  requests: requestsRouter,
  
  // Dashboard Module
  dashboard: dashboardRouter,
  
  // Security Module
  securityAlerts: securityAlertsRouter,
  
  // Groups Module
  groups: groupsRouter,
  
  // Workflows Module
  workflows: workflowsRouter,
  
  // Request Config Module
  requestConfig: requestConfigRouter,
  
  // MCM Module (Magnetic Card Management)
  mcm: mcmRouter,
});

export type AppRouter = typeof appRouter;
