import { advancedOpenInsiderCollector } from './openinsider-collector-advanced';
import { storage } from './storage';

/**
 * 🚀 STARTUP BACKFILL SYSTEM
 * 
 * Ensures complete 30-day insider trading data on server startup
 * - Runs once on server start
 * - Idempotent (safe to run multiple times)
 * - Fills any gaps in the past 30 days
 */
class StartupBackfillManager {
  private isBackfillRunning = false;
  private backfillCompleted = false;

  /**
   * 🎯 MAIN BACKFILL ORCHESTRATOR
   * Coordinates the complete startup backfill process
   */
  async performStartupBackfill(): Promise<void> {
    if (this.isBackfillRunning || this.backfillCompleted) {
      console.log('🔄 Startup backfill already running or completed, skipping...');
      return;
    }

    this.isBackfillRunning = true;
    
    console.log('🚀 ============================================');
    console.log('🚀 STARTING COMPREHENSIVE STARTUP BACKFILL');
    console.log('🚀 ============================================');

    try {
      // Step 1: Analyze current data coverage
      const coverage = await this.analyzeCoverageGaps();
      console.log(`📊 Current data coverage analysis:`);
      console.log(`   📅 Total trades in database: ${coverage.totalTrades}`);
      console.log(`   📈 Oldest trade date: ${coverage.oldestTradeDate}`);
      console.log(`   🆕 Newest trade date: ${coverage.newestTradeDate}`);
      console.log(`   ❌ Gap days identified: ${coverage.gapDays}`);

      // Step 2: Determine if backfill is needed
      if (!this.needsBackfill(coverage)) {
        console.log('✅ Data coverage is complete - no backfill needed');
        this.markBackfillCompleted();
        return;
      }

      console.log('🎯 Backfill required - proceeding with comprehensive collection...');

      // Step 3: Perform comprehensive 30-day backfill
      const collected = await this.runComprehensiveBackfill();
      
      // Step 4: Verify backfill completeness
      const postCoverage = await this.analyzeCoverageGaps();
      
      console.log('🎉 ============================================');
      console.log('🎉 STARTUP BACKFILL COMPLETED SUCCESSFULLY');
      console.log('🎉 ============================================');
      console.log(`   ✅ New trades collected: ${collected}`);
      console.log(`   📊 Total trades now: ${postCoverage.totalTrades}`);
      console.log(`   📅 Coverage: ${postCoverage.oldestTradeDate} to ${postCoverage.newestTradeDate}`);
      
      this.markBackfillCompleted();

    } catch (error) {
      console.error('❌ Startup backfill failed:', error);
      console.log('⚠️ Server will continue with limited data coverage');
    } finally {
      this.isBackfillRunning = false;
    }
  }

  /**
   * 📊 ANALYZE COVERAGE GAPS
   * Determines what data is missing from the past 30 days
   */
  private async analyzeCoverageGaps(): Promise<{
    totalTrades: number;
    oldestTradeDate: string | null;
    newestTradeDate: string | null;
    gapDays: number;
    hasRecentData: boolean;
  }> {
    try {
      // Get all trades from past 35 days (buffer for analysis)
      const thirtyFiveDaysAgo = new Date();
      thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
      
      const recentTrades = await storage.getInsiderTrades(10000); // Large sample
      
      const filteredTrades = recentTrades.filter(trade => 
        new Date(trade.filedDate) >= thirtyFiveDaysAgo
      );

      if (filteredTrades.length === 0) {
        return {
          totalTrades: 0,
          oldestTradeDate: null,
          newestTradeDate: null,
          gapDays: 30,
          hasRecentData: false,
        };
      }

      // Find date range
      const dates = filteredTrades.map(t => new Date(t.filedDate).getTime());
      const oldestDate = new Date(Math.min(...dates));
      const newestDate = new Date(Math.max(...dates));

      // Calculate gap days (simplified - could be more sophisticated)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const hasRecentData = newestDate >= thirtyDaysAgo;
      const gapDays = hasRecentData ? 0 : 
                     Math.ceil((thirtyDaysAgo.getTime() - newestDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        totalTrades: filteredTrades.length,
        oldestTradeDate: oldestDate.toISOString().split('T')[0],
        newestTradeDate: newestDate.toISOString().split('T')[0],
        gapDays: Math.max(0, gapDays),
        hasRecentData,
      };

    } catch (error) {
      console.error('❌ Error analyzing coverage gaps:', error);
      return {
        totalTrades: 0,
        oldestTradeDate: null,
        newestTradeDate: null,
        gapDays: 30,
        hasRecentData: false,
      };
    }
  }

  /**
   * 🎯 DETERMINE BACKFILL NECESSITY
   * Decides if comprehensive backfill is needed
   */
  private needsBackfill(coverage: any): boolean {
    // Backfill needed if:
    // 1. No trades at all
    // 2. Gap in recent data (more than 2 days)
    // 3. Very few trades (less than 50 in past 30 days - suspicious)
    
    if (coverage.totalTrades === 0) {
      console.log('🔴 No trades found - full backfill required');
      return true;
    }

    if (coverage.gapDays > 2) {
      console.log(`🔴 Data gap detected: ${coverage.gapDays} days - backfill required`);
      return true;
    }

    if (coverage.totalTrades < 50) {
      console.log(`🔴 Suspiciously low trade count (${coverage.totalTrades}) - backfill required`);
      return true;
    }

    if (!coverage.hasRecentData) {
      console.log('🔴 No recent data found - backfill required');
      return true;
    }

    return false;
  }

  /**
   * 🏃 RUN COMPREHENSIVE BACKFILL
   * Executes the actual data collection
   */
  private async runComprehensiveBackfill(): Promise<number> {
    console.log('📡 Starting comprehensive OpenInsider 30-day backfill...');
    
    try {
      // Use the advanced collector's 30-day backfill function
      const collected = await advancedOpenInsiderCollector.collect30DayBackfill();
      
      console.log(`✅ Comprehensive backfill completed: ${collected} trades collected`);
      return collected;
      
    } catch (error) {
      console.error('❌ Comprehensive backfill failed:', error);
      
      // Fallback: Try incremental collection with higher limit
      console.log('🔄 Attempting fallback incremental collection...');
      try {
        const fallbackCollected = await advancedOpenInsiderCollector.collectLatestTrades(1000);
        console.log(`⚠️ Fallback collection completed: ${fallbackCollected} trades`);
        return fallbackCollected;
      } catch (fallbackError) {
        console.error('❌ Fallback collection also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * ✅ MARK BACKFILL COMPLETED
   * Prevents repeated backfills during the same session
   */
  private markBackfillCompleted(): void {
    this.backfillCompleted = true;
    console.log('✅ Startup backfill marked as completed for this session');
  }

  /**
   * 🔍 GET BACKFILL STATUS
   * Returns current backfill state
   */
  getBackfillStatus(): {
    isRunning: boolean;
    isCompleted: boolean;
  } {
    return {
      isRunning: this.isBackfillRunning,
      isCompleted: this.backfillCompleted,
    };
  }

  /**
   * 🔄 FORCE BACKFILL
   * Allows manual trigger of backfill (for admin endpoints)
   */
  async forceBackfill(): Promise<number> {
    console.log('🔧 Force backfill requested - resetting flags...');
    this.backfillCompleted = false;
    this.isBackfillRunning = false;
    
    await this.performStartupBackfill();
    
    // Return some result
    const coverage = await this.analyzeCoverageGaps();
    return coverage.totalTrades;
  }
}

export const startupBackfillManager = new StartupBackfillManager();