// Quick script to update marketCap for tickers with recent trades
import { stockPriceService } from './server/stock-price-service';
import { storage } from './server/storage';

async function updateMarketCapForRecentTrades() {
  console.log('🚀 Starting marketCap update for recent trades...\n');

  try {
    // Get trades from last 30 days
    const trades = await storage.getInsiderTrades(2000, 0);
    console.log(`📊 Retrieved ${trades.length} trades\n`);

    // Count trades per ticker to prioritize
    const tickerCounts = new Map<string, number>();
    for (const trade of trades) {
      if (trade.ticker) {
        const ticker = trade.ticker.toUpperCase();
        tickerCounts.set(ticker, (tickerCounts.get(ticker) || 0) + 1);
      }
    }

    // Sort by trade count (most active first)
    const sortedTickers = Array.from(tickerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100); // Top 100 most active

    console.log(`🎯 Updating marketCap for top ${sortedTickers.length} most active tickers:\n`);

    let successCount = 0;
    let failedCount = 0;
    const failedTickers: string[] = [];

    for (let i = 0; i < sortedTickers.length; i++) {
      const [ticker, tradeCount] = sortedTickers[i];

      try {
        console.log(`\n[${i + 1}/${sortedTickers.length}] Fetching ${ticker} (${tradeCount} trades)...`);

        const priceData = await stockPriceService.getStockPrice(ticker);

        if (priceData && priceData.marketCap && priceData.marketCap > 0) {
          const stockPrice = {
            ticker: priceData.ticker,
            companyName: priceData.companyName,
            currentPrice: priceData.currentPrice.toString(),
            change: priceData.change.toString(),
            changePercent: priceData.changePercent.toString(),
            volume: priceData.volume,
            marketCap: priceData.marketCap,
          };

          await storage.upsertStockPrice(stockPrice);
          successCount++;
          console.log(`✅ Updated ${ticker}: Price=$${priceData.currentPrice}, MarketCap=$${(priceData.marketCap / 1e9).toFixed(2)}B`);
        } else {
          failedCount++;
          failedTickers.push(ticker);
          console.log(`⚠️ No marketCap data for ${ticker}`);
        }
      } catch (error) {
        failedCount++;
        failedTickers.push(ticker);
        console.error(`❌ Failed to update ${ticker}:`, (error as Error)?.message || error);
      }

      // Rate limiting: 12 seconds between requests (Polygon.io: 5 calls/min)
      if (i < sortedTickers.length - 1) {
        console.log('⏳ Waiting 12 seconds (rate limiting)...');
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
    }

    console.log('\n\n📈 MarketCap Update Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} tickers`);
    console.log(`   ❌ Failed to update: ${failedCount} tickers`);
    console.log(`   📊 Coverage: ${((successCount / sortedTickers.length) * 100).toFixed(1)}%`);

    if (failedTickers.length > 0 && failedTickers.length <= 20) {
      console.log(`\n   Failed tickers: ${failedTickers.join(', ')}`);
    }

    console.log('\n✅ MarketCap update completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating marketCap:', error);
    process.exit(1);
  }
}

updateMarketCapForRecentTrades();
