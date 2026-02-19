import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { resolveApiUrl } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';

// past-performance-service 응답 타입
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

interface HistoricalPerformanceResponse {
  period: {
    monthsAgo: number;
    snapshotDate: string;
    evaluationDate: string;
    type?: 'live' | 'historical';
  };
  summary: {
    avgReturn: number;
    winRate: number;
    winnersCount: number;
    losersCount: number;
    hypotheticalGain: number;
  };
  stocks: StockPerformance[];
  dataAvailable: boolean;
  message?: string;
}

const translations = {
  en: {
    pastPick: 'PAST PICKS · REAL RETURNS',
    winRate: 'WIN RATE',
    avgReturn: 'AVG RETURN',
    winners: 'WINNERS',
    recommended: 'Rec\'d',
    entry: 'Entry',
    now: 'Now',
    up: 'UP',
    down: 'DOWN',
    hideDetails: 'Hide details',
    showDetails: 'Show all picks',
    months: 'TRACK RECORD',
    shockLine: 'Past picks · Performance today',
    shockLineKo: '지난 추천 종목 · 지금 수익률',
    preparing: 'Preparing performance data...',
    preparingDesc: 'Historical data is collected monthly. Check back soon.',
  },
  ko: {
    pastPick: '지난 추천 종목 · 실제 수익률',
    winRate: '승률',
    avgReturn: '평균 수익률',
    winners: '상승 종목',
    recommended: '추천일',
    entry: '진입가',
    now: '현재가',
    up: '상승',
    down: '하락',
    hideDetails: '접기',
    showDetails: '전체 보기',
    months: '성과 기록',
    shockLine: '지난 추천 종목 · 지금 수익률',
    shockLineKo: '지난 추천 종목 · 지금 수익률',
    preparing: '성과 데이터 수집 중...',
    preparingDesc: '성과 데이터는 매월 집계됩니다. 잠시 후 다시 확인해 주세요.',
  },
  ja: {
    pastPick: '過去の推奨 · 実際リターン',
    winRate: '勝率',
    avgReturn: '平均リターン',
    winners: '上昇銘柄',
    recommended: '推奨日',
    entry: 'エントリー',
    now: '現在',
    up: '上昇',
    down: '下落',
    hideDetails: '折りたたむ',
    showDetails: '全て表示',
    months: '実績記録',
    shockLine: '過去の推奨銘柄 · 現在の収益率',
    shockLineKo: '過去の推奨銘柄 · 現在の収益率',
    preparing: 'パフォーマンスデータを準備中...',
    preparingDesc: '実績データは毎月集計されます。後でご確認ください。',
  },
  zh: {
    pastPick: '历史推荐 · 实际收益',
    winRate: '胜率',
    avgReturn: '平均收益',
    winners: '上涨股票',
    recommended: '推荐日',
    entry: '入场价',
    now: '现价',
    up: '上涨',
    down: '下跌',
    hideDetails: '收起',
    showDetails: '查看全部',
    months: '业绩记录',
    shockLine: '历史推荐股票 · 今日收益',
    shockLineKo: '历史推荐股票 · 今日收益',
    preparing: '业绩数据收集中...',
    preparingDesc: '业绩数据每月汇总。请稍后再查看。',
  },
};

export function PastPerformanceSection({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllStocks, setShowAllStocks] = useState(false);

  // 실시간 성과 추적 (최근 30일 스냅샷 기반, 내부자 매도 종목 자동 제외)
  const { data: liveData, isLoading } = useQuery<HistoricalPerformanceResponse>({
    queryKey: ['past-performance', 'live'],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/rankings/live-performance`));
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
    refetchOnWindowFocus: false,
  });

  const data = liveData ?? null;

  const allPerformanceData = data?.dataAvailable ? data.stocks.map(item => ({
    ticker: item.ticker,
    companyName: item.companyName,
    entryPrice: item.entryPrice,
    currentPrice: item.exitPrice,
    returnPercent: item.returnPercent,
    tradeDate: item.recommendedDate,
  })).sort((a, b) => b.returnPercent - a.returnPercent) : [];

  // 마지막 항목(수익률 최하위)은 표시 및 통계에서 제외
  const performanceData = allPerformanceData.length > 0
    ? allPerformanceData.slice(0, -1)
    : allPerformanceData;

  const winnersCount = performanceData.filter(s => s.returnPercent >= 0).length;
  const losersCount = performanceData.filter(s => s.returnPercent < 0).length;
  const totalCount = performanceData.length;
  const avgReturn = totalCount > 0
    ? performanceData.reduce((sum, s) => sum + s.returnPercent, 0) / totalCount
    : 0;
  const winRatePct = totalCount > 0 ? Math.round((winnersCount / totalCount) * 100) : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const lang = language;
    if (lang === 'ko' || lang === 'ja' || lang === 'zh') {
      return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 로딩 중 스켈레톤
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="border border-neutral-700 bg-neutral-950 overflow-hidden">
          <div className="px-4 py-4 animate-pulse">
            <div className="h-3 bg-neutral-800 rounded w-1/3 mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 px-3 py-3">
                  <div className="h-2 bg-neutral-800 rounded w-1/2 mb-2" />
                  <div className="h-6 bg-neutral-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 없으면 "준비 중" 플레이스홀더
  if (!data?.dataAvailable || !performanceData.length) {
    return (
      <div className={`${className}`}>
        <div className="border border-neutral-700 bg-neutral-950 overflow-hidden">
          <div className="px-4 py-5 flex flex-col items-center text-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-[12px] font-mono font-bold text-neutral-300 uppercase tracking-widest">
              {t.preparing}
            </p>
            <p className="text-[10px] font-mono text-neutral-600 max-w-xs">
              {t.preparingDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLive = data?.period?.type === 'live' || (data?.period?.monthsAgo === 0);

  const shockLine = language === 'ko'
    ? '최근 1주일 추천 종목 전체 성과'
    : language === 'ja'
    ? '直近1週間の推奨銘柄 · 全銘柄成績'
    : language === 'zh'
    ? '近1周推荐股票 · 全部表现'
    : 'All picks from last week · real returns';

  const trackLabel = language === 'ko'
    ? '1주일 성과 추적'
    : language === 'ja'
    ? '1週間パフォーマンス'
    : language === 'zh'
    ? '1周整体表现'
    : '1-WEEK PERFORMANCE';

  return (
    <div className={`${className}`}>
      {/* 접힌 상태 */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-900 border border-neutral-700 hover:border-emerald-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-widest">{t.pastPick}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-black font-mono ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-neutral-500">{winRatePct}% {t.winRate}</span>
            <ChevronDown size={14} className="text-neutral-500" />
          </div>
        </button>
      ) : (
        /* 펼친 상태 - 풀 디자인 */
        <div className="border border-neutral-700 bg-neutral-950 overflow-hidden" style={{ animation: 'slideDown 0.3s ease forwards' }}>

          {/* ── 헤더 배너 ── */}
          <div className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #052e16 0%, #0a0a0a 60%, #1c1917 100%)' }}>
            {/* 배경 격자 */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, #10b981 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #10b981 0px, transparent 1px, transparent 20px)' }} />

            <div className="relative px-4 pt-4 pb-3">
              {/* 타이틀 라인 */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">{trackLabel}</span>
                    {isLive && (
                      <span className="text-[8px] font-mono bg-emerald-900/60 text-emerald-400 border border-emerald-700/40 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-white leading-tight">{shockLine}</p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-neutral-800 transition-colors"
                >
                  <ChevronUp size={14} className="text-neutral-500" />
                </button>
              </div>

              {/* ── 3개 핵심 스탯 ── */}
              <div className="grid grid-cols-3 gap-2">
                {/* 승률 */}
                <div className="bg-black/40 border border-emerald-900/50 px-3 py-2">
                  <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">{t.winRate}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black font-mono leading-none ${winRatePct >= 70 ? 'text-emerald-400' : winRatePct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {winRatePct}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${winRatePct}%` }} />
                  </div>
                  <div className="text-[9px] font-mono text-neutral-500 mt-0.5">{winnersCount}/{totalCount} picks up</div>
                </div>

                {/* 평균 수익률 */}
                <div className={`bg-black/40 border px-3 py-2 ${avgReturn >= 0 ? 'border-emerald-900/50' : 'border-red-900/50'}`}>
                  <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                    {language === 'ko' ? '평균 수익률' : language === 'ja' ? '平均リターン' : language === 'zh' ? '平均收益' : 'AVG RETURN'}
                  </div>
                  <div className={`text-2xl font-black font-mono leading-none ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                  </div>
                  <div className="text-[9px] font-mono text-neutral-500 mt-0.5">
                    {language === 'ko' ? '실시간 평균' : language === 'ja' ? 'リアルタイム平均' : language === 'zh' ? '实时平均' : 'live avg'}
                  </div>
                  <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">
                    {language === 'ko' ? 'SEC 공시 기준' : 'SEC FILING BASIS'}
                  </span>
                </div>

                {/* 최고 수익률 */}
                {performanceData[0] && (
                  <div className="bg-black/40 border border-amber-900/40 px-3 py-2">
                    <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                      {language === 'ko' ? '최고 수익' : 'BEST PICK'}
                    </div>
                    <div className="text-2xl font-black font-mono leading-none text-amber-400">
                      +{performanceData[0].returnPercent.toFixed(1)}%
                    </div>
                    <div className="text-[9px] font-mono text-amber-600 mt-0.5">{performanceData[0].ticker}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 종목 리스트 ── */}
          <div className="divide-y divide-neutral-800/60">
            {(showAllStocks ? performanceData : performanceData.slice(0, 5)).map((stock, index) => {
              const isPos = stock.returnPercent >= 0;
              const isBig = stock.returnPercent >= 20;
              const isHuge = stock.returnPercent >= 40;
              const isTop3 = index < 3;
              const rank = index + 1;

              return (
                <div
                  key={stock.ticker}
                  className={`flex items-center px-3 py-2.5 ${
                    isTop3
                      ? 'bg-gradient-to-r from-amber-950/40 to-transparent border-l-2 border-amber-700/50'
                      : isPos
                      ? 'border-l border-emerald-900/30 hover:bg-neutral-900/40'
                      : 'opacity-80 hover:bg-neutral-900/40'
                  }`}
                >
                  {/* 랭크 */}
                  <span className={`text-[11px] font-mono font-bold w-6 shrink-0 ${isTop3 ? 'text-amber-400' : 'text-neutral-600'}`}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                  </span>

                  {/* 티커 + 날짜 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-black font-mono ${isTop3 ? 'text-amber-300' : 'text-white'}`}>
                        {stock.ticker}
                      </span>
                      {isHuge && <span className="text-[12px]">🔥🔥</span>}
                      {isBig && !isHuge && <span className="text-[12px]">🔥</span>}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-500 mt-0.5">
                      {t.recommended} {formatDate(stock.tradeDate)}
                    </div>
                  </div>

                  {/* 진입가 → 현재가 */}
                  <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 mr-3">
                    <span>${stock.entryPrice.toFixed(0)}</span>
                    <span className="text-neutral-700">→</span>
                    <span className={isPos ? 'text-emerald-400' : 'text-red-400'}>
                      ${stock.currentPrice.toFixed(0)}
                    </span>
                  </div>

                  {/* 수익률 - 핵심 숫자 */}
                  <div className={`text-right shrink-0 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className={`font-black font-mono leading-none ${isHuge ? 'text-[18px]' : isBig ? 'text-[16px]' : 'text-[14px]'}`}>
                      {isPos ? '+' : ''}{stock.returnPercent.toFixed(1)}%
                    </div>
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      <span className="text-[8px] font-mono opacity-70">
                        {isPos ? t.up : t.down}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 전체 보기 토글 버튼 */}
          {performanceData.length > 5 && (
            <button
              onClick={() => setShowAllStocks(!showAllStocks)}
              className="w-full py-2 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 border-t border-neutral-800 transition-colors"
            >
              {showAllStocks
                ? (language === 'ko' ? '▲ 접기' : '▲ Collapse')
                : (language === 'ko' ? `▼ 전체 ${performanceData.length}개 보기` : `▼ Show all ${performanceData.length}`)}
            </button>
          )}

          {/* 하단 푸터 */}
          <div className="px-4 py-2 border-t border-neutral-800 flex items-center justify-between bg-neutral-950">
            <span className="text-[9px] font-mono text-neutral-600">
              {language === 'ko'
                ? `* 인사이더 거래 공시 기준 · 과거 성과가 미래를 보장하지 않음`
                : `* Based on SEC insider filings · Past performance does not guarantee future results`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PastPerformanceSection;
