import { storage } from './storage';
import { stockPriceService } from './stock-price-service';
import type { InsiderTrade } from '@shared/schema';

interface TradeOutcome {
  tradeId: string;
  ticker: string;
  traderName: string;
  tradeDate: string;
  tradeType: string;
  tradeValue: number;
  priceAtTrade: number;

  // 성과 측정 (1개월, 3개월, 6개월 후)
  performance: {
    oneMonth: {
      priceChange: number;
      percentageReturn: number;
      success: boolean; // 예상 방향과 일치하는지
    };
    threeMonth: {
      priceChange: number;
      percentageReturn: number;
      success: boolean;
    };
    sixMonth: {
      priceChange: number;
      percentageReturn: number;
      success: boolean;
    };
  };

  // 추가 분석
  analysis: {
    timingScore: number; // 타이밍의 좋고 나쁨 (0-100)
    volumeImpact: number; // 거래량이 주가에 미친 영향
    marketCondition: 'BULL' | 'BEAR' | 'NEUTRAL'; // 거래 당시 시장 상황
  };
}

interface InsiderCredibilityProfile {
  traderName: string;
  traderTitle: string;
  companies: string[]; // 거래한 회사들
  totalTrades: number;

  // 성과 지표
  performance: {
    oneMonth: {
      totalTrades: number;
      successfulTrades: number;
      successRate: number; // 0-100
      avgReturn: number; // 평균 수익률
      totalReturn: number; // 총 수익률
    };
    threeMonth: {
      totalTrades: number;
      successfulTrades: number;
      successRate: number;
      avgReturn: number;
      totalReturn: number;
    };
    sixMonth: {
      totalTrades: number;
      successfulTrades: number;
      successRate: number;
      avgReturn: number;
      totalReturn: number;
    };
  };

  // 신뢰도 점수 (0-100)
  credibilityScore: number;

  // 세부 평가 요소
  scoreBreakdown: {
    consistencyScore: number; // 일관성 점수 (0-20)
    timingScore: number; // 타이밍 점수 (0-20)
    frequencyScore: number; // 거래 빈도 점수 (0-20)
    impactScore: number; // 시장 영향도 점수 (0-20)
    experienceScore: number; // 경험/지위 점수 (0-20)
  };

  // 거래 패턴 분석
  tradingPatterns: {
    preferredTradeType: string; // 주로 하는 거래 타입
    averageHoldingPeriod: number; // 평균 보유 기간 (예상)
    seasonality: string; // 계절성 패턴
    marketCapPreference: string; // 선호하는 회사 규모
  };

  // 최근 활동
  recentActivity: {
    lastTradeDate: string;
    recentTradesCount: number; // 최근 3개월 거래 수
    recentPerformance: number; // 최근 성과
    trendDirection: 'IMPROVING' | 'DECLINING' | 'STABLE';
  };

  // 경고 신호
  riskFactors: string[];

  lastUpdated: string;
}

class InsiderCredibilityService {
  private credibilityCache: Map<string, InsiderCredibilityProfile> = new Map();
  private isUpdating: boolean = false;

  // 특정 내부자의 신뢰도 프로필 생성/업데이트
  async generateCredibilityProfile(traderName: string): Promise<InsiderCredibilityProfile | null> {
    try {
      console.log(`👤 신뢰도 프로필 생성 시작: ${traderName}`);

      // 해당 트레이더의 모든 거래 조회
      const allTrades = await storage.getInsiderTrades(5000, 0, false);
      const traderTrades = allTrades.filter(trade =>
        trade.traderName === traderName
      ).sort((a, b) => new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime());

      if (traderTrades.length === 0) {
        console.log(`트레이더 ${traderName}의 거래 기록이 없습니다.`);
        return null;
      }

      // 각 거래의 성과 분석
      const tradeOutcomes: TradeOutcome[] = [];
      for (const trade of traderTrades) {
        const outcome = await this.analyzeTradeOutcome(trade);
        if (outcome) {
          tradeOutcomes.push(outcome);
        }
      }

      // 성과 지표 계산
      const performance = this.calculatePerformanceMetrics(tradeOutcomes);

      // 신뢰도 점수 계산
      const scoreBreakdown = this.calculateScoreBreakdown(traderTrades, tradeOutcomes);
      const credibilityScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

      // 거래 패턴 분석
      const tradingPatterns = this.analyzeTradingPatterns(traderTrades, tradeOutcomes);

      // 최근 활동 분석
      const recentActivity = this.analyzeRecentActivity(traderTrades, tradeOutcomes);

      // 위험 요소 평가
      const riskFactors = this.identifyRiskFactors(traderTrades, tradeOutcomes, performance);

      const profile: InsiderCredibilityProfile = {
        traderName,
        traderTitle: traderTrades[0].traderTitle || 'Unknown',
        companies: [...new Set(traderTrades.map(t => t.companyName))],
        totalTrades: traderTrades.length,
        performance,
        credibilityScore: Math.round(credibilityScore),
        scoreBreakdown,
        tradingPatterns,
        recentActivity,
        riskFactors,
        lastUpdated: new Date().toISOString()
      };

      // 캐시에 저장 (6시간)
      this.credibilityCache.set(traderName, profile);
      setTimeout(() => this.credibilityCache.delete(traderName), 6 * 60 * 60 * 1000);

      console.log(`✅ 신뢰도 프로필 생성 완료: ${traderName} (점수: ${profile.credibilityScore})`);
      return profile;

    } catch (error) {
      console.error(`신뢰도 프로필 생성 실패 (${traderName}):`, error);
      return null;
    }
  }

  // 거래 성과 분석
  private async analyzeTradeOutcome(trade: InsiderTrade): Promise<TradeOutcome | null> {
    try {
      const ticker = trade.ticker;
      if (!ticker) return null;

      const tradeDate = new Date(trade.filedDate);
      const today = new Date();

      // 거래일로부터 충분한 시간이 지났는지 확인
      const daysElapsed = (today.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysElapsed < 30) {
        // 아직 1개월도 안 지났으면 분석하지 않음
        return null;
      }

      // 거래 시점의 주가 (근사치)
      const priceAtTrade = trade.pricePerShare || 0;
      if (priceAtTrade === 0) return null;

      // 1개월, 3개월, 6개월 후 주가 데이터 조회
      const oneMonthLater = new Date(tradeDate);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      const threeMonthsLater = new Date(tradeDate);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      const sixMonthsLater = new Date(tradeDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      // 실제로는 주가 이력 데이터에서 조회해야 하지만,
      // 여기서는 현재 주가로 근사치 계산
      const currentPrice = await this.getHistoricalPrice(ticker, today);

      const oneMonthPrice = daysElapsed >= 30 ? currentPrice : priceAtTrade;
      const threeMonthPrice = daysElapsed >= 90 ? currentPrice : priceAtTrade;
      const sixMonthPrice = daysElapsed >= 180 ? currentPrice : priceAtTrade;

      // 매수/매도 여부 판단
      const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE' || trade.tradeType === 'GRANT';

      const outcome: TradeOutcome = {
        tradeId: trade.id,
        ticker,
        traderName: trade.traderName,
        tradeDate: tradeDate.toISOString().split('T')[0],
        tradeType: trade.tradeType,
        tradeValue: Math.abs(trade.totalValue),
        priceAtTrade,
        performance: {
          oneMonth: {
            priceChange: oneMonthPrice - priceAtTrade,
            percentageReturn: ((oneMonthPrice - priceAtTrade) / priceAtTrade) * 100,
            success: isBuy ? oneMonthPrice > priceAtTrade : oneMonthPrice < priceAtTrade
          },
          threeMonth: {
            priceChange: threeMonthPrice - priceAtTrade,
            percentageReturn: ((threeMonthPrice - priceAtTrade) / priceAtTrade) * 100,
            success: isBuy ? threeMonthPrice > priceAtTrade : threeMonthPrice < priceAtTrade
          },
          sixMonth: {
            priceChange: sixMonthPrice - priceAtTrade,
            percentageReturn: ((sixMonthPrice - priceAtTrade) / priceAtTrade) * 100,
            success: isBuy ? sixMonthPrice > priceAtTrade : sixMonthPrice < priceAtTrade
          }
        },
        analysis: {
          timingScore: this.calculateTimingScore(trade, oneMonthPrice, threeMonthPrice, sixMonthPrice),
          volumeImpact: 50, // 간소화 - 실제로는 거래량 데이터 필요
          marketCondition: 'NEUTRAL' // 간소화 - 실제로는 시장 지수 데이터 필요
        }
      };

      return outcome;

    } catch (error) {
      console.error(`거래 성과 분석 실패 (${trade.id}):`, error);
      return null;
    }
  }

  // 과거 주가 조회 (간소화된 구현)
  private async getHistoricalPrice(ticker: string, date: Date): Promise<number> {
    try {
      // 실제로는 주가 이력 데이터베이스에서 조회해야 함
      const currentPrice = await stockPriceService.getStockPrice(ticker);
      return currentPrice ? parseFloat(currentPrice.currentPrice.toString()) : 0;
    } catch (error) {
      console.error(`과거 주가 조회 실패 (${ticker}):`, error);
      return 0;
    }
  }

  // 타이밍 점수 계산
  private calculateTimingScore(trade: InsiderTrade, oneMonth: number, threeMonth: number, sixMonth: number): number {
    const priceAtTrade = trade.pricePerShare || 0;
    if (priceAtTrade === 0) return 50;

    const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE' || trade.tradeType === 'GRANT';

    // 각 기간별 성과를 점수로 변환
    const oneMonthReturn = ((oneMonth - priceAtTrade) / priceAtTrade) * 100;
    const threeMonthReturn = ((threeMonth - priceAtTrade) / priceAtTrade) * 100;
    const sixMonthReturn = ((sixMonth - priceAtTrade) / priceAtTrade) * 100;

    let score = 0;

    // 매수의 경우 주가 상승이 좋은 타이밍, 매도의 경우 주가 하락이 좋은 타이밍
    if (isBuy) {
      score = (oneMonthReturn * 0.5 + threeMonthReturn * 0.3 + sixMonthReturn * 0.2);
    } else {
      score = -(oneMonthReturn * 0.5 + threeMonthReturn * 0.3 + sixMonthReturn * 0.2);
    }

    // 점수를 0-100 범위로 정규화
    return Math.max(0, Math.min(100, 50 + score * 2));
  }

  // 성과 지표 계산
  private calculatePerformanceMetrics(outcomes: TradeOutcome[]) {
    const calculatePeriodMetrics = (period: 'oneMonth' | 'threeMonth' | 'sixMonth') => {
      const validOutcomes = outcomes.filter(o => o.performance[period].priceChange !== 0);
      const successful = validOutcomes.filter(o => o.performance[period].success);

      return {
        totalTrades: validOutcomes.length,
        successfulTrades: successful.length,
        successRate: validOutcomes.length > 0 ? (successful.length / validOutcomes.length) * 100 : 0,
        avgReturn: validOutcomes.length > 0
          ? validOutcomes.reduce((sum, o) => sum + o.performance[period].percentageReturn, 0) / validOutcomes.length
          : 0,
        totalReturn: validOutcomes.reduce((sum, o) => sum + o.performance[period].percentageReturn, 0)
      };
    };

    return {
      oneMonth: calculatePeriodMetrics('oneMonth'),
      threeMonth: calculatePeriodMetrics('threeMonth'),
      sixMonth: calculatePeriodMetrics('sixMonth')
    };
  }

  // 신뢰도 점수 세부 계산
  private calculateScoreBreakdown(trades: InsiderTrade[], outcomes: TradeOutcome[]) {
    // 1. 일관성 점수 (0-20): 성공률의 일관성
    const consistencyScore = Math.min(20, Math.max(0,
      (outcomes.length > 0 ?
        outcomes.reduce((sum, o) => sum + (o.performance.threeMonth.success ? 1 : 0), 0) / outcomes.length * 20
        : 0)
    ));

    // 2. 타이밍 점수 (0-20): 평균 타이밍 점수
    const avgTimingScore = outcomes.length > 0
      ? outcomes.reduce((sum, o) => sum + o.analysis.timingScore, 0) / outcomes.length
      : 50;
    const timingScore = (avgTimingScore / 100) * 20;

    // 3. 거래 빈도 점수 (0-20): 적절한 거래 빈도
    const tradingFrequency = trades.length;
    let frequencyScore = 0;
    if (tradingFrequency >= 5 && tradingFrequency <= 50) {
      frequencyScore = 20;
    } else if (tradingFrequency > 50) {
      frequencyScore = Math.max(0, 20 - (tradingFrequency - 50) * 0.2);
    } else {
      frequencyScore = tradingFrequency * 4; // 5건 미만일 때
    }

    // 4. 시장 영향도 점수 (0-20): 거래 규모와 지위
    const avgTradeValue = trades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0) / trades.length;
    const impactScore = Math.min(20, Math.log10(avgTradeValue) * 2);

    // 5. 경험/지위 점수 (0-20): 직책과 경험
    const title = trades[0]?.traderTitle?.toLowerCase() || '';
    let experienceScore = 10; // 기본 점수
    if (title.includes('ceo') || title.includes('president')) experienceScore = 20;
    else if (title.includes('cfo') || title.includes('coo')) experienceScore = 18;
    else if (title.includes('director') || title.includes('officer')) experienceScore = 15;
    else if (title.includes('manager') || title.includes('vp')) experienceScore = 12;

    return {
      consistencyScore: Math.round(consistencyScore),
      timingScore: Math.round(timingScore),
      frequencyScore: Math.round(frequencyScore),
      impactScore: Math.round(impactScore),
      experienceScore
    };
  }

  // 거래 패턴 분석
  private analyzeTradingPatterns(trades: InsiderTrade[], outcomes: TradeOutcome[]) {
    // 선호 거래 타입
    const tradeTypeCounts = trades.reduce((acc, trade) => {
      acc[trade.tradeType] = (acc[trade.tradeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredTradeType = Object.entries(tradeTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // 계절성 분석 (간소화)
    const monthCounts = trades.reduce((acc, trade) => {
      const month = new Date(trade.filedDate).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakMonth = Object.entries(monthCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    const seasonality = peakMonth
      ? `${parseInt(peakMonth) + 1}월에 가장 활발`
      : '특별한 패턴 없음';

    return {
      preferredTradeType,
      averageHoldingPeriod: 90, // 간소화 - 실제로는 후속 거래 분석 필요
      seasonality,
      marketCapPreference: '대형주' // 간소화 - 실제로는 회사 규모 분석 필요
    };
  }

  // 최근 활동 분석
  private analyzeRecentActivity(trades: InsiderTrade[], outcomes: TradeOutcome[]) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTrades = trades.filter(trade =>
      new Date(trade.filedDate) >= threeMonthsAgo
    );

    const recentOutcomes = outcomes.filter(outcome =>
      new Date(outcome.tradeDate) >= threeMonthsAgo
    );

    const recentPerformance = recentOutcomes.length > 0
      ? recentOutcomes.reduce((sum, o) => sum + (o.performance.oneMonth.success ? 1 : 0), 0) / recentOutcomes.length * 100
      : 0;

    // 트렌드 방향 분석 (간소화)
    let trendDirection: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (recentPerformance > 70) trendDirection = 'IMPROVING';
    else if (recentPerformance < 40) trendDirection = 'DECLINING';

    return {
      lastTradeDate: trades.length > 0
        ? trades[trades.length - 1].filedDate.toISOString().split('T')[0]
        : 'N/A',
      recentTradesCount: recentTrades.length,
      recentPerformance: Math.round(recentPerformance),
      trendDirection
    };
  }

  // 위험 요소 식별
  private identifyRiskFactors(trades: InsiderTrade[], outcomes: TradeOutcome[], performance: any): string[] {
    const riskFactors: string[] = [];

    // 성공률이 낮은 경우
    if (performance.threeMonth.successRate < 40) {
      riskFactors.push('낮은 성공률 (40% 미만)');
    }

    // 너무 빈번한 거래
    if (trades.length > 100) {
      riskFactors.push('과도한 거래 빈도');
    }

    // 큰 손실 경험
    const hasLargeLoss = outcomes.some(o => o.performance.threeMonth.percentageReturn < -50);
    if (hasLargeLoss) {
      riskFactors.push('대규모 손실 경험');
    }

    // 최근 성과 저조
    const recentOutcomes = outcomes.slice(-10);
    const recentSuccessRate = recentOutcomes.length > 0
      ? recentOutcomes.filter(o => o.performance.oneMonth.success).length / recentOutcomes.length
      : 1;

    if (recentSuccessRate < 0.3) {
      riskFactors.push('최근 성과 급락');
    }

    // 일관성 부족
    const successRateVariance = Math.abs(performance.oneMonth.successRate - performance.sixMonth.successRate);
    if (successRateVariance > 30) {
      riskFactors.push('성과 일관성 부족');
    }

    return riskFactors;
  }

  // 모든 활성 내부자들의 신뢰도 랭킹
  async generateCredibilityRankings(limit: number = 50): Promise<InsiderCredibilityProfile[]> {
    try {
      console.log('🏆 신뢰도 랭킹 생성 시작...');

      // 활성 거래자들 목록 생성
      const allTrades = await storage.getInsiderTrades(2000, 0, false);
      const traderCounts = allTrades.reduce((acc, trade) => {
        acc[trade.traderName] = (acc[trade.traderName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 최소 5건 이상 거래한 트레이더들만 선별
      const eligibleTraders = Object.entries(traderCounts)
        .filter(([, count]) => count >= 5)
        .map(([name]) => name)
        .slice(0, limit * 2); // 안전마진 확보

      const profiles: InsiderCredibilityProfile[] = [];

      // 각 트레이더의 신뢰도 프로필 생성
      for (const traderName of eligibleTraders.slice(0, limit)) {
        try {
          const profile = await this.generateCredibilityProfile(traderName);
          if (profile) {
            profiles.push(profile);
          }

          // API 제한을 피하기 위한 딜레이
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`${traderName} 프로필 생성 실패:`, error);
        }
      }

      // 신뢰도 점수로 정렬
      const rankings = profiles
        .sort((a, b) => b.credibilityScore - a.credibilityScore)
        .slice(0, limit);

      console.log(`✅ 신뢰도 랭킹 생성 완료: ${rankings.length}명`);
      return rankings;

    } catch (error) {
      console.error('신뢰도 랭킹 생성 실패:', error);
      return [];
    }
  }

  // 특정 회사의 내부자들 신뢰도 분석
  async analyzeCompanyInsiders(companyName: string): Promise<InsiderCredibilityProfile[]> {
    try {
      const allTrades = await storage.getInsiderTrades(1000, 0, false);
      const companyTrades = allTrades.filter(trade =>
        trade.companyName.toLowerCase().includes(companyName.toLowerCase())
      );

      const traderNames = [...new Set(companyTrades.map(t => t.traderName))];
      const profiles: InsiderCredibilityProfile[] = [];

      for (const traderName of traderNames) {
        const profile = await this.generateCredibilityProfile(traderName);
        if (profile) {
          profiles.push(profile);
        }
      }

      return profiles.sort((a, b) => b.credibilityScore - a.credibilityScore);

    } catch (error) {
      console.error(`회사 내부자 분석 실패 (${companyName}):`, error);
      return [];
    }
  }

  // 신뢰도 프로필 캐시에서 조회
  getCachedProfile(traderName: string): InsiderCredibilityProfile | null {
    return this.credibilityCache.get(traderName) || null;
  }

  // 신뢰도 통계
  getCredibilityStats(profiles: InsiderCredibilityProfile[]) {
    if (profiles.length === 0) return null;

    const avgScore = profiles.reduce((sum, p) => sum + p.credibilityScore, 0) / profiles.length;
    const highPerformers = profiles.filter(p => p.credibilityScore >= 80).length;
    const lowPerformers = profiles.filter(p => p.credibilityScore < 40).length;

    const avgSuccessRate = profiles.reduce((sum, p) => sum + p.performance.threeMonth.successRate, 0) / profiles.length;

    return {
      totalProfiles: profiles.length,
      averageScore: Math.round(avgScore),
      highPerformers,
      lowPerformers,
      averageSuccessRate: Math.round(avgSuccessRate),
      topPerformer: profiles[0]?.traderName || 'N/A',
      topScore: profiles[0]?.credibilityScore || 0
    };
  }
}

export const insiderCredibilityService = new InsiderCredibilityService();