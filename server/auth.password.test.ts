import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user: AuthenticatedUser | null = null) {
  const cookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies, clearedCookies };
}

describe("Password-only authentication", () => {
  describe("SDK session management", () => {
    it("creates a valid JWT session token with userId", async () => {
      const token = await sdk.createSessionToken(42, {
        email: "test@example.com",
        name: "Test User",
        expiresInMs: 60_000,
      });

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      // JWT format: header.payload.signature
      expect(token.split(".")).toHaveLength(3);
    });

    it("verifies a valid session token and returns userId", async () => {
      const token = await sdk.createSessionToken(42, {
        email: "test@example.com",
        name: "Test User",
        expiresInMs: 60_000,
      });

      const session = await sdk.verifySession(token);
      expect(session).not.toBeNull();
      expect(session!.userId).toBe(42);
      expect(session!.email).toBe("test@example.com");
      expect(session!.name).toBe("Test User");
    });

    it("returns null for invalid tokens", async () => {
      const session = await sdk.verifySession("invalid-token");
      expect(session).toBeNull();
    });

    it("returns null for null/undefined tokens", async () => {
      expect(await sdk.verifySession(null)).toBeNull();
      expect(await sdk.verifySession(undefined)).toBeNull();
    });
  });

  describe("auth.login procedure", () => {
    it("rejects login with non-existent email", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: "nonexistent@example.com",
          password: "anypassword",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("validates email format", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: "not-an-email",
          password: "anypassword",
        })
      ).rejects.toThrow();
    });

    it("requires password to be non-empty", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: "test@example.com",
          password: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("auth.logout procedure", () => {
    it("clears the session cookie", async () => {
      const user: AuthenticatedUser = {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "password",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
      const { ctx, clearedCookies } = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    });
  });

  describe("auth.me procedure", () => {
    it("returns null when not authenticated", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("returns user info when authenticated", async () => {
      const user: AuthenticatedUser = {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "password",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
      const { ctx } = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();
      expect(result).not.toBeNull();
      expect(result!.email).toBe("test@example.com");
      expect(result!.name).toBe("Test User");
    });
  });
});
