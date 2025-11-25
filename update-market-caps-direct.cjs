#!/usr/bin/env node
const axios = require('axios');

// List of tickers from recent trades
const tickers = [
  'ABR', 'ACHR', 'ACVA', 'ADPT', 'ADUS', 'AEBI', 'AEE', 'AEIS', 'AEVA', 'AFCG',
  'AFL', 'AGYS', 'AII', 'AISP', 'ALL', 'ALMS', 'AMAT', 'AMD', 'AMGN', 'AMH',
  'AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA', 'NVDA', 'AMZN'
];

async function updateMarketCaps() {
  console.log(`🔄 Updating market caps for ${tickers.length} tickers...\n`);

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    try {
      const response = await axios.get(`http://localhost:5000/api/stocks/${ticker}`, {
        timeout: 10000
      });

      if (response.data && response.data.marketCap) {
        const marketCapB = (response.data.marketCap / 1e9).toFixed(2);
        console.log(`✅ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} $${marketCapB}B`);
        successCount++;
      } else {
        console.log(`⚠️  [${i+1}/${tickers.length}] ${ticker.padEnd(6)} No market cap`);
        failedCount++;
      }

      // Rate limit: 150ms between requests
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.log(`❌ [${i+1}/${tickers.length}] ${ticker.padEnd(6)} ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n✅ Complete: ${successCount} success, ${failedCount} failed`);
}

updateMarketCaps();
