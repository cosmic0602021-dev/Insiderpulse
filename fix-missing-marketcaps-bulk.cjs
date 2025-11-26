const axios = require('axios');

async function fixMissingMarketCapsBulk() {
  console.log('🔍 Finding all trades with missing market cap...\n');

  // Get all trades
  const response = await axios.get('http://localhost:5000/api/trades?limit=500');
  const trades = response.data.trades;

  // Find unique tickers with missing market cap
  const missingTickers = [...new Set(
    trades
      .filter(t => !t.marketCap || t.marketCap === 0)
      .map(t => t.ticker)
      .filter(Boolean)
  )];

  console.log(`⚠️  Found ${missingTickers.length} unique tickers with missing market cap\n`);

  if (missingTickers.length === 0) {
    console.log('✅ All trades have market cap!');
    return;
  }

  let updated = 0;
  let failed = 0;
  const failedTickers = [];

  for (let i = 0; i < missingTickers.length; i++) {
    const ticker = missingTickers[i];

    try {
      console.log(`[${i+1}/${missingTickers.length}] Fetching ${ticker}...`);

      // Trigger stock price update (which fetches market cap)
      const response = await axios.get(`http://localhost:5000/api/stocks/${ticker}`, {
        timeout: 15000
      });

      if (response.data && response.data.marketCap && response.data.marketCap > 0) {
        console.log(`✅ ${ticker.padEnd(6)} $${(response.data.marketCap / 1e9).toFixed(2)}B`);
        updated++;
      } else {
        console.log(`⚠️  ${ticker.padEnd(6)} No market cap available`);
        failed++;
        failedTickers.push(ticker);
      }

      // Wait 3 seconds between requests to avoid rate limits
      if (i < missingTickers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.log(`❌ ${ticker.padEnd(6)} ${error.message}`);
      failed++;
      failedTickers.push(ticker);
    }
  }

  console.log(`\n📊 Final Results:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failedTickers.length > 0) {
    console.log(`\n⚠️  Failed tickers (${failedTickers.length}): ${failedTickers.join(', ')}`);
  }

  // Verify
  console.log('\n🔍 Verifying...');
  const verifyResponse = await axios.get('http://localhost:5000/api/trades?limit=100');
  const stillMissing = verifyResponse.data.trades.filter(t => !t.marketCap || t.marketCap === 0);
  const uniqueStillMissing = [...new Set(stillMissing.map(t => t.ticker))].filter(Boolean);

  if (uniqueStillMissing.length === 0) {
    console.log('✅ SUCCESS! All trades now have market cap!');
  } else {
    console.log(`⚠️  Still ${uniqueStillMissing.length} tickers without market cap in latest 100 trades`);
  }
}

fixMissingMarketCapsBulk().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
