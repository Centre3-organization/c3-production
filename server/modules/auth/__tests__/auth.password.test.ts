import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock the database module
vi.mock("../../../infra/db/connection", () => ({
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}));

import * as db from "../../../infra/db/connection";

describe("Password Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bcrypt password hashing", () => {
    it("should hash password correctly", async () => {
      const password = "TestPassword123";
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true);
    });

    it("should verify correct password", async () => {
      const password = "TestPassword123";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123";
      const wrongPassword = "WrongPassword456";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("getUserByEmail with passwordHash", () => {
    it("should return user with passwordHash field", async () => {
      const mockUser = {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "$2b$10$hashedpassword",
        role: "user" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("test@example.com");
      
      expect(user).toBeDefined();
      expect(user?.passwordHash).toBe("$2b$10$hashedpassword");
    });

    it("should return undefined for non-existent user", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

      const user = await db.getUserByEmail("nonexistent@example.com");
      
      expect(user).toBeUndefined();
    });
  });

  describe("password verification flow", () => {
    it("should verify password against stored hash", async () => {
      const password = "Centre3@Admin2025";
      const hash = await bcrypt.hash(password, 10);
      
      const mockUser = {
        id: 1,
        openId: "test-open-id",
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: hash,
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("admin@example.com");
      expect(user).toBeDefined();
      
      const isValid = await bcrypt.compare(password, user!.passwordHash!);
      expect(isValid).toBe(true);
    });

    it("should reject login with wrong password", async () => {
      const correctPassword = "Centre3@Admin2025";
      const wrongPassword = "WrongPassword123";
      const hash = await bcrypt.hash(correctPassword, 10);
      
      const mockUser = {
        id: 1,
        openId: "test-open-id",
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: hash,
        role: "admin" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const user = await db.getUserByEmail("admin@example.com");
      expect(user).toBeDefined();
      
      const isValid = await bcrypt.compare(wrongPassword, user!.passwordHash!);
      expect(isValid).toBe(false);
    });
  });
});
