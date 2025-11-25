const axios = require('axios');

async function fixMissingMarketCaps() {
  console.log('🔄 Fixing missing market caps...\n');

  // Tickers that failed with Polygon (from logs)
  const tickers = ['MGNI', 'PAL', 'BH', 'RPD', 'PIPR', 'PCOR', 'PDYN'];

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];

    try {
      console.log(`[${i+1}/${tickers.length}] Fetching ${ticker}...`);

      // Trigger stock price update through our API (which now has Yahoo fallback)
      const response = await axios.get(`http://localhost:5000/api/stocks/${ticker}`);

      if (response.data && response.data.marketCap && response.data.marketCap > 0) {
        console.log(`✅ ${ticker.padEnd(6)} $${(response.data.marketCap / 1e9).toFixed(2)}B`);
        updated++;
      } else {
        console.log(`❌ ${ticker.padEnd(6)} Still no market cap`);
        failed++;
      }

      // Rate limit: Wait 2 seconds between requests
      if (i < tickers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`❌ ${ticker.padEnd(6)} ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Updated: ${updated}, Failed: ${failed}`);
}

fixMissingMarketCaps();
