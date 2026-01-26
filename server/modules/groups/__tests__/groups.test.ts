import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "../../../routers";
import type { TrpcContext } from "../../../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "password",
    role: "admin",
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "password",
    role: "user",
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("groups router", () => {
  describe("groups.list", () => {
    it("returns list of groups for admin user", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.groups.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns list of groups for regular user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.groups.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("groups.getById", () => {
    it("returns group details when group exists", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First get a list of groups to find an existing ID
      const groups = await caller.groups.list();
      
      if (groups.length > 0) {
        const result = await caller.groups.getById({ id: groups[0].id });
        expect(result).toBeDefined();
        expect(result?.id).toBe(groups[0].id);
      }
    });

    it("returns null for non-existent group", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.groups.getById({ id: 999999 });
      expect(result).toBeNull();
    });
  });

  describe("groups.getHierarchy", () => {
    it("returns hierarchical group structure", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.groups.getHierarchy();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("groups.getMembers", () => {
    it("returns members of a group", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First get a list of groups to find an existing ID
      const groups = await caller.groups.list();
      
      if (groups.length > 0) {
        const result = await caller.groups.getMembers({ groupId: groups[0].id });
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe("groups.getAccessPolicies", () => {
    it("returns access policies for a group", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First get a list of groups to find an existing ID
      const groups = await caller.groups.list();
      
      if (groups.length > 0) {
        const result = await caller.groups.getAccessPolicies({ groupId: groups[0].id });
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe("groups.getSecuritySettings", () => {
    it("returns security settings for a group", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First get a list of groups to find an existing ID
      const groups = await caller.groups.list();
      
      if (groups.length > 0) {
        const result = await caller.groups.getSecuritySettings({ groupId: groups[0].id });
        // Result can be null if no settings exist
        expect(result === null || typeof result === 'object').toBe(true);
      }
    });
  });
});

describe("groups CRUD operations", () => {
  let createdGroupId: number | null = null;

  describe("groups.create", () => {
    it("creates a new group successfully", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const newGroup = {
        name: "Test Group",
        description: "A test group for unit testing",
        groupType: "internal" as const,
      };

      const result = await caller.groups.create(newGroup);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      
      createdGroupId = result.id;
    });
  });

  describe("groups.update", () => {
    it("updates an existing group", async () => {
      if (!createdGroupId) {
        console.log("Skipping update test - no group was created");
        return;
      }

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const updatedData = {
        id: createdGroupId,
        name: "Updated Test Group",
        description: "Updated description",
      };

      const result = await caller.groups.update(updatedData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("groups.delete", () => {
    it("deletes an existing group", async () => {
      if (!createdGroupId) {
        console.log("Skipping delete test - no group was created");
        return;
      }

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.groups.delete({ id: createdGroupId });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
