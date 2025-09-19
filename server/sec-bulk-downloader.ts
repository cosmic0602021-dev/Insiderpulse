import fs from 'fs';
import path from 'path';
import https from 'https';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
// import yauzl from 'yauzl';
import { storage } from './storage.js';
import type { InsertInsiderTrade } from '@shared/schema';

interface SecSubmission {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: number;
  insiderTransactionForIssuerExists: number;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  addresses: any;
  phone: string;
  flags: string;
  formerNames: any[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
    files: any[];
  };
}

export class SecBulkDownloader {
  private readonly userAgent = 'InsiderTrack Pro Analytics Bot v1.0 (contact@insidertrack.com)';
  private readonly baseUrl = 'https://www.sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip';
  private readonly tempDir = '/tmp/sec_bulk_processing';

  async downloadAndProcessBulkData(): Promise<void> {
    console.log('🚀 Starting SEC bulk data download and processing...');

    try {
      // Create temp directory
      await this.ensureDirectoryExists(this.tempDir);

      // Process ZIP file in streaming mode to avoid disk space issues
      await this.processZipFileStream();

      console.log('✅ SEC bulk data processing completed successfully');
    } catch (error) {
      console.error('❌ SEC bulk data processing failed:', error);
      throw error;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async processZipFileStream(): Promise<void> {
    console.log('📥 Downloading and processing ZIP file in streaming mode...');

    return new Promise((resolve, reject) => {
      const request = https.get(this.baseUrl, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 30000
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        console.log(`📊 Content-Length: ${response.headers['content-length']} bytes`);

        // Create a temporary file for the ZIP stream
        const tempZipPath = path.join(this.tempDir, 'submissions_temp.zip');
        const writeStream = fs.createWriteStream(tempZipPath);

        response.pipe(writeStream);

        writeStream.on('finish', async () => {
          try {
            console.log('💾 ZIP file downloaded, processing entries...');
            await this.processZipEntries(tempZipPath);

            // Remove temp ZIP file
            fs.unlinkSync(tempZipPath);

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        writeStream.on('error', reject);
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  private async processZipEntries(zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }

        let processedCount = 0;
        let form4Count = 0;
        let totalEntries = 0;

        zipfile.on('entry', async (entry) => {
          totalEntries++;

          if (entry.fileName.endsWith('/')) {
            // Directory entry
            zipfile.readEntry();
            return;
          }

          // Only process JSON files that might contain CIK data
          if (!entry.fileName.endsWith('.json')) {
            zipfile.readEntry();
            return;
          }

          try {
            console.log(`📄 Processing ${entry.fileName} (${processedCount + 1}/${totalEntries})`);

            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) {
                console.error(`❌ Error reading ${entry.fileName}:`, err);
                zipfile.readEntry();
                return;
              }

              try {
                const jsonContent = await this.streamToString(readStream);
                const submission: SecSubmission = JSON.parse(jsonContent);

                // Check if this company has insider transactions
                if (submission.insiderTransactionForIssuerExists === 1) {
                  const form4Filings = await this.extractForm4Filings(submission);
                  form4Count += form4Filings;

                  if (form4Filings > 0) {
                    console.log(`✅ Found ${form4Filings} Form 4 filings for ${submission.name} (${submission.tickers?.join(', ') || 'No ticker'})`);
                  }
                }

                processedCount++;

                // Progress update every 100 files
                if (processedCount % 100 === 0) {
                  console.log(`📊 Progress: ${processedCount} files processed, ${form4Count} Form 4 filings found`);
                }

                zipfile.readEntry();
              } catch (parseError) {
                console.error(`❌ Error parsing ${entry.fileName}:`, parseError);
                zipfile.readEntry();
              }
            });
          } catch (error) {
            console.error(`❌ Error processing ${entry.fileName}:`, error);
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          console.log(`🎉 Processing complete: ${processedCount} files processed, ${form4Count} total Form 4 filings found`);
          resolve();
        });

        zipfile.on('error', reject);

        // Start reading entries
        zipfile.readEntry();
      });
    });
  }

  private async extractForm4Filings(submission: SecSubmission): Promise<number> {
    if (!submission.filings?.recent) {
      return 0;
    }

    const { recent } = submission.filings;
    let form4Count = 0;

    for (let i = 0; i < recent.form.length; i++) {
      if (recent.form[i] === '4') {
        try {
          const trade = await this.convertToInsiderTrade(submission, i);
          if (trade) {
            // Check if trade already exists
            const existingTrade = await this.findExistingTrade(trade.accessionNumber);
            if (!existingTrade) {
              await storage.createInsiderTrade(trade);
              form4Count++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing Form 4 filing ${recent.accessionNumber[i]}:`, error);
        }
      }
    }

    return form4Count;
  }

  private async convertToInsiderTrade(submission: SecSubmission, filingIndex: number): Promise<InsertInsiderTrade | null> {
    const { recent } = submission.filings;

    const accessionNumber = recent.accessionNumber[filingIndex];
    const filingDate = new Date(recent.filingDate[filingIndex]);
    const ticker = submission.tickers?.[0] || '';

    // For bulk data, we don't have detailed transaction data
    // We'll create placeholder entries that can be enhanced later
    return {
      accessionNumber,
      companyName: submission.name,
      ticker,
      traderName: 'Unknown', // Will be populated when we fetch full filing
      traderTitle: 'Insider',
      tradeType: 'BUY', // Default, will be updated when we fetch full data
      shares: 0, // Will be populated when we fetch full filing
      pricePerShare: 0, // Will be populated when we fetch full filing
      totalValue: 0, // Will be populated when we fetch full filing
      ownershipPercentage: 0,
      filedDate: filingDate,
      isVerified: false, // Mark as unverified until we fetch full data
      verificationStatus: 'PENDING',
      verificationNotes: 'Bulk import - needs detailed processing',
      secFilingUrl: `https://www.sec.gov/Archives/edgar/data/${submission.cik}/${accessionNumber.replace(/-/g, '')}/${recent.primaryDocument[filingIndex]}`,
      aiAnalysis: null,
      significanceScore: 50, // Default score
      signalType: 'HOLD' // Default signal
    };
  }

  private async findExistingTrade(accessionNumber: string): Promise<any> {
    try {
      const trades = await storage.getInsiderTrades(1000, 0, false);
      return trades.find(t => t.accessionNumber === accessionNumber);
    } catch (error) {
      console.error('Error checking for existing trade:', error);
      return null;
    }
  }

  private async streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await fs.promises.rmdir(this.tempDir, { recursive: true });
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }
}

export const secBulkDownloader = new SecBulkDownloader();