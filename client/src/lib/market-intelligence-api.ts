// 시장 인텔리전스 API - 뉴스, 재무 데이터, 내부자 거래 패턴 분석
interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  url: string;
}

interface FinancialMetrics {
  marketCap: number;
  peRatio?: number;
  epsGrowth?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  debtToEquity?: number;
  sector: string;
  industry: string;
}

interface InsiderTradePattern {
  totalInsiderBuys30d: number;
  totalInsiderSells30d: number;
  netInsiderActivity: number;
  averageInsiderPosition: number;
  executiveConfidence: 'high' | 'medium' | 'low';
  unusualActivity: boolean;
  patternDescription: string;
}

interface MarketIntelligence {
  symbol: string;
  news: NewsArticle[];
  financials: FinancialMetrics;
  insiderPattern: InsiderTradePattern;
  analystRatings: {
    buyRating: number;
    holdRating: number;
    sellRating: number;
    averageTarget: number;
  };
  technicalIndicators: {
    rsi: number;
    movingAverage50: number;
    movingAverage200: number;
    volumeAverage: number;
    volatility: number;
  };
}

// 실제 뉴스 API 통합 (News API)
async function fetchCompanyNews(symbol: string, companyName: string): Promise<NewsArticle[]> {
  try {
    // News API 키가 있는 경우
    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    if (!apiKey) {
      return await fetchAlternativeNews(symbol, companyName);
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q="${companyName}" OR "${symbol}"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('News API request failed');
    }

    const data = await response.json();

    return data.articles?.slice(0, 5).map((article: any) => ({
      title: article.title,
      summary: article.description || article.content?.substring(0, 200) + '...',
      source: article.source.name,
      publishedAt: article.publishedAt,
      sentiment: analyzeSentiment(article.title + ' ' + article.description),
      relevanceScore: calculateRelevance(article, symbol, companyName),
      url: article.url
    })) || [];

  } catch (error) {
    console.warn('News API failed, trying alternative:', error);
    return await fetchAlternativeNews(symbol, companyName);
  }
}

// 대체 뉴스 소스 (Yahoo Finance RSS)
async function fetchAlternativeNews(symbol: string, companyName: string): Promise<NewsArticle[]> {
  try {
    // Yahoo Finance RSS를 통한 뉴스 조회
    const response = await fetch(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`);

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = xml.querySelectorAll('item');

    return Array.from(items).slice(0, 5).map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';

      return {
        title,
        summary: description.substring(0, 200) + '...',
        source: 'Yahoo Finance',
        publishedAt: pubDate,
        sentiment: analyzeSentiment(title + ' ' + description),
        relevanceScore: calculateRelevance({ title, description }, symbol, companyName),
        url: link
      };
    });
  } catch (error) {
    console.warn('Alternative news fetch failed:', error);
    return [];
  }
}

// 감정 분석 (간단한 키워드 기반)
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = [
    'growth', 'profit', 'revenue', 'beat', 'exceed', 'strong', 'bullish', 'upgrade',
    'buy', 'outperform', 'success', 'gain', 'rise', 'surge', 'boom', 'record',
    'breakthrough', 'innovation', 'expansion', 'acquisition', 'partnership'
  ];

  const negativeWords = [
    'loss', 'decline', 'fall', 'drop', 'weak', 'bearish', 'downgrade', 'sell',
    'underperform', 'struggle', 'challenge', 'risk', 'concern', 'warning',
    'layoff', 'cut', 'reduce', 'scandal', 'investigation', 'lawsuit', 'debt'
  ];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// 관련성 점수 계산
function calculateRelevance(article: any, symbol: string, companyName: string): number {
  const text = (article.title + ' ' + article.description || article.summary).toLowerCase();
  let score = 0;

  // 심볼 언급
  if (text.includes(symbol.toLowerCase())) score += 0.5;

  // 회사명 언급
  if (text.includes(companyName.toLowerCase())) score += 0.3;

  // 재무 관련 키워드
  const financialKeywords = ['earnings', 'revenue', 'profit', 'quarterly', 'fiscal', 'financial'];
  financialKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 0.1;
  });

  return Math.min(score, 1.0);
}

// 재무 데이터 조회 (Alpha Vantage)
async function fetchFinancialData(symbol: string): Promise<FinancialMetrics | null> {
  try {
    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return await fetchYahooFinancials(symbol);
    }

    const [overviewResponse, earningsResponse] = await Promise.all([
      fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${apiKey}`)
    ]);

    if (!overviewResponse.ok || !earningsResponse.ok) {
      throw new Error('Alpha Vantage API error');
    }

    const overview = await overviewResponse.json();
    const earnings = await earningsResponse.json();

    return {
      marketCap: parseFloat(overview.MarketCapitalization) || 0,
      peRatio: parseFloat(overview.PERatio) || undefined,
      epsGrowth: parseFloat(overview.QuarterlyEarningsGrowthYOY) || undefined,
      revenueGrowth: parseFloat(overview.QuarterlyRevenueGrowthYOY) || undefined,
      profitMargin: parseFloat(overview.ProfitMargin) || undefined,
      debtToEquity: parseFloat(overview.DebtToEquityRatio) || undefined,
      sector: overview.Sector || 'Unknown',
      industry: overview.Industry || 'Unknown'
    };
  } catch (error) {
    console.warn('Alpha Vantage financials failed:', error);
    return await fetchYahooFinancials(symbol);
  }
}

// Yahoo Finance 재무 데이터 (백업)
async function fetchYahooFinancials(symbol: string): Promise<FinancialMetrics | null> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,financialData,defaultKeyStatistics`);

    if (!response.ok) {
      throw new Error('Yahoo Finance API error');
    }

    const data = await response.json();
    const result = data.quoteSummary?.result?.[0];

    if (!result) return null;

    const summaryDetail = result.summaryDetail || {};
    const financialData = result.financialData || {};
    const keyStatistics = result.defaultKeyStatistics || {};

    return {
      marketCap: summaryDetail.marketCap?.raw || 0,
      peRatio: summaryDetail.trailingPE?.raw,
      epsGrowth: keyStatistics.earningsQuarterlyGrowth?.raw,
      revenueGrowth: financialData.revenueGrowth?.raw,
      profitMargin: financialData.profitMargins?.raw,
      debtToEquity: financialData.debtToEquity?.raw,
      sector: summaryDetail.sector || 'Unknown',
      industry: summaryDetail.industry || 'Unknown'
    };
  } catch (error) {
    console.warn('Yahoo Finance financials failed:', error);
    return null;
  }
}

// 내부자 거래 패턴 분석
function analyzeInsiderTradePattern(trades: any[], symbol: string): InsiderTradePattern {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTrades = trades.filter(trade =>
    trade.ticker === symbol && new Date(trade.filedDate) >= thirtyDaysAgo
  );

  const buys = recentTrades.filter(trade =>
    trade.tradeType?.toUpperCase().includes('BUY') || trade.tradeType?.toUpperCase().includes('PURCHASE')
  );

  const sells = recentTrades.filter(trade =>
    trade.tradeType?.toUpperCase().includes('SELL') || trade.tradeType?.toUpperCase().includes('SALE')
  );

  const totalBuyValue = buys.reduce((sum, trade) => sum + trade.totalValue, 0);
  const totalSellValue = sells.reduce((sum, trade) => sum + trade.totalValue, 0);
  const netActivity = totalBuyValue - totalSellValue;

  // 임원진 거래 분석
  const executiveTrades = recentTrades.filter(trade => {
    const title = (trade.traderTitle || '').toUpperCase();
    return title.includes('CEO') || title.includes('CFO') || title.includes('CTO') ||
           title.includes('PRESIDENT') || title.includes('CHAIRMAN');
  });

  const executiveBuys = executiveTrades.filter(trade =>
    trade.tradeType?.toUpperCase().includes('BUY') || trade.tradeType?.toUpperCase().includes('PURCHASE')
  ).length;

  const executiveSells = executiveTrades.filter(trade =>
    trade.tradeType?.toUpperCase().includes('SELL') || trade.tradeType?.toUpperCase().includes('SALE')
  ).length;

  let executiveConfidence: 'high' | 'medium' | 'low' = 'medium';
  if (executiveBuys > executiveSells * 2) executiveConfidence = 'high';
  else if (executiveSells > executiveBuys * 2) executiveConfidence = 'low';

  // 비정상적 활동 감지
  const avgTradeSize = recentTrades.reduce((sum, trade) => sum + trade.totalValue, 0) / recentTrades.length;
  const unusualActivity = recentTrades.some(trade => trade.totalValue > avgTradeSize * 5);

  return {
    totalInsiderBuys30d: buys.length,
    totalInsiderSells30d: sells.length,
    netInsiderActivity: netActivity,
    averageInsiderPosition: avgTradeSize || 0,
    executiveConfidence,
    unusualActivity,
    patternDescription: generatePatternDescription(buys.length, sells.length, netActivity, executiveConfidence)
  };
}

function generatePatternDescription(buys: number, sells: number, netActivity: number, confidence: string): string {
  if (buys > sells * 2) {
    return `강한 매수 신호: 지난 30일간 ${buys}건의 매수 vs ${sells}건의 매도. 임원진 신뢰도 ${confidence}`;
  } else if (sells > buys * 2) {
    return `매도 신호 주의: 지난 30일간 ${sells}건의 매도 vs ${buys}건의 매수. 내부자들의 이익실현 가능성`;
  } else {
    return `중립적 패턴: 매수 ${buys}건, 매도 ${sells}건으로 균형잡힌 거래 활동`;
  }
}

// 종합 시장 인텔리전스 수집
export async function getMarketIntelligence(symbol: string, companyName: string, allTrades: any[]): Promise<MarketIntelligence | null> {
  try {
    console.log(`🔍 Gathering market intelligence for ${symbol}...`);

    const [news, financials] = await Promise.all([
      fetchCompanyNews(symbol, companyName),
      fetchFinancialData(symbol)
    ]);

    const insiderPattern = analyzeInsiderTradePattern(allTrades, symbol);

    return {
      symbol,
      news: news.slice(0, 3), // 최신 3개 뉴스만
      financials: financials || {
        marketCap: 0,
        sector: 'Unknown',
        industry: 'Unknown'
      },
      insiderPattern,
      analystRatings: {
        buyRating: 0,
        holdRating: 0,
        sellRating: 0,
        averageTarget: 0
      },
      technicalIndicators: {
        rsi: 50,
        movingAverage50: 0,
        movingAverage200: 0,
        volumeAverage: 0,
        volatility: 0
      }
    };
  } catch (error) {
    console.error(`Failed to gather market intelligence for ${symbol}:`, error);
    return null;
  }
}

// 캐시 시스템
class MarketIntelligenceCache {
  private cache = new Map<string, { data: MarketIntelligence; timestamp: number }>();
  private readonly TTL = 15 * 60 * 1000; // 15분

  get(symbol: string): MarketIntelligence | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  set(symbol: string, data: MarketIntelligence): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const intelligenceCache = new MarketIntelligenceCache();

export async function getCachedMarketIntelligence(symbol: string, companyName: string, allTrades: any[]): Promise<MarketIntelligence | null> {
  // 캐시에서 먼저 확인
  const cached = intelligenceCache.get(symbol);
  if (cached) {
    return cached;
  }

  // 새로운 데이터 수집
  const intelligence = await getMarketIntelligence(symbol, companyName, allTrades);
  if (intelligence) {
    intelligenceCache.set(symbol, intelligence);
  }

  return intelligence;
}