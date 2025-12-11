const http = require('http');

async function testADVM() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/trades?limit=20', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const trades = Array.isArray(result) ? result : (result.trades || []);

          console.log(`📊 Total trades received: ${trades.length}`);

          const advm = trades.find(t => t.ticker === 'ADVM');
          if (advm) {
            console.log('\n✅ ADVM Trade Found:');
            console.log('   Ticker:', advm.ticker);
            console.log('   MarketCap:', advm.marketCap);
            console.log('   Value:', advm.value);

            if (advm.marketCap && advm.marketCap > 0) {
              const ratio = (advm.value / advm.marketCap) * 100;
              console.log('   시총대비:', ratio.toFixed(6) + '%');
              console.log('\n🎉 SUCCESS: MarketCap is populated with real data!');
            } else {
              console.log('\n⚠️  MarketCap is still null/0 - web scraper may need more time');
            }
          } else {
            console.log('\n❌ ADVM not found in first 20 trades');
            console.log('Available tickers:', trades.slice(0, 5).map(t => t.ticker).join(', '));
          }

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

testADVM().catch(console.error);
