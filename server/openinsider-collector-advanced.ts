import { storage } from './storage';
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
  transactionCode: string; // P,S,A,M,G,F,X,C,W,U,D
  tradeType: string; // Mapped to our enum
  price: number;
  quantity: number;
  owned: number;
  deltaOwn: string;
  value: number;
  filingDate: string;
  tradeDate: string;
  secUrl: string; // Always extract SEC URL
  realAccessionNumber?: string; // Extracted from SEC URL
}

/**
 * 🚀 ADVANCED OPENINSIDER COLLECTOR
 * 
 * Features:
 * ✅ Full 30-day pagination with date filtering  
 * ✅ Real SEC accessionNumber extraction
 * ✅ All Form 4 transaction codes (P,S,A,M,G,F,X,C,W,U,D)
 * ✅ Proper verification status (UNVERIFIED for OpenInsider data)
 * ✅ Startup backfill system
 * ✅ Robust error handling and retry logic
 */
class AdvancedOpenInsiderCollector {
  private baseUrl = 'http://www.openinsider.com';

  /**
   * 🎯 COMPLETE 30-DAY BACKFILL
   * Collects ALL insider trades from the past 30 days using pagination
   */
  async collect30DayBackfill(): Promise<number> {
    console.log('🚀 Starting COMPLETE 30-day OpenInsider backfill...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let totalProcessed = 0;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 100) { // Safety limit
      console.log(`📄 Processing page ${page} for 30-day backfill...`);
      
      try {
        const { trades, hasNextPage } = await this.collectPage(page);
        
        // Check if we've reached trades older than 30 days
        const oldestTradeOnPage = trades.reduce((oldest, trade) => {
          const tradeDate = new Date(trade.tradeDate);
          return tradeDate < oldest ? tradeDate : oldest;
        }, new Date());
        
        if (oldestTradeOnPage < thirtyDaysAgo) {
          console.log(`⏹️ Reached 30-day limit on page ${page}. Stopping backfill.`);
          
          // Filter trades to only include those within 30 days
          const recentTrades = trades.filter(trade => 
            new Date(trade.tradeDate) >= thirtyDaysAgo
          );
          
          const processed = await this.processTrades(recentTrades);
          totalProcessed += processed;
          
          hasMore = false;
        } else {
          const processed = await this.processTrades(trades);
          totalProcessed += processed;
          
          hasMore = hasNextPage && trades.length > 0;
          page++;
        }
        
        // Rate limiting - be respectful to OpenInsider
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing page ${page}:`, error);
        break;
      }
    }
    
    console.log(`🎉 30-day backfill completed: ${totalProcessed} trades processed across ${page - 1} pages`);
    return totalProcessed;
  }

  /**
   * 📊 INCREMENTAL COLLECTION
   * Collects latest trades since last run (used by scheduler)
   */
  async collectLatestTrades(limit: number = 300): Promise<number> {
    console.log(`🔄 Starting incremental OpenInsider collection (limit: ${limit})...`);
    
    try {
      const { trades } = await this.collectPage(1, limit);
      
      // Stop early if we encounter duplicate trades (already processed)
      const newTrades = await this.filterNewTrades(trades);
      
      const processed = await this.processTrades(newTrades);
      
      console.log(`✅ Incremental collection completed: ${processed} new trades`);
      return processed;
      
    } catch (error) {
      console.error('❌ Error in incremental collection:', error);
      throw error;
    }
  }

  /**
   * 📄 COLLECT SINGLE PAGE WITH PAGINATION
   * Supports filtering and pagination parameters
   */
  private async collectPage(page: number = 1, maxResults: number = 100): Promise<{
    trades: OpenInsiderTrade[];
    hasNextPage: boolean;
  }> {
    const url = this.buildUrl(page, maxResults);
    console.log(`🌐 Fetching OpenInsider page ${page}: ${url}`);
    
    const response = await this.fetchWithRetry(url);
    const html = await response.text();
    
    const trades = this.parseAdvancedHTML(html);
    const hasNextPage = this.detectNextPage(html);
    
    console.log(`📊 Page ${page}: Found ${trades.length} trades`);
    
    return { trades, hasNextPage };
  }

  /**
   * 🔗 BUILD OPENINSIDER URL WITH FILTERS
   * Supports pagination, date filtering, and transaction type filtering
   */
  private buildUrl(page: number = 1, maxResults: number = 100): string {
    const params = new URLSearchParams({
      'page': page.toString(),
      'max': maxResults.toString(),
      // Add date filtering for better performance
      'fd': '30', // Last 30 days filter
      'grp': '1', // Group by filing
      'sortcol': '0', // Sort by filing date (newest first)
      'sortorder': 'desc',
    });
    
    return `${this.baseUrl}/?${params.toString()}`;
  }

  /**
   * 🌐 FETCH WITH RETRY LOGIC
   * Handles network failures and rate limiting
   */
  private async fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { 
          headers,
          redirect: 'follow',
        });

        if (response.ok) {
          return response;
        }
        
        if (response.status === 429) { // Rate limited
          console.log(`⏳ Rate limited on attempt ${attempt}. Waiting 5 seconds...`);
          await this.sleep(5000);
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        console.log(`⚠️ Fetch attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await this.sleep(2000 * attempt); // Exponential backoff
      }
    }
    
    throw new Error('Max retries reached');
  }

  /**
   * 📝 PARSE ADVANCED HTML WITH ALL TRANSACTION CODES
   * Handles complex OpenInsider table structures
   */
  private parseAdvancedHTML(html: string): OpenInsiderTrade[] {
    const trades: OpenInsiderTrade[] = [];
    
    try {
      // Find all tables - OpenInsider may have multiple tables
      const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
      
      if (!tableMatches) {
        console.log('⚠️ No tables found in OpenInsider HTML');
        return trades;
      }

      // Find the main insider trading table
      let mainTable: string | null = null;
      
      for (const table of tableMatches) {
        // Look for table with insider trading headers
        if (table.includes('Filing Date') && 
            table.includes('Trade Date') && 
            table.includes('Ticker') &&
            table.includes('Company Name') &&
            table.includes('Insider Name') &&
            table.includes('Value')) {
          mainTable = table;
          console.log('✅ Found main insider trading table');
          break;
        }
      }

      if (!mainTable) {
        console.log('⚠️ Could not find main insider trading table');
        return trades;
      }

      // Extract table rows
      const rowMatches = mainTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (!rowMatches) {
        console.log('⚠️ No rows found in table');
        return trades;
      }

      console.log(`📊 Processing ${rowMatches.length} rows from OpenInsider table`);

      // Skip header rows and process data rows
      for (let i = 1; i < rowMatches.length; i++) {
        try {
          const trade = this.parseAdvancedRow(rowMatches[i]);
          if (trade) {
            trades.push(trade);
          }
        } catch (error) {
          console.log(`⚠️ Failed to parse row ${i}:`, error);
        }
      }

      console.log(`✅ Successfully parsed ${trades.length} trades`);

    } catch (error) {
      console.error('❌ Error parsing OpenInsider HTML:', error);
    }

    return trades;
  }

  /**
   * 🔍 PARSE ADVANCED ROW WITH ALL TRANSACTION CODES
   * Extracts all data including real SEC accessionNumber
   */
  private parseAdvancedRow(row: string): OpenInsiderTrade | null {
    try {
      const cells = this.extractCellTexts(row);
      
      if (cells.length < 12) {
        return null; // Not enough data
      }

      let cellIndex = 0;
      
      // Handle optional checkbox column
      if (cells[0]?.trim().match(/^[DMXABCGFW]?$/)) {
        cellIndex = 0; // Transaction code might be in first column
      }

      // Extract transaction code (D, M, X, etc.)
      const transactionCode = this.extractTransactionCode(row, cells[cellIndex]);
      
      if (cells[cellIndex]?.includes('Filing Date')) {
        cellIndex = 1; // Skip header row
      }

      const filingDate = this.parseDate(cells[cellIndex]) || new Date().toISOString().split('T')[0];
      const tradeDate = this.parseDate(cells[cellIndex + 1]) || filingDate;
      
      const ticker = this.extractTicker(cells[cellIndex + 2]);
      if (!ticker) return null;

      const companyName = this.extractCompanyName(cells[cellIndex + 3], ticker);
      const insiderName = this.cleanText(cells[cellIndex + 4]);
      if (!insiderName) return null;

      const title = this.cleanText(cells[cellIndex + 5]) || 'Executive';
      
      // Parse trade type from transaction code
      const tradeType = this.parseTradeTypeFromCode(transactionCode);
      if (!tradeType) return null;

      const price = this.parsePrice(cells[cellIndex + 7]);
      const quantity = this.parseNumber(cells[cellIndex + 8]);
      if (!quantity) return null;

      const owned = this.parseNumber(cells[cellIndex + 9]);
      const deltaOwn = this.cleanText(cells[cellIndex + 10]) || '';
      const value = this.parseValue(cells[cellIndex + 11]);

      // Extract SEC filing URL (CRITICAL for real accessionNumber)
      const secUrl = this.extractSecUrl(row);
      if (!secUrl) {
        console.log(`⚠️ No SEC URL found for ${ticker} - ${insiderName}`);
        return null; // Skip trades without SEC URLs
      }

      // Extract real accession number from SEC URL
      const realAccessionNumber = this.extractAccessionFromUrl(secUrl);

      return {
        ticker,
        companyName,
        insiderName,
        title,
        transactionCode,
        tradeType,
        price,
        quantity,
        owned,
        deltaOwn,
        value,
        filingDate,
        tradeDate,
        secUrl,
        realAccessionNumber,
      };

    } catch (error) {
      console.error('❌ Error parsing advanced row:', error);
      return null;
    }
  }

  /**
   * 🔤 EXTRACT TRANSACTION CODE
   * Identifies P,S,A,M,G,F,X,C,W,U,D transaction codes
   */
  private extractTransactionCode(row: string, firstCell: string): string {
    // Look for transaction code patterns
    const codePatterns = [
      /\b([PSAMGFXCWUD])\b/i,  // Single letter codes
      /([PSAMGFXCWUD])\s*-/i,  // Code followed by dash
    ];
    
    // Check first cell
    for (const pattern of codePatterns) {
      const match = firstCell.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    
    // Check entire row for transaction code
    for (const pattern of codePatterns) {
      const match = row.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    
    // Default fallback - try to infer from trade type
    if (row.toLowerCase().includes('purchase') || row.toLowerCase().includes('buy')) return 'P';
    if (row.toLowerCase().includes('sale') || row.toLowerCase().includes('sell')) return 'S';
    if (row.toLowerCase().includes('award') || row.toLowerCase().includes('grant')) return 'A';
    if (row.toLowerCase().includes('option') && row.toLowerCase().includes('exercise')) return 'M';
    
    return 'S'; // Default to Sale
  }

  /**
   * 📊 MAP TRANSACTION CODE TO TRADE TYPE
   */
  private parseTradeTypeFromCode(code: string): string | null {
    const mappings: { [key: string]: string } = {
      'P': 'BUY',           // Purchase
      'S': 'SELL',          // Sale
      'A': 'GRANT',         // Grant/Award
      'M': 'OPTION_EXERCISE', // Option Exercise
      'G': 'GIFT',          // Gift
      'F': 'TAX',           // Payment of exercise price or tax liability
      'X': 'OPTION_EXERCISE', // Exercise/conversion derivative security
      'C': 'CONVERSION',    // Conversion of derivative security
      'W': 'INHERIT',       // Acquisition or disposition by will or inheritance
      'U': 'DISPOSITION',   // Disposition pursuant to tender offer
      'D': 'DISPOSITION',   // Disposition to issuer of issuer equity securities
    };
    
    return mappings[code] || 'OTHER';
  }

  /**
   * 🔗 EXTRACT REAL SEC ACCESSION NUMBER
   * Gets the actual accessionNumber from SEC.gov URL
   */
  private extractAccessionFromUrl(secUrl: string): string | undefined {
    try {
      // SEC URLs contain accession numbers in format: /data/1234567/000123456789012345/
      const accessionMatch = secUrl.match(/\/([0-9]{18})\/[^/]*$/);
      if (accessionMatch) {
        const rawAccession = accessionMatch[1];
        // Format as standard accession number: XXXX-XX-XXXXXX
        return `${rawAccession.slice(0, 10)}-${rawAccession.slice(10, 12)}-${rawAccession.slice(12)}`;
      }
      
      // Alternative pattern: Already formatted accession numbers
      const formattedMatch = secUrl.match(/([0-9]{10}-[0-9]{2}-[0-9]{6})/);
      if (formattedMatch) {
        return formattedMatch[1];
      }
      
      return undefined;
    } catch (error) {
      console.log('⚠️ Could not extract accession number from URL:', secUrl);
      return undefined;
    }
  }

  /**
   * 🔍 DETECT NEXT PAGE
   */
  private detectNextPage(html: string): boolean {
    // Look for next page indicators
    return html.includes('>Next</a>') || 
           html.includes('next-page') || 
           html.includes('page-next') ||
           /page\s*\d+/.test(html);
  }

  /**
   * 🆕 FILTER NEW TRADES
   * Removes trades that have already been processed
   */
  private async filterNewTrades(trades: OpenInsiderTrade[]): Promise<OpenInsiderTrade[]> {
    const newTrades: OpenInsiderTrade[] = [];
    
    for (const trade of trades) {
      // Use real accession number if available, otherwise use generated one
      const accessionNumber = trade.realAccessionNumber || 
                             this.generateAccessionNumber(trade);
      
      const existing = await this.findExistingTrade(accessionNumber);
      if (!existing) {
        newTrades.push(trade);
      }
    }
    
    console.log(`🔍 Filtered ${newTrades.length} new trades out of ${trades.length} total`);
    return newTrades;
  }

  /**
   * 💾 PROCESS TRADES
   * Converts and saves trades to database
   */
  private async processTrades(trades: OpenInsiderTrade[]): Promise<number> {
    let processed = 0;
    let errors = 0;

    for (const trade of trades) {
      try {
        const convertedTrade: InsertInsiderTrade = {
          // Use REAL accession number if available
          accessionNumber: trade.realAccessionNumber || this.generateAccessionNumber(trade),
          companyName: trade.companyName,
          ticker: trade.ticker,
          traderName: trade.insiderName,
          traderTitle: trade.title,
          tradeType: trade.tradeType as any,
          transactionCode: trade.transactionCode, // Store original SEC code
          shares: trade.quantity,
          pricePerShare: trade.price,
          totalValue: trade.value,
          ownershipPercentage: this.parseOwnershipPercentage(trade.deltaOwn),
          filedDate: new Date(trade.filingDate),
          significanceScore: this.calculateSignificanceScore(trade),
          signalType: this.determineSignalType(trade.tradeType),
          // PROPER VERIFICATION STATUS - OpenInsider data is unverified
          isVerified: false,
          verificationStatus: 'UNVERIFIED',
          verificationNotes: `Data sourced from OpenInsider.com - requires SEC cross-verification. Original SEC code: ${trade.transactionCode}`,
          secFilingUrl: trade.secUrl,
        };

        const savedTrade = await storage.createInsiderTrade(convertedTrade);
        
        // Broadcast to WebSocket clients
        if (broadcaster) {
          broadcaster('NEW_TRADE', { trade: savedTrade });
        }
        
        processed++;
        console.log(`✅ Processed: ${trade.ticker} - ${trade.insiderName} (${trade.transactionCode}/${trade.tradeType}) - $${trade.value.toLocaleString()}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing trade for ${trade.ticker}:`, error);
      }
    }

    console.log(`📊 Process summary: ${processed} saved, ${errors} errors`);
    return processed;
  }

  // Helper methods (keeping existing ones that work well)
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
    const patterns = [
      /\b([A-Z]{1,5})\b/,
      /([A-Z]{2,5})/,
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
    let name = this.cleanText(text);
    name = name.replace(new RegExp(`\\b${ticker}\\b`, 'gi'), '').trim();
    return name || `${ticker} Corporation`;
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private parseDate(text: string): string | null {
    try {
      const cleaned = text.trim();
      
      if (/\d{4}-\d{2}-\d{2}/.test(cleaned)) {
        return cleaned;
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

  private parsePrice(text: string): number {
    const cleaned = text.replace(/[$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }

  private parseNumber(text: string): number {
    const cleaned = text.replace(/[+,]/g, '');
    const number = parseInt(cleaned);
    return isNaN(number) ? 0 : Math.abs(number);
  }

  private parseValue(text: string): number {
    const cleaned = text.replace(/[+$,]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : Math.abs(number);
  }

  private extractSecUrl(row: string): string | undefined {
    const urlMatch = row.match(/href=["']([^"']*sec\.gov[^"']*)["']/i);
    return urlMatch ? urlMatch[1] : undefined;
  }

  private parseOwnershipPercentage(deltaOwn: string): number {
    if (deltaOwn.toLowerCase().includes('new')) return 0;
    
    const match = deltaOwn.match(/([+-]?\d+(?:\.\d+)?)%/);
    return match ? Math.abs(parseFloat(match[1])) : 0;
  }

  private async findExistingTrade(accessionNumber: string): Promise<any> {
    const recentTrades = await storage.getInsiderTrades(5000);
    return recentTrades.find(existing => 
      existing.accessionNumber === accessionNumber
    );
  }

  private generateAccessionNumber(trade: OpenInsiderTrade): string {
    const ticker = trade.ticker.replace(/[^A-Z0-9]/g, '');
    const name = trade.insiderName.replace(/[^A-Za-z]/g, '').substring(0, 10);
    const date = trade.tradeDate.replace(/[^0-9]/g, '');
    const value = Math.round(trade.value).toString();
    const qty = trade.quantity.toString();
    
    return `openinsider-${ticker}-${name}-${date}-${qty}-${value}`;
  }

  private calculateSignificanceScore(trade: OpenInsiderTrade): number {
    let score = 30;
    
    if (trade.value > 50000000) score += 40;
    else if (trade.value > 10000000) score += 30;
    else if (trade.value > 1000000) score += 20;
    else if (trade.value > 100000) score += 10;
    
    if (trade.tradeType === 'BUY') score += 15;
    else if (trade.tradeType === 'SELL') score += 5;
    
    if (trade.title.toLowerCase().includes('ceo')) score += 15;
    else if (trade.title.toLowerCase().includes('cfo')) score += 10;
    else if (trade.title.toLowerCase().includes('director')) score += 5;
    
    return Math.min(score, 100);
  }

  private determineSignalType(tradeType: string): 'BUY' | 'SELL' | 'HOLD' {
    if (tradeType === 'BUY') return 'BUY';
    if (tradeType === 'SELL') return 'SELL';
    return 'HOLD';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const advancedOpenInsiderCollector = new AdvancedOpenInsiderCollector();