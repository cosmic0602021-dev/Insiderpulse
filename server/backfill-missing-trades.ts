import { storage } from './storage';
import { advancedOpenInsiderCollector } from './openinsider-collector-advanced';
import { marketBeatCollector } from './marketbeat-collector';

/**
 * 🔄 BACKFILL MISSING TRADES
 *
 * Detects gaps in trade collection and fills them by:
 * 1. Checking the most recent trade timestamp
 * 2. Calculating gap duration
 * 3. Running massive backfill collection if gap > 1 hour
 */

export interface GapDetectionResult {
  hasGap: boolean;
  gapHours: number;
  lastTradeTime: Date | null;
  currentTime: Date;
  gapDescription: string;
}

export class BackfillManager {
  /**
   * Detect if there's a gap in data collection
   */
  async detectGap(): Promise<GapDetectionResult> {
    console.log('🔍 Checking for data collection gaps...');

    // Get the most recent trade from database
    const recentTrades = await storage.getInsiderTrades(1, 0, false, undefined, undefined, 'filedDate');
    const lastTrade = recentTrades[0];
    const currentTime = new Date();

    if (!lastTrade) {
      return {
        hasGap: true,
        gapHours: Infinity,
        lastTradeTime: null,
        currentTime,
        gapDescription: 'No trades in database - first-time collection needed'
      };
    }

    const lastTradeTime = new Date(lastTrade.filedDate);
    const gapMs = currentTime.getTime() - lastTradeTime.getTime();
    const gapHours = gapMs / (1000 * 60 * 60);

    const hasGap = gapHours > 1; // Consider gap if more than 1 hour

    const gapDescription = hasGap
      ? `Gap detected: ${gapHours.toFixed(1)} hours since last trade (${lastTrade.ticker} - ${lastTrade.companyName})`
      : `No gap: Last trade was ${gapHours.toFixed(1)} hours ago`;

    return {
      hasGap,
      gapHours,
      lastTradeTime,
      currentTime,
      gapDescription
    };
  }

  /**
   * Fill gaps by running massive backfill collection
   */
  async fillGap(gapHours: number): Promise<number> {
    console.log(`🔄 Starting backfill for ${gapHours.toFixed(1)} hour gap...`);

    // Calculate how many pages to fetch based on gap duration
    // Assume ~50 new trades per hour on average
    const estimatedMissingTrades = Math.ceil(gapHours * 50);
    const pagesNeeded = Math.min(Math.ceil(estimatedMissingTrades / 100), 100); // Cap at 100 pages

    console.log(`📊 Estimated ${estimatedMissingTrades} missing trades, fetching ${pagesNeeded} pages...`);

    let totalCollected = 0;

    // 1. OpenInsider backfill (primary source)
    try {
      console.log('🔵 Running OpenInsider backfill...');
      const openInsiderCount = await advancedOpenInsiderCollector.collectMassive({
        mode: 'backfill',
        maxPages: pagesNeeded,
        perPage: 100,
        bypassDuplicates: true
      });
      totalCollected += openInsiderCount;
      console.log(`✅ OpenInsider backfill: ${openInsiderCount} trades collected`);
    } catch (error) {
      console.error('❌ OpenInsider backfill failed:', error);
    }

    // 2. MarketBeat backfill (secondary source)
    try {
      console.log('🟢 Running MarketBeat backfill...');
      const marketBeatCount = await marketBeatCollector.collectLatestTrades(
        Math.min(estimatedMissingTrades, 500)
      );
      totalCollected += marketBeatCount;
      console.log(`✅ MarketBeat backfill: ${marketBeatCount} trades collected`);
    } catch (error) {
      console.error('❌ MarketBeat backfill failed:', error);
    }

    console.log(`✅ Total backfill complete: ${totalCollected} trades collected`);
    return totalCollected;
  }

  /**
   * Auto-detect and fill gaps (main entry point)
   */
  async autoBackfill(): Promise<{ gapDetected: boolean; tradesCollected: number }> {
    const gapResult = await this.detectGap();

    console.log(`📊 Gap Detection Result: ${gapResult.gapDescription}`);

    if (!gapResult.hasGap) {
      console.log('✅ No gap detected, skipping backfill');
      return { gapDetected: false, tradesCollected: 0 };
    }

    console.log(`⚠️ GAP DETECTED: ${gapResult.gapHours.toFixed(1)} hours`);

    const tradesCollected = await this.fillGap(gapResult.gapHours);

    return { gapDetected: true, tradesCollected };
  }
}

// Export singleton instance
export const backfillManager = new BackfillManager();

// CLI script execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('🚀 Running backfill script...\n');

  backfillManager.autoBackfill()
    .then(result => {
      console.log('\n📊 Backfill Summary:');
      console.log(`   Gap Detected: ${result.gapDetected}`);
      console.log(`   Trades Collected: ${result.tradesCollected}`);

      if (result.tradesCollected > 0) {
        console.log('\n✅ Backfill completed successfully!');
      } else if (result.gapDetected) {
        console.log('\n⚠️ Gap detected but no trades collected - check collectors');
      } else {
        console.log('\n✅ No backfill needed - data is up to date');
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Backfill failed:', error);
      process.exit(1);
    });
}
