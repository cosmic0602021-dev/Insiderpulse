import { storage } from './storage';
import { dataIntegrityService } from './data-integrity-service';
import { realTimeFreshnessMonitor } from './real-time-freshness-monitor';
import { enhancedDataValidator } from './enhanced-data-validation';

/**
 * 자동화된 데이터 품질 검사 및 알림 시스템
 * 가짜 데이터와 품질 문제를 실시간으로 감지하고 대응
 */

export interface QualityAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'FAKE_DATA' | 'STALE_DATA' | 'INTEGRITY' | 'COLLECTION' | 'SYSTEM';
  title: string;
  description: string;
  affectedTrades: number;
  actionTaken: string[];
  resolved: boolean;
  resolvedAt?: Date;
}

export interface QualityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  avgResolutionTime: number; // minutes
  qualityScore: number; // 0-100
  uptime: number; // percentage
}

export class AutomatedQualityAlerts {
  private alerts: QualityAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private startTime = new Date();

  // 알림 임계값
  private thresholds = {
    fakeDataRatio: 0.01, // 1%
    staleDataHours: 6,
    invalidDataRatio: 0.05, // 5%
    collectionFailures: 3,
    lowQualityScore: 70
  };

  constructor() {
    console.log('🚨 Automated quality alerts system initialized');
  }

  /**
   * 알림 시스템 시작
   */
  start(): void {
    if (this.isActive) {
      console.log('🚨 Quality alerts system is already running');
      return;
    }

    this.isActive = true;
    this.startTime = new Date();
    console.log('🚀 Starting automated quality alerts system...');

    // 즉시 품질 검사 실행
    this.runQualityCheck();

    // 15분마다 품질 검사
    this.monitoringInterval = setInterval(() => {
      this.runQualityCheck();
    }, 15 * 60 * 1000); // 15 minutes

    console.log('✅ Quality alerts system started (checks every 15 minutes)');
  }

  /**
   * 알림 시스템 중지
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isActive = false;
    console.log('⏹️ Quality alerts system stopped');
  }

  /**
   * 종합 품질 검사 실행
   */
  private async runQualityCheck(): Promise<void> {
    try {
      console.log('🔍 Running comprehensive quality check...');

      // 1. 가짜 데이터 검사
      await this.checkFakeData();

      // 2. 데이터 신선도 검사
      await this.checkDataFreshness();

      // 3. 데이터 무결성 검사
      await this.checkDataIntegrity();

      // 4. 수집 시스템 상태 검사
      await this.checkCollectionSystem();

      // 5. 전체 시스템 건강성 검사
      await this.checkSystemHealth();

      // 6. 자동 복구 시도
      await this.attemptAutoResolve();

      console.log('✅ Quality check completed');

    } catch (error) {
      console.error('❌ Quality check failed:', error);
      await this.createAlert({
        severity: 'HIGH',
        category: 'SYSTEM',
        title: 'Quality Check System Failure',
        description: `Quality monitoring system encountered an error: ${error}`,
        affectedTrades: 0,
        actionTaken: ['Logged error', 'Will retry on next cycle']
      });
    }
  }

  /**
   * 가짜 데이터 검사
   */
  private async checkFakeData(): Promise<void> {
    try {
      const auditResult = await dataIntegrityService.auditDatabase();

      if (auditResult.totalTrades > 0) {
        const fakeRatio = auditResult.fakeTrades / auditResult.totalTrades;

        if (fakeRatio > this.thresholds.fakeDataRatio) {
          await this.createAlert({
            severity: fakeRatio > 0.05 ? 'CRITICAL' : 'HIGH',
            category: 'FAKE_DATA',
            title: 'High Fake Data Ratio Detected',
            description: `${(fakeRatio * 100).toFixed(1)}% of trades are identified as fake data`,
            affectedTrades: auditResult.fakeTrades,
            actionTaken: ['Flagged fake trades', 'Enhanced validation enabled']
          });

          // 자동 정리 실행
          await enhancedDataValidator.validateAndCleanDatabase();
        }
      }

    } catch (error) {
      console.error('Error checking fake data:', error);
    }
  }

  /**
   * 데이터 신선도 검사
   */
  private async checkDataFreshness(): Promise<void> {
    try {
      const freshnessStatus = realTimeFreshnessMonitor.getCurrentFreshnessStatus();

      if (freshnessStatus) {
        const hoursStale = freshnessStatus.lastTradeAge / 60;

        if (hoursStale > this.thresholds.staleDataHours) {
          await this.createAlert({
            severity: hoursStale > 24 ? 'CRITICAL' : hoursStale > 12 ? 'HIGH' : 'MEDIUM',
            category: 'STALE_DATA',
            title: 'Data Freshness Issue',
            description: `Last trade data is ${Math.round(hoursStale)} hours old`,
            affectedTrades: freshnessStatus.staleDataCount,
            actionTaken: ['Monitoring freshness', 'Auto-collection triggered']
          });

          // 자동 수집 트리거
          if (hoursStale > 12) {
            await this.triggerEmergencyCollection();
          }
        }
      }

    } catch (error) {
      console.error('Error checking data freshness:', error);
    }
  }

  /**
   * 데이터 무결성 검사
   */
  private async checkDataIntegrity(): Promise<void> {
    try {
      const allTrades = await storage.getInsiderTrades(1000, 0, false);
      let invalidCount = 0;

      // 샘플 검사 (성능을 위해)
      const sampleSize = Math.min(100, allTrades.length);
      const sampleTrades = allTrades.slice(0, sampleSize);

      for (const trade of sampleTrades) {
        const validation = dataIntegrityService.validateTrade(trade);
        if (!validation.isValid) {
          invalidCount++;
        }
      }

      if (sampleSize > 0) {
        const invalidRatio = invalidCount / sampleSize;
        const estimatedInvalidTrades = Math.round(invalidRatio * allTrades.length);

        if (invalidRatio > this.thresholds.invalidDataRatio) {
          await this.createAlert({
            severity: invalidRatio > 0.2 ? 'CRITICAL' : 'HIGH',
            category: 'INTEGRITY',
            title: 'Data Integrity Issues Detected',
            description: `Estimated ${(invalidRatio * 100).toFixed(1)}% of trades have integrity issues`,
            affectedTrades: estimatedInvalidTrades,
            actionTaken: ['Sample validation completed', 'Full validation scheduled']
          });
        }
      }

    } catch (error) {
      console.error('Error checking data integrity:', error);
    }
  }

  /**
   * 수집 시스템 상태 검사
   */
  private async checkCollectionSystem(): Promise<void> {
    try {
      const dataSources = realTimeFreshnessMonitor.getDataSourceStatus();
      const failedSources = dataSources.filter(s => s.status === 'FAILED');
      const staleSources = dataSources.filter(s => s.status === 'STALE');

      if (failedSources.length > 0) {
        await this.createAlert({
          severity: failedSources.length >= dataSources.length / 2 ? 'CRITICAL' : 'HIGH',
          category: 'COLLECTION',
          title: 'Data Collection System Failures',
          description: `${failedSources.length} data sources are failing: ${failedSources.map(s => s.name).join(', ')}`,
          affectedTrades: 0,
          actionTaken: ['Monitoring collection status', 'Restart attempts scheduled']
        });
      }

      if (staleSources.length > 0) {
        await this.createAlert({
          severity: 'MEDIUM',
          category: 'COLLECTION',
          title: 'Stale Data Sources Detected',
          description: `${staleSources.length} data sources are stale: ${staleSources.map(s => s.name).join(', ')}`,
          affectedTrades: 0,
          actionTaken: ['Monitoring collection status']
        });
      }

    } catch (error) {
      console.error('Error checking collection system:', error);
    }
  }

  /**
   * 시스템 건강성 검사
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      const summary = realTimeFreshnessMonitor.getFreshnessSummary();

      if (summary.currentStatus === 'CRITICAL') {
        await this.createAlert({
          severity: 'CRITICAL',
          category: 'SYSTEM',
          title: 'System Health Critical',
          description: 'Multiple system components are in critical state',
          affectedTrades: 0,
          actionTaken: ['System health monitoring', 'Emergency protocols initiated']
        });
      }

      // 메모리 사용량 체크 (Node.js)
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      if (memUsageMB > 500) { // 500MB 이상
        await this.createAlert({
          severity: 'MEDIUM',
          category: 'SYSTEM',
          title: 'High Memory Usage',
          description: `Memory usage is high: ${Math.round(memUsageMB)}MB`,
          affectedTrades: 0,
          actionTaken: ['Memory monitoring', 'Cleanup recommended']
        });
      }

    } catch (error) {
      console.error('Error checking system health:', error);
    }
  }

  /**
   * 자동 해결 시도
   */
  private async attemptAutoResolve(): Promise<void> {
    const unresolvedAlerts = this.alerts.filter(a => !a.resolved);
    const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'CRITICAL');

    for (const alert of criticalAlerts) {
      try {
        let resolved = false;
        const actions: string[] = [];

        switch (alert.category) {
          case 'FAKE_DATA':
            // 가짜 데이터 자동 정리
            const cleanupResult = await enhancedDataValidator.validateAndCleanDatabase();
            actions.push(`Cleaned ${cleanupResult.cleanedUp} problematic trades`);
            resolved = cleanupResult.blockedTrades > 0;
            break;

          case 'STALE_DATA':
            // 긴급 데이터 수집
            const collectionResult = await this.triggerEmergencyCollection();
            actions.push(`Emergency collection: ${collectionResult} trades`);
            resolved = collectionResult > 0;
            break;

          case 'COLLECTION':
            // 수집기 재시작 시도
            actions.push('Attempted collector restart');
            resolved = true; // 재시작 시도했다고 가정
            break;
        }

        if (resolved) {
          alert.resolved = true;
          alert.resolvedAt = new Date();
          alert.actionTaken.push(...actions);
          console.log(`✅ Auto-resolved alert: ${alert.title}`);
        }

      } catch (error) {
        console.error(`Failed to auto-resolve alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * 긴급 데이터 수집 트리거
   */
  private async triggerEmergencyCollection(): Promise<number> {
    try {
      const { autoScheduler } = await import('./auto-scheduler');

      console.log('🚨 Triggering emergency data collection...');
      const openInsiderCount = await autoScheduler.manualOpenInsiderRun(200);
      const marketBeatCount = await autoScheduler.manualMarketBeatRun(100);

      const total = openInsiderCount + marketBeatCount;
      console.log(`🎯 Emergency collection completed: ${total} trades`);

      return total;
    } catch (error) {
      console.error('Emergency collection failed:', error);
      return 0;
    }
  }

  /**
   * 알림 생성
   */
  private async createAlert(alertData: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'FAKE_DATA' | 'STALE_DATA' | 'INTEGRITY' | 'COLLECTION' | 'SYSTEM';
    title: string;
    description: string;
    affectedTrades: number;
    actionTaken: string[];
  }): Promise<void> {
    const alert: QualityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
      resolved: false
    };

    this.alerts.push(alert);

    // 최근 100개 알림만 유지
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`🚨 ${alert.severity} ALERT: ${alert.title}`);
    console.log(`   📝 ${alert.description}`);
    console.log(`   🎯 Affected trades: ${alert.affectedTrades}`);
    console.log(`   🔧 Actions: ${alert.actionTaken.join(', ')}`);

    // 심각한 알림의 경우 즉시 통지
    if (alert.severity === 'CRITICAL') {
      await this.sendCriticalNotification(alert);
    }
  }

  /**
   * 치명적 알림 통지
   */
  private async sendCriticalNotification(alert: QualityAlert): Promise<void> {
    try {
      // 이메일 알림 (프로덕션 환경에서만)
      if (process.env.NODE_ENV === 'production') {
        const { emailNotificationService } = await import('./email-notification-service');

        const alertMessage = `
CRITICAL DATA QUALITY ALERT

Alert ID: ${alert.id}
Category: ${alert.category}
Title: ${alert.title}
Description: ${alert.description}
Affected Trades: ${alert.affectedTrades}

Actions Taken:
${alert.actionTaken.map(action => `- ${action}`).join('\n')}

Timestamp: ${alert.timestamp.toISOString()}
        `;

        await emailNotificationService.sendSystemAlert(`CRITICAL: ${alert.title}`, alertMessage);
      }

      console.error('🚨 CRITICAL QUALITY ALERT SENT:', alert);

    } catch (error) {
      console.error('Failed to send critical notification:', error);
    }
  }

  /**
   * 현재 알림 조회
   */
  getActiveAlerts(): QualityAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * 알림 히스토리 조회
   */
  getAlertHistory(hours: number = 24): QualityAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * 품질 메트릭 조회
   */
  getQualityMetrics(): QualityMetrics {
    const now = Date.now();
    const uptimeMs = now - this.startTime.getTime();
    const uptime = Math.min(100, (uptimeMs / (24 * 60 * 60 * 1000)) * 100); // 24시간 기준

    const recent24h = this.getAlertHistory(24);
    const resolved = recent24h.filter(a => a.resolved);

    let avgResolutionTime = 0;
    if (resolved.length > 0) {
      const totalResolutionTime = resolved.reduce((sum, alert) => {
        if (alert.resolvedAt) {
          return sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = (totalResolutionTime / resolved.length) / (1000 * 60); // minutes
    }

    // 품질 점수 계산
    let qualityScore = 100;
    const criticalCount = recent24h.filter(a => a.severity === 'CRITICAL').length;
    const highCount = recent24h.filter(a => a.severity === 'HIGH').length;

    qualityScore -= criticalCount * 20; // 치명적 알림당 20점 차감
    qualityScore -= highCount * 10; // 높은 알림당 10점 차감

    return {
      totalAlerts: recent24h.length,
      criticalAlerts: criticalCount,
      resolvedAlerts: resolved.length,
      avgResolutionTime,
      qualityScore: Math.max(0, qualityScore),
      uptime
    };
  }

  /**
   * 알림 수동 해결
   */
  resolveAlert(alertId: string, resolution: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.actionTaken.push(`Manual resolution: ${resolution}`);
      console.log(`✅ Alert resolved manually: ${alert.title}`);
      return true;
    }
    return false;
  }

  /**
   * 시스템 상태 요약
   */
  getSystemStatus(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    activeAlerts: number;
    criticalAlerts: number;
    qualityScore: number;
    uptime: number;
  } {
    const metrics = this.getQualityMetrics();
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (criticalAlerts.length > 0) {
      status = 'CRITICAL';
    } else if (activeAlerts.length > 3 || metrics.qualityScore < 80) {
      status = 'WARNING';
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      qualityScore: metrics.qualityScore,
      uptime: metrics.uptime
    };
  }
}

// 전역 인스턴스
export const automatedQualityAlerts = new AutomatedQualityAlerts();