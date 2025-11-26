const axios = require('axios');

async function testWebScraping() {
  console.log('🧪 Testing web scraping for failed tickers...\n');

  // Test a few tickers that failed before
  const testTickers = ['AMD', 'UBER', 'SNAP', 'FAST', 'DUK'];

  for (const ticker of testTickers) {
    try {
      console.log(`Testing ${ticker}...`);
      const response = await axios.get(`http://localhost:5000/api/stocks/${ticker}`, {
        timeout: 30000 // 30 second timeout for scraping
      });

      if (response.data && response.data.marketCap && response.data.marketCap > 0) {
        console.log(`✅ ${ticker.padEnd(6)} $${(response.data.marketCap / 1e9).toFixed(2)}B`);
      } else {
        console.log(`⚠️  ${ticker.padEnd(6)} Still no market cap`);
      }

      // Wait 3 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.log(`❌ ${ticker.padEnd(6)} Error: ${error.message}`);
    }
  }

  console.log('\n✅ Test complete!');
}

testWebScraping().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
