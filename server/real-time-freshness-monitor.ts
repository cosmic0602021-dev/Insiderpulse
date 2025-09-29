import { storage } from './storage';
import { dataIntegrityService } from './data-integrity-service';

/**
 * 실시간 데이터 신선도 모니터링 시스템
 * 가짜 데이터 방지와 최신 정보 보장
 */

export interface FreshnessStatus {
  isDataFresh: boolean;
  lastTradeAge: number; // minutes
  lastCollectionTime: Date | null;
  staleDataCount: number;
  recommendations: string[];
  severity: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface DataSource {
  name: string;
  lastCollection: Date | null;
  status: 'ACTIVE' | 'STALE' | 'FAILED';
  tradesCollected: number;
  errors: number;
}

export class RealTimeFreshnessMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private dataSources = new Map<string, DataSource>();
  private freshnessHistory: FreshnessStatus[] = [];
  private alertThresholds = {
    warning: 2 * 60, // 2 hours
    critical: 6 * 60, // 6 hours
    staleData: 24 * 60, // 24 hours
  };

  constructor() {
    this.initializeDataSources();
  }

  /**
   * 데이터 소스 초기화
   */
  private initializeDataSources(): void {
    const sources = [
      'OpenInsider',
      'SEC EDGAR',
      'MarketBeat',
      'Manual Collection'
    ];

    sources.forEach(source => {
      this.dataSources.set(source, {
        name: source,
        lastCollection: null,
        status: 'ACTIVE',
        tradesCollected: 0,
        errors: 0
      });
    });

    console.log(`📊 Freshness monitor initialized with ${sources.length} data sources`);
  }

  /**
   * 실시간 모니터링 시작
   */
  start(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Skipping freshness monitoring');
      return;
    }

    if (this.isMonitoring) {
      console.log('🔍 Freshness monitor is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting real-time data freshness monitoring...');

    // 즉시 한 번 실행
    this.checkDataFreshness();

    // 5분마다 체크
    this.monitoringInterval = setInterval(() => {
      this.checkDataFreshness();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Freshness monitoring started (checks every 5 minutes)');
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Freshness monitoring stopped');
  }

  /**
   * 데이터 신선도 체크
   */
  private async checkDataFreshness(): Promise<void> {
    try {
      // Skip all freshness checking in development mode
      if (process.env.NODE_ENV === 'development') {
        return;
      }

      console.log('🔍 Checking data freshness...');

      const freshness = await this.analyzeFreshness();
      this.freshnessHistory.push(freshness);

      // 최근 24개 기록만 유지 (2시간 치)
      if (this.freshnessHistory.length > 24) {
        this.freshnessHistory = this.freshnessHistory.slice(-24);
      }

      await this.processFreshnessStatus(freshness);

      console.log(`📊 Freshness check complete: ${freshness.severity} (last trade: ${Math.round(freshness.lastTradeAge / 60)} hours ago)`);

    } catch (error) {
      console.error('❌ Freshness check failed:', error);
    }
  }

  /**
   * 신선도 분석
   */
  private async analyzeFreshness(): Promise<FreshnessStatus> {
    // 최신 거래 조회
    const recentTrades = await storage.getInsiderTrades(10, 0, true);
    const now = Date.now();

    let lastTradeAge = Infinity;
    let lastCollectionTime: Date | null = null;
    let staleDataCount = 0;

    if (recentTrades.length > 0) {
      const latestTrade = recentTrades[0];
      const tradeTime = new Date(latestTrade.createdAt || latestTrade.filedDate).getTime();
      lastTradeAge = (now - tradeTime) / (1000 * 60); // minutes
      lastCollectionTime = new Date(latestTrade.createdAt || latestTrade.filedDate);

      // 오래된 데이터 카운트
      const staleThreshold = now - (this.alertThresholds.staleData * 60 * 1000);
      staleDataCount = recentTrades.filter(trade => {
        const tradeTime = new Date(trade.createdAt || trade.filedDate).getTime();
        return tradeTime < staleThreshold;
      }).length;
    }

    // 심각도 결정
    let severity: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (lastTradeAge > this.alertThresholds.critical) {
      severity = 'CRITICAL';
    } else if (lastTradeAge > this.alertThresholds.warning) {
      severity = 'WARNING';
    }

    // 권장사항 생성
    const recommendations = this.generateRecommendations(lastTradeAge, staleDataCount);

    return {
      isDataFresh: lastTradeAge <= this.alertThresholds.warning,
      lastTradeAge,
      lastCollectionTime,
      staleDataCount,
      recommendations,
      severity
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(lastTradeAge: number, staleDataCount: number): string[] {
    const recommendations: string[] = [];

    if (lastTradeAge > this.alertThresholds.critical) {
      recommendations.push('URGENT: Run immediate data collection');
      recommendations.push('Check data collector service status');
      recommendations.push('Verify network connectivity to data sources');
    } else if (lastTradeAge > this.alertThresholds.warning) {
      recommendations.push('Consider running manual data collection');
      recommendations.push('Monitor data source availability');
    }

    if (staleDataCount > 5) {
      recommendations.push('Clean up stale data records');
      recommendations.push('Review data retention policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Data freshness is optimal');
    }

    return recommendations;
  }

  /**
   * 신선도 상태 처리
   */
  private async processFreshnessStatus(freshness: FreshnessStatus): Promise<void> {
    // Skip all processing in development mode
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // 심각한 상황 알림
    if (freshness.severity === 'CRITICAL') {
      console.error('🚨 CRITICAL: Data is severely stale!');
      console.error(`   Last trade: ${Math.round(freshness.lastTradeAge / 60)} hours ago`);
      await this.triggerCriticalAlert(freshness);
    } else if (freshness.severity === 'WARNING') {
      console.warn('⚠️ WARNING: Data is getting stale');
      console.warn(`   Last trade: ${Math.round(freshness.lastTradeAge / 60)} hours ago`);
    }

    // 권장사항 로그
    if (freshness.recommendations.length > 0) {
      console.log('💡 Freshness recommendations:');
      freshness.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    // 자동 복구 시도
    if (freshness.severity === 'CRITICAL') {
      await this.attemptAutoRecovery();
    }
  }

  /**
   * 치명적 알림 발송
   */
  private async triggerCriticalAlert(freshness: FreshnessStatus): Promise<void> {
    try {
      // 이메일 알림 (프로덕션 환경에서만)
      if (process.env.NODE_ENV === 'production') {
        const { emailNotificationService } = await import('./email-notification-service');

        const alertMessage = `
DATA FRESHNESS CRITICAL ALERT

Last Trade Age: ${Math.round(freshness.lastTradeAge / 60)} hours
Stale Data Count: ${freshness.staleDataCount}
Last Collection: ${freshness.lastCollectionTime?.toISOString() || 'Never'}

Recommendations:
${freshness.recommendations.map(rec => `- ${rec}`).join('\n')}

Timestamp: ${new Date().toISOString()}
        `;

        await emailNotificationService.sendSystemAlert('Critical Data Freshness Issue', alertMessage);
      }

      // 시스템 로그
      console.error('🚨 CRITICAL DATA FRESHNESS ALERT:', {
        lastTradeAge: freshness.lastTradeAge,
        staleDataCount: freshness.staleDataCount,
        recommendations: freshness.recommendations
      });

    } catch (error) {
      console.error('Failed to send critical freshness alert:', error);
    }
  }

  /**
   * 자동 복구 시도
   */
  private async attemptAutoRecovery(): Promise<void> {
    try {
      // Skip auto recovery in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Skipping auto recovery');
        return;
      }

      console.log('🔄 Attempting automatic data recovery...');

      // 1. 수집기 강제 실행
      const { autoScheduler } = await import('./auto-scheduler');

      console.log('   🔄 Triggering manual data collection...');
      const openInsiderCount = await autoScheduler.manualOpenInsiderRun(100);
      const marketBeatCount = await autoScheduler.manualMarketBeatRun(50);

      console.log(`   ✅ Auto recovery completed: ${openInsiderCount + marketBeatCount} trades collected`);

      // 2. 데이터 무결성 재검사
      const audit = await dataIntegrityService.auditDatabase();
      console.log(`   📊 Post-recovery audit: ${audit.validTrades}/${audit.totalTrades} valid trades`);

    } catch (error) {
      console.error('❌ Auto recovery failed:', error);
    }
  }

  /**
   * 데이터 소스 상태 업데이트
   */
  updateDataSource(sourceName: string, status: 'ACTIVE' | 'STALE' | 'FAILED', tradesCollected: number = 0, hasError: boolean = false): void {
    const source = this.dataSources.get(sourceName);
    if (source) {
      source.lastCollection = new Date();
      source.status = status;
      source.tradesCollected += tradesCollected;
      if (hasError) {
        source.errors++;
      }

      console.log(`📡 Data source updated: ${sourceName} - ${status} (${tradesCollected} trades)`);
    }
  }

  /**
   * 현재 신선도 상태 조회
   */
  getCurrentFreshnessStatus(): FreshnessStatus | null {
    return this.freshnessHistory.length > 0
      ? this.freshnessHistory[this.freshnessHistory.length - 1]
      : null;
  }

  /**
   * 신선도 히스토리 조회
   */
  getFreshnessHistory(hours: number = 2): FreshnessStatus[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.freshnessHistory.filter(status =>
      status.lastCollectionTime && status.lastCollectionTime > cutoff
    );
  }

  /**
   * 데이터 소스 상태 조회
   */
  getDataSourceStatus(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * 신선도 요약 통계
   */
  getFreshnessSummary(): {
    currentStatus: string;
    lastTradeAge: number;
    dataSourcesActive: number;
    dataSourcesTotal: number;
    recommendations: number;
  } {
    const current = this.getCurrentFreshnessStatus();
    const sources = this.getDataSourceStatus();
    const activeSources = sources.filter(s => s.status === 'ACTIVE').length;

    return {
      currentStatus: current?.severity || 'UNKNOWN',
      lastTradeAge: current?.lastTradeAge || 0,
      dataSourcesActive: activeSources,
      dataSourcesTotal: sources.length,
      recommendations: current?.recommendations.length || 0
    };
  }

  /**
   * 강제 신선도 체크 (수동)
   */
  async forceCheck(): Promise<FreshnessStatus> {
    // Block manual freshness checks in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Manual freshness check disabled for stability');
      return {
        isDataFresh: true,
        lastTradeAge: 0,
        lastCollectionTime: new Date(),
        staleDataCount: 0,
        recommendations: ['Development mode: All checks disabled'],
        severity: 'OK'
      };
    }

    console.log('🔄 Manual freshness check requested...');
    const freshness = await this.analyzeFreshness();
    await this.processFreshnessStatus(freshness);
    return freshness;
  }
}

// 전역 인스턴스
export const realTimeFreshnessMonitor = new RealTimeFreshnessMonitor();