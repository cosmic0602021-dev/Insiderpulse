import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { storage } from './storage';
import { broadcastUpdate } from './routes';
import { aiAnalysisService } from './ai-analysis';
import type { InsertInsiderTrade } from '@shared/schema';

// SEC-compliant HTTP client to prevent WAF blocking
class SecHttpClient {
  private lastRequestTime = 0;
  private isBlocked = false;
  private blockUntil = 0;
  private readonly minDelay = 2000; // 2 seconds between requests
  private readonly userAgent = 'InsiderTrack Pro/1.0 (https://insidertrack.pro; contact@insidertrack.pro)';
  
  async get(url: string, expectedContentType?: string): Promise<any> {
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
      
      // Process fewer entries to reduce API load and avoid triggering WAF
      const filings = [];
      for (const entry of entries.slice(0, 3)) { // Reduced from 8 to 3
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
          if (error.message.includes('SEC_BLOCKED')) {
            console.log('🔴 SEC blocked - stopping collection cycle');
            break; // Stop processing more filings if blocked
          }
          console.warn('Failed to process individual filing:', error.message);
        }
      }
      
      return filings;
      
    } catch (error) {
      if (error.message.includes('SEC_BLOCKED')) {
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
        const parsedData = await parseStringPromise(xmlData);
        const result = this.parseForm4XML(parsedData, accessionNumber);
        if (result) {
          console.log(`✅ Successfully found XML at: ${xmlUrl}`);
          return result;
        }
      } catch (error) {
        if (error.message.includes('SEC_BLOCKED')) {
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
      console.warn(`Failed to parse filing ${accessionNumber} via all methods:`, parseError.message);
      return null;
    }
  }

  private parseForm4XML(xmlData: any, accessionNumber: string) {
    const doc = xmlData.ownershipDocument || xmlData;
    
    // Extract issuer information
    const issuer = doc.issuer?.[0] || {};
    const companyName = issuer.issuerName?.[0]?.value?.[0] || issuer.issuerName?.[0];
    const ticker = issuer.issuerTradingSymbol?.[0]?.value?.[0] || issuer.issuerTradingSymbol?.[0] || '';
    
    // Extract reporting owner information
    const reportingOwner = doc.reportingOwner?.[0] || {};
    const ownerInfo = reportingOwner.reportingOwnerId?.[0] || {};
    const traderName = ownerInfo.rptOwnerName?.[0]?.value?.[0] || ownerInfo.rptOwnerName?.[0];
    
    console.log(`🔍 [DEBUG] Parsing accession ${accessionNumber}:`);
    console.log(`   Company: ${companyName} | Trader: ${traderName} | Ticker: ${ticker}`);
    
    // Skip processing if critical data is missing
    if (!companyName || !traderName) {
      console.warn(`⚠️ Missing critical data for ${accessionNumber} - company: ${companyName}, trader: ${traderName}`);
      return null;
    }
    
    // Extract relationship information
    const relationship = reportingOwner.reportingOwnerRelationship?.[0] || {};
    const traderTitle = this.determineTraderTitle(relationship);
    
    // Extract transaction information
    const nonDerivativeTable = doc.nonDerivativeTable?.[0];
    const transactions = nonDerivativeTable?.nonDerivativeTransaction || [];
    
    if (transactions.length === 0) {
      return null; // No transactions to process
    }
    
    // Use the first transaction for simplicity
    const transaction = transactions[0];
    const transactionAmounts = transaction.transactionAmounts?.[0] || {};
    const postTransaction = transaction.postTransactionAmounts?.[0] || {};
    
    const shares = parseInt(transactionAmounts.transactionShares?.[0]?.value?.[0] || '0');
    const pricePerShare = parseFloat(transactionAmounts.transactionPricePerShare?.[0]?.value?.[0] || '0');
    const acquiredDisposed = transactionAmounts.transactionAcquiredDisposedCode?.[0]?.value?.[0];
    const sharesOwned = parseInt(postTransaction.sharesOwnedFollowingTransaction?.[0]?.value?.[0] || '0');
    
    // Calculate ownership percentage
    const ownershipPercentage = sharesOwned > 0 && shares > 0 ? 
      parseFloat(((shares / sharesOwned) * 100).toFixed(2)) : 0;
    
    const tradeType: 'BUY' | 'SELL' = acquiredDisposed === 'A' ? 'BUY' : 'SELL';
    const transactionDate = transaction.transactionDate?.[0]?.value?.[0];
    
    return {
      company: companyName,
      ticker: ticker,
      traderName: traderName,
      traderTitle: traderTitle,
      tradeType: tradeType,
      shares: shares,
      price: pricePerShare,
      ownershipPercentage: ownershipPercentage,
      accession: accessionNumber,
      date: transactionDate || new Date().toISOString(),
      link: ''
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

      // Parse XML directly without manual entity decoding (that corrupts valid XML)
      const xmlData = await parseStringPromise(xmlResponse, {
        explicitArray: true,
        strict: true
      });
      
      return this.parseForm4XML(xmlData, accessionNumber);

    } catch (error) {
      // Fallback to less strict parsing if needed
      if (error.message.includes('Unexpected') || error.message.includes('Non-whitespace')) {
        try {
          console.log(`📄 Retrying XML parse with relaxed settings for ${accessionNumber}...`);
          const xmlData = await parseStringPromise(error.data || '', {
            explicitArray: true,
            strict: false,
            trim: true
          });
          return this.parseForm4XML(xmlData, accessionNumber);
        } catch (retryError) {
          console.warn(`⚠️ Failed to parse XML for ${accessionNumber} even with relaxed settings:`, retryError.message);
        }
      }
      
      console.warn(`⚠️ Failed to find/parse XML document for ${accessionNumber}:`, error.message);
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
        // Skip filings with missing critical data
        if (!filing.company || !filing.traderName || filing.shares <= 0) {
          console.log(`⏭️ Skipping filing with insufficient data: ${filing.company}`);
          continue;
        }

        const tradeValue = filing.shares * filing.price;
        
        // Generate AI analysis for the trade
        console.log(`🧠 Generating AI analysis for ${filing.traderName} at ${filing.company}...`);
        const aiResult = await aiAnalysisService.analyzeInsiderTrade({
          companyName: filing.company,
          ticker: filing.ticker || '',
          traderName: filing.traderName,
          traderTitle: filing.traderTitle,
          tradeType: filing.tradeType,
          shares: filing.shares,
          pricePerShare: filing.price,
          totalValue: tradeValue,
          ownershipPercentage: filing.ownershipPercentage
        });

        // Create insider trade record with AI-powered analysis
        const tradeData: InsertInsiderTrade = {
          accessionNumber: filing.accession,
          companyName: filing.company,
          ticker: filing.ticker || null,
          traderName: filing.traderName,
          traderTitle: filing.traderTitle,
          tradeType: filing.tradeType,
          shares: filing.shares,
          pricePerShare: filing.price,
          totalValue: tradeValue,
          ownershipPercentage: filing.ownershipPercentage,
          filedDate: new Date(filing.date),
          aiAnalysis: null, // Deprecated field
          significanceScore: aiResult.significanceScore,
          signalType: aiResult.signalType
        };

        // Use upsert to handle duplicates gracefully
        const trade = await storage.upsertInsiderTrade(tradeData);
        
        console.log(`✅ Trade processed with AI analysis: ${filing.tradeType} - ${filing.traderName} (${filing.traderTitle}) at ${filing.company}`);
        console.log(`   💡 AI Signal: ${aiResult.signalType} (Score: ${aiResult.significanceScore}/100)`);
        console.log(`   📊 Value: ${tradeValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`);
        
        // Broadcast to WebSocket clients with AI insights
        broadcastUpdate('NEW_TRADE', {
          trade: trade,
          aiInsights: {
            significanceScore: aiResult.significanceScore,
            signalType: aiResult.signalType,
            keyInsights: aiResult.keyInsights,
            riskLevel: aiResult.riskLevel,
            recommendation: aiResult.recommendation
          }
        });
        
        // Delay to avoid overwhelming OpenAI API and SEC servers
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing filing for ${filing.company}:`, error);
        if (error.message?.includes('rate limit')) {
          console.log('⏸️ Rate limit hit, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
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