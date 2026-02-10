import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";

/**
 * Register auth-related Express routes.
 * OAuth has been removed - all authentication is password-based via tRPC auth.login.
 */
export function registerOAuthRoutes(app: Express) {
  // Logout route - clears the session cookie and redirects to login
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/login");
  });
}
