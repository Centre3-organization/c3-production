import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import {
  createRole,
  getRoleById,
  listRoles,
  updateRole,
  deleteRole,
} from "../../infra/db/connection";

// Permission schema for validation
const permissionSchema = z.record(
  z.string(),
  z.record(z.string(), z.boolean())
);

export const rolesRouter = router({
  // List all roles
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listRoles(input);
    }),

  // Get role by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const role = await getRoleById(input.id);
      if (!role) {
        throw new Error("Role not found");
      }
      return role;
    }),

  // Create new role (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        permissions: permissionSchema,
      })
    )
    .mutation(async ({ input }) => {
      const id = await createRole({
        name: input.name,
        description: input.description || null,
        permissions: input.permissions,
        isSystem: false,
      });
      return { id };
    }),

  // Update role (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        permissions: permissionSchema.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // Check if trying to modify a system role's name
      const existing = await getRoleById(id);
      if (existing?.isSystem && data.name && data.name !== existing.name) {
        throw new Error("Cannot rename system roles");
      }
      
      await updateRole(id, data);
      return { success: true };
    }),

  // Delete role (admin only) - soft delete
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRole(input.id);
      return { success: true };
    }),
});
