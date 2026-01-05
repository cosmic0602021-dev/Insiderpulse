import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Target, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { resolveApiUrl } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';
import { ENV_CONFIG } from '@/lib/environment';

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
  recommendedDate: string;
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
    title: 'Recent Recommendation Performance',
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
    basedOn: 'Recommended on',
  },
  ko: {
    title: '최근 추천종목 성과',
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
    basedOn: '추천일',
  },
  ja: {
    title: '最近の推奨銘柄パフォーマンス',
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
    basedOn: '推奨日',
  },
  zh: {
    title: '最近推荐股票表现',
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
    basedOn: '推荐日',
  },
};

export function PastPerformanceSection({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  // 앱인토스: "상위 내부자 주식 성과", insiderpulse.pro: "최근 추천종목 성과"
  const title = ENV_CONFIG.isAppintos
    ? (language === 'ko' ? '상위 내부자 주식 성과' : 'Top Insider Stocks Performance')
    : t.title;

  const [isExpanded, setIsExpanded] = useState(false); // 기본: 접힌 상태, 클릭하면 펼쳐짐
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 3>(1);

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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-12 bg-neutral-800 rounded" />
            <div className="h-12 bg-neutral-800 rounded" />
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
            {title}
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
  // 수익률 높은 순으로 정렬 - 10개 전체 표시 (마이너스도 보여야 신뢰감)
  const sortedStocks = [...stocks].sort((a, b) => b.returnPercent - a.returnPercent);
  const displayStocks = sortedStocks.slice(0, 10);

  // 접힌 상태: 한 줄 요약만 표시 (눈에 잘 띄게)
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full bg-emerald-900/30 border-2 border-emerald-600/50 rounded-lg p-4 flex items-center justify-between hover:bg-emerald-800/40 hover:border-emerald-500/70 transition-all ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/20 p-2 rounded-lg">
            <Target size={18} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-white block">{title}</span>
            <span className="text-xs text-emerald-400/80">{t.avgReturn}: {summary.avgReturn >= 0 ? '+' : ''}{summary.avgReturn.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-lg font-bold ${summary.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.winnersCount}/{summary.winnersCount + summary.losersCount}
            </span>
            <span className="text-xs text-neutral-400 block">{t.stocksUp}</span>
          </div>
          <div className="bg-emerald-600/30 p-1.5 rounded-full">
            <ChevronDown size={20} className="text-emerald-300" />
          </div>
        </div>
      </button>
    );
  }

  // 펼친 상태: 전체 내용 표시
  return (
    <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
      {/* Header - 클릭하면 접힘 */}
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
      >
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Target size={14} className="text-emerald-500" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500">
            {new Date(period.snapshotDate).toLocaleDateString()}
          </span>
          <ChevronUp size={16} className="text-neutral-500" />
        </div>
      </button>

      {/* Summary Stats - 2열로 간결하게 */}
      <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 mb-3">
        <div className="text-center flex-1">
          <div className={`text-xl font-bold ${summary.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.avgReturn >= 0 ? '+' : ''}{summary.avgReturn.toFixed(1)}%
          </div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.avgReturn}</div>
        </div>
        <div className="w-px h-8 bg-neutral-700" />
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-neutral-200">
            {summary.winnersCount}/{summary.winnersCount + summary.losersCount}
          </div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.stocksUp}</div>
        </div>
      </div>

      {/* Stock Performance List - 깔끔하게 */}
      <div className="space-y-1.5">
        {displayStocks.map((stock, index) => (
          <StockPerformanceRow key={stock.ticker} stock={stock} displayRank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function StockPerformanceRow({ stock, displayRank }: { stock: StockPerformance; displayRank: number }) {
  const isPositive = stock.returnPercent >= 0;
  const isTopThree = displayRank <= 3;

  // 1,2,3등 금색 스타일
  const rankStyle = isTopThree
    ? 'text-amber-400 font-bold'
    : 'text-neutral-600';

  // 추천일 포맷 (M/D)
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded ${isTopThree ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-neutral-800/30'}`}>
      {/* Left: Rank + Ticker + Date */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] w-4 ${rankStyle}`}>{displayRank}</span>
        <span className={`font-medium text-sm ${isTopThree ? 'text-amber-300' : 'text-neutral-200'}`}>{stock.ticker}</span>
        <span className="text-[9px] text-neutral-500">{formatDate(stock.recommendedDate)}</span>
      </div>

      {/* Center: Price */}
      <div className="text-[11px] text-neutral-500">
        ${stock.entryPrice.toFixed(2)} → ${stock.exitPrice.toFixed(2)}
      </div>

      {/* Right: Return */}
      <div className={`flex items-center gap-1 font-semibold text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{isPositive ? '+' : ''}{stock.returnPercent.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default PastPerformanceSection;
