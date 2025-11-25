import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape market cap from companiesmarketcap.com (no API key required!)
 * Simple and reliable - parses HTML to get market cap data
 */
export class MarketCapScraper {
  private cache = new Map<string, { marketCap: number; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get market cap for a ticker symbol
   * Returns market cap in dollars (e.g., 4139000000000 for $4.139T)
   */
  async getMarketCap(ticker: string): Promise<number | null> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = this.cache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.marketCap;
    }

    try {
      // Try Yahoo Finance first - simpler HTML structure
      const url = `https://finance.yahoo.com/quote/${upperTicker}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Find Market Cap in the key statistics
      let marketCap: number | null = null;

      // Method 1: Look for "Market Cap" label and get the next value
      $('td').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text === 'Market Cap (intraday)' || text === 'Market Cap') {
          const value = $(elem).next('td').text().trim();
          marketCap = this.parseMarketCapString(value);
          return false; // break
        }
      });

      // Method 2: Search in JSON data embedded in the page
      if (!marketCap) {
        const scriptTags = $('script').toArray();
        for (const script of scriptTags) {
          const content = $(script).html() || '';
          if (content.includes('marketCap')) {
            const match = content.match(/"marketCap":\s*{\s*"raw":\s*(\d+)/);
            if (match) {
              marketCap = parseInt(match[1], 10);
              break;
            }
          }
        }
      }

      if (marketCap && marketCap > 0) {
        this.cache.set(upperTicker, { marketCap, timestamp: Date.now() });
        console.log(`✅ Got market cap for ${upperTicker}: $${(marketCap / 1e9).toFixed(2)}B`);
        return marketCap;
      }

      console.warn(`⚠️ No market cap found for ${upperTicker}`);
      return null;

    } catch (error) {
      console.error(`❌ Failed to scrape market cap for ${upperTicker}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Parse market cap string like "4.139T", "500.5B", "1.2M"
   * Returns value in dollars
   */
  private parseMarketCapString(value: string): number | null {
    if (!value) return null;

    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim();

    // Extract number and multiplier (T, B, M, K)
    const match = cleaned.match(/^([\d.]+)([TBMK])?$/i);
    if (!match) return null;

    const num = parseFloat(match[1]);
    const multiplier = match[2]?.toUpperCase();

    let result = num;
    switch (multiplier) {
      case 'T': result = num * 1e12; break;
      case 'B': result = num * 1e9; break;
      case 'M': result = num * 1e6; break;
      case 'K': result = num * 1e3; break;
    }

    return Math.round(result);
  }

  /**
   * Batch get market caps for multiple tickers
   */
  async getMarketCaps(tickers: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    for (const ticker of tickers) {
      const marketCap = await this.getMarketCap(ticker);
      if (marketCap) {
        results.set(ticker.toUpperCase(), marketCap);
      }

      // Rate limiting: 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }
}

export const marketCapScraper = new MarketCapScraper();
