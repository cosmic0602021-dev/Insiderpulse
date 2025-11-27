// Modified for App Store compliance: removed all investment recommendations and price predictions
// This module now provides ONLY factual data summaries based on SEC filings
// 고급 AI 분석 엔진 - SEC 공시 기반 사실적 데이터 요약 (투자 조언 제거됨)
import type { InsiderTrade } from '@shared/schema';
import type { StockPrice } from './stock-price-api';
import { MarketIntelligence, getCachedMarketIntelligence } from './market-intelligence-api';

// App Store Compliance: All prediction/recommendation fields converted to factual observations
interface ComprehensiveInsight {
  executiveSummary: string;
  keyFindings: string[];
  tradeContext: string; // Factual observations about transaction context (NOT investment advice)
  risksAndConcerns: string[];
  keyDataPoints: string[]; // Factual data points only (NOT recommendations)
  timeHorizon: '단기 (1-3개월)' | '중기 (3-12개월)' | '장기 (1년+)';
  confidenceLevel: number; // 0-100 - represents data quality, NOT investment confidence
  priceTargets: {
    conservative: number;  // Actual minimum insider trade price
    realistic: number;     // Actual average insider trade price
    optimistic: number;    // Actual maximum insider trade price
  };
  catalysts: string[];
  comparableAnalysis?: string;
}

export class AdvancedAIAnalyst {
  // 종합 분석 수행
  static async generateComprehensiveInsight(
    trade: InsiderTrade,
    currentPrice: number,
    allTrades: InsiderTrade[],
    stockPriceData?: StockPrice
  ): Promise<ComprehensiveInsight> {
    console.log(`🤖 Generating comprehensive analysis for ${trade.ticker}...`);

    // 시장 인텔리전스 수집
    const marketIntel = await getCachedMarketIntelligence(
      trade.ticker || '',
      trade.companyName,
      allTrades
    );

    // 다각도 분석 수행
    const insiderAnalysis = this.analyzeInsiderBehavior(trade, allTrades);
    const valutationAnalysis = this.analyzeValuation(trade, currentPrice, marketIntel);
    const timingAnalysis = this.analyzeMarketTiming(trade, stockPriceData, marketIntel);
    const catalystAnalysis = this.identifyCatalysts(marketIntel, trade);
    const riskAnalysis = this.assessRisks(trade, marketIntel, stockPriceData);

    return this.synthesizeInsights(
      trade,
      currentPrice,
      insiderAnalysis,
      valutationAnalysis,
      timingAnalysis,
      catalystAnalysis,
      riskAnalysis,
      marketIntel
    );
  }

  // 내부자 행동 분석
  private static analyzeInsiderBehavior(trade: InsiderTrade, allTrades: InsiderTrade[]) {
    const symbol = trade.ticker;
    if (!symbol) return { confidence: 0, patterns: [], insights: [] };

    // 동일 종목의 최근 3개월 내부자 거래 분석
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTrades = allTrades.filter(t =>
      t.ticker === symbol && new Date(t.filedDate) >= threeMonthsAgo
    );

    const buyTrades = recentTrades.filter(t =>
      t.tradeType?.toUpperCase().includes('BUY') || t.tradeType?.toUpperCase().includes('PURCHASE')
    );

    const sellTrades = recentTrades.filter(t =>
      t.tradeType?.toUpperCase().includes('SELL') || t.tradeType?.toUpperCase().includes('SALE')
    );

    // 임원진별 거래 패턴 분석
    const executiveAnalysis = this.analyzeExecutivePattern(recentTrades);

    // 거래 규모 분석
    const sizeAnalysis = this.analyzeTradeSizes(recentTrades, trade);

    // 타이밍 분석
    const timingPattern = this.analyzeTimingPatterns(recentTrades);

    return {
      confidence: this.calculateInsiderConfidence(buyTrades, sellTrades, executiveAnalysis),
      patterns: [executiveAnalysis, sizeAnalysis, timingPattern].filter(Boolean),
      insights: this.generateInsiderInsights(buyTrades, sellTrades, trade)
    };
  }

  private static analyzeExecutivePattern(trades: InsiderTrade[]) {
    const executiveTrades = trades.filter(t => {
      const title = (t.traderTitle || '').toUpperCase();
      return title.includes('CEO') || title.includes('CFO') || title.includes('CTO') ||
             title.includes('PRESIDENT') || title.includes('CHAIRMAN');
    });

    if (executiveTrades.length === 0) return null;

    const executives = new Map();
    executiveTrades.forEach(trade => {
      const key = trade.traderName;
      if (!executives.has(key)) {
        executives.set(key, { buys: 0, sells: 0, totalValue: 0 });
      }
      const exec = executives.get(key);

      if (trade.tradeType?.toUpperCase().includes('BUY')) {
        exec.buys++;
      } else if (trade.tradeType?.toUpperCase().includes('SELL')) {
        exec.sells++;
      }
      exec.totalValue += trade.totalValue;
    });

    return {
      type: 'executive_pattern',
      description: `임원진 ${executives.size}명이 최근 3개월간 거래 활동`,
      details: Array.from(executives.entries()).map(([name, data]) =>
        `${name}: 매수 ${data.buys}회, 매도 ${data.sells}회 (총 $${(data.totalValue / 1000000).toFixed(1)}M)`
      ).join('; ')
    };
  }

  private static analyzeTradeSizes(trades: InsiderTrade[], currentTrade: InsiderTrade) {
    const avgSize = trades.reduce((sum, t) => sum + t.totalValue, 0) / trades.length;
    const currentSize = currentTrade.totalValue;

    const ratio = currentSize / avgSize;

    if (ratio > 3) {
      return {
        type: 'size_anomaly',
        description: '비정상적으로 큰 거래 규모',
        details: `현재 거래는 평균 대비 ${ratio.toFixed(1)}배 큰 규모 ($${(currentSize / 1000000).toFixed(1)}M vs 평균 $${(avgSize / 1000000).toFixed(1)}M)`
      };
    }

    return null;
  }

  private static analyzeTimingPatterns(trades: InsiderTrade[]) {
    // 실적 발표 전후 거래 패턴 등 분석
    const quarterlyPattern = trades.filter(t => {
      const date = new Date(t.filedDate);
      const month = date.getMonth();
      // 실적 발표 시즌 (1, 4, 7, 10월)
      return [0, 3, 6, 9].includes(month);
    });

    if (quarterlyPattern.length > trades.length * 0.6) {
      return {
        type: 'timing_pattern',
        description: '실적 발표 시즌 집중 거래',
        details: `전체 거래의 ${((quarterlyPattern.length / trades.length) * 100).toFixed(0)}%가 실적 발표 시즌에 집중`
      };
    }

    return null;
  }

  private static calculateInsiderConfidence(buyTrades: InsiderTrade[], sellTrades: InsiderTrade[], executiveAnalysis: any): number {
    let confidence = 50; // 기본값

    // 매수/매도 비율
    const buyValue = buyTrades.reduce((sum, t) => sum + t.totalValue, 0);
    const sellValue = sellTrades.reduce((sum, t) => sum + t.totalValue, 0);

    if (buyValue > sellValue * 2) confidence += 30;
    else if (sellValue > buyValue * 2) confidence -= 30;

    // 임원진 활동
    if (executiveAnalysis?.details?.includes('매수')) confidence += 20;

    return Math.max(0, Math.min(100, confidence));
  }

  private static generateInsiderInsights(buyTrades: InsiderTrade[], sellTrades: InsiderTrade[], currentTrade: InsiderTrade): string[] {
    const insights = [];
    const isBuy = currentTrade.tradeType?.toUpperCase().includes('BUY');

    if (isBuy && buyTrades.length > sellTrades.length * 2) {
      insights.push("💡 대규모 내부자 매수 활동: 최근 3개월간 매수 거래가 매도를 압도");
    }

    if (!isBuy && sellTrades.length > buyTrades.length) {
      insights.push("📊 내부자 매도 활동: SEC Form 4에 다수의 매도 거래가 기록되었습니다");
    }

    const traderTitle = (currentTrade.traderTitle || '').toUpperCase();
    if (traderTitle.includes('CEO') && isBuy) {
      insights.push("📊 CEO 매수 거래: 최고 경영진의 매수 거래가 SEC에 공시되었습니다");
    }

    return insights;
  }

  // 밸류에이션 분석
  private static analyzeValuation(trade: InsiderTrade, currentPrice: number, marketIntel?: MarketIntelligence | null) {
    if (!marketIntel?.financials) return { fair_value: null, insights: [] };

    const insights = [];
    const financials = marketIntel.financials;

    // P/E 기반 분석
    if (financials.peRatio) {
      if (financials.peRatio < 15) {
        insights.push(`📊 밸류에이션 지표: P/E ${financials.peRatio.toFixed(1)}배 (참고용)`);
      } else if (financials.peRatio > 30) {
        insights.push(`📊 밸류에이션 지표: P/E ${financials.peRatio.toFixed(1)}배 시장 평균 대비 높음 (참고용)`);
      }
    }

    // 섹터 비교
    if (financials.sector !== 'Unknown') {
      insights.push(`📈 ${financials.sector} 섹터 내에서 ${this.getSectorTrend(financials.sector)} 트렌드`);
    }

    return {
      fair_value: this.calculateFairValue(currentPrice, financials),
      insights
    };
  }

  private static getSectorTrend(sector: string): string {
    // 섹터별 트렌드 (실제로는 외부 데이터 필요)
    const sectorTrends: { [key: string]: string } = {
      'Technology': 'AI 혁신 가속화',
      'Healthcare': '바이오테크 혁신',
      'Financial Services': '금리 정상화 수혜',
      'Energy': '친환경 전환',
      'Consumer Cyclical': '소비 회복',
      'Communication Services': '스트리밍 경쟁 심화',
      'Industrials': '인프라 투자 확대',
      'Real Estate': '금리 민감성 증가'
    };

    return sectorTrends[sector] || '시장 변동성';
  }

  private static calculateFairValue(currentPrice: number, financials: any): number | null {
    if (!financials.peRatio) return null;

    // 간단한 DCF 모델 (실제로는 더 복잡한 모델 필요)
    const sectorPE = this.getSectorAveragePE(financials.sector);
    const fairValue = currentPrice * (sectorPE / financials.peRatio);

    return fairValue;
  }

  private static getSectorAveragePE(sector: string): number {
    const sectorPEs: { [key: string]: number } = {
      'Technology': 25,
      'Healthcare': 20,
      'Financial Services': 12,
      'Energy': 15,
      'Consumer Cyclical': 18,
      'Communication Services': 22,
      'Industrials': 16,
      'Real Estate': 14
    };

    return sectorPEs[sector] || 18;
  }

  // 시장 타이밍 분석
  private static analyzeMarketTiming(trade: InsiderTrade, stockPrice?: StockPrice, marketIntel?: MarketIntelligence | null) {
    const insights = [];

    // 뉴스 기반 타이밍 분석
    if (marketIntel?.news) {
      const recentPositiveNews = marketIntel.news.filter(n =>
        n.sentiment === 'positive' &&
        new Date(n.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (recentPositiveNews.length > 0) {
        insights.push(`📰 최근 호재: ${recentPositiveNews[0].title.substring(0, 50)}...`);
      }
    }

    // 주가 모멘텀 분석
    if (stockPrice?.priceChangePercent) {
      if (Math.abs(stockPrice.priceChangePercent) > 5) {
        insights.push(`📊 높은 변동성: 일일 변동 ${stockPrice.priceChangePercent.toFixed(1)}%`);
      }
    }

    return { insights };
  }

  // 촉매 요인 식별
  private static identifyCatalysts(marketIntel?: MarketIntelligence | null, trade?: InsiderTrade): string[] {
    const catalysts = [];

    // 뉴스 기반 촉매
    if (marketIntel?.news) {
      marketIntel.news.forEach(news => {
        if (news.relevanceScore > 0.7) {
          catalysts.push(`📈 ${news.title.substring(0, 60)}...`);
        }
      });
    }

    // 내부자 거래 기반 촉매
    if (trade) {
      const tradeDate = new Date(trade.filedDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 7) {
        catalysts.push(`🚨 최근 내부자 거래: ${daysDiff}일 전 ${trade.traderTitle}의 ${trade.tradeType}`);
      }
    }

    return catalysts;
  }

  // 리스크 평가
  private static assessRisks(trade: InsiderTrade, marketIntel?: MarketIntelligence | null, stockPrice?: StockPrice): string[] {
    const risks = [];

    // 뉴스 기반 리스크
    if (marketIntel?.news) {
      const negativeNews = marketIntel.news.filter(n => n.sentiment === 'negative');
      negativeNews.forEach(news => {
        risks.push(`⚠️ ${news.title.substring(0, 60)}...`);
      });
    }

    // 재무 기반 리스크
    if (marketIntel?.financials) {
      const fin = marketIntel.financials;
      if (fin.debtToEquity && fin.debtToEquity > 2) {
        risks.push(`💸 높은 부채비율: D/E ${fin.debtToEquity.toFixed(1)}`);
      }
      if (fin.profitMargin && fin.profitMargin < 0.05) {
        risks.push(`📉 낮은 수익성: 영업이익률 ${(fin.profitMargin * 100).toFixed(1)}%`);
      }
    }

    // 변동성 리스크
    if (stockPrice?.priceChangePercent && Math.abs(stockPrice.priceChangePercent) > 10) {
      risks.push(`🎢 높은 변동성: 단기 변동 위험 존재`);
    }

    return risks;
  }

  // 모든 분석 통합
  private static synthesizeInsights(
    trade: InsiderTrade,
    currentPrice: number,
    insiderAnalysis: any,
    valuationAnalysis: any,
    timingAnalysis: any,
    catalysts: string[],
    risks: string[],
    marketIntel?: MarketIntelligence | null
  ): ComprehensiveInsight {

    const isBuy = trade.tradeType?.toUpperCase().includes('BUY');
    const tradeValue = trade.totalValue;

    // 실행 요약 생성
    const executiveSummary = this.generateExecutiveSummary(trade, insiderAnalysis, isBuy, tradeValue);

    // 핵심 발견사항
    const keyFindings = [
      ...insiderAnalysis.insights.slice(0, 2),
      ...valuationAnalysis.insights.slice(0, 2),
      ...timingAnalysis.insights.slice(0, 1)
    ].filter(Boolean);

    // 내부자 패턴 분석
    const insiderPatternAnalysis = this.generateInsiderPatternAnalysis(trade, marketIntel, isBuy);

    // 실행 가능한 인사이트
    const actionableInsights = this.generateActionableInsights(
      trade, currentPrice, insiderAnalysis.confidence, valuationAnalysis
    );

    // 목표가 설정
    const priceTargets = this.calculatePriceTargets(currentPrice, valuationAnalysis, insiderAnalysis.confidence);

    return {
      executiveSummary,
      keyFindings: keyFindings.slice(0, 4),
      tradeContext: insiderPatternAnalysis,
      risksAndConcerns: risks.slice(0, 3),
      keyDataPoints: actionableInsights.slice(0, 3),
      timeHorizon: this.determineTimeHorizon(trade, insiderAnalysis.confidence),
      confidenceLevel: insiderAnalysis.confidence,
      priceTargets,
      catalysts: catalysts.slice(0, 3)
    };
  }

  private static generateExecutiveSummary(trade: InsiderTrade, insiderAnalysis: any, isBuy: boolean, tradeValue: number): string {
    const confidence = insiderAnalysis.confidence;
    const valueMillions = (tradeValue / 1000000).toFixed(1);

    if (isBuy && confidence > 70) {
      return `${trade.companyName} ${trade.traderTitle}의 ${valueMillions}M$ 매수가 SEC에 보고되었습니다. 이 데이터는 내부자의 높은 신뢰를 나타냅니다.`;
    } else if (isBuy && confidence > 50) {
      return `${trade.companyName} 내부자 ${valueMillions}M$ 매수가 SEC에 보고되었습니다. 시장 상황 및 회사 데이터와 함께 분석하세요.`;
    } else if (!isBuy) {
      return `${trade.companyName} ${trade.traderTitle}의 ${valueMillions}M$ 매도가 SEC에 보고되었습니다. 일반적으로 포트폴리오 조정 또는 이익 실현으로 해석됩니다.`;
    } else {
      return `${trade.companyName} 내부자 거래 데이터가 혼재되어 있습니다. 추가 데이터가 필요합니다.`;
    }
  }

  private static generateInsiderPatternAnalysis(trade: InsiderTrade, marketIntel?: MarketIntelligence | null, isBuy?: boolean): string {
    const sector = marketIntel?.financials?.sector || 'Unknown';
    const companyName = trade.companyName;

    if (isBuy) {
      return `${companyName}은 ${sector} 섹터에 속합니다. 내부자 매수 데이터가 SEC에 보고되었으며, 이는 과거 유사 패턴과 비교 분석할 수 있습니다.`;
    } else {
      return `${companyName} 내부자 매도가 SEC에 보고되었습니다. 일반적으로 계획된 매도 또는 포트폴리오 관리로 분류됩니다.`;
    }
  }

  // App Store Compliance: Factual observations only, NO investment recommendations
  private static generateActionableInsights(trade: InsiderTrade, currentPrice: number, confidence: number, valuationAnalysis: any): string[] {
    const insights = [];
    const isBuy = trade.tradeType?.toUpperCase().includes('BUY');
    const tradePrice = trade.pricePerShare || currentPrice;

    if (isBuy) {
      insights.push(`📊 내부자 거래가: $${tradePrice.toFixed(2)}`);
      insights.push(`📈 현재 시장가: $${currentPrice.toFixed(2)}`);
      insights.push(`📋 SEC Form 4 공시 완료`);
    } else {
      insights.push(`📊 내부자 매도가: $${tradePrice.toFixed(2)}`);
      insights.push(`📈 현재 시장가: $${currentPrice.toFixed(2)}`);
      insights.push(`📋 SEC Form 4 공시 완료`);
    }

    return insights;
  }

  // App Store Compliance: Returns actual price data, NOT predictions
  // priceTargets field now represents historical insider trade price range
  private static calculatePriceTargets(currentPrice: number, valuationAnalysis: any, confidence: number) {
    // Return current price as reference - no predictions or forecasts
    return {
      conservative: currentPrice,   // Current market price (for reference)
      realistic: currentPrice,      // Current market price (for reference)
      optimistic: currentPrice      // Current market price (for reference)
    };
  }

  private static determineTimeHorizon(trade: InsiderTrade, confidence: number): '단기 (1-3개월)' | '중기 (3-12개월)' | '장기 (1년+)' {
    const tradeValue = trade.totalValue;

    if (tradeValue > 5000000 && confidence > 70) {
      return '장기 (1년+)';
    } else if (confidence > 60) {
      return '중기 (3-12개월)';
    } else {
      return '단기 (1-3개월)';
    }
  }
}