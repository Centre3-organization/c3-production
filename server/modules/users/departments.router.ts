import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import {
  createDepartment,
  getDepartmentById,
  listDepartments,
  updateDepartment,
  deleteDepartment,
} from "../../infra/db/connection";

export const departmentsRouter = router({
  // List all departments
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listDepartments(input);
    }),

  // Get department by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const department = await getDepartmentById(input.id);
      if (!department) {
        throw new Error("Department not found");
      }
      return department;
    }),

  // Create new department (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        costCenter: z.string().max(50).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createDepartment({
        name: input.name,
        costCenter: input.costCenter || null,
        description: input.description || null,
      });
      return { id };
    }),

  // Update department (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        costCenter: z.string().max(50).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateDepartment(id, data);
      return { success: true };
    }),

  // Delete department (admin only) - soft delete
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDepartment(input.id);
      return { success: true };
    }),
});
