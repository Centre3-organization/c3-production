import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./infra/db/connection";
import { TRPCError } from "@trpc/server";

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

import { seedDefaultRoles, seedDefaultDepartments } from "./infra/db/connection";

// Initialize default data on server start
(async () => {
  try {
    await seedDefaultRoles();
    await seedDefaultDepartments();
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
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found. Please contact an administrator.",
          });
        }

        await db.updateUser(user.id, {
          lastSignedIn: new Date(),
        });

        const sessionToken = `session_${user.id}_${Date.now()}`;

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
});

export type AppRouter = typeof appRouter;
