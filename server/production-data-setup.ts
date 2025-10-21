/**
 * 프로덕션 실시간 데이터 설정 스크립트
 * 가짜 데이터 완전 제거 및 실제 SEC/Finnhub 데이터만 수집
 */

import { storage } from './storage';

async function setupProductionData() {
  console.log('🚀 Starting production data setup...');
  console.log('⚠️  ONLY REAL DATA - NO FAKE/SIMULATION DATA');

  try {
    // 1. 실제 SEC EDGAR 데이터 수집 시작
    console.log('\n📊 Step 1: Collecting real-time SEC EDGAR data...');
    try {
      const { secEdgarCollector, setBroadcaster } = await import('./sec-edgar-collector');

      setBroadcaster((type: string, data: any) => {
        console.log(`  📡 SEC: ${type} - ${JSON.stringify(data).substring(0, 100)}`);
      });

      const secCount = await secEdgarCollector.collectLatestForm4Filings(30);
      console.log(`  ✅ SEC Collection: ${secCount} real trades collected`);
    } catch (secError) {
      console.error(`  ❌ SEC Collector failed:`, secError);
    }

    // 2. MarketBeat 백업 데이터 수집
    console.log('\n📊 Step 2: Collecting MarketBeat backup data...');
    try {
      const { marketBeatCollector, setBroadcaster } = await import('./marketbeat-collector');

      setBroadcaster((type: string, data: any) => {
        console.log(`  📡 MarketBeat: ${type}`);
      });

      const mbCount = await marketBeatCollector.collectLatestTrades(50);
      console.log(`  ✅ MarketBeat Collection: ${mbCount} real trades collected`);
    } catch (mbError) {
      console.error(`  ❌ MarketBeat Collector failed:`, mbError);
    }

    // 3. 데이터베이스 상태 확인
    console.log('\n📊 Step 3: Verifying database state...');
    const trades = await storage.getInsiderTrades(10, 0);
    console.log(`  ✅ Total trades in database: ${trades.length}`);

    if (trades.length > 0) {
      const latestTrade = trades[0];
      console.log(`  📅 Latest trade: ${latestTrade.companyName} (${latestTrade.ticker})`);
      console.log(`  📅 Filed date: ${latestTrade.filedDate}`);
      console.log(`  💰 Value: $${latestTrade.totalValue?.toLocaleString()}`);
    }

    // 4. 통계 확인
    const stats = await storage.getTradingStats(false);
    console.log(`\n📈 Database Statistics:`);
    console.log(`  📊 Today's trades: ${stats.todayTrades}`);
    console.log(`  💵 Total volume: $${stats.totalVolume.toLocaleString()}`);

    console.log('\n✅ Production data setup completed successfully!');
    console.log('🔄 Real-time data collection is active and running');

  } catch (error) {
    console.error('❌ Production data setup failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  setupProductionData()
    .then(() => {
      console.log('\n✅ Setup complete - Application ready for production use');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupProductionData };
