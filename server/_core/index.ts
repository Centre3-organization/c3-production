import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// Security middleware imports
import {
  applySecurityHeaders,
  apiLimiter,
  authLimiter,
  csrfTokenSetter,
} from "../middleware";
import formPdfRouter from "../modules/forms/formPdf.route";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for correct IP detection behind reverse proxy (nginx, load balancer)
  app.set('trust proxy', 1);
  
  // ============================================================================
  // SECURITY MIDDLEWARE (applied first)
  // ============================================================================
  
  // Parse cookies for CSRF and session handling
  app.use(cookieParser());
  
  // Apply security headers (Helmet.js + custom headers)
  app.use(applySecurityHeaders);
  
  // Set CSRF token on all responses
  app.use(csrfTokenSetter);
  
  // Apply rate limiting to API endpoints
  app.use('/api', apiLimiter);
  
  // Apply stricter rate limiting to auth endpoints
  app.use('/api/auth', authLimiter);
  // OAuth removed - password-only auth
  
  // ============================================================================
  // BODY PARSING
  // ============================================================================
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // ============================================================================
  // ROUTES
  // ============================================================================
  
  // Health check endpoint (excluded from rate limiting)
  app.get('/health', async (req, res) => {
    const healthStatus: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        server: { status: 'healthy' },
        database: { status: 'unknown' },
      },
    };

    try {
      // Probe database with a lightweight query
      const { getDb } = await import('../infra/db/connection');
      const db = await getDb();
      if (db) {
        const { sql } = await import('drizzle-orm');
        const start = Date.now();
        await db.execute(sql`SELECT 1`);
        const latencyMs = Date.now() - start;
        healthStatus.services.database = {
          status: 'healthy',
          latencyMs,
        };
      } else {
        healthStatus.services.database = { status: 'unavailable', reason: 'No DATABASE_URL configured' };
        healthStatus.status = 'degraded';
      }
    } catch (error: any) {
      healthStatus.services.database = {
        status: 'unhealthy',
        reason: error.message?.includes('no available peers')
          ? 'TiDB peers unavailable (transient)'
          : 'Connection failed',
      };
      healthStatus.status = 'degraded';
    }

    const httpCode = healthStatus.status === 'ok' ? 200 : 503;
    res.status(httpCode).json(healthStatus);
  });

  // Lightweight liveness probe (always returns 200)
  app.get('/health/live', (_req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
  });
  
  // Auth routes (logout only - OAuth removed, password-only auth)
  registerOAuthRoutes(app);
  
  // Form PDF generation route
  app.use("/api/forms", formPdfRouter);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // ============================================================================
  // STATIC FILES / VITE
  // ============================================================================
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Security middleware enabled: Helmet, Rate Limiting, CSRF`);
  });
}

startServer().catch(console.error);
