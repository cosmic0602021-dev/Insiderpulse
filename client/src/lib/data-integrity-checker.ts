// 내부자 거래 데이터 무결성 검증 시스템
import type { InsiderTrade } from '@shared/schema';

interface DataIntegrityIssue {
  type: 'SUSPICIOUS_PATTERN' | 'INVALID_DATE' | 'DUPLICATE_DATA' | 'UNREALISTIC_VALUES' | 'MISSING_DATA';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedTrades: string[];
  suggestion: string;
}

interface DataQualityReport {
  totalTrades: number;
  validTrades: number;
  issues: DataIntegrityIssue[];
  qualityScore: number; // 0-100
  recommendations: string[];
}

export class DataIntegrityChecker {

  static validateTradeData(trades: InsiderTrade[]): DataQualityReport {
    const issues: DataIntegrityIssue[] = [];
    let validTrades = 0;

    // 1. 날짜 검증
    const dateIssues = this.checkDateAnomalies(trades);
    issues.push(...dateIssues);

    // 2. 중복 데이터 검증
    const duplicateIssues = this.checkDuplicates(trades);
    issues.push(...duplicateIssues);

    // 3. 의심스러운 패턴 검증
    const patternIssues = this.checkSuspiciousPatterns(trades);
    issues.push(...patternIssues);

    // 4. 비현실적 값 검증
    const valueIssues = this.checkUnrealisticValues(trades);
    issues.push(...valueIssues);

    // 5. 누락 데이터 검증
    const missingDataIssues = this.checkMissingData(trades);
    issues.push(...missingDataIssues);

    // 유효한 거래 수 계산
    validTrades = trades.length - this.getAffectedTradesCount(issues);

    // 품질 점수 계산
    const qualityScore = this.calculateQualityScore(trades.length, issues);

    // 권장사항 생성
    const recommendations = this.generateRecommendations(issues);

    return {
      totalTrades: trades.length,
      validTrades,
      issues,
      qualityScore,
      recommendations
    };
  }

  // 날짜 이상 검증
  private static checkDateAnomalies(trades: InsiderTrade[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const currentDate = new Date();
    const futureTrades: string[] = [];
    const oldTrades: string[] = [];

    trades.forEach(trade => {
      const filedDate = new Date(trade.filedDate);
      const tradeDate = new Date(trade.transactionDate);

      // 미래 날짜 검증
      if (filedDate > currentDate) {
        futureTrades.push(trade.id);
      }

      // 너무 오래된 거래 (10년 이상)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(currentDate.getFullYear() - 10);
      if (tradeDate < tenYearsAgo) {
        oldTrades.push(trade.id);
      }

      // 신고일이 거래일보다 이른 경우
      if (filedDate < tradeDate) {
        issues.push({
          type: 'INVALID_DATE',
          severity: 'HIGH',
          description: `신고일(${filedDate.toDateString()})이 거래일(${tradeDate.toDateString()})보다 이릅니다`,
          affectedTrades: [trade.id],
          suggestion: '데이터 소스의 날짜 형식을 확인하세요'
        });
      }
    });

    if (futureTrades.length > 0) {
      issues.push({
        type: 'INVALID_DATE',
        severity: 'HIGH',
        description: `${futureTrades.length}개 거래가 미래 날짜로 기록됨`,
        affectedTrades: futureTrades,
        suggestion: '시스템 시간 또는 데이터 소스를 확인하세요'
      });
    }

    return issues;
  }

  // 중복 데이터 검증
  private static checkDuplicates(trades: InsiderTrade[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const duplicateGroups = new Map<string, string[]>();

    trades.forEach(trade => {
      // 중복 식별자: 거래자명 + 회사 + 거래일 + 거래액
      const key = `${trade.traderName}_${trade.companyName}_${trade.transactionDate}_${trade.totalValue}`;

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(trade.id);
    });

    duplicateGroups.forEach((tradeIds, key) => {
      if (tradeIds.length > 1) {
        issues.push({
          type: 'DUPLICATE_DATA',
          severity: 'MEDIUM',
          description: `동일한 거래가 ${tradeIds.length}번 중복됨: ${key.split('_')[0]} - ${key.split('_')[1]}`,
          affectedTrades: tradeIds,
          suggestion: '중복 제거 로직을 적용하세요'
        });
      }
    });

    return issues;
  }

  // 의심스러운 패턴 검증
  private static checkSuspiciousPatterns(trades: InsiderTrade[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];

    // 1. 동일한 날짜에 여러 임원이 정확히 같은 금액으로 거래
    const suspiciousGroups = this.groupSuspiciousTradesByDate(trades);

    suspiciousGroups.forEach((group, date) => {
      if (group.sameAmount.length >= 3) {
        issues.push({
          type: 'SUSPICIOUS_PATTERN',
          severity: 'HIGH',
          description: `${date}에 ${group.sameAmount.length}명의 임원이 동일한 금액(${group.amount})으로 거래`,
          affectedTrades: group.sameAmount,
          suggestion: '해당 회사의 스톡옵션 행사나 정해진 매매 계획일 가능성을 확인하세요'
        });
      }

      if (group.sameShares.length >= 4) {
        issues.push({
          type: 'SUSPICIOUS_PATTERN',
          severity: 'MEDIUM',
          description: `${date}에 ${group.sameShares.length}명이 동일한 주식 수(${group.shares})로 거래`,
          affectedTrades: group.sameShares,
          suggestion: '자동 거래 시스템이나 미리 정해진 거래 계획일 가능성이 있습니다'
        });
      }
    });

    // 2. 라운드 넘버 집중도 검사
    const roundNumberTrades = trades.filter(trade =>
      trade.shares % 1000 === 0 && trade.totalValue % 1000 === 0
    );

    if (roundNumberTrades.length > trades.length * 0.8) {
      issues.push({
        type: 'SUSPICIOUS_PATTERN',
        severity: 'MEDIUM',
        description: `전체 거래의 ${((roundNumberTrades.length / trades.length) * 100).toFixed(1)}%가 정확한 라운드 넘버`,
        affectedTrades: roundNumberTrades.map(t => t.id),
        suggestion: '실제 거래보다는 테스트 데이터일 가능성이 있습니다'
      });
    }

    return issues;
  }

  // 비현실적 값 검증
  private static checkUnrealisticValues(trades: InsiderTrade[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];

    trades.forEach(trade => {
      // 주가가 $0.01 미만이거나 $10,000 이상
      if (trade.pricePerShare < 0.01 || trade.pricePerShare > 10000) {
        issues.push({
          type: 'UNREALISTIC_VALUES',
          severity: 'HIGH',
          description: `비현실적인 주가: $${trade.pricePerShare}`,
          affectedTrades: [trade.id],
          suggestion: '주가 데이터의 소수점 위치나 단위를 확인하세요'
        });
      }

      // 거래량이 1주 미만이거나 1억주 이상
      if (trade.shares < 1 || trade.shares > 100000000) {
        issues.push({
          type: 'UNREALISTIC_VALUES',
          severity: 'HIGH',
          description: `비현실적인 거래량: ${trade.shares}주`,
          affectedTrades: [trade.id],
          suggestion: '거래량 데이터의 단위를 확인하세요'
        });
      }

      // 총 거래액이 계산과 맞지 않는 경우
      const calculatedValue = trade.shares * trade.pricePerShare;
      const tolerance = Math.max(calculatedValue * 0.01, 1); // 1% 허용오차

      if (Math.abs(trade.totalValue - calculatedValue) > tolerance) {
        issues.push({
          type: 'UNREALISTIC_VALUES',
          severity: 'MEDIUM',
          description: `총액 불일치: 기록된 ${trade.totalValue}, 계산된 ${calculatedValue.toFixed(2)}`,
          affectedTrades: [trade.id],
          suggestion: '총액 계산 로직을 확인하세요'
        });
      }
    });

    return issues;
  }

  // 누락 데이터 검증
  private static checkMissingData(trades: InsiderTrade[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const missingFields: { [key: string]: string[] } = {
      ticker: [],
      traderName: [],
      traderTitle: [],
      companyName: []
    };

    trades.forEach(trade => {
      if (!trade.ticker) missingFields.ticker.push(trade.id);
      if (!trade.traderName) missingFields.traderName.push(trade.id);
      if (!trade.traderTitle) missingFields.traderTitle.push(trade.id);
      if (!trade.companyName) missingFields.companyName.push(trade.id);
    });

    Object.entries(missingFields).forEach(([field, tradeIds]) => {
      if (tradeIds.length > 0) {
        issues.push({
          type: 'MISSING_DATA',
          severity: field === 'ticker' ? 'HIGH' : 'MEDIUM',
          description: `${tradeIds.length}개 거래에서 ${field} 정보 누락`,
          affectedTrades: tradeIds,
          suggestion: `${field} 데이터 소스를 확인하고 보완하세요`
        });
      }
    });

    return issues;
  }

  // 의심스러운 거래 그룹핑
  private static groupSuspiciousTradesByDate(trades: InsiderTrade[]) {
    const groups = new Map();

    trades.forEach(trade => {
      const date = new Date(trade.transactionDate).toDateString();

      if (!groups.has(date)) {
        groups.set(date, {
          sameAmount: [],
          sameShares: [],
          amount: 0,
          shares: 0
        });
      }

      const group = groups.get(date);

      // 같은 금액 거래자 찾기
      const sameAmountTrades = trades.filter(t =>
        t.transactionDate === trade.transactionDate &&
        t.totalValue === trade.totalValue &&
        t.id !== trade.id
      );

      if (sameAmountTrades.length > 0) {
        group.sameAmount.push(trade.id);
        group.amount = trade.totalValue;
      }

      // 같은 주식 수 거래자 찾기
      const sameSharesTrades = trades.filter(t =>
        t.transactionDate === trade.transactionDate &&
        t.shares === trade.shares &&
        t.id !== trade.id
      );

      if (sameSharesTrades.length > 0) {
        group.sameShares.push(trade.id);
        group.shares = trade.shares;
      }
    });

    return groups;
  }

  // 영향받은 거래 수 계산
  private static getAffectedTradesCount(issues: DataIntegrityIssue[]): number {
    const affectedTrades = new Set<string>();
    issues.forEach(issue => {
      issue.affectedTrades.forEach(tradeId => affectedTrades.add(tradeId));
    });
    return affectedTrades.size;
  }

  // 품질 점수 계산
  private static calculateQualityScore(totalTrades: number, issues: DataIntegrityIssue[]): number {
    if (totalTrades === 0) return 100;

    let penalty = 0;
    issues.forEach(issue => {
      const impactRatio = issue.affectedTrades.length / totalTrades;
      const severityWeight = issue.severity === 'HIGH' ? 3 : issue.severity === 'MEDIUM' ? 2 : 1;
      penalty += impactRatio * severityWeight * 20;
    });

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // 권장사항 생성
  private static generateRecommendations(issues: DataIntegrityIssue[]): string[] {
    const recommendations = new Set<string>();

    if (issues.some(i => i.type === 'INVALID_DATE')) {
      recommendations.add('데이터 소스의 날짜 형식과 시간대 설정을 확인하세요');
    }

    if (issues.some(i => i.type === 'DUPLICATE_DATA')) {
      recommendations.add('중복 제거 로직을 데이터 파이프라인에 추가하세요');
    }

    if (issues.some(i => i.type === 'SUSPICIOUS_PATTERN')) {
      recommendations.add('의심스러운 패턴에 대한 추가 조사와 검증이 필요합니다');
    }

    if (issues.some(i => i.type === 'UNREALISTIC_VALUES')) {
      recommendations.add('데이터 소스의 단위와 형식을 재확인하세요');
    }

    if (issues.some(i => i.type === 'MISSING_DATA')) {
      recommendations.add('누락된 필드에 대한 대체 데이터 소스를 찾아보세요');
    }

    // 품질 개선 전략
    const highSeverityCount = issues.filter(i => i.severity === 'HIGH').length;
    if (highSeverityCount > 5) {
      recommendations.add('심각한 데이터 품질 문제가 있습니다. 데이터 소스를 교체하는 것을 고려하세요');
    }

    return Array.from(recommendations);
  }
}

// 실시간 데이터 품질 모니터링
export function createDataQualityAlert(trades: InsiderTrade[]): string | null {
  const report = DataIntegrityChecker.validateTradeData(trades);

  if (report.qualityScore < 70) {
    return `⚠️ 데이터 품질 경고: 품질 점수 ${report.qualityScore}% (${report.issues.length}개 문제 발견)`;
  }

  if (report.issues.some(i => i.severity === 'HIGH')) {
    const highIssues = report.issues.filter(i => i.severity === 'HIGH');
    return `🚨 심각한 데이터 문제: ${highIssues.length}개의 고위험 이슈 발견`;
  }

  return null;
}