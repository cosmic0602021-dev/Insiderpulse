import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Target, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { resolveApiUrl } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';
import { ENV_CONFIG } from '@/lib/environment';

// 랭킹 데이터에서 성과 계산
interface RankingItem {
  ticker: string;
  companyName: string;
  lastTradeDate: string;
  currentPrice?: number;
  priceChangePercent?: number;
  insiders: Array<{
    pricePerShare: number;
    date: string;
  }>;
  enhancedTrade?: {
    currentPrice?: number;
    pricePerShare?: number;
  };
}

interface RankingsResponse {
  rankings: RankingItem[];
}

// Translations
const translations = {
  en: {
    title: 'Live Performance Tracker',
    subtitle: 'Returns from past stock recommendations',
    avgReturn: 'Avg Return',
    stocksUp: 'Winners',
    entry: 'Entry',
    current: 'Now',
    noData: 'Loading performance data...',
    updated: 'Live',
    recDate: "Rec'd",
  },
  ko: {
    title: '실시간 성과 추적',
    subtitle: '지난 추천 주식 현재 수익률',
    avgReturn: '평균 수익률',
    stocksUp: '상승 종목',
    entry: '진입',
    current: '현재',
    noData: '성과 데이터 로딩 중...',
    updated: '실시간',
    recDate: '추천일',
  },
  ja: {
    title: 'リアルタイム成績',
    subtitle: '過去の推奨銘柄のリターン',
    avgReturn: '平均リターン',
    stocksUp: '上昇銘柄',
    entry: 'エントリー',
    current: '現在',
    noData: 'パフォーマンスデータ読み込み中...',
    updated: 'ライブ',
    recDate: '推薦日',
  },
  zh: {
    title: '实时表现追踪',
    subtitle: '过去推荐股票的收益',
    avgReturn: '平均回报',
    stocksUp: '上涨股票',
    entry: '入场',
    current: '现价',
    noData: '正在加载表现数据...',
    updated: '实时',
    recDate: '推荐日',
  },
};

export function PastPerformanceSection({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [isExpanded, setIsExpanded] = useState(true);

  // 현재 랭킹 데이터에서 성과 계산
  const { data, isLoading } = useQuery<RankingsResponse>({
    queryKey: ['rankings', 'performance-live', language],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/rankings?limit=10&language=${language}`));
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // 성과 데이터 계산
  const performanceData = data?.rankings?.map(item => {
    const entryPrice = item.enhancedTrade?.pricePerShare || item.insiders?.[0]?.pricePerShare || 0;
    const currentPrice = item.currentPrice || item.enhancedTrade?.currentPrice || 0;
    const returnPercent = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
    const tradeDate = item.lastTradeDate || item.insiders?.[0]?.date;

    return {
      ticker: item.ticker,
      companyName: item.companyName,
      entryPrice,
      currentPrice,
      returnPercent,
      tradeDate,
    };
  }).filter(item => item.entryPrice > 0 && item.currentPrice > 0)
    .sort((a, b) => b.returnPercent - a.returnPercent) || [];

  // 요약 통계
  const avgReturn = performanceData.length > 0
    ? performanceData.reduce((sum, item) => sum + item.returnPercent, 0) / performanceData.length
    : 0;
  const winnersCount = performanceData.filter(item => item.returnPercent > 0).length;
  const totalCount = performanceData.length;

  // Loading
  if (isLoading) {
    return (
      <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-neutral-800 rounded w-48 mb-4" />
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-neutral-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!performanceData.length) {
    return null; // 데이터 없으면 숨김
  }

  // 접힌 상태
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full bg-gradient-to-r from-emerald-900/40 to-neutral-900/50 border border-emerald-700/30 rounded-lg p-3 flex items-center justify-between hover:from-emerald-800/50 transition-all ${className}`}
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">{t.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
          </span>
          <span className="text-xs text-neutral-400">
            {winnersCount}/{totalCount} {t.stocksUp}
          </span>
          <ChevronDown size={16} className="text-emerald-400" />
        </div>
      </button>
    );
  }

  // 펼친 상태
  return (
    <div className={`bg-gradient-to-b from-neutral-900/80 to-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full bg-gradient-to-r from-emerald-900/30 to-transparent p-3 flex items-center justify-between hover:from-emerald-800/40 transition-all"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-emerald-400" />
          <div className="text-left">
            <span className="text-sm font-bold text-white block">{t.title}</span>
            <span className="text-[10px] text-emerald-400/70">{t.subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {t.updated}
          </span>
          <ChevronUp size={16} className="text-neutral-400" />
        </div>
      </button>

      {/* Summary Stats */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-4 py-2 border-b border-neutral-800/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 uppercase">{t.avgReturn}</span>
            <span className={`text-lg font-bold ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 uppercase">{t.stocksUp}</span>
            <span className="text-lg font-bold text-white">{winnersCount}<span className="text-neutral-500 text-sm">/{totalCount}</span></span>
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="px-2 pb-2 space-y-1">
        {performanceData.slice(0, 10).map((stock, index) => (
          <StockRow key={stock.ticker} stock={stock} rank={index + 1} t={t} />
        ))}
      </div>
    </div>
  );
}

function StockRow({ stock, rank, t }: {
  stock: { ticker: string; companyName: string; entryPrice: number; currentPrice: number; returnPercent: number; tradeDate: string };
  rank: number;
  t: typeof translations.en;
}) {
  const isPositive = stock.returnPercent >= 0;
  const isTopThree = rank <= 3;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className={`flex items-center justify-between py-2 px-2 rounded-lg transition-colors ${
      isTopThree
        ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-l-2 border-amber-400'
        : 'bg-neutral-800/30 hover:bg-neutral-800/50'
    }`}>
      {/* Left: Rank + Ticker */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`text-xs w-5 font-bold ${isTopThree ? 'text-amber-400' : 'text-neutral-600'}`}>
          {rank}
        </span>
        <div className="min-w-0">
          <span className={`font-bold text-sm ${isTopThree ? 'text-amber-300' : 'text-white'}`}>
            {stock.ticker}
          </span>
          <span className="text-[10px] text-neutral-500 ml-2">{t.recDate} {formatDate(stock.tradeDate)}</span>
        </div>
      </div>

      {/* Center: Price Journey */}
      <div className="text-[11px] text-neutral-400 flex items-center gap-1">
        <span>${stock.entryPrice.toFixed(2)}</span>
        <span className="text-neutral-600">→</span>
        <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>${stock.currentPrice.toFixed(2)}</span>
      </div>

      {/* Right: Return */}
      <div className={`flex items-center gap-1 font-bold text-sm min-w-[70px] justify-end ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isPositive ? '+' : ''}{stock.returnPercent.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default PastPerformanceSection;
