import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { TickerTradesModal } from '@/components/ticker-trades-modal';
import { RefreshCw, Star, TrendingUp, TrendingDown, DollarSign, Activity, X, Bookmark, Bell, Check, Building2, Share2, Calendar, Lock, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useAccess } from '@/contexts/access-context';
import { apiClient, queryKeys } from '@/lib/api';
import { TRANSLATIONS } from '@/lib/translations';
import html2canvas from 'html2canvas';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';
import { ENV_CONFIG } from '@/lib/environment';
import { resolveApiUrl } from '@/lib/queryClient';
import { DebugPanel } from '@/components/debug-panel';
import { useAdOnNavigation } from '@/hooks/use-admob';
import { PastPerformanceSection } from '@/components/past-performance-section';
import { LoadingScreen } from '@/components/loading-screen';

// Global cache for AI analysis - shared across all users/sessions
const analysisCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

interface Insider {
  name: string;
  title: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
  tradeType: string;
  secFilingUrl?: string;
}

// Modified for App Store compliance: changed recommendation terminology to activity levels
interface RankingItem {
  ticker: string;
  companyName: string;
  score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD';  // Legacy field - displays as activity level
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  uniqueInsiders: number;
  insiders: Insider[];  // 새로 추가된 속성
  avgTradeValue: number;
  netBuying: number;
  lastTradeDate: string;
  insiderActivity: string;
  // 현재 주가 및 변동률 정보
  currentPrice?: number;
  priceChangePercent?: number;
  priceLastUpdated?: string | null;
  marketCap?: number | null; // 시가총액 추가
  // 패턴 정보 추가
  detectedPatterns?: Array<{
    type: string;
    description: string;
    significance: string;
  }>;
  patternSignals?: string | null;
  // Enhanced trade info from API
  enhancedTrade?: {
    currentPrice?: number;
    pricePerShare?: number;
    priceLastUpdated?: string | null;
  };
}

interface RankingsResponse {
  rankings: RankingItem[];
  generatedAt: string;
  period: string;
  totalStocksAnalyzed: number;
  meta?: {
    recencyDays: number;
    filteredCount?: number;
  };
}

export default function Ranking() {
  console.log('🔴🔴🔴 RANKING PAGE LOADED - NEW CODE! 🔴🔴🔴', new Date().toISOString());
  const { t, language } = useLanguage();
  const { accessLevel } = useAccess();
  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const tModal = TRANSLATIONS[langKey].modal;
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedTradeData, setSelectedTradeData] = useState<any | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [selectedTradeForAlert, setSelectedTradeForAlert] = useState<any | null>(null);
  const [sharedCardIndex, setSharedCardIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formatTimeAgo = (date: string | Date) => {
    const dateLocale = language === 'ko' ? ko : language === 'ja' ? ja : language === 'zh' ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale
    });
  };

  // Check if user has realtime access
  const isPremium = accessLevel?.hasRealtimeAccess || false;

  // AdMob Hook (앱인토스 환경에서만 사용)
  const { showAdBeforeNavigation } = ENV_CONFIG.isAppintos
    ? useAdOnNavigation()
    : { showAdBeforeNavigation: async (callback: () => void) => callback() };

  console.log('[RANKING] User premium status:', {
    isPremium,
    accessLevel: accessLevel ? { hasRealtimeAccess: accessLevel.hasRealtimeAccess, tier: accessLevel.tier } : 'null'
  });

  const { data, isLoading, error, refetch } = useQuery<RankingsResponse>({
    queryKey: queryKeys.rankings.list({ language, limit: 100 }),
    queryFn: async () => {
      console.log('[RANKING] Fetching rankings via apiClient');
      const result = await apiClient.getRankings(language, 100);
      console.log('[RANKING] Rankings data received:', {
        count: result.rankings?.length || 0,
        generatedAt: result.generatedAt
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
    placeholderData: (previousData) => previousData, // 이전 데이터 즉시 표시 - faster perceived loading
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleStockClick = async (item: RankingItem, index: number) => {
    const { ticker, companyName } = item;

    // 앱인토스 환경: 프리미엄 제한 없음, 광고 표시
    if (ENV_CONFIG.isAppintos) {
      console.log('[RANKING] Appintos environment, showing ad before opening details');
      await showAdBeforeNavigation(async () => {
        await openTradeDetailModal(item, ticker, companyName);
      });
      return;
    }

    // 웹 환경: 기존 프리미엄 체크 로직 유지
    if (!isPremium && index < 3) {
      console.log('[RANKING] Free user trying to access top 3 ranking, redirecting to upgrade');
      setLocation('/premium-checkout');
      return;
    }

    // 웹 프리미엄 사용자: 광고 없이 바로 모달 열기
    await openTradeDetailModal(item, ticker, companyName);
  };

  // 거래 상세 모달을 여는 로직 (광고 표시 여부와 무관하게 재사용)
  const openTradeDetailModal = async (item: RankingItem, ticker: string, companyName: string) => {
    try {
      setSelectedTicker(ticker);

      // 새 구조: insiders에 내부자별 그룹화된 정보가 있음 (trades 배열 포함)
      const insiders = item.insiders || [];
      const totalNetBuying = (item as any).totalInsidersNetBuying || item.netBuying;

      // insiders의 trades를 플랫하게 펼쳐서 모든 개별 거래 생성
      const allTrades = insiders.flatMap((insider: any) =>
        (insider.trades || []).map((trade: any) => ({
          ...trade,
          name: insider.name,
          title: insider.title,
          isInstitution: insider.isInstitution,
          // 해당 내부자의 총 거래 횟수 추가 (UI에서 "N회 거래" 표시용)
          insiderTradeCount: insider.tradeCount || 1,
        }))
      );

      // 디버그 로깅 (데이터 확인용)
      console.log(`[Modal] Opening for ${ticker}:`, {
        uniqueInsiders: insiders.length,
        totalTrades: allTrades.length,
        totalNetBuying
      });

      if (allTrades.length === 0) {
        console.log(`No trades found for ${ticker}`);
        alert(t('ranking.alert.noTradeData').replace('{company}', companyName));
        return;
      }

      // Prepare data for multi-trade modal
      const modalData = {
        ticker,
        companyName,
        trades: allTrades, // 모든 개별 거래 (내부자 정보 포함)
        insiders: insiders, // 내부자별 그룹화된 정보 (선택적 사용)
        currentPrice: item.currentPrice,
        marketCap: item.marketCap,
        totalNetBuying: totalNetBuying, // 모달에 표시되는 거래들의 합계와 일치
      };

      setSelectedTradeData(modalData);
      setShowTradeModal(true);
    } catch (error) {
      console.error('Failed to open modal:', error);
      alert(t('ranking.alert.loadFailed'));
    }
  };

  // Deprecated: Old single-trade modal logic below (keeping for reference but not used)
  const _legacyOpenTradeDetailModal = async (item: RankingItem, ticker: string, companyName: string) => {
    try {
      setSelectedTicker(ticker);
      console.log(`[RANKING] Fetching trades for ticker: ${ticker}`);

      let tickerTrades: any[] = [];

      // Try 1: Enhanced API with ticker filter
      try {
        const enhancedUrl = `${ENV_CONFIG.apiBaseUrl.replace('/api', '')}/api/enhanced/trades?ticker=${ticker}&limit=50`;
        console.log(`[RANKING] Enhanced API URL:`, enhancedUrl);
        const response = await fetch(enhancedUrl);
        console.log(`[RANKING] Enhanced API response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`[RANKING] Enhanced API data:`, data);
          tickerTrades = data.data || [];
        }
      } catch (enhancedError) {
        console.warn('[RANKING] Enhanced API failed, trying fallback:', enhancedError);
      }

      // Try 2: If enhanced API didn't return data, try regular API with higher limit
      if (tickerTrades.length === 0) {
        console.log('[RANKING] Trying regular API as fallback...');
        try {
          const allTrades = await apiClient.getInsiderTrades(500, 0);
          tickerTrades = allTrades.filter(trade => trade.ticker === ticker);
          console.log(`[RANKING] Regular API found ${tickerTrades.length} trades for ${ticker}`);
        } catch (apiError) {
          console.warn('[RANKING] Regular API also failed:', apiError);
        }
      }

      // Try 3: Use ranking item's insiders data directly if available
      if (tickerTrades.length === 0 && item.insiders && item.insiders.length > 0) {
        console.log('[RANKING] Using ranking item insiders data as final fallback');
        // Convert insiders to trade format
        tickerTrades = item.insiders.map((insider, idx) => ({
          id: `${ticker}-${idx}`,
          ticker,
          companyName,
          traderName: insider.name,
          traderTitle: insider.title,
          shares: insider.shares,
          pricePerShare: insider.pricePerShare,
          totalValue: insider.totalValue,
          filedDate: insider.date,
          tradeType: insider.tradeType,
          secFilingUrl: insider.secFilingUrl,
          createdAt: insider.date
        }));
      }

      if (tickerTrades && tickerTrades.length > 0) {
        // Sort by filedDate descending to get the most recent trade
        const sortedTrades = tickerTrades.sort((a, b) =>
          new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
        );
        // Use the most recent trade
        const recentTrade = sortedTrades[0];

        // Fetch real comprehensive analysis from API with caching
        let comprehensiveAnalysis = null;
        const cacheKey = `${ticker}_${language}`;

        // Check cache first
        const cached = analysisCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          console.log(`✅ Using cached analysis for ${ticker} (${language})`);
          comprehensiveAnalysis = cached.data;
        } else {
          try {
            console.log(`Fetching comprehensive analysis for trade ${recentTrade.id}...`);
            const response = await fetch(resolveApiUrl(`/api/trades/${recentTrade.id}/comprehensive-analysis?language=${language}`));

            if (response.ok) {
              comprehensiveAnalysis = await response.json();
              console.log('Comprehensive analysis fetched successfully');

              // Store in cache
              analysisCache.set(cacheKey, {
                data: comprehensiveAnalysis,
                timestamp: Date.now()
              });
              console.log(`📦 Cached analysis for ${ticker} (${language})`);
            } else {
              console.warn('Failed to fetch comprehensive analysis, using fallback');
            }
          } catch (analysisError) {
            console.error('Error fetching comprehensive analysis:', analysisError);
          }
        }

        // Calculate additional display metrics
        const buyTrades = tickerTrades.filter(t => t.tradeType === 'BUY' || t.tradeType === 'PURCHASE');
        const sellTrades = tickerTrades.filter(t => t.tradeType === 'SELL' || t.tradeType === 'SALE');
        const buyRatio = buyTrades.length / (buyTrades.length + sellTrades.length);
        // Use real price from ranking item (from API), fallback to trade price
        const currentPrice = item.currentPrice || recentTrade.pricePerShare;

        // Enhance trade data with real analysis
        const enhancedTrade = {
          ...recentTrade,
          companyName: companyName,
          ticker: ticker,
          currentPrice,
          marketCap: item.marketCap,
          totalValue: item.netBuying,
          dataQuality: 75,
          aiInsight: comprehensiveAnalysis
            ? (comprehensiveAnalysis.aiSummary || comprehensiveAnalysis.executiveSummary)
            : `${companyName}의 최근 내부자 거래 활동이 SEC Form 4에 기록되었습니다.`,
          comprehensiveAnalysis: comprehensiveAnalysis || {
            aiSummary: `${companyName}에 대한 데이터를 수집 중입니다.`,
            signalType: recentTrade.tradeType === 'BUY' ? 'BUY' : 'SELL',
            newsAnalysis: null
          }
        };

        setSelectedTradeData(enhancedTrade);
        setShowTradeModal(true);
      } else {
        // If no trades found for this ticker, show info message
        console.log(`No trades found for ${ticker}`);
        alert(t('ranking.alert.noTradeData').replace('{company}', companyName));
      }
    } catch (error) {
      console.error('Failed to fetch trade data:', error);
      alert(t('ranking.alert.loadFailed'));
    }
  };

  // App Store Compliance: Changed from investment recommendations to activity level indicators
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'bg-green-500';  // High activity level
      case 'BUY':
        return 'bg-blue-500';   // Moderate activity level
      default:
        return 'bg-gray-500';   // Low activity level
    }
  };

  // App Store Compliance: Displays activity level, NOT investment advice
  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return t('ranking.strongBuy');  // "High Buy Volume" in translations
      case 'BUY':
        return t('ranking.buy');        // "Buy Activity" in translations
      default:
        return t('ranking.hold');       // "Low Activity" in translations
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const shareRankingCard = async (index: number) => {
    const cardElement = cardRefs.current[index];
    if (!cardElement) return;

    try {
      setSharedCardIndex(index);

      // 약간의 딜레이를 주어 렌더링 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');

      // 모바일 브라우저에서 공유 API 사용
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.share({
          title: `InsiderPulse Ranking: ${data?.rankings[index]?.ticker || 'Stock'}`,
          text: `Check out the insider trading insights for ${data?.rankings[index]?.companyName}!`,
          files: [
            new File([blob], `insider_ranking_${data?.rankings[index]?.ticker}.png`, {
              type: 'image/png'
            })
          ]
        });
      } else {
        // 웹 브라우저의 경우 클립보드로 복사
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `insider_ranking_${data?.rankings[index]?.ticker}.png`;
        link.click();
      }
    } catch (error) {
      console.error('공유 중 오류 발생:', error);
    } finally {
      setSharedCardIndex(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message={t('ranking.loading') || 'Loading rankings...'} />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500/50 bg-red-900/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-400 font-semibold text-lg">
                {t('ranking.noData')}
              </p>
              <p className="text-red-300 text-sm">
                {error instanceof Error ? error.message : String(error)}
              </p>

              {/* 환경 정보 표시 (더 상세하게) */}
              <div className="mt-4 p-4 bg-black/50 rounded text-left text-xs font-mono space-y-1">
                <div><span className="text-yellow-500">Mode:</span> {ENV_CONFIG.isAppintos ? 'Appintos' : 'Browser'}</div>
                <div><span className="text-yellow-500">API URL:</span> {ENV_CONFIG.apiBaseUrl}</div>
                <div><span className="text-yellow-500">Hostname:</span> {window.location.hostname}</div>
                <div><span className="text-yellow-500">Protocol:</span> {window.location.protocol}</div>
                <div><span className="text-yellow-500">Has __APPINTOS__:</span> {!!(window as any).__APPINTOS__ ? 'Yes' : 'No'}</div>
                <div><span className="text-yellow-500">Has Signature:</span> {
                  !!(localStorage.getItem('appintos_signature') || sessionStorage.getItem('appintos_signature')) ? 'Yes' : 'No'
                }</div>
                <div><span className="text-yellow-500">User-Agent:</span> {navigator.userAgent.substring(0, 60)}...</div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleRefresh} variant="outline" className="border-red-500 text-red-400">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('ranking.refreshData')}
                </Button>
                <Button
                  onClick={() => setLocation('/trades')}
                  variant="default"
                >
                  Live Trading 페이지로 이동
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]" data-testid="ranking-page">
      {/* Header */}
      <div className="p-6 border-b border-neutral-900 flex justify-between items-end">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase flex items-center gap-3" data-testid="page-title">
            <span className="truncate">{t('ranking.title')}</span>
            {!isPremium && <div className="bg-amber-900/20 border border-amber-900/50 text-amber-600 p-1 rounded-sm"><Lock size={14} /></div>}
          </h1>
          <p className="text-xs text-neutral-600 mt-1 font-mono uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} />
            {t('ranking.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('ranking.refreshData')}
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 sm:space-y-6">

      {/* Last Updated */}
      {data && (
        <div className="text-right text-xs text-muted-foreground">
          {t('ranking.lastUpdated')}: {new Date(data.generatedAt).toLocaleString(
            language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
            {
              timeZone: 'America/New_York',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }
          )} ET
        </div>
      )}

      {/* Rankings List */}
      <div className="space-y-4">
        {/* Compact Locked Card for Top 3 (Non-Premium Users) */}
        {!isPremium && (
          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => setLocation('/premium-checkout')}
          >
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between gap-2 sm:gap-3 bg-[#0a0a0a]/95 rounded-lg p-2.5 sm:p-3 border border-amber-500/30">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {t('ranking.lockedTitle') || 'Top 3 Premium Rankings'}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 truncate leading-tight">
                      {t('ranking.lockedDescription') || 'Upgrade to unlock top insider picks'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/premium-checkout');
                  }}
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-2 sm:px-3 py-1 text-[10px] sm:text-xs whitespace-nowrap"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {t('ranking.unlockButton') || 'Unlock'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Public Rankings (skip first 3 for non-premium) */}
        {(isPremium ? data?.rankings : data?.rankings.slice(3))?.map((item, index) => {
          const actualIndex = isPremium ? index : index + 3;

          return (
          <Card
            key={item.ticker}
            ref={el => cardRefs.current[actualIndex] = el}
            className="hover-elevate cursor-pointer relative"
            data-testid={`ranking-item-${item.ticker.toLowerCase()}`}
            onClick={() => handleStockClick(item, actualIndex)}
          >
            {/* 공유 버튼 */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 hover:bg-muted/50"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                shareRankingCard(actualIndex);
              }}
            >
              {sharedCardIndex === actualIndex ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>

            <CardContent className="p-3 sm:p-6 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <img
                  src={logoLight}
                  alt="InsiderPulse"
                  className="w-48 sm:w-80 h-auto opacity-20 select-none dark:hidden"
                />
                <img
                  src={logoDark}
                  alt="InsiderPulse"
                  className="w-48 sm:w-80 h-auto opacity-20 select-none hidden dark:block"
                />
              </div>

              <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
                {/* Left side - Company info */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-primary">#{actualIndex + 1}</span>
                  </div>

                  {/* Company Logo */}
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <img
                      src={`https://assets.parqet.com/logos/resolution/${item.ticker}.png`}
                      alt={`${item.companyName} logo`}
                      className="h-16 w-16 rounded-lg object-contain"
                      onError={(e) => {
                        // Fallback to EODHD API if Parqet fails
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('parqet.com')) {
                          target.src = `https://eodhd.com/img/logos/US/${item.ticker}.png`;
                        } else {
                          // Final fallback to Building2 icon
                          if (target) {
                            target.style.display = 'none';
                            const iconDiv = target.parentElement?.querySelector('.fallback-icon') as HTMLElement | null;
                            if (iconDiv) iconDiv.style.display = 'flex';
                          }
                        }
                      }}
                    />
                    <div className="fallback-icon h-16 w-16 bg-muted rounded-lg hidden items-center justify-center" style={{display: 'none'}}>
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-semibold truncate" data-testid={`text-ticker-${item.ticker.toLowerCase()}`}>
                      {item.ticker}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate" data-testid={`text-company-${item.ticker.toLowerCase()}`}>
                      {item.companyName}
                    </p>
                    {/* 추천 이유 (단순화) */}
                    <div className="mt-2 max-w-full overflow-hidden">
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 truncate max-w-full inline-block">
                        {(() => {
                          const insiderCount = item.insiders?.length || 0;
                          const totalTradeCount = item.insiders?.reduce((sum, i: any) => sum + (i.tradeCount || 1), 0) || 0;

                          if (insiderCount > 1) {
                            // "N명의 내부자가 매수"
                            return t('ranking.recommendationSimple').replace('{count}', insiderCount.toString());
                          } else if (insiderCount === 1 && totalTradeCount > 1) {
                            // "1명의 내부자가 N회 매수"
                            return t('ranking.recommendationSingleMultipleTrades').replace('{trades}', totalTradeCount.toString());
                          } else {
                            // "내부자가 $XM 매수"
                            const netBuying = (item as any).totalInsidersNetBuying || item.netBuying;
                            return t('ranking.recommendationSimpleSingle').replace('{amount}', `$${(netBuying/1000000).toFixed(1)}M`);
                          }
                        })()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right side - Recommendation */}
                <div className="flex items-center flex-shrink-0">
                  <Badge
                    className={`${getRecommendationColor(item.recommendation)} text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs md:text-sm whitespace-nowrap`}
                    data-testid={`badge-recommendation-${item.ticker.toLowerCase()}`}
                  >
                    {getRecommendationText(item.recommendation)}
                  </Badge>
                </div>
              </div>

              {/* Bottom section - Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t relative z-10">
                {/* 1. Avg Buy Price */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      ${item.avgTradeValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{t('ranking.avgBuyPrice')}</p>
                  </div>
                </div>

                {/* 2. Current Price with % change from avg buy price */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {item.priceChangePercent !== undefined && item.priceChangePercent > 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  ) : item.priceChangePercent !== undefined && item.priceChangePercent < 0 ? (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate flex items-center gap-1.5">
                      {item.currentPrice ? (
                        <>
                          <span>${item.currentPrice.toFixed(2)}</span>
                          {item.priceChangePercent !== undefined && (
                            <span className={`text-xs sm:text-sm font-bold ${
                              item.priceChangePercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {item.priceChangePercent > 0 ? '+' : ''}{item.priceChangePercent.toFixed(1)}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{t('ranking.currentPrice')}</p>
                  </div>
                </div>

                {/* 3. Total Buy Amount */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{formatCurrency((item as any).totalInsidersNetBuying || item.netBuying)}</p>
                    <p className="text-xs text-muted-foreground truncate">{t('ranking.totalBuyAmount')}</p>
                    {/* Market cap ratio display */}
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                      {(() => {
                        if (!item.marketCap || item.marketCap <= 0) {
                          return `${tModal.marketCapRatio}: -`;
                        }
                        // 모달과 일관성을 위해 totalInsidersNetBuying 사용
                        const displayNetBuying = (item as any).totalInsidersNetBuying || item.netBuying;
                        const ratio = (displayNetBuying / item.marketCap) * 100;
                        let ratioStr;
                        if (ratio >= 10) ratioStr = Math.round(ratio) + '%';
                        else if (ratio >= 1) ratioStr = ratio.toFixed(1) + '%';
                        else if (ratio >= 0.01) ratioStr = ratio.toFixed(2) + '%';
                        else if (ratio >= 0.001) ratioStr = ratio.toFixed(3) + '%';
                        else if (ratio >= 0.0001) ratioStr = ratio.toFixed(4) + '%';
                        else if (ratio >= 0.00001) ratioStr = ratio.toFixed(5) + '%';
                        else if (ratio >= 0.000001) ratioStr = ratio.toFixed(6) + '%';
                        else if (ratio > 0) ratioStr = ratio.toExponential(2) + '%';
                        else ratioStr = '0%';
                        return `${tModal.marketCapRatio}: ${ratioStr}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('ranking.recentTrade')} {formatTimeAgo(item.lastTradeDate)}</span>
                {item.enhancedTrade?.currentPrice && item.enhancedTrade.pricePerShare && (
                  (() => {
                    const priceChange = item.enhancedTrade.currentPrice - item.enhancedTrade.pricePerShare;
                    const percentChange = ((priceChange / item.enhancedTrade.pricePerShare) * 100);
                    const isGain = priceChange > 0;

                    return (
                      <div className="flex flex-col items-end gap-0.5">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold ${
                            isGain
                              ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                              : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                          }`}
                        >
                          {isGain ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isGain ? '+' : ''}{percentChange.toFixed(1)}%
                        </Badge>
                        {/* 가격 수집 시간 표시 */}
                        {(item.enhancedTrade as any)?.priceLastUpdated && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo((item.enhancedTrade as any).priceLastUpdated)}
                          </span>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* 내부자 상세 정보 섹션 */}
              {item.insiders && item.insiders.length > 0 ? (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-base font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('ranking.simultaneousBuyers')}
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full text-sm">
                      {item.insiders.length}
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {item.insiders.slice(0, 4).map((insider, index) => (
                      <div
                        key={`${insider.name}-${index}`}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); // 카드 클릭 이벤트 방지
                          // insider 데이터를 TradeDetailModal 형식으로 변환
                          // Use real price from ranking item (from API), fallback to insider price
                          const currentPrice = item.currentPrice || insider.pricePerShare;
                          const priceTargets = {
                            conservative: insider.pricePerShare * 1.05,
                            realistic: insider.pricePerShare * 1.15,
                            optimistic: insider.pricePerShare * 1.25
                          };

                          const insiderTradeData = {
                            ticker: item.ticker,
                            companyName: item.companyName,
                            traderName: insider.name,
                            traderTitle: insider.title,
                            tradeType: insider.tradeType,
                            shares: insider.shares,
                            pricePerShare: insider.pricePerShare,
                            totalValue: insider.totalValue,
                            filedDate: insider.date,
                            secFilingUrl: insider.secFilingUrl,
                            currentPrice,
                            marketCap: item.marketCap,
                            dataQuality: 75,
                            aiInsight: t('ranking.aiAnalysis.executiveSummary')
                              .replace('{name}', insider.name)
                              .replace('{title}', insider.title)
                              .replace('{company}', item.companyName)
                              .replace('{shares}', insider.shares.toLocaleString())
                              .replace('{price}', insider.pricePerShare.toFixed(2)),
                            comprehensiveAnalysis: {
                              signalType: insider.tradeType === 'BUY' ? 'BUY' : 'SELL',
                              aiSummary: t('ranking.aiAnalysis.executiveSummary')
                                .replace('{name}', insider.name)
                                .replace('{title}', insider.title)
                                .replace('{company}', item.companyName)
                                .replace('{shares}', insider.shares.toLocaleString())
                                .replace('{price}', insider.pricePerShare.toFixed(2)),
                              newsAnalysis: null
                            }
                          };
                          setSelectedTradeData(insiderTradeData);
                          setShowTradeModal(true);
                        }}
                      >
                        {/* 이름과 직책 */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{insider.name}</span>
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              >
                                {t('filter.buy')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insider.title}</p>
                          </div>
                        </div>

                        {/* 거래 상세 정보 */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-white dark:bg-gray-900 rounded p-2.5">
                            <p className="text-muted-foreground mb-1">{t('ranking.buyPrice')}</p>
                            <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                              ${insider.pricePerShare.toFixed(2)}
                            </p>
                            {item.enhancedTrade?.currentPrice && (
                              (() => {
                                const priceChange = item.enhancedTrade.currentPrice - insider.pricePerShare;
                                const percentChange = ((priceChange / insider.pricePerShare) * 100);
                                const isGain = priceChange > 0;

                                return (
                                  <div className="flex flex-col gap-0.5">
                                    <p className={`text-[10px] mt-1 font-medium flex items-center gap-0.5 ${
                                      isGain
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {isGain ? (
                                        <TrendingUp className="h-2.5 w-2.5" />
                                      ) : (
                                        <TrendingDown className="h-2.5 w-2.5" />
                                      )}
                                      {isGain ? '+' : ''}{percentChange.toFixed(1)}%
                                    </p>
                                    {/* 가격 수집 시간 표시 */}
                                    {(item.enhancedTrade as any)?.priceLastUpdated && (
                                      <p className="text-[9px] text-muted-foreground">
                                        {formatTimeAgo((item.enhancedTrade as any).priceLastUpdated)}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded p-2.5">
                            <p className="text-muted-foreground mb-1">{t('ranking.shareCount')}</p>
                            <p className="font-semibold text-sm">
                              {insider.shares.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded p-2.5">
                            <p className="text-muted-foreground mb-1">{t('ranking.totalAmount')}</p>
                            <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                              ${(insider.totalValue / 1000).toFixed(0)}K
                            </p>
                            {/* Market cap ratio for individual insider */}
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                              {(() => {
                                if (!item.marketCap || item.marketCap <= 0) {
                                  return `${tModal.marketCapRatio}: -`;
                                }
                                const ratio = (insider.totalValue / item.marketCap) * 100;
                                let ratioStr;
                                if (ratio >= 10) ratioStr = Math.round(ratio) + '%';
                                else if (ratio >= 1) ratioStr = ratio.toFixed(1) + '%';
                                else if (ratio >= 0.01) ratioStr = ratio.toFixed(2) + '%';
                                else if (ratio >= 0.001) ratioStr = ratio.toFixed(3) + '%';
                                else if (ratio >= 0.0001) ratioStr = ratio.toFixed(4) + '%';
                                else if (ratio >= 0.00001) ratioStr = ratio.toFixed(5) + '%';
                                else if (ratio >= 0.000001) ratioStr = ratio.toFixed(6) + '%';
                                else if (ratio > 0) ratioStr = ratio.toExponential(2) + '%';
                                else ratioStr = '0%';
                                return `${tModal.marketCapRatio}: ${ratioStr}`;
                              })()}
                            </p>
                          </div>
                        </div>

                        {/* 거래 시간 */}
                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{t('ranking.tradeDate')} {formatTimeAgo(insider.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Past Performance Section */}
      <PastPerformanceSection className="mt-4" />

      {/* Empty state */}
      {data && data.rankings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('ranking.noData')}</h3>
            <p className="text-muted-foreground mb-4">
              No ranking data available for the current period.
              {data.meta?.recencyDays && (
                <span className="block mt-2 text-sm">
                  {t('ranking.checkedLastNDays').replace('{days}', String(data.meta.recencyDays))}
                </span>
              )}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('ranking.refreshData')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ticker Trades Modal - Shows ALL trades for a ticker */}
      <TickerTradesModal
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        ticker={selectedTicker || ''}
        companyName={selectedTradeData?.companyName || ''}
        trades={selectedTradeData?.trades || []}
        currentPrice={selectedTradeData?.currentPrice}
        marketCap={selectedTradeData?.marketCap || null}
        totalNetBuying={selectedTradeData?.totalNetBuying || 0}
      />

      {/* 워치리스트 추가 성공 모달 */}
      {showWatchlistModal && selectedTradeForAlert && (
        <div className="modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-emerald-900/95 to-teal-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <Card className="bg-transparent border-none shadow-none">
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                      추가 완료!
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    이제 <span className="font-semibold text-emerald-300">'내 워치리스트'</span> 탭에서
                    <span className="font-semibold text-teal-300"> {selectedTradeForAlert.ticker}</span>의
                    내부자 거래 정보만 따로 볼 수 있습니다.
                  </p>

                  {/* 추가 기능 힌트 */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Bell className="h-3 w-3" />
                      <span>실시간 알림 설정도 가능합니다</span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowWatchlistModal(false)}
                    className="btn-professional flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white rounded-xl h-12"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('general.close')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWatchlistModal(false);
                    }}
                    className="btn-professional flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-12 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      확인
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Debug Panel - 임시로 항상 표시 (진단용) */}
      <DebugPanel />
      </div>
    </div>
  );
}