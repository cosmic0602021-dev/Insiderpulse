import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, DollarSign, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { resolveApiUrl } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';

interface StockPerformance {
  rank: number;
  ticker: string;
  companyName: string;
  entryPrice: number;
  exitPrice: number;
  returnPercent: number;
  returnDollar: number;
  hadInsiderSell: boolean;
  sellDate?: string;
  sellIndicator?: string;
}

interface PerformanceSummary {
  avgReturn: number;
  winRate: number;
  winnersCount: number;
  losersCount: number;
  hypotheticalGain: number;
}

interface HistoricalPerformanceResponse {
  period: {
    monthsAgo: number;
    snapshotDate: string;
    evaluationDate: string;
  };
  summary: PerformanceSummary;
  stocks: StockPerformance[];
  dataAvailable: boolean;
  message?: string;
}

// Translations
const translations = {
  en: {
    title: 'Past Recommendation Performance',
    oneMonth: '1 Month Ago',
    threeMonths: '3 Months Ago',
    avgReturn: 'Avg Return',
    winRate: 'Win Rate',
    invested: '$1,000 Invested',
    stocksUp: 'stocks went up',
    entry: 'Entry',
    exit: 'Exit',
    soldOn: 'Sold on',
    noData: 'Performance data not yet available',
    noDataDesc: 'Data collection has started. Check back soon.',
    showAll: 'Show all',
    showLess: 'Show less',
    basedOn: 'Based on recommendations from',
  },
  ko: {
    title: '과거 추천 성과',
    oneMonth: '1개월 전',
    threeMonths: '3개월 전',
    avgReturn: '평균 수익률',
    winRate: '승률',
    invested: '$1,000 투자 시',
    stocksUp: '종목 상승',
    entry: '진입가',
    exit: '청산가',
    soldOn: '매도일',
    noData: '성과 데이터 준비 중',
    noDataDesc: '데이터 수집이 시작되었습니다. 잠시 후 확인해주세요.',
    showAll: '전체 보기',
    showLess: '접기',
    basedOn: '기준일',
  },
  ja: {
    title: '過去の推奨パフォーマンス',
    oneMonth: '1ヶ月前',
    threeMonths: '3ヶ月前',
    avgReturn: '平均リターン',
    winRate: '勝率',
    invested: '$1,000投資時',
    stocksUp: '銘柄上昇',
    entry: 'エントリー',
    exit: 'イグジット',
    soldOn: '売却日',
    noData: 'パフォーマンスデータ準備中',
    noDataDesc: 'データ収集を開始しました。しばらくお待ちください。',
    showAll: 'すべて表示',
    showLess: '折りたたむ',
    basedOn: '基準日',
  },
  zh: {
    title: '过去推荐表现',
    oneMonth: '1个月前',
    threeMonths: '3个月前',
    avgReturn: '平均回报',
    winRate: '胜率',
    invested: '$1,000投资',
    stocksUp: '股票上涨',
    entry: '入场价',
    exit: '出场价',
    soldOn: '卖出日',
    noData: '表现数据准备中',
    noDataDesc: '数据收集已开始。请稍后查看。',
    showAll: '显示全部',
    showLess: '收起',
    basedOn: '基准日',
  },
};

export function PastPerformanceSection({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const [selectedPeriod, setSelectedPeriod] = useState<1 | 3>(1);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery<HistoricalPerformanceResponse>({
    queryKey: ['rankings', 'historical-performance', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/rankings/historical-performance?monthsAgo=${selectedPeriod}`));
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-neutral-800 rounded w-48 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-16 bg-neutral-800 rounded" />
            <div className="h-16 bg-neutral-800 rounded" />
            <div className="h-16 bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error or no data
  if (error || !data || !data.dataAvailable) {
    return (
      <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Target size={14} className="text-emerald-500" />
            {t.title}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedPeriod(1)}
              className={`px-2 py-1 text-xs rounded ${selectedPeriod === 1 ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
            >
              {t.oneMonth}
            </button>
            <button
              onClick={() => setSelectedPeriod(3)}
              className={`px-2 py-1 text-xs rounded ${selectedPeriod === 3 ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
            >
              {t.threeMonths}
            </button>
          </div>
        </div>
        <div className="text-center py-6 text-neutral-500">
          <Clock size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t.noData}</p>
          <p className="text-xs mt-1 text-neutral-600">{data?.message || t.noDataDesc}</p>
        </div>
      </div>
    );
  }

  const { summary, stocks, period } = data;
  const displayStocks = showAll ? stocks : stocks.slice(0, 5);

  return (
    <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <Target size={14} className="text-emerald-500" />
          {t.title}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedPeriod(1)}
            className={`px-2 py-1 text-xs rounded transition-colors ${selectedPeriod === 1 ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            {t.oneMonth}
          </button>
          <button
            onClick={() => setSelectedPeriod(3)}
            className={`px-2 py-1 text-xs rounded transition-colors ${selectedPeriod === 3 ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            {t.threeMonths}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Average Return */}
        <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-neutral-500 mb-1">{t.avgReturn}</div>
          <div className={`text-lg font-bold ${summary.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.avgReturn >= 0 ? '+' : ''}{summary.avgReturn.toFixed(1)}%
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-neutral-500 mb-1">{t.winRate}</div>
          <div className="text-lg font-bold text-neutral-200">
            {summary.winnersCount}/{summary.winnersCount + summary.losersCount}
            <span className="text-xs text-neutral-500 ml-1">{t.stocksUp}</span>
          </div>
        </div>

        {/* Hypothetical Gain */}
        <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-neutral-500 mb-1">{t.invested}</div>
          <div className={`text-lg font-bold ${summary.hypotheticalGain >= 1000 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${summary.hypotheticalGain.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Stock Performance List */}
      <div className="space-y-2">
        {displayStocks.map((stock) => (
          <StockPerformanceRow key={stock.ticker} stock={stock} t={t} />
        ))}
      </div>

      {/* Show More/Less Button */}
      {stocks.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-xs text-neutral-400 hover:text-neutral-300 flex items-center justify-center gap-1 border-t border-neutral-800"
        >
          {showAll ? (
            <>
              <ChevronUp size={14} />
              {t.showLess}
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              {t.showAll} ({stocks.length})
            </>
          )}
        </button>
      )}

      {/* Footer - snapshot date */}
      <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-600 text-center">
        {t.basedOn}: {new Date(period.snapshotDate).toLocaleDateString()}
      </div>
    </div>
  );
}

function StockPerformanceRow({ stock, t }: { stock: StockPerformance; t: typeof translations.en }) {
  const isPositive = stock.returnPercent >= 0;

  return (
    <div className="flex items-center justify-between py-2 px-2 bg-neutral-800/30 rounded hover:bg-neutral-800/50 transition-colors">
      {/* Left: Rank + Ticker */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-neutral-500 w-5">#{stock.rank}</span>
        <div className="min-w-0">
          <div className="font-medium text-sm text-neutral-200 truncate">{stock.ticker}</div>
          <div className="text-xs text-neutral-500 truncate max-w-[120px]">{stock.companyName}</div>
        </div>
      </div>

      {/* Center: Price Change */}
      <div className="text-center text-xs">
        <div className="text-neutral-400">
          ${stock.entryPrice.toFixed(2)} → ${stock.exitPrice.toFixed(2)}
        </div>
        {stock.hadInsiderSell && stock.sellIndicator && (
          <div className="flex items-center gap-1 text-amber-500 mt-0.5">
            <AlertTriangle size={10} />
            <span className="text-[10px]">{stock.sellIndicator}</span>
          </div>
        )}
      </div>

      {/* Right: Return */}
      <div className={`text-right min-w-[70px] ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        <div className="flex items-center justify-end gap-1 font-medium">
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{stock.returnPercent.toFixed(1)}%</span>
        </div>
        <div className="text-xs opacity-75">
          {isPositive ? '+' : ''}${stock.returnDollar.toFixed(0)}
        </div>
      </div>
    </div>
  );
}

export default PastPerformanceSection;
