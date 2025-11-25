const axios = require('axios');

async function updateMissingTickers() {
  const tickers = ['PTON', 'NVT', 'QBTS', 'GLRE'];
  const results = [];

  console.log('🔄 Updating missing tickers market caps...\n');

  for (const ticker of tickers) {
    try {
      // Try Yahoo Finance first
      const yahooResponse = await axios.get(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      const result = yahooResponse.data?.quoteSummary?.result?.[0];
      const marketCap = result?.price?.marketCap?.raw || result?.summaryDetail?.marketCap?.raw;

      if (marketCap && marketCap > 0) {
        results.push({ ticker, marketCap, success: true });
        console.log(`✅ ${ticker.padEnd(6)} $${(marketCap / 1e9).toFixed(2)}B`);
      } else {
        results.push({ ticker, marketCap: null, success: false });
        console.log(`❌ ${ticker.padEnd(6)} No market cap from Yahoo`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      results.push({ ticker, marketCap: null, success: false });
      console.log(`❌ ${ticker.padEnd(6)} Error: ${error.message}`);
    }
  }

  console.log('\n📊 SQL Update Commands:\n');
  results.forEach(({ ticker, marketCap, success }) => {
    if (success && marketCap) {
      console.log(`UPDATE stock_prices SET market_cap = ${marketCap} WHERE ticker = '${ticker}';`);
    }
  });

  return results;
}

updateMissingTickers();
