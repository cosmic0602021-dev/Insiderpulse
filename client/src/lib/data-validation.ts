import type { InsiderTrade } from '@shared/schema';

/**
 * 데이터 품질 및 최신성 검증 시스템
 * 가짜 데이터를 완전히 차단하고 실제 데이터의 신뢰성을 보장
 */

export interface DataValidationResult {
  isValid: boolean;
  isReal: boolean;
  isFresh: boolean;
  issues: string[];
  dataAge: number; // milliseconds
  source: 'database' | 'api' | 'unknown';
}

export interface DataFreshnessConfig {
  maxAgeMinutes: number;
  requiredFields: string[];
  allowedSources: string[];
}

export class DataValidator {
  private config: DataFreshnessConfig;

  constructor(config: DataFreshnessConfig = {
    maxAgeMinutes: 30, // 30분 이내 데이터만 허용
    requiredFields: ['id', 'accessionNumber', 'filedDate', 'ticker', 'companyName'],
    allowedSources: ['SEC', 'OpenInsider', 'EdgarAPI']
  }) {
    this.config = config;
  }

  /**
   * 거래 데이터 검증
   */
  validateTrade(trade: InsiderTrade): DataValidationResult {
    const issues: string[] = [];
    const now = Date.now();

    // 1. 필수 필드 검증
    for (const field of this.config.requiredFields) {
      if (!trade[field as keyof InsiderTrade]) {
        issues.push(`Missing required field: ${field}`);
      }
    }

    // 2. 실제 데이터 검증 (가짜 데이터 패턴 감지)
    const isReal = this.validateRealData(trade);
    if (!isReal) {
      issues.push('Detected fake or simulated data');
    }

    // 3. 데이터 신선도 검증
    const createdAt = trade.createdAt ? new Date(trade.createdAt).getTime() : 0;
    const dataAge = now - createdAt;
    const maxAge = this.config.maxAgeMinutes * 60 * 1000;
    const isFresh = dataAge <= maxAge;

    if (!isFresh) {
      issues.push(`Data is too old: ${Math.round(dataAge / 60000)} minutes old`);
    }

    // 4. 데이터 소스 검증
    const source = this.determineDataSource(trade);

    return {
      isValid: issues.length === 0,
      isReal,
      isFresh,
      issues,
      dataAge,
      source
    };
  }

  /**
   * 가짜 데이터 패턴 감지
   */
  private validateRealData(trade: InsiderTrade): boolean {
    // 가짜 데이터 패턴들
    const fakePatterns = [
      // 가짜 이름 패턴
      /test|sample|fake|mock|dummy|example/i,
      // 가짜 회사명 패턴
      /test\s*(corp|company|inc)/i,
      // 시뮬레이션 데이터 패턴
      /simulation|demo/i
    ];

    const textFields = [
      trade.traderName,
      trade.companyName,
      trade.traderTitle,
      trade.verificationNotes
    ].filter(Boolean);

    // 텍스트 필드에서 가짜 패턴 검사
    for (const text of textFields) {
      for (const pattern of fakePatterns) {
        if (pattern.test(text || '')) {
          console.warn(`🚨 Fake data pattern detected in "${text}"`);
          return false;
        }
      }
    }

    // SEC 번호 형식 검증 (실제 SEC 번호는 특정 형식을 가짐)
    if (trade.accessionNumber && !this.validateSecAccessionNumber(trade.accessionNumber)) {
      console.warn(`🚨 Invalid SEC accession number format: ${trade.accessionNumber}`);
      return false;
    }

    return true;
  }

  /**
   * SEC 번호 형식 검증 - 실제 데이터 소스들의 다양한 형식 지원
   * MarketBeat, OpenInsider 등 실제 거래 데이터 플랫폼들의 형식 포함
   */
  private validateSecAccessionNumber(accessionNumber: string): boolean {
    // 1. 전통적인 SEC 번호 형식: 0000000000-00-000000 (10-2-6 digits)
    const secPattern = /^\d{10}-\d{2}-\d{6}$/;
    
    // 2. MarketBeat 실제 거래 데이터 형식: marketbeat-TICKER-hash
    const marketBeatPattern = /^marketbeat-[A-Z]+(-[a-f0-9]+)?$/i;
    
    // 3. OpenInsider 실제 거래 데이터 형식: openinsider-TICKER-hash 또는 유사 패턴
    const openInsiderPattern = /^openinsider-[A-Z]+(-[a-f0-9]+)?$/i;
    
    // 4. 기타 실제 거래 플랫폼 형식들
    const realDataPatterns = [
      secPattern,
      marketBeatPattern, 
      openInsiderPattern
    ];
    
    // 어떤 실제 데이터 패턴이라도 맞으면 유효한 것으로 간주
    return realDataPatterns.some(pattern => pattern.test(accessionNumber));
  }

  /**
   * 데이터 소스 판별
   */
  private determineDataSource(trade: InsiderTrade): 'database' | 'api' | 'unknown' {
    if (trade.secFilingUrl?.includes('sec.gov')) {
      return 'api';
    }
    if (trade.id && trade.createdAt) {
      return 'database';
    }
    return 'unknown';
  }

  /**
   * 거래 목록 일괄 검증
   */
  validateTrades(trades: InsiderTrade[]): {
    validTrades: InsiderTrade[];
    invalidTrades: InsiderTrade[];
    summary: {
      total: number;
      valid: number;
      real: number;
      fresh: number;
      issues: string[];
    };
  } {
    const validTrades: InsiderTrade[] = [];
    const invalidTrades: InsiderTrade[] = [];
    const allIssues: string[] = [];
    let realCount = 0;
    let freshCount = 0;

    for (const trade of trades) {
      const validation = this.validateTrade(trade);

      if (validation.isValid && validation.isReal) {
        validTrades.push(trade);
      } else {
        invalidTrades.push(trade);
        allIssues.push(...validation.issues);
      }

      if (validation.isReal) realCount++;
      if (validation.isFresh) freshCount++;
    }

    return {
      validTrades,
      invalidTrades,
      summary: {
        total: trades.length,
        valid: validTrades.length,
        real: realCount,
        fresh: freshCount,
        issues: [...new Set(allIssues)] // 중복 제거
      }
    };
  }
}

/**
 * 데이터 신선도 모니터링
 */
export class DataFreshnessMonitor {
  private lastDataCheck: number = 0;
  private dataWarnings: string[] = [];

  /**
   * 데이터가 충분히 신선한지 확인
   */
  checkDataFreshness(trades: InsiderTrade[]): {
    isFresh: boolean;
    warnings: string[];
    lastTradeAge: number;
    oldestTradeAge: number;
  } {
    if (trades.length === 0) {
      return {
        isFresh: false,
        warnings: ['No trades available'],
        lastTradeAge: 0,
        oldestTradeAge: 0
      };
    }

    const now = Date.now();
    const warnings: string[] = [];

    // 최신 거래와 가장 오래된 거래 찾기
    const tradeDates = trades
      .map(t => new Date(t.filedDate || t.createdAt || '').getTime())
      .filter(d => d > 0)
      .sort((a, b) => b - a);

    const lastTradeAge = now - tradeDates[0];
    const oldestTradeAge = now - tradeDates[tradeDates.length - 1];

    // 24시간 이내 거래가 없으면 경고
    const dayInMs = 24 * 60 * 60 * 1000;
    if (lastTradeAge > dayInMs) {
      warnings.push(`Last trade is ${Math.round(lastTradeAge / dayInMs)} days old`);
    }

    // 거래 데이터가 일주일 이상 오래되면 경고
    const weekInMs = 7 * dayInMs;
    if (oldestTradeAge > weekInMs) {
      warnings.push(`Oldest trade is ${Math.round(oldestTradeAge / weekInMs)} weeks old`);
    }

    this.dataWarnings = warnings;
    return {
      isFresh: warnings.length === 0,
      warnings,
      lastTradeAge,
      oldestTradeAge
    };
  }

  /**
   * 현재 데이터 상태 요약
   */
  getDataStatus(): {
    lastCheck: Date;
    warnings: string[];
    status: 'fresh' | 'stale' | 'unknown';
  } {
    return {
      lastCheck: new Date(this.lastDataCheck),
      warnings: this.dataWarnings,
      status: this.dataWarnings.length === 0 ? 'fresh' : 'stale'
    };
  }
}

// 전역 인스턴스
export const dataValidator = new DataValidator();
export const dataFreshnessMonitor = new DataFreshnessMonitor();