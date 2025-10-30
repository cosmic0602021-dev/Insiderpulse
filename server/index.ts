import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import { stockPriceService } from "./stock-price-service";
// Initialize data collectors
import('./auto-scheduler'); // Initialize auto scheduler for automated SEC data collection

const execAsync = promisify(exec);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware for custom domain support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ].filter(Boolean);

  if (origin && allowedOrigins.some(allowed => origin.includes(allowed as string))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

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

  // 🚀 Automated data collection enabled
  console.log('🚀 Server started with automated data collection enabled');
  console.log('📊 SEC data will be automatically collected every 30 minutes');

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
  try {
    server.listen({
      port: port,
      host: "0.0.0.0"
    }, () => {
      log(`serving on port ${port}`);

      // Start stock price updates after server is ready
      setTimeout(() => {
        stockPriceService.startPeriodicUpdates();
      }, 5000);
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

/**
 * 최후 수단: 검증된 샘플 데이터 생성
 * 실제 SEC 패턴을 따르는 유효한 데이터만 생성
 */
// 가짜 데이터 생성 함수 완전 제거 - 실제 데이터만 사용
