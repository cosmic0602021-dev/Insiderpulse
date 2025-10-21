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

  // 🚀 REAL-TIME DATA COLLECTION - NO FAKE DATA EVER
  console.log('🚀 Production mode: Real-time data collection ACTIVE');
  console.log('⚠️  ZERO TOLERANCE for fake/simulation data');

  setTimeout(async () => {
    try {
      const { storage } = await import('./storage');
      const existingTrades = await storage.getInsiderTrades(5, 0);

      console.log(`📊 Current database: ${existingTrades.length} trades`);

      // ALWAYS collect fresh real data on startup
      console.log('🔄 Starting real-time data collection...');

      // Primary: SEC EDGAR (most authoritative)
      try {
        console.log('🚀 [1/3] SEC EDGAR data collection...');
        const { secEdgarCollector, setBroadcaster } = await import('./sec-edgar-collector');
        setBroadcaster((type: string, data: any) => {
          console.log(`  📡 SEC: ${type}`);
        });

        const secCount = await secEdgarCollector.collectLatestForm4Filings(25);
        console.log(`  ✅ SEC: ${secCount} real trades collected`);
      } catch (secError) {
        console.warn('  ⚠️ SEC collector error:', secError);
      }

      // Secondary: MarketBeat (reliable backup)
      try {
        console.log('🚀 [2/3] MarketBeat data collection...');
        const { marketBeatCollector, setBroadcaster } = await import('./marketbeat-collector');
        setBroadcaster((type: string, data: any) => {
          console.log(`  📡 MarketBeat: ${type}`);
        });

        const mbCount = await marketBeatCollector.collectLatestTrades(50);
        console.log(`  ✅ MarketBeat: ${mbCount} real trades collected`);
      } catch (mbError) {
        console.warn('  ⚠️ MarketBeat collector error:', mbError);
      }

      // Tertiary: OpenInsider (additional coverage)
      try {
        console.log('🚀 [3/3] OpenInsider data collection...');
        const { openInsiderCollector, setBroadcaster } = await import('./openinsider-collector-advanced');
        setBroadcaster((type: string, data: any) => {
          console.log(`  📡 OpenInsider: ${type}`);
        });

        const oiCount = await openInsiderCollector.collectLatestTrades(30);
        console.log(`  ✅ OpenInsider: ${oiCount} real trades collected`);
      } catch (oiError) {
        console.warn('  ⚠️ OpenInsider collector error:', oiError);
      }

      // Final count
      const finalTrades = await storage.getInsiderTrades(5, 0);
      console.log(`\n✅ Data collection complete: ${finalTrades.length} total trades`);

      if (finalTrades.length > 0) {
        const latest = finalTrades[0];
        console.log(`📅 Latest: ${latest.companyName} (${latest.ticker}) - ${latest.filedDate}`);
      }

    } catch (error) {
      console.error('❌ Startup data collection error:', error);
    }
  }, 3000); // Start after 3 seconds

  // 🔄 CONTINUOUS REAL-TIME DATA COLLECTION (every 15 minutes)
  // 실시간 최신 데이터 보장을 위한 자동 수집
  setInterval(async () => {
    try {
      console.log('\n🔄 [AUTO] Scheduled real-time data refresh...');
      const startTime = Date.now();

      // Multi-source parallel collection for maximum coverage
      const collectors = [
        // SEC EDGAR - Most authoritative
        (async () => {
          try {
            const { secEdgarCollector, setBroadcaster } = await import('./sec-edgar-collector');
            setBroadcaster((type: string) => console.log(`  📡 SEC: ${type}`));
            return await secEdgarCollector.collectLatestForm4Filings(20);
          } catch (e) {
            console.warn('  ⚠️ SEC collection error');
            return 0;
          }
        })(),

        // MarketBeat - High reliability
        (async () => {
          try {
            const { marketBeatCollector, setBroadcaster } = await import('./marketbeat-collector');
            setBroadcaster((type: string) => console.log(`  📡 MarketBeat: ${type}`));
            return await marketBeatCollector.collectLatestTrades(30);
          } catch (e) {
            console.warn('  ⚠️ MarketBeat collection error');
            return 0;
          }
        })(),

        // OpenInsider - Additional coverage
        (async () => {
          try {
            const { openInsiderCollector, setBroadcaster } = await import('./openinsider-collector-advanced');
            setBroadcaster((type: string) => console.log(`  📡 OpenInsider: ${type}`));
            return await openInsiderCollector.collectLatestTrades(20);
          } catch (e) {
            console.warn('  ⚠️ OpenInsider collection error');
            return 0;
          }
        })()
      ];

      const results = await Promise.allSettled(collectors);
      const counts = results.map(r => r.status === 'fulfilled' ? r.value : 0);
      const totalCollected = counts.reduce((sum, c) => sum + c, 0);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ Auto-refresh complete: ${totalCollected} trades in ${duration}s`);

    } catch (error) {
      console.error('  ❌ Scheduled collection error:', error);
    }
  }, 15 * 60 * 1000); // 15분마다 실행 - 더 신선한 데이터

  // 🔍 INTELLIGENT PATTERN DETECTION (every 20 minutes)
  setInterval(async () => {
    try {
      console.log('\n🔍 [AUTO] Running pattern detection on real data...');
      const { patternDetectionService } = await import('./pattern-detection-service');
      await patternDetectionService.detectAllPatterns();
      console.log('  ✅ Pattern detection completed');
    } catch (error) {
      console.error('  ❌ Pattern detection error:', error);
    }
  }, 20 * 60 * 1000); // 20분마다 실행

  // 🛡️ PRODUCTION MONITORING & QUALITY SYSTEMS
  if (process.env.NODE_ENV === 'production') {
    console.log('\n🛡️ Initializing production monitoring systems...');

    try {
      const { crashPreventionSystem } = await import('./crash-prevention-system');
      crashPreventionSystem.start();
      console.log('  ✅ Crash prevention active');
    } catch (e) {
      console.warn('  ⚠️ Crash prevention unavailable');
    }

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

/**
 * 최후 수단: 검증된 샘플 데이터 생성
 * 실제 SEC 패턴을 따르는 유효한 데이터만 생성
 */
// 가짜 데이터 생성 함수 완전 제거 - 실제 데이터만 사용
