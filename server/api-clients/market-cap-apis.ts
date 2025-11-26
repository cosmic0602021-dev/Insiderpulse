import axios from 'axios';

// FMP API (Financial Modeling Prep) - 250 calls/day
export async function fetchMarketCapFromFMP(ticker: string): Promise<number | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/market-capitalization/${ticker}?apiKey=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data[0] && response.data[0].marketCap) {
      return Math.round(response.data[0].marketCap);
    }
    return null;
  } catch (error: any) {
    console.error(`FMP API failed for ${ticker}:`, error.message);
    return null;
  }
}

// Finnhub API - 60 calls/min, unlimited daily
export async function fetchMarketCapFromFinnhub(ticker: string): Promise<number | null> {
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
  } catch (error: any) {
    console.error(`Finnhub API failed for ${ticker}:`, error.message);
    return null;
  }
}

// Alpha Vantage API - 25 calls/day
export async function fetchMarketCapFromAlphaVantage(ticker: string): Promise<number | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.MarketCapitalization) {
      return Math.round(parseFloat(response.data.MarketCapitalization));
    }
    return null;
  } catch (error: any) {
    console.error(`Alpha Vantage API failed for ${ticker}:`, error.message);
    return null;
  }
}
