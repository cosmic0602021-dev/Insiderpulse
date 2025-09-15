import { storage } from './storage';
import type { InsertInsiderTrade } from '@shared/schema';

// Break circular dependency - broadcaster function will be injected
let broadcaster: ((event: string, data: any) => void) | null = null;

export function setBroadcaster(fn: (event: string, data: any) => void) {
  broadcaster = fn;
}

interface MarketBeatTrade {
  ticker: string;
  companyName: string;
  insiderName: string;
  position: string;
  buyOrSell: 'Buy' | 'Sell';
  shares: number;
  totalValue: number;
  sharesAfter: number;
  transactionDate: string;
  secFilingUrl?: string;
}

class MarketBeatCollector {
  private baseUrl = 'https://www.marketbeat.com/insider-trades/';

  async collectLatestTrades(limit: number = 100): Promise<number> {
    try {
      console.log('🔍 Starting MarketBeat insider trading collection...');
      console.log(`📡 Fetching from: ${this.baseUrl}`);

      const response = await fetch(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`📄 Received HTML content (${html.length} characters)`);

      const trades = this.parseMarketBeatHTML(html);
      console.log(`📊 Parsed ${trades.length} trades from MarketBeat`);

      let processed = 0;
      let duplicates = 0;

      for (const trade of trades.slice(0, limit)) {
        try {
          // Check for duplicates
          const existingTrade = await this.findExistingTrade(trade);
          if (existingTrade) {
            duplicates++;
            continue;
          }

          // Convert to our schema
          const convertedTrade: InsertInsiderTrade = {
            accessionNumber: this.generateAccessionNumber(trade),
            companyName: trade.companyName,
            ticker: trade.ticker,
            traderName: trade.insiderName,
            traderTitle: trade.position || '',
            tradeType: trade.buyOrSell.toUpperCase() as 'BUY' | 'SELL',
            shares: trade.shares,
            pricePerShare: trade.totalValue / trade.shares || 0,
            totalValue: trade.totalValue,
            ownershipPercentage: 0, // MarketBeat doesn't provide this
            filedDate: new Date(trade.transactionDate),
            significanceScore: this.calculateSignificanceScore(trade),
            signalType: this.determineSignalType(trade),
            isVerified: true,
            verificationStatus: 'VERIFIED',
            verificationNotes: 'Data sourced from MarketBeat.com',
            secFilingUrl: trade.secFilingUrl || undefined,
          };

          // Save trade to database
          const savedTrade = await storage.createInsiderTrade(convertedTrade);
          
          // Broadcast to WebSocket clients
          if (broadcaster) {
            broadcaster('NEW_TRADE', {
              trade: savedTrade
            });
          }
          
          processed++;
          console.log(`✅ Processed: ${trade.ticker} - ${trade.insiderName} (${trade.buyOrSell})`);
          
        } catch (error) {
          console.error(`❌ Error processing trade for ${trade.ticker}:`, error);
        }
      }

      console.log(`🎉 MarketBeat collection completed: ${processed} new trades, ${duplicates} duplicates`);
      return processed;

    } catch (error) {
      console.error('❌ Error in MarketBeat collection:', error);
      throw error;
    }
  }

  private parseMarketBeatHTML(html: string): MarketBeatTrade[] {
    const trades: MarketBeatTrade[] = [];
    
    try {
      // Find the main table with insider trading data
      const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
      
      if (!tableMatch) {
        console.error('❌ Could not find table in MarketBeat HTML');
        return trades;
      }

      // Look for the table that contains insider trading data
      let insiderTable: string | null = null;
      
      for (const table of tableMatch) {
        if (table.includes('Buy/Sell') || table.includes('Transaction Date') || table.includes('SEC Filing')) {
          insiderTable = table;
          console.log(`✅ Found insider trading table in MarketBeat`);
          break;
        }
      }

      if (!insiderTable) {
        console.error('❌ Could not find insider trading table in MarketBeat');
        return trades;
      }

      // Extract table rows
      const rowMatches = insiderTable.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
      
      if (!rowMatches) {
        console.error('❌ Could not find table rows');
        return trades;
      }

      console.log(`📊 Found ${rowMatches.length} rows in MarketBeat table`);

      // Skip header row and parse data rows
      for (let i = 1; i < rowMatches.length; i++) {
        const row = rowMatches[i];
        
        try {
          const trade = this.parseTableRow(row);
          if (trade) {
            trades.push(trade);
            console.log(`✅ Parsed valid trade: ${trade.ticker} - ${trade.insiderName} (${trade.buyOrSell})`);
          }
        } catch (error) {
          console.log(`❌ Row ${i} failed parsing:`, error);
        }
      }

      console.log(`🎉 Successfully parsed ${trades.length} trades from MarketBeat HTML`);

    } catch (error) {
      console.error('❌ Error parsing MarketBeat HTML:', error);
    }

    return trades;
  }

  private parseTableRow(row: string): MarketBeatTrade | null {
    try {
      // Extract all cell contents
      const cells = this.extractCellTexts(row);
      
      if (cells.length < 6) {
        return null; // Not enough data
      }

      // Extract ticker from the first cell (usually contains logo and ticker)
      const ticker = this.extractTicker(cells[0]) || this.extractTicker(row);
      if (!ticker) {
        return null;
      }

      // Extract company name
      const companyName = this.extractCompanyName(cells[0]) || `${ticker} Corp.`;

      // Extract insider name and position
      const insiderData = this.extractInsiderData(cells[1]);
      if (!insiderData.name) {
        return null;
      }

      // Extract buy/sell
      const buyOrSell = this.extractBuyOrSell(cells[2]);
      if (!buyOrSell) {
        return null;
      }

      // Extract shares
      const shares = this.parseNumber(cells[3]);
      if (!shares) {
        return null;
      }

      // Extract total value
      const totalValue = this.parseMoneyValue(cells[4]);

      // Extract shares after transaction
      const sharesAfter = this.parseNumber(cells[5]);

      // Extract transaction date
      const transactionDate = this.extractDate(cells[6]) || new Date().toISOString().split('T')[0];

      // Extract SEC filing URL if available
      const secFilingUrl = this.extractSecUrl(row);

      return {
        ticker,
        companyName,
        insiderName: insiderData.name,
        position: insiderData.position,
        buyOrSell,
        shares,
        totalValue,
        sharesAfter,
        transactionDate,
        secFilingUrl,
      };

    } catch (error) {
      console.error('Error parsing table row:', error);
      return null;
    }
  }

  private extractCellTexts(row: string): string[] {
    const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cellMatches) return [];
    
    return cellMatches.map(cell => 
      cell.replace(/<[^>]*>/g, ' ')
         .replace(/&nbsp;/g, ' ')
         .replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/\s+/g, ' ')
         .trim()
    );
  }

  private extractTicker(text: string): string | null {
    // Look for ticker patterns in text
    const patterns = [
      /\b([A-Z]{1,5})\s+[A-Z][a-z]/,  // Ticker followed by company name
      /\b([A-Z]{2,5})\b/,             // Simple ticker pattern
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  private extractCompanyName(text: string): string | null {
    // Extract company name after ticker
    const match = text.match(/[A-Z]{2,5}\s+([A-Za-z\s&.,\-]+)/);
    return match ? match[1].trim() : null;
  }

  private extractInsiderData(text: string): { name: string; position: string } {
    // Split on parentheses to separate name and position
    const match = text.match(/^([^(]+)(?:\(([^)]+)\))?/);
    
    return {
      name: match ? match[1].trim() : text.trim(),
      position: match && match[2] ? match[2].trim() : '',
    };
  }

  private extractBuyOrSell(text: string): 'Buy' | 'Sell' | null {
    const lower = text.toLowerCase();
    if (lower.includes('buy')) return 'Buy';
    if (lower.includes('sell')) return 'Sell';
    return null;
  }

  private parseNumber(text: string): number {
    const cleaned = text.replace(/[^\d.,]/g, '');
    const number = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(number) ? 0 : number;
  }

  private parseMoneyValue(text: string): number {
    // Remove currency symbols and commas
    const cleaned = text.replace(/[$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }

  private extractDate(text: string): string | null {
    // Look for date patterns
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      const date = new Date(dateMatch[1]);
      return date.toISOString().split('T')[0];
    }
    return null;
  }

  private extractSecUrl(row: string): string | undefined {
    const urlMatch = row.match(/href=["']([^"']*sec\.gov[^"']*)["']/);
    return urlMatch ? urlMatch[1] : undefined;
  }

  private async findExistingTrade(trade: MarketBeatTrade): Promise<any> {
    // Check for existing trade with same accession number
    const accessionNumber = this.generateAccessionNumber(trade);
    const recentTrades = await storage.getInsiderTrades(1000);
    
    return recentTrades.find(existing => 
      existing.accessionNumber === accessionNumber
    );
  }

  private generateAccessionNumber(trade: MarketBeatTrade): string {
    // Generate unique accession number from trade data
    const ticker = trade.ticker.replace(/[^A-Z0-9]/g, '');
    const name = trade.insiderName.replace(/[^A-Za-z]/g, '').substring(0, 10);
    const date = trade.transactionDate.replace(/[^0-9]/g, '');
    const value = Math.round(trade.totalValue).toString();
    
    return `marketbeat-${ticker}-${name}-${date}-${value}`;
  }

  private calculateSignificanceScore(trade: MarketBeatTrade): number {
    // Simple scoring based on trade value
    if (trade.totalValue > 10000000) return 90; // $10M+
    if (trade.totalValue > 1000000) return 70;  // $1M+
    if (trade.totalValue > 100000) return 50;   // $100K+
    return 30;
  }

  private determineSignalType(trade: MarketBeatTrade): 'BUY' | 'SELL' | 'HOLD' {
    if (trade.buyOrSell === 'Buy') return 'BUY';
    if (trade.buyOrSell === 'Sell') return 'SELL';
    return 'HOLD';
  }
}

export const marketBeatCollector = new MarketBeatCollector();