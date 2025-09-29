import axios from 'axios';
import OpenAI from 'openai';
import { storage } from './storage';
import type { InsiderTrade } from '@shared/schema';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  publishedDate: string;
  source: string;
  url: string;
  ticker: string;
  companyName: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  categories: string[]; // ['earnings', 'merger', 'fda', 'legal', etc.]
  relevanceScore: number; // 0-100
}

interface CorrelationAnalysis {
  tradeId: string;
  ticker: string;
  companyName: string;
  traderName: string;
  tradeDate: string;
  tradeType: string;
  tradeValue: number;

  // 뉴스 상관관계
  relatedNews: NewsArticle[];
  correlationScore: number; // 0-100 (높을수록 강한 상관관계)

  // 뉴스 기반 분석
  newsAnalysis: {
    beforeTrade: NewsArticle[]; // 거래 전 뉴스
    afterTrade: NewsArticle[]; // 거래 후 뉴스
    anticipatedNews: NewsArticle[]; // 거래가 예견한 것으로 보이는 뉴스
    contradictoryNews: NewsArticle[]; // 거래와 반대되는 뉴스
  };

  // AI 종합 분석
  aiInsights: {
    summary: string;
    possibleMotivations: string[];
    marketImpact: string;
    suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyIndicators: string[];
  };

  // 통계적 지표
  metrics: {
    newsVolumeBeforeTrade: number;
    newsVolumeAfterTrade: number;
    sentimentShift: number; // -1 to 1 (negative to positive shift)
    marketReactionDays: number; // 뉴스 후 주가 반응 지속 일수
  };
}

class NewsCorrelationService {
  private openai: OpenAI | null = null;
  private newsApiKey: string | undefined;
  private newsCache: Map<string, NewsArticle[]> = new Map();

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    this.newsApiKey = process.env.NEWS_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
    if (!this.newsApiKey) {
      console.warn('⚠️ 뉴스 API 키가 설정되지 않음. 뉴스 수집이 제한됩니다.');
    }
  }

  // 특정 거래의 뉴스 상관관계 분석
  async analyzeNewsCorrelation(tradeId: string): Promise<CorrelationAnalysis | null> {
    try {
      const trade = await storage.getInsiderTradeById(tradeId);
      if (!trade || !trade.ticker) {
        console.error(`거래를 찾을 수 없거나 티커가 없습니다: ${tradeId}`);
        return null;
      }

      console.log(`📰 뉴스 상관관계 분석 시작: ${trade.ticker} - ${trade.traderName}`);

      // 관련 뉴스 수집
      const relatedNews = await this.collectRelatedNews(trade);

      // 뉴스 분류 및 분석
      const newsAnalysis = this.categorizeNewsByTiming(trade, relatedNews);

      // 상관관계 점수 계산
      const correlationScore = this.calculateCorrelationScore(trade, relatedNews);

      // AI 인사이트 생성
      let aiInsights = null;
      if (this.openai && relatedNews.length > 0) {
        aiInsights = await this.generateAIInsights(trade, relatedNews, newsAnalysis);
      }

      // 통계적 지표 계산
      const metrics = this.calculateNewsMetrics(trade, relatedNews);

      const result: CorrelationAnalysis = {
        tradeId: trade.id,
        ticker: trade.ticker,
        companyName: trade.companyName,
        traderName: trade.traderName,
        tradeDate: trade.filedDate.toISOString().split('T')[0],
        tradeType: trade.tradeType,
        tradeValue: Math.abs(trade.totalValue),

        relatedNews,
        correlationScore,
        newsAnalysis,

        aiInsights: aiInsights || {
          summary: 'AI 인사이트를 생성할 수 없습니다',
          possibleMotivations: [],
          marketImpact: '불명',
          suspicionLevel: 'LOW',
          keyIndicators: []
        },

        metrics
      };

      console.log(`✅ 뉴스 상관관계 분석 완료: ${trade.ticker} (상관관계 ${correlationScore}%)`);
      return result;

    } catch (error) {
      console.error('뉴스 상관관계 분석 실패:', error);
      return null;
    }
  }

  // 관련 뉴스 수집
  private async collectRelatedNews(trade: InsiderTrade): Promise<NewsArticle[]> {
    const ticker = trade.ticker!;
    const tradeDate = new Date(trade.filedDate);

    // 거래 전후 30일간의 뉴스 수집
    const startDate = new Date(tradeDate);
    startDate.setDate(startDate.getDate() - 30);

    const endDate = new Date(tradeDate);
    endDate.setDate(endDate.getDate() + 7);

    // 캐시 확인
    const cacheKey = `${ticker}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    if (this.newsCache.has(cacheKey)) {
      return this.newsCache.get(cacheKey)!;
    }

    const news: NewsArticle[] = [];

    try {
      // 여러 뉴스 소스에서 데이터 수집
      const newsFromAPIs = await Promise.all([
        this.fetchFromNewsAPI(ticker, trade.companyName, startDate, endDate),
        this.fetchFromAlphaVantageNews(ticker, startDate, endDate),
        this.fetchFromPolygonNews(ticker, startDate, endDate)
      ]);

      // 결과 병합 및 중복 제거
      const allNews = newsFromAPIs.flat();
      const uniqueNews = this.deduplicateNews(allNews);

      // 관련성 점수로 필터링 및 정렬
      const relevantNews = uniqueNews
        .filter(article => article.relevanceScore >= 30)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 50); // 최대 50개 뉴스

      // 캐시에 저장 (30분간)
      this.newsCache.set(cacheKey, relevantNews);
      setTimeout(() => this.newsCache.delete(cacheKey), 30 * 60 * 1000);

      return relevantNews;

    } catch (error) {
      console.error(`뉴스 수집 실패 for ${ticker}:`, error);
      return [];
    }
  }

  // NewsAPI에서 뉴스 수집
  private async fetchFromNewsAPI(ticker: string, companyName: string, startDate: Date, endDate: Date): Promise<NewsArticle[]> {
    if (!this.newsApiKey) return [];

    try {
      const query = `"${ticker}" OR "${companyName}"`;
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          sortBy: 'publishedAt',
          language: 'en',
          apiKey: this.newsApiKey
        },
        timeout: 10000
      });

      return response.data.articles.map((article: any) => this.normalizeNewsArticle(article, ticker, companyName, 'NewsAPI'));

    } catch (error) {
      console.error('NewsAPI 요청 실패:', error);
      return [];
    }
  }

  // Alpha Vantage News에서 뉴스 수집
  private async fetchFromAlphaVantageNews(ticker: string, startDate: Date, endDate: Date): Promise<NewsArticle[]> {
    if (!this.newsApiKey) return [];

    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: ticker,
          apikey: this.newsApiKey,
          limit: 50
        },
        timeout: 15000
      });

      if (response.data.feed) {
        return response.data.feed
          .filter((article: any) => {
            const publishDate = new Date(article.time_published);
            return publishDate >= startDate && publishDate <= endDate;
          })
          .map((article: any) => this.normalizeNewsArticle(article, ticker, '', 'AlphaVantage'));
      }

      return [];

    } catch (error) {
      console.error('Alpha Vantage News 요청 실패:', error);
      return [];
    }
  }

  // Polygon News에서 뉴스 수집 (예시)
  private async fetchFromPolygonNews(ticker: string, startDate: Date, endDate: Date): Promise<NewsArticle[]> {
    // Polygon API는 유료 서비스이므로 여기서는 예시만 제공
    return [];
  }

  // 뉴스 기사 정규화
  private normalizeNewsArticle(article: any, ticker: string, companyName: string, source: string): NewsArticle {
    const publishedDate = new Date(article.publishedAt || article.time_published || Date.now());

    // 제목과 내용에서 관련성 점수 계산
    const relevanceScore = this.calculateRelevanceScore(article, ticker, companyName);

    // 감정 분석 (간단한 키워드 기반)
    const sentiment = this.analyzeSentiment(article.title + ' ' + (article.description || article.summary || ''));

    // 카테고리 분류
    const categories = this.categorizeNews(article.title + ' ' + (article.description || article.summary || ''));

    return {
      id: this.generateNewsId(article, source),
      title: article.title || '제목 없음',
      summary: article.description || article.summary || '',
      publishedDate: publishedDate.toISOString(),
      source,
      url: article.url || article.article_url || '',
      ticker,
      companyName,
      sentiment,
      categories,
      relevanceScore
    };
  }

  // 뉴스 관련성 점수 계산
  private calculateRelevanceScore(article: any, ticker: string, companyName: string): number {
    const text = (article.title + ' ' + (article.description || article.summary || '')).toLowerCase();
    let score = 0;

    // 티커 언급
    if (text.includes(ticker.toLowerCase())) score += 40;

    // 회사명 언급
    if (companyName && text.includes(companyName.toLowerCase())) score += 30;

    // 중요 키워드들
    const importantKeywords = [
      'earnings', 'revenue', 'profit', 'loss', 'merger', 'acquisition',
      'fda', 'approval', 'trial', 'lawsuit', 'investigation', 'ceo',
      'cfo', 'executive', 'insider', 'trading', 'stock', 'shares'
    ];

    for (const keyword of importantKeywords) {
      if (text.includes(keyword)) score += 5;
    }

    // 부정적 키워드들 (높은 관련성)
    const negativeKeywords = ['scandal', 'fraud', 'violation', 'penalty', 'fine'];
    for (const keyword of negativeKeywords) {
      if (text.includes(keyword)) score += 15;
    }

    return Math.min(100, score);
  }

  // 감정 분석
  private analyzeSentiment(text: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const positiveWords = [
      'growth', 'profit', 'success', 'win', 'gain', 'increase', 'rise',
      'strong', 'beat', 'exceed', 'breakthrough', 'approval', 'partnership'
    ];

    const negativeWords = [
      'loss', 'decline', 'fall', 'drop', 'miss', 'fail', 'weak',
      'lawsuit', 'investigation', 'penalty', 'scandal', 'fraud', 'violation'
    ];

    const lowerText = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'POSITIVE';
    if (negativeCount > positiveCount) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  // 뉴스 카테고리 분류
  private categorizeNews(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryKeywords = {
      'earnings': ['earnings', 'revenue', 'profit', 'quarterly', 'financial results'],
      'merger': ['merger', 'acquisition', 'buyout', 'takeover'],
      'fda': ['fda', 'approval', 'clinical trial', 'drug', 'medical device'],
      'legal': ['lawsuit', 'litigation', 'investigation', 'sec', 'penalty'],
      'leadership': ['ceo', 'cfo', 'executive', 'management', 'board'],
      'partnership': ['partnership', 'collaboration', 'joint venture', 'agreement'],
      'product': ['launch', 'product', 'service', 'innovation', 'technology']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          categories.push(category);
          break;
        }
      }
    }

    return categories.length > 0 ? categories : ['general'];
  }

  // 뉴스를 거래 시점 기준으로 분류
  private categorizeNewsByTiming(trade: InsiderTrade, news: NewsArticle[]) {
    const tradeDate = new Date(trade.filedDate);

    const beforeTrade = news.filter(article => new Date(article.publishedDate) < tradeDate);
    const afterTrade = news.filter(article => new Date(article.publishedDate) >= tradeDate);

    // 거래가 예견한 것으로 보이는 뉴스 (거래 후 발생한 중요 뉴스)
    const anticipatedNews = afterTrade.filter(article => {
      const daysDiff = (new Date(article.publishedDate).getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 14 && article.relevanceScore >= 70;
    });

    // 거래와 반대되는 뉴스 (매수했는데 부정적 뉴스 등)
    const contradictoryNews = afterTrade.filter(article => {
      const isBuyTrade = trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE';
      const isNegativeNews = article.sentiment === 'NEGATIVE';
      const isPositiveNews = article.sentiment === 'POSITIVE';

      return (isBuyTrade && isNegativeNews) || (!isBuyTrade && isPositiveNews);
    });

    return {
      beforeTrade,
      afterTrade,
      anticipatedNews,
      contradictoryNews
    };
  }

  // 상관관계 점수 계산
  private calculateCorrelationScore(trade: InsiderTrade, news: NewsArticle[]): number {
    if (news.length === 0) return 0;

    let score = 0;
    const tradeDate = new Date(trade.filedDate);
    const tradeValue = Math.abs(trade.totalValue);

    // 거래 전 뉴스의 영향
    const preTradeNews = news.filter(article => new Date(article.publishedDate) < tradeDate);
    const relevantPreNews = preTradeNews.filter(article => article.relevanceScore >= 50);

    if (relevantPreNews.length > 0) {
      score += Math.min(30, relevantPreNews.length * 5);
    }

    // 거래 후 뉴스와의 일치성
    const postTradeNews = news.filter(article => {
      const newsDate = new Date(article.publishedDate);
      const daysDiff = (newsDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    });

    const isBuyTrade = trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE';
    const matchingNews = postTradeNews.filter(article => {
      return (isBuyTrade && article.sentiment === 'POSITIVE') ||
             (!isBuyTrade && article.sentiment === 'NEGATIVE');
    });

    if (matchingNews.length > 0) {
      score += Math.min(40, matchingNews.length * 8);
    }

    // 거래 규모에 따른 가중치
    if (tradeValue > 10000000) score += 15;
    else if (tradeValue > 5000000) score += 10;
    else if (tradeValue > 1000000) score += 5;

    // 고위 임원일 경우 가중치
    if (trade.traderTitle && (
      trade.traderTitle.includes('CEO') ||
      trade.traderTitle.includes('CFO') ||
      trade.traderTitle.includes('President')
    )) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  // AI 인사이트 생성
  private async generateAIInsights(trade: InsiderTrade, news: NewsArticle[], newsAnalysis: any): Promise<any> {
    if (!this.openai) return null;

    try {
      const prompt = this.buildNewsCorrelationPrompt(trade, news, newsAnalysis);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst specializing in insider trading analysis and market correlation. Provide objective analysis of the relationship between insider trades and news events."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        return this.parseAIInsightsResponse(response);
      }

      return null;

    } catch (error) {
      console.error('AI 인사이트 생성 실패:', error);
      return null;
    }
  }

  private buildNewsCorrelationPrompt(trade: InsiderTrade, news: NewsArticle[], newsAnalysis: any): string {
    const recentNews = news.slice(0, 10).map(article =>
      `${article.publishedDate}: ${article.title} (${article.sentiment})`
    ).join('\n');

    return `
내부자 거래와 뉴스의 상관관계를 분석해주세요:

거래 정보:
- 회사: ${trade.companyName} (${trade.ticker})
- 거래자: ${trade.traderName} (${trade.traderTitle || 'N/A'})
- 거래 타입: ${trade.tradeType}
- 거래 금액: $${Math.abs(trade.totalValue).toLocaleString()}
- 거래일: ${trade.filedDate.toISOString().split('T')[0]}

관련 뉴스 (최근 10건):
${recentNews}

거래 전 뉴스: ${newsAnalysis.beforeTrade.length}건
거래 후 뉴스: ${newsAnalysis.afterTrade.length}건
예견된 뉴스: ${newsAnalysis.anticipatedNews.length}건
상충 뉴스: ${newsAnalysis.contradictoryNews.length}건

다음 JSON 형식으로 분석해주세요:
{
  "summary": "전체 분석 요약 (한국어, 3-4문장)",
  "possibleMotivations": ["거래 동기 1", "거래 동기 2", "거래 동기 3"],
  "marketImpact": "시장 영향 분석 (한국어)",
  "suspicionLevel": "LOW|MEDIUM|HIGH",
  "keyIndicators": ["핵심 지표 1", "핵심 지표 2", "핵심 지표 3"]
}
`;
  }

  private parseAIInsightsResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        summary: response.substring(0, 300) + '...',
        possibleMotivations: ['AI 응답 파싱 실패'],
        marketImpact: '파싱 실패',
        suspicionLevel: 'MEDIUM',
        keyIndicators: ['응답 파싱 오류']
      };
    } catch (error) {
      console.error('AI 인사이트 파싱 실패:', error);
      return {
        summary: 'AI 인사이트를 파싱할 수 없습니다',
        possibleMotivations: [],
        marketImpact: '불명',
        suspicionLevel: 'LOW',
        keyIndicators: []
      };
    }
  }

  // 통계적 지표 계산
  private calculateNewsMetrics(trade: InsiderTrade, news: NewsArticle[]) {
    const tradeDate = new Date(trade.filedDate);

    const beforeNews = news.filter(article => new Date(article.publishedDate) < tradeDate);
    const afterNews = news.filter(article => new Date(article.publishedDate) >= tradeDate);

    // 감정 변화 계산
    const beforeSentiment = this.calculateAverageSentiment(beforeNews);
    const afterSentiment = this.calculateAverageSentiment(afterNews);
    const sentimentShift = afterSentiment - beforeSentiment;

    // 시장 반응 지속 일수 (뉴스 후 계속해서 관련 뉴스가 나오는 기간)
    let marketReactionDays = 0;
    if (afterNews.length > 0) {
      const lastNewsDate = new Date(Math.max(...afterNews.map(n => new Date(n.publishedDate).getTime())));
      marketReactionDays = Math.floor((lastNewsDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      newsVolumeBeforeTrade: beforeNews.length,
      newsVolumeAfterTrade: afterNews.length,
      sentimentShift: Math.round(sentimentShift * 100) / 100,
      marketReactionDays
    };
  }

  private calculateAverageSentiment(news: NewsArticle[]): number {
    if (news.length === 0) return 0;

    const sentimentValues = news.map(article => {
      switch (article.sentiment) {
        case 'POSITIVE': return 1;
        case 'NEGATIVE': return -1;
        default: return 0;
      }
    });

    return sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  }

  // 유틸리티 메소드들
  private deduplicateNews(news: NewsArticle[]): NewsArticle[] {
    const seen = new Set();
    return news.filter(article => {
      const key = article.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateNewsId(article: any, source: string): string {
    const title = article.title || '';
    const date = article.publishedAt || article.time_published || Date.now();
    return `${source}_${Buffer.from(title + date).toString('base64').substring(0, 16)}`;
  }

  // 일괄 뉴스 상관관계 분석
  async analyzeBulkNewsCorrelation(tradeIds: string[]): Promise<CorrelationAnalysis[]> {
    const results: CorrelationAnalysis[] = [];

    console.log(`📰 일괄 뉴스 상관관계 분석 시작: ${tradeIds.length}건`);

    for (const tradeId of tradeIds) {
      try {
        const result = await this.analyzeNewsCorrelation(tradeId);
        if (result) {
          results.push(result);
        }

        // API 제한을 피하기 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`거래 ${tradeId} 뉴스 분석 실패:`, error);
      }
    }

    console.log(`✅ 일괄 뉴스 상관관계 분석 완료: ${results.length}건 성공`);
    return results;
  }

  // 높은 상관관계 거래들만 필터링
  getHighCorrelationTrades(analysisResults: CorrelationAnalysis[]): CorrelationAnalysis[] {
    return analysisResults.filter(result => result.correlationScore >= 60);
  }
}

export const newsCorrelationService = new NewsCorrelationService();