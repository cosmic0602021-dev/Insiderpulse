const axios = require('axios');
const fs = require('fs');

async function fixAllMarketCaps() {
  console.log('🔍 Finding all stocks with missing market cap...\n');

  // Get rankings
  const response = await axios.get('http://localhost:5000/api/rankings');
  const rankings = response.data.rankings;

  // Find stocks with missing or 0 market cap
  const missing = rankings.filter(r => !r.marketCap || r.marketCap === 0);

  console.log(`⚠️  Found ${missing.length} stocks with missing market cap:`);
  console.log(missing.map((r, i) => `  ${i+1}. ${r.ticker}`).join('\n'));
  console.log('');

  if (missing.length === 0) {
    console.log('✅ All stocks have market cap!');
    return;
  }

  let updated = 0;
  let failed = 0;
  const failedTickers = [];

  for (let i = 0; i < missing.length; i++) {
    const ticker = missing[i].ticker;

    try {
      console.log(`[${i+1}/${missing.length}] Updating ${ticker}...`);

      // Trigger stock price update
      const response = await axios.get(`http://localhost:5000/api/stocks/${ticker}`);

      if (response.data && response.data.marketCap && response.data.marketCap > 0) {
        console.log(`✅ ${ticker.padEnd(6)} $${(response.data.marketCap / 1e9).toFixed(2)}B`);
        updated++;
      } else {
        console.log(`❌ ${ticker.padEnd(6)} Still no market cap after update`);
        failed++;
        failedTickers.push(ticker);
      }

      // Wait 2 seconds between requests
      if (i < missing.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`❌ ${ticker.padEnd(6)} ${error.message}`);
      failed++;
      failedTickers.push(ticker);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failedTickers.length > 0) {
    console.log(`\n⚠️  Failed tickers: ${failedTickers.join(', ')}`);
  }

  // Verify by checking rankings again
  console.log('\n🔍 Verifying rankings...');
  const verifyResponse = await axios.get('http://localhost:5000/api/rankings');
  const stillMissing = verifyResponse.data.rankings.filter(r => !r.marketCap || r.marketCap === 0);

  if (stillMissing.length === 0) {
    console.log('✅ SUCCESS! All rankings now have market cap!');
  } else {
    console.log(`⚠️  Still ${stillMissing.length} stocks without market cap:`);
    stillMissing.forEach(r => {
      console.log(`   - ${r.ticker} (netBuying: $${(r.netBuying/1000).toFixed(0)}K)`);
    });
  }
}

fixAllMarketCaps().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
