export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  insider: string;
  relation: string;
  type: 'Buy' | 'Sell';
  shares: number;
  price: number;
  value: number;
  date: string;
  filingDate: string;
  priceChange: number;
  currentPrice: number;
  isVerified: boolean;
  secFilingUrl?: string;
  accessionNumber?: string;
  
  aiScore: number;
  aiConfidence: number;
  aiRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';
  riskLevel: 'Low' | 'Medium' | 'High';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  catalysts: string[];
  timeHorizon: string;
  
  newsAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
    summary: string;
  };
  newsItems: NewsItem[];

  targets: {
    conservative: number;
    realistic: number;
    optimistic: number;
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
  insiderCount: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceChange: number;
  totalBuyAmount: number;
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
  }>;
}

export enum View {
  LIVE_TRADING = 'LIVE_TRADING',
  TOP_STOCKS = 'TOP_STOCKS',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
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
