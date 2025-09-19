import fs from 'fs';
import https from 'https';
import { storage } from './storage.js';
import type { InsertInsiderTrade } from '@shared/schema';

interface SecSubmission {
  cik: string;
  entityType: string;
  name: string;
  tickers: string[];
  insiderTransactionForIssuerExists: number;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
}

export class SecBulkSimple {
  private readonly userAgent = 'InsiderTrack Pro Analytics Bot v1.0 (contact@insidertrack.com)';

  async processTestSample(): Promise<void> {
    console.log('🧪 Testing SEC bulk data processing with sample data...');

    // First, let's try to download a small sample to understand the data structure
    const sampleUrl = 'https://data.sec.gov/submissions/CIK0000320193.json'; // Apple Inc.

    try {
      const sampleData = await this.downloadJson(sampleUrl);
      console.log('📊 Sample data structure:');
      console.log('Company:', sampleData.name);
      console.log('Tickers:', sampleData.tickers);
      console.log('Has insider transactions:', sampleData.insiderTransactionForIssuerExists);

      if (sampleData.filings?.recent) {
        const forms = sampleData.filings.recent.form;
        const form4Count = forms.filter((f: string) => f === '4').length;
        console.log(`Found ${form4Count} Form 4 filings out of ${forms.length} total filings`);

        // Process first few Form 4s as test
        await this.processForm4Filings(sampleData, 5);
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  private async downloadJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`📥 Downloading: ${url}`);

      const request = https.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 30000
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Failed to parse JSON: ' + error));
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  private async processForm4Filings(submission: SecSubmission, maxCount = 5): Promise<void> {
    if (!submission.filings?.recent) {
      console.log('No recent filings found');
      return;
    }

    const { recent } = submission.filings;
    let processed = 0;

    for (let i = 0; i < recent.form.length && processed < maxCount; i++) {
      if (recent.form[i] === '4') {
        try {
          const trade = this.createPlaceholderTrade(submission, i);

          // Check if already exists
          const existing = await this.findExistingTrade(trade.accessionNumber);
          if (!existing) {
            await storage.createInsiderTrade(trade);
            console.log(`✅ Added placeholder for ${trade.accessionNumber}`);
            processed++;
          } else {
            console.log(`⏭️ Skipping existing ${trade.accessionNumber}`);
          }

        } catch (error) {
          console.error(`❌ Error processing ${recent.accessionNumber[i]}:`, error);
        }
      }
    }

    console.log(`📊 Processed ${processed} Form 4 filings for ${submission.name}`);
  }

  private createPlaceholderTrade(submission: SecSubmission, filingIndex: number): InsertInsiderTrade {
    const { recent } = submission.filings;

    return {
      accessionNumber: recent.accessionNumber[filingIndex],
      companyName: submission.name,
      ticker: submission.tickers?.[0] || 'Unknown',
      traderName: 'Pending Analysis',
      traderTitle: 'Insider',
      tradeType: 'BUY',
      shares: 0,
      pricePerShare: 0,
      totalValue: 0,
      ownershipPercentage: 0,
      filedDate: new Date(recent.filingDate[filingIndex]),
      isVerified: false,
      verificationStatus: 'PENDING',
      verificationNotes: 'Bulk import placeholder - needs full XML parsing',
      secFilingUrl: `https://www.sec.gov/Archives/edgar/data/${submission.cik}/${recent.accessionNumber[filingIndex].replace(/-/g, '')}/${recent.primaryDocument[filingIndex]}`,
      aiAnalysis: null,
      significanceScore: 50,
      signalType: 'HOLD'
    };
  }

  private async findExistingTrade(accessionNumber: string): Promise<any> {
    try {
      const trades = await storage.getInsiderTrades(1000, 0, false);
      return trades.find(t => t.accessionNumber === accessionNumber);
    } catch (error) {
      console.error('Error checking existing trade:', error);
      return null;
    }
  }

  // Method to batch process multiple CIKs
  async processCikList(ciks: string[], maxPerCik = 10): Promise<void> {
    console.log(`🚀 Processing ${ciks.length} companies...`);

    for (let i = 0; i < ciks.length; i++) {
      const cik = ciks[i].padStart(10, '0'); // CIK should be 10 digits
      const url = `https://data.sec.gov/submissions/CIK${cik}.json`;

      try {
        console.log(`📊 Processing ${i + 1}/${ciks.length}: CIK ${cik}`);
        const submission = await this.downloadJson(url);

        if (submission.insiderTransactionForIssuerExists === 1) {
          await this.processForm4Filings(submission, maxPerCik);
        } else {
          console.log(`⏭️ No insider transactions for ${submission.name}`);
        }

        // Rate limiting
        await this.delay(1000);

      } catch (error) {
        console.error(`❌ Failed to process CIK ${cik}:`, error);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const secBulkSimple = new SecBulkSimple();