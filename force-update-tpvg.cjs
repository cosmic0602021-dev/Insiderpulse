const axios = require('axios');

async function forceUpdateTPVG() {
  console.log('🔄 Force updating TPVG market cap...\n');

  try {
    // Get TPVG data from Polygon API directly
    const polygonKey = 'UbRK_c5MaL5ZlCe1FQGZpUY6LcZMzkcc';
    const polygonResponse = await axios.get(
      `https://api.polygon.io/v3/reference/tickers/TPVG?apiKey=${polygonKey}`,
      { timeout: 10000 }
    );

    const marketCap = polygonResponse.data?.results?.market_cap;

    if (!marketCap) {
      console.log('❌ Could not get market cap from Polygon');

      // Try Yahoo Finance
      console.log('🔄 Trying Yahoo Finance...');
      const yahooResponse = await axios.get(
        'https://query2.finance.yahoo.com/v10/finance/quoteSummary/TPVG?modules=price,summaryDetail',
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      const result = yahooResponse.data?.quoteSummary?.result?.[0];
      const yahooMarketCap = result?.price?.marketCap?.raw || result?.summaryDetail?.marketCap?.raw;

      if (yahooMarketCap) {
        console.log(`✅ Got $${(yahooMarketCap / 1e9).toFixed(2)}B from Yahoo Finance`);

        // Update DB directly via API (force cache clear)
        const updateResponse = await axios.get(`http://localhost:5000/api/stocks/TPVG?_nocache=${Date.now()}`);
        console.log('API Response:', updateResponse.data);
      } else {
        console.log('❌ Yahoo Finance also failed');
        return;
      }
    } else {
      console.log(`✅ Got $${(marketCap / 1e9).toFixed(2)}B from Polygon`);

      // Trigger API update with cache bypass
      const updateResponse = await axios.get(`http://localhost:5000/api/stocks/TPVG?_nocache=${Date.now()}`);
      console.log('✅ Market Cap:', updateResponse.data.marketCap ? `$${(updateResponse.data.marketCap / 1e9).toFixed(2)}B` : 'STILL 0');
    }

    // Verify in rankings
    console.log('\n🔍 Checking rankings...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const rankingsResponse = await axios.get(`http://localhost:5000/api/rankings?_nocache=${Date.now()}`);
    const tpvg = rankingsResponse.data.rankings.find(r => r.ticker === 'TPVG');

    if (tpvg) {
      console.log('TPVG in rankings:', {
        ticker: tpvg.ticker,
        netBuying: `$${(tpvg.netBuying / 1000).toFixed(0)}K`,
        marketCap: tpvg.marketCap ? `$${(tpvg.marketCap / 1e9).toFixed(2)}B` : '❌ STILL MISSING',
        ratio: tpvg.marketCap ? `${((tpvg.netBuying / tpvg.marketCap) * 100).toFixed(3)}%` : 'N/A'
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

forceUpdateTPVG();
