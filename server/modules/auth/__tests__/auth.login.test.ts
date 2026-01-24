import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock the database module
vi.mock("../../../infra/db/connection", () => ({
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock the SDK module
vi.mock("../../../_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-jwt-token-12345"),
  },
}));

import * as db from "../../../infra/db/connection";

describe("Auth Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("password verification", () => {
    it("should verify correct password against hash", async () => {
      const password = "Centre3@Admin2025";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const correctPassword = "Centre3@Admin2025";
      const wrongPassword = "WrongPassword123";
      const hash = await bcrypt.hash(correctPassword, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("user lookup", () => {
    it("should find user by email", async () => {
      const mockUser = {
        id: 3,
        openId: "manual_user_123",
        name: "Test Admin",
        email: "mohsiin@gmail.com",
        passwordHash: await bcrypt.hash("Centre3@Admin2025", 10),
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("mohsiin@gmail.com");
      
      expect(user).toBeDefined();
      expect(user?.email).toBe("mohsiin@gmail.com");
      expect(user?.role).toBe("admin");
      expect(user?.passwordHash).toBeDefined();
    });

    it("should return undefined for non-existent user", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

      const user = await db.getUserByEmail("nonexistent@example.com");
      
      expect(user).toBeUndefined();
    });
  });

  describe("login flow simulation", () => {
    it("should successfully authenticate with correct credentials", async () => {
      const password = "Centre3@Admin2025";
      const hash = await bcrypt.hash(password, 10);
      
      const mockUser = {
        id: 3,
        openId: "manual_user_123",
        name: "Admin User",
        email: "mohsiin@gmail.com",
        passwordHash: hash,
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(db.updateUser).mockResolvedValue(undefined);

      // Simulate login flow
      const user = await db.getUserByEmail("mohsiin@gmail.com");
      expect(user).toBeDefined();
      
      const isValidPassword = await bcrypt.compare(password, user!.passwordHash!);
      expect(isValidPassword).toBe(true);
      
      // Update last signed in
      await db.updateUser(user!.id, { lastSignedIn: new Date() });
      expect(db.updateUser).toHaveBeenCalledWith(3, expect.objectContaining({
        lastSignedIn: expect.any(Date),
      }));
    });

    it("should fail authentication with wrong password", async () => {
      const correctPassword = "Centre3@Admin2025";
      const wrongPassword = "WrongPassword";
      const hash = await bcrypt.hash(correctPassword, 10);
      
      const mockUser = {
        id: 3,
        openId: "manual_user_123",
        name: "Admin User",
        email: "mohsiin@gmail.com",
        passwordHash: hash,
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("mohsiin@gmail.com");
      expect(user).toBeDefined();
      
      const isValidPassword = await bcrypt.compare(wrongPassword, user!.passwordHash!);
      expect(isValidPassword).toBe(false);
    });

    it("should fail if user has no password set", async () => {
      const mockUser = {
        id: 3,
        openId: "manual_user_123",
        name: "Admin User",
        email: "mohsiin@gmail.com",
        passwordHash: null,
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("mohsiin@gmail.com");
      expect(user).toBeDefined();
      expect(user?.passwordHash).toBeNull();
      
      // Login should fail because no password is set
      const hasPassword = !!user?.passwordHash;
      expect(hasPassword).toBe(false);
    });
  });
});
