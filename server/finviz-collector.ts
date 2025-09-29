import { storage } from './storage';
import type { InsertInsiderTrade } from '@shared/schema';

// Break circular dependency - broadcaster function will be injected
let broadcaster: ((event: string, data: any) => void) | null = null;

export function setBroadcaster(fn: (event: string, data: any) => void) {
  broadcaster = fn;
}

interface FinvizTrade {
  ticker: string;
  owner: string;
  relationship: string;
  date: string;
  transaction: string;
  cost: number;
  shares: number;
  value: number;
  sharesTotal: number;
  secForm: string;
  secUrl: string;
}

export class FinvizCollector {
  private readonly baseUrl = 'https://finviz.com/insidertrading.ashx';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async collectLatestTrades(limit = 100): Promise<number> {
    console.log('🔍 Starting Finviz insider trading collection...');
    
    try {
      const url = `${this.baseUrl}?tc=7`; // Latest transactions
      console.log(`📡 Fetching from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const trades = this.parseFinvizHTML(html);
      
      console.log(`📊 Parsed ${trades.length} trades from Finviz`);
      
      let processed = 0;
      let duplicates = 0;
      
      for (const trade of trades.slice(0, limit)) {
        try {
          const convertedTrade = this.convertToInsiderTrade(trade);
          
          // Check if trade already exists by generating a unique identifier
          const existingTrade = await this.findExistingTrade(convertedTrade);
          if (existingTrade) {
            duplicates++;
            continue;
          }

          // Save trade to database
          const savedTrade = await storage.createInsiderTrade(convertedTrade);
          
          // Broadcast to WebSocket clients
          if (broadcaster) {
            broadcaster('NEW_TRADE', {
              trade: savedTrade
            });
          }
          
          processed++;
          console.log(`✅ Processed: ${trade.ticker} - ${trade.owner} (${trade.transaction})`);
          
          // Small delay to be respectful
          await this.delay(100);
          
        } catch (error) {
          console.error(`❌ Error processing trade for ${trade.ticker}:`, error);
        }
      }
      
      console.log(`🎉 Finviz collection completed: ${processed} new trades, ${duplicates} duplicates`);
      return processed;
      
    } catch (error) {
      console.error('❌ Finviz collection failed:', error);
      throw error;
    }
  }

  private parseFinvizHTML(html: string): FinvizTrade[] {
    const trades: FinvizTrade[] = [];
    
    try {
      // Find table that contains both quote.ashx ticker links AND sec.gov/Archives links
      // This is the most reliable way to identify the insider trading table
      const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/gs;
      const tableMatches = html.match(tablePattern) || [];
      
      console.log(`🔍 Found ${tableMatches.length} tables to analyze`);
      
      let insiderTable: string | null = null;
      
      for (let i = 0; i < tableMatches.length; i++) {
        const table = tableMatches[i];
        const hasQuoteLinks = /href=["'][^"']*quote\.ashx\?t=[A-Z]+["']/g.test(table);
        const hasSecLinks = /href=["'][^"']*sec\.gov\/(edgar\/browse|edgar\/data|Archives)[^"']*["']/gi.test(table);
        const hasTickerText = /\b[A-Z]{2,5}\b/.test(table); // Look for ticker-like text with word boundaries
        const hasInsiderKeywords = table.includes('Ticker') || table.includes('Owner') || table.includes('Transaction');
        
        console.log(`📊 Table ${i + 1}: Quote links=${hasQuoteLinks}, SEC links=${hasSecLinks}, Ticker text=${hasTickerText}, Keywords=${hasInsiderKeywords}`);
        
        // Debug: If this is table 4 (the one with SEC links), show more details
        if (i === 3 && hasSecLinks) {
          const tableSnippet = table.substring(0, 300);
          console.log(`🔍 Table 4 snippet: ${tableSnippet}...`);
        }
        
        // First preference: Both quote and SEC links
        if (hasQuoteLinks && hasSecLinks) {
          insiderTable = table;
          console.log(`✅ Found insider trading table with both links: Table ${i + 1}`);
          break;
        }
        
        // Second preference: SEC links with ticker-like text OR insider keywords (fallback)
        if (hasSecLinks && (hasTickerText || hasInsiderKeywords) && !insiderTable) {
          insiderTable = table;
          console.log(`✅ Found insider trading table with SEC links: Table ${i + 1} (fallback)`);
          // Don't break, keep looking for better match
        }
      }
      
      if (!insiderTable) {
        console.error('❌ Could not find insider trading table');
        // Debug: Save first table for analysis
        if (tableMatches.length > 0) {
          const firstTable = tableMatches[0].substring(0, 500);
          console.log(`🔍 First table sample: ${firstTable}...`);
        }
        return [];
      }
      
      // Extract all table rows from the insider table
      const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gs;
      const rowMatches = insiderTable.match(rowPattern) || [];
      
      console.log(`📊 Found ${rowMatches.length} rows in insider trading table`);
      
      // Skip header row and parse data rows
      for (let i = 1; i < rowMatches.length; i++) {
        const row = rowMatches[i];
        
        // Skip header rows
        if (this.isHeaderRow(row)) continue;
        
        const trade = this.parseTableRowAdvancedRegex(row);
        if (trade && this.isValidTicker(trade.ticker)) {
          trades.push(trade);
          console.log(`✅ Parsed valid trade: ${trade.ticker} - ${trade.owner} (${trade.transaction})`);
        } else if (i <= 3) {
          // Log first 3 failed rows for debugging
          const cells = this.extractCellTexts(row);
          console.log(`❌ Row ${i} failed validation: [${cells.slice(0, 5).join(', ')}...]`);
        }
      }
      
      console.log(`🎉 Successfully parsed ${trades.length} trades from Finviz HTML`);
      return trades;
      
    } catch (error) {
      console.error('❌ Error parsing Finviz HTML:', error);
      return [];
    }
  }

  private parseTableRowAdvancedRegex(row: string): FinvizTrade | null {
    try {
      // Extract ticker from quote.ashx link (most reliable method)
      let tickerMatch = row.match(/href=["'][^"']*quote\.ashx\?t=([A-Z0-9\.\-]+)[^"']*["']/i);
      let ticker = tickerMatch ? tickerMatch[1] : '';
      
      // Fallback: Extract ticker from cell text if no quote link
      if (!ticker) {
        const cells = this.extractCellTexts(row);
        if (cells.length > 0) {
          // Extract ticker from complex cell text (e.g., "CorMedix IncBiotechnology • USA • 965.97M")
          let firstCell = cells[0];
          
          // Remove common noise patterns
          firstCell = firstCell.replace(/\s*•\s*(USA|Canada|UK)\s*•\s*/gi, ' ');
          firstCell = firstCell.replace(/\s*•\s*[\d\.\s\w]*[MBK]?\s*\]/gi, '');
          firstCell = firstCell.replace(/\]\s*offsetx=.*$/gi, '');
          
          // Stopwords to exclude
          const stopwords = ['USA', 'NEWS', 'HOME', 'SCREENER', 'INC', 'CORP', 'LLC', 'LTD'];
          
          // Try multiple patterns to extract ticker
          const patterns = [
            /^([A-Z]{1,5})(?:\s|,|$)/,     // Start of cell, followed by space/comma/end
            /\b([A-Z]{2,5})\b/,            // Word boundaries, 2-5 chars
            /([A-Z]{1,5})(?:\s*-\s*)/      // Ticker followed by dash (common format)
          ];
          
          for (const pattern of patterns) {
            const match = firstCell.match(pattern);
            if (match && match[1] && /^[A-Z]{1,5}$/.test(match[1]) && !stopwords.includes(match[1])) {
              ticker = match[1];
              break;
            }
          }
        }
      }
      
      // If no ticker found, skip this row
      if (!ticker) {
        return null;
      }
      
      // Extract cell texts
      const cells = this.extractCellTexts(row);
      
      if (cells.length < 9) {
        console.log(`❌ Row has insufficient cells: ${cells.length} (need 9+)`);
        return null;
      }
      
      // Map cells to data fields - adjust indices based on actual table structure
      const owner = cells[1] || '';
      const relationship = cells[2] || '';
      const date = cells[3] || '';
      const transaction = cells[4] || '';
      const costText = cells[5] || '';
      const sharesText = cells[6] || '';
      const valueText = cells[7] || '';
      const sharesTotalText = cells[8] || '';
      const secFormText = cells[9] || '';
      
      // Extract SEC URL from the row
      const secUrlMatch = row.match(/href=["']([^"']*sec\.gov\/Archives[^"']*\.xml)["']/);
      let secUrl = secUrlMatch ? secUrlMatch[1] : '';
      if (secUrl && !secUrl.startsWith('http')) {
        secUrl = `https://www.sec.gov${secUrl}`;
      }
      
      // Enhanced validation
      if (!this.isValidTicker(ticker) || 
          !owner || owner.length < 2 || 
          !transaction || 
          !date || 
          !this.isValidDate(date)) {
        console.log(`❌ Validation failed: ticker="${ticker}", owner="${owner}", date="${date}", transaction="${transaction}"`);
        return null;
      }
      
      // Parse numeric values
      const cost = this.parseNumber(costText);
      const shares = this.parseNumber(sharesText);
      const value = this.parseNumber(valueText);
      const sharesTotal = this.parseNumber(sharesTotalText);
      
      return {
        ticker,
        owner,
        relationship,
        date,
        transaction,
        cost,
        shares,
        value,
        sharesTotal,
        secForm: secFormText,
        secUrl
      };
      
    } catch (error) {
      console.error('❌ Error parsing table row with advanced regex:', error);
      return null;
    }
  }

  private extractCellTexts(row: string): string[] {
    const cellPattern = /<td[^>]*>(.*?)<\/td>/gs;
    const cells: string[] = [];
    let match;
    
    while ((match = cellPattern.exec(row)) !== null) {
      const cellText = match[1]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      cells.push(cellText);
    }
    
    return cells;
  }

  private isValidTicker(ticker: string): boolean {
    // Validate ticker symbol (typically 1-5 uppercase letters, sometimes with numbers)
    if (!ticker) return false;
    const tickerRegex = /^[A-Z]{1,5}[0-9]?$/;
    return tickerRegex.test(ticker) && 
           ticker !== 'HOME' && 
           ticker !== 'NEWS' && 
           ticker !== 'SCREENER';
  }

  private isHeaderRow(row: string): boolean {
    return row.includes('Ticker') || 
           row.includes('Owner') || 
           row.includes('Relationship') ||
           row.includes('<th') ||
           !row.includes('<td');
  }


  private isValidDate(dateStr: string): boolean {
    // Check if date looks like a valid format (e.g., "Sep 12 '25", "Sep 12")
    const datePatterns = [
      /^[A-Z][a-z]{2}\s+\d{1,2}\s+'?\d{2,4}$/,  // Sep 12 '25 or Sep 12 2025
      /^[A-Z][a-z]{2}\s+\d{1,2}$/,              // Sep 12
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,            // 9/12/25
      /^\d{4}-\d{2}-\d{2}$/                     // 2025-09-12
    ];
    
    return datePatterns.some(pattern => pattern.test(dateStr));
  }

  private parseNumber(text: string): number {
    // Remove commas, dollar signs, and other formatting
    const cleaned = text.replace(/[\$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private convertToInsiderTrade(trade: FinvizTrade): InsertInsiderTrade {
    // Parse date (format: "Sep 12 '25")
    const filedDate = this.parseFinvizDate(trade.date);
    
    // Map transaction types
    const tradeType = this.mapTradeType(trade.transaction);
    
    // Generate accession number from available data
    const accessionNumber = this.generateAccessionNumber(trade);
    
    // Calculate price per share
    const pricePerShare = trade.shares > 0 ? trade.value / trade.shares : trade.cost;
    
    return {
      accessionNumber,
      companyName: this.getCompanyNameFromTicker(trade.ticker),
      ticker: trade.ticker,
      traderName: trade.owner,
      traderTitle: trade.relationship,
      tradeType,
      shares: trade.shares,
      pricePerShare,
      totalValue: trade.value,
      ownershipPercentage: trade.sharesTotal > 0 ? (trade.shares / trade.sharesTotal) * 100 : 0,
      filedDate,
      isVerified: true, // Finviz data is already verified
      verificationStatus: 'VERIFIED',
      verificationNotes: 'Data sourced from Finviz.com',
      secFilingUrl: trade.secUrl,
      aiAnalysis: null,
      significanceScore: this.calculateSignificanceScore(trade),
      signalType: this.determineSignalType(trade)
    };
  }

  private parseFinvizDate(dateStr: string): Date {
    try {
      // Handle various date formats from Finviz
      let normalized = dateStr;

      // Format: "Sep 12 '25" -> "Sep 12 2025"
      if (normalized.includes("'")) {
        normalized = normalized.replace(/'(\d{2})/, '20$1');
      }

      // If just "Sep 12", add current year
      if (/^[A-Z][a-z]{2}\s+\d{1,2}$/.test(normalized)) {
        normalized += ` ${new Date().getFullYear()}`;
      }

      const parsed = new Date(normalized);

      // If parsing fails, try alternative approaches
      if (isNaN(parsed.getTime())) {
        // Try manual month parsing
        const monthMatch = normalized.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{4})$/);
        if (monthMatch) {
          const [, monthStr, day, year] = monthMatch;
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };

          if (monthMap[monthStr] !== undefined) {
            // Set to market close time (4:00 PM EST = 21:00 UTC)
            const date = new Date(Date.UTC(parseInt(year), monthMap[monthStr], parseInt(day), 21, 0, 0));
            return date;
          }
        }

        console.warn(`⚠️ Could not parse date: ${dateStr}, using current date with market time`);
        const now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0));
      }

      // Set to market close time (4:00 PM EST = 21:00 UTC) instead of midnight
      const marketTime = new Date(parsed);
      marketTime.setUTCHours(21, 0, 0, 0); // 4:00 PM EST
      return marketTime;
    } catch (error) {
      console.warn(`⚠️ Date parsing error for "${dateStr}":`, error);
      const now = new Date();
      return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0));
    }
  }

  private mapTradeType(transaction: string): 'BUY' | 'SELL' | 'TRANSFER' {
    const lower = transaction.toLowerCase();
    if (lower.includes('buy') || lower.includes('purchase')) return 'BUY';
    if (lower.includes('sale') || lower.includes('sell')) return 'SELL';
    if (lower.includes('option exercise')) return 'BUY'; // Options usually converted to stock
    return 'TRANSFER'; // Default for other types
  }

  private generateAccessionNumber(trade: FinvizTrade): string {
    // Create a unique identifier based on available data
    const dateStr = trade.date.replace(/[^a-zA-Z0-9]/g, '');
    const ticker = trade.ticker;
    const owner = trade.owner.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const value = Math.floor(trade.value).toString();
    
    return `finviz-${ticker}-${owner}-${dateStr}-${value}`;
  }

  private getCompanyNameFromTicker(ticker: string): string {
    // Simple mapping for now - in production, you'd want a ticker-to-company lookup
    const companyMap: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'CRMD': 'CorMedix Inc.',
      'DRRX': 'DURECT CORP'
    };
    
    return companyMap[ticker] || `${ticker} Corp.`;
  }

  private calculateSignificanceScore(trade: FinvizTrade): number {
    // Simple scoring based on trade value
    if (trade.value > 10000000) return 90; // $10M+
    if (trade.value > 5000000) return 80;  // $5M+
    if (trade.value > 1000000) return 70;  // $1M+
    if (trade.value > 500000) return 60;   // $500K+
    if (trade.value > 100000) return 50;   // $100K+
    return 40; // Below $100K
  }

  private determineSignalType(trade: FinvizTrade): 'BUY' | 'SELL' | 'HOLD' {
    const tradeType = this.mapTradeType(trade.transaction);
    if (tradeType === 'BUY') return 'BUY';
    if (tradeType === 'SELL') return 'SELL';
    return 'HOLD';
  }

  private async findExistingTrade(trade: InsertInsiderTrade): Promise<any> {
    try {
      // Check for existing trade by accession number
      const trades = await storage.getInsiderTrades(1000, 0, false);
      return trades.find(t => t.accessionNumber === trade.accessionNumber);
    } catch (error) {
      console.error('Error checking for existing trade:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const finvizCollector = new FinvizCollector();