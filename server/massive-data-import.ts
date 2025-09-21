import { storage } from './storage.js';
import axios from 'axios';
// Temporarily disabled due to package installation issues
// import { JSDOM } from 'jsdom';

export class MassiveDataImporter {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async importFromMultipleSources(): Promise<void> {
    console.log('🚀 시작: 대량 데이터 수집');

    const results = {
      finviz: 0,
      marketWatch: 0,
      nasdaq: 0,
      errors: 0
    };

    try {
      // 1. Finviz에서 최신 500개 거래 수집
      console.log('📊 Finviz에서 데이터 수집 중...');
      results.finviz = await this.collectFromFinviz();
      await this.delay(3000);

      // 2. MarketWatch에서 인사이더 거래 수집
      console.log('📊 MarketWatch에서 데이터 수집 중...');
      results.marketWatch = await this.collectFromMarketWatch();
      await this.delay(3000);

      // 3. NASDAQ에서 인사이더 거래 수집
      console.log('📊 NASDAQ에서 데이터 수집 중...');
      results.nasdaq = await this.collectFromNasdaq();

      console.log('✅ 대량 데이터 수집 완료');
      console.log(`📈 수집 결과: Finviz(${results.finviz}), MarketWatch(${results.marketWatch}), NASDAQ(${results.nasdaq}), 오류(${results.errors})`);

    } catch (error) {
      console.error('❌ 대량 데이터 수집 실패:', error);
      results.errors++;
    }

    return results as any;
  }

  private async collectFromFinviz(): Promise<number> {
    // Temporarily disabled due to jsdom package issue
    console.log('⏸️ Finviz collection temporarily disabled due to jsdom dependency issue');
    return 0;
    
    let collected = 0;

    try {
      for (let page = 1; page <= 20; page++) {
        console.log(`📄 Finviz 페이지 ${page} 처리 중...`);

        const url = `https://finviz.com/insidertrading.ashx?tc=1&or=-10&r=${(page-1) * 20 + 1}`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 30000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const trades = this.parseFinvizTrades(document);

        for (const trade of trades) {
          try {
            await this.saveTrade(trade, 'finviz');
            collected++;
          } catch (error) {
            console.error('❌ 거래 저장 실패:', error);
          }
        }

        console.log(`✅ 페이지 ${page}: ${trades.length}개 거래 처리됨`);
        await this.delay(2000); // 2초 대기
      }
    } catch (error) {
      console.error('❌ Finviz 수집 오류:', error);
    }

    return collected;
  }

  private parseFinvizTrades(document: Document): any[] {
    const trades: any[] = [];

    const rows = document.querySelectorAll('table.table-light-rows tr');
    rows.forEach((element, index) => {
      if (index === 0) return; // 헤더 스킵

      const cells = element.querySelectorAll('td');
      if (cells.length >= 9) {
        try {
          const ticker = cells[0]?.textContent?.trim() || '';
          const owner = cells[1]?.textContent?.trim() || '';
          const relationship = cells[2]?.textContent?.trim() || '';
          const date = cells[3]?.textContent?.trim() || '';
          const transaction = cells[4]?.textContent?.trim() || '';
          const cost = cells[5]?.textContent?.trim() || '';
          const shares = cells[6]?.textContent?.trim() || '';
          const value = cells[7]?.textContent?.trim() || '';
          const sharesTotal = cells[8]?.textContent?.trim() || '';

          if (ticker && owner && date) {
            trades.push({
              ticker: ticker,
              traderName: owner,
              traderTitle: relationship,
              tradeDate: this.parseDate(date),
              transactionType: this.parseTransactionType(transaction),
              pricePerShare: this.parsePrice(cost),
              shares: this.parseShares(shares),
              totalValue: this.parseValue(value),
              sharesOwned: this.parseShares(sharesTotal),
              source: 'finviz'
            });
          }
        } catch (error) {
          console.error('❌ Finviz 거래 파싱 오류:', error);
        }
      }
    });

    return trades;
  }

  private async collectFromMarketWatch(): Promise<number> {
    // Temporarily disabled due to jsdom package issue
    console.log('⏸️ MarketWatch collection temporarily disabled due to jsdom dependency issue');
    return 0;
    
    let collected = 0;

    try {
      for (let page = 1; page <= 10; page++) {
        console.log(`📄 MarketWatch 페이지 ${page} 처리 중...`);

        const url = `https://www.marketwatch.com/tools/insider-trading?page=${page}`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.marketwatch.com'
          },
          timeout: 30000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const trades = this.parseMarketWatchTrades(document);

        for (const trade of trades) {
          try {
            await this.saveTrade(trade, 'marketwatch');
            collected++;
          } catch (error) {
            console.error('❌ 거래 저장 실패:', error);
          }
        }

        console.log(`✅ 페이지 ${page}: ${trades.length}개 거래 처리됨`);
        await this.delay(3000); // 3초 대기
      }
    } catch (error) {
      console.error('❌ MarketWatch 수집 오류:', error);
    }

    return collected;
  }

  private parseMarketWatchTrades(document: Document): any[] {
    const trades: any[] = [];

    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach((element) => {
      try {
        const cells = element.querySelectorAll('td');
        if (cells.length >= 6) {
          const ticker = cells[0]?.textContent?.trim() || '';
          const company = cells[1]?.textContent?.trim() || '';
          const insider = cells[2]?.textContent?.trim() || '';
          const transaction = cells[3]?.textContent?.trim() || '';
          const value = cells[4]?.textContent?.trim() || '';
          const date = cells[5]?.textContent?.trim() || '';

          if (ticker && insider && date) {
            trades.push({
              ticker: ticker,
              companyName: company,
              traderName: insider,
              transactionType: this.parseTransactionType(transaction),
              totalValue: this.parseValue(value),
              tradeDate: this.parseDate(date),
              source: 'marketwatch'
            });
          }
        }
      } catch (error) {
        console.error('❌ MarketWatch 거래 파싱 오류:', error);
      }
    });

    return trades;
  }

  private async collectFromNasdaq(): Promise<number> {
    let collected = 0;

    try {
      // NASDAQ insider trading API endpoint
      const url = 'https://api.nasdaq.com/api/company/insider-trades';

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json',
          'Referer': 'https://www.nasdaq.com'
        },
        timeout: 30000
      });

      if (response.data && response.data.data) {
        const trades = response.data.data.map((item: any) => ({
          ticker: item.symbol,
          companyName: item.companyName,
          traderName: item.insiderName,
          traderTitle: item.title,
          transactionType: item.transactionType,
          shares: parseInt(item.shares),
          pricePerShare: parseFloat(item.price),
          totalValue: parseFloat(item.value),
          tradeDate: item.tradeDate,
          source: 'nasdaq'
        }));

        for (const trade of trades) {
          try {
            await this.saveTrade(trade, 'nasdaq');
            collected++;
          } catch (error) {
            console.error('❌ 거래 저장 실패:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ NASDAQ 수집 오류:', error);
    }

    return collected;
  }

  private async saveTrade(trade: any, source: string): Promise<void> {
    try {
      // 중복 확인을 위한 고유 ID 생성
      const uniqueId = `${source}-${trade.ticker}-${trade.traderName}-${trade.tradeDate}-${trade.totalValue}`;

      // 기존 거래 확인
      const existingTrades = await storage.getInsiderTrades(1, 0, false);
      const exists = existingTrades.some(t =>
        t.accessionNumber === uniqueId ||
        (t.ticker === trade.ticker &&
         t.traderName === trade.traderName &&
         t.filedDate === trade.tradeDate &&
         Math.abs(t.totalValue - trade.totalValue) < 1)
      );

      if (exists) {
        return; // 중복 거래는 건너뛰기
      }

      // 새 거래 저장
      await storage.createInsiderTrade({
        accessionNumber: uniqueId,
        ticker: trade.ticker,
        companyName: trade.companyName || '',
        traderName: trade.traderName,
        traderTitle: trade.traderTitle || '',
        filedDate: new Date(trade.tradeDate),
        transactionType: trade.transactionType || 'Unknown',
        tradeType: this.mapTransactionToTradeType(trade.transactionType),
        shares: trade.shares || 0,
        pricePerShare: trade.pricePerShare || 0,
        totalValue: trade.totalValue || 0,
        sharesOwned: trade.sharesOwned || 0,
        ownershipPercentage: 0,
        secFilingUrl: `https://${source}.com/insider-trading`,
        isVerified: false,
        verificationStatus: 'PENDING',
        verificationNotes: `Auto-imported from ${source}`
      });

    } catch (error) {
      console.error('❌ 거래 저장 중 오류:', error);
      throw error;
    }
  }

  private parseDate(dateStr: string): string {
    try {
      // 다양한 날짜 형식 처리
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  private parseTransactionType(transaction: string): string {
    const lower = transaction.toLowerCase();
    if (lower.includes('buy') || lower.includes('purchase')) return 'Purchase';
    if (lower.includes('sell') || lower.includes('sale')) return 'Sale';
    if (lower.includes('grant')) return 'Grant';
    if (lower.includes('exercise')) return 'Option Exercise';
    return transaction;
  }

  private mapTransactionToTradeType(transactionType: string): 'BUY' | 'SELL' | 'TRANSFER' | 'OPTION_EXERCISE' | 'GRANT' | 'GIFT' | 'AWARD' | 'TAX' | 'CONVERSION' | 'INHERIT' | 'DISPOSITION' | 'OTHER' {
    const lower = (transactionType || '').toLowerCase();
    if (lower.includes('buy') || lower.includes('purchase')) return 'BUY';
    if (lower.includes('sell') || lower.includes('sale')) return 'SELL';
    if (lower.includes('grant')) return 'GRANT';
    if (lower.includes('exercise')) return 'OPTION_EXERCISE';
    if (lower.includes('transfer')) return 'TRANSFER';
    if (lower.includes('gift')) return 'GIFT';
    if (lower.includes('award')) return 'AWARD';
    if (lower.includes('tax')) return 'TAX';
    if (lower.includes('conversion')) return 'CONVERSION';
    if (lower.includes('inherit')) return 'INHERIT';
    if (lower.includes('disposition')) return 'DISPOSITION';
    return 'OTHER';
  }

  private parsePrice(priceStr: string): number {
    try {
      const cleanStr = priceStr.replace(/[^0-9.-]/g, '');
      return parseFloat(cleanStr) || 0;
    } catch {
      return 0;
    }
  }

  private parseShares(sharesStr: string): number {
    try {
      const cleanStr = sharesStr.replace(/[^0-9.-]/g, '');
      return parseInt(cleanStr) || 0;
    } catch {
      return 0;
    }
  }

  private parseValue(valueStr: string): number {
    try {
      let cleanStr = valueStr.replace(/[^0-9.-]/g, '');
      let multiplier = 1;

      if (valueStr.includes('M') || valueStr.includes('million')) {
        multiplier = 1000000;
      } else if (valueStr.includes('K') || valueStr.includes('thousand')) {
        multiplier = 1000;
      } else if (valueStr.includes('B') || valueStr.includes('billion')) {
        multiplier = 1000000000;
      }

      return (parseFloat(cleanStr) || 0) * multiplier;
    } catch {
      return 0;
    }
  }

  // 수동 실행 메서드
  async executeManualImport(): Promise<void> {
    console.log('🚀 수동 대량 데이터 수집 시작');
    await this.importFromMultipleSources();
    console.log('✅ 수동 대량 데이터 수집 완료');
  }
}

export const massiveDataImporter = new MassiveDataImporter();