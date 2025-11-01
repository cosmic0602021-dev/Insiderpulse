import { dataIntegrityService } from './data-integrity-service';
import { storage } from './storage';

/**
 * 자동화된 데이터 품질 모니터링 서비스
 * 주기적으로 데이터 품질을 검사하고 이상 상황을 감지
 */

export interface DataQualityReport {
  timestamp: Date;
  totalTrades: number;
  validTrades: number;
  invalidTrades: number;
  fakeTrades: number;
  dataFreshness: {
    lastTradeAge: number; // minutes
    hasRecentData: boolean;
  };
  qualityScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

export class DataQualityMonitor {
  private reports: DataQualityReport[] = [];
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * 모니터링 시작 (1시간마다 실행)
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔍 Data quality monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated data quality monitoring...');

    // 즉시 한 번 실행
    this.runQualityCheck();

    // 1시간마다 실행
    this.intervalId = setInterval(() => {
      this.runQualityCheck();
    }, 60 * 60 * 1000); // 1시간
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Data quality monitoring stopped');
  }

  /**
   * 데이터 품질 검사 실행
   */
  private async runQualityCheck(): Promise<void> {
    try {
      console.log('🔍 Running data quality check...');

      const audit = await dataIntegrityService.auditDatabase();
      const freshness = await this.checkDataFreshness();
      const qualityScore = this.calculateQualityScore(audit, freshness);
      const trend = this.analyzeTrend();

      const report: DataQualityReport = {
        timestamp: new Date(),
        totalTrades: audit.totalTrades,
        validTrades: audit.validTrades,
        invalidTrades: audit.invalidTrades,
        fakeTrades: audit.fakeTrades,
        dataFreshness: freshness,
        qualityScore,
        issues: audit.issues,
        recommendations: audit.recommendations,
        trend
      };

      this.reports.push(report);

      // 최근 24개 리포트만 유지 (24시간)
      if (this.reports.length > 24) {
        this.reports = this.reports.slice(-24);
      }

      await this.processReport(report);

      console.log(`✅ Data quality check complete: Score ${qualityScore}/100`);

    } catch (error) {
      console.error('❌ Data quality check failed:', error);
    }
  }

  /**
   * 데이터 신선도 검사
   */
  private async checkDataFreshness(): Promise<{
    lastTradeAge: number;
    hasRecentData: boolean;
  }> {
    try {
      const recentTrades = await storage.getInsiderTrades(10, 0);

      if (recentTrades.length === 0) {
        return {
          lastTradeAge: Infinity,
          hasRecentData: false
        };
      }

      const latestTrade = recentTrades[0];
      const tradeTime = new Date(latestTrade.createdAt || latestTrade.filedDate).getTime();
      const now = Date.now();
      const ageInMinutes = (now - tradeTime) / (1000 * 60);

      return {
        lastTradeAge: ageInMinutes,
        hasRecentData: ageInMinutes < 24 * 60 // 24시간 이내
      };

    } catch (error) {
      console.error('Error checking data freshness:', error);
      return {
        lastTradeAge: Infinity,
        hasRecentData: false
      };
    }
  }

  /**
   * 품질 점수 계산
   */
  private calculateQualityScore(
    audit: Awaited<ReturnType<typeof dataIntegrityService.auditDatabase>>,
    freshness: { lastTradeAge: number; hasRecentData: boolean }
  ): number {
    let score = 100;

    // 가짜 데이터 비율에 따른 점수 차감
    if (audit.totalTrades > 0) {
      const fakeRatio = audit.fakeTrades / audit.totalTrades;
      score -= fakeRatio * 50; // 가짜 데이터 1%당 0.5점 차감
    }

    // 무효 데이터 비율에 따른 점수 차감
    if (audit.totalTrades > 0) {
      const invalidRatio = audit.invalidTrades / audit.totalTrades;
      score -= invalidRatio * 30; // 무효 데이터 1%당 0.3점 차감
    }

    // 데이터 신선도에 따른 점수 차감
    if (!freshness.hasRecentData) {
      score -= 25; // 최신 데이터 없으면 25점 차감
    } else if (freshness.lastTradeAge > 12 * 60) { // 12시간 이상
      score -= 10; // 반나절 이상 된 데이터면 10점 차감
    }

    // 데이터 부족에 따른 점수 차감
    if (audit.totalTrades < 100) {
      score -= 15; // 데이터가 100개 미만이면 15점 차감
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * 품질 트렌드 분석
   */
  private analyzeTrend(): 'improving' | 'stable' | 'declining' {
    if (this.reports.length < 3) {
      return 'stable';
    }

    const recent = this.reports.slice(-3);
    const scores = recent.map(r => r.qualityScore);

    const avgChange = (scores[2] - scores[0]) / 2;

    if (avgChange > 5) return 'improving';
    if (avgChange < -5) return 'declining';
    return 'stable';
  }

  /**
   * 리포트 처리 및 알림
   */
  private async processReport(report: DataQualityReport): Promise<void> {
    // 심각한 품질 문제 감지
    if (report.qualityScore < 50) {
      console.warn(`🚨 CRITICAL: Data quality score is critically low: ${report.qualityScore}/100`);
      await this.sendCriticalAlert(report);
    } else if (report.qualityScore < 70) {
      console.warn(`⚠️ WARNING: Data quality score is low: ${report.qualityScore}/100`);
    }

    // 가짜 데이터 감지
    if (report.fakeTrades > 0) {
      console.warn(`🚨 ALERT: Detected ${report.fakeTrades} fake trades in database`);
    }

    // 데이터 신선도 문제
    if (!report.dataFreshness.hasRecentData) {
      console.warn(`🚨 ALERT: No recent trade data (last trade: ${Math.round(report.dataFreshness.lastTradeAge / 60)} hours ago)`);
    }

    // 개선 권장사항 로그
    if (report.recommendations.length > 0) {
      console.log('💡 Data quality recommendations:');
      report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * 심각한 품질 문제 알림
   */
  private async sendCriticalAlert(report: DataQualityReport): Promise<void> {
    try {
      // 이메일 알림 (프로덕션 환경에서만)
      if (process.env.NODE_ENV === 'production') {
        const { emailNotificationService } = await import('./email-notification-service');

        const alertMessage = `
DATA QUALITY CRITICAL ALERT

Quality Score: ${report.qualityScore}/100
Total Trades: ${report.totalTrades}
Valid Trades: ${report.validTrades}
Invalid Trades: ${report.invalidTrades}
Fake Trades: ${report.fakeTrades}

Issues:
${report.issues.map(issue => `- ${issue}`).join('\n')}

Recommendations:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

Timestamp: ${report.timestamp.toISOString()}
        `;

        await emailNotificationService.sendSystemAlert('Critical Data Quality Issue', alertMessage);
      }

      // 시스템 로그
      console.error('🚨 CRITICAL DATA QUALITY ALERT:', {
        score: report.qualityScore,
        issues: report.issues,
        recommendations: report.recommendations
      });

    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  /**
   * 현재 품질 상태 조회
   */
  getLatestReport(): DataQualityReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * 품질 히스토리 조회
   */
  getReportHistory(hours: number = 24): DataQualityReport[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.reports.filter(report => report.timestamp > cutoff);
  }

  /**
   * 품질 요약 통계
   */
  getQualitySummary(): {
    currentScore: number;
    avgScore24h: number;
    trend: string;
    totalIssues: number;
    criticalIssues: number;
  } {
    const latest = this.getLatestReport();
    const history = this.getReportHistory(24);

    if (!latest) {
      return {
        currentScore: 0,
        avgScore24h: 0,
        trend: 'unknown',
        totalIssues: 0,
        criticalIssues: 0
      };
    }

    const avgScore = history.length > 0
      ? Math.round(history.reduce((sum, r) => sum + r.qualityScore, 0) / history.length)
      : latest.qualityScore;

    const totalIssues = history.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = history.filter(r => r.qualityScore < 50).length;

    return {
      currentScore: latest.qualityScore,
      avgScore24h: avgScore,
      trend: latest.trend,
      totalIssues,
      criticalIssues
    };
  }
}

// 전역 인스턴스
export const dataQualityMonitor = new DataQualityMonitor();