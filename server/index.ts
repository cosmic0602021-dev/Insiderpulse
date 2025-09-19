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

  // 🚀 MASSIVE DATA COLLECTION - Multiple sources with high frequency
  console.log('🔄 Starting massive data collection system...');
  setTimeout(async () => {
    try {
      // First run massive import from multiple sources
      console.log('🚀 Starting massive data import from multiple sources...');
      await massiveDataImporter.executeManualImport();
      console.log('✅ Massive data import completed successfully');

      // Then run enhanced data collection
      await enhancedDataCollector.performComprehensiveDataCollection();
      console.log('✅ Enhanced data collection completed successfully');

      // Also run original backfill as backup
      await startupBackfillManager.performStartupBackfill();
      console.log('✅ Startup backfill completed successfully');
    } catch (error) {
      console.error('❌ Data collection failed, continuing with existing data:', error);
    }
  }, 5000); // Wait 5 seconds after server start to allow systems to stabilize

  // 🔄 CONTINUOUS DATA COLLECTION - Run every 30 minutes
  setInterval(async () => {
    try {
      console.log('🔄 Running scheduled data collection...');
      await massiveDataImporter.executeManualImport();
      console.log('✅ Scheduled data collection completed');
    } catch (error) {
      console.error('❌ Scheduled data collection failed:', error);
    }
  }, 30 * 60 * 1000); // 30분마다 실행

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
