import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

class AuthService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a JWT session token for a user (password-based auth)
   */
  async createSessionToken(
    userId: number,
    options: { expiresInMs?: number; email?: string; name?: string } = {}
  ): Promise<string> {
    const payload: SessionPayload = {
      userId,
      email: options.email || "",
      name: options.name || "",
    };
    return this.signSession(payload, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? 24 * 60 * 60 * 1000; // 1 day default
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { userId, email, name } = payload as Record<string, unknown>;

      // Support both new (userId) and legacy (openId) session formats
      if (typeof userId === "number" && userId > 0) {
        return {
          userId,
          email: typeof email === "string" ? email : "",
          name: typeof name === "string" ? name : "",
        };
      }

      // Legacy session format: openId-based (from old OAuth sessions)
      const openId = (payload as any).openId;
      if (isNonEmptyString(openId)) {
        // Look up user by openId to get their userId
        const user = await db.getUserByOpenId(openId);
        if (user) {
          return {
            userId: user.id,
            email: user.email || "",
            name: user.name || "",
          };
        }
      }

      console.warn("[Auth] Session payload missing required fields");
      return null;
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate a request using JWT session cookie or Authorization header.
   * No OAuth involved - purely password-based sessions.
   */
  async authenticateRequest(req: Request): Promise<User> {
    // Try cookie-based authentication first
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    let session = await this.verifySession(sessionCookie);

    // Fallback to Authorization header (Bearer token) if cookie fails
    if (!session) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        session = await this.verifySession(token);
      }
    }

    if (!session) {
      throw ForbiddenError("Invalid session");
    }

    // Look up user by userId
    const user = await db.getUserById(session.userId);

    if (!user) {
      console.log("[Auth] User not found in system, access denied. userId:", session.userId);
      throw ForbiddenError("User not registered in system. Please contact administrator.");
    }

    // Update last signed in time
    await db.updateUser(user.id, {
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const sdk = new AuthService();
