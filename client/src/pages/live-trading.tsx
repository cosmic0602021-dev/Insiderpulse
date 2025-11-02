import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  Wifi, WifiOff, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Database, Shield, Info, Search, X
} from 'lucide-react';
import { apiClient, queryKeys, type TradesResponse } from '@/lib/api';
import { useAccess } from '@/contexts/access-context';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { dataValidator, dataFreshnessMonitor } from '@/lib/data-validation';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { LockedTradesSection } from '@/components/locked-trade-card';
import { FreeZoneBanner } from '@/components/free-zone-banner';
import { TrialTimerBanner, TrialExpiredBanner } from '@/components/trial-timer-banner';
import { FOMOAlertManager } from '@/components/fomo-alerts';
import { AISignalFeed } from '@/components/ai-signal-feed';
import { ShareButton } from '@/components/social-share';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';
import { useLocation } from 'wouter';
import type { InsiderTrade } from '@shared/schema';

interface DataQualityStatus {
  isValid: boolean;
  isFresh: boolean;
  validTradeCount: number;
  totalTradeCount: number;
  lastUpdateAge: number;
  issues: string[];
}

export default function LiveTrading() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { accessLevel, setAccessLevel, refreshAccessLevel } = useAccess();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [, navigate] = useLocation();
  const [dataQuality, setDataQuality] = useState<DataQualityStatus | null>(null);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedCount, setLoadedCount] = useState(100);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        const items = JSON.parse(saved);
        setWatchlist(items.map((item: any) => item.ticker));
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  }, []);

  // Load trial status on mount
  useEffect(() => {
    const loadTrialStatus = async () => {
      try {
        const status = await apiClient.getTrialStatus();
        setIsTrialing(status.isTrialing);
        setHasUsedTrial(status.hasUsedTrial);
        if (status.trialExpiresAt) {
          setTrialExpiresAt(status.trialExpiresAt);
        }
      } catch (error) {
        console.error('Failed to load trial status:', error);
      }
    };
    loadTrialStatus();
  }, []);

  const handleTradeClick = (trade: InsiderTrade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const handleAddToWatchlist = (trade: any) => {
    try {
      const saved = localStorage.getItem('watchlist');
      const existing = saved ? JSON.parse(saved) : [];

      // 토글 방식: 이미 있으면 제거, 없으면 추가
      const alreadyExists = existing.some((item: any) => item.ticker === trade.ticker);
      
      let updated;
      if (alreadyExists) {
        // 와치리스트에서 제거
        updated = existing.filter((item: any) => item.ticker !== trade.ticker);
        setWatchlist(updated.map((item: any) => item.ticker));
      } else {
        // 와치리스트에 추가
        const newItem = {
          ticker: trade.ticker,
          companyName: trade.companyName,
          addedAt: new Date().toISOString(),
          notificationsEnabled: true, // 기본적으로 알림 켜진 상태
        };
        updated = [...existing, newItem];
        setWatchlist(updated.map((item: any) => item.ticker));
      }

      localStorage.setItem('watchlist', JSON.stringify(updated));

      // Trigger update event for sidebar
      window.dispatchEvent(new Event('watchlistUpdate'));
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  const handleUpgrade = () => {
    navigate('/premium-checkout');
  };

  const handleUnlock = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show auth modal with signup mode
      openAuthModal('signup');
      return;
    }

    try {
      console.log('🎯 Activating 7-day trial...');
      const result = await apiClient.activateTrial();

      if (result.success) {
        console.log('✅ Trial activated successfully:', result);
        alert(`🎉 ${result.message}\n\nYour 7-day free trial is now active! Enjoy real-time insider trading data.`);

        // Update trial state
        setIsTrialing(true);
        setHasUsedTrial(true);
        if (result.expiresAt) {
          setTrialExpiresAt(result.expiresAt);
        }

        // Refresh access level from server
        await refreshAccessLevel();

        // Refresh the page to show unlocked data
        refetch();
      } else {
        console.warn('⚠️ Trial activation failed:', result.message);
        alert(`❌ ${result.message || result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Trial activation error:', error);
      alert(`Error: ${error.message || 'Failed to activate trial'}`);
    }
  };

  // 실제 데이터만 가져오기 - 가짜 데이터 완전 차단 - SEC 파일링 날짜순 정렬 (filedDate)
  const { data: tradesResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: loadedCount,
      offset: 0,
      sortBy: 'filedDate'
    }),
    queryFn: async () => {
      const response = await apiClient.getInsiderTradesWithAccess(loadedCount, 0, undefined, undefined, 'filedDate');
      // Update global access level
      if (response.accessLevel) {
        setAccessLevel(response.accessLevel);
      }
      return response;
    },
    staleTime: 30000, // 30초 캐시
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간 업데이트)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Memoize allTrades to prevent unnecessary re-renders from empty array creation
  const allTrades = useMemo(() => tradesResponse?.trades || [], [tradesResponse?.trades]);

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 30000,
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간 업데이트)
  });

  // WebSocket for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  // 실제 데이터 검증 및 필터링
  const validatedData = useMemo(() => {
    if (!allTrades) return { trades: [], quality: null };

    const validation = dataValidator.validateTrades(allTrades);
    const freshness = dataFreshnessMonitor.checkDataFreshness(validation.validTrades);

    // 매수/매도만 필터링 (GRANT, OPTION_EXERCISE 등 제외)
    const buySellTrades = validation.validTrades.filter(trade => {
      const tradeType = trade.tradeType?.toUpperCase() || '';
      return tradeType.includes('BUY') ||
             tradeType.includes('PURCHASE') ||
             tradeType.includes('SELL') ||
             tradeType.includes('SALE');
    });

    const quality: DataQualityStatus = {
      isValid: buySellTrades.length > 0,
      isFresh: freshness.isFresh,
      validTradeCount: buySellTrades.length,
      totalTradeCount: validation.summary.total,
      lastUpdateAge: freshness.lastTradeAge,
      issues: [...validation.summary.issues, ...freshness.warnings]
    };

    return {
      trades: buySellTrades,
      quality
    };
  }, [allTrades]);

  // Update state based on validated data - Fixed: Use allTrades as dependency to prevent infinite loop
  // This ensures the effect only runs when the source data changes, not when the computed object reference changes
  useEffect(() => {
    if (validatedData.quality) {
      setDataQuality(validatedData.quality);
      setLastValidationTime(new Date());
    }
  }, [allTrades]);

  // 검색 필터링
  const filteredTrades = useMemo(() => {
    if (!searchQuery.trim()) {
      return validatedData.trades;
    }

    const query = searchQuery.toLowerCase().trim();
    return validatedData.trades.filter(trade => {
      return (
        trade.companyName?.toLowerCase().includes(query) ||
        trade.ticker?.toLowerCase().includes(query) ||
        trade.traderName?.toLowerCase().includes(query) ||
        trade.traderTitle?.toLowerCase().includes(query)
      );
    });
  }, [validatedData.trades, searchQuery]);

  // WebSocket 메시지 처리
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'NEW_TRADE':
          console.log('🔄 New trade received, revalidating data...');
          queryClient.invalidateQueries({ queryKey: queryKeys.stats });
          queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
          break;
      }
    }
  }, [lastMessage, queryClient]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    const locale = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: string | Date) => {
    const locale = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
    const dateObj = new Date(date);

    // SEC 파일링 날짜는 UTC 날짜만 있음 (시간 정보 없음)
    // 정확한 UTC 날짜만 표시
    const filedDateStr = dateObj.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });

    return `${filedDateStr} (UTC)`;
  };

  const formatTimeAgo = (date: string | Date) => {
    const dateLocale = language === 'ko' ? ko : language === 'ja' ? ja : language === 'zh' ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: dateLocale 
    });
  };

  const getTradeTypeColor = (tradeType: string) => {
    const type = tradeType.toUpperCase();
    if (type.includes('BUY') || type.includes('PURCHASE')) return 'text-green-600';
    if (type.includes('SELL') || type.includes('SALE')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTradeTypeIcon = (tradeType: string) => {
    const type = tradeType.toUpperCase();
    if (type.includes('BUY') || type.includes('PURCHASE')) return <TrendingUp className="h-4 w-4" />;
    if (type.includes('SELL') || type.includes('SALE')) return <TrendingDown className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('liveTrading.loadingRealData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {t('liveTrading.dataLoadingFailed')}: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
      {/* FOMO Alert Manager - All FOMO alerts */}
      <FOMOAlertManager
        trialExpiresAt={trialExpiresAt}
        isTrialing={isTrialing}
        hasTrial={hasUsedTrial}
        recentLockedTrades={validatedData.trades.slice(0, 5).map(t => ({
          companyName: t.companyName,
          ticker: t.ticker || '',
          totalValue: t.totalValue,
          traderTitle: t.traderTitle || 'Insider',
        }))}
        onUpgrade={handleUpgrade}
        onUnlock={handleUnlock}
      />

      {/* Trial Timer Banner - Active trial countdown */}
      {isTrialing && trialExpiresAt && (
        <TrialTimerBanner trialExpiresAt={trialExpiresAt} />
      )}

      {/* Free Zone Banner - 48h delay notice */}
      {accessLevel && !accessLevel.hasRealtimeAccess && !isTrialing && accessLevel.delayHours > 0 && (
        <FreeZoneBanner delayHours={accessLevel.delayHours} />
      )}

      {/* 헤더 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{t('page.livetrading.title')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('page.livetrading.subtitle')}
            </p>
            {/* 마지막 업데이트 시간 표시 */}
            {lastValidationTime && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('liveTrading.lastUpdated')}: {formatTimeAgo(lastValidationTime)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ShareButton variant="outline" size="sm" />
            <Button onClick={() => refetch()} variant="outline" size="sm" className="flex-1 sm:flex-initial">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('general.refresh')}</span>
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">{t('liveTrading.realData')}</span>
            </Badge>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('page.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 검색 결과 카운트 */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredTrades.length}{t('search.tradesFound')}
            {filteredTrades.length !== validatedData.trades.length && (
              <span className="ml-1">
                {t('search.outOfTotal').replace('{total}', validatedData.trades.length.toString())}
              </span>
            )}
          </div>
        )}
      </div>

      {/* AI Signal Feed - Top 3 Recommendations */}
      {accessLevel && accessLevel.hasRealtimeAccess && validatedData.trades.length > 0 && (
        <AISignalFeed trades={validatedData.trades} limit={3} />
      )}

      {/* Locked Real-Time Trades Section - FOMO Zone */}
      {accessLevel && !accessLevel.hasRealtimeAccess && (
        <LockedTradesSection
          trades={validatedData.trades.slice(0, 5)} // Show 5 locked trades as teaser
          onUnlock={handleUnlock}
        />
      )}

      {/* 거래 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('liveTrading.verifiedTradesList')}
            {accessLevel && !accessLevel.hasRealtimeAccess && (
              <Badge variant="outline" className="text-xs">
                {t('freeZone.delayedData')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다' : t('liveTrading.noValidatedTrades')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery ? '다른 키워드로 검색해보세요' : t('liveTrading.collectorRunning')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrades.map((trade) => {
                const pricePerShare = trade.pricePerShare || (trade.totalValue / (trade.shares || 1));
                const isRecent = trade.createdAt && new Date(trade.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000); // 24시간 이내

                return (
                  <div
                    key={trade.id}
                    className="border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer hover-elevate p-3 w-full"
                    onClick={() => handleTradeClick(trade)}
                    data-testid={`trade-card-${trade.id}`}
                  >
                    {/* 모바일 최적화: 반응형 레이아웃 */}
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      {/* 상단: 회사 정보 */}
                      <div className="flex items-start gap-2 w-full min-w-0">
                        {/* 거래 타입 아이콘 */}
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted ${getTradeTypeColor(trade.tradeType)}`}>
                          {getTradeTypeIcon(trade.tradeType)}
                        </div>

                        {/* 회사 & 트레이더 정보 */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start gap-1 mb-1 w-full min-w-0 flex-wrap">
                            <span className="font-bold text-sm sm:text-base break-words max-w-full">{trade.companyName}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="outline" className="font-mono text-xs">{trade.ticker}</Badge>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground break-words max-w-full">
                            {trade.traderName} • {trade.traderTitle}
                          </div>
                        </div>
                      </div>

                      {/* 하단: 거래 세부정보 */}
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        {/* 왼쪽: 주식 정보 */}
                        <div className="flex items-center gap-1 text-xs flex-shrink-0">
                          <span className="font-semibold">{trade.shares?.toLocaleString()}</span>
                          <span className="text-muted-foreground">{t('liveTrading.shares')} @</span>
                          <span className="font-semibold">${pricePerShare.toFixed(2)}</span>
                        </div>

                        {/* 오른쪽: 금액 & 시간 */}
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          {/* 거래 금액 */}
                          <div className={`text-base sm:text-lg font-bold ${getTradeTypeColor(trade.tradeType)}`}>
                            {formatCurrency(Math.abs(trade.totalValue))}
                          </div>

                          {/* 업데이트 시간 */}
                          <div className="flex items-center gap-1">
                            {trade.createdAt && (
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(trade.createdAt)}
                              </div>
                            )}
                            {trade.secFilingUrl && (
                              <div className="text-xs text-blue-600">
                                SEC
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 더 보기 버튼 */}
          {filteredTrades.length > 0 && filteredTrades.length >= loadedCount && !searchQuery && (
            <div className="flex justify-center pt-6 border-t mt-6">
              <Button
                onClick={() => {
                  setLoadedCount(prev => prev + 100);
                }}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                더 많은 거래 내역 보기 (+100개)
              </Button>
            </div>
          )}

          {/* 현재 표시 중인 개수 */}
          {filteredTrades.length > 0 && (
            <div className="text-center text-sm text-muted-foreground pt-4">
              {searchQuery ? (
                <>검색된 {filteredTrades.length}개의 거래 표시 중</>
              ) : (
                <>최근 {filteredTrades.length}개의 거래 표시 중</>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 분석 인사이트 모달 */}
      <TradeDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        trade={selectedTrade}
        onAddToWatchlist={handleAddToWatchlist}
        isInWatchlist={selectedTrade?.ticker ? watchlist.includes(selectedTrade.ticker) : false}
        data-testid="trade-detail-modal"
      />
      </div>
    </div>
  );
}