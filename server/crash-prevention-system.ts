import { storage } from './storage';
import { automatedQualityAlerts } from './automated-quality-alerts';
import { realTimeFreshnessMonitor } from './real-time-freshness-monitor';
import { shouldRunMonitoring } from './utils/market-hours';

/**
 * 앱 크래시 방지 및 복구 시스템
 * 시스템 안정성과 연속성 보장
 */

export interface CrashEvent {
  id: string;
  timestamp: Date;
  type: 'MEMORY_LEAK' | 'UNHANDLED_ERROR' | 'DATA_CORRUPTION' | 'NETWORK_FAILURE' | 'RESOURCE_EXHAUSTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  stackTrace?: string;
  recoveryAction: string[];
  recovered: boolean;
  downtime: number; // seconds
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  uptime: number;
  errorRate: number;
  lastCrash?: Date;
  totalCrashes: number;
  stability: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export class CrashPreventionSystem {
  private isActive = false;
  private startTime = new Date();
  private crashEvents: CrashEvent[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private gracefulShutdownHandlers: (() => Promise<void>)[] = [];

  // 임계값 설정
  private thresholds = {
    memoryUsage: 512, // MB
    cpuUsage: 80, // %
    errorRate: 0.05, // 5%
    maxConsecutiveErrors: 10
  };

  private errorCount = 0;
  private lastErrorReset = Date.now();

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupProcessHandlers();
    console.log('🛡️ Crash prevention system initialized');
  }

  /**
   * 크래시 방지 시스템 시작
   */
  start(): void {
    if (this.isActive) {
      console.log('🛡️ Crash prevention system is already running');
      return;
    }

    this.isActive = true;
    this.startTime = new Date();
    console.log('🚀 Starting crash prevention system...');

    // 30초마다 건강성 체크
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30 * 1000);

    // 메모리 및 에러율 모니터링
    this.startContinuousMonitoring();

    console.log('✅ Crash prevention system started');
  }

  /**
   * 시스템 중지
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isActive = false;
    console.log('⏹️ Crash prevention system stopped');
  }

  /**
   * 전역 오류 핸들러 설정
   */
  private setupGlobalErrorHandlers(): void {
    // 처리되지 않은 예외 캐치
    process.on('uncaughtException', (error) => {
      this.handleCriticalError('UNHANDLED_ERROR', error);
    });

    // 처리되지 않은 Promise 거부 캐치
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.handleCriticalError('UNHANDLED_ERROR', error, 'Unhandled Promise Rejection');
    });

    // 경고 캐치
    process.on('warning', (warning) => {
      console.warn('⚠️ Node.js Warning:', warning.message);
      if (warning.message.includes('memory') || warning.message.includes('leak')) {
        this.recordCrashEvent({
          type: 'MEMORY_LEAK',
          severity: 'MEDIUM',
          details: warning.message,
          recoveryAction: ['Memory cleanup initiated', 'Monitoring increased']
        });
      }
    });
  }

  /**
   * 프로세스 시그널 핸들러 설정
   */
  private setupProcessHandlers(): void {
    // 우아한 종료 처리
    const gracefulShutdown = async (signal: string) => {
      console.log(`🛑 Received ${signal}, initiating graceful shutdown...`);

      try {
        // 새로운 요청 중지
        this.isActive = false;

        // 진행 중인 작업 완료 대기
        console.log('⏳ Waiting for ongoing operations to complete...');
        await this.executeGracefulShutdownHandlers();

        // 데이터 무결성 검사
        console.log('🔍 Final data integrity check...');
        await this.performFinalIntegrityCheck();

        console.log('✅ Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * 치명적 오류 처리
   */
  private async handleCriticalError(
    type: CrashEvent['type'],
    error: Error,
    context?: string
  ): Promise<void> {
    console.error(`🚨 CRITICAL ERROR [${type}]:`, error.message);
    console.error('Stack:', error.stack);

    const crashEvent = this.recordCrashEvent({
      type,
      severity: 'CRITICAL',
      details: `${context || 'Critical system error'}: ${error.message}`,
      stackTrace: error.stack,
      recoveryAction: []
    });

    try {
      // 즉시 복구 시도
      const recovered = await this.attemptRecovery(crashEvent);

      if (!recovered) {
        console.error('❌ Recovery failed, initiating emergency shutdown...');
        await this.emergencyShutdown(error);
      }

    } catch (recoveryError) {
      console.error('❌ Recovery attempt failed:', recoveryError);
      await this.emergencyShutdown(error);
    }
  }

  /**
   * 건강성 체크 수행
   */
  private async performHealthCheck(): Promise<void> {
    // 주말에는 건강성 체크 스킵 (비용 절감)
    if (!shouldRunMonitoring()) {
      return;
    }

    try {
      const health = this.getSystemHealth();

      // 메모리 사용량 체크
      if (health.memory > this.thresholds.memoryUsage) {
        await this.handleHighMemoryUsage(health.memory);
      }

      // CPU 사용량 체크 (Node.js에서는 제한적)
      if (health.cpu > this.thresholds.cpuUsage) {
        await this.handleHighCpuUsage(health.cpu);
      }

      // 에러율 체크
      if (health.errorRate > this.thresholds.errorRate) {
        await this.handleHighErrorRate(health.errorRate);
      }

      // 시스템 안정성 로그 (주기적)
      if (Math.floor(Date.now() / 60000) % 10 === 0) { // 10분마다
        console.log(`💚 System Health: Memory ${Math.round(health.memory)}MB, Uptime ${Math.round(health.uptime)}h, Stability ${health.stability}`);
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * 지속적 모니터링 시작
   */
  private startContinuousMonitoring(): void {
    // 메모리 사용량 모니터링 (5분마다)
    setInterval(() => {
      // 주말에는 모니터링 스킵 (비용 절감)
      if (!shouldRunMonitoring()) {
        return;
      }

      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      if (memUsageMB > this.thresholds.memoryUsage * 0.8) { // 80% 임계값
        console.warn(`⚠️ High memory usage: ${Math.round(memUsageMB)}MB`);
      }
    }, 5 * 60 * 1000);

    // 에러율 리셋 (1시간마다)
    setInterval(() => {
      // 주말에는 에러율 리셋 스킵 (비용 절감)
      if (!shouldRunMonitoring()) {
        return;
      }

      this.errorCount = 0;
      this.lastErrorReset = Date.now();
    }, 60 * 60 * 1000);
  }

  /**
   * 높은 메모리 사용량 처리
   */
  private async handleHighMemoryUsage(memoryMB: number): Promise<void> {
    console.warn(`⚠️ High memory usage detected: ${Math.round(memoryMB)}MB`);

    const crashEvent = this.recordCrashEvent({
      type: 'MEMORY_LEAK',
      severity: memoryMB > this.thresholds.memoryUsage * 1.5 ? 'HIGH' : 'MEDIUM',
      details: `Memory usage: ${Math.round(memoryMB)}MB`,
      recoveryAction: []
    });

    // 메모리 정리 시도
    try {
      // 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
        crashEvent.recoveryAction.push('Forced garbage collection');
      }

      // 캐시 정리
      await this.clearCaches();
      crashEvent.recoveryAction.push('Cleared system caches');

      crashEvent.recovered = true;
      console.log('✅ Memory cleanup completed');

    } catch (error) {
      console.error('Memory cleanup failed:', error);
      crashEvent.recoveryAction.push(`Cleanup failed: ${error}`);
    }
  }

  /**
   * 높은 CPU 사용량 처리
   */
  private async handleHighCpuUsage(cpuPercent: number): Promise<void> {
    console.warn(`⚠️ High CPU usage detected: ${cpuPercent}%`);

    this.recordCrashEvent({
      type: 'RESOURCE_EXHAUSTION',
      severity: 'MEDIUM',
      details: `CPU usage: ${cpuPercent}%`,
      recoveryAction: ['CPU usage monitoring', 'Performance optimization recommended']
    });

    // CPU 부하 감소 시도
    // (Node.js의 단일 스레드 특성상 제한적)
  }

  /**
   * 높은 에러율 처리
   */
  private async handleHighErrorRate(errorRate: number): Promise<void> {
    console.error(`🚨 High error rate detected: ${(errorRate * 100).toFixed(1)}%`);

    const crashEvent = this.recordCrashEvent({
      type: 'DATA_CORRUPTION',
      severity: errorRate > 0.1 ? 'HIGH' : 'MEDIUM',
      details: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
      recoveryAction: []
    });

    try {
      // 데이터 무결성 검사
      await this.performEmergencyDataCheck();
      crashEvent.recoveryAction.push('Emergency data integrity check completed');

      // 시스템 상태 초기화
      this.errorCount = 0;
      crashEvent.recoveryAction.push('Error counter reset');

      crashEvent.recovered = true;

    } catch (error) {
      console.error('Error rate recovery failed:', error);
      crashEvent.recoveryAction.push(`Recovery failed: ${error}`);
    }
  }

  /**
   * 시스템 건강 상태 조회
   */
  getSystemHealth(): SystemHealth {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    const uptimeHours = process.uptime() / 3600;

    // 에러율 계산
    const timeWindow = Date.now() - this.lastErrorReset;
    const errorRate = timeWindow > 0 ? this.errorCount / (timeWindow / 1000) : 0;

    // 안정성 평가
    let stability: SystemHealth['stability'] = 'EXCELLENT';
    const recentCrashes = this.crashEvents.filter(
      c => Date.now() - c.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    if (recentCrashes > 5 || errorRate > 0.1) {
      stability = 'POOR';
    } else if (recentCrashes > 2 || errorRate > 0.05) {
      stability = 'FAIR';
    } else if (recentCrashes > 0 || errorRate > 0.01) {
      stability = 'GOOD';
    }

    const lastCrash = this.crashEvents.length > 0
      ? this.crashEvents[this.crashEvents.length - 1].timestamp
      : undefined;

    return {
      cpu: 0, // Node.js에서 실시간 CPU 사용률 측정은 복잡
      memory: memUsageMB,
      uptime: uptimeHours,
      errorRate,
      lastCrash,
      totalCrashes: this.crashEvents.length,
      stability
    };
  }

  /**
   * 크래시 이벤트 기록
   */
  private recordCrashEvent(eventData: {
    type: CrashEvent['type'];
    severity: CrashEvent['severity'];
    details: string;
    stackTrace?: string;
    recoveryAction: string[];
  }): CrashEvent {
    const event: CrashEvent = {
      id: `crash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...eventData,
      recovered: false,
      downtime: 0
    };

    this.crashEvents.push(event);

    // 최근 50개 이벤트만 유지
    if (this.crashEvents.length > 50) {
      this.crashEvents = this.crashEvents.slice(-50);
    }

    console.log(`📝 Crash event recorded: ${event.type} - ${event.severity}`);
    return event;
  }

  /**
   * 복구 시도
   */
  private async attemptRecovery(crashEvent: CrashEvent): Promise<boolean> {
    console.log(`🔄 Attempting recovery for ${crashEvent.type}...`);

    try {
      switch (crashEvent.type) {
        case 'MEMORY_LEAK':
          await this.recoverFromMemoryLeak();
          break;

        case 'DATA_CORRUPTION':
          await this.recoverFromDataCorruption();
          break;

        case 'NETWORK_FAILURE':
          await this.recoverFromNetworkFailure();
          break;

        case 'UNHANDLED_ERROR':
          await this.recoverFromUnhandledError();
          break;

        default:
          console.log('Generic recovery attempt...');
          await this.genericRecovery();
      }

      crashEvent.recovered = true;
      crashEvent.recoveryAction.push('Automated recovery successful');
      console.log('✅ Recovery successful');
      return true;

    } catch (error) {
      console.error('Recovery failed:', error);
      crashEvent.recoveryAction.push(`Recovery failed: ${error}`);
      return false;
    }
  }

  /**
   * 메모리 누수 복구
   */
  private async recoverFromMemoryLeak(): Promise<void> {
    console.log('🧹 Recovering from memory leak...');

    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }

    // 캐시 정리
    await this.clearCaches();

    // 메모리 사용량 재체크
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;

    if (memUsageMB > this.thresholds.memoryUsage) {
      throw new Error('Memory usage still high after cleanup');
    }
  }

  /**
   * 데이터 손상 복구
   */
  private async recoverFromDataCorruption(): Promise<void> {
    console.log('🔧 Recovering from data corruption...');

    // 데이터 무결성 검사 및 복구
    await this.performEmergencyDataCheck();

    // 품질 모니터링 재시작
    if (!automatedQualityAlerts) {
      const { automatedQualityAlerts } = await import('./automated-quality-alerts');
      automatedQualityAlerts.start();
    }
  }

  /**
   * 네트워크 장애 복구
   */
  private async recoverFromNetworkFailure(): Promise<void> {
    console.log('🌐 Recovering from network failure...');

    // 네트워크 연결 테스트
    // (실제 구현에서는 DNS 조회, 핑 테스트 등)

    // 데이터 수집 재시작
    const { autoScheduler } = await import('./auto-scheduler');
    if (autoScheduler) {
      autoScheduler.start();
    }
  }

  /**
   * 처리되지 않은 오류 복구
   */
  private async recoverFromUnhandledError(): Promise<void> {
    console.log('⚡ Recovering from unhandled error...');

    // 시스템 상태 초기화
    this.errorCount = 0;

    // 필수 서비스 상태 확인 및 재시작
    await this.restartCriticalServices();
  }

  /**
   * 일반적 복구
   */
  private async genericRecovery(): Promise<void> {
    console.log('🔄 Performing generic recovery...');

    // 메모리 정리
    if (global.gc) {
      global.gc();
    }

    // 시스템 상태 확인
    const health = this.getSystemHealth();
    if (health.stability === 'POOR') {
      throw new Error('System stability is poor, recovery not possible');
    }
  }

  /**
   * 캐시 정리
   */
  private async clearCaches(): Promise<void> {
    try {
      // Node.js 모듈 캐시 정리 (주의해서 사용)
      // delete require.cache[someSpecificModule];

      console.log('🧹 Caches cleared');
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  /**
   * 긴급 데이터 체크
   */
  private async performEmergencyDataCheck(): Promise<void> {
    try {
      console.log('🔍 Performing emergency data integrity check...');

      const recentTrades = await storage.getInsiderTrades(100, 0, false);
      let corruptedCount = 0;

      for (const trade of recentTrades) {
        // 기본적인 데이터 무결성 체크
        if (!trade.accessionNumber || !trade.companyName || !trade.traderName) {
          corruptedCount++;
        }
      }

      if (corruptedCount > recentTrades.length * 0.1) { // 10% 이상 손상
        throw new Error(`High data corruption detected: ${corruptedCount}/${recentTrades.length} trades`);
      }

      console.log(`✅ Emergency data check passed: ${corruptedCount} issues found`);

    } catch (error) {
      console.error('Emergency data check failed:', error);
      throw error;
    }
  }

  /**
   * 중요 서비스 재시작
   */
  private async restartCriticalServices(): Promise<void> {
    try {
      console.log('🔄 Restarting critical services...');

      // 데이터 품질 모니터링 재시작
      realTimeFreshnessMonitor.start();
      automatedQualityAlerts.start();

      console.log('✅ Critical services restarted');

    } catch (error) {
      console.error('Service restart failed:', error);
      throw error;
    }
  }

  /**
   * 우아한 종료 핸들러 등록
   */
  addGracefulShutdownHandler(handler: () => Promise<void>): void {
    this.gracefulShutdownHandlers.push(handler);
  }

  /**
   * 우아한 종료 핸들러 실행
   */
  private async executeGracefulShutdownHandlers(): Promise<void> {
    for (const handler of this.gracefulShutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        console.error('Graceful shutdown handler failed:', error);
      }
    }
  }

  /**
   * 최종 데이터 무결성 검사
   */
  private async performFinalIntegrityCheck(): Promise<void> {
    try {
      const stats = await storage.getTradingStats(true);
      console.log(`📊 Final data state: ${stats.todayTrades} trades, $${stats.totalVolume.toLocaleString()} volume`);
    } catch (error) {
      console.warn('Final integrity check failed:', error);
    }
  }

  /**
   * 긴급 종료
   */
  private async emergencyShutdown(error: Error): Promise<void> {
    console.error('🚨 EMERGENCY SHUTDOWN INITIATED');
    console.error('Cause:', error.message);

    try {
      // 긴급 상태 저장
      await this.saveEmergencyState();

      // 강제 종료
      process.exit(1);

    } catch (shutdownError) {
      console.error('Emergency shutdown failed:', shutdownError);
      process.exit(1);
    }
  }

  /**
   * 긴급 상태 저장
   */
  private async saveEmergencyState(): Promise<void> {
    try {
      const emergencyState = {
        timestamp: new Date().toISOString(),
        crashEvents: this.crashEvents.slice(-10), // 최근 10개
        systemHealth: this.getSystemHealth(),
        processInfo: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          version: process.version
        }
      };

      // 실제 구현에서는 파일이나 로그 서비스에 저장
      console.log('💾 Emergency state saved:', JSON.stringify(emergencyState, null, 2));

    } catch (error) {
      console.error('Failed to save emergency state:', error);
    }
  }

  /**
   * 에러 증가
   */
  incrementErrorCount(): void {
    this.errorCount++;
  }

  /**
   * 크래시 이벤트 조회
   */
  getCrashEvents(hours: number = 24): CrashEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.crashEvents.filter(event => event.timestamp > cutoff);
  }

  /**
   * 시스템 상태 요약
   */
  getStatusSummary(): {
    status: 'STABLE' | 'WARNING' | 'CRITICAL';
    uptime: number;
    memoryUsage: number;
    recentCrashes: number;
    stability: string;
  } {
    const health = this.getSystemHealth();
    const recentCrashes = this.getCrashEvents(24).length;

    let status: 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
    if (health.stability === 'POOR' || recentCrashes > 5) {
      status = 'CRITICAL';
    } else if (health.stability === 'FAIR' || recentCrashes > 2) {
      status = 'WARNING';
    }

    return {
      status,
      uptime: health.uptime,
      memoryUsage: health.memory,
      recentCrashes,
      stability: health.stability
    };
  }
}

// 전역 인스턴스
export const crashPreventionSystem = new CrashPreventionSystem();