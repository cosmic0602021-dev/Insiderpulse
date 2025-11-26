const { Client } = require('pg');
const axios = require('axios');

// Load .env file
require('dotenv').config();

// API functions - ONLY Finnhub and Alpha Vantage (FMP removed)
async function fetchMarketCapFromFinnhub(ticker) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.metric && response.data.metric.marketCapitalization) {
      // Finnhub returns market cap in millions
      return Math.round(response.data.metric.marketCapitalization * 1_000_000);
    }
    return null;
  } catch (error) {
    console.error(`Finnhub API failed for ${ticker}:`, error.message);
    return null;
  }
}

async function fetchMarketCapFromAlphaVantage(ticker) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.MarketCapitalization) {
      return Math.round(parseFloat(response.data.MarketCapitalization));
    }
    return null;
  } catch (error) {
    console.error(`Alpha Vantage API failed for ${ticker}:`, error.message);
    return null;
  }
}

async function testMarketCapUpdate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('🧪 Testing market cap update with Finnhub + Alpha Vantage APIs\n');

  // Get 30 random missing tickers
  const result = await client.query(`
    SELECT ticker
    FROM stock_prices
    WHERE (market_cap = 0 OR market_cap IS NULL)
      AND ticker IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 30
  `);

  const tickers = result.rows.map(r => r.ticker);
  console.log(`📊 Testing ${tickers.length} tickers\n`);

  let stats = {
    finnhub: 0,
    alphaVantage: 0,
    failed: 0
  };

  for (const ticker of tickers) {
    console.log(`\n🔍 ${ticker}:`);
    let marketCap = null;
    let source = null;

    // Step 1: Try Finnhub API
    marketCap = await fetchMarketCapFromFinnhub(ticker);
    if (marketCap && marketCap > 0) {
      source = 'Finnhub';
      stats.finnhub++;
    }

    // Step 2: Try Alpha Vantage API (if Finnhub failed)
    if (!marketCap || marketCap === 0) {
      await new Promise(r => setTimeout(r, 3000)); // Rate limit: 25/day, be conservative
      marketCap = await fetchMarketCapFromAlphaVantage(ticker);
      if (marketCap && marketCap > 0) {
        source = 'Alpha Vantage';
        stats.alphaVantage++;
      }
    }

    if (marketCap && marketCap > 0) {
      console.log(`  ✅ ${source}: $${(marketCap / 1e9).toFixed(2)}B`);

      // Update database
      await client.query(
        'UPDATE stock_prices SET market_cap = $1, last_updated = NOW() WHERE ticker = $2',
        [marketCap, ticker]
      );
    } else {
      console.log(`  ❌ Both APIs failed`);
      stats.failed++;
    }

    // Rate limit for Finnhub: 60/min = 1 per second
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 API Performance Summary:');
  console.log('='.repeat(60));
  console.log(`Finnhub:       ${stats.finnhub} / ${tickers.length} (${(100 * stats.finnhub / tickers.length).toFixed(1)}%)`);
  console.log(`Alpha Vantage: ${stats.alphaVantage} / ${tickers.length} (${(100 * stats.alphaVantage / tickers.length).toFixed(1)}%)`);
  console.log(`Failed:        ${stats.failed} / ${tickers.length} (${(100 * stats.failed / tickers.length).toFixed(1)}%)`);
  console.log('─'.repeat(60));
  console.log(`Total Success: ${tickers.length - stats.failed} / ${tickers.length} (${(100 * (tickers.length - stats.failed) / tickers.length).toFixed(1)}%)`);
  console.log('='.repeat(60));

  await client.end();
}

testMarketCapUpdate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
