import { storage } from './storage';
import { dataIntegrityService } from './data-integrity-service';
import type { InsertInsiderTrade } from '@shared/schema';

// Break circular dependency - broadcaster function will be injected
let broadcaster: ((event: string, data: any) => void) | null = null;

export function setBroadcaster(fn: (event: string, data: any) => void) {
  broadcaster = fn;
}

interface OpenInsiderTrade {
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  tradeType: 'Buy' | 'Sell' | 'Transfer';
  price: number;
  quantity: number;
  owned: number;
  deltaOwn: string; // +/-X%
  value: number;
  filingDate: string;
  tradeDate: string;
  secUrl?: string;
}

class OpenInsiderCollector {
  private baseUrl = 'http://www.openinsider.com/';

  async collectLatestTrades(limit: number = 200): Promise<number> {
    try {
      console.log('🔍 Starting OpenInsider.com insider trading collection...');
      console.log(`📡 Fetching from: ${this.baseUrl}`);

      const response = await fetch(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`📄 Received OpenInsider HTML content (${html.length} characters)`);

      const trades = this.parseOpenInsiderHTML(html);
      console.log(`📊 Parsed ${trades.length} trades from OpenInsider`);

      let processed = 0;
      let duplicates = 0;
      let errors = 0;

      for (const trade of trades.slice(0, limit)) {
        try {
          // Check for duplicates using unique identifier
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
            traderTitle: trade.title,
            tradeType: trade.tradeType.toUpperCase() as 'BUY' | 'SELL' | 'TRANSFER',
            shares: trade.quantity,
            pricePerShare: trade.price,
            totalValue: trade.value,
            ownershipPercentage: this.parseOwnershipPercentage(trade.deltaOwn),
            filedDate: new Date(trade.filingDate),
            significanceScore: this.calculateSignificanceScore(trade),
            signalType: this.determineSignalType(trade),
            isVerified: true,
            verificationStatus: 'VERIFIED',
            verificationNotes: 'Data sourced from OpenInsider.com - comprehensive SEC Form 4 coverage',
            secFilingUrl: trade.secUrl,
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
          console.log(`✅ Processed: ${trade.ticker} - ${trade.insiderName} (${trade.tradeType}) - $${trade.value.toLocaleString()}`);
          
        } catch (error) {
          errors++;
          console.error(`❌ Error processing trade for ${trade.ticker}:`, error);
        }
      }

      console.log(`🎉 OpenInsider collection completed:`);
      console.log(`   ✅ ${processed} new trades processed`);
      console.log(`   ⚠️  ${duplicates} duplicates skipped`);
      console.log(`   ❌ ${errors} errors`);
      console.log(`   📊 Total volume: $${trades.reduce((sum, t) => sum + t.value, 0).toLocaleString()}`);
      
      return processed;

    } catch (error) {
      console.error('❌ Error in OpenInsider collection:', error);
      throw error;
    }
  }

  private parseOpenInsiderHTML(html: string): OpenInsiderTrade[] {
    const trades: OpenInsiderTrade[] = [];
    
    try {
      // Find the main data table - OpenInsider uses clean table structure
      const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
      
      if (!tableMatch) {
        console.error('❌ Could not find tables in OpenInsider HTML');
        return trades;
      }

      // Look for the latest insider buys table
      let insiderTable: string | null = null;
      
      for (const table of tableMatch) {
        // OpenInsider has specific table headers
        if (table.includes('Filing Date') && 
            table.includes('Trade Date') && 
            table.includes('Ticker') &&
            table.includes('Value')) {
          insiderTable = table;
          console.log(`✅ Found main insider trading table in OpenInsider`);
          break;
        }
      }

      if (!insiderTable) {
        console.error('❌ Could not find insider trading table in OpenInsider');
        return trades;
      }

      // Extract table rows
      const rowMatches = insiderTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (!rowMatches) {
        console.error('❌ Could not find table rows');
        return trades;
      }

      console.log(`📊 Found ${rowMatches.length} rows in OpenInsider table`);

      // Skip header row and parse data rows
      for (let i = 1; i < rowMatches.length; i++) {
        const row = rowMatches[i];
        
        try {
          const trade = this.parseTableRow(row);
          if (trade) {
            trades.push(trade);
          }
        } catch (error) {
          console.log(`⚠️ Row ${i} parsing failed:`, error);
        }
      }

      console.log(`🎉 Successfully parsed ${trades.length} trades from OpenInsider`);

    } catch (error) {
      console.error('❌ Error parsing OpenInsider HTML:', error);
    }

    return trades;
  }

  private parseTableRow(row: string): OpenInsiderTrade | null {
    try {
      // Extract all cell contents from the table row
      const cells = this.extractCellTexts(row);
      
      // OpenInsider typically has: Filing Date, Trade Date, Ticker, Company, Insider, Title, Trade Type, Price, Qty, Owned, ΔOwn, Value
      if (cells.length < 10) {
        return null; // Not enough columns
      }

      let cellIndex = 0;
      
      // Skip first cell if it contains 'X' (checkbox column)
      if (cells[0]?.trim() === 'X' || cells[0]?.includes('X')) {
        cellIndex = 1;
      }

      const filingDate = this.parseDate(cells[cellIndex]) || new Date().toISOString().split('T')[0];
      const tradeDate = this.parseDate(cells[cellIndex + 1]) || filingDate;
      
      // Extract ticker (bold text typically)
      const ticker = this.extractTicker(cells[cellIndex + 2]);
      if (!ticker) return null;

      // Company name
      const companyName = this.extractCompanyName(cells[cellIndex + 3], ticker);
      
      // Insider name 
      const insiderName = this.cleanText(cells[cellIndex + 4]);
      if (!insiderName) return null;

      // Title
      const title = this.cleanTraderTitle(cells[cellIndex + 5] || '');

      // Trade type (P - Purchase, S - Sale, etc.)
      const tradeType = this.parseTradeType(cells[cellIndex + 6]);
      if (!tradeType) return null;

      // Price
      const price = this.parsePrice(cells[cellIndex + 7]);

      // Quantity
      const quantity = this.parseNumber(cells[cellIndex + 8]);
      if (!quantity) return null;

      // Owned shares
      const owned = this.parseNumber(cells[cellIndex + 9]);

      // Delta ownership percentage
      const deltaOwn = this.cleanText(cells[cellIndex + 10]);

      // Value
      const value = this.parseValue(cells[cellIndex + 11]);

      // Extract SEC filing URL
      const secUrl = this.extractSecUrl(row);

      return {
        ticker,
        companyName,
        insiderName,
        title,
        tradeType,
        price,
        quantity,
        owned,
        deltaOwn,
        value,
        filingDate,
        tradeDate,
        secUrl,
      };

    } catch (error) {
      console.error('Error parsing OpenInsider table row:', error);
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
         .replace(/&quot;/g, '"')
         .replace(/\s+/g, ' ')
         .trim()
    );
  }

  private extractTicker(text: string): string | null {
    // Look for ticker patterns - OpenInsider typically bolds the ticker
    const patterns = [
      /\b([A-Z]{1,5})\b/,  // Simple ticker pattern
      /([A-Z]{2,5})/,      // Ticker letters
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length >= 2 && match[1].length <= 5) {
        return match[1];
      }
    }
    return null;
  }

  private extractCompanyName(text: string, ticker: string): string {
    // Clean and extract company name
    let name = this.cleanText(text);
    
    // Remove ticker if it appears in company name
    name = name.replace(new RegExp(`\\b${ticker}\\b`, 'gi'), '').trim();
    
    // Default fallback
    return name || `${ticker} Corporation`;
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private cleanTraderTitle(title: string): string {
    const cleaned = this.cleanText(title);

    // If title is just a number or empty, provide a meaningful default
    if (!cleaned || /^\d+$/.test(cleaned)) {
      return 'Executive';
    }

    return cleaned;
  }

  private parseDate(text: string): string | null {
    try {
      // OpenInsider date formats: YYYY-MM-DD or MM/DD/YYYY
      const cleaned = text.trim();
      
      if (/\d{4}-\d{2}-\d{2}/.test(cleaned)) {
        return cleaned; // Already in YYYY-MM-DD format
      }
      
      if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(cleaned)) {
        const date = new Date(cleaned);
        return date.toISOString().split('T')[0];
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private parseTradeType(text: string): 'Buy' | 'Sell' | 'Transfer' | null {
    const cleaned = text.toLowerCase().trim();
    
    if (cleaned.includes('p') || cleaned.includes('purchase') || cleaned.includes('buy')) {
      return 'Buy';
    }
    if (cleaned.includes('s') || cleaned.includes('sale') || cleaned.includes('sell')) {
      return 'Sell';
    }
    if (cleaned.includes('a') || cleaned.includes('grant') || cleaned.includes('award') || 
        cleaned.includes('d') || cleaned.includes('g') || cleaned.includes('f') || 
        cleaned.includes('m') || cleaned.includes('transfer')) {
      return 'Transfer';
    }
    
    return null;
  }

  private parsePrice(text: string): number {
    const cleaned = text.replace(/[$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }

  private parseNumber(text: string): number {
    // Handle numbers with commas and + signs
    const cleaned = text.replace(/[+,]/g, '');
    const number = parseInt(cleaned);
    return isNaN(number) ? 0 : Math.abs(number);
  }

  private parseValue(text: string): number {
    // Handle value formats like +$209,094
    const cleaned = text.replace(/[+$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : Math.abs(number);
  }

  private extractSecUrl(row: string): string | undefined {
    // Look for SEC.gov URLs
    const urlMatch = row.match(/href=["']([^"']*sec\.gov[^"']*)["']/i);
    return urlMatch ? urlMatch[1] : undefined;
  }

  private parseOwnershipPercentage(deltaOwn: string): number {
    // Parse ownership change like "+1%" or "New"
    if (deltaOwn.toLowerCase().includes('new')) return 0;
    
    const match = deltaOwn.match(/([+-]?\d+(?:\.\d+)?)%/);
    return match ? Math.abs(parseFloat(match[1])) : 0;
  }

  private async findExistingTrade(trade: OpenInsiderTrade): Promise<any> {
    // Check for existing trade with same accession number
    const accessionNumber = this.generateAccessionNumber(trade);
    const recentTrades = await storage.getInsiderTrades(2000); // Check more trades for accuracy
    
    return recentTrades.find(existing => 
      existing.accessionNumber === accessionNumber
    );
  }

  private generateAccessionNumber(trade: OpenInsiderTrade): string {
    // Generate unique accession number from trade data
    const ticker = trade.ticker.replace(/[^A-Z0-9]/g, '');
    const name = trade.insiderName.replace(/[^A-Za-z]/g, '').substring(0, 10);
    const date = trade.tradeDate.replace(/[^0-9]/g, '');
    const value = Math.round(trade.value).toString();
    const qty = trade.quantity.toString();
    
    return `openinsider-${ticker}-${name}-${date}-${qty}-${value}`;
  }

  private calculateSignificanceScore(trade: OpenInsiderTrade): number {
    // Enhanced scoring based on multiple factors
    let score = 30; // Base score
    
    // Value-based scoring
    if (trade.value > 50000000) score += 40; // $50M+
    else if (trade.value > 10000000) score += 30; // $10M+
    else if (trade.value > 1000000) score += 20;  // $1M+
    else if (trade.value > 100000) score += 10;   // $100K+
    
    // Trade type bonus
    if (trade.tradeType === 'Buy') score += 15; // Insider buying is significant
    else if (trade.tradeType === 'Sell') score += 5;
    
    // Title-based bonus
    if (trade.title.toLowerCase().includes('ceo')) score += 15;
    else if (trade.title.toLowerCase().includes('cfo')) score += 10;
    else if (trade.title.toLowerCase().includes('director')) score += 5;
    
    return Math.min(score, 100); // Cap at 100
  }

  private determineSignalType(trade: OpenInsiderTrade): 'BUY' | 'SELL' | 'HOLD' {
    if (trade.tradeType === 'Buy') return 'BUY';
    if (trade.tradeType === 'Sell') return 'SELL';
    return 'HOLD';
  }
}

export const openInsiderCollector = new OpenInsiderCollector();