import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';
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
    avgPricePerShare?: number;
    pricePerShare?: number; // legacy fallback
    latestDate?: string;
    date?: string; // legacy fallback
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
    // 새 구조: avgPricePerShare, 기존 구조: pricePerShare fallback
    const insiderPrice = item.insiders?.[0]?.avgPricePerShare || item.insiders?.[0]?.pricePerShare;
    const entryPrice = item.enhancedTrade?.pricePerShare || insiderPrice || 0;
    const currentPrice = item.currentPrice || item.enhancedTrade?.currentPrice || 0;
    const returnPercent = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
    const tradeDate = item.lastTradeDate || item.insiders?.[0]?.latestDate || item.insiders?.[0]?.date;

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
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 ${className}`}
      >
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            {/* 메인 아이콘 - 바운스 + 회전 */}
            <motion.div
              animate={{
                scale: [1, 1.2, 0.95, 1.1, 1],
                rotate: [0, 5, -5, 3, 0],
                y: [0, -8, 2, -4, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-emerald-400"
            >
              <TrendingUp size={48} strokeWidth={1.5} />
            </motion.div>
            {/* 스파크 효과 */}
            <motion.div
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.3
              }}
              className="absolute -top-2 -right-2 text-amber-400"
            >
              <Sparkles size={16} />
            </motion.div>
            {/* 펄스 링 */}
            <motion.div
              animate={{
                scale: [1, 2.5],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
          </div>
          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
              y: [0, -3, 0]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-emerald-400/80 text-xs font-medium"
          >
            {t.noData}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // No data
  if (!performanceData.length) {
    return null; // 데이터 없으면 숨김
  }

  // AnimatePresence로 부드러운 전환
  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        // 접힌 상태
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsExpanded(true)}
          className={`w-full bg-gradient-to-r from-emerald-900/40 to-neutral-900/50 border border-emerald-700/30 rounded-lg p-3 flex items-center justify-between hover:from-emerald-800/50 transition-colors ${className}`}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, -15, 15, -10, 10, 0],
                scale: [1, 1.2, 1, 1.1, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap size={14} className="text-emerald-400" />
            </motion.div>
            <span className="text-sm font-medium text-emerald-300">{t.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.span
              animate={{
                scale: [1, 1.05, 1],
                textShadow: avgReturn >= 0
                  ? ["0 0 0px transparent", "0 0 10px rgba(52, 211, 153, 0.5)", "0 0 0px transparent"]
                  : ["0 0 0px transparent", "0 0 10px rgba(248, 113, 113, 0.5)", "0 0 0px transparent"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`text-sm font-bold ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
            </motion.span>
            <span className="text-xs text-neutral-400">
              {winnersCount}/{totalCount} {t.stocksUp}
            </span>
            <motion.div
              animate={{
                y: [0, 4, 0, 2, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={16} className="text-emerald-400" />
            </motion.div>
          </div>
        </motion.button>
      ) : (
        // 펼친 상태
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.97 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 250,
            damping: 25
          }}
          className={`bg-gradient-to-b from-neutral-900/80 to-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden ${className}`}
        >
          {/* Header */}
          <motion.button
            whileHover={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              scale: 1.01,
              transition: { duration: 0.15 }
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsExpanded(false)}
            className="w-full bg-gradient-to-r from-emerald-900/30 to-transparent p-3 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  rotate: [0, -15, 15, -10, 10, 0],
                  scale: [1, 1.3, 1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap size={16} className="text-emerald-400" />
              </motion.div>
              <div className="text-left">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-sm font-bold text-white block"
                >
                  {t.title}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="text-[10px] text-emerald-400/70"
                >
                  {t.subtitle}
                </motion.span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1"
              >
                <motion.span
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.4, 1],
                    boxShadow: ["0 0 0px rgba(52, 211, 153, 0)", "0 0 8px rgba(52, 211, 153, 0.8)", "0 0 0px rgba(52, 211, 153, 0)"]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                />
                {t.updated}
              </motion.span>
              <motion.div
                animate={{
                  y: [0, -4, 0, -2, 0],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronUp size={16} className="text-neutral-400" />
              </motion.div>
            </div>
          </motion.button>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 }}
            className="px-3 pb-2"
          >
            <div className="flex items-center gap-4 py-2 border-b border-neutral-800/50">
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] text-neutral-500 uppercase"
                >
                  {t.avgReturn}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.25,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.1 }}
                  className={`text-lg font-bold ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  <motion.span
                    animate={avgReturn >= 0 ? {
                      textShadow: ["0 0 0px transparent", "0 0 15px rgba(52, 211, 153, 0.6)", "0 0 0px transparent"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                  </motion.span>
                </motion.span>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] text-neutral-500 uppercase"
                >
                  {t.stocksUp}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: 0.35,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.1 }}
                  className="text-lg font-bold text-white"
                >
                  {winnersCount}<span className="text-neutral-500 text-sm">/{totalCount}</span>
                </motion.span>
              </div>
              {/* 승률 표시 추가 */}
              {totalCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="ml-auto"
                >
                  <motion.span
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      (winnersCount / totalCount) >= 0.7
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : (winnersCount / totalCount) >= 0.5
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {Math.round((winnersCount / totalCount) * 100)}% Win
                  </motion.span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Stock List with Stagger Animation */}
          <div className="px-2 pb-2 space-y-1">
            {performanceData.slice(0, 10).map((stock, index) => (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: 0.3 + index * 0.07,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
              >
                <StockRow stock={stock} rank={index + 1} t={t} isFirst={index === 0} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StockRow({ stock, rank, t, isFirst = false }: {
  stock: { ticker: string; companyName: string; entryPrice: number; currentPrice: number; returnPercent: number; tradeDate: string };
  rank: number;
  t: typeof translations.en;
  isFirst?: boolean;
}) {
  const isPositive = stock.returnPercent >= 0;
  const isTopThree = rank <= 3;
  const isBigWinner = stock.returnPercent >= 20; // 20% 이상 큰 수익

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        x: 8,
        boxShadow: isTopThree
          ? "0 4px 20px rgba(251, 191, 36, 0.2)"
          : "0 4px 15px rgba(255, 255, 255, 0.1)",
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer relative overflow-hidden ${
        isTopThree
          ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-l-2 border-amber-400'
          : 'bg-neutral-800/30 hover:bg-neutral-800/50'
      }`}
    >
      {/* 1등 특별 효과 */}
      {rank === 1 && (
        <motion.div
          animate={{
            x: ['-100%', '200%'],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent skew-x-12"
        />
      )}

      {/* Left: Rank + Ticker */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <motion.span
          animate={isFirst ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className={`text-xs w-5 font-bold ${isTopThree ? 'text-amber-400' : 'text-neutral-600'}`}
        >
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
        </motion.span>
        <div className="min-w-0">
          <motion.span
            whileHover={{ color: isTopThree ? '#fcd34d' : '#10b981' }}
            className={`font-bold text-sm ${isTopThree ? 'text-amber-300' : 'text-white'}`}
          >
            {stock.ticker}
          </motion.span>
          <span className="text-[10px] text-neutral-500 ml-2">{t.recDate} {formatDate(stock.tradeDate)}</span>
        </div>
      </div>

      {/* Center: Price Journey */}
      <div className="text-[11px] text-neutral-400 flex items-center gap-1">
        <span>${stock.entryPrice.toFixed(2)}</span>
        <motion.span
          animate={{
            opacity: [0.3, 1, 0.3],
            x: [0, 3, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-neutral-600"
        >
          →
        </motion.span>
        <motion.span
          animate={isBigWinner ? {
            scale: [1, 1.1, 1],
            textShadow: ["0 0 0px transparent", "0 0 8px rgba(52, 211, 153, 0.8)", "0 0 0px transparent"]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={isPositive ? 'text-emerald-400' : 'text-red-400'}
        >
          ${stock.currentPrice.toFixed(2)}
        </motion.span>
      </div>

      {/* Right: Return */}
      <motion.div
        animate={isBigWinner ? {
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`flex items-center gap-1 font-bold text-sm min-w-[70px] justify-end ${
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        <motion.div
          animate={isPositive ? {
            y: [0, -2, 0],
            rotate: [0, 10, 0]
          } : {
            y: [0, 2, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </motion.div>
        <span>{isPositive ? '+' : ''}{stock.returnPercent.toFixed(1)}%</span>
        {isBigWinner && (
          <motion.span
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="ml-1"
          >
            🔥
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}

export default PastPerformanceSection;
