import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { storage } from './storage';
import { broadcastUpdate } from './routes';
import { SecCamoufoxClient } from './sec-camoufox-client.js';
import type { InsertInsiderTrade } from '@shared/schema';
import { parseSecForm4 } from './sec-parser.js';

// SEC-compliant HTTP client to prevent WAF blocking
class SecHttpClient {
  private lastRequestTime = 0;
  private isBlocked = false;
  private blockUntil = 0;
  private readonly minDelay = 2000; // 2 seconds between requests
  private readonly userAgent = 'InsiderTrack Pro/1.0 (https://insidertrack.pro; contact@insidertrack.pro)';
  private camoufoxClient = new SecCamoufoxClient();
  
  async get(url: string, expectedContentType?: string): Promise<any> {
    // Use Camoufox for XML files to bypass WAF
    if (url.endsWith('.xml') || expectedContentType?.includes('xml')) {
      console.log('🦊 Using Camoufox for XML request:', url);
      try {
        const camoufoxResponse = await this.camoufoxClient.request({
          url,
          method: 'GET',
          headers: {
            'Accept': expectedContentType || 'application/xml, text/xml, */*'
          }
        });
        
        // Check if we got valid XML data
        if (camoufoxResponse.data && typeof camoufoxResponse.data === 'string') {
          const xmlContent = camoufoxResponse.data.trim();
          if (xmlContent.startsWith('<?xml') || xmlContent.includes('<ownershipDocument>')) {
            console.log('✅ Camoufox successfully retrieved XML data');
            return xmlContent;
          }
        }
        
        // Fallback to axios if Camoufox doesn't return XML
        console.log('⚠️ Camoufox response not valid XML, falling back to axios');
      } catch (error) {
        console.log('❌ Camoufox failed, falling back to axios:', (error as Error).message);
        // Continue to axios fallback
      }
    }
    // Check if we're in cooldown period
    if (this.isBlocked && Date.now() < this.blockUntil) {
      const remainingMinutes = Math.ceil((this.blockUntil - Date.now()) / 60000);
      throw new Error(`SEC_BLOCKED: In cooldown for ${remainingMinutes} more minutes`);
    }
    
    // Reset block status if cooldown expired
    if (this.isBlocked && Date.now() >= this.blockUntil) {
      this.isBlocked = false;
      console.log('🟢 SEC cooldown expired, resuming requests');
    }
    
    // Implement rate limiting with jitter
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const delay = this.minDelay - timeSinceLastRequest + Math.random() * 1000; // Add jitter
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': expectedContentType || 'application/json,application/xml,text/xml,*/*',
          'Accept-Encoding': 'gzip,deflate',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      });
      
      // Check if SEC returned a block page instead of expected content
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      if (responseText.includes('<!DOCTYPE html') || responseText.includes('Your Request Originates from an Undeclared Automated Tool')) {
        console.warn('🔴 SEC WAF blocked request - entering 45 minute cooldown');
        this.isBlocked = true;
        this.blockUntil = Date.now() + (45 * 60 * 1000); // 45 minute cooldown
        throw new Error('SEC_BLOCKED: Request blocked by WAF');
      }
      
      // Validate Content-Type if specified
      if (expectedContentType) {
        const contentType = response.headers['content-type'] || '';
        if (expectedContentType.includes('json') && !contentType.includes('json')) {
          console.warn(`⚠️ Expected JSON but got: ${contentType} - throwing SEC_UNEXPECTED_CONTENT`);
          throw new Error('SEC_UNEXPECTED_CONTENT: Expected JSON but received different content type');
        } else if (expectedContentType.includes('xml') && !contentType.includes('xml')) {
          console.warn(`⚠️ Expected XML but got: ${contentType} - throwing SEC_UNEXPECTED_CONTENT`);
          throw new Error('SEC_UNEXPECTED_CONTENT: Expected XML but received different content type');
        }
      }
      
      return response.data;
      
    } catch (error: any) {
      if (error.response?.status === 429 || error.response?.status === 403) {
        console.warn('🔴 SEC rate limit or access denied - entering 30 minute cooldown');
        this.isBlocked = true;
        this.blockUntil = Date.now() + (30 * 60 * 1000); // 30 minute cooldown
        throw new Error('SEC_BLOCKED: Rate limited or access denied');
      }
      throw error;
    }
  }
}

const secHttpClient = new SecHttpClient();

class CacheSystem {
  private cache = new Map<string, { value: any; timestamp: number }>();
  private ttl = 600000; // 10 minutes

  set(key: string, value: any) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}

const cache = new CacheSystem();

class SECDataCollector {
  private isRunning = false;
  private lastCheck = new Date();

  async start() {
    if (this.isRunning) {
      console.log('⚠️ SEC data collector already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting SEC data collector...');
    
    // Initial collection
    await this.collectLatestFilings();
    
    // Set up periodic collection every 10 minutes
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.collectLatestFilings();
      } else {
        clearInterval(interval);
      }
    }, 10 * 60 * 1000); // 10 minutes

    console.log('✅ SEC data collector started - checking every 10 minutes');
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️ SEC data collector stopped');
  }

  async collectLatestFilings() {
    try {
      console.log(`📊 [${new Date().toLocaleString()}] Collecting SEC filings...`);
      
      const cached = cache.get('filings');
      if (cached) {
        console.log('📋 Using cached filing data');
        await this.processFilings(cached);
        return;
      }

      // Try to fetch real SEC data
      const filings = await this.fetchSECData();
      cache.set('filings', filings);
      await this.processFilings(filings);
      
    } catch (error) {
      console.error('❌ Error collecting SEC filings:', error);
      console.log('⚠️ No SEC data collected due to error - waiting for next cycle');
      // NO MOCK DATA GENERATION - Only use real SEC data
    }
  }

  private async fetchSECData() {
    try {
      // First, get the RSS feed to find recent Form 4 filings using SEC-compliant client
      const response = await secHttpClient.get(
        'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&output=atom'
      );

      const result = await parseStringPromise(response);
      const entries = result.feed?.entry || [];
      
      // Process ALL RSS entries to collect complete insider trading data
      const filings = [];
      console.log(`📊 Processing ${entries.length} RSS entries for complete coverage`);
      for (const entry of entries) { // NO LIMIT - Process all available entries
        try {
          const filingUrl = entry.link?.[0]?.$.href;
          if (!filingUrl) continue;

          // Extract accession number from the URL
          const accessionMatch = filingUrl.match(/(\d{10}-\d{2}-\d{6})/);
          if (!accessionMatch) continue;

          const accessionNumber = accessionMatch[1];
          const filing = await this.fetchForm4Data(filingUrl, accessionNumber);
          if (filing) {
            filings.push(filing);
          }
          
          // No additional delay needed - secHttpClient handles rate limiting
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('SEC_BLOCKED')) {
            console.log('🔴 SEC blocked - stopping collection cycle');
            break; // Stop processing more filings if blocked
          }
          console.warn('Failed to process individual filing:', errorMessage);
        }
      }
      
      return filings;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('SEC_BLOCKED')) {
        console.log('⚠️ SEC blocked - will retry after cooldown period');
        return []; // Return empty array instead of throwing
      }
      console.log('⚠️ SEC API unavailable - no data to process');
      throw error;
    }
  }

  private async fetchForm4Data(filingUrl: string, accessionNumber: string) {
    // Extract CIK and accession from URL for proper base directory
    const urlParts = filingUrl.match(/edgar\/data\/(\d+)\/\d+\/(\d{10}-\d{2}-\d{6})-index\.htm/);
    if (!urlParts) {
      console.warn(`⚠️ Cannot extract CIK/accession from URL: ${filingUrl}`);
      return null;
    }

    const [, cik, accession] = urlParts;
    const accessionNoDashes = accession.replace(/-/g, '');
    const baseDir = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}`;
    
    // Try deterministic XML paths first (recommended by architect)
    const xmlCandidates = [
      `${baseDir}/ownership.xml`,
      `${baseDir}/primary_doc.xml`,
      `${baseDir}/form4.xml`,
      // Try common xslF345X patterns
      `${baseDir}/xslF345X01/ownership.xml`,
      `${baseDir}/xslF345X02/ownership.xml`,
      `${baseDir}/xslF345X03/ownership.xml`,
      `${baseDir}/xslF345X04/ownership.xml`,
      `${baseDir}/xslF345X05/ownership.xml`
    ];
    
    for (const xmlUrl of xmlCandidates) {
      try {
        console.log(`🔍 Trying direct XML path: ${xmlUrl}`);
        const xmlData = await secHttpClient.get(xmlUrl, 'application/xml');

        // Use advanced parser that supports both Table 1 and Table 2
        const trades = await parseSecForm4(xmlData, accessionNumber);

        if (trades.length > 0) {
          console.log(`✅ Successfully found XML at: ${xmlUrl}`);
          console.log(`   📊 Parsed ${trades.length} transaction(s) (Table 1 + Table 2)`);

          // Return first trade with all trades attached
          return {
            ...this.convertParsedTradeToFiling(trades[0]),
            allTrades: trades.map(t => this.convertParsedTradeToFiling(t))
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('SEC_BLOCKED')) {
          throw error; // Propagate blocking immediately
        }
        // Continue to next candidate if this path doesn't exist
        console.log(`⚠️ XML not found at ${xmlUrl}, trying next path...`);
      }
    }
    
    // Fallback to index.json approach if deterministic paths fail
    try {
      return await this.parseFilingPage(filingUrl, accessionNumber);
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.warn(`Failed to parse filing ${accessionNumber} via all methods:`, parseErrorMessage);
      return null;
    }
  }

  // Convert ParsedTrade from sec-parser.ts to legacy filing format
  private convertParsedTradeToFiling(trade: any): any {
    const accessionNoDashes = trade.accessionNumber.replace(/-/g, '');
    return {
      company: trade.companyName,
      ticker: trade.ticker || null,
      cik: '', // Not available in ParsedTrade
      traderName: trade.traderName,
      traderTitle: trade.traderTitle,
      tradeType: trade.tradeType,
      shares: trade.shares,
      price: trade.pricePerShare,
      ownershipPercentage: trade.ownershipPercentage,
      accession: trade.accessionNumber,
      date: trade.filedDate.toISOString(),
      transactionCode: '', // Not directly available
      link: trade.secFilingUrl || `https://www.sec.gov/edgar/browse/?accession=${accessionNoDashes}`,
      // NEW: Derivative fields from advanced parser
      isDerivative: trade.isDerivative || false,
      underlyingShares: trade.underlyingShares,
      derivativeType: trade.derivativeType
    };
  }


  private async parseFilingPage(filingUrl: string, accessionNumber: string) {
    try {
      console.log(`🔍 Finding XML document for ${accessionNumber}...`);
      
      // Extract CIK and accession info from filing URL
      // URL format: https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{accession}-index.htm
      const urlParts = filingUrl.match(/edgar\/data\/(\d+)\/\d+\/(\d{10}-\d{2}-\d{6})-index\.htm/);
      if (!urlParts) {
        console.warn(`⚠️ Cannot extract CIK/accession from URL: ${filingUrl}`);
        return null;
      }

      const [, cik, accession] = urlParts;
      const accessionNoDashes = accession.replace(/-/g, '');
      
      // Use SEC's index.json API for reliable document discovery
      const baseUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}`;
      const indexUrl = `${baseUrl}/index.json`;
      
      console.log(`📋 Fetching filing index: ${indexUrl}`);
      
      const index = await secHttpClient.get(indexUrl, 'application/json');
      const directory = index.directory || {};
      
      // directory.item is an array, not an object
      const items = directory.item || [];
      if (!Array.isArray(items)) {
        console.warn(`⚠️ Unexpected directory.item structure for ${accessionNumber}`);
        return null;
      }
      
      let xmlFileName = null;
      
      // Look for direct XML files first
      const xmlCandidates = ['ownership.xml', 'primary_doc.xml', 'form4.xml'];
      for (const candidate of xmlCandidates) {
        const found = items.find(item => item.name === candidate);
        if (found) {
          xmlFileName = candidate;
          console.log(`📄 Found XML document: ${candidate}`);
          break;
        }
      }
      
      // If not found, look for xslF345X directories
      if (!xmlFileName) {
        const xslDirs = items.filter(item => 
          item.type === 'dir' && item.name && item.name.startsWith('xslF345X')
        );
        
        for (const dir of xslDirs) {
          // Try ownership.xml in this subdirectory
          const candidatePath = `${dir.name}/ownership.xml`;
          xmlFileName = candidatePath;
          console.log(`📄 Trying XML in subdirectory: ${candidatePath}`);
          break; // Try first xsl directory found
        }
      }

      if (!xmlFileName) {
        console.warn(`⚠️ No suitable XML document found in index for ${accessionNumber}`);
        return null;
      }

      // Construct full XML URL
      const xmlUrl = `${baseUrl}/${xmlFileName}`;
      
      // Fetch and parse the XML using SEC-compliant client
      const xmlResponse = await secHttpClient.get(xmlUrl, 'application/xml');

      // Use advanced parser that supports both Table 1 and Table 2
      const trades = await parseSecForm4(xmlResponse, accessionNumber);

      if (trades.length > 0) {
        console.log(`   📊 Parsed ${trades.length} transaction(s) (Table 1 + Table 2)`);
        // Return first trade with all trades attached
        return {
          ...this.convertParsedTradeToFiling(trades[0]),
          allTrades: trades.map(t => this.convertParsedTradeToFiling(t))
        };
      }

      return null;

    } catch (error) {
      // Note: parseSecForm4 handles XML parsing internally
      // No need for fallback parsing here
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to find/parse XML document for ${accessionNumber}:`, errorMessage);
      return null;
    }
  }

  private determineTraderTitle(relationship: any): string {
    if (relationship.isDirector?.[0]?.value?.[0] === 'true' || relationship.isDirector?.[0] === 'true') {
      return 'Director';
    }
    if (relationship.isOfficer?.[0]?.value?.[0] === 'true' || relationship.isOfficer?.[0] === 'true') {
      return 'Officer';
    }
    if (relationship.isTenPercentOwner?.[0]?.value?.[0] === 'true' || relationship.isTenPercentOwner?.[0] === 'true') {
      return '10% Owner';
    }
    if (relationship.isOther?.[0]?.value?.[0] === 'true' || relationship.isOther?.[0] === 'true') {
      return 'Other';
    }
    return 'Executive';
  }

  private generateMockFilings() {
    const companies = [
      { name: 'Apple Inc', ticker: 'AAPL', basePrice: 180 },
      { name: 'Microsoft Corporation', ticker: 'MSFT', basePrice: 420 },
      { name: 'NVIDIA Corporation', ticker: 'NVDA', basePrice: 875 },
      { name: 'Tesla Inc', ticker: 'TSLA', basePrice: 245 },
      { name: 'Amazon.com Inc', ticker: 'AMZN', basePrice: 145 },
      { name: 'Alphabet Inc', ticker: 'GOOGL', basePrice: 175 },
      { name: 'Meta Platforms Inc', ticker: 'META', basePrice: 520 },
      { name: 'Berkshire Hathaway Inc', ticker: 'BRK.B', basePrice: 445 },
    ];

    const traders = [
      { name: 'Timothy D. Cook', title: 'Chief Executive Officer' },
      { name: 'Luca Maestri', title: 'Chief Financial Officer' },
      { name: 'Katherine L. Adams', title: 'Senior Vice President' },
      { name: 'Deirdre O\'Brien', title: 'Senior Vice President' },
      { name: 'Craig Federighi', title: 'Senior Vice President' },
      { name: 'John Ternus', title: 'Senior Vice President' },
      { name: 'Susan Kare', title: 'Director' },
      { name: 'Arthur D. Levinson', title: 'Chairman of the Board' },
      { name: 'Al Gore', title: 'Director' },
      { name: 'Andrea Jung', title: 'Director' },
    ];

    const tradeTypes = ['BUY', 'SELL'];

    return companies.map(company => {
      const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const price = company.basePrice * (1 + priceVariation);
      const trader = traders[Math.floor(Math.random() * traders.length)];
      const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
      
      return {
        company: company.name,
        ticker: company.ticker,
        traderName: trader.name,
        traderTitle: trader.title,
        tradeType: tradeType,
        shares: Math.floor(Math.random() * 50000) + 1000,
        price: parseFloat(price.toFixed(2)),
        ownershipPercentage: parseFloat((Math.random() * 5 + 0.1).toFixed(2)), // 0.1% to 5%
        accession: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 24h
        link: `https://sec.gov/mock/${company.ticker}`
      };
    });
  }

  private async processFilings(filings: any[]) {
    for (const filing of filings) {
      try {
        // Handle multiple trades from advanced parser (Table 1 + Table 2)
        const tradesToProcess = filing.allTrades || [filing];

        for (const trade of tradesToProcess) {
          // Skip filings with missing critical data
          if (!trade.company || !trade.traderName || trade.shares <= 0) {
            console.log(`⏭️ Skipping filing with insufficient data: ${trade.company}`);
            continue;
          }

          const tradeValue = trade.shares * trade.price;
        
          // CRITICAL: Validate price against market data
          let isVerified = false;
          let verificationStatus = 'PENDING';
          let verificationNotes = '';
          let marketPrice: number | null = null;
          let priceVariance: number | null = null;

          // Get market price for validation if ticker exists
          if (trade.ticker) {
            try {
              console.log(`🔍 Validating price for ${trade.ticker}: SEC price $${trade.price}`);
              const marketData = await this.getMarketPriceForValidation(trade.ticker, trade.date);
            
            if (marketData) {
              marketPrice = marketData.price;
              const variance = Math.abs((trade.price - marketPrice) / marketPrice) * 100;
              priceVariance = parseFloat(variance.toFixed(2));

              console.log(`   📊 Market price: $${marketPrice}, SEC price: $${trade.price}, Variance: ${priceVariance}%`);

              // Mark as verified if price is within reasonable range (±10%)
              if (priceVariance <= 10) {
                isVerified = true;
                verificationStatus = 'VERIFIED';
                verificationNotes = `Price validated against market data (variance: ${priceVariance}%)`;
                console.log(`   ✅ Price verified - within acceptable range`);
              } else {
                // Still process trades with high variance (option exercises, awards, etc.)
                isVerified = false;
                verificationStatus = 'UNVERIFIED';
                verificationNotes = `Price differs from market (variance: ${priceVariance}%). Likely option exercise, award, or special transaction.`;
                console.log(`   ⚠️ Price variance high but processing anyway: ${priceVariance}%`);
              }
            } else {
              verificationNotes = 'Could not retrieve market data for validation';
              console.log(`   ⚠️ No market data available for validation`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            verificationNotes = `Market validation error: ${errorMessage}`;
            console.warn(`   ⚠️ Market validation failed: ${errorMessage}`);
          }
          } else {
            verificationNotes = 'No ticker symbol available for market validation';
          }

          // Determine trade type label for logging
          const tradeTypeLabel = trade.isDerivative
            ? `📊 DERIVATIVE (${trade.derivativeType || 'Unknown'})`
            : `📈 DIRECT`;

          // Simple trade processing without AI analysis
          console.log(`${tradeTypeLabel} Processing trade data for ${trade.traderName} at ${trade.company}...`);

          // Create insider trade record with verification data AND derivative fields
          const tradeData: InsertInsiderTrade = {
            accessionNumber: trade.accession,
            companyName: trade.company,
            ticker: trade.ticker || null,
            traderName: trade.traderName,
            traderTitle: trade.traderTitle,
            tradeType: trade.tradeType,
            shares: trade.shares,
            pricePerShare: trade.price,
            totalValue: tradeValue,
            ownershipPercentage: trade.ownershipPercentage,
            filedDate: new Date(trade.date),
            aiAnalysis: null, // Deprecated field
            significanceScore: undefined, // No AI analysis
            signalType: undefined, // No AI analysis
            // Add verification data
            isVerified: isVerified,
            verificationStatus: verificationStatus,
            verificationNotes: verificationNotes,
            marketPrice: marketPrice || undefined,
            priceVariance: priceVariance || undefined,
            secFilingUrl: trade.link,
            // NEW: Add derivative fields from advanced parser
            isDerivative: trade.isDerivative || false,
            underlyingShares: trade.underlyingShares,
            derivativeType: trade.derivativeType
          };

          // Use upsert to handle duplicates gracefully
          const insertedTrade = await storage.upsertInsiderTrade(tradeData);

          const statusIcon = isVerified ? '✅' : '⚠️';
          console.log(`${statusIcon} Trade processed: ${tradeTypeLabel} ${trade.tradeType} - ${trade.traderName} (${trade.traderTitle}) at ${trade.company}`);
          console.log(`   📊 Value: ${tradeValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`);
          console.log(`   🔍 Verification: ${verificationStatus}${priceVariance ? ` (${priceVariance}% variance)` : ''}`);

          // Broadcast all trades to WebSocket clients (verified and unverified)
          broadcastUpdate('NEW_TRADE', {
            trade: insertedTrade
          });
          console.log(`   📡 Trade broadcasted to WebSocket clients`);

          // Delay to avoid overwhelming OpenAI API and SEC servers
          await new Promise(resolve => setTimeout(resolve, 2000));
        } // End of tradesToProcess loop

      } catch (error: any) {
        console.error(`❌ Error processing filing for ${filing.company}:`, error);
        if (error.message?.includes('rate limit')) {
          console.log('⏸️ Rate limit hit, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
  }

  private async getMarketPriceForValidation(ticker: string, filingDate: string): Promise<{ price: number } | null> {
    try {
      // Import stock price service 
      const { stockPriceService } = await import('./stock-price-service');
      
      // Get current price as a baseline (in production, would get historical price for the filing date)
      const priceData = await stockPriceService.getStockPrice(ticker);
      
      if (priceData && priceData.currentPrice > 0) {
        return { price: priceData.currentPrice };
      }
      
      return null;
    } catch (error: any) {
      console.warn(`Failed to get market price for ${ticker}:`, error.message);
      return null;
    }
  }


}

export const secCollector = new SECDataCollector();

// Auto-start the collector
if (process.env.NODE_ENV !== 'test') {
  // Small delay to ensure database is ready
  setTimeout(() => {
    secCollector.start();
  }, 2000);
}