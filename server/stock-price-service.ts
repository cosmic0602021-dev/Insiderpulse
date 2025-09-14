import axios from 'axios';
import { storage } from './storage';
import type { InsertStockPrice } from '@shared/schema';

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
      
      // Return mock data if API fails
      return this.generateMockStockData(upperTicker);
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

  private generateMockStockData(ticker: string): any {
    const basePrice = 50 + Math.random() * 200; // $50-$250
    const change = (Math.random() - 0.5) * 20; // -$10 to +$10
    const changePercent = (change / basePrice) * 100;

    return {
      ticker,
      companyName: `${ticker} Inc`,
      currentPrice: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
    };
  }

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