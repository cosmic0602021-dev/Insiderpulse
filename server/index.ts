import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import { stockPriceService } from "./stock-price-service";
// Initialize data collectors only in production
if (process.env.NODE_ENV === 'production') {
  import('./sec-collector'); // Initialize SEC data collector
  import('./auto-scheduler'); // Initialize auto scheduler
}
// import { startupBackfillManager } from './startup-backfill';
// import { enhancedDataCollector } from './enhanced-data-collector';
// import { massiveDataImporter } from './massive-data-import';
// import { patternDetectionService } from './pattern-detection-service';

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

  // Reduced data collection in development for stability
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Starting data collection system...');
    setTimeout(async () => {
      try {
        console.log('🚀 Starting initial data collection...');

        // Import and start data collectors
        try {
          console.log('🚀 Starting SEC EDGAR data collection...');
          const { secEdgarCollector, setBroadcaster } = await import('./sec-edgar-collector');
          setBroadcaster((type: string, data: any) => {
            console.log(`📡 SEC Broadcast: ${type}`);
          });

          // Collect latest SEC Form 4 filings
          const processedCount = await secEdgarCollector.collectLatestForm4Filings(25);
          console.log(`✅ SEC EDGAR data collection completed: ${processedCount} trades processed`);

        } catch (secError) {
          console.warn('⚠️ SEC collector failed, trying OpenInsider backup:', secError);

          // Fallback to OpenInsider
          try {
            const { openInsiderCollector, setBroadcaster } = await import('./openinsider-collector');
            setBroadcaster((type: string, data: any) => {
              console.log(`📡 OpenInsider Broadcast: ${type}`);
            });

            const processedCount = await openInsiderCollector.collectLatestTrades(50);
            console.log(`✅ OpenInsider backup collection completed: ${processedCount} trades processed`);
          } catch (backupError) {
            console.error('❌ All data collectors failed:', backupError);
            console.error('❌ No data collectors available - app requires real SEC data');
          }
        }

      // 🚨 즉시 데이터 확인 및 생성 (빈 데이터베이스 해결)
      try {
        const { storage } = await import('./storage');
        const existingTrades = await storage.getInsiderTrades(5, 0);
        if (existingTrades.length === 0) {
          console.log('🚨 Database is empty, need real data collection...');
          console.error('❌ No real data available - please check data collectors');
          console.log(`⚠️ App requires real SEC data - no sample data generated`);
        } else {
          console.log(`✅ Found ${existingTrades.length} existing trades in database`);
        }
      } catch (dbError) {
        console.error('❌ Database check failed:', dbError);
        console.log('🚨 Generating sample data as fallback...');

        try {
          console.error('❌ No real data available - please check data collectors');
          console.log(`⚠️ App requires real SEC data - no sample data generated`);
        } catch (immediateError) {
          console.error('❌ Database initialization failed:', immediateError);
          console.error('❌ App requires real SEC data');
        }
      }
    } catch (error) {
      console.error('❌ Data collection failed, continuing with existing data:', error);
    }
  }, 5000); // Wait 5 seconds for stabilization
  } // Close first production block

  // 🔄 REGULAR DATA COLLECTION - Only in production
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        console.log('🔄 Running scheduled SEC EDGAR data collection...');

        try {
          const { secEdgarCollector, setBroadcaster } = await import('./sec-edgar-collector');
          setBroadcaster((type: string, data: any) => {
            console.log(`📡 Scheduled SEC Broadcast: ${type}`);
          });

          const processedCount = await secEdgarCollector.collectLatestForm4Filings(15);
          console.log(`✅ Scheduled SEC data collection completed: ${processedCount} trades processed`);
        } catch (secError) {
          console.warn('⚠️ Scheduled SEC collector failed, trying OpenInsider:', secError);

          try {
            const { openInsiderCollector, setBroadcaster } = await import('./openinsider-collector');
            setBroadcaster((type: string, data: any) => {
              console.log(`📡 Scheduled OpenInsider Broadcast: ${type}`);
            });

            const processedCount = await openInsiderCollector.collectLatestTrades(25);
            console.log(`✅ Scheduled OpenInsider collection completed: ${processedCount} trades processed`);
          } catch (backupError) {
            console.warn('⚠️ All scheduled collectors failed:', backupError);
          }
        }
      } catch (error) {
        console.error('❌ Scheduled data collection failed:', error);
      }
    }, 30 * 60 * 1000); // 30분마다 실행

    // 🔍 패턴 감지 스케줄러 - 30분마다 실행 (프로덕션만)
    setInterval(async () => {
      try {
        console.log('🔍 Running scheduled pattern detection...');
        const { patternDetectionService } = await import('./pattern-detection-service');
        await patternDetectionService.detectAllPatterns();
        console.log('✅ Scheduled pattern detection completed');
      } catch (error) {
        console.error('❌ Scheduled pattern detection failed:', error);
      }
    }, 30 * 60 * 1000); // 30분마다 실행
  }

  // Development mode: Enable real data collection but no monitoring services
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Real data collection enabled');
    
    // Force real data collection in development
    setTimeout(async () => {
      try {
        console.log('🚀 Starting MarketBeat data collection...');
        const { marketBeatCollector, setBroadcaster } = await import('./marketbeat-collector');
        setBroadcaster((type: string, data: any) => {
          console.log(`📡 MarketBeat Broadcast: ${type}`);
        });

        const processedCount = await marketBeatCollector.collectLatestTrades(100);
        console.log(`✅ MarketBeat collection completed: ${processedCount} trades processed`);

      } catch (error) {
        console.warn('⚠️ MarketBeat collector failed, trying OpenInsider backup:', error);
        
        try {
          const { advancedOpenInsiderCollector, setBroadcaster } = await import('./openinsider-collector-advanced');
          setBroadcaster((type: string, data: any) => {
            console.log(`📡 OpenInsider Broadcast: ${type}`);
          });

          const processedCount = await advancedOpenInsiderCollector.collectLatestTrades(50);
          console.log(`✅ OpenInsider backup collection completed: ${processedCount} trades processed`);
        } catch (backupError) {
          console.error('❌ All data collectors failed:', backupError);
        }
      }
    }, 2000);

    console.log('✅ Development mode: Real data collection enabled, monitoring disabled');
  } else {
    // Production mode: Full monitoring
    console.log('🛡️ Starting crash prevention system...');
    const { crashPreventionSystem } = await import('./crash-prevention-system');
    crashPreventionSystem.start();

    console.log('🚀 Starting data quality monitoring...');
    const { dataQualityMonitor } = await import('./data-quality-monitor');
    dataQualityMonitor.start();

    console.log('🚨 Starting automated quality alerts...');
    const { automatedQualityAlerts } = await import('./automated-quality-alerts');
    automatedQualityAlerts.start();

    console.log('📊 Starting real-time freshness monitoring...');
    const { realTimeFreshnessMonitor } = await import('./real-time-freshness-monitor');
    realTimeFreshnessMonitor.start();

    console.log('🔒 Activating enhanced data validation...');
    const { enhancedDataValidator } = await import('./enhanced-data-validation');

    setTimeout(async () => {
      try {
        console.log('🧹 Running initial database cleanup...');
        const cleanupResult = await enhancedDataValidator.validateAndCleanDatabase();
        console.log(`✅ Initial cleanup completed: ${cleanupResult.validTrades} valid, ${cleanupResult.blockedTrades} blocked`);
      } catch (error) {
        console.error('❌ Initial cleanup failed:', error);
      }
    }, 10000);
  }

  // 📧 주간 요약 이메일 스케줄러 - 매주 월요일 오전 9시 (프로덕션만)
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      const now = new Date();
      const day = now.getDay(); // 0=일요일, 1=월요일
      const hour = now.getHours();

      if (day === 1 && hour === 9) { // 월요일 오전 9시
        try {
          console.log('📧 Running weekly digest email...');
          const { emailNotificationService } = await import('./email-notification-service');
          await emailNotificationService.sendWeeklyDigest();
          console.log('✅ Weekly digest email completed');
        } catch (error) {
          console.error('❌ Weekly digest email failed:', error);
        }
      }
    }, 60 * 60 * 1000); // 1시간마다 체크
  }

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

      // Start stock price service after server is running
      setTimeout(() => {
        stockPriceService.startPeriodicUpdates();
      }, 5000); // Wait 5 seconds for everything to initialize
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

// REMOVED: No fake data generation - only real SEC data allowed
