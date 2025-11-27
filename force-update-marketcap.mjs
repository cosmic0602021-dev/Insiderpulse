import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './shared/schema.ts';
import { stockPriceService } from './server/stock-price-service.ts';
import { storage } from './server/storage.ts';

const db = drizzle(process.env.DATABASE_URL, { schema });

async function forceUpdateMarketCap() {
  try {
    console.log('🔄 Starting forced marketCap update...');

    const trades = await storage.getInsiderTrades(2000, 0, false);
    const uniqueTickers = [...new Set(trades.map(t => t.ticker).filter(Boolean))];

    console.log(`📊 Found ${uniqueTickers.length} unique tickers to update`);

    let updated = 0, failed = 0, skipped = 0;

    for (const ticker of uniqueTickers) {
      try {
        console.log(`\n[${updated + failed + skipped + 1}/${uniqueTickers.length}] Processing ${ticker}...`);

        const priceData = await stockPriceService.getStockPrice(ticker);

        if (priceData && priceData.marketCap && priceData.marketCap > 0) {
          updated++;
          const marketCapB = (priceData.marketCap / 1e9).toFixed(2);
          console.log(`✅ ${ticker}: $${marketCapB}B (market cap: ${priceData.marketCap})`);
        } else {
          skipped++;
          console.log(`⚠️ ${ticker}: No market cap data available`);
        }

        // Rate limiting: 12 seconds between requests for Polygon.io free tier
        console.log(`   ⏱️ Waiting 12 seconds for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 12000));
      } catch (error) {
        failed++;
        console.error(`❌ ${ticker} failed:`, error.message);
      }
    }

    console.log(`\n📈 MarketCap update complete:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️ Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${uniqueTickers.length}`);

  } catch (error) {
    console.error('❌ Force MarketCap update failed:', error);
    process.exit(1);
  }
}

forceUpdateMarketCap().then(() => {
  console.log('\n✅ Update complete! Exiting...');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
