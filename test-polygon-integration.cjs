const axios = require('axios');

const POLYGON_API_KEY = 'UbRK_c5MaL5ZlCe1FQGZpUY6LcZMzkcc';

async function testPolygonIntegration() {
  console.log('🧪 Testing Polygon.io integration...\n');

  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'GRNT', 'SRTS', 'AMD'];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    try {
      const response = await axios.get(
        `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`,
        { timeout: 10000 }
      );

      if (response.data?.results?.market_cap) {
        const marketCap = response.data.results.market_cap;
        console.log(`✅ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} $${(marketCap / 1e9).toFixed(2)}B`);
      } else {
        console.log(`⚠️  [${i+1}/${tickers.length}] ${ticker.padEnd(6)} No market cap data`);
      }

      // Rate limit: 5 calls/min = 12 seconds between calls
      if (i < tickers.length - 1) {
        console.log(`   ⏳ Waiting 12 seconds for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 12000));
      }

    } catch (error) {
      console.log(`❌ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} ${error.message}`);
    }
  }

  console.log('\n✅ Test complete!');
}

testPolygonIntegration();
