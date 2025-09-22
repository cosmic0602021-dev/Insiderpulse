/**
 * 새로운 데이터 수집 서비스 - 기존 시스템 교체
 * 최고 품질의 내부자 거래 데이터 제공
 */

import { unifiedScraperSystem } from './scrapers/unified-scraper-system';

interface CollectionJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string; // cron 표현식
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
  errorMessage?: string;
}

export class NewDataCollectionService {
  private jobs: Map<string, CollectionJob> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeJobs();
  }

  /**
   * 데이터 수집 작업들 초기화
   */
  private initializeJobs(): void {
    console.log('🚀 새로운 데이터 수집 서비스 초기화 중...');

    // 주요 스크래핑 작업들 정의
    const jobs: CollectionJob[] = [
      {
        id: 'unified-scraping-frequent',
        name: '통합 스크래핑 (빈번)',
        enabled: true,
        schedule: '*/10 * * * *', // 10분마다
        status: 'idle'
      },
      {
        id: 'unified-scraping-hourly',
        name: '통합 스크래핑 (시간별)',
        enabled: true,
        schedule: '0 * * * *', // 매시간
        status: 'idle'
      },
      {
        id: 'edgar-api-daily',
        name: 'SEC EDGAR API 일일 수집',
        enabled: true,
        schedule: '0 9 * * *', // 매일 오전 9시
        status: 'idle'
      },
      {
        id: 'openinsider-comprehensive',
        name: 'OpenInsider 종합 수집',
        enabled: true,
        schedule: '0 */6 * * *', // 6시간마다
        status: 'idle'
      },
      {
        id: 'data-quality-check',
        name: '데이터 품질 검사',
        enabled: true,
        schedule: '0 0 * * *', // 매일 자정
        status: 'idle'
      }
    ];

    // 작업들 등록
    jobs.forEach(job => {
      this.jobs.set(job.id, job);
    });

    console.log(`✅ ${jobs.length}개 데이터 수집 작업 등록 완료`);
    this.isInitialized = true;
  }

  /**
   * 모든 스케줄된 작업 시작
   */
  async startAllJobs(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('데이터 수집 서비스가 초기화되지 않았습니다');
    }

    console.log('📅 스케줄된 데이터 수집 작업들 시작...');

    // 통합 스크래핑 (빈번) - 10분마다
    setInterval(async () => {
      await this.executeJob('unified-scraping-frequent', async () => {
        console.log('🔄 빈번한 통합 스크래핑 실행...');
        const trades = await unifiedScraperSystem.executeFullScraping();
        console.log(`✅ ${trades.length}개 거래 데이터 수집 완료 (빈번)`);
      });
    }, 10 * 60 * 1000); // 10분

    // 통합 스크래핑 (시간별) - 매시간
    setInterval(async () => {
      await this.executeJob('unified-scraping-hourly', async () => {
        console.log('🔄 시간별 통합 스크래핑 실행...');

        // 더 많은 데이터 수집을 위한 확장 설정
        const trades = await unifiedScraperSystem.executeFullScraping();
        console.log(`✅ ${trades.length}개 거래 데이터 수집 완료 (시간별)`);

        // 통계 출력
        const stats = unifiedScraperSystem.getStatistics();
        console.log('📊 현재 통계:', stats);
      });
    }, 60 * 60 * 1000); // 1시간

    // SEC EDGAR API 일일 수집 - 매일 (24시간마다)
    setInterval(async () => {
      await this.executeJob('edgar-api-daily', async () => {
        console.log('🏛️ SEC EDGAR API 일일 수집 실행...');
        // 더 상세한 EDGAR 수집 로직 구현
        const trades = await unifiedScraperSystem.executeFullScraping();
        console.log(`✅ 일일 EDGAR 수집 완료: ${trades.length}개 거래`);
      });
    }, 24 * 60 * 60 * 1000); // 24시간

    // OpenInsider 종합 수집 - 6시간마다
    setInterval(async () => {
      await this.executeJob('openinsider-comprehensive', async () => {
        console.log('🔍 OpenInsider 종합 수집 실행...');
        const trades = await unifiedScraperSystem.executeFullScraping();
        console.log(`✅ OpenInsider 종합 수집 완료: ${trades.length}개 거래`);
      });
    }, 6 * 60 * 60 * 1000); // 6시간

    // 데이터 품질 검사 - 매일 (24시간마다)
    setInterval(async () => {
      await this.executeJob('data-quality-check', async () => {
        console.log('🔍 데이터 품질 검사 실행...');
        await this.performDataQualityCheck();
        console.log('✅ 데이터 품질 검사 완료');
      });
    }, 24 * 60 * 60 * 1000); // 24시간

    // 즉시 한 번 실행
    console.log('🚀 즉시 초기 데이터 수집 실행...');
    await this.executeManualCollection();

    console.log('🎯 모든 스케줄된 작업 시작 완료');
  }

  /**
   * 작업 실행 래퍼 (에러 처리 및 상태 관리)
   */
  private async executeJob(jobId: string, jobFunction: () => Promise<void>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) {
      return;
    }

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.errorMessage = undefined;

      await jobFunction();

      job.status = 'idle';
      console.log(`✅ 작업 완료: ${job.name}`);

    } catch (error) {
      job.status = 'error';
      job.errorMessage = error.message;
      console.error(`❌ 작업 실패: ${job.name}`, error.message);
    }
  }

  /**
   * 수동 데이터 수집 실행
   */
  async executeManualCollection(): Promise<any> {
    console.log('🔧 수동 데이터 수집 실행...');

    try {
      const startTime = Date.now();

      // 통합 스크래핑 실행
      const trades = await unifiedScraperSystem.executeFullScraping();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const result = {
        success: true,
        tradesCollected: trades.length,
        duration: `${duration.toFixed(1)}초`,
        statistics: unifiedScraperSystem.getStatistics(),
        timestamp: new Date().toISOString()
      };

      console.log('✅ 수동 데이터 수집 완료:', result);
      return result;

    } catch (error) {
      console.error('❌ 수동 데이터 수집 실패:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 데이터 품질 검사 수행
   */
  private async performDataQualityCheck(): Promise<void> {
    console.log('🔍 데이터 품질 검사 시작...');

    const trades = unifiedScraperSystem.getAllTrades();
    const stats = unifiedScraperSystem.getStatistics();

    // 기본 품질 검사
    const qualityReport = {
      totalTrades: trades.length,
      verifiedTrades: stats.verifiedTrades,
      verificationRate: (stats.verifiedTrades / trades.length * 100).toFixed(1),
      averageConfidence: stats.averageConfidence.toFixed(1),
      sourceDistribution: stats.sourceBreakdown,
      dataGaps: this.findDataGaps(trades),
      duplicateIssues: this.findDuplicateIssues(trades),
      qualityScore: this.calculateOverallQualityScore(stats)
    };

    console.log('📊 데이터 품질 리포트:', qualityReport);

    // 품질이 낮으면 경고
    if (qualityReport.qualityScore < 70) {
      console.warn('⚠️ 데이터 품질이 낮습니다! 즉시 조치가 필요합니다.');
    }
  }

  /**
   * 데이터 공백 탐지
   */
  private findDataGaps(trades: any[]): any[] {
    const gaps = [];
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // 어제 데이터가 없으면 공백으로 간주
    const yesterdayTrades = trades.filter(t => {
      const tradeDate = new Date(t.transactionDate);
      return tradeDate.toDateString() === yesterday.toDateString();
    });

    if (yesterdayTrades.length === 0) {
      gaps.push({
        date: yesterday.toISOString().split('T')[0],
        issue: '어제 데이터 누락'
      });
    }

    return gaps;
  }

  /**
   * 중복 이슈 탐지
   */
  private findDuplicateIssues(trades: any[]): any[] {
    const duplicates = [];
    const tradeMap = new Map();

    for (const trade of trades) {
      const key = `${trade.ticker}_${trade.insiderName}_${trade.transactionDate}`;
      if (tradeMap.has(key)) {
        duplicates.push({
          key,
          count: tradeMap.get(key) + 1
        });
        tradeMap.set(key, tradeMap.get(key) + 1);
      } else {
        tradeMap.set(key, 1);
      }
    }

    return duplicates.filter(d => d.count > 1);
  }

  /**
   * 전체 품질 점수 계산
   */
  private calculateOverallQualityScore(stats: any): number {
    let score = 0;

    // 검증율 (40점 만점)
    score += (stats.verifiedTrades / stats.totalTrades) * 40;

    // 평균 신뢰도 (30점 만점)
    score += (stats.averageConfidence / 100) * 30;

    // 소스 다양성 (20점 만점)
    const activeSources = Object.values(stats.sourceBreakdown).filter((count: any) => count > 0).length;
    score += (activeSources / 3) * 20;

    // 데이터 양 (10점 만점)
    score += Math.min(stats.totalTrades / 100, 1) * 10;

    return Math.round(score);
  }

  /**
   * 현재 작업 상태 반환
   */
  getJobStatuses(): CollectionJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * 특정 작업 활성화/비활성화
   */
  toggleJob(jobId: string, enabled: boolean): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} 작업 ${job.name} ${enabled ? '활성화' : '비활성화'}`);
      return true;
    }
    return false;
  }

  /**
   * 서비스 상태 반환
   */
  getServiceStatus(): any {
    return {
      initialized: this.isInitialized,
      jobs: this.getJobStatuses(),
      statistics: unifiedScraperSystem.getStatistics(),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * 최신 거래 데이터 반환 (API용)
   */
  getLatestTrades(limit: number = 50, filters: any = {}): any[] {
    const trades = unifiedScraperSystem.getFilteredTrades(filters);

    // 최신순으로 정렬
    return trades
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * 서비스 종료
   */
  shutdown(): void {
    console.log('🛑 데이터 수집 서비스 종료 중...');
    unifiedScraperSystem.stopScheduledScraping();
    console.log('✅ 데이터 수집 서비스 종료 완료');
  }
}

// Export singleton instance
export const newDataCollectionService = new NewDataCollectionService();