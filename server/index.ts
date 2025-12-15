import path from "path";
import fs from "fs";
import { createServer } from "http";
import "dotenv/config";

// 🔧 CRITICAL: Force production DATABASE_URL (override Replit auto-injection)
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_pO2GuI4kVjUy@ep-ancient-cloud-a50dgue7.us-east-2.aws.neon.tech/neondb?sslmode=require";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import { stockPriceService } from "./stock-price-service";

const execAsync = promisify(exec);

const app = express();

// CRITICAL FIX: Skip JSON parsing for Stripe webhook (needs raw body)
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') {
    next(); // Skip JSON parser for webhook
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false }));

// CORS middleware - 앱인토스 및 허용된 origin 지원
const ALLOWED_ORIGINS = [
  'https://insiderpulse.apps.tossmini.com',       // 토스 앱인토스 실제 서비스
  'https://insiderpulse.private-apps.tossmini.com', // 토스 앱인토스 테스트
  'https://insiderpulse.pro',                      // 프로덕션
  'http://localhost:5000',                         // 로컬 개발
  'http://localhost:3000',                         // 로컬 개발 (Vite)
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 디버깅: origin 로그
  console.log(`🌐 [CORS] Request from origin: ${origin || 'null'}, User-Agent: ${req.headers['user-agent']?.substring(0, 50)}`);

  // origin이 허용 목록에 있거나, 개발 환경에서는 모든 origin 허용
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // 허용되지 않은 origin이지만, credentials 없이 허용
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // origin이 없는 경우 (서버간 통신 등)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Appintos-Signature');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

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
  // Skip database migration on Autoscale to allow fast startup
  // Database should be migrated separately before deployment
  // if (process.env.NODE_ENV !== 'production') {
  //   try {
  //     log('🔄 Checking database schema...');
  //     await execAsync('npm run db:push');
  //     log('✅ Database schema is up to date');
  //   } catch (error) {
  //     log(`⚠️ Database migration failed, continuing anyway: ${error}`);
  //   }
  // }

  const server = await registerRoutes(app);

  // 🚀 Automated data collection enabled (strategic time slots)
  console.log('🚀 Server started with automated data collection enabled');
  console.log('⏰ Data collection: 9 strategic times per weekday');
  console.log('🔥 Peak coverage: 15:00-18:00 ET (55-65% of all filings)');

  // Serve sitemap.xml and robots.txt
  app.get('/sitemap.xml', (_req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'sitemap', 'sitemap.xml');
      if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'application/xml');
        res.send(file);
      } else {
        res.status(404).send('Sitemap not found');
      }
    } catch (error) {
      log('Error serving sitemap:', error);
      res.status(500).send('Error serving sitemap');
    }
  });

  app.get('/robots.txt', (_req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'sitemap', 'robots.txt');
      if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'text/plain');
        res.send(file);
      } else {
        res.status(404).send('Robots.txt not found');
      }
    } catch (error) {
      log('Error serving robots.txt:', error);
      res.status(500).send('Error serving robots.txt');
    }
  });

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
  let port = parseInt(process.env.PORT || '5000', 10);

  // Start server with proper error handling
  // Add error event listener BEFORE calling listen (catches async errors)
  server.on('error', async (error: any) => {
    console.error('❌ HTTP Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port is already in use`);
      console.error(`💡 Current PORT setting: ${port}`);
      console.error(`💡 Solution: Change PORT in .env file or kill the process using this port`);

      // Attempt to kill existing process on this port and retry
      try {
        console.log(`🔧 Attempting to kill process on port ${port}...`);
        await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        console.log(`✅ Killed existing process, retrying in 2 seconds...`);
        setTimeout(() => {
          server.listen({ port, host: "0.0.0.0" });
        }, 2000);
        return; // Don't exit, wait for retry
      } catch (killError) {
        console.error(`❌ Could not kill existing process:`, killError);
      }
    }
    process.exit(1);
  });

  try {
    server.listen({
      port: port,
      host: "0.0.0.0"
    }, () => {
      log(`serving on port ${port}`);

      // 🛡️ Start crash prevention system early for protection
      setTimeout(async () => {
        try {
          log('🛡️ Starting crash prevention system...');
          const { crashPreventionSystem } = await import('./crash-prevention-system');
          crashPreventionSystem.start();
          log('✅ Crash prevention system started');
        } catch (error) {
          log('⚠️ Crash prevention system initialization failed:', error);
        }
      }, 5000); // Wait 5 seconds after server is ready

      // 🚀 Initialize auto-scheduler for automated data collection
      // Delayed start to ensure server is fully responsive first
      setTimeout(async () => {
        try {
          log('🚀 Starting auto-scheduler for automated data collection...');
          const { autoScheduler } = await import('./auto-scheduler');
          autoScheduler.start();
          log('✅ Auto-scheduler started successfully');
        } catch (error) {
          log('⚠️ Auto-scheduler initialization failed:', error);
        }
      }, 30000); // Wait 30 seconds after server is ready

      // Start stock price updates after server is ready
      setTimeout(() => {
        stockPriceService.startPeriodicUpdates();
      }, 35000); // After auto-scheduler initialization

      // Start cron jobs for subscription sync and trial checks
      setTimeout(async () => {
        try {
          log('🕐 Starting cron jobs...');
          const { startAllCronJobs } = await import('./cron-jobs');
          startAllCronJobs();
          log('✅ Cron jobs started successfully');
        } catch (error) {
          log('⚠️ Cron jobs initialization failed:', error);
        }
      }, 40000); // After stock price service

      // 🔄 Auto-detect and fill data gaps - disabled on startup to prevent blocking
      // Run manually via API endpoint /api/admin/backfill-missing if needed
      // setTimeout(async () => {
      //   try {
      //     log('🔍 Checking for data collection gaps...');
      //     const { backfillManager } = await import('./backfill-missing-trades');
      //     const result = await backfillManager.autoBackfill();

      //     if (result.gapDetected) {
      //       log(`✅ Gap recovery complete: ${result.tradesCollected} trades collected`);
      //     } else {
      //       log('✅ No gaps detected - data is up to date');
      //     }
      //   } catch (error) {
      //     log('⚠️ Gap detection failed (will retry on next startup):', error);
      //   }
      // }, 10000); // Run 10 seconds after startup to avoid race conditions
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    log(`🔄 ${signal} received, shutting down gracefully...`);

    try {
      server.close();

      if (process.env.NODE_ENV === 'production') {
        // Only stop monitoring systems in production
        log('⏹️ Stopping monitoring systems...');
        try {
          const { dataQualityMonitor } = await import('./data-quality-monitor');
          const { automatedQualityAlerts } = await import('./automated-quality-alerts');
          const { realTimeFreshnessMonitor } = await import('./real-time-freshness-monitor');
          const { crashPreventionSystem } = await import('./crash-prevention-system');

          dataQualityMonitor.stop();
          automatedQualityAlerts.stop();
          realTimeFreshnessMonitor.stop();
          crashPreventionSystem.stop();
        } catch (error) {
          log('⚠️ Some monitoring systems already stopped');
        }

        // Final data check in production only
        try {
          log('🔍 Final data integrity check...');
          const { storage } = await import('./storage');
          const finalStats = await storage.getTradingStats(true);
          log(`📊 Final data state: ${finalStats.todayTrades} trades, $${finalStats.totalVolume.toLocaleString()} volume`);
        } catch (error) {
          log('⚠️ Final data check failed, continuing shutdown');
        }
      }

      log('✅ Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      log('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();

