/**
 * 통합 스크래핑 시스템 - 모든 소스를 조합하여 최고 품질의 데이터 제공
 * 1순위: SEC EDGAR API (정확성)
 * 2순위: SEC RSS Feed (실시간성)
 * 3순위: OpenInsider (완성도)
 */

import { edgarApiScraper } from './edgar-api-scraper';
import { secRssScraper } from './sec-rss-scraper';
import { openInsiderScraper } from './openinsider-scraper';

interface UnifiedInsiderTrade {
  id: string; // 고유 식별자
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  transactionDate: string;
  filingDate: string;
  transactionType: 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER';
  pricePerShare: number;
  shares: number;
  totalValue: number;
  sharesOwnedAfter?: number;
  accessionNumber?: string;
  secLink?: string;
  source: 'SEC_EDGAR_API' | 'SEC_RSS_FEED' | 'OPENINSIDER';
  sourceUrl?: string;
  confidence: number; // 데이터 신뢰도 (0-100)
  verified: boolean; // 교차 검증 완료 여부
  createdAt: string;
  updatedAt: string;
}

interface ScrapingConfig {
  enabledSources: ('edgar' | 'rss' | 'openinsider')[];
  maxTradesPerSource: number;
  deduplicationEnabled: boolean;
  verificationEnabled: boolean;
  schedulingEnabled: boolean;
  schedulingInterval: number; // 분 단위
}

export class UnifiedScraperSystem {
  private trades: Map<string, UnifiedInsiderTrade> = new Map();
  private isScrapingActive = false;
  private schedulingTimer?: NodeJS.Timeout;

  private defaultConfig: ScrapingConfig = {
    enabledSources: ['edgar', 'rss', 'openinsider'],
    maxTradesPerSource: 100,
    deduplicationEnabled: true,
    verificationEnabled: true,
    schedulingEnabled: true,
    schedulingInterval: 10 // 10분마다
  };

  constructor(private config: ScrapingConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
    console.log('🚀 통합 스크래핑 시스템 초기화됨');
    console.log('📋 설정:', this.config);
  }

  /**
   * 전체 데이터 수집 실행 (모든 소스에서)
   */
  async executeFullScraping(): Promise<UnifiedInsiderTrade[]> {
    if (this.isScrapingActive) {
      console.log('⚠️ 스크래핑이 이미 진행 중입니다');
      return Array.from(this.trades.values());
    }

    this.isScrapingActive = true;
    console.log('🔄 통합 데이터 수집 시작...');

    const startTime = Date.now();
    const results: {
      edgar: any[];
      rss: any[];
      openinsider: any[];
    } = {
      edgar: [],
      rss: [],
      openinsider: []
    };

    try {
      // 병렬로 모든 소스에서 데이터 수집
      const scrapingPromises = [];

      if (this.config.enabledSources.includes('edgar')) {
        scrapingPromises.push(
          this.scrapeFromEdgar().then(data => results.edgar = data)
        );
      }

      if (this.config.enabledSources.includes('rss')) {
        scrapingPromises.push(
          this.scrapeFromRss().then(data => results.rss = data)
        );
      }

      if (this.config.enabledSources.includes('openinsider')) {
        scrapingPromises.push(
          this.scrapeFromOpenInsider().then(data => results.openinsider = data)
        );
      }

      // 모든 스크래핑 완료까지 대기
      await Promise.allSettled(scrapingPromises);

      // 데이터 통합 및 정제
      const unifiedTrades = await this.unifyAndCleanData(results);

      console.log(`✅ 통합 스크래핑 완료!`);
      console.log(`📊 수집 결과:`);
      console.log(`   - SEC EDGAR: ${results.edgar.length}개`);
      console.log(`   - SEC RSS: ${results.rss.length}개`);
      console.log(`   - OpenInsider: ${results.openinsider.length}개`);
      console.log(`   - 통합 후: ${unifiedTrades.length}개`);
      console.log(`⏱️ 소요 시간: ${((Date.now() - startTime) / 1000).toFixed(1)}초`);

      return unifiedTrades;

    } catch (error) {
      console.error('❌ 통합 스크래핑 오류:', error.message);
      return [];
    } finally {
      this.isScrapingActive = false;
    }
  }

  /**
   * SEC EDGAR API에서 데이터 수집
   */
  private async scrapeFromEdgar(): Promise<any[]> {
    try {
      console.log('🏛️ SEC EDGAR API 데이터 수집 중...');
      const trades = await edgarApiScraper.scrapeAllMajorCompanies();
      console.log(`✅ EDGAR: ${trades.length}개 거래 수집 완료`);
      return trades;
    } catch (error) {
      console.error('❌ EDGAR 스크래핑 오류:', error.message);
      return [];
    }
  }

  /**
   * SEC RSS 피드에서 데이터 수집
   */
  private async scrapeFromRss(): Promise<any[]> {
    try {
      console.log('📡 SEC RSS 피드 데이터 수집 중...');
      const trades = await secRssScraper.getLatestForm4Filings();
      console.log(`✅ RSS: ${trades.length}개 거래 수집 완료`);
      return trades;
    } catch (error) {
      console.error('❌ RSS 스크래핑 오류:', error.message);
      return [];
    }
  }

  /**
   * OpenInsider에서 데이터 수집
   */
  private async scrapeFromOpenInsider(): Promise<any[]> {
    try {
      console.log('🔍 OpenInsider 데이터 수집 중...');
      const trades = await openInsiderScraper.scrapeLatestTrades(this.config.maxTradesPerSource);
      console.log(`✅ OpenInsider: ${trades.length}개 거래 수집 완료`);
      return trades;
    } catch (error) {
      console.error('❌ OpenInsider 스크래핑 오류:', error.message);
      return [];
    }
  }

  /**
   * 여러 소스의 데이터를 통합하고 정제
   */
  private async unifyAndCleanData(results: any): Promise<UnifiedInsiderTrade[]> {
    console.log('🔧 데이터 통합 및 정제 시작...');

    const allRawTrades = [
      ...results.edgar.map((t: any) => ({ ...t, sourceType: 'edgar' })),
      ...results.rss.map((t: any) => ({ ...t, sourceType: 'rss' })),
      ...results.openinsider.map((t: any) => ({ ...t, sourceType: 'openinsider' }))
    ];

    console.log(`📊 통합 전 총 ${allRawTrades.length}개 거래 데이터`);

    // 표준 형식으로 변환
    const normalizedTrades = allRawTrades.map(trade => this.normalizeTradeData(trade));

    // 중복 제거
    let uniqueTrades = normalizedTrades;
    if (this.config.deduplicationEnabled) {
      uniqueTrades = this.removeDuplicates(normalizedTrades);
      console.log(`🗑️ 중복 제거: ${normalizedTrades.length} → ${uniqueTrades.length}개`);
    }

    // 교차 검증
    if (this.config.verificationEnabled) {
      await this.performCrossVerification(uniqueTrades);
      console.log('✅ 교차 검증 완료');
    }

    // 신뢰도 계산
    uniqueTrades.forEach(trade => {
      trade.confidence = this.calculateConfidence(trade);
    });

    // 메모리에 저장
    uniqueTrades.forEach(trade => {
      this.trades.set(trade.id, trade);
    });

    console.log('🎯 데이터 통합 및 정제 완료');
    return uniqueTrades;
  }

  /**
   * 거래 데이터를 표준 형식으로 정규화
   */
  private normalizeTradeData(rawTrade: any): UnifiedInsiderTrade {
    const now = new Date().toISOString();

    // 고유 ID 생성 (ticker + insider + date + value 기반)
    const idString = `${rawTrade.ticker || ''}_${rawTrade.insiderName || ''}_${rawTrade.transactionDate || ''}_${rawTrade.totalValue || rawTrade.value || 0}`;
    const id = Buffer.from(idString).toString('base64').replace(/[/+=]/g, '').substring(0, 16);

    return {
      id,
      ticker: rawTrade.ticker || 'UNKNOWN',
      companyName: rawTrade.companyName || 'Unknown Company',
      insiderName: rawTrade.insiderName || 'Unknown Insider',
      title: rawTrade.title || 'Unknown Title',
      transactionDate: rawTrade.transactionDate || rawTrade.tradeDate || now.split('T')[0],
      filingDate: rawTrade.filingDate || now.split('T')[0],
      transactionType: this.normalizeTransactionType(rawTrade.transactionType || rawTrade.tradeType || 'OTHER'),
      pricePerShare: this.normalizePrice(rawTrade.pricePerShare || rawTrade.price || 0),
      shares: this.normalizeShares(rawTrade.shares || 0),
      totalValue: this.normalizeValue(rawTrade.totalValue || rawTrade.value || 0),
      sharesOwnedAfter: rawTrade.sharesOwnedAfter || rawTrade.ownedShares,
      accessionNumber: rawTrade.accessionNumber,
      secLink: rawTrade.secLink || rawTrade.link,
      source: this.normalizeSource(rawTrade.source || rawTrade.sourceType),
      sourceUrl: rawTrade.sourceUrl || rawTrade.link,
      confidence: 0, // 나중에 계산
      verified: false,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 거래 유형 정규화
   */
  private normalizeTransactionType(type: string): 'BUY' | 'SELL' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER' {
    const upperType = String(type).toUpperCase();

    if (upperType.includes('BUY') || upperType.includes('PURCHASE') || upperType === 'P') {
      return 'BUY';
    } else if (upperType.includes('SELL') || upperType.includes('SALE') || upperType === 'S') {
      return 'SELL';
    } else if (upperType.includes('OPTION') || upperType.includes('EXERCISE') || upperType === 'M') {
      return 'OPTION_EXERCISE';
    } else if (upperType.includes('GIFT') || upperType === 'G') {
      return 'GIFT';
    } else {
      return 'OTHER';
    }
  }

  /**
   * 소스 정규화
   */
  private normalizeSource(source: string): 'SEC_EDGAR_API' | 'SEC_RSS_FEED' | 'OPENINSIDER' {
    const lowerSource = String(source).toLowerCase();

    if (lowerSource.includes('edgar') || lowerSource.includes('sec_edgar')) {
      return 'SEC_EDGAR_API';
    } else if (lowerSource.includes('rss') || lowerSource.includes('sec_rss')) {
      return 'SEC_RSS_FEED';
    } else {
      return 'OPENINSIDER';
    }
  }

  /**
   * 숫자 정규화
   */
  private normalizePrice(price: any): number {
    const num = parseFloat(String(price).replace(/[,$]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  private normalizeShares(shares: any): number {
    const num = parseInt(String(shares).replace(/[,]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  private normalizeValue(value: any): number {
    const num = parseFloat(String(value).replace(/[,$]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  /**
   * 중복 거래 제거
   */
  private removeDuplicates(trades: UnifiedInsiderTrade[]): UnifiedInsiderTrade[] {
    const uniqueMap = new Map<string, UnifiedInsiderTrade>();

    for (const trade of trades) {
      const key = `${trade.ticker}_${trade.insiderName}_${trade.transactionDate}_${trade.totalValue}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, trade);
      } else {
        // 중복된 경우 더 신뢰할 수 있는 소스 우선
        const existing = uniqueMap.get(key)!;
        const existingPriority = this.getSourcePriority(existing.source);
        const newPriority = this.getSourcePriority(trade.source);

        if (newPriority > existingPriority) {
          uniqueMap.set(key, trade);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * 소스 우선순위 (높을수록 신뢰성 높음)
   */
  private getSourcePriority(source: string): number {
    switch (source) {
      case 'SEC_EDGAR_API': return 3;
      case 'SEC_RSS_FEED': return 2;
      case 'OPENINSIDER': return 1;
      default: return 0;
    }
  }

  /**
   * 교차 검증 수행
   */
  private async performCrossVerification(trades: UnifiedInsiderTrade[]): Promise<void> {
    // 여러 소스에서 동일한 거래가 발견되면 verified = true
    const tradeGroups = new Map<string, UnifiedInsiderTrade[]>();

    // 유사한 거래들 그룹화
    for (const trade of trades) {
      const groupKey = `${trade.ticker}_${trade.transactionDate}`;
      if (!tradeGroups.has(groupKey)) {
        tradeGroups.set(groupKey, []);
      }
      tradeGroups.get(groupKey)!.push(trade);
    }

    // 2개 이상의 소스에서 확인된 거래는 verified = true
    for (const [groupKey, groupTrades] of tradeGroups) {
      const uniqueSources = new Set(groupTrades.map(t => t.source));
      if (uniqueSources.size >= 2) {
        groupTrades.forEach(trade => trade.verified = true);
      }
    }
  }

  /**
   * 신뢰도 점수 계산 (0-100)
   */
  private calculateConfidence(trade: UnifiedInsiderTrade): number {
    let confidence = 50; // 기본 점수

    // 소스별 가점
    switch (trade.source) {
      case 'SEC_EDGAR_API':
        confidence += 30;
        break;
      case 'SEC_RSS_FEED':
        confidence += 20;
        break;
      case 'OPENINSIDER':
        confidence += 15;
        break;
    }

    // 검증 여부 가점
    if (trade.verified) {
      confidence += 20;
    }

    // 데이터 완성도 가점
    if (trade.accessionNumber) confidence += 5;
    if (trade.secLink) confidence += 5;
    if (trade.sharesOwnedAfter) confidence += 3;
    if (trade.pricePerShare > 0) confidence += 2;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * 자동 스케줄링 시작
   */
  startScheduledScraping(): void {
    if (!this.config.schedulingEnabled) {
      console.log('⚠️ 스케줄링이 비활성화되어 있습니다');
      return;
    }

    console.log(`⏰ 자동 스크래핑 시작 (${this.config.schedulingInterval}분마다)`);

    this.schedulingTimer = setInterval(async () => {
      console.log('🔄 스케줄된 스크래핑 실행...');
      await this.executeFullScraping();
    }, this.config.schedulingInterval * 60 * 1000);
  }

  /**
   * 자동 스케줄링 중지
   */
  stopScheduledScraping(): void {
    if (this.schedulingTimer) {
      clearInterval(this.schedulingTimer);
      this.schedulingTimer = undefined;
      console.log('⏹️ 자동 스크래핑 중지됨');
    }
  }

  /**
   * 현재 저장된 거래 데이터 반환
   */
  getAllTrades(): UnifiedInsiderTrade[] {
    return Array.from(this.trades.values());
  }

  /**
   * 특정 조건으로 거래 필터링
   */
  getFilteredTrades(filter: {
    ticker?: string;
    minValue?: number;
    maxValue?: number;
    transactionType?: string;
    minConfidence?: number;
    verifiedOnly?: boolean;
  }): UnifiedInsiderTrade[] {
    let trades = this.getAllTrades();

    if (filter.ticker) {
      trades = trades.filter(t => t.ticker === filter.ticker.toUpperCase());
    }

    if (filter.minValue) {
      trades = trades.filter(t => t.totalValue >= filter.minValue!);
    }

    if (filter.maxValue) {
      trades = trades.filter(t => t.totalValue <= filter.maxValue!);
    }

    if (filter.transactionType) {
      trades = trades.filter(t => t.transactionType === filter.transactionType);
    }

    if (filter.minConfidence) {
      trades = trades.filter(t => t.confidence >= filter.minConfidence!);
    }

    if (filter.verifiedOnly) {
      trades = trades.filter(t => t.verified);
    }

    return trades;
  }

  /**
   * 통계 정보 반환
   */
  getStatistics(): any {
    const trades = this.getAllTrades();

    return {
      totalTrades: trades.length,
      verifiedTrades: trades.filter(t => t.verified).length,
      averageConfidence: trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length || 0,
      sourceBreakdown: {
        edgar: trades.filter(t => t.source === 'SEC_EDGAR_API').length,
        rss: trades.filter(t => t.source === 'SEC_RSS_FEED').length,
        openinsider: trades.filter(t => t.source === 'OPENINSIDER').length
      },
      transactionTypeBreakdown: {
        buy: trades.filter(t => t.transactionType === 'BUY').length,
        sell: trades.filter(t => t.transactionType === 'SELL').length,
        optionExercise: trades.filter(t => t.transactionType === 'OPTION_EXERCISE').length,
        gift: trades.filter(t => t.transactionType === 'GIFT').length,
        other: trades.filter(t => t.transactionType === 'OTHER').length
      },
      totalValue: trades.reduce((sum, t) => sum + t.totalValue, 0),
      averageValue: trades.reduce((sum, t) => sum + t.totalValue, 0) / trades.length || 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const unifiedScraperSystem = new UnifiedScraperSystem();