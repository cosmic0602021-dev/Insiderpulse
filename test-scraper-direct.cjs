// Direct test of stock price service for ADVM
const http = require('http');

async function testStockPriceService() {
  console.log('🧪 Testing Stock Price Service for ADVM...\n');

  return new Promise((resolve, reject) => {
    // Call the API endpoint that should trigger marketCap fetching
    http.get('http://localhost:5000/api/stocks/ADVM', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const stock = JSON.parse(data);
          console.log('📊 API Response for /api/stocks/ADVM:');
          console.log('   Ticker:', stock.ticker);
          console.log('   Company:', stock.companyName);
          console.log('   Current Price:', stock.currentPrice);
          console.log('   Market Cap:', stock.marketCap);

          if (stock.marketCap && stock.marketCap > 0) {
            console.log(`   Market Cap (formatted): $${(stock.marketCap / 1e9).toFixed(2)}B`);
            console.log('\n✅ SUCCESS: Web scraper fetched marketCap!');
          } else {
            console.log('\n❌ FAILED: MarketCap is still null/0');
            console.log('   This means all 5 fallbacks failed (Yahoo API + Web Scrapers)');
          }

          resolve();
        } catch (e) {
          console.error('❌ Error parsing response:', e.message);
          console.log('Raw response:', data.substring(0, 500));
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error('❌ HTTP Error:', e.message);
      reject(e);
    });
  });
}

testStockPriceService().catch(console.error);
