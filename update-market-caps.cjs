#!/usr/bin/env node
// Quick script to update market caps for recent trades

const axios = require('axios');

async function updateMarketCaps() {
  console.log('🔄 Starting market cap update for recent trades...\n');

  try {
    // Get recent tickers from our API
    const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
      timeout: 30000
    });

    const recentTrades = response.data.recentActivity || [];
    const tickers = [...new Set(recentTrades.map(t => t.ticker).filter(Boolean))].slice(0, 50);

    console.log(`📊 Found ${tickers.length} unique tickers to update\n`);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      try {
        const stockData = await axios.get(`http://localhost:5000/api/stocks/${ticker}`, {
          timeout: 10000
        });

        if (stockData.data && stockData.data.marketCap) {
          console.log(`✅ [${i+1}/${tickers.length}] ${ticker}: $${(stockData.data.marketCap / 1e9).toFixed(2)}B market cap`);
          successCount++;
        } else {
          console.log(`⚠️  [${i+1}/${tickers.length}] ${ticker}: No market cap data`);
          failedCount++;
        }

        // Rate limit: 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ [${i+1}/${tickers.length}] ${ticker}: ${error.message}`);
        failedCount++;
      }
    }

    console.log(`\n✅ Update complete: ${successCount} success, ${failedCount} failed`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateMarketCaps();
