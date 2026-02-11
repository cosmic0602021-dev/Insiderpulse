import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Lock, Clock, Zap, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import { TRANSLATIONS, formatNumber, formatPercent, type Language } from '@/lib/translations';
import { useCurrency } from '@/contexts/currency-context';
import type { InsiderTrade } from '@shared/schema';
import { apiClient, queryKeys } from '@/lib/api';
import { useAccess } from '@/contexts/access-context';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLocation } from 'wouter';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { TransactionTypeFilter } from '@/components/transaction-type-filter';
import { ENV_CONFIG } from '@/lib/environment';
import { showInterstitialAd, loadInterstitialAd } from '@/lib/admob';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';

// Map InsiderTrade to terminal UI Trade interface
// 'Other' includes GRANT, OPTION_EXERCISE, DISPOSITION (non-core trades)
type TradeTypeUI = 'Buy' | 'Sell' | 'Other';

interface TerminalTrade {
  id: string;
  ticker: string;
  companyName: string;
  insider: string;
  relation: string;
  type: TradeTypeUI;
  rawType: string; // Original trade type from API (for display purposes)
  shares: number;
  price: number;
  value: number;
  date: string;
  priceChange: number;
  marketCap?: number;
  isVerified: boolean;
}

// Map trade type to UI category
function mapTradeTypeToUI(tradeType: string): TradeTypeUI {
  const upperType = tradeType.toUpperCase();
  if (upperType === 'BUY' || upperType === 'PURCHASE') {
    return 'Buy';
  } else if (upperType === 'SELL' || upperType === 'SALE') {
    return 'Sell';
  }
  // GRANT, OPTION_EXERCISE, DISPOSITION, etc. are 'Other'
  return 'Other';
}

function mapInsiderTradeToTerminal(trade: InsiderTrade): TerminalTrade {
  return {
    id: trade.id,
    ticker: trade.ticker || 'N/A',
    companyName: trade.companyName,
    insider: trade.traderName,
    relation: trade.traderTitle || 'Unknown',
    type: mapTradeTypeToUI(trade.tradeType),
    rawType: trade.tradeType, // Keep original type for display
    shares: trade.shares,
    price: trade.pricePerShare,
    value: trade.totalValue,
    date: new Date(trade.filedDate).toISOString(),
    priceChange: trade.priceVariance || 0,
    marketCap: (trade as any).marketCap || 0,
    isVerified: trade.isVerified || false,
  };
}

export default function LiveTradingTerminal() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { accessLevel, setAccessLevel } = useAccess();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<'All' | 'Buy' | 'Sell'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(50);
  const [allLoadedTrades, setAllLoadedTrades] = useState<InsiderTrade[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'core' | 'all'>('core');
  const [adClickCount, setAdClickCount] = useState(0);  // 앱인토스 광고 클릭 카운터

  // 검색어 디바운스 (300ms 대기 후 서버 검색)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].live;
  const tData = TRANSLATIONS[langKey].data;
  const tCommon = TRANSLATIONS[langKey].common;

  // 앱인토스에서는 모든 데이터 실시간 공개 (isPro 취급)
  const isAppintos = ENV_CONFIG.isAppintos;
  const isPro = isAppintos || accessLevel?.hasRealtimeAccess || false;

  // 핵심거래: isDerivative=false (Table I 직접 거래만, 파생상품 제외)

  // Fetch trades from backend - frontend filtering for instant type switching
  // 초기 로드를 50으로 설정 (성능 최적화 - 추가 데이터는 스크롤로 로드)
  const INITIAL_LOAD_LIMIT = 50;
  
  const { data: tradesResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: INITIAL_LOAD_LIMIT,
      offset: 0,
      sortBy: 'filedDate',
      transactionTypes: ['ALL']
    }),
    queryFn: async () => {
      console.log('🌐 [API] Fetching ALL trades for frontend filtering');
      const response = await apiClient.getInsiderTradesWithAccess(
        INITIAL_LOAD_LIMIT,
        0,
        undefined,
        undefined,
        'filedDate',
        ['ALL']
      );
      if (response.accessLevel) {
        setAccessLevel(response.accessLevel);
      }
      console.log(`📊 [API] Received ${response.trades.length} trades`);
      return response;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Initialize allLoadedTrades when tradesResponse changes
  useEffect(() => {
    if (tradesResponse?.trades && tradesResponse.trades.length > 0) {
      setAllLoadedTrades(tradesResponse.trades);
      setHasMoreData(tradesResponse.trades.length >= INITIAL_LOAD_LIMIT);
    }
  }, [tradesResponse?.trades]);

  // Load more handler - always fetches ALL types
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreData) return;
    
    setIsLoadingMore(true);
    try {
      const offset = allLoadedTrades.length;
      const batchSize = 100;
      console.log(`📊 Loading more trades from offset ${offset}`);
      
      const response = await apiClient.getInsiderTradesWithAccess(
        batchSize,
        offset,
        undefined,
        undefined,
        'filedDate',
        ['ALL']
      );
      
      if (response.trades.length === 0) {
        setHasMoreData(false);
      } else {
        setAllLoadedTrades(prev => [...prev, ...response.trades]);
        setHasMoreData(response.trades.length >= batchSize);
        console.log(`📊 Loaded ${response.trades.length} more trades, total: ${allLoadedTrades.length + response.trades.length}`);
      }
    } catch (error) {
      console.error('Failed to load more trades:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Apply transaction type filter on frontend (instant switching, no network request)
  // 핵심거래: isDerivative=false (Table I 직접 거래만)
  // 전체거래: 모든 거래 포함 (Table I + Table II 파생상품)
  const allTrades = useMemo(() => {
    const rawTrades = allLoadedTrades.length > 0 ? allLoadedTrades : (tradesResponse?.trades || []);

    if (transactionTypeFilter === 'core') {
      // 핵심거래만: isDerivative=false (파생상품 제외, 순수 주식 직접 거래만)
      const filtered = rawTrades.filter(trade => trade.isDerivative === false);
      console.log(`🔍 [Filter] Core trades (isDerivative=false): ${filtered.length}/${rawTrades.length}`);
      return filtered;
    }

    // 전체거래: 모든 타입 포함 (파생상품 포함)
    console.log(`🔍 [Filter] All trades (including derivatives): ${rawTrades.length}`);
    return rawTrades;
  }, [allLoadedTrades, tradesResponse?.trades, transactionTypeFilter]);

  // 서버 측 검색 쿼리 (debouncedSearch가 2자 이상일 때만 실행)
  const { data: searchResponse, isFetching: isSearching } = useQuery({
    queryKey: queryKeys.trades.search(debouncedSearch),
    queryFn: async () => {
      console.log('[LIVE TRADING TERMINAL] Server-side search for:', debouncedSearch);
      // 서버에서 해당 티커/회사명으로 100개까지 검색 (30일 범위)
      const response = await apiClient.getInsiderTradesWithAccess(
        100,
        0,
        undefined,
        undefined,
        'filedDate',
        ['ALL'],
        debouncedSearch
      );
      console.log('[LIVE TRADING TERMINAL] Search response:', response.trades.length, 'trades found');
      return response;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 60 * 1000, // 1분 캐시
  });

  // WebSocket connection for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected } = useWebSocket(wsUrl);

  // Map to terminal format and apply filters
  const terminalTrades = useMemo(() => {
    return allTrades
      .map(mapInsiderTradeToTerminal)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTrades]);

  // 서버 검색 결과 처리 (transactionTypeFilter 적용)
  const searchTrades = useMemo(() => {
    if (debouncedSearch.length < 2 || !searchResponse?.trades) return [];

    let trades = searchResponse.trades;

    // transactionTypeFilter 적용
    if (transactionTypeFilter === 'core') {
      trades = trades.filter(trade => trade.isDerivative === false);
    }

    return trades.map(mapInsiderTradeToTerminal)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debouncedSearch, searchResponse?.trades, transactionTypeFilter]);

  const filteredData = useMemo(() => {
    // 서버 측 검색 결과가 있으면 사용, 없으면 기본 데이터 사용
    let result = debouncedSearch.length >= 2 ? searchTrades : terminalTrades;

    // Apply type filter
    if (filter !== 'All') {
      result = result.filter(t => t.type === filter);
    }

    // 클라이언트 측 추가 필터링 (서버에서 ticker만 검색하므로, 회사명/내부자명으로도 필터)
    if (debouncedSearch.length >= 2) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(t =>
        t.ticker.toLowerCase().includes(query) ||
        t.companyName.toLowerCase().includes(query) ||
        t.insider.toLowerCase().includes(query)
      );
    }

    return result;
  }, [terminalTrades, searchTrades, filter, debouncedSearch]);

  const realTimeItems = isPro ? filteredData.slice(0, 3) : [];
  const historicalItems = isPro ? filteredData.slice(3) : filteredData;

  const handleSelectTrade = async (trade: TerminalTrade) => {
    // Find original InsiderTrade from allTrades first
    let original = allTrades.find(t => t.id === trade.id);

    // If not found in allTrades, search in searchResponse.trades (검색 결과에서 찾기)
    if (!original && searchResponse?.trades) {
      original = searchResponse.trades.find(t => t.id === trade.id);
    }

    if (!original) {
      console.warn('[LiveTradingTerminal] Trade not found:', trade.id);
      return;
    }

    // 앱인토스: 2번째 클릭마다 전면형 광고 표시
    if (isAppintos) {
      const newCount = adClickCount + 1;
      setAdClickCount(newCount);

      if (newCount % 2 === 0) {
        // 2, 4, 6번째 클릭: 광고 표시 후 모달 열기
        try {
          console.log('[LiveTrading] Showing interstitial ad (click count:', newCount, ')');
          await showInterstitialAd();
          // 다음 광고 프리로드
          loadInterstitialAd().catch(err => {
            console.warn('[LiveTrading] Failed to preload next ad:', err);
          });
        } catch (error) {
          console.error('[LiveTrading] Ad failed:', error);
        }
      }
    }

    setSelectedTrade(original);
    setIsModalOpen(true);
  };

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate('/signup');
    } else {
      navigate('/premium-checkout');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
      <style>{`
        @keyframes stripe-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animate-stripe-scroll {
          animation: stripe-scroll 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>

      {/* Header */}
      <div className="p-6 border-b border-neutral-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight flex items-center gap-3">
              {t.header}
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/20 text-amber-500 border border-amber-900/30 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] whitespace-nowrap">
                  {t.delayedBadge}
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2">
              {isPro ? (
                <>
                  <Zap size={10} className="text-emerald-500" /> {t.realtime}
                  {isConnected && <span className="text-emerald-500">● CONNECTED</span>}
                </>
              ) : (
                <>
                  <Clock size={10} className="text-amber-600" /> {t.delayed}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative w-full md:w-[500px] group">
            {isSearching && debouncedSearch.length >= 2 ? (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-500 transition-colors" size={14} />
            )}
            <input
              type="text"
              placeholder={t.query}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] text-sm text-neutral-300 border border-neutral-800 pl-10 pr-4 py-3 focus:outline-none focus:border-neutral-600 font-mono placeholder:text-neutral-600 transition-colors"
              data-testid="input-search"
            />
            {debouncedSearch.length >= 2 && !isSearching && searchResponse?.trades && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-mono uppercase">
                {filteredData.length} {language === 'ko' ? '결과' : 'found'}
              </span>
            )}
          </div>
          {/* Unified Filter Bar - All/Buy/Sell + Core/All Trades */}
          <div className="w-full flex justify-center">
            <div className="max-w-3xl w-full flex flex-col md:flex-row gap-3 bg-neutral-900/50 border border-neutral-800 p-3 rounded-lg">
            {/* Left: Trade Type Filter (All/Buy/Sell) */}
            <div className="flex bg-[#0a0a0a] border border-neutral-800 p-1 gap-1 flex-1">
              {[
                { key: 'All', label: t.filter.all },
                { key: 'Buy', label: t.filter.buy },
                { key: 'Sell', label: t.filter.sell }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider font-medium transition-all rounded ${
                    (filter === f.key) && f.key === 'All' ? 'bg-neutral-800 text-white' :
                    (filter === f.key) && f.key === 'Buy' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-900/30' :
                    (filter === f.key) && f.key === 'Sell' ? 'bg-rose-900/20 text-rose-500 border border-rose-900/30' :
                    'text-neutral-600 hover:text-neutral-400'
                  }`}
                  data-testid={`button-filter-${f.key.toLowerCase()}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Right: Transaction Detail Filter (Core/All) */}
            <div className="flex-1">
              <TransactionTypeFilter
                value={transactionTypeFilter}
                onChange={setTransactionTypeFilter}
              />
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="absolute inset-0 min-h-full pointer-events-none bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 z-0"></div>

        {/* Table Header */}
        <div className="sticky top-0 bg-[#050505] border-b border-neutral-800 z-30 grid grid-cols-5 md:grid-cols-9 gap-x-3 md:gap-x-6 text-[10px] text-neutral-400 uppercase tracking-widest font-mono px-4 py-3">
          <div className="pl-2">{t.table.ticker}</div>
          <div className="hidden md:block">{t.table.insider}</div>
          <div className="hidden md:block">{t.table.relation}</div>
          <div className="text-right">{t.table.action}</div>
          <div className="text-right hidden md:block">{t.table.price}</div>
          <div className="text-right hidden md:block">{t.table.volume}</div>
          <div className="text-right">{t.table.value}</div>
          <div className="text-right">{t.table.impact}</div>
          <div className="text-right pr-2">{t.table.time}</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="h-[70vh] pt-[15vh] flex flex-col items-center justify-start gap-5">
            <div className="ecg-loader">
              <svg viewBox="0 0 360 60" style={{ width: '360px' }}>
                {/* 리듬감 있는 심박수 파형 - P파, QRS complex, T파 패턴 반복 */}
                <path d="M0,30 L15,30 L18,28 L21,30 L35,30 L38,20 L40,45 L42,10 L44,30 L50,30 L53,25 L56,30 L80,30 L83,28 L86,30 L100,30 L103,20 L105,45 L107,10 L109,30 L115,30 L118,25 L121,30 L145,30 L148,28 L151,30 L165,30 L168,20 L170,45 L172,10 L174,30 L180,30 L183,25 L186,30 L210,30 L213,28 L216,30 L230,30 L233,20 L235,45 L237,10 L239,30 L245,30 L248,25 L251,30 L275,30 L278,28 L281,30 L295,30 L298,20 L300,45 L302,10 L304,30 L310,30 L313,25 L316,30 L340,30 L343,28 L346,30 L360,30" />
              </svg>
            </div>
            <div className="text-neutral-300 text-sm">
              {[
                '내부자 소식 엿듣는 중...',
                '월가 찐친한테 연락 중...',
                'SEC 공시 뒤지는 중...',
                '억만장자 포트폴리오 훔쳐보는 중...',
                '내부자들 뒷담화 듣는 중...',
                '비밀 정보원 접선 중...',
                'CEO 트위터 스토킹 중...',
                '헤지펀드 매니저 와인바에서 포착...',
                '골드만삭스 화장실 도청 중...',
                '워렌 버핏 아침 식단 분석 중...',
                '일론 머스크 새벽 트윗 대기 중...',
                '기관투자자 점심 메뉴 추적 중...',
                'JPMorgan VIP 라운지 잠입 중...',
                '펀드매니저 골프장 염탐 중...',
                '애널리스트 야근 횟수 집계 중...',
                'CFO 남몰래 한숨 쉬는 횟수 체크 중...',
                '증권가 찐 내부자 카톡방 해킹 중...',
                '재무제표 행간 독심술 시전 중...',
                '임원 주차장 고급차 대수 카운팅 중...',
                '펜타곤 경제브리핑 엿듣는 중...',
                'CEO 자녀 과외 선생님과 접선 중...',
                '사모펀드 비밀회의 의사록 입수 중...',
                '블랙록 본사 청소부와 친해지는 중...',
                '배당 발표 전 임원 표정 분석 중...',
                '주주총회 도시락 메뉴로 실적 예측 중...',
                'IR팀 야식 주문 빈도 모니터링 중...',
                '재무담당 이사 눈밑 다크서클 측정 중...',
                '본사 회의실 예약 현황 분석 중...',
                '경영진 헬스장 출석률 체크 중...',
                'M&A팀 택시 영수증 역추적 중...',
                '회계법인 야근 불빛 카운트 중...',
                '비서실 커피 주문량 급증 감지 중...',
                '이사회 의사록 휴지통 뒤지는 중...',
                'C레벨 프라이빗 제트 항로 추적 중...',
                '투자은행 신입 퇴근 시간 집계 중...',
                '컨퍼런스콜 배경 소음 분석 중...',
                '법무팀 에너지 드링크 소비량 측정 중...'
              ][Math.floor(Math.random() * 36)]}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
            <p className="text-neutral-400 text-sm">ERROR: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}

        {/* Real-Time Zone (Pro Only) */}
        {!isLoading && !error && isPro && realTimeItems.length > 0 && (
          <div>
            <div className="sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2 bg-emerald-900/10 border-b-emerald-900/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-emerald-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">{t.realtimeZone}</span>
              </div>
              <span className="text-[8px] text-neutral-600 font-mono">LIVE_STREAM_ACTIVE</span>
            </div>
            {realTimeItems.map((trade) => (
              <TradeRow 
                key={trade.id} 
                trade={trade} 
                onClick={() => handleSelectTrade(trade)}
                tData={tData}
              />
            ))}
          </div>
        )}

        {/* Locked Zone (Free Users) - Match image_1763700747059.png exactly */}
        {!isLoading && !error && !isPro && filteredData.length > 0 && (
          <div className="relative border-b border-neutral-800 overflow-hidden">
            {/* Diagonal stripes covering ALL rows (1-5) with animation */}
            <div 
              className="absolute inset-0 pointer-events-none animate-stripe-scroll z-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(245,158,11,0.04) 4px, rgba(245,158,11,0.04) 8px)'
              }}
            ></div>

            {/* Row 1: Header with stripes visible */}
            <div className="sticky top-[45px] h-8 bg-[#050505]/80 backdrop-blur-sm border-b border-amber-900/20 z-30 px-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={9} className="text-amber-600" />
                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-amber-600">
                  {t.realtimeZone}
                </span>
              </div>
              <span className="text-[7px] text-amber-600/50 font-mono uppercase tracking-[0.25em] flex items-center gap-1">
                <span className="text-amber-600/50">●</span>
                {t.encryptedForOutsiders}
              </span>
            </div>

            {/* Rows 2-4: "SIGNAL ENCRYPTED" watermarks */}
            <div className="relative">
              <div className="blur-[2px] opacity-25 pointer-events-none select-none">
                {filteredData.slice(0, 3).map((trade, idx) => (
                  <div key={trade.id} className="relative h-[52px] border-b border-neutral-800">
                    <TradeRow 
                      trade={trade} 
                      onClick={() => {}}
                      tData={tData}
                    />
                  </div>
                ))}
              </div>

              {/* 3 "SIGNAL ENCRYPTED" watermark overlays with border boxes */}
              {[0, 1, 2].map((idx) => (
                <div 
                  key={idx}
                  className="absolute left-0 right-0 h-[52px] flex items-center justify-center pointer-events-none z-20"
                  style={{ top: `${idx * 52}px` }}
                >
                  <div className="flex items-center gap-1.5 text-amber-600/60 px-3 py-1.5 border border-amber-600/20 bg-black/40">
                    <Lock size={10} />
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                      SIGNAL ENCRYPTED
                    </span>
                  </div>
                </div>
              ))}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/5 via-transparent to-black/30 pointer-events-none z-15"></div>
            </div>

            {/* Row 5: Unlock button */}
            <div className="h-14 flex items-center justify-center bg-gradient-to-b from-black/20 to-transparent relative z-20">
              <button 
                onClick={handleUpgrade}
                className="relative px-5 h-8 bg-amber-600 text-black text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-amber-500 transition-all flex items-center gap-1.5 font-mono shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                data-testid="button-upgrade"
              >
                <Zap size={10} className="text-black fill-black" />
                <span>{t.unlockRealtime}</span>
              </button>
            </div>
          </div>
        )}

        {/* Historical Data */}
        {!isLoading && !error && historicalItems.length > 0 && (
          <div>
            {isPro && (
              <div className="sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">Historical Records</span>
              </div>
            )}
            {historicalItems.map((trade) => (
              <TradeRow 
                key={trade.id} 
                trade={trade} 
                onClick={() => handleSelectTrade(trade)}
                tData={tData}
              />
            ))}
            
            {/* Load More Button */}
            <div className="flex justify-center py-6 border-t border-neutral-900">
              {hasMoreData ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-mono uppercase tracking-widest border border-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-load-more"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-neutral-400 pulse-dot"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span className="ml-1">{tCommon.loading || 'Loading...'}</span>
                    </span>
                  ) : (
                    <span>{tCommon.loadMore || 'Load More Historical Data'}</span>
                  )}
                </button>
              ) : (
                <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                  {tCommon.noMoreData || 'All historical data loaded'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && filteredData.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-neutral-400 text-sm font-mono mb-2">
              {debouncedSearch.length >= 2
                ? (language === 'ko' ? '검색 결과가 없습니다' : 'No search results found')
                : t.noRecords}
            </p>
            {debouncedSearch.length >= 2 && (
              <p className="text-neutral-600 text-xs font-mono">
                {language === 'ko'
                  ? '다른 티커 심볼이나 회사명으로 검색해보세요'
                  : 'Try a different ticker symbol or company name'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade as any}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// Trade Row Component
interface TradeRowProps {
  trade: TerminalTrade;
  onClick: () => void;
  tData: Record<string, string>;
}

function TradeRow({ trade, onClick, tData }: TradeRowProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  
  // Determine styling based on trade type
  const isBuy = trade.type === 'Buy';
  const isSell = trade.type === 'Sell';
  const isOther = trade.type === 'Other';
  
  // Type-specific styling: Buy = green, Sell = red, Other = amber/orange
  const typeClass = isBuy 
    ? 'text-emerald-500' 
    : isSell 
      ? 'text-rose-500' 
      : 'text-amber-500';
  const typeBg = 'bg-transparent';
  const typeBorder = isBuy 
    ? 'border-emerald-500' 
    : isSell 
      ? 'border-rose-500' 
      : 'border-amber-500';
  
  // Format time ago based on language
  const dateLocale = language === 'ko' ? ko : language === 'ja' ? ja : language === 'zh' ? zhCN : enUS;
  const timeAgo = formatDistanceToNow(new Date(trade.date), {
    addSuffix: true,
    locale: dateLocale
  });

  // Icon based on trade type: Buy = ArrowUpRight, Sell = ArrowDownLeft, Other = ArrowRightLeft (neutral)
  const ActionIcon = isBuy 
    ? ArrowUpRight 
    : isSell 
      ? ArrowDownLeft 
      : ArrowRightLeft;
  
  // Display label for trade type - supports multiple languages
  const getTypeLabel = () => {
    if (isOther) {
      // For 'Other' trades, show translated rawType
      const rawUpper = trade.rawType.toUpperCase();
      if (rawUpper === 'GRANT') {
        return language === 'ko' ? '부여' : language === 'ja' ? '付与' : language === 'zh' ? '授予' : 'GRANT';
      }
      if (rawUpper === 'OPTION_EXERCISE') {
        return language === 'ko' ? '옵션행사' : language === 'ja' ? 'オプション' : language === 'zh' ? '期权行使' : 'OPTION';
      }
      if (rawUpper === 'DISPOSITION') {
        return language === 'ko' ? '처분' : language === 'ja' ? '処分' : language === 'zh' ? '处置' : 'DISP';
      }
      if (rawUpper === 'AWARD') {
        return language === 'ko' ? '수여' : language === 'ja' ? '授与' : language === 'zh' ? '奖励' : 'AWARD';
      }
      if (rawUpper === 'CONVERSION') {
        return language === 'ko' ? '전환' : language === 'ja' ? '転換' : language === 'zh' ? '转换' : 'CONV';
      }
      // Default: show abbreviated raw type
      return trade.rawType.substring(0, 4).toUpperCase();
    }
    return tData[trade.type] || trade.type;
  };

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-5 md:grid-cols-9 gap-x-3 md:gap-x-6 text-xs border-b border-neutral-900 hover:bg-neutral-900/30 transition-colors cursor-pointer px-4 py-3"
      data-testid={`trade-row-${trade.ticker}`}
    >
      {/* Ticker + Company */}
      <div className="flex flex-col gap-0.5">
        <span className="font-mono font-semibold text-neutral-200 text-[13px] leading-[18px]">{trade.ticker}</span>
        <span className="text-neutral-500 text-[11px] leading-none">{trade.companyName}</span>
      </div>

      {/* Insider (Hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <span className="text-neutral-300 font-mono text-[12px] font-medium truncate">{trade.insider}</span>
      </div>

      {/* Relation (Hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <span className="text-neutral-400 font-mono text-[12px] font-medium uppercase tracking-wider truncate">{trade.relation}</span>
      </div>

      {/* Action */}
      <div className="flex items-center justify-end">
        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${typeBorder} ${typeClass} ${typeBg} rounded-sm inline-flex items-center gap-1`}>
          <ActionIcon size={10} className={typeClass} />
          <span className="hidden md:inline">{getTypeLabel()}</span>
        </span>
      </div>

      {/* Price Per Share (Hidden on mobile) */}
      <div className="hidden md:flex items-center justify-end">
        <span className="text-neutral-400 font-mono">{formatCurrency(trade.price)}</span>
      </div>

      {/* Volume (Hidden on mobile) */}
      <div className="hidden md:flex items-center justify-end">
        <span className="text-neutral-400 font-mono">{formatNumber(trade.shares)}</span>
      </div>

      {/* Value */}
      <div className="flex items-center justify-end">
        <span className="text-neutral-300 font-mono">{formatCurrency(trade.value)}</span>
      </div>

      {/* Market Cap Ratio (시총대비) - 별도 컬럼 */}
      <div className="flex items-center justify-end">
        {(() => {
          // Debug: Log missing marketCap
          if (!trade.marketCap || trade.marketCap === 0) {
            console.log(`⚠️ Missing marketCap for ${trade.ticker}:`, {
              ticker: trade.ticker,
              marketCap: trade.marketCap,
              value: trade.value
            });
          }
          return trade.marketCap && trade.marketCap > 0;
        })() ? (
          <span className="text-neutral-300 font-mono text-[11px]">
            {(() => {
              const ratio = (trade.value / trade.marketCap) * 100;
              if (ratio >= 10) return Math.round(ratio) + '%';
              else if (ratio >= 1) return ratio.toFixed(1) + '%';
              else if (ratio >= 0.01) return ratio.toFixed(2) + '%';
              else if (ratio >= 0.001) return ratio.toFixed(3) + '%';
              else if (ratio >= 0.0001) return ratio.toFixed(4) + '%';
              else if (ratio >= 0.00001) return ratio.toFixed(5) + '%';
              else if (ratio >= 0.000001) return ratio.toFixed(6) + '%';
              else if (ratio > 0) return ratio.toExponential(2) + '%';
              else return '0%';
            })()}
          </span>
        ) : (
          <span className="text-neutral-600 text-[10px]">-</span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center justify-end pr-2">
        <span className="text-neutral-500 text-[10px] font-mono">{timeAgo}</span>
      </div>
    </div>
  );
}
