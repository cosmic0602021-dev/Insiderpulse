import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { storage } from './storage';
import { broadcastUpdate } from './routes';
import { aiAnalysisService } from './ai-analysis';
import type { InsertInsiderTrade } from '@shared/schema';

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
      // First, get the RSS feed to find recent Form 4 filings
      const response = await axios.get(
        'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&output=atom',
        { 
          headers: { 
            'User-Agent': 'InsiderTrack Pro 1.0 (contact@insidertrack.pro)' 
          }, 
          timeout: 15000 
        }
      );

      const result = await parseStringPromise(response.data);
      const entries = result.feed?.entry || [];
      
      // Process each entry to fetch the actual Form 4 XML
      const filings = [];
      for (const entry of entries.slice(0, 8)) { // Process fewer to avoid rate limits
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
          
          // Small delay to be respectful to SEC servers
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn('Failed to process individual filing:', error.message);
        }
      }
      
      return filings;
      
    } catch (error) {
      console.log('⚠️ SEC API unavailable - no data to process');
      throw error;
    }
  }

  private async fetchForm4Data(filingUrl: string, accessionNumber: string) {
    try {
      // Try to construct the direct XML URL from the filing URL
      const xmlUrl = filingUrl.replace('-index.htm', '/form4.xml');
      
      const xmlResponse = await axios.get(xmlUrl, {
        headers: { 
          'User-Agent': 'InsiderTrack Pro 1.0 (contact@insidertrack.pro)' 
        },
        timeout: 10000
      });

      const xmlData = await parseStringPromise(xmlResponse.data);
      return this.parseForm4XML(xmlData, accessionNumber);
      
    } catch (error) {
      // If direct XML fails, try to parse from the main filing page
      try {
        return await this.parseFilingPage(filingUrl, accessionNumber);
      } catch (parseError) {
        console.warn(`Failed to parse filing ${accessionNumber}:`, parseError.message);
        return null;
      }
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
    // NO FAKE DATA GENERATION - Only return null when real parsing fails
    console.warn(`⚠️ Cannot parse filing page ${accessionNumber} - skipping fake data generation`);
    return null;
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