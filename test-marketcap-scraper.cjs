const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMarketCap(ticker) {
  try {
    const url = `https://finance.yahoo.com/quote/${ticker}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Search in JSON data embedded in the page
    const scriptTags = $('script').toArray();
    for (const script of scriptTags) {
      const content = $(script).html() || '';
      if (content.includes('"marketCap"')) {
        const match = content.match(/"marketCap":\s*\{\s*"raw":\s*(\d+)/);
        if (match) {
          const marketCap = parseInt(match[1], 10);
          console.log(`✅ ${ticker}: $${(marketCap / 1e9).toFixed(2)}B`);
          return marketCap;
        }
      }
    }

    console.log(`❌ ${ticker}: No market cap found`);
    return 0;

  } catch (error) {
    console.log(`❌ ${ticker}: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('Testing Yahoo Finance market cap scraper...\n');

  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMD', 'TSLA', 'GRNT'];

  for (const ticker of tickers) {
    await scrapeMarketCap(ticker);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();
