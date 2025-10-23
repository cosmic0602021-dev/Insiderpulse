import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  Wifi, WifiOff, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Database, Shield
} from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
import { dataValidator, dataFreshnessMonitor } from '@/lib/data-validation';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';
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
  const [dataQuality, setDataQuality] = useState<DataQualityStatus | null>(null);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTradeClick = (trade: InsiderTrade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  // 실제 데이터만 가져오기 - 가짜 데이터 완전 차단 - 최신 제출일순 정렬
  const { data: allTrades, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: 100,
      offset: 0,
      sortBy: 'filedDate'
    }),
    queryFn: () => apiClient.getInsiderTrades(100, 0, undefined, undefined, 'filedDate'),
    staleTime: 60000, // 1분 캐시
    refetchInterval: 300000, // 5분마다 자동 갱신
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  // WebSocket for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  // 실제 데이터 검증 및 필터링
  const validatedData = useMemo(() => {
    if (!allTrades) return { trades: [], quality: null };

    console.log('🔍 Validating trades data...');
    const validation = dataValidator.validateTrades(allTrades);
    const freshness = dataFreshnessMonitor.checkDataFreshness(validation.validTrades);

    const quality: DataQualityStatus = {
      isValid: validation.summary.valid > 0,
      isFresh: freshness.isFresh,
      validTradeCount: validation.summary.valid,
      totalTradeCount: validation.summary.total,
      lastUpdateAge: freshness.lastTradeAge,
      issues: [...validation.summary.issues, ...freshness.warnings]
    };

    console.log(`✅ Data validation complete: ${validation.summary.valid}/${validation.summary.total} valid trades`);
    if (validation.invalidTrades.length > 0) {
      console.warn(`🚨 Filtered out ${validation.invalidTrades.length} invalid/fake trades`);
    }

    setDataQuality(quality);
    setLastValidationTime(new Date());

    return {
      trades: validation.validTrades,
      quality
    };
  }, [allTrades]);

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
    <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
      {/* 데이터 품질 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
        {/* 연결 상태 */}
        <Alert className={isConnected ? 'border-green-500/50 bg-green-50' : 'border-red-500/50 bg-red-50'}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={isConnected ? 'text-green-700' : 'text-red-700'}>
              {isConnected ? t('liveTrading.connectionActive') : t('connection.connectionLost')}
            </AlertDescription>
          </div>
        </Alert>

        {/* 데이터 품질 */}
        <Alert className={dataQuality?.isValid ? 'border-blue-500/50 bg-blue-50' : 'border-yellow-500/50 bg-yellow-50'}>
          <div className="flex items-center gap-2">
            {dataQuality?.isValid ? (
              <CheckCircle className="h-4 w-4 text-blue-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={dataQuality?.isValid ? 'text-blue-700' : 'text-yellow-700'}>
              {t('liveTrading.verifiedTrades')}: {dataQuality?.validTradeCount || 0}{t('liveTrading.count')}
            </AlertDescription>
          </div>
        </Alert>

        {/* 데이터 신선도 */}
        <Alert className={dataQuality?.isFresh ? 'border-green-500/50 bg-green-50' : 'border-orange-500/50 bg-orange-50'}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertDescription className={dataQuality?.isFresh ? 'text-green-700' : 'text-orange-700'}>
              {dataQuality?.isFresh ? t('liveTrading.freshData') : t('liveTrading.dataUpdateNeeded')}
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {/* 데이터 품질 경고 */}
      {dataQuality?.issues && dataQuality.issues.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <div className="font-semibold mb-1">{t('liveTrading.qualityWarnings')}</div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {dataQuality.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 헤더 */}
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

      {/* 통계 카드 - 모바일 최적화 */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('liveTrading.todayTrades')}</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.todayTrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('liveTrading.totalVolume')}</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('liveTrading.verifiedTrades')}</CardTitle>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{dataQuality?.validTradeCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('liveTrading.activeInsiders')}</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {new Set(validatedData.trades.map(t => t.traderName)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 거래 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('liveTrading.verifiedTradesList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validatedData.trades.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('liveTrading.noValidatedTrades')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('liveTrading.collectorRunning')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {validatedData.trades.slice(0, 50).map((trade) => {
                const pricePerShare = trade.pricePerShare || (trade.totalValue / (trade.shares || 1));
                const isRecent = trade.createdAt && new Date(trade.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000); // 24시간 이내

                return (
                  <div
                    key={trade.id}
                    className="border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer hover-elevate p-3 overflow-hidden"
                    onClick={() => handleTradeClick(trade)}
                    data-testid={`trade-card-${trade.id}`}
                  >
                    {/* 모바일 최적화: 반응형 레이아웃 */}
                    <div className="flex flex-col gap-3">
                      {/* 상단: 회사 정보 */}
                      <div className="flex items-start gap-3">
                        {/* 거래 타입 아이콘 */}
                        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted ${getTradeTypeColor(trade.tradeType)}`}>
                          {getTradeTypeIcon(trade.tradeType)}
                        </div>

                        {/* 회사 & 트레이더 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-base sm:text-lg">{trade.companyName}</span>
                            <Badge variant="outline" className="font-mono text-xs flex-shrink-0">{trade.ticker}</Badge>
                            {isRecent && (
                              <Badge variant="destructive" className="text-xs animate-pulse flex-shrink-0">NEW</Badge>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {trade.traderName} • {trade.traderTitle}
                          </div>
                        </div>
                      </div>

                      {/* 하단: 거래 세부정보 */}
                      <div className="flex items-center justify-between gap-3">
                        {/* 왼쪽: 주식 정보 */}
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="font-semibold">{trade.shares?.toLocaleString()}</span>
                          <span className="text-muted-foreground">주 @</span>
                          <span className="font-semibold">${pricePerShare.toFixed(2)}</span>
                        </div>

                        {/* 오른쪽: 금액 & 시간 */}
                        <div className="flex flex-col items-end gap-1">
                          {/* 거래 금액 */}
                          <div className={`text-lg sm:text-xl font-bold ${getTradeTypeColor(trade.tradeType)}`}>
                            {formatCurrency(Math.abs(trade.totalValue))}
                          </div>

                          {/* 업데이트 시간 */}
                          <div className="flex items-center gap-2">
                            {trade.createdAt && (
                              <div className="text-xs text-muted-foreground">
                                {formatTimeAgo(trade.createdAt)}
                              </div>
                            )}
                            {trade.secFilingUrl && (
                              <div className="text-xs text-blue-600 hover:underline">
                                SEC ↗
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
        </CardContent>
      </Card>

      {/* AI 분석 인사이트 모달 */}
      <TradeDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        trade={selectedTrade}
        data-testid="trade-detail-modal"
      />
    </div>
  );
}