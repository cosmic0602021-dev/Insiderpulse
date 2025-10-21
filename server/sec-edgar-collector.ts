import { storage } from './storage';
import { dataIntegrityService } from './data-integrity-service';
import type { InsertInsiderTrade } from '@shared/schema';

// Break circular dependency - broadcaster function will be injected
let broadcaster: ((event: string, data: any) => void) | null = null;

export function setBroadcaster(fn: (event: string, data: any) => void) {
  broadcaster = fn;
}

interface SECFiling {
  accession_number: string;
  company_name: string;
  ticker: string;
  cik: string;
  form_type: string;
  filing_date: string;
  period_of_report: string;
  document_url: string;
}

interface Form4Data {
  accessionNumber: string;
  companyName: string;
  ticker: string;
  cik: string;
  filingDate: string;
  reportOwner: {
    name: string;
    title: string;
  };
  transactions: Array<{
    securityTitle: string;
    transactionCode: string;
    transactionDate: string;
    shares: number;
    pricePerShare: number;
    acquiredDisposed: 'A' | 'D';
    totalValue: number;
  }>;
}

/**
 * SEC EDGAR API를 사용한 실제 내부자 거래 데이터 수집기
 * 100% 실제 SEC Form 4 데이터만 수집
 */
class SECEdgarCollector {
  private baseUrl = 'https://data.sec.gov';
  private userAgent = 'Mozilla/5.0 (compatible; InsiderTrackBot/1.0; data collection for investment research)';

  async collectLatestForm4Filings(limit: number = 50): Promise<number> {
    try {
      console.log('🔍 Starting SEC EDGAR Form 4 collection...');
      console.log(`📡 Fetching from SEC EDGAR API: ${this.baseUrl}`);

      // SEC의 최신 Form 4 파일링 가져오기
      const filings = await this.getLatestForm4Filings(limit);
      console.log(`📄 Found ${filings.length} recent Form 4 filings`);

      let processed = 0;
      let duplicates = 0;
      let errors = 0;

      for (const filing of filings) {
        try {
          // 중복 체크
          const existingTrade = await this.findExistingTrade(filing.accession_number);
          if (existingTrade) {
            duplicates++;
            continue;
          }

          // Form 4 데이터 파싱
          const form4Data = await this.parseForm4Filing(filing);
          if (!form4Data || form4Data.transactions.length === 0) {
            continue;
          }

          // 각 거래를 개별적으로 저장
          for (const transaction of form4Data.transactions) {
            const tradeData: InsertInsiderTrade = {
              accessionNumber: form4Data.accessionNumber,
              companyName: form4Data.companyName,
              ticker: form4Data.ticker || this.extractTickerFromCIK(form4Data.cik),
              traderName: form4Data.reportOwner.name,
              traderTitle: form4Data.reportOwner.title || 'Officer/Director',
              tradeType: this.mapTransactionCode(transaction.transactionCode, transaction.acquiredDisposed),
              shares: transaction.shares,
              pricePerShare: transaction.pricePerShare,
              totalValue: transaction.totalValue,
              tradeDate: new Date(transaction.transactionDate),
              filedDate: new Date(form4Data.filingDate),
              sharesAfter: transaction.shares, // Simplified
              ownershipPercentage: 0, // Would need additional calculation
              significanceScore: this.calculateSignificanceScore(transaction),
              signalType: transaction.acquiredDisposed === 'A' ? 'BUY' : 'SELL',
              isVerified: true,
              verificationStatus: 'VERIFIED',
              verificationNotes: `SEC Form 4 filing: ${form4Data.accessionNumber}`,
              secFilingUrl: filing.document_url,
              marketPrice: transaction.pricePerShare,
              createdAt: new Date()
            };

            // 🚨 데이터 무결성 검증
            const integrityCheck = await dataIntegrityService.validateNewTrade(tradeData);
            if (!integrityCheck.shouldSave) {
              console.warn(`🚨 Rejected invalid trade from SEC filing ${form4Data.accessionNumber}: ${integrityCheck.reason}`);
              continue;
            }

            // 검증된 데이터 저장
            const savedTrade = await storage.createInsiderTrade(integrityCheck.validatedTrade!);

            // WebSocket 브로드캐스트
            if (broadcaster) {
              broadcaster('NEW_TRADE', { trade: savedTrade });
            }

            processed++;
            console.log(`✅ Processed SEC filing: ${form4Data.ticker} - ${form4Data.reportOwner.name} (${tradeData.tradeType}) - $${tradeData.totalValue.toLocaleString()}`);
          }

        } catch (error) {
          errors++;
          console.error(`❌ Error processing filing ${filing.accession_number}:`, error);
        }
      }

      console.log(`🎉 SEC EDGAR collection completed:`);
      console.log(`   ✅ ${processed} new trades processed`);
      console.log(`   ⚠️  ${duplicates} duplicates skipped`);
      console.log(`   ❌ ${errors} errors`);

      return processed;

    } catch (error) {
      console.error('❌ Error in SEC EDGAR collection:', error);
      throw error;
    }
  }

  /**
   * SEC API에서 최신 Form 4 파일링 가져오기
   */
  private async getLatestForm4Filings(limit: number): Promise<SECFiling[]> {
    try {
      // SEC의 최근 파일링 검색
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const fromDate = lastWeek.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];

      // SEC EDGAR의 submissions API 사용
      const searchUrl = `${this.baseUrl}/api/xbrl/submissions/?date-from=${fromDate}&date-to=${toDate}&form-type=4&count=${limit}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Host': 'data.sec.gov'
        }
      });

      if (!response.ok) {
        throw new Error(`SEC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // SEC API 응답을 우리 형식으로 변환
      return this.transformSECResponse(data);

    } catch (error) {
      console.error('Error fetching Form 4 filings from SEC:', error);
      console.error('⚠️ NO FAKE DATA will be generated - returning empty array');

      // 가짜 데이터 생성 완전 제거 - 빈 배열 반환
      return [];
    }
  }

  /**
   * SEC API 응답을 우리 형식으로 변환
   */
  private transformSECResponse(secData: any): SECFiling[] {
    // SEC API 구조에 따라 데이터 변환
    // 실제 구현에서는 SEC의 정확한 API 구조에 맞춰 수정 필요
    if (!secData.filings || !secData.filings.recent) {
      return [];
    }

    const filings: SECFiling[] = [];
    const recent = secData.filings.recent;

    for (let i = 0; i < Math.min(recent.accessionNumber?.length || 0, 50); i++) {
      if (recent.form?.[i] === '4') { // Form 4만 필터링
        filings.push({
          accession_number: recent.accessionNumber[i],
          company_name: recent.companyName || 'Unknown Company',
          ticker: recent.ticker || '',
          cik: recent.cik || '',
          form_type: '4',
          filing_date: recent.filingDate[i],
          period_of_report: recent.reportDate?.[i] || recent.filingDate[i],
          document_url: `${this.baseUrl}/Archives/edgar/data/${recent.cik}/${recent.accessionNumber[i].replace(/-/g, '')}/${recent.primaryDocument[i]}`
        });
      }
    }

    return filings;
  }

  /**
   * 백업용 샘플 데이터 생성 (테스트/개발용)
   */
  private generateSampleSECFilings(): SECFiling[] {
    const today = new Date();
    const companies = [
      { name: 'Apple Inc', ticker: 'AAPL', cik: '0000320193' },
      { name: 'Microsoft Corporation', ticker: 'MSFT', cik: '0000789019' },
      { name: 'Tesla Inc', ticker: 'TSLA', cik: '0001318605' },
      { name: 'Amazon.com Inc', ticker: 'AMZN', cik: '0001018724' },
      { name: 'Alphabet Inc', ticker: 'GOOGL', cik: '0001652044' }
    ];

    return companies.map((company, index) => ({
      accession_number: `0001234567-24-${String(Date.now() + index).slice(-6)}`,
      company_name: company.name,
      ticker: company.ticker,
      cik: company.cik,
      form_type: '4',
      filing_date: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_of_report: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      document_url: `${this.baseUrl}/Archives/edgar/data/${company.cik}/form4-sample.xml`
    }));
  }

  /**
   * Form 4 파일링 파싱
   * 가짜 데이터 생성 완전 제거 - 실제 XML 파싱만 수행
   */
  private async parseForm4Filing(filing: SECFiling): Promise<Form4Data | null> {
    try {
      console.error('⚠️ Real XML parsing not implemented yet - skipping filing');
      console.error('🚫 NO FAKE DATA will be generated');

      // 실제 XML 파싱이 구현될 때까지 null 반환
      // 가짜 데이터 생성 완전 제거
      return null;

    } catch (error) {
      console.error(`Error parsing Form 4 filing ${filing.accession_number}:`, error);
      return null;
    }
  }

  /**
   * 샘플 거래 생성 (실제 SEC 데이터 패턴 기반)
   */
  private generateSampleTransactions(filing: SECFiling): Array<{
    securityTitle: string;
    transactionCode: string;
    transactionDate: string;
    shares: number;
    pricePerShare: number;
    acquiredDisposed: 'A' | 'D';
    totalValue: number;
  }> {
    const transactionTypes = ['P', 'S', 'A', 'M']; // Purchase, Sale, Award, etc.
    const acquiredDisposed: ('A' | 'D')[] = ['A', 'D'];

    const shares = Math.floor(Math.random() * 50000) + 1000;
    const pricePerShare = Math.floor(Math.random() * 300) + 50;
    const totalValue = shares * pricePerShare;

    return [{
      securityTitle: 'Common Stock',
      transactionCode: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      transactionDate: filing.period_of_report,
      shares,
      pricePerShare,
      acquiredDisposed: acquiredDisposed[Math.floor(Math.random() * acquiredDisposed.length)],
      totalValue
    }];
  }

  /**
   * 실제적인 임원 이름 생성
   */
  private generateRealisticExecutiveName(): string {
    const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Mary', 'James', 'Patricia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * 실제적인 직책 생성
   */
  private generateRealisticTitle(): string {
    const titles = [
      'Chief Executive Officer', 'Chief Financial Officer', 'Chief Operating Officer',
      'President', 'Senior Vice President', 'Vice President', 'Director',
      'Chief Technology Officer', 'Chief Marketing Officer', 'General Counsel'
    ];

    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * 거래 코드를 우리 시스템의 거래 타입으로 매핑
   */
  private mapTransactionCode(code: string, acquiredDisposed: 'A' | 'D'): 'BUY' | 'SELL' | 'TRANSFER' {
    // SEC Form 4 거래 코드 매핑
    if (code === 'P' || (code === 'A' && acquiredDisposed === 'A')) {
      return 'BUY'; // Purchase or Award (acquired)
    } else if (code === 'S' || (code === 'A' && acquiredDisposed === 'D')) {
      return 'SELL'; // Sale or Award (disposed)
    } else {
      return 'TRANSFER'; // Other types (M, G, F, etc.)
    }
  }

  /**
   * 중복 거래 확인
   */
  private async findExistingTrade(accessionNumber: string): Promise<any> {
    const recentTrades = await storage.getInsiderTrades(1000);
    return recentTrades.find(trade => trade.accessionNumber === accessionNumber);
  }

  /**
   * CIK에서 티커 추출 (간단한 매핑)
   */
  private extractTickerFromCIK(cik: string): string {
    // 실제 구현에서는 CIK-to-ticker 매핑 테이블 필요
    const cikToTicker: Record<string, string> = {
      '0000320193': 'AAPL',
      '0000789019': 'MSFT',
      '0001318605': 'TSLA',
      '0001018724': 'AMZN',
      '0001652044': 'GOOGL'
    };

    return cikToTicker[cik] || 'UNKNOWN';
  }

  /**
   * 거래 중요도 점수 계산
   */
  private calculateSignificanceScore(transaction: any): number {
    let score = 30; // 기본 점수

    // 거래 금액 기반 점수
    if (transaction.totalValue > 50000000) score += 40; // $50M+
    else if (transaction.totalValue > 10000000) score += 30; // $10M+
    else if (transaction.totalValue > 1000000) score += 20; // $1M+
    else if (transaction.totalValue > 100000) score += 10; // $100K+

    // 거래 타입별 가중치
    if (transaction.acquiredDisposed === 'A') score += 15; // 매수
    else if (transaction.acquiredDisposed === 'D') score += 5; // 매도

    return Math.min(score, 100);
  }
}

export const secEdgarCollector = new SECEdgarCollector();