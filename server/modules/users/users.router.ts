import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import {
  getUserById,
  listUsers,
  updateUser,
  createUser,
  deleteUser,
  getRoleById,
  getDepartmentById,
} from "../../infra/db/connection";

export const usersRouter = router({
  // Get current authenticated user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    return ctx.user;
  }),

  // List all users with filters
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listUsers(input);
    }),

  // Get user by ID with related data
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);
      if (!user) {
        throw new Error("User not found");
      }

      return {
        ...user,
      };
    }),

  // Create a new user (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const userId = await createUser({
        name: input.name,
        email: input.email,
        role: input.role || "user",
      });
      return { success: true, userId };
    }),

  // Update user profile (admin only for most fields)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateUser(id, data);
      return { success: true };
    }),

  // Delete user (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    }),

  // Update own profile (limited fields)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),

  // Get current user's permissions
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    // If user is admin, return full permissions
    if (ctx.user.role === "admin") {
      return {
        requests: { create: true, read: true, update: true, delete: true },
        approvals: { l1: true, manual: true },
        sites: { create: true, read: true, update: true, delete: true },
        zones: { create: true, read: true, update: true, lock: true },
        alerts: { view: true, resolve: true },
        users: { create: true, read: true, update: true, delete: true },
        hardware: { view: true, control: true },
        reports: { view: true, export: true },
      };
    }

    // Default minimal permissions for regular users
    return {
      requests: { create: true, read: true, update: false, delete: false },
      approvals: { l1: false, manual: false },
      sites: { create: false, read: true, update: false, delete: false },
      zones: { create: false, read: true, update: false, lock: false },
      alerts: { view: false, resolve: false },
      users: { create: false, read: false, update: false, delete: false },
      hardware: { view: false, control: false },
      reports: { view: false, export: false },
    };
  }),
});
