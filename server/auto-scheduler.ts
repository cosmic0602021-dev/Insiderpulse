import { advancedOpenInsiderCollector, setBroadcaster } from './openinsider-collector-advanced';
import { marketBeatCollector, setBroadcaster as setMarketBeatBroadcaster } from './marketbeat-collector';
import { secRssScraper } from './scrapers/sec-rss-scraper';
import { storage } from './storage';
import { broadcastUpdate } from './routes';
import type { InsertInsiderTrade } from '@shared/schema';
import { db } from './db-storage';
import { collectionRuns } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { shouldRunDataCollection } from './utils/market-hours';

class AutoScheduler {
  private openInsiderInterval: NodeJS.Timeout | null = null;
  private marketBeatInterval: NodeJS.Timeout | null = null;
  private secRssInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    // Inject broadcasters to avoid circular dependencies
    setBroadcaster(broadcastUpdate);
    setMarketBeatBroadcaster(broadcastUpdate);
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Auto scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting InsiderTrack Pro Auto Scheduler...');

    // PRIMARY COLLECTOR: OpenInsider (every 5 minutes for complete coverage)
    this.startOpenInsiderSchedule();

    // SECONDARY COLLECTOR: MarketBeat (every 30 minutes for comprehensive data)
    this.startMarketBeatSchedule();

    // TERTIARY COLLECTOR: SEC RSS Feed (every 15 minutes for direct SEC data)
    this.startSecRssSchedule();

    // Run initial collection after 30 seconds
    setTimeout(() => {
      this.runOpenInsiderCollection();
    }, 30000);

    console.log('✅ Auto scheduler started successfully - MARKET HOURS OPTIMIZED:');
    console.log('   🔄 OpenInsider: Every 1 hour (during market hours)');
    console.log('   🔄 MarketBeat: Every 1 hour (during market hours)');
    console.log('   🔄 SEC RSS: Every 1 hour (during market hours)');
    console.log('   ⏰ Collection window: 8:30 AM - 5:00 PM ET');
    console.log('   🏖️ Weekends/After-hours: SKIPPED (market closed)');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Auto scheduler is not running');
      return;
    }

    console.log('🛑 Stopping auto scheduler...');

    if (this.openInsiderInterval) {
      clearInterval(this.openInsiderInterval);
      this.openInsiderInterval = null;
    }

    if (this.marketBeatInterval) {
      clearInterval(this.marketBeatInterval);
      this.marketBeatInterval = null;
    }

    if (this.secRssInterval) {
      clearInterval(this.secRssInterval);
      this.secRssInterval = null;
    }

    this.isRunning = false;
    console.log('✅ Auto scheduler stopped');
  }

  private startOpenInsiderSchedule() {
    // Run OpenInsider collection every 1 hour during market hours
    this.openInsiderInterval = setInterval(() => {
      this.runOpenInsiderCollection();
    }, 1 * 60 * 60 * 1000); // 1 hour

    console.log('📅 OpenInsider scheduled: Every 1 hour (during market hours 8:30AM-5PM ET)');
  }

  private startMarketBeatSchedule() {
    // Run MarketBeat collection every 1 hour during market hours
    // Offset by 10 minutes to avoid conflicts with OpenInsider
    setTimeout(() => {
      this.marketBeatInterval = setInterval(() => {
        this.runMarketBeatCollection();
      }, 1 * 60 * 60 * 1000); // 1 hour

      // Run first MarketBeat collection after the initial delay
      this.runMarketBeatCollection();
    }, 10 * 60 * 1000); // Start after 10 minutes

    console.log('📅 MarketBeat scheduled: Every 1 hour (during market hours 8:30AM-5PM ET)');
  }

  private startSecRssSchedule() {
    // Run SEC RSS collection every 1 hour during market hours
    // Offset by 20 minutes to avoid conflicts with other collectors
    setTimeout(() => {
      this.secRssInterval = setInterval(() => {
        this.runSecRssCollection();
      }, 1 * 60 * 60 * 1000); // 1 hour

      // Run first SEC RSS collection after the initial delay
      this.runSecRssCollection();
    }, 20 * 60 * 1000); // Start after 20 minutes

    console.log('📅 SEC RSS scheduled: Every 1 hour (during market hours 8:30AM-5PM ET)');
  }

  private async runOpenInsiderCollection() {
    // Skip collection on US weekends/holidays to save costs
    if (!shouldRunDataCollection()) {
      return; // Logging is done inside shouldRunDataCollection()
    }

    const startedAt = new Date();
    let runId: string | null = null;

    try {
      console.log('🔄 [AUTO] Starting OpenInsider collection...');

      // Create collection run record
      const [run] = await db.insert(collectionRuns).values({
        collectorName: 'openinsider',
        status: 'running',
        startedAt,
      }).returning();
      runId = run.id;

      const startTime = Date.now();
      const processedCount = await advancedOpenInsiderCollector.collectLatestTrades({ maxPages: 50, perPage: 100 });
      const duration = Date.now() - startTime;

      // Update run as successful
      await db.update(collectionRuns)
        .set({
          status: 'success',
          tradesCollected: processedCount,
          completedAt: new Date(),
        })
        .where(eq(collectionRuns.id, runId));

      console.log(`✅ [AUTO] OpenInsider collection completed in ${duration}ms`);
      console.log(`   📊 Processed: ${processedCount} new trades`);

      this.logCollectionStats('OpenInsider', processedCount, duration);

    } catch (error) {
      console.error('❌ [AUTO] OpenInsider collection failed:', error);

      // Update run as failed
      if (runId) {
        await db.update(collectionRuns)
          .set({
            status: 'failure',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
          })
          .where(eq(collectionRuns.id, runId));
      }

      console.log('🔄 Will retry on next scheduled run...');
    }
  }

  private async runMarketBeatCollection() {
    // Skip collection on US weekends/holidays to save costs
    if (!shouldRunDataCollection()) {
      return; // Logging is done inside shouldRunDataCollection()
    }

    const startedAt = new Date();
    let runId: string | null = null;

    try {
      console.log('🔄 [AUTO] Starting MarketBeat supplemental collection...');

      // Create collection run record
      const [run] = await db.insert(collectionRuns).values({
        collectorName: 'marketbeat',
        status: 'running',
        startedAt,
      }).returning();
      runId = run.id;

      const startTime = Date.now();
      const processedCount = await marketBeatCollector.collectLatestTrades(100);
      const duration = Date.now() - startTime;

      // Update run as successful
      await db.update(collectionRuns)
        .set({
          status: 'success',
          tradesCollected: processedCount,
          completedAt: new Date(),
        })
        .where(eq(collectionRuns.id, runId));

      console.log(`✅ [AUTO] MarketBeat collection completed in ${duration}ms`);
      console.log(`   📊 Processed: ${processedCount} new trades`);

      this.logCollectionStats('MarketBeat', processedCount, duration);

    } catch (error) {
      console.error('❌ [AUTO] MarketBeat collection failed:', error);

      // Update run as failed
      if (runId) {
        await db.update(collectionRuns)
          .set({
            status: 'failure',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
          })
          .where(eq(collectionRuns.id, runId));
      }

      console.log('🔄 Will retry on next scheduled run...');
    }
  }

  private async runSecRssCollection() {
    // Skip collection on US weekends/holidays to save costs
    if (!shouldRunDataCollection()) {
      return; // Logging is done inside shouldRunDataCollection()
    }

    const startedAt = new Date();
    let runId: string | null = null;

    try {
      console.log('🔄 [AUTO] Starting SEC RSS direct collection...');

      // Create collection run record
      const [run] = await db.insert(collectionRuns).values({
        collectorName: 'sec-rss',
        status: 'running',
        startedAt,
      }).returning();
      runId = run.id;

      const startTime = Date.now();

      // Get latest Form 4 filings from SEC RSS feed
      const trades = await secRssScraper.getLatestForm4Filings();

      let processedCount = 0;

      // Convert and save each trade
      for (const trade of trades) {
        try {
          // Convert ParsedInsiderTrade to InsertInsiderTrade
          const convertedTrade: InsertInsiderTrade = {
            accessionNumber: trade.accessionNumber,
            companyName: trade.companyName,
            ticker: trade.ticker,
            traderName: trade.insiderName,
            traderTitle: trade.title,
            tradeType: trade.transactionType as any,
            transactionCode: this.mapTransactionTypeToCode(trade.transactionType),
            shares: trade.shares,
            pricePerShare: trade.pricePerShare,
            totalValue: trade.totalValue,
            ownershipPercentage: null,
            filedDate: new Date(trade.filingDate),
            significanceScore: this.calculateSignificanceScore(trade.totalValue, trade.transactionType),
            signalType: this.determineSignalType(trade.transactionType),
            isVerified: false,
            verificationStatus: 'UNVERIFIED',
            verificationNotes: `Data sourced from SEC RSS Feed - direct from SEC`,
            secFilingUrl: trade.secLink,
          };

          await storage.createInsiderTrade(convertedTrade);
          processedCount++;

        } catch (error: any) {
          // Skip duplicates silently
          if (!error.message?.includes('duplicate') && !error.message?.includes('unique constraint')) {
            console.error(`❌ Error processing SEC RSS trade for ${trade.ticker}:`, error.message);
          }
        }
      }

      const duration = Date.now() - startTime;

      // Update run as successful
      await db.update(collectionRuns)
        .set({
          status: 'success',
          tradesCollected: processedCount,
          completedAt: new Date(),
          metadata: { totalTrades: trades.length },
        })
        .where(eq(collectionRuns.id, runId));

      console.log(`\n✅ [AUTO] SEC RSS Collection Complete`);
      console.log(`   ⏱️ Duration: ${duration}ms`);
      console.log(`   📊 Total RSS items fetched: ${trades.length}`);
      console.log(`   ✅ New trades collected: ${processedCount}`);
      console.log(`   🔄 Duplicates skipped: ${trades.length - processedCount}`);
      if (processedCount === 0 && trades.length === 0) {
        console.log(`   ⚠️ No RSS items found - check SEC.gov accessibility`);
      } else if (processedCount === 0 && trades.length > 0) {
        console.log(`   💡 All trades already in database (normal if up-to-date)`);
      }

      this.logCollectionStats('SEC RSS', processedCount, duration);

    } catch (error) {
      console.error('❌ [AUTO] SEC RSS collection failed:', error);

      // Update run as failed
      if (runId) {
        await db.update(collectionRuns)
          .set({
            status: 'failure',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
          })
          .where(eq(collectionRuns.id, runId));
      }

      console.log('🔄 Will retry on next scheduled run...');
    }
  }

  // Helper methods for SEC RSS data conversion
  private mapTransactionTypeToCode(transactionType: string): string {
    const mapping: Record<string, string> = {
      'BUY': 'P',
      'SELL': 'S',
      'OPTION_EXERCISE': 'M',
      'GIFT': 'G',
      'OTHER': 'A'
    };
    return mapping[transactionType] || 'A';
  }

  private calculateSignificanceScore(totalValue: number, transactionType: string): number {
    let score = 0;

    // Base score on trade value
    if (totalValue >= 10000000) score += 50; // $10M+
    else if (totalValue >= 5000000) score += 40; // $5M+
    else if (totalValue >= 1000000) score += 30; // $1M+
    else if (totalValue >= 500000) score += 20; // $500K+
    else if (totalValue >= 100000) score += 10; // $100K+

    // Buy signals are more significant
    if (transactionType === 'BUY') score += 20;

    return Math.min(score, 100);
  }

  private determineSignalType(transactionType: string): 'BUY' | 'SELL' | 'NEUTRAL' {
    if (transactionType === 'BUY') return 'BUY';
    if (transactionType === 'SELL') return 'SELL';
    return 'NEUTRAL';
  }

  private logCollectionStats(source: string, processed: number, duration: number) {
    const timestamp = new Date().toLocaleString();
    console.log(`📈 [STATS] ${source} - ${timestamp}: ${processed} trades in ${duration}ms`);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      openInsiderScheduled: !!this.openInsiderInterval,
      marketBeatScheduled: !!this.marketBeatInterval,
      secRssScheduled: !!this.secRssInterval,
      nextOpenInsiderRun: this.openInsiderInterval ? 'Every 6 hours' : 'Not scheduled',
      nextMarketBeatRun: this.marketBeatInterval ? 'Every 6 hours' : 'Not scheduled',
      nextSecRssRun: this.secRssInterval ? 'Every 6 hours' : 'Not scheduled',
    };
  }

  // Manual trigger methods for testing/admin use
  async manualOpenInsiderRun(limit: number = 100): Promise<number> {
    console.log(`🔧 [MANUAL] Running OpenInsider collection (limit: ${limit})...`);
    return await advancedOpenInsiderCollector.collectLatestTrades({ maxPages: Math.ceil(limit/100), perPage: 100 });
  }

  async manualMarketBeatRun(limit: number = 50): Promise<number> {
    console.log(`🔧 [MANUAL] Running MarketBeat collection (limit: ${limit})...`);
    return await marketBeatCollector.collectLatestTrades(limit);
  }
}

// Singleton instance
export const autoScheduler = new AutoScheduler();

// NOTE: Auto-scheduler is now initialized from server/index.ts after server is ready
// This prevents blocking the server startup process
// The scheduler will start 30 seconds after the server begins listening