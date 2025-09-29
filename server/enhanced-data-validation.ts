import { storage } from './storage';
import { dataIntegrityService } from './data-integrity-service';
import type { InsiderTrade, InsertInsiderTrade } from '@shared/schema';

/**
 * 강화된 데이터 검증 시스템
 * 실시간으로 가짜 데이터를 차단하고 품질을 보장
 */

export interface ValidationResult {
  isValid: boolean;
  isRealData: boolean;
  confidence: number;
  issues: string[];
  shouldSave: boolean;
  shouldBlock: boolean;
  blockReason?: string;
}

export class EnhancedDataValidator {
  private blockedPatterns = new Set<string>();
  private trustedSources = new Set(['openinsider.com', 'sec.gov', 'edgar.sec.gov']);
  private suspiciousIPs = new Set<string>();

  constructor() {
    this.initializeBlockList();
  }

  /**
   * 차단 패턴 초기화
   */
  private initializeBlockList(): void {
    // 가짜 데이터 패턴들
    const fakePatterns = [
      'test', 'sample', 'fake', 'mock', 'dummy', 'example',
      'demo', 'placeholder', 'simulation', 'template',
      'john doe', 'jane doe', 'test user', 'admin user'
    ];

    fakePatterns.forEach(pattern => this.blockedPatterns.add(pattern.toLowerCase()));

    console.log(`🛡️ Enhanced validator initialized with ${this.blockedPatterns.size} blocked patterns`);
  }

  /**
   * 실시간 데이터 검증 - 수집 시점에서 차단
   */
  async validateIncomingTrade(trade: InsertInsiderTrade): Promise<ValidationResult> {
    const issues: string[] = [];
    let confidence = 100;
    let shouldBlock = false;
    let blockReason = '';

    // 1. 즉시 차단 패턴 검사
    const blockCheck = this.checkBlockedPatterns(trade);
    if (blockCheck.blocked) {
      return {
        isValid: false,
        isRealData: false,
        confidence: 0,
        issues: [`BLOCKED: ${blockCheck.reason}`],
        shouldSave: false,
        shouldBlock: true,
        blockReason: blockCheck.reason
      };
    }

    // 2. 기본 무결성 검사
    const integrityResult = dataIntegrityService.validateTrade(trade);
    confidence = Math.min(confidence, integrityResult.confidence);
    issues.push(...integrityResult.issues);

    // 3. SEC 번호 진위성 검사
    if (trade.accessionNumber) {
      const secValidation = this.validateSecAccessionNumber(trade.accessionNumber);
      if (!secValidation.isValid) {
        confidence -= 30;
        issues.push(...secValidation.issues);
      }
    }

    // 4. 거래 패턴 이상치 검사
    const patternCheck = await this.checkTradingPatterns(trade);
    if (patternCheck.suspicious) {
      confidence -= 20;
      issues.push(...patternCheck.issues);
    }

    // 5. 중복 거래 검사
    const duplicateCheck = await this.checkDuplicates(trade);
    if (duplicateCheck.isDuplicate) {
      confidence -= 40;
      issues.push('Duplicate trade detected');
    }

    // 6. 시간 기반 검증
    const timeValidation = this.validateTimestamps(trade);
    if (!timeValidation.valid) {
      confidence -= 25;
      issues.push(...timeValidation.issues);
    }

    const isRealData = confidence > 0;
    const isValid = isRealData && confidence >= 60; // 60% 이상 신뢰도 필요

    return {
      isValid,
      isRealData,
      confidence: Math.max(0, confidence),
      issues,
      shouldSave: isValid,
      shouldBlock: false
    };
  }

  /**
   * 차단 패턴 검사
   */
  private checkBlockedPatterns(trade: InsertInsiderTrade): { blocked: boolean; reason?: string } {
    const fieldsToCheck = [
      trade.traderName,
      trade.companyName,
      trade.traderTitle,
      trade.ticker
    ].filter(Boolean);

    for (const field of fieldsToCheck) {
      const lowercaseField = field!.toLowerCase();

      for (const pattern of this.blockedPatterns) {
        if (lowercaseField.includes(pattern)) {
          return {
            blocked: true,
            reason: `Blocked pattern "${pattern}" found in "${field}"`
          };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * SEC 번호 상세 검증
   */
  private validateSecAccessionNumber(accessionNumber: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // SEC 형식: 0000000000-00-000000
    const secPattern = /^\d{10}-\d{2}-\d{6}$/;

    if (!secPattern.test(accessionNumber)) {
      // 대안 형식들 허용 (OpenInsider 등)
      const alternativePatterns = [
        /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9-]+$/, // openinsider-AAPL-John-20241001-1000-50000
        /^\d{4}-\d{2}-\d{6}$/ // 단축 형식
      ];

      const isAlternativeValid = alternativePatterns.some(pattern => pattern.test(accessionNumber));

      if (!isAlternativeValid) {
        issues.push('Invalid SEC accession number format');
        return { isValid: false, issues };
      }
    }

    // 날짜 부분 검증 (SEC 형식인 경우)
    if (secPattern.test(accessionNumber)) {
      const year = parseInt(accessionNumber.substring(10, 12));
      const currentYear = new Date().getFullYear() % 100;

      if (year > currentYear + 1 || year < currentYear - 10) {
        issues.push('Accession number contains invalid year');
      }
    }

    return { isValid: issues.length === 0, issues };
  }

  /**
   * 거래 패턴 이상치 검사
   */
  private async checkTradingPatterns(trade: InsertInsiderTrade): Promise<{ suspicious: boolean; issues: string[] }> {
    const issues: string[] = [];
    let suspicious = false;

    try {
      // 최근 거래 패턴 분석
      const recentTrades = await storage.getInsiderTrades(100, 0, true);

      if (recentTrades.length > 0) {
        // 동일 인물의 최근 거래 확인
        const sameTraderTrades = recentTrades.filter(t =>
          t.traderName === trade.traderName && t.ticker === trade.ticker
        );

        if (sameTraderTrades.length > 0) {
          const lastTrade = sameTraderTrades[0];
          const timeDiff = new Date(trade.filedDate).getTime() - new Date(lastTrade.filedDate).getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

          // 같은 날 또는 하루 내 동일한 거래
          if (daysDiff < 1 && Math.abs(trade.totalValue - lastTrade.totalValue) < 1000) {
            suspicious = true;
            issues.push('Suspiciously similar trade pattern detected');
          }
        }

        // 거래 금액 이상치 검사
        const avgValue = recentTrades.reduce((sum, t) => sum + t.totalValue, 0) / recentTrades.length;
        const stdDev = Math.sqrt(
          recentTrades.reduce((sum, t) => sum + Math.pow(t.totalValue - avgValue, 2), 0) / recentTrades.length
        );

        if (trade.totalValue > avgValue + (3 * stdDev)) {
          issues.push('Trade value is unusually high compared to recent patterns');
        }
      }

    } catch (error) {
      console.warn('Pattern analysis failed:', error);
    }

    return { suspicious, issues };
  }

  /**
   * 중복 거래 검사
   */
  private async checkDuplicates(trade: InsertInsiderTrade): Promise<{ isDuplicate: boolean }> {
    try {
      const exists = await storage.existsByAccessionNumber(trade.accessionNumber);
      return { isDuplicate: exists };
    } catch (error) {
      console.warn('Duplicate check failed:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * 타임스탬프 검증
   */
  private validateTimestamps(trade: InsertInsiderTrade): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const now = new Date();

    // 거래일 검증
    if (trade.tradeDate) {
      const tradeDate = new Date(trade.tradeDate);

      if (tradeDate > now) {
        issues.push('Trade date is in the future');
      }

      // 너무 오래된 거래 (5년 이상)
      const fiveYearsAgo = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      if (tradeDate < fiveYearsAgo) {
        issues.push('Trade date is too old (over 5 years)');
      }
    }

    // 신고일 검증
    if (trade.filedDate) {
      const filedDate = new Date(trade.filedDate);

      if (filedDate > now) {
        issues.push('Filed date is in the future');
      }

      // 신고일이 거래일보다 이른 경우 (경고만)
      if (trade.tradeDate && filedDate < new Date(trade.tradeDate)) {
        // 일부 경우 허용 (사전 신고 등)
        const daysDiff = (new Date(trade.tradeDate).getTime() - filedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) {
          issues.push('Filed date is significantly before trade date');
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * 차단 패턴 추가
   */
  addBlockedPattern(pattern: string): void {
    this.blockedPatterns.add(pattern.toLowerCase());
    console.log(`🚫 Added blocked pattern: ${pattern}`);
  }

  /**
   * 신뢰할 수 있는 소스 추가
   */
  addTrustedSource(source: string): void {
    this.trustedSources.add(source.toLowerCase());
    console.log(`✅ Added trusted source: ${source}`);
  }

  /**
   * 검증 통계 조회
   */
  getValidationStats(): {
    blockedPatterns: number;
    trustedSources: number;
    suspiciousIPs: number;
  } {
    return {
      blockedPatterns: this.blockedPatterns.size,
      trustedSources: this.trustedSources.size,
      suspiciousIPs: this.suspiciousIPs.size
    };
  }

  /**
   * 일괄 검증 및 정리
   */
  async validateAndCleanDatabase(): Promise<{
    totalChecked: number;
    validTrades: number;
    invalidTrades: number;
    blockedTrades: number;
    cleanedUp: number;
  }> {
    console.log('🧹 Starting enhanced database validation and cleanup...');

    const allTrades = await storage.getInsiderTrades(10000, 0, false);
    let validTrades = 0;
    let invalidTrades = 0;
    let blockedTrades = 0;
    let cleanedUp = 0;

    for (const trade of allTrades) {
      const validation = await this.validateIncomingTrade(trade as InsertInsiderTrade);

      if (validation.shouldBlock) {
        // 차단된 거래 - 비활성화
        await storage.updateInsiderTrade(trade.id, {
          isVerified: false,
          verificationStatus: 'BLOCKED',
          verificationNotes: validation.blockReason,
          significanceScore: 0
        });
        blockedTrades++;
        cleanedUp++;
      } else if (validation.isValid) {
        // 유효한 거래 - 검증 완료
        await storage.updateInsiderTrade(trade.id, {
          isVerified: true,
          verificationStatus: 'VERIFIED',
          verificationNotes: `Enhanced validation: ${validation.confidence}% confidence`,
          significanceScore: Math.round(validation.confidence)
        });
        validTrades++;
      } else {
        // 무효한 거래 - 플래그
        await storage.updateInsiderTrade(trade.id, {
          isVerified: false,
          verificationStatus: 'INVALID',
          verificationNotes: validation.issues.join('; '),
          significanceScore: Math.round(validation.confidence)
        });
        invalidTrades++;
        cleanedUp++;
      }
    }

    console.log(`✅ Enhanced validation complete:`);
    console.log(`   📊 Total checked: ${allTrades.length}`);
    console.log(`   ✅ Valid trades: ${validTrades}`);
    console.log(`   ❌ Invalid trades: ${invalidTrades}`);
    console.log(`   🚫 Blocked trades: ${blockedTrades}`);
    console.log(`   🧹 Cleaned up: ${cleanedUp}`);

    return {
      totalChecked: allTrades.length,
      validTrades,
      invalidTrades,
      blockedTrades,
      cleanedUp
    };
  }
}

// 전역 인스턴스
export const enhancedDataValidator = new EnhancedDataValidator();