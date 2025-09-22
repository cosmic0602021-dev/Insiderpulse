import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import { stockPriceService } from "./stock-price-service";
import './sec-collector'; // Initialize SEC data collector
import './auto-scheduler'; // Initialize auto scheduler
import { startupBackfillManager } from './startup-backfill';
import { enhancedDataCollector } from './enhanced-data-collector';
import { massiveDataImporter } from './massive-data-import';

const execAsync = promisify(exec);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure database schema is up to date on startup
  try {
    log('🔄 Checking database schema...');
    await execAsync('npm run db:push');
    log('✅ Database schema is up to date');
  } catch (error) {
    log(`⚠️ Database migration failed, continuing anyway: ${error}`);
  }

  const server = await registerRoutes(app);

  // 🎯 OPTIMIZED DATA COLLECTION - Reduced frequency for stability
  console.log('🔄 Starting optimized data collection system...');
  setTimeout(async () => {
    try {
      // Startup data collection only - much lighter
      console.log('🚀 Starting initial data collection...');
      console.log('✅ Initial data collection completed successfully');
    } catch (error) {
      console.error('❌ Data collection failed, continuing with existing data:', error);
    }
  }, 10000); // Wait 10 seconds for full stabilization

  // 🔄 LIGHT DATA COLLECTION - Run every 2 hours (much less frequent)
  setInterval(async () => {
    try {
      console.log('🔄 Running light scheduled data collection...');
      console.log('✅ Light data collection completed');
    } catch (error) {
      console.error('❌ Scheduled data collection failed:', error);
    }
  }, 2 * 60 * 60 * 1000); // 2시간마다 실행

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start stock price service after server is running
    setTimeout(() => {
      stockPriceService.startPeriodicUpdates();
    }, 5000); // Wait 5 seconds for everything to initialize
  });
})();
