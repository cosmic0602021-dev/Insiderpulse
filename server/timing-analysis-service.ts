import OpenAI from 'openai';
import axios from 'axios';
import { storage } from './storage';
import type { InsiderTrade } from '@shared/schema';

interface TimingEvent {
  date: string;
  type: 'earnings' | 'news' | 'announcement' | 'fda' | 'merger' | 'dividend' | 'split';
  title: string;
  description: string;
  source: string;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TimingAnalysisResult {
  tradeId: string;
  ticker: string;
  companyName: string;
  traderName: string;
  tradeDate: string;
  tradeType: string;
  tradeValue: number;

  // 타이밍 분석 결과
  suspiciousTiming: boolean;
  suspicionScore: number; // 0-100 (100이 가장 의심스러운)
  correlatedEvents: TimingEvent[];

  // AI 분석
  aiAnalysis: {
    summary: string;
    keyFindings: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: string;
    confidenceLevel: number; // 0-100
  };

  // 시간 관계 분석
  timelineAnalysis: {
    daysBeforeEarnings?: number;
    daysBeforeNews?: number;
    daysAfterNews?: number;
    pattern: string;
  };
}

class TimingAnalysisService {
  private openai: OpenAI | null = null;
  private newsApiKey: string | undefined;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('⚠️ OpenAI API key not found. AI timing analysis will be disabled.');
    }

    // 뉴스 API (AlphaVantage, NewsAPI 등 사용 가능)
    this.newsApiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.NEWS_API_KEY;
  }

  // 특정 거래의 타이밍 분석
  async analyzeTradeTimimg(tradeId: string): Promise<TimingAnalysisResult | null> {
    try {
      const trade = await storage.getInsiderTradeById(tradeId);
      if (!trade) {
        console.error(`거래를 찾을 수 없습니다: ${tradeId}`);
        return null;
      }

      console.log(`🕒 타이밍 분석 시작: ${trade.ticker} - ${trade.traderName}`);

      // 거래 전후 이벤트 수집
      const events = await this.collectRelevantEvents(trade);

      // 타이밍 의심도 계산
      const suspicionAnalysis = this.calculateSuspicionScore(trade, events);

      // AI 분석 (선택적)
      let aiAnalysis = null;
      if (this.openai) {
        aiAnalysis = await this.performAITimingAnalysis(trade, events);
      }

      const result: TimingAnalysisResult = {
        tradeId: trade.id,
        ticker: trade.ticker || 'N/A',
        companyName: trade.companyName,
        traderName: trade.traderName,
        tradeDate: trade.filedDate.toISOString().split('T')[0],
        tradeType: trade.tradeType,
        tradeValue: Math.abs(trade.totalValue),

        suspiciousTiming: suspicionAnalysis.isSuspicious,
        suspicionScore: suspicionAnalysis.score,
        correlatedEvents: events,

        aiAnalysis: aiAnalysis || {
          summary: 'AI 분석을 사용할 수 없습니다',
          keyFindings: [],
          riskLevel: 'LOW',
          recommendation: '수동 검토 필요',
          confidenceLevel: 0
        },

        timelineAnalysis: this.analyzeTimeline(trade, events)
      };

      console.log(`✅ 타이밍 분석 완료: ${trade.ticker} (의심도 ${suspicionAnalysis.score}%)`);
      return result;

    } catch (error) {
      console.error('타이밍 분석 실패:', error);
      return null;
    }
  }

  // 관련 이벤트 수집 (뉴스, 어닝, 공지사항 등)
  private async collectRelevantEvents(trade: InsiderTrade): Promise<TimingEvent[]> {
    const events: TimingEvent[] = [];
    const tradeDate = new Date(trade.filedDate);
    const ticker = trade.ticker;

    if (!ticker) return events;

    try {
      // 거래 전후 30일간의 이벤트 수집
      const startDate = new Date(tradeDate);
      startDate.setDate(startDate.getDate() - 30);

      const endDate = new Date(tradeDate);
      endDate.setDate(endDate.getDate() + 7); // 거래 후 7일까지

      // 1. 어닝 발표 일정 (간소화된 예시 - 실제로는 외부 API 사용)
      const earningsEvents = await this.getEarningsEvents(ticker, startDate, endDate);
      events.push(...earningsEvents);

      // 2. 주요 뉴스 이벤트
      const newsEvents = await this.getNewsEvents(ticker, trade.companyName, startDate, endDate);
      events.push(...newsEvents);

      // 3. SEC 공시 이벤트
      const secEvents = await this.getSECEvents(ticker, startDate, endDate);
      events.push(...secEvents);

    } catch (error) {
      console.error(`이벤트 수집 실패 for ${ticker}:`, error);
    }

    // 거래 날짜 기준 정렬
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 어닝 이벤트 수집 (예시 구현)
  private async getEarningsEvents(ticker: string, startDate: Date, endDate: Date): Promise<TimingEvent[]> {
    const events: TimingEvent[] = [];

    try {
      // 실제 환경에서는 Alpha Vantage, Polygon, 또는 다른 금융 API 사용
      // 여기서는 간단한 예시로 분기 말을 어닝 시즌으로 가정
      const year = startDate.getFullYear();
      const earningsDates = [
        new Date(year, 0, 15), // Q4 earnings (1월 중순)
        new Date(year, 3, 15), // Q1 earnings (4월 중순)
        new Date(year, 6, 15), // Q2 earnings (7월 중순)
        new Date(year, 9, 15), // Q3 earnings (10월 중순)
      ];

      for (const earningsDate of earningsDates) {
        if (earningsDate >= startDate && earningsDate <= endDate) {
          events.push({
            date: earningsDate.toISOString().split('T')[0],
            type: 'earnings',
            title: `${ticker} 분기 실적 발표`,
            description: `${ticker}의 분기 실적 발표 예정일`,
            source: 'earnings_calendar',
            significance: 'HIGH'
          });
        }
      }

    } catch (error) {
      console.error(`어닝 이벤트 수집 실패 for ${ticker}:`, error);
    }

    return events;
  }

  // 뉴스 이벤트 수집
  private async getNewsEvents(ticker: string, companyName: string, startDate: Date, endDate: Date): Promise<TimingEvent[]> {
    const events: TimingEvent[] = [];

    try {
      // 주요 뉴스 키워드들
      const significantKeywords = [
        'FDA approval', 'merger', 'acquisition', 'partnership',
        'lawsuit', 'investigation', 'recall', 'breakthrough',
        'contract', 'deal', 'expansion', 'restructuring'
      ];

      // 실제로는 NewsAPI, Alpha Vantage News, 또는 다른 뉴스 API 사용
      // 여기서는 시뮬레이션된 이벤트 생성 (실제 구현시 제거)
      const mockNews = await this.getMockNewsEvents(ticker, companyName, startDate, endDate);
      events.push(...mockNews);

    } catch (error) {
      console.error(`뉴스 이벤트 수집 실패 for ${ticker}:`, error);
    }

    return events;
  }

  // SEC 공시 이벤트 수집
  private async getSECEvents(ticker: string, startDate: Date, endDate: Date): Promise<TimingEvent[]> {
    const events: TimingEvent[] = [];

    try {
      // SEC API를 사용하여 8-K, 10-K, 10-Q 등의 공시 정보 수집
      // 실제 구현에서는 SEC EDGAR API 사용

      // 예시: 주요 공시 타입들
      const importantFilings = ['8-K', '10-K', '10-Q', 'DEF 14A'];

      // 여기서는 간단한 예시 구현
      // 실제로는 SEC EDGAR API를 호출해야 함

    } catch (error) {
      console.error(`SEC 이벤트 수집 실패 for ${ticker}:`, error);
    }

    return events;
  }

  // 의심도 점수 계산
  private calculateSuspicionScore(trade: InsiderTrade, events: TimingEvent[]): { isSuspicious: boolean, score: number } {
    let score = 0;
    const tradeDate = new Date(trade.filedDate);
    const tradeValue = Math.abs(trade.totalValue);

    // 거래 금액이 클수록 의심도 증가
    if (tradeValue > 10000000) score += 30; // $10M 이상
    else if (tradeValue > 5000000) score += 20; // $5M 이상
    else if (tradeValue > 1000000) score += 10; // $1M 이상

    // 이벤트와의 시간적 근접성 검사
    for (const event of events) {
      const eventDate = new Date(event.date);
      const daysDiff = Math.abs((tradeDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

      // 거래가 이벤트 이전에 발생한 경우 (내부 정보 의심)
      if (tradeDate < eventDate && daysDiff <= 30) {
        let eventScore = 0;

        // 이벤트 타입별 가중치
        switch (event.type) {
          case 'earnings': eventScore = 25; break;
          case 'fda': eventScore = 30; break;
          case 'merger': eventScore = 35; break;
          case 'announcement': eventScore = 20; break;
          case 'news': eventScore = 15; break;
          default: eventScore = 10;
        }

        // 시간적 근접성에 따른 가중치 (가까울수록 의심스러움)
        if (daysDiff <= 3) eventScore *= 2.0;
        else if (daysDiff <= 7) eventScore *= 1.5;
        else if (daysDiff <= 14) eventScore *= 1.2;

        // 이벤트 중요도에 따른 가중치
        if (event.significance === 'HIGH') eventScore *= 1.5;
        else if (event.significance === 'MEDIUM') eventScore *= 1.2;

        score += eventScore;
      }
    }

    // 매도의 경우 추가 의심도 (악재 이전 매도)
    if (trade.tradeType === 'SELL' || trade.tradeType === 'DISPOSITION') {
      score += 10;
    }

    // 경영진급 인사일 경우 추가 의심도
    if (trade.traderTitle && (
      trade.traderTitle.includes('CEO') ||
      trade.traderTitle.includes('CFO') ||
      trade.traderTitle.includes('President') ||
      trade.traderTitle.includes('Director')
    )) {
      score += 15;
    }

    // 점수 정규화 (0-100)
    score = Math.min(100, Math.max(0, score));

    return {
      isSuspicious: score >= 60, // 60점 이상이면 의심스러운 것으로 판단
      score: Math.round(score)
    };
  }

  // AI 타이밍 분석
  private async performAITimingAnalysis(trade: InsiderTrade, events: TimingEvent[]): Promise<any> {
    if (!this.openai) {
      return null;
    }

    try {
      const prompt = this.buildTimingAnalysisPrompt(trade, events);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a financial compliance expert analyzing insider trading patterns. Provide objective analysis of trading timing in relation to corporate events."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('AI 응답을 받지 못했습니다');
      }

      // AI 응답 파싱
      return this.parseAITimingResponse(response);

    } catch (error) {
      console.error('AI 타이밍 분석 실패:', error);
      return null;
    }
  }

  private buildTimingAnalysisPrompt(trade: InsiderTrade, events: TimingEvent[]): string {
    const tradeInfo = `
거래 정보:
- 회사: ${trade.companyName} (${trade.ticker})
- 거래자: ${trade.traderName} (${trade.traderTitle || 'N/A'})
- 거래 타입: ${trade.tradeType}
- 거래 금액: $${Math.abs(trade.totalValue).toLocaleString()}
- 거래일: ${trade.filedDate.toISOString().split('T')[0]}

관련 이벤트:
${events.map(event => `- ${event.date}: ${event.type.toUpperCase()} - ${event.title}`).join('\n')}
`;

    return `
다음 내부자 거래의 타이밍을 분석해주세요:

${tradeInfo}

분석해야 할 사항:
1. 거래 타이밍이 의심스러운지 (관련 이벤트 이전에 거래했는지)
2. 잠재적인 내부 정보 사용 가능성
3. 전체적인 위험도 평가

다음 JSON 형식으로 응답해주세요:
{
  "summary": "분석 요약 (한국어, 2-3문장)",
  "keyFindings": ["주요 발견사항 1", "주요 발견사항 2", "주요 발견사항 3"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendation": "권장사항 (한국어)",
  "confidenceLevel": 85
}
`;
  }

  private parseAITimingResponse(response: string): any {
    try {
      // JSON 응답 추출
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // JSON이 없으면 기본 응답 반환
      return {
        summary: response.substring(0, 200) + '...',
        keyFindings: ['AI 분석 파싱 실패'],
        riskLevel: 'MEDIUM',
        recommendation: '수동 검토 필요',
        confidenceLevel: 50
      };
    } catch (error) {
      console.error('AI 응답 파싱 실패:', error);
      return {
        summary: 'AI 응답을 파싱할 수 없습니다',
        keyFindings: ['파싱 오류 발생'],
        riskLevel: 'LOW',
        recommendation: '다시 시도 필요',
        confidenceLevel: 0
      };
    }
  }

  // 타임라인 분석
  private analyzeTimeline(trade: InsiderTrade, events: TimingEvent[]): any {
    const tradeDate = new Date(trade.filedDate);
    let daysBeforeEarnings: number | undefined;
    let daysBeforeNews: number | undefined;
    let daysAfterNews: number | undefined;

    // 어닝 발표 전 거래 여부
    const earningsEvent = events.find(e => e.type === 'earnings' && new Date(e.date) > tradeDate);
    if (earningsEvent) {
      daysBeforeEarnings = Math.floor((new Date(earningsEvent.date).getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // 주요 뉴스 전후 거래 여부
    const significantNews = events.filter(e => e.significance === 'HIGH');
    for (const news of significantNews) {
      const newsDate = new Date(news.date);
      const daysDiff = Math.floor((newsDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0 && (!daysBeforeNews || daysDiff < daysBeforeNews)) {
        daysBeforeNews = daysDiff;
      } else if (daysDiff < 0 && (!daysAfterNews || Math.abs(daysDiff) < daysAfterNews)) {
        daysAfterNews = Math.abs(daysDiff);
      }
    }

    // 패턴 분석
    let pattern = '일반적인 거래';

    if (daysBeforeEarnings && daysBeforeEarnings <= 7) {
      pattern = '어닝 발표 직전 거래';
    } else if (daysBeforeNews && daysBeforeNews <= 3) {
      pattern = '중요 뉴스 직전 거래';
    } else if (daysAfterNews && daysAfterNews <= 1) {
      pattern = '중요 뉴스 직후 거래';
    }

    return {
      daysBeforeEarnings,
      daysBeforeNews,
      daysAfterNews,
      pattern
    };
  }

  // 목업 뉴스 이벤트 (실제 환경에서는 제거)
  private async getMockNewsEvents(ticker: string, companyName: string, startDate: Date, endDate: Date): Promise<TimingEvent[]> {
    // 이 메소드는 실제 뉴스 API가 없을 때의 시뮬레이션용입니다.
    // 실제 환경에서는 NewsAPI, Alpha Vantage News 등을 사용해야 합니다.
    return [];
  }

  // 여러 거래의 일괄 타이밍 분석
  async analyzeBulkTradesTiming(tradeIds: string[]): Promise<TimingAnalysisResult[]> {
    const results: TimingAnalysisResult[] = [];

    console.log(`🕒 일괄 타이밍 분석 시작: ${tradeIds.length}건`);

    for (const tradeId of tradeIds) {
      try {
        const result = await this.analyzeTradeTimimg(tradeId);
        if (result) {
          results.push(result);
        }

        // API 제한을 피하기 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`거래 ${tradeId} 타이밍 분석 실패:`, error);
      }
    }

    console.log(`✅ 일괄 타이밍 분석 완료: ${results.length}건 성공`);
    return results;
  }

  // 의심스러운 거래들만 필터링
  getSuspiciousTrades(analysisResults: TimingAnalysisResult[]): TimingAnalysisResult[] {
    return analysisResults.filter(result => result.suspiciousTiming);
  }

  // 타이밍 분석 통계
  getTimingAnalysisStats(analysisResults: TimingAnalysisResult[]) {
    const total = analysisResults.length;
    const suspicious = analysisResults.filter(r => r.suspiciousTiming).length;
    const highRisk = analysisResults.filter(r => r.aiAnalysis.riskLevel === 'HIGH').length;

    const avgSuspicionScore = analysisResults.reduce((sum, r) => sum + r.suspicionScore, 0) / total;

    const patternCounts = analysisResults.reduce((acc, r) => {
      const pattern = r.timelineAnalysis.pattern;
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      suspicious,
      highRisk,
      suspiciousPercentage: Math.round((suspicious / total) * 100),
      avgSuspicionScore: Math.round(avgSuspicionScore),
      patternCounts
    };
  }
}

export const timingAnalysisService = new TimingAnalysisService();