// Modified for App Store compliance: removed all investment recommendation terminology
export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  insider: string;
  relation: string;
  type: 'Buy' | 'Sell';  // SEC filing transaction type (factual)
  shares: number;
  price: number;
  value: number;
  date: string;
  filingDate: string;
  priceChange: number;
  currentPrice: number;
  marketCap?: number;
  isVerified: boolean;
  secFilingUrl?: string;
  accessionNumber?: string;

  aiScore: number;  // Data quality score, NOT investment signal
  aiConfidence: number;  // Data reliability, NOT investment confidence
  aiRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';  // Legacy field - displays as Activity Type
  riskLevel: 'Low' | 'Medium' | 'High';  // Volatility level, NOT investment risk
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';  // Market sentiment from news, NOT recommendation
  summary: string;  // Factual observation only
  catalysts: string[];
  timeHorizon: string;

  newsAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
    summary: string;
  };
  newsItems: NewsItem[];

  targets: {  // Historical insider prices, NOT price predictions
    conservative: number;  // Min insider trade price
    realistic: number;     // Avg insider trade price
    optimistic: number;    // Max insider trade price
  };
}

export interface NewsItem {
  id: string;
  title: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  date: string;
}

export interface StockRecommendation {
  rank: number;
  ticker: string;
  companyName: string;
  sector?: string;  // 업종 정보 (Finnhub에서 캐싱)
  insiderCount: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceChange: number;
  totalBuyAmount: number;
  marketCap?: number;
  lastTradeDate: string;
  buyers: Array<{
    name: string;
    relation: string;
    price: number;
    shares: number;
    amount: number;
    date: string;
    priceChange: number;
    secFilingUrl?: string;
    accessionNumber?: string;
    isInstitution?: boolean;  // 기관투자자 여부 (LLC, LP, Fund 등)
  }>;
  // 🔒 CRITICAL: These fields enable cross-user AI analysis caching - DO NOT REMOVE
  // comprehensiveAnalysis: Pre-loaded from DB via ranking API, shared across all users
  // hasComprehensiveAnalysis: Indicates if cached analysis exists in DB
  // Removing these breaks the entire caching system and causes unnecessary API calls
  comprehensiveAnalysis?: any;
  hasComprehensiveAnalysis?: boolean;
}

export enum View {
  LIVE_TRADING = 'LIVE_TRADING',
  TOP_STOCKS = 'TOP_STOCKS',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  NOTIFICATIONS = 'NOTIFICATIONS'
}

export interface Filing {
  id: string;
  timestamp: string;
  company: string;
  filer: string;
  formType: string;
  ownership: string;
  summary: string;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  ma50?: number;
}

export interface InstitutionalHolding {
  institution: string;
  value: number;
  change: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export type Language = 'en' | 'ko' | 'ja' | 'zh';
