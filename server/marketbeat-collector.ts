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
  private readonly MAX_PAGES_LIMIT = 10; // Safety limit
  private readonly PAGE_IDS_SEEN = new Set<string>(); // Track page IDs to avoid duplicates

  // API compatible with OpenInsider - collects by trade count, not pages
  async collectLatestTrades(limit: number = 200): Promise<number> {
    try {
      console.log(`🔍 Starting MarketBeat insider trading collection (limit: ${limit} trades)...`);
      
      // Reset page tracking for fresh collection
      this.resetPageTracking();
      
      let totalProcessed = 0;
      let totalDuplicates = 0;
      let consecutiveDuplicatePages = 0;
      let currentPage = 0;
      const maxPages = Math.min(Math.ceil(limit / 20) + 2, this.MAX_PAGES_LIMIT); // Estimate pages needed + buffer
      
      console.log(`📊 Estimated pages needed: ${maxPages} (${limit} trades requested)`);
      
      for (let page = 1; page <= maxPages; page++) {
        currentPage = page;
        console.log(`📄 Processing MarketBeat page ${page}...`);
        
        // Try multiple pagination URL patterns that MarketBeat might use
        const url = this.buildPaginationUrl(page);
        console.log(`📡 Fetching from: ${url}`);

        // Check for page ID uniqueness to detect infinite loops
        const pageId = this.extractPageId(url);
        if (this.PAGE_IDS_SEEN.has(pageId)) {
          console.log(`⚠️ Detected duplicate page ID ${pageId}, stopping to avoid infinite loop`);
          break;
        }
        this.PAGE_IDS_SEEN.add(pageId);

        const response = await fetch(url, {
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
          console.error(`❌ HTTP error for page ${page}! status: ${response.status}`);
          break;
        }

        const html = await response.text();
        console.log(`📄 Page ${page}: Received HTML content (${html.length} characters)`);

        const trades = this.parseMarketBeatHTML(html);
        console.log(`📊 Page ${page}: Parsed ${trades.length} trades from MarketBeat`);
        
        if (trades.length === 0) {
          console.log(`⏹️ Page ${page}: No trades found, stopping pagination`);
          break;
        }

        let pageProcessed = 0;
        let pageDuplicates = 0;

        // Process each trade from the page
        for (const trade of trades) {
          try {
            // Stop if we've reached our limit
            if (totalProcessed >= limit) {
              console.log(`✅ Reached target limit of ${limit} trades, stopping collection`);
              break;
            }

            // Check for duplicates (enhanced detection)
            const existingTrade = await this.findExistingTrade(trade);
            if (existingTrade) {
              pageDuplicates++;
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
            
            pageProcessed++;
            console.log(`✅ Page ${page}: Processed ${trade.ticker} - ${trade.insiderName} (${trade.buyOrSell})`);
            
          } catch (error) {
            console.error(`❌ Page ${page}: Error processing trade for ${trade.ticker}:`, error);
          }
        }
        
        totalProcessed += pageProcessed;
        totalDuplicates += pageDuplicates;
        
        console.log(`📊 Page ${page} completed: ${pageProcessed} new trades, ${pageDuplicates} duplicates (${totalProcessed}/${limit} total)`);
        
        // Stop if we've reached our target
        if (totalProcessed >= limit) {
          console.log(`🎯 Target of ${limit} trades reached, stopping pagination`);
          break;
        }
        
        // If all trades on this page were duplicates, increment consecutive counter
        if (pageProcessed === 0 && pageDuplicates > 0) {
          consecutiveDuplicatePages++;
          console.log(`⏭️ Page ${page}: All trades were duplicates (${consecutiveDuplicatePages} consecutive)`);
          
          // Stop if we get 2 consecutive pages of all duplicates
          if (consecutiveDuplicatePages >= 2) {
            console.log(`✋ Stopping after ${consecutiveDuplicatePages} pages of all duplicates`);
            break;
          }
        } else {
          consecutiveDuplicatePages = 0; // Reset counter
        }
        
        // Rate limiting between pages
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`🎉 MarketBeat collection completed: ${totalProcessed}/${limit} trades, ${totalDuplicates} duplicates across ${currentPage} pages`);
      return totalProcessed;

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

      // Extract transaction date (NO fallback to today's date)
      const transactionDate = this.extractDate(cells[6]);
      if (!transactionDate) {
        console.log(`⚠️ Row parsing failed: No valid transaction date found`);
        return null; // Skip trades without valid dates
      }

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
    // Enhanced duplicate detection with multiple strategies
    const recentTrades = await storage.getInsiderTrades(2000); // Check more trades for accuracy
    
    // Strategy 1: Use SEC filing URL if available (most reliable)
    if (trade.secFilingUrl) {
      const urlMatch = recentTrades.find(existing => 
        existing.secFilingUrl === trade.secFilingUrl
      );
      if (urlMatch) {
        console.log(`🔗 Found duplicate via SEC URL: ${trade.secFilingUrl}`);
        return urlMatch;
      }
    }
    
    // Strategy 2: Check by enhanced accession number
    const accessionNumber = this.generateAccessionNumber(trade);
    const accessionMatch = recentTrades.find(existing => 
      existing.accessionNumber === accessionNumber
    );
    if (accessionMatch) {
      console.log(`🏷️ Found duplicate via accession: ${accessionNumber}`);
      return accessionMatch;
    }
    
    // Strategy 3: Fuzzy matching for similar trades (same ticker+insider+date+value)
    const fuzzyMatch = recentTrades.find(existing => 
      existing.ticker === trade.ticker &&
      existing.traderName === trade.insiderName &&
      Math.abs(existing.totalValue - trade.totalValue) < 100 && // Allow $100 difference
      Math.abs(new Date(existing.filedDate).getTime() - new Date(trade.transactionDate).getTime()) < 24 * 60 * 60 * 1000 // Same day
    );
    if (fuzzyMatch) {
      console.log(`🔍 Found duplicate via fuzzy matching: ${trade.ticker}`);
      return fuzzyMatch;
    }
    
    return null;
  }

  private generateAccessionNumber(trade: MarketBeatTrade): string {
    // Generate more robust accession number using crypto hash for uniqueness
    const ticker = trade.ticker.replace(/[^A-Z0-9]/g, '');
    const name = trade.insiderName.replace(/[^A-Za-z]/g, '').substring(0, 15);
    const date = trade.transactionDate.replace(/[^0-9]/g, '');
    const shares = trade.shares.toString();
    const price = Math.round((trade.totalValue / trade.shares) * 100).toString(); // Price in cents
    const tradeType = trade.buyOrSell.toUpperCase();
    
    // Create a more unique identifier
    const hashInput = `${ticker}-${name}-${date}-${shares}-${price}-${tradeType}`;
    
    // Simple hash for uniqueness (could use crypto.createHash in Node.js for production)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `marketbeat-${ticker}-${Math.abs(hash).toString(16)}`;
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

  private buildPaginationUrl(page: number): string {
    if (page === 1) {
      return this.baseUrl;
    }
    
    // MarketBeat common pagination patterns
    const patterns = [
      `${this.baseUrl}?page=${page}`,     // Standard ?page= pattern
      `${this.baseUrl}?p=${page}`,        // Alternative ?p= pattern
      `${this.baseUrl}page/${page}/`,     // REST-style pattern
      `${this.baseUrl}${page}/`,          // Simple append pattern
    ];
    
    // For now, use the first pattern - could be enhanced to test multiple
    return patterns[0];
  }
  
  private extractPageId(url: string): string {
    // Extract a unique identifier from the URL to detect duplicates
    return url.replace(/https?:\/\/[^\/]+/, '').split('?')[0] + (url.includes('?') ? url.split('?')[1] : '');
  }
  
  private resetPageTracking(): void {
    // Clear page tracking for fresh collections
    this.PAGE_IDS_SEEN.clear();
  }
}

export const marketBeatCollector = new MarketBeatCollector();