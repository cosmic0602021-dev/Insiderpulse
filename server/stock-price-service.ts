import axios from 'axios';
import { storage } from './storage';
import type { InsertStockPrice, InsertStockPriceHistory } from '@shared/schema';

export class StockPriceService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

      const priceData = {
        ticker: upperTicker,
        companyName: meta.longName || meta.shortName || upperTicker,
        currentPrice: currentPrice || 0,
        change: change || 0,
        changePercent: changePercent || 0,
        volume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap || 0,
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
      // Get recent trades that need price updates
      const trades = await storage.getInsiderTrades(50, 0);
      const uniqueCompanies = new Set<string>();
      
      for (const trade of trades) {
        if (trade.companyName) {
          uniqueCompanies.add(trade.companyName);
        }
      }

      console.log(`🔄 Updating stock prices for ${uniqueCompanies.size} companies...`);

      for (const companyName of Array.from(uniqueCompanies)) {
        try {
          const priceData = await this.getStockPriceByCompanyName(companyName);
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
            console.log(`✅ Updated stock price for ${priceData.ticker}: $${priceData.currentPrice}`);
          } else {
            console.log(`⚠️ No real price data available for ${companyName} - skipping (no fake data)`);
          }
        } catch (error) {
          console.error(`❌ Failed to update price for ${companyName}:`, error);
        }
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
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

      // Cache the result
      this.cache.set(`${upperTicker}_history`, {
        data: historyData,
        timestamp: Date.now()
      });

      return historyData;
    } catch (error) {
      console.error(`❌ Failed to fetch historical data for ${upperTicker}:`, error);
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
    console.log('🚀 Starting periodic stock price updates (every 10 minutes)...');
    
    // Initial update
    await this.updateStockPricesForTrades();
    
    // Schedule periodic updates
    setInterval(async () => {
      await this.updateStockPricesForTrades();
    }, 10 * 60 * 1000); // 10 minutes
  }
}

export const stockPriceService = new StockPriceService();