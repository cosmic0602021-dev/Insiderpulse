const axios = require('axios');

async function testYahooMarketCap(ticker) {
  try {
    // Method 1: Try quote API
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
    const response = await axios.get(quoteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });

    if (response.data?.quoteResponse?.result?.[0]) {
      const quote = response.data.quoteResponse.result[0];
      console.log(`\n${ticker} - Quote API:`);
      console.log('Market Cap:', quote.marketCap || 'N/A');
      console.log('Shares Outstanding:', quote.sharesOutstanding || 'N/A');
      console.log('Regular Market Price:', quote.regularMarketPrice || 'N/A');

      if (quote.marketCap) {
        console.log(`✅ Market Cap available: $${(quote.marketCap / 1e9).toFixed(2)}B`);
        return true;
      }

      // Calculate if we have shares and price
      if (quote.sharesOutstanding && quote.regularMarketPrice) {
        const calculated = quote.sharesOutstanding * quote.regularMarketPrice;
        console.log(`✅ Calculated Market Cap: $${(calculated / 1e9).toFixed(2)}B`);
        return true;
      }
    }

    console.log('❌ No market cap data available');
    return false;

  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing Yahoo Finance Market Cap...\n');

  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMD', 'NVDA'];

  for (const ticker of tickers) {
    await testYahooMarketCap(ticker);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();
