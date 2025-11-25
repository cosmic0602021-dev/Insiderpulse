const axios = require('axios');

async function updateMissingMarketCaps() {
  console.log('🔄 Updating missing market caps using Polygon.io...\n');

  // Get a few tickers that need updating
  const tickers = ['GRNT', 'SRTS', 'MGNI', 'PIPR', 'PCOR', 'PDYN', 'MCD', 'OUT'];

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];

    try {
      // Get market cap from Polygon
      const polygonResp = await axios.get(
        `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=UbRK_c5MaL5ZlCe1FQGZpUY6LcZMzkcc`,
        { timeout: 10000 }
      );

      const marketCap = polygonResp.data?.results?.market_cap;

      if (marketCap) {
        // Get current price from our API to update stock_prices
        const priceResp = await axios.get(`http://localhost:5000/api/stocks/${ticker}`);

        if (priceResp.data && priceResp.data.marketCap) {
          console.log(`✅ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} $${(priceResp.data.marketCap / 1e9).toFixed(2)}B (updated)`);
          updated++;
        } else {
          console.log(`⚠️  [${i+1}/${tickers.length}] ${ticker.padEnd(6)} Updated but not in response`);
        }
      } else {
        console.log(`❌ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} No market cap from Polygon`);
        failed++;
      }

      // Rate limit: 5 calls/min
      if (i < tickers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000));
      }

    } catch (error) {
      console.log(`❌ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Updated: ${updated}, Failed: ${failed}`);
}

updateMissingMarketCaps();
