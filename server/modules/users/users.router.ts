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
import bcrypt from "bcryptjs";

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
        status: z.enum(["active", "inactive", "all"]).optional(),
        role: z.enum(["user", "admin", "all"]).optional(),
        departmentId: z.number().optional(),
        groupId: z.number().optional(),
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
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().optional(),
        temporaryPassword: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["user", "admin"]).default("user"),
        departmentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Hash the temporary password
      const passwordHash = await bcrypt.hash(input.temporaryPassword, 10);
      
      // Create full name from first and last name
      const fullName = `${input.firstName} ${input.lastName}`.trim();
      
      const userId = await createUser({
        firstName: input.firstName,
        lastName: input.lastName,
        name: fullName,
        email: input.email,
        phone: input.phone || null,
        passwordHash: passwordHash,
        role: input.role,
        departmentId: input.departmentId || null,
      });
      return { success: true, userId };
    }),

  // Update user profile (admin only for most fields)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        departmentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, firstName, lastName, ...data } = input;
      
      // Update full name if first or last name changed
      const updateData: any = { ...data };
      if (firstName !== undefined || lastName !== undefined) {
        const user = await getUserById(id);
        if (user) {
          const newFirstName = firstName ?? user.firstName ?? '';
          const newLastName = lastName ?? user.lastName ?? '';
          updateData.firstName = newFirstName;
          updateData.lastName = newLastName;
          updateData.name = `${newFirstName} ${newLastName}`.trim();
        }
      }
      
      await updateUser(id, updateData);
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
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }
      
      const updateData: any = { ...input };
      if (input.firstName !== undefined || input.lastName !== undefined) {
        const newFirstName = input.firstName ?? ctx.user.firstName ?? '';
        const newLastName = input.lastName ?? ctx.user.lastName ?? '';
        updateData.name = `${newFirstName} ${newLastName}`.trim();
      }
      
      await updateUser(ctx.user.id, updateData);
      return { success: true };
    }),

  // Change user password (admin only)
  changePassword: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await updateUser(input.userId, { passwordHash });
      return { success: true };
    }),

  // Activate user (admin only)
  activate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateUser(input.id, { status: "active" } as any);
      return { success: true };
    }),

  // Deactivate user (admin only)
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateUser(input.id, { status: "inactive" } as any);
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
