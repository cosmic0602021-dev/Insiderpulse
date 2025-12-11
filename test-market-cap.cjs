// Test market cap data in API response
const http = require('http');

function testAPI(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🧪 Testing Market Cap Data...\n');

  try {
    // Test /api/trades
    console.log('1. Testing /api/trades endpoint...');
    const tradesData = await testAPI('/api/trades');

    // Check if response is an object with a trades array
    let trades = Array.isArray(tradesData) ? tradesData : tradesData.trades || [];

    if (trades.length === 0) {
      console.log('❌ No trades found in response');
      console.log('Response structure:', Object.keys(tradesData));
      return;
    }

    console.log(`✅ Found ${trades.length} trades\n`);

    // Check first 5 trades for marketCap
    const sampleSize = Math.min(5, trades.length);
    console.log(`2. Checking first ${sampleSize} trades for marketCap data:\n`);

    let withMarketCap = 0;
    let withoutMarketCap = 0;

    for (let i = 0; i < sampleSize; i++) {
      const trade = trades[i];
      const hasMarketCap = trade.marketCap && trade.marketCap > 0;

      if (hasMarketCap) {
        const ratio = ((trade.value || 0) / trade.marketCap) * 100;
        console.log(`✅ ${trade.ticker}: Market Cap = $${(trade.marketCap / 1e9).toFixed(2)}B, Ratio = ${ratio.toFixed(4)}%`);
        withMarketCap++;
      } else {
        console.log(`❌ ${trade.ticker}: No market cap data (marketCap = ${trade.marketCap})`);
        withoutMarketCap++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   With Market Cap: ${withMarketCap}/${sampleSize}`);
    console.log(`   Without Market Cap: ${withoutMarketCap}/${sampleSize}`);

    if (withoutMarketCap > 0) {
      console.log('\n⚠️  Some trades are missing market cap data.');
      console.log('   This is normal for recently added trades or delisted stocks.');
      console.log('   The batch processing should fetch this data on the next API call.');
    } else {
      console.log('\n🎉 All checked trades have market cap data!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
