import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeGoogleFinanceMarketCap(ticker: string): Promise<number | null> {
  try {
    // Try NASDAQ first
    let url = `https://www.google.com/finance/quote/${ticker}:NASDAQ`;
    let response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    let html = response.data;
    let $ = cheerio.load(html);

    // Find market cap div
    let marketCapText = $('div:contains("Market cap")').next().text();

    if (!marketCapText) {
      // Try NYSE
      url = `https://www.google.com/finance/quote/${ticker}:NYSE`;
      response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });
      html = response.data;
      $ = cheerio.load(html);
      marketCapText = $('div:contains("Market cap")').next().text();
    }

    if (marketCapText) {
      // Parse "$16.34B" or "$1.2T" format
      const match = marketCapText.match(/\$([0-9.]+)([BMT])/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];

        const multipliers: { [key: string]: number } = {
          'M': 1_000_000,
          'B': 1_000_000_000,
          'T': 1_000_000_000_000
        };

        return Math.round(value * multipliers[unit]);
      }
    }

    return null;
  } catch (error: any) {
    console.error(`Google Finance scraping failed for ${ticker}:`, error.message);
    return null;
  }
}

export async function scrapeYahooFinanceMarketCap(ticker: string): Promise<number | null> {
  try {
    const url = `https://finance.yahoo.com/quote/${ticker}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Yahoo Finance structure: find "Market Cap" label and its value
    const marketCapElement = $('td:contains("Market Cap")').next();
    const marketCapText = marketCapElement.text().trim();

    if (marketCapText) {
      // Parse "16.34B" format
      const match = marketCapText.match(/([0-9.]+)([BMT])/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];

        const multipliers: { [key: string]: number } = {
          'M': 1e6,
          'B': 1e9,
          'T': 1e12
        };
        return Math.round(value * multipliers[unit]);
      }
    }

    return null;
  } catch (error: any) {
    console.error(`Yahoo Finance scraping failed for ${ticker}:`, error.message);
    return null;
  }
}

export async function fetchCompaniesMarketCapAPI(ticker: string): Promise<number | null> {
  try {
    const url = `https://companiesmarketcap.com/api/company/${ticker}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (response.data && response.data.marketcap) {
      const marketCap = Math.round(response.data.marketcap);
      return marketCap;
    }

    return null;
  } catch (error: any) {
    console.error(`CompaniesMarketCap API failed for ${ticker}:`, error.message);
    return null;
  }
}
