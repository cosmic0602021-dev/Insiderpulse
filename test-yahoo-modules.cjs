const axios = require('axios');

async function getMarketCap(ticker) {
  try {
    // Use the same endpoint as yfinance library
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const result = response.data?.quoteSummary?.result?.[0];
    if (!result) {
      console.log(`❌ ${ticker}: No data`);
      return null;
    }

    const marketCap = result.price?.marketCap?.raw || result.summaryDetail?.marketCap?.raw;

    if (marketCap) {
      console.log(`✅ ${ticker}: $${(marketCap / 1e9).toFixed(2)}B (${marketCap})`);
      return marketCap;
    } else {
      console.log(`❌ ${ticker}: No market cap in response`);
      return null;
    }

  } catch (error) {
    if (error.response) {
      console.log(`❌ ${ticker}: HTTP ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.log(`❌ ${ticker}: ${error.message}`);
    }
    return null;
  }
}

async function main() {
  console.log('Testing Yahoo Finance quoteSummary API...\n');

  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMD', 'TSLA', 'NVDA', 'GRNT', 'SRTS'];

  for (const ticker of tickers) {
    await getMarketCap(ticker);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();
