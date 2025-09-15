import { storage } from "./storage";
import { SecHttpClient } from "./sec-http-client";
import { parseSecForm4 } from "./sec-parser";
import { validateAndAnalyzeTrade } from "./trade-analyzer";
import { z } from "zod";

// SEC Full-Text Search API response schema
const SECSearchResultSchema = z.object({
  hits: z.object({
    total: z.object({
      value: z.number(),
      relation: z.string()
    }),
    hits: z.array(z.object({
      _source: z.object({
        adsh: z.string(),
        ciks: z.array(z.union([z.string(), z.number()])).transform(a => a.map(String)),
        display_names: z.array(z.string()),
        file_num: z.union([z.string(), z.array(z.string())]).optional(),
        file_date: z.union([z.string(), z.array(z.string())]).transform(v => Array.isArray(v) ? v[0] : v),
        form: z.union([z.string(), z.array(z.string())]).transform(v => Array.isArray(v) ? v[0] : v),
        ticker: z.array(z.string()).optional(),
        tickers: z.array(z.string()).optional()
      }).transform(s => ({ ...s, ticker: s.ticker ?? s.tickers ?? [] }))
    }))
  })
});

interface HistoricalCollectionProgress {
  startDate: string;
  endDate: string;
  totalFound: number;
  processed: number;
  failed: number;
  lastProcessedDate?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  lastError?: string;
}

export class HistoricalSecCollector {
  private httpClient: SecHttpClient;
  private progress: HistoricalCollectionProgress | null = null;

  constructor() {
    this.httpClient = new SecHttpClient();
  }

  async collectHistoricalData(months = 6): Promise<HistoricalCollectionProgress> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    this.progress = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalFound: 0,
      processed: 0,
      failed: 0,
      status: 'running'
    };

    console.log(`🕰️ Starting historical collection for ${months} months (${this.progress.startDate} to ${this.progress.endDate})`);

    try {
      // Collect data in monthly chunks to avoid overwhelming the API
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate && this.progress.status === 'running') {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0); // Last day of the month
        
        if (monthEnd > endDate) {
          monthEnd.setTime(endDate.getTime());
        }

        console.log(`📅 Processing month: ${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`);
        
        await this.collectForDateRange(monthStart, monthEnd);
        
        this.progress.lastProcessedDate = monthEnd.toISOString().split('T')[0];
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
        
        // Add delay between months to be respectful to SEC
        if (currentDate <= endDate) {
          console.log('⏳ Waiting 5 seconds before next month...');
          await this.delay(5000);
        }
      }

      if (this.progress.status === 'running') {
        this.progress.status = 'completed';
        console.log(`✅ Historical collection completed: ${this.progress.processed} trades processed, ${this.progress.failed} failed`);
      }

    } catch (error) {
      console.error('❌ Historical collection failed:', error);
      this.progress.status = 'failed';
      this.progress.lastError = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.progress;
  }

  private async collectForDateRange(startDate: Date, endDate: Date): Promise<void> {
    let from = 0;
    const size = 100; // Results per page
    let hasMore = true;

    while (hasMore && this.progress?.status === 'running') {
      try {
        const searchResults = await this.searchSecFilings(startDate, endDate, from, size);
        
        if (searchResults.hits.hits.length === 0) {
          hasMore = false;
          break;
        }

        this.progress.totalFound = searchResults.hits.total.value;

        console.log(`📄 Processing batch: ${from + 1}-${from + searchResults.hits.hits.length} of ${this.progress.totalFound} found`);

        for (const hit of searchResults.hits.hits) {
          try {
            await this.processSecFiling(hit._source);
            this.progress.processed++;
          } catch (error) {
            console.error(`❌ Failed to process filing ${hit._source.adsh}:`, error);
            this.progress.failed++;
          }

          // Add small delay between filings
          await this.delay(1000);
        }

        from += size;
        hasMore = searchResults.hits.hits.length === size;

        // Check if we should pause due to SEC blocking
        if (this.httpClient.isBlocked()) {
          console.log('⏸️ Pausing collection due to SEC rate limiting');
          this.progress.status = 'paused';
          break;
        }

      } catch (error) {
        console.error('❌ Error in batch processing:', error);
        
        if (error instanceof Error && error.message.includes('SEC_BLOCKED')) {
          console.log('⏸️ Pausing collection due to SEC blocking');
          this.progress.status = 'paused';
          break;
        }
        
        this.progress.failed++;
        await this.delay(5000); // Wait longer on error
      }
    }
  }

  private async searchSecFilings(startDate: Date, endDate: Date, from: number, size: number) {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Try SEC EDGAR search API with URL parameters approach
    const queryParams = new URLSearchParams({
      'dateRange': 'custom',
      'startdt': startDateStr,
      'enddt': endDateStr,
      'forms': '4',
      'from': from.toString(),
      'size': size.toString()
    });

    const url = `https://efts.sec.gov/LATEST/search-index?${queryParams.toString()}`;
    
    console.log(`🔍 Searching SEC filings: ${startDateStr} to ${endDateStr} (from: ${from}, size: ${size})`);
    console.log(`🔍 [DEBUG] Search URL:`, url);

    const response = await this.httpClient.request({
      method: 'GET',
      url: url,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InsiderTrack Pro 1.0'
      }
    });

    // Handle error responses from SEC API
    if (response.data && response.data.error) {
      console.log(`❌ SEC API Error: ${response.data.error}`);
      throw new Error(`SEC API Error: ${response.data.error}`);
    }

    console.log(`✅ SEC API Success: Received ${response.data?.hits?.hits?.length || 0} filings`);
    return SECSearchResultSchema.parse(response.data);
  }

  private async processSecFiling(filing: any): Promise<void> {
    const accessionNumber = filing.adsh;
    
    // Skip if we already have this filing
    const existing = await this.findExistingTrade(accessionNumber);
    if (existing) {
      console.log(`⏭️ Skipping existing filing: ${accessionNumber}`);
      return;
    }

    // Try to get the XML filing
    const cik = filing.ciks[0]; // Get CIK from filing data
    const xmlData = await this.getFilingXml(accessionNumber, cik);
    if (!xmlData) {
      throw new Error(`Could not retrieve XML for ${accessionNumber}`);
    }

    // Parse the Form 4
    const trades = await parseSecForm4(xmlData, accessionNumber);
    
    for (const trade of trades) {
      try {
        // Skip AI analysis for historical data to avoid rate limits
        const analysisResult = await validateAndAnalyzeTrade(trade, false); // false = skip AI
        
        if (analysisResult.isValid) {
          // Store the verified trade
          await storage.upsertInsiderTrade({
            ...analysisResult.trade,
            isVerified: true,
            verificationStatus: 'VERIFIED',
            verificationNotes: `Historical import - ${analysisResult.verificationNotes}`
          });
          
          console.log(`✅ Processed historical trade: ${trade.traderName} at ${trade.companyName} ($${trade.totalValue.toLocaleString()})`);
        } else {
          console.log(`⚠️ Skipped invalid trade: ${analysisResult.reason}`);
        }
      } catch (error) {
        console.error(`❌ Error processing trade from ${accessionNumber}:`, error);
      }
    }
  }

  private async getFilingXml(accessionNumber: string, cik: string): Promise<string | null> {
    // Convert accession number format for URL (remove dashes)
    const formattedAccession = accessionNumber.replace(/-/g, '');
    
    // Remove leading zeros from CIK for URL path
    const trimmedCik = cik.replace(/^0+/, '') || '0';
    
    // Try common XML paths
    const xmlPaths = [
      `ownership.xml`,
      `primary_doc.xml`,
      `form4.xml`,
      `xslF345X01/ownership.xml`
    ];

    for (const xmlPath of xmlPaths) {
      try {
        const url = `https://www.sec.gov/Archives/edgar/data/${trimmedCik}/${formattedAccession}/${xmlPath}`;
        console.log(`🔍 Trying XML path: ${url}`);
        
        const response = await this.httpClient.request({
          method: 'GET',
          url: url,
          headers: {
            'Accept': 'application/xml, text/xml, */*'
          }
        });

        if (response.data && typeof response.data === 'string' && response.data.includes('<ownershipDocument>')) {
          console.log(`✅ Found XML at: ${url}`);
          return response.data;
        }
      } catch (error) {
        console.log(`⚠️ XML not found at ${xmlPath}`);
        continue;
      }
    }

    return null;
  }

  private async findExistingTrade(accessionNumber: string): Promise<boolean> {
    try {
      // Search for existing trade with this accession number
      const trades = await storage.getInsiderTrades(1, 0, false);
      return trades.some(trade => trade.accessionNumber === accessionNumber);
    } catch (error) {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): HistoricalCollectionProgress | null {
    return this.progress;
  }

  pauseCollection(): void {
    if (this.progress) {
      this.progress.status = 'paused';
    }
  }

  resumeCollection(): void {
    if (this.progress && this.progress.status === 'paused') {
      this.progress.status = 'running';
    }
  }
}

// Global instance for managing historical collection
export const historicalCollector = new HistoricalSecCollector();