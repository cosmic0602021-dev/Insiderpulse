import { openInsiderCollector, setBroadcaster } from './openinsider-collector';
import { marketBeatCollector, setBroadcaster as setMarketBeatBroadcaster } from './marketbeat-collector';
import { broadcastUpdate } from './routes';

class AutoScheduler {
  private openInsiderInterval: NodeJS.Timeout | null = null;
  private marketBeatInterval: NodeJS.Timeout | null = null;
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

    // Primary collector: OpenInsider (every 30 minutes)
    this.startOpenInsiderSchedule();

    // Secondary collector: MarketBeat (every 2 hours for supplemental data)
    this.startMarketBeatSchedule();

    // Run initial collection after 30 seconds
    setTimeout(() => {
      this.runOpenInsiderCollection();
    }, 30000);

    console.log('✅ Auto scheduler started successfully:');
    console.log('   🔄 OpenInsider: Every 30 minutes');
    console.log('   🔄 MarketBeat: Every 2 hours (supplemental)');
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

    this.isRunning = false;
    console.log('✅ Auto scheduler stopped');
  }

  private startOpenInsiderSchedule() {
    // Run OpenInsider collection every 30 minutes (30 * 60 * 1000 = 1800000ms)
    this.openInsiderInterval = setInterval(() => {
      this.runOpenInsiderCollection();
    }, 30 * 60 * 1000);

    console.log('📅 OpenInsider scheduled: Every 30 minutes');
  }

  private startMarketBeatSchedule() {
    // Run MarketBeat collection every 2 hours (2 * 60 * 60 * 1000 = 7200000ms)
    // Offset by 1 hour to avoid conflicts with OpenInsider
    setTimeout(() => {
      this.marketBeatInterval = setInterval(() => {
        this.runMarketBeatCollection();
      }, 2 * 60 * 60 * 1000);

      // Run first MarketBeat collection after the initial delay
      this.runMarketBeatCollection();
    }, 60 * 60 * 1000); // Start after 1 hour

    console.log('📅 MarketBeat scheduled: Every 2 hours (supplemental)');
  }

  private async runOpenInsiderCollection() {
    try {
      console.log('🔄 [AUTO] Starting OpenInsider collection...');
      const startTime = Date.now();
      
      const processedCount = await openInsiderCollector.collectLatestTrades(150); // Collect up to 150 latest trades
      
      const duration = Date.now() - startTime;
      console.log(`✅ [AUTO] OpenInsider collection completed in ${duration}ms`);
      console.log(`   📊 Processed: ${processedCount} new trades`);
      
      // Log collection stats
      this.logCollectionStats('OpenInsider', processedCount, duration);
      
    } catch (error) {
      console.error('❌ [AUTO] OpenInsider collection failed:', error);
      
      // Don't stop the scheduler on failure, just log and continue
      console.log('🔄 Will retry on next scheduled run...');
    }
  }

  private async runMarketBeatCollection() {
    try {
      console.log('🔄 [AUTO] Starting MarketBeat supplemental collection...');
      const startTime = Date.now();
      
      const processedCount = await marketBeatCollector.collectLatestTrades(50); // Smaller batch for supplemental data
      
      const duration = Date.now() - startTime;
      console.log(`✅ [AUTO] MarketBeat collection completed in ${duration}ms`);
      console.log(`   📊 Processed: ${processedCount} new trades`);
      
      // Log collection stats
      this.logCollectionStats('MarketBeat', processedCount, duration);
      
    } catch (error) {
      console.error('❌ [AUTO] MarketBeat collection failed:', error);
      
      // Don't stop the scheduler on failure, just log and continue
      console.log('🔄 Will retry on next scheduled run...');
    }
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
      nextOpenInsiderRun: this.openInsiderInterval ? 'Every 30 minutes' : 'Not scheduled',
      nextMarketBeatRun: this.marketBeatInterval ? 'Every 2 hours' : 'Not scheduled',
    };
  }

  // Manual trigger methods for testing/admin use
  async manualOpenInsiderRun(limit: number = 100): Promise<number> {
    console.log(`🔧 [MANUAL] Running OpenInsider collection (limit: ${limit})...`);
    return await openInsiderCollector.collectLatestTrades(limit);
  }

  async manualMarketBeatRun(limit: number = 50): Promise<number> {
    console.log(`🔧 [MANUAL] Running MarketBeat collection (limit: ${limit})...`);
    return await marketBeatCollector.collectLatestTrades(limit);
  }
}

// Singleton instance
export const autoScheduler = new AutoScheduler();

// Auto-start the scheduler when the module is loaded
// This ensures continuous data collection as soon as the server starts
if (process.env.NODE_ENV !== 'test') {
  // Start scheduler after a short delay to allow other services to initialize
  setTimeout(() => {
    autoScheduler.start();
  }, 5000); // 5 second delay
}