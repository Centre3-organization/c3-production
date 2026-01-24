import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import * as db from "../../infra/db/connection";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  // Login with email - simplified for OAuth-based auth
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().optional(), // Password field for compatibility
    }))
    .mutation(async ({ input, ctx }) => {
      // Find user by email
      const user = await db.getUserByEmail(input.email);
      
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found. Please contact an administrator.",
        });
      }

      // Update last signed in time
      await db.updateUser(user.id, {
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = `session_${user.id}_${Date.now()}`;

      // Return user info and session token
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
});
