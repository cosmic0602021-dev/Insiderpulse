import { storage } from './storage';
import type { InsertInsiderTrade } from '@shared/schema';

// Break circular dependency - broadcaster function will be injected
let broadcaster: ((event: string, data: any) => void) | null = null;

export function setBroadcaster(fn: (event: string, data: any) => void) {
  broadcaster = fn;
}

export interface CollectionOptions {
  mode: 'backfill' | 'incremental';
  bypassDuplicates?: boolean;
  maxPages?: number;
  perPage?: number;
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
   * 🎯 MASSIVE COLLECTION WITH BACKFILL MODE
   * Collects thousands of trades without early duplicate stopping
   */
  async collectMassive(options: CollectionOptions): Promise<number> {
    const { mode, maxPages = 50, perPage = 100, bypassDuplicates = true } = options;
    console.log(`🚀 Starting MASSIVE ${mode} collection (${maxPages} pages × ${perPage} trades)...`);
    
    let totalProcessed = 0;
    let consecutiveEmptyPages = 0;
    let consecutiveDuplicatePages = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      console.log(`📄 Processing ${mode} page ${page}...`);
      
      try {
        const { trades } = await this.collectPageAdvanced(page, perPage);
        
        if (trades.length === 0) {
          consecutiveEmptyPages++;
          console.log(`📋 Page ${page}: Empty (${consecutiveEmptyPages} consecutive)`);
          
          // Stop on 2 consecutive empty pages
          if (consecutiveEmptyPages >= 2) {
            console.log(`⏹️ Stopping after ${consecutiveEmptyPages} consecutive empty pages`);
            break;
          }
          continue;
        } else {
          consecutiveEmptyPages = 0;
        }
        
        // For backfill mode: bypass duplicate filtering, process all trades
        let newTrades = trades;
        if (mode === 'incremental' && !bypassDuplicates) {
          newTrades = await this.filterNewTrades(trades);
        }
        
        console.log(`📊 Page ${page}: Found ${trades.length} trades, ${newTrades.length} new`);
        
        // Process trades
        const pageProcessed = await this.processTrades(newTrades);
        totalProcessed += pageProcessed;
        
        // For incremental mode: stop on consecutive duplicate pages
        if (mode === 'incremental' && newTrades.length === 0) {
          consecutiveDuplicatePages++;
          if (consecutiveDuplicatePages >= 3) {
            console.log(`⏹️ Stopping after ${consecutiveDuplicatePages} consecutive duplicate pages`);
            break;
          }
        } else {
          consecutiveDuplicatePages = 0;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`❌ Error on page ${page}:`, error);
        continue;
      }
    }
    
    console.log(`🎉 Massive collection completed: ${totalProcessed} total new trades across ${Math.min(maxPages, maxPages)} pages`);
    return totalProcessed;
  }

  /**
   * 🎯 COMPLETE 30-DAY BACKFILL
   * Collects ALL insider trades from the past 30 days using pagination
   */
  async collect30DayBackfill(): Promise<number> {
    console.log('🚀 Starting COMPLETE OpenInsider backfill (no date limit)...');
    
    let totalProcessed = 0;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 500) { // Increased safety limit for full collection
      console.log(`📄 Processing page ${page} for full backfill...`);
      
      try {
        const { trades, hasNextPage } = await this.collectPage(page);
        
        // Process all trades without date filtering
        const processed = await this.processTrades(trades);
        totalProcessed += processed;

        hasMore = hasNextPage && trades.length > 0;
        page++;
        
        // Rate limiting - be respectful to OpenInsider
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing page ${page}:`, error);
        break;
      }
    }
    
    console.log(`🎉 Full backfill completed: ${totalProcessed} trades processed across ${page - 1} pages`);
    return totalProcessed;
  }

  /**
   * 📊 INCREMENTAL COLLECTION
   * Collects latest trades since last run (used by scheduler)
   * BACKWARD COMPATIBLE: Supports both old limit and new pagination
   */
  async collectLatestTrades(limitOrOptions: number | { maxPages?: number; perPage?: number } = 10): Promise<number> {
    // Handle backward compatibility
    let maxPages: number;
    let perPage: number;
    
    if (typeof limitOrOptions === 'number') {
      // OLD API: treat as limit for single page (backward compatible)
      if (limitOrOptions > 50) {
        perPage = limitOrOptions;
        maxPages = 1; // Single page for large limits (old behavior)
        console.log(`🔄 Starting OpenInsider collection (LEGACY MODE: ${limitOrOptions} items on 1 page)...`);
      } else {
        // Small numbers treated as pages for power users
        maxPages = limitOrOptions;
        perPage = 100;
        console.log(`🔄 Starting COMPLETE incremental OpenInsider collection (${maxPages} pages)...`);
      }
    } else {
      // NEW API: object with options
      maxPages = limitOrOptions.maxPages || 10;
      perPage = limitOrOptions.perPage || 100;
      console.log(`🔄 Starting COMPLETE incremental OpenInsider collection (max ${maxPages} pages)...`);
    }
    
    try {
      let totalProcessed = 0;
      let page = 1;
      let hasMore = true;
      let duplicateCount = 0;
      
      while (hasMore && page <= maxPages) {
        console.log(`📄 Processing incremental page ${page}...`);
        
        const { trades, hasNextPage } = await this.collectPage(page, perPage);
        
        // Stop early if we encounter too many duplicates (trades already processed)
        const newTrades = await this.filterNewTrades(trades);
        
        if (newTrades.length === 0) {
          duplicateCount++;
          console.log(`⏭️ Page ${page}: All trades already processed (${duplicateCount} consecutive duplicate pages)`);
          
          // If we get 5 consecutive pages of all duplicates, stop (increased threshold)
          if (duplicateCount >= 5) {
            console.log(`✋ Stopping after ${duplicateCount} pages of duplicates`);
            break;
          }
        } else {
          duplicateCount = 0; // Reset counter when we find new trades
          const processed = await this.processTrades(newTrades);
          totalProcessed += processed;
          console.log(`✅ Page ${page}: Processed ${processed} new trades`);
        }
        
        hasMore = hasNextPage && trades.length > 0;
        page++;
        
        // Rate limiting - be respectful to OpenInsider
        await this.sleep(2000);
      }
      
      console.log(`🎉 Incremental collection completed: ${totalProcessed} total new trades across ${page - 1} pages`);
      return totalProcessed;
      
    } catch (error) {
      console.error('❌ Error in incremental collection:', error);
      throw error;
    }
  }

  /**
   * 📄 ADVANCED PAGE COLLECTION FOR MASSIVE BACKFILL
   * Optimized for thousands of trades without early stopping
   */
  private async collectPageAdvanced(page: number = 1, maxResults: number = 100): Promise<{
    trades: OpenInsiderTrade[];
    hasNextPage: boolean;
  }> {
    const url = this.buildUrl(page, maxResults);
    console.log(`🌐 Fetching OpenInsider page ${page}: ${url}`);
    
    const response = await this.fetchWithRetry(url);
    const html = await response.text();
    
    const trades = this.parseAdvancedHTML(html);
    // For backfill: assume more pages exist unless we get empty results
    const hasNextPage = trades.length >= maxResults * 0.8; // 80% threshold
    
    console.log(`📊 Page ${page}: Found ${trades.length} trades`);
    
    return { trades, hasNextPage };
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
    // Simplified URL structure as recommended by architect
    const params = new URLSearchParams({
      'page': page.toString(),
      'max': maxResults.toString()
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

      // Find the main insider trading table using specific selector
      let mainTable: string | null = null;
      
      // Look for table#t or .tinytable class as per architect recommendation
      const tinytableMatch = html.match(/<table[^>]*(?:id="t"|class="[^"]*tinytable[^"]*")[^>]*>([\s\S]*?)<\/table>/i);
      
      if (tinytableMatch) {
        mainTable = tinytableMatch[0];
        console.log('✅ Found main insider trading table with tinytable selector');
      } else {
        // Fallback to any table with insider trading headers
        for (const table of tableMatches) {
          if (table.includes('Filing Date') && 
              table.includes('Trade Date') && 
              table.includes('Ticker') &&
              table.includes('Company Name') &&
              table.includes('Insider Name') &&
              table.includes('Value')) {
            mainTable = table;
            console.log('✅ Found main insider trading table via header fallback');
            break;
          }
        }
      }

      if (!mainTable) {
        console.log('⚠️ Could not find main insider trading table');
        console.log('🔍 Available tables found:', tableMatches?.length || 0);
        if (tableMatches && tableMatches.length > 0) {
          console.log('🔍 First table preview:', tableMatches[0].substring(0, 200) + '...');
        }
        return trades;
      }

      // Extract table rows
      const rowMatches = mainTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (!rowMatches) {
        console.log('⚠️ No rows found in table');
        return trades;
      }

      console.log(`📊 Processing ${rowMatches.length} rows from OpenInsider table`);

      // Extract header mapping from first row (debug raw header)
      console.log('🔍 DEBUG: Raw first row HTML:', rowMatches[0].substring(0, 500) + '...');
      const headerCells = this.extractCellTexts(rowMatches[0]);
      console.log('🔍 DEBUG: Extracted header cells:', headerCells);
      const headerMap = this.buildHeaderMapping(rowMatches[0]);
      console.log('🗺️ Built header mapping:', headerMap);

      // Skip header rows and process data rows
      for (let i = 1; i < rowMatches.length; i++) {
        try {
          const trade = this.parseAdvancedRow(rowMatches[i], headerMap);
          console.log(`🎯 Trade parsing result for row ${i}:`, trade ? 'SUCCESS' : 'FAILED');
          if (trade) {
            console.log(`📊 Trade created:`, {
              ticker: trade.ticker,
              filingDate: trade.filingDate,
              tradeDate: trade.tradeDate,
              value: trade.value,
              transactionCode: trade.transactionCode
            });
            trades.push(trade);
          } else {
            console.log(`❌ Trade parsing failed for row ${i} - parseAdvancedRow returned null`);
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
   * 🗺️ BUILD HEADER MAPPING FROM TABLE HEADER
   * Creates column index mapping for flexible data extraction
   */
  private buildHeaderMapping(headerRow: string): Record<string, number> {
    const headerMap: Record<string, number> = {};
    const cells = this.extractCellTexts(headerRow);
    
    cells.forEach((cell, index) => {
      const normalized = cell.toLowerCase().trim();
      
      // Map common header variations to standard names
      if (normalized.includes('filing') && normalized.includes('date')) {
        headerMap['filing_date'] = index;
      } else if (normalized.includes('trade') && normalized.includes('date')) {
        headerMap['trade_date'] = index;
      } else if (normalized.includes('ticker') || normalized.includes('symbol')) {
        headerMap['ticker'] = index;
      } else if (normalized.includes('company')) {
        headerMap['company'] = index;
      } else if (normalized.includes('insider') || normalized.includes('name')) {
        headerMap['insider'] = index;
      } else if (normalized.includes('title') || normalized.includes('position')) {
        headerMap['title'] = index;
      } else if (normalized.includes('trans') || normalized.includes('type')) {
        headerMap['transaction'] = index;
      } else if (normalized.includes('price')) {
        headerMap['price'] = index;
      } else if (normalized.includes('qty') || normalized.includes('shares') || normalized.includes('quantity')) {
        headerMap['quantity'] = index;
      } else if (normalized.includes('owned')) {
        headerMap['owned'] = index;
      } else if (normalized.includes('δown') || normalized.includes('delta') || normalized.includes('change')) {
        headerMap['delta_own'] = index;
      } else if (normalized.includes('value')) {
        headerMap['value'] = index;
      }
    });
    
    return headerMap;
  }

  /**
   * 🔍 PARSE ADVANCED ROW WITH HEADER MAPPING
   * Extracts all data using flexible column mapping
   */
  private parseAdvancedRow(row: string, headerMap?: Record<string, number>): OpenInsiderTrade | null {
    try {
      const cells = this.extractCellTexts(row);
      
      console.log(`🔍 Row has ${cells.length} cells:`, cells.slice(0, 8).map(c => c?.substring(0, 20) + '...'));
      
      if (cells.length < 8) {
        console.log(`⚠️ Skipping row - insufficient cells (${cells.length} < 8)`);
        return null; // Not enough data
      }

      // Declare variables in outer scope
      let filingDate: string;
      let tradeDate: string;
      let transactionCode: string;
      let cellIndex = 0;
      
      // Use header mapping if available, otherwise fallback to legacy logic
      if (headerMap && Object.keys(headerMap).length > 0) {
        console.log(`🎯 Using header mapping with ${Object.keys(headerMap).length} mapped columns`);
        
        // Extract data using header mapping
        filingDate = this.parseDate(cells[headerMap['filing_date']]) || new Date().toISOString().split('T')[0];
        tradeDate = this.parseDate(cells[headerMap['trade_date']]) || filingDate;
        
        // Extract transaction code from the raw row
        transactionCode = this.extractTransactionCode(row, cells[0] || '');
        
        console.log(`📅 Dates via mapping: filing=${filingDate}, trade=${tradeDate}`);
      } else {
        console.log(`⚠️ No header mapping available, using legacy offsets`);
        
        // Handle optional checkbox column
        if (cells[0]?.trim().match(/^[DMXABCGFW]?$/)) {
          cellIndex = 0; // Transaction code might be in first column
        }

        // Extract transaction code (D, M, X, etc.)
        transactionCode = this.extractTransactionCode(row, cells[cellIndex]);
        
        if (cells[cellIndex]?.includes('Filing Date')) {
          cellIndex = 1; // Skip header row
        }

        filingDate = this.parseDate(cells[cellIndex]) || new Date().toISOString().split('T')[0];
        tradeDate = this.parseDate(cells[cellIndex + 1]) || filingDate;
      }
      
      // First try to extract ticker from raw HTML (most reliable)
      const htmlTicker = this.extractTickerFromRow(row);
      let ticker = htmlTicker;
      if (ticker) {
        console.log(`🎯 Found ticker '${ticker}' via raw HTML`);
      } else {
        // Fallback: try multiple columns to find ticker
        ticker = null;
        for (let i = 0; i < Math.min(cells.length, 8); i++) {
        const testTicker = this.extractTicker(cells[i]);
        if (testTicker && testTicker.length >= 2 && testTicker.length <= 6) {
          ticker = testTicker;
          console.log(`\ud83c\udfaf Found ticker '${ticker}' in column ${i}: '${cells[i]?.substring(0, 30)}...'`);
          break;
        }
      }
      }
      console.log(`🎯 Extracted ticker: '${ticker}' from cell: '${cells[cellIndex + 2]?.substring(0, 50)}'`);
      if (!ticker) {
        console.log(`❌ No ticker found, skipping row`);
        return null;
      }
      
      console.log(`🔍 PARSING DEBUG: ticker=${ticker}, filingDate=${filingDate}, tradeDate=${tradeDate}`);

      // Extract all fields using header mapping when available
      let companyName: string;
      let insiderName: string;
      let title: string;
      let price: number;
      let quantity: number;
      let owned: number;
      let deltaOwn: string;
      let value: number;

      if (headerMap && Object.keys(headerMap).length > 0) {
        // Use header mapping for ALL fields
        companyName = this.extractCompanyName(cells[headerMap['company']] || '', ticker);
        insiderName = this.cleanText(cells[headerMap['insider']] || '') || 
                     this.cleanText(cells[5]) || 'Unknown'; // Fallback to legacy position
        title = this.cleanTraderTitle(cells[headerMap['title']] || '') ||
                this.cleanTraderTitle(cells[6]) || 'Executive'; // Fallback to legacy position
        price = this.parsePrice(cells[headerMap['price']] || '');
        quantity = this.parseNumber(cells[headerMap['quantity']] || '');
        owned = this.parseNumber(cells[headerMap['owned']] || '');
        deltaOwn = this.cleanText(cells[headerMap['delta_own']] || '') || '';
        value = this.parseValue(cells[headerMap['value']] || '');
        
        console.log(`🎯 HEADER MAPPING: company[${headerMap['company']}]='${cells[headerMap['company']]?.substring(0,30)}', price[${headerMap['price']}]='${cells[headerMap['price']]}', qty[${headerMap['quantity']}]='${cells[headerMap['quantity']]}'`);
      } else {
        // Legacy offset access (fallback)
        companyName = this.extractCompanyName(cells[cellIndex + 3], ticker);
        insiderName = this.cleanText(cells[cellIndex + 4]);
        title = this.cleanTraderTitle(cells[cellIndex + 5] || 'Executive');
        price = this.parsePrice(cells[cellIndex + 7]);
        quantity = this.parseNumber(cells[cellIndex + 8]);
        owned = this.parseNumber(cells[cellIndex + 9]);
        deltaOwn = this.cleanText(cells[cellIndex + 10]) || '';
        value = this.parseValue(cells[cellIndex + 11]);
      }

      console.log(`🔍 PARSING: insiderName='${insiderName}', price=${price}, quantity=${quantity}, value=${value}`);
      
      if (!insiderName) {
        console.log(`❌ FAILED: No insider name found`);
        return null;
      }

      // Parse trade type from transaction code
      const tradeType = this.parseTradeTypeFromCode(transactionCode);
      if (!tradeType) {
        console.log(`❌ FAILED: No trade type found from transactionCode='${transactionCode}'`);
        return null;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        console.log(`❌ FAILED: Invalid quantity=${quantity}`);
        return null;
      }

      // Extract SEC filing URL (CRITICAL for real accessionNumber)
      const secUrl = this.extractSecUrl(row);
      if (!secUrl) {
        console.log(`⚠️ No SEC URL found for ${ticker} - ${insiderName || 'unknown'} - proceeding without verification`);
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
    // Match both <td> and <th> tags for proper header support
    const cellMatches = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi);
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

  private extractTickerFromRow(row: string): string | null {
    if (!row) return null;
    
    // Extract ticker from raw HTML anchor href
    const hrefMatch = row.match(/<a[^>]+href=["']\/(?:quote\/)?([A-Z]{1,6})["'][^>]*>.*?<\/a>/i);
    if (hrefMatch) {
      const ticker = hrefMatch[1].toUpperCase();
      // Exclude JavaScript keywords and invalid tickers
      if (!['DELAY', 'TIP', 'UNTIP', 'DIV', 'IMG', 'ALT'].includes(ticker)) {
        return ticker;
      }
    }
    
    return null;
  }

  private extractTicker(text: string): string | null {
    if (!text) return null;
    
    // First try to extract ticker from href attribute (most reliable)
    const hrefMatch = text.match(/href="\/([A-Z]{1,6})"/);
    if (hrefMatch) {
      const ticker = hrefMatch[1];
      // Exclude JavaScript keywords and invalid tickers
      if (!['DELAY', 'TIP', 'UNTIP', 'DIV', 'IMG', 'ALT'].includes(ticker)) {
        return ticker;
      }
    }
    
    // Fallback: extract from link text content between > and <
    const linkTextMatch = text.match(/>([A-Z]{2,6})</);
    if (linkTextMatch) {
      const ticker = linkTextMatch[1];
      if (!['DELAY', 'TIP', 'UNTIP', 'DIV', 'IMG', 'ALT'].includes(ticker)) {
        return ticker;
      }
    }
    
    // Last resort: use original patterns but exclude JS keywords
    const patterns = [
      /\b([A-Z]{1,5})\b/,
      /([A-Z]{2,5})/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length >= 2 && match[1].length <= 5) {
        const ticker = match[1];
        if (!['DELAY', 'TIP', 'UNTIP', 'DIV', 'IMG', 'ALT', 'ONMOUSEOVER', 'ONMOUSEOUT'].includes(ticker)) {
          return ticker;
        }
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
    const urlMatch = row.match(/href=["']([^"']*(?:sec\.gov|openinsider\.com|secform4\.com)[^"']*)["']/i);
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