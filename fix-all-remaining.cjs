const axios = require('axios');

async function fixAllRemaining() {
  console.log('🔍 Checking ALL rankings for missing market caps...\n');

  const response = await axios.get('http://localhost:5000/api/rankings');
  const rankings = response.data.rankings;

  const missing = rankings.filter(r => !r.marketCap || r.marketCap === 0);

  console.log(`Found ${missing.length} stocks with missing/zero market cap\n`);

  if (missing.length === 0) {
    console.log('✅ All stocks have market cap!');
    return;
  }

  console.log('Missing tickers:', missing.map(r => r.ticker).join(', '));
  console.log('');

  let updated = 0;
  let stillFailed = [];

  for (let i = 0; i < missing.length; i++) {
    const ticker = missing[i].ticker;

    try {
      console.log(`[${i+1}/${missing.length}] Fetching ${ticker} from Polygon...`);

      const polygonResponse = await axios.get(
        `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=UbRK_c5MaL5ZlCe1FQGZpUY6LcZMzkcc`,
        { timeout: 10000 }
      );

      let marketCap = polygonResponse.data?.results?.market_cap;

      // Try Yahoo if Polygon fails
      if (!marketCap || marketCap === 0) {
        console.log(`  Polygon failed, trying Yahoo Finance...`);
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
        marketCap = result?.price?.marketCap?.raw || result?.summaryDetail?.marketCap?.raw;
      }

      if (marketCap && marketCap > 0) {
        console.log(`  ✅ Got $${(marketCap / 1e9).toFixed(2)}B - updating database...`);

        // Update via stock API to save to DB
        const updateResponse = await axios.get(`http://localhost:5000/api/stocks/${ticker}`);

        // If still 0, it might be cached, trigger another update
        if (!updateResponse.data.marketCap || updateResponse.data.marketCap === 0) {
          console.log(`  ⚠️  API still returned 0, will need manual DB update`);
          stillFailed.push({ ticker, marketCap });
        } else {
          console.log(`  ✅ ${ticker} updated successfully`);
          updated++;
        }
      } else {
        console.log(`  ❌ No market cap found for ${ticker}`);
        stillFailed.push({ ticker, marketCap: null });
      }

      // Rate limit: 12 seconds for Polygon
      if (i < missing.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000));
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      stillFailed.push({ ticker, marketCap: null });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${stillFailed.length}`);

  if (stillFailed.length > 0) {
    console.log(`\n⚠️  Manual DB update needed for:`);
    stillFailed.forEach(({ ticker, marketCap }) => {
      if (marketCap) {
        console.log(`   psql "$DATABASE_URL" -c "UPDATE stock_prices SET market_cap = ${marketCap} WHERE ticker = '${ticker}';"`);
      } else {
        console.log(`   ${ticker} - No market cap available from any source`);
      }
    });
  }
}

fixAllRemaining();
