import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../infra/db/connection";
import { requestComments, users, groups, userGroupMembership } from "../../../drizzle/schema";
import { eq, and, desc, inArray, or, sql } from "drizzle-orm";

export const commentsRouter = router({
  // Get comments for a request with visibility filtering
  getByRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      
      // Get user's group memberships for group-visibility filtering
      const userGroups = await db
        .select({ groupId: userGroupMembership.groupId })
        .from(userGroupMembership)
        .where(eq(userGroupMembership.userId, userId));
      const userGroupIds = userGroups.map((g: { groupId: number }) => g.groupId);
      
      // Build visibility filter:
      // - Admin/super-admin can see all comments
      // - Regular users can see:
      //   1. Their own private comments
      //   2. Group comments where they are in the target group
      //   3. Requestor-visible comments
      let visibilityFilter;
      if (userRole === "admin") {
        // Admins see everything
        visibilityFilter = and(
          eq(requestComments.requestId, input.requestId),
          eq(requestComments.isDeleted, false),
        );
      } else {
        visibilityFilter = and(
          eq(requestComments.requestId, input.requestId),
          eq(requestComments.isDeleted, false),
          or(
            // Own private comments
            and(eq(requestComments.visibility, "private"), eq(requestComments.authorId, userId)),
            // Group comments where user is in the target group
            userGroupIds.length > 0
              ? and(eq(requestComments.visibility, "group"), inArray(requestComments.targetGroupId, userGroupIds))
              : sql`FALSE`,
            // Requestor-visible comments
            eq(requestComments.visibility, "requestor"),
          ),
        );
      }
      
      const comments = await db
        .select({
          id: requestComments.id,
          requestId: requestComments.requestId,
          instanceId: requestComments.instanceId,
          authorId: requestComments.authorId,
          content: requestComments.content,
          visibility: requestComments.visibility,
          targetGroupId: requestComments.targetGroupId,
          context: requestComments.context,
          taskId: requestComments.taskId,
          isEdited: requestComments.isEdited,
          createdAt: requestComments.createdAt,
          updatedAt: requestComments.updatedAt,
          authorName: users.name,
          authorEmail: users.email,
        })
        .from(requestComments)
        .leftJoin(users, eq(requestComments.authorId, users.id))
        .where(visibilityFilter)
        .orderBy(desc(requestComments.createdAt));
      
      // Enrich with group names for group-visibility comments
      const groupIdSet = new Set<number>();
      comments.forEach((c: any) => { if (c.targetGroupId) groupIdSet.add(c.targetGroupId); });
      const groupIds = Array.from(groupIdSet);
      let groupMap = new Map<number, string>();
      if (groupIds.length > 0) {
        const groupData = await db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(inArray(groups.id, groupIds));
        groupMap = new Map(groupData.map((g: { id: number; name: string }) => [g.id, g.name]));
      }
      
      return comments.map((c: any) => ({
        ...c,
        targetGroupName: c.targetGroupId ? groupMap.get(c.targetGroupId) || null : null,
      }));
    }),

  // Add a comment
  add: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      instanceId: z.number().optional(),
      content: z.string().min(1, "Comment cannot be empty"),
      visibility: z.enum(["private", "group", "requestor"]),
      targetGroupId: z.number().optional(),
      context: z.enum(["approval", "rejection", "clarification", "general", "internal_note"]).optional(),
      taskId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Validate: group visibility requires a target group
      if (input.visibility === "group" && !input.targetGroupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group visibility requires a target group to be specified.",
        });
      }
      
      const [result] = await db.insert(requestComments).values({
        requestId: input.requestId,
        instanceId: input.instanceId || null,
        authorId: ctx.user.id,
        content: input.content,
        visibility: input.visibility,
        targetGroupId: input.targetGroupId || null,
        context: input.context || "general",
        taskId: input.taskId || null,
      });
      
      return { id: result.insertId, success: true };
    }),

  // Edit a comment (only author can edit)
  edit: protectedProcedure
    .input(z.object({
      commentId: z.number(),
      content: z.string().min(1, "Comment cannot be empty"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [comment] = await db
        .select()
        .from(requestComments)
        .where(eq(requestComments.id, input.commentId))
        .limit(1);
      
      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found." });
      }
      
      if (comment.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own comments." });
      }
      
      await db.update(requestComments)
        .set({
          content: input.content,
          isEdited: true,
          editedAt: new Date(),
        })
        .where(eq(requestComments.id, input.commentId));
      
      return { success: true };
    }),

  // Delete a comment (soft delete, only author or admin can delete)
  delete: protectedProcedure
    .input(z.object({
      commentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [comment] = await db
        .select()
        .from(requestComments)
        .where(eq(requestComments.id, input.commentId))
        .limit(1);
      
      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found." });
      }
      
      if (comment.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own comments." });
      }
      
      await db.update(requestComments)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(eq(requestComments.id, input.commentId));
      
      return { success: true };
    }),

  // Get available groups for the current user (for group visibility selector)
  getAvailableGroups: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      // Admins can see all groups
      if (ctx.user.role === "admin") {
        const allGroups = await db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(eq(groups.status, "active"));
        return allGroups;
      }
      
      // Regular users see only their groups
      const userGroups: { id: number; name: string }[] = await db
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .innerJoin(userGroupMembership, eq(groups.id, userGroupMembership.groupId))
        .where(and(
          eq(userGroupMembership.userId, ctx.user.id),
          eq(groups.status, "active"),
        ));
      return userGroups;
    }),
});
