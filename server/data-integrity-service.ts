import { type InsiderTrade, type InsertInsiderTrade } from "@shared/schema";
import { storage } from "./storage";

/**
 * 서버 측 데이터 무결성 검증 서비스
 * 가짜 데이터를 차단하고 실제 데이터의 품질을 보장
 */

export interface DataIntegrityResult {
  isValid: boolean;
  isReal: boolean;
  issues: string[];
  confidence: number; // 0-100
}

export class DataIntegrityService {
  private fakePatterns = [
    // 가짜 이름 패턴
    /test|sample|fake|mock|dummy|example/i,
    // 가짜 회사명 패턴
    /test\s*(corp|company|inc)|example\s*(corp|company|inc)/i,
    // 시뮬레이션 데이터 패턴
    /simulation|demo|placeholder/i,
    // 일반적인 가짜 이름들
    /john\s+doe|jane\s+doe|test\s+user/i
  ];

  private suspiciousPatterns = [
    // 너무 반복적인 데이터
    /(.+)\1{2,}/i, // 같은 패턴이 3번 이상 반복
    // 비현실적인 숫자 패턴
    /^(123456|111111|999999|000000)/,
    // 템플릿 형태의 텍스트
    /{.*}|\[.*\]|<.*>/
  ];

  /**
   * 단일 거래 데이터 검증
   */
  validateTrade(trade: InsiderTrade | InsertInsiderTrade): DataIntegrityResult {
    const issues: string[] = [];
    let confidence = 100;

    // 1. 필수 필드 검증
    if (!trade.accessionNumber) {
      issues.push('Missing SEC accession number');
      confidence -= 30;
    }

    if (!trade.companyName || !trade.traderName) {
      issues.push('Missing company or trader name');
      confidence -= 25;
    }

    if (!trade.ticker || trade.ticker.length < 1 || trade.ticker.length > 5) {
      issues.push('Invalid ticker symbol format');
      confidence -= 20;
    }

    // 2. 가짜 데이터 패턴 검증
    const textFields = [
      trade.traderName,
      trade.companyName,
      trade.traderTitle,
      (trade as InsiderTrade).verificationNotes
    ].filter(Boolean);

    for (const text of textFields) {
      // 가짜 패턴 검사
      for (const pattern of this.fakePatterns) {
        if (pattern.test(text || '')) {
          issues.push(`Detected fake data pattern in "${text}"`);
          confidence = 0; // 가짜 데이터는 완전 차단
          break;
        }
      }

      // 의심스러운 패턴 검사
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(text || '')) {
          issues.push(`Suspicious data pattern in "${text}"`);
          confidence -= 15;
          break;
        }
      }
    }

    // 3. SEC 번호 형식 검증
    if (trade.accessionNumber && !this.isValidSecAccessionNumber(trade.accessionNumber)) {
      issues.push('Invalid SEC accession number format');
      confidence -= 40;
    }

    // 4. 거래 데이터 합리성 검증
    if (trade.shares && trade.pricePerShare && trade.totalValue) {
      const calculatedTotal = trade.shares * trade.pricePerShare;
      const variance = Math.abs(calculatedTotal - trade.totalValue) / trade.totalValue;

      if (variance > 0.05) { // 5% 이상 차이
        issues.push('Trade value calculation mismatch');
        confidence -= 20;
      }
    }

    // 5. 날짜 합리성 검증
    if (trade.filedDate && trade.tradeDate) {
      const filedTime = new Date(trade.filedDate).getTime();
      const tradeTime = new Date(trade.tradeDate).getTime();
      const now = Date.now();

      // 미래 날짜 검사
      if (filedTime > now || tradeTime > now) {
        issues.push('Future date detected');
        confidence -= 30;
      }

      // 신고일이 거래일보다 이른 경우
      if (filedTime < tradeTime) {
        issues.push('Filed date before trade date');
        confidence -= 10;
      }

      // 너무 오래된 데이터 (5년 이상)
      const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60 * 1000);
      if (tradeTime < fiveYearsAgo) {
        issues.push('Very old trade data');
        confidence -= 5;
      }
    }

    const isReal = confidence > 0; // 가짜 패턴이 감지되면 완전 차단
    const isValid = isReal && confidence >= 50; // 50% 이상 신뢰도만 허용

    return {
      isValid,
      isReal,
      issues,
      confidence: Math.max(0, confidence)
    };
  }

  /**
   * SEC 번호 형식 검증
   */
  private isValidSecAccessionNumber(accessionNumber: string): boolean {
    // SEC 번호 형식: 0000000000-00-000000 (10-2-6 digits)
    const secPattern = /^\d{10}-\d{2}-\d{6}$/;
    return secPattern.test(accessionNumber);
  }

  /**
   * 거래 목록 일괄 검증
   */
  async validateTrades(trades: (InsiderTrade | InsertInsiderTrade)[]): Promise<{
    validTrades: (InsiderTrade | InsertInsiderTrade)[];
    invalidTrades: (InsiderTrade | InsertInsiderTrade)[];
    summary: {
      total: number;
      valid: number;
      fake: number;
      suspicious: number;
      avgConfidence: number;
    };
  }> {
    const validTrades: (InsiderTrade | InsertInsiderTrade)[] = [];
    const invalidTrades: (InsiderTrade | InsertInsiderTrade)[] = [];
    let totalConfidence = 0;
    let fakeCount = 0;
    let suspiciousCount = 0;

    for (const trade of trades) {
      const validation = this.validateTrade(trade);
      totalConfidence += validation.confidence;

      if (!validation.isReal) {
        fakeCount++;
        invalidTrades.push(trade);
      } else if (validation.isValid) {
        validTrades.push(trade);
        if (validation.confidence < 80) {
          suspiciousCount++;
        }
      } else {
        invalidTrades.push(trade);
      }
    }

    return {
      validTrades,
      invalidTrades,
      summary: {
        total: trades.length,
        valid: validTrades.length,
        fake: fakeCount,
        suspicious: suspiciousCount,
        avgConfidence: trades.length > 0 ? totalConfidence / trades.length : 0
      }
    };
  }

  /**
   * 데이터베이스 전체 무결성 검사
   */
  async auditDatabase(): Promise<{
    totalTrades: number;
    validTrades: number;
    invalidTrades: number;
    fakeTrades: number;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 Starting database integrity audit...');

    try {
      // 전체 거래 데이터 가져오기
      const allTrades = await storage.getInsiderTrades(10000, 0); // 대량 검사

      const validation = await this.validateTrades(allTrades);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // 중복 데이터 검사
      const accessionNumbers = new Set();
      let duplicateCount = 0;

      for (const trade of allTrades) {
        if (accessionNumbers.has(trade.accessionNumber)) {
          duplicateCount++;
        }
        accessionNumbers.add(trade.accessionNumber);
      }

      if (duplicateCount > 0) {
        issues.push(`Found ${duplicateCount} duplicate accession numbers`);
        recommendations.push('Remove duplicate trade records');
      }

      // 데이터 신선도 검사
      const now = Date.now();
      const recentTrades = allTrades.filter(trade => {
        const createdAt = new Date(trade.createdAt || '').getTime();
        return now - createdAt < 7 * 24 * 60 * 60 * 1000; // 7일 이내
      });

      if (recentTrades.length === 0) {
        issues.push('No recent trades in database');
        recommendations.push('Check data collection service');
      }

      // 데이터 품질 통계
      const fakeRatio = validation.summary.fake / validation.summary.total;
      if (fakeRatio > 0.01) { // 1% 이상 가짜 데이터
        issues.push(`High fake data ratio: ${(fakeRatio * 100).toFixed(1)}%`);
        recommendations.push('Improve data collection filters');
      }

      console.log(`✅ Database audit complete: ${validation.summary.valid}/${validation.summary.total} valid trades`);

      return {
        totalTrades: validation.summary.total,
        validTrades: validation.summary.valid,
        invalidTrades: validation.summary.total - validation.summary.valid,
        fakeTrades: validation.summary.fake,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('❌ Database audit failed:', error);
      throw error;
    }
  }

  /**
   * 실시간 데이터 검증 (수집 시점에서)
   */
  async validateNewTrade(trade: InsertInsiderTrade): Promise<{
    shouldSave: boolean;
    validatedTrade?: InsertInsiderTrade;
    reason?: string;
  }> {
    const validation = this.validateTrade(trade);

    if (!validation.isReal) {
      return {
        shouldSave: false,
        reason: `Fake data detected: ${validation.issues.join(', ')}`
      };
    }

    if (!validation.isValid) {
      return {
        shouldSave: false,
        reason: `Invalid data: ${validation.issues.join(', ')}`
      };
    }

    // 검증 정보를 거래 데이터에 추가
    const validatedTrade: InsertInsiderTrade = {
      ...trade,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      verificationNotes: `Auto-verified with ${validation.confidence}% confidence`,
      significanceScore: Math.round(validation.confidence)
    };

    return {
      shouldSave: true,
      validatedTrade
    };
  }
}

// 전역 인스턴스
export const dataIntegrityService = new DataIntegrityService();