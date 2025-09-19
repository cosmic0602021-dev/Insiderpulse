import { storage } from './storage.js';
import { secBulkSimple } from './sec-bulk-simple.js';
import { finvizCollector } from './finviz-collector.js';
import { parseSecForm4 } from './sec-parser.js';
import { SecHttpClient } from './sec-http-client.js';

export class EnhancedDataCollector {
  private secClient = new SecHttpClient();
  private lastBulkImportTime = 0;
  private bulkImportInterval = 7 * 24 * 60 * 60 * 1000; // 7 days

  async performComprehensiveDataCollection(): Promise<void> {
    console.log('🚀 Starting enhanced data collection...');

    try {
      // 1. Check if we need bulk import (weekly)
      const shouldRunBulkImport = this.shouldRunBulkImport();
      if (shouldRunBulkImport) {
        await this.performBulkImport();
      }

      // 2. Run real-time collectors
      await this.performRealtimeCollection();

      // 3. Fill in missing data for placeholder entries
      await this.enhancePlaceholderData();

      console.log('✅ Enhanced data collection completed');

    } catch (error) {
      console.error('❌ Enhanced data collection failed:', error);
      throw error;
    }
  }

  private shouldRunBulkImport(): boolean {
    const now = Date.now();
    const timeSinceLastImport = now - this.lastBulkImportTime;

    if (timeSinceLastImport > this.bulkImportInterval) {
      console.log('📅 Time for weekly bulk import');
      return true;
    }

    // Also check if we have very few records
    return false; // Skip for now as we just ran it
  }

  private async performBulkImport(): Promise<void> {
    console.log('📦 Starting bulk import for additional companies...');

    // Import from more major companies
    const additionalCiks = [
      '1018724',  // Amazon.com Inc (corrected CIK)
      '51143',    // IBM
      '66740',    // Pfizer Inc
      '40545',    // Walmart Inc
      '1652044',  // Alphabet Inc
      '72971',    // Walt Disney Co
      '78003',    // Coca Cola Co
      '320187',   // Intel Corp
      '354950',   // Home Depot Inc
      '1326801'   // Meta Platforms Inc
    ];

    await secBulkSimple.processCikList(additionalCiks, 15);
    this.lastBulkImportTime = Date.now();
  }

  private async performRealtimeCollection(): Promise<void> {
    console.log('⚡ Running real-time data collection...');

    try {
      // Run Finviz collector for latest data
      await finvizCollector.collectLatestTrades(50);

      // Add delay between collectors
      await this.delay(2000);

      console.log('✅ Real-time collection completed');
    } catch (error) {
      console.error('❌ Real-time collection failed:', error);
    }
  }

  private async enhancePlaceholderData(): Promise<void> {
    console.log('🔧 Enhancing placeholder data with full Form 4 details...');

    try {
      // Get pending placeholder trades
      const trades = await storage.getInsiderTrades(100, 0, false);
      const placeholders = trades.filter(t =>
        t.verificationStatus === 'PENDING' &&
        t.traderName === 'Pending Analysis'
      );

      console.log(`📋 Found ${placeholders.length} placeholder entries to enhance`);

      let enhanced = 0;
      for (const trade of placeholders.slice(0, 10)) { // Process 10 at a time
        try {
          const enhancedData = await this.fetchDetailedTradeData(trade);
          if (enhancedData) {
            await this.updateTradeWithDetails(trade.id.toString(), enhancedData);
            enhanced++;
          }

          // Rate limiting
          await this.delay(1000);

        } catch (error) {
          console.error(`❌ Failed to enhance trade ${trade.accessionNumber}:`, error);
        }
      }

      console.log(`✅ Enhanced ${enhanced} placeholder entries`);

    } catch (error) {
      console.error('❌ Placeholder enhancement failed:', error);
    }
  }

  private async fetchDetailedTradeData(trade: any): Promise<any> {
    try {
      // Extract accession number and build SEC URL
      const accessionNumber = trade.accessionNumber;
      const cik = this.extractCikFromUrl(trade.secFilingUrl);

      if (!cik) {
        console.warn(`⚠️ Could not extract CIK for ${accessionNumber}`);
        return null;
      }

      // Build Form 4 XML URL
      const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber.replace(/-/g, '')}/primary_doc.xml`;

      console.log(`📥 Fetching detailed data for ${accessionNumber}`);

      const response = await this.secClient.request({
        method: 'GET',
        url: xmlUrl,
        headers: {
          'Accept': 'application/xml, text/xml'
        }
      });

      if (response.status === 200 && response.data) {
        // Parse the XML to extract detailed trade information
        const parsedTrades = await parseSecForm4(response.data, accessionNumber);
        return parsedTrades.length > 0 ? parsedTrades[0] : null;
      }

      return null;

    } catch (error) {
      console.error(`❌ Failed to fetch detailed data:`, error);
      return null;
    }
  }

  private extractCikFromUrl(url: string): string | null {
    // Extract CIK from SEC URL: https://www.sec.gov/Archives/edgar/data/320193/...
    const match = url.match(/\/data\/(\d+)\//);
    return match ? match[1] : null;
  }

  private async updateTradeWithDetails(tradeId: string, detailedData: any): Promise<void> {
    try {
      await storage.updateInsiderTrade(tradeId, {
        traderName: detailedData.traderName,
        traderTitle: detailedData.traderTitle,
        tradeType: detailedData.tradeType,
        shares: detailedData.shares,
        pricePerShare: detailedData.pricePerShare,
        totalValue: detailedData.totalValue,
        ownershipPercentage: detailedData.ownershipPercentage,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verificationNotes: 'Enhanced from SEC Form 4 XML'
      });

      console.log(`✅ Updated trade ${tradeId} with detailed data`);

    } catch (error) {
      console.error(`❌ Failed to update trade ${tradeId}:`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to manually trigger data collection
  async triggerDataCollection(): Promise<void> {
    await this.performComprehensiveDataCollection();
  }

  // Method to get collection statistics
  async getCollectionStats(): Promise<any> {
    const trades = await storage.getInsiderTrades(1000, 0, false);

    const verified = trades.filter(t => t.isVerified).length;
    const pending = trades.filter(t => t.verificationStatus === 'PENDING').length;
    const total = trades.length;

    return {
      total,
      verified,
      pending,
      verificationRate: total > 0 ? (verified / total * 100).toFixed(1) + '%' : '0%',
      lastBulkImport: new Date(this.lastBulkImportTime).toISOString()
    };
  }
}

export const enhancedDataCollector = new EnhancedDataCollector();