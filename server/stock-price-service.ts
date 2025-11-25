import axios from 'axios';
import { storage } from './storage';
import type { InsertStockPrice, InsertStockPriceHistory } from '@shared/schema';
import { shouldUpdateStockPrices } from './utils/market-hours';

export class StockPriceService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours - Cost optimization (was 2 hours)

  // Company name to ticker mapping for common companies
  private readonly companyToTicker: { [key: string]: string } = {
    'APPLE': 'AAPL',
    'APPLE INC': 'AAPL',
    'MICROSOFT': 'MSFT',
    'MICROSOFT CORP': 'MSFT',
    'MICROSOFT CORPORATION': 'MSFT',
    'NVIDIA': 'NVDA',
    'NVIDIA CORP': 'NVDA',
    'NVIDIA CORPORATION': 'NVDA',
    'TESLA': 'TSLA',
    'TESLA INC': 'TSLA',
    'TESLA MOTORS': 'TSLA',
    'AMAZON': 'AMZN',
    'AMAZON COM': 'AMZN',
    'AMAZON.COM': 'AMZN',
    'ALPHABET': 'GOOGL',
    'GOOGLE': 'GOOGL',
    'META': 'META',
    'META PLATFORMS': 'META',
    'FACEBOOK': 'META',
    'IMPINJ': 'PI',
    'IMPINJ INC': 'PI',
    'ESSENT GROUP': 'ESNT',
    'ESSENT GROUP LTD': 'ESNT',
    'MP MATERIALS': 'MP',
    'MP MATERIALS CORP': 'MP',
    'DURECT': 'DRRX',
    'DURECT CORP': 'DRRX',
    'CORMEDIX': 'CRMD',
    'CORMEDIX INC': 'CRMD',
    'JOHNSON & JOHNSON': 'JNJ',
    'PFIZER': 'PFE',
    'JPMORGAN': 'JPM',
    'JP MORGAN': 'JPM',
    'JPMORGAN CHASE': 'JPM',
    'BANK OF AMERICA': 'BAC',
    'WELLS FARGO': 'WFC',
    'GOLDMAN SACHS': 'GS',
    'F&G ANNUITIES': 'FG',
    'F&G ANNUITIES & LIFE': 'FG',
    'F&G LIFE': 'FG',
    'F&G': 'FG',
  };

  async getStockPrice(ticker: string): Promise<any> {
    const upperTicker = ticker.toUpperCase();
    const cached = this.cache.get(upperTicker);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Use Yahoo Finance unofficial API
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${upperTicker}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error('No data found');
      }

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const currentPrice = meta.regularMarketPrice || quote?.close?.[quote.close.length - 1];
      const previousClose = meta.previousClose;

      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      // Get market cap using Polygon.io (5 calls/min, unlimited per day!)
      let marketCap = meta.marketCap || 0;

      // Use Polygon.io for missing data - much better than Finnhub (unlimited daily)
      if (!marketCap || marketCap === 0) {
        try {
          const polygonKey = process.env.POLYGON_API_KEY;
          if (polygonKey) {
            const polygonResponse = await axios.get(
              `https://api.polygon.io/v3/reference/tickers/${upperTicker}?apiKey=${polygonKey}`,
              { timeout: 10000 }
            );
            if (polygonResponse.data?.results?.market_cap) {
              // Polygon returns market cap in dollars (exact value)
              marketCap = Math.round(polygonResponse.data.results.market_cap);
              console.log(`✅ Got market cap from Polygon for ${upperTicker}: $${(marketCap / 1e9).toFixed(2)}B`);
            }
          }
        } catch (polygonError) {
          console.warn(`Polygon API failed for ${upperTicker}, trying Yahoo Finance fallback`);
        }
      }

      // Fallback to Yahoo Finance quoteSummary API if still no market cap
      if (!marketCap || marketCap === 0) {
        try {
          const yahooResponse = await axios.get(
            `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${upperTicker}?modules=price,summaryDetail`,
            {
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );

          const result = yahooResponse.data?.quoteSummary?.result?.[0];
          if (result) {
            const yahooMarketCap = result.price?.marketCap?.raw || result.summaryDetail?.marketCap?.raw;
            if (yahooMarketCap && yahooMarketCap > 0) {
              marketCap = Math.round(yahooMarketCap);
              console.log(`✅ Got market cap from Yahoo Finance for ${upperTicker}: $${(marketCap / 1e9).toFixed(2)}B`);
            }
          }
        } catch (yahooError) {
          console.warn(`Yahoo Finance also failed for ${upperTicker}, market cap will be 0`);
        }
      }

      const priceData = {
        ticker: upperTicker,
        companyName: meta.longName || meta.shortName || upperTicker,
        currentPrice: currentPrice || 0,
        change: change || 0,
        changePercent: changePercent || 0,
        volume: meta.regularMarketVolume || 0,
        marketCap: marketCap,
      };

      this.cache.set(upperTicker, { data: priceData, timestamp: Date.now() });
      return priceData;

    } catch (error) {
      console.error(`Failed to fetch stock price for ${upperTicker}:`, error);

      // Return null instead of mock data - only use real data
      return null;
    }
  }

  async getStockPriceByCompanyName(companyName: string): Promise<any> {
    const ticker = this.extractTickerFromCompanyName(companyName);
    if (!ticker) {
      console.log(`No ticker found for company: ${companyName}`);
      return null;
    }

    return this.getStockPrice(ticker);
  }

  extractTickerFromCompanyName(companyName: string): string | null {
    // Clean up company name
    let cleanName = companyName.toUpperCase()
      .replace(/^4\s*-\s*/, '') // Remove "4 - " prefix
      .replace(/\s*(INC|CORP|CORPORATION|LTD|LLC|CO|COMPANY)\.?\s*$/i, '') // Remove corporate suffixes
      .trim();

    // Check exact match first
    if (this.companyToTicker[cleanName]) {
      return this.companyToTicker[cleanName];
    }

    // Check partial matches
    for (const [key, ticker] of Object.entries(this.companyToTicker)) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return ticker;
      }
    }

    // Extract from parentheses if present
    const tickerMatch = companyName.match(/\(([A-Z]{1,5})\)/);
    if (tickerMatch) {
      return tickerMatch[1];
    }

    return null;
  }

  // REMOVED: generateMockStockData - Only use real market data, no fake data allowed

  async updateStockPricesForTrades(): Promise<void> {
    try {
      // Get ALL recent trades to ensure comprehensive price coverage
      const trades = await storage.getInsiderTrades(2000, 0);
      console.log(`📊 Retrieved ${trades.length} trades for stock price updates`);

      // Extract unique tickers (more reliable than company names)
      const uniqueTickers = new Set<string>();

      for (const trade of trades) {
        if (trade.ticker) {
          uniqueTickers.add(trade.ticker.toUpperCase());
        }
      }

      console.log(`🔄 Updating stock prices for ${uniqueTickers.size} unique tickers...`);

      let successCount = 0;
      let failedCount = 0;
      const failedTickers: string[] = [];

      for (const ticker of Array.from(uniqueTickers)) {
        try {
          // Use ticker directly instead of company name lookup
          const priceData = await this.getStockPrice(ticker);

          if (priceData) {
            const stockPrice: InsertStockPrice = {
              ticker: priceData.ticker,
              companyName: priceData.companyName,
              currentPrice: priceData.currentPrice.toString(),
              change: priceData.change.toString(),
              changePercent: priceData.changePercent.toString(),
              volume: priceData.volume,
              marketCap: priceData.marketCap,
            };

            await storage.upsertStockPrice(stockPrice);
            successCount++;
            console.log(`✅ [${successCount}/${uniqueTickers.size}] Updated ${ticker}: $${priceData.currentPrice}`);
          } else {
            failedCount++;
            failedTickers.push(ticker);
            console.log(`⚠️ [${successCount + failedCount}/${uniqueTickers.size}] No price data for ${ticker} - may be delisted or invalid`);
          }
        } catch (error) {
          failedCount++;
          failedTickers.push(ticker);
          console.error(`❌ [${successCount + failedCount}/${uniqueTickers.size}] Failed to update ${ticker}:`, (error as Error)?.message || error);
          // Continue with next ticker instead of crashing
          continue;
        }

        // Rate limiting: Polygon.io allows 5 calls/min = wait 12 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 12000));
      }

      console.log('\n📈 Stock Price Update Summary:');
      console.log(`   ✅ Successfully updated: ${successCount} tickers`);
      console.log(`   ❌ Failed to update: ${failedCount} tickers`);
      console.log(`   📊 Coverage: ${((successCount / uniqueTickers.size) * 100).toFixed(1)}%`);

      if (failedTickers.length > 0 && failedTickers.length <= 10) {
        console.log(`   Failed tickers: ${failedTickers.join(', ')}`);
      } else if (failedTickers.length > 10) {
        console.log(`   Failed tickers (first 10): ${failedTickers.slice(0, 10).join(', ')}...`);
      }

      console.log('✅ Stock price update completed');
    } catch (error) {
      console.error('❌ Error updating stock prices:', error);
    }
  }

  async getStockPriceHistory(ticker: string, period: string = '1y'): Promise<any[]> {
    const upperTicker = ticker.toUpperCase();
    const cached = this.cache.get(`${upperTicker}_history`);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '2y':
          startDate.setFullYear(endDate.getFullYear() - 2);
          break;
        default:
          startDate.setFullYear(endDate.getFullYear() - 1);
      }

      // Yahoo Finance historical data API
      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${upperTicker}`, {
        params: {
          period1,
          period2,
          interval: '1d'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.timestamp) {
        throw new Error('No historical data found');
      }

      const timestamps = result.timestamp;
      const ohlc = result.indicators?.quote?.[0];
      
      if (!ohlc) {
        throw new Error('No OHLC data available');
      }

      const historyData: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        ticker: string;
      }> = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: ohlc.open[index] || 0,
        high: ohlc.high[index] || 0,
        low: ohlc.low[index] || 0,
        close: ohlc.close[index] || 0,
        volume: ohlc.volume[index] || 0,
        ticker: upperTicker
      })).filter((data: any) => data.close > 0); // Filter out invalid data

      // Only cache successful results with data
      if (historyData.length > 0) {
        this.cache.set(`${upperTicker}_history`, {
          data: historyData,
          timestamp: Date.now()
        });
        console.log(`✅ Fetched ${historyData.length} historical data points for ${upperTicker}`);
      } else {
        console.warn(`⚠️ Yahoo Finance returned empty data for ${upperTicker}`);
      }

      return historyData;
    } catch (error) {
      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${upperTicker}`;

        if (status === 404) {
          console.error(`❌ Ticker ${upperTicker} not found (404) - may be delisted or invalid`);
        } else if (status === 429) {
          console.error(`❌ Rate limited by Yahoo Finance for ${upperTicker}`);
        } else if (error.code === 'ECONNABORTED') {
          console.error(`❌ Request timeout for ${upperTicker} (>10s)`);
        } else {
          console.error(`❌ Failed to fetch ${upperTicker}: HTTP ${status || 'error'} - ${error.message}`);
        }
        console.error(`   URL: ${url}`);
      } else {
        console.error(`❌ Failed to fetch historical data for ${upperTicker}:`, error instanceof Error ? error.message : error);
      }

      // Don't cache errors - return empty array
      return [];
    }
  }

  async updateHistoricalPricesForTicker(ticker: string, period: string = '1y'): Promise<void> {
    try {
      const historyData = await this.getStockPriceHistory(ticker, period);
      
      if (historyData.length === 0) {
        console.log(`⚠️ No historical data available for ${ticker}`);
        return;
      }

      console.log(`📈 Updating historical prices for ${ticker} (${historyData.length} days)`);

      for (const dayData of historyData) {
        try {
          await storage.upsertStockPriceHistory({
            ticker: dayData.ticker,
            date: dayData.date,
            open: dayData.open.toString(),
            high: dayData.high.toString(),
            low: dayData.low.toString(),
            close: dayData.close.toString(),
            volume: dayData.volume
          });
        } catch (error) {
          console.error(`❌ Failed to save historical data for ${ticker} on ${dayData.date}:`, error);
        }
        
        // Rate limiting: wait 10ms between inserts
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`✅ Updated historical prices for ${ticker}`);
    } catch (error) {
      console.error(`❌ Error updating historical prices for ${ticker}:`, error);
    }
  }

  async startPeriodicUpdates(): Promise<void> {
    console.log('🚀 Starting periodic stock price updates (every 6 hours - COST OPTIMIZED)...');

    // Initial update (if not weekend)
    if (shouldUpdateStockPrices()) {
      await this.updateStockPricesForTrades();
    }

    // Schedule periodic updates (skip on weekends/holidays)
    setInterval(async () => {
      if (shouldUpdateStockPrices()) {
        await this.updateStockPricesForTrades();
      }
    }, 6 * 60 * 60 * 1000); // 6 hours - Cost optimization
  }
}

export const stockPriceService = new StockPriceService();