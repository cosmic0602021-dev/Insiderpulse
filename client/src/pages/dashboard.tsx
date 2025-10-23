import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardStats from '@/components/dashboard-stats';
import TradeList from '@/components/trade-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
import { dataValidator, dataFreshnessMonitor } from '@/lib/data-validation';
import type { TradingStats, InsiderTrade, AIAnalysis } from '@shared/schema';

export default function Dashboard() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [currentOffset, setCurrentOffset] = useState(0);
  const [allTrades, setAllTrades] = useState<InsiderTrade[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [dateRange, setDateRange] = useState<{ fromDate?: Date; toDate?: Date }>({});
  const [sortBy, setSortBy] = useState<string>('filedDate');
  
  // Real API data queries
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: rawTrades, isLoading: tradesLoading, refetch: refetchTrades, error: tradesError } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: 100, // Increased for Top Stocks calculation
      offset: 0,
      from: dateRange.fromDate?.toISOString().split('T')[0],
      to: dateRange.toDate?.toISOString().split('T')[0],
      sortBy
    }),
    queryFn: () => apiClient.getInsiderTrades(100, 0, dateRange.fromDate, dateRange.toDate, sortBy),
    staleTime: 1 * 60 * 1000, // 1 minute for more frequent updates
  });

  // 🚨 실제 데이터 검증 - 가짜 데이터 완전 차단
  const validatedData = useMemo(() => {
    if (!rawTrades) return { trades: [], isValid: true, issues: [] };

    console.log('🔍 Dashboard: Validating trades data...');
    const validation = dataValidator.validateTrades(rawTrades);
    const freshness = dataFreshnessMonitor.checkDataFreshness(validation.validTrades);

    if (validation.invalidTrades.length > 0) {
      console.warn(`🚨 Dashboard: Filtered out ${validation.invalidTrades.length} invalid/fake trades`);
    }

    return {
      trades: validation.validTrades,
      isValid: validation.summary.valid > 0,
      issues: [...validation.summary.issues, ...freshness.warnings],
      validCount: validation.summary.valid,
      totalCount: validation.summary.total
    };
  }, [rawTrades]);

  const trades = validatedData.trades;
  
  // WebSocket connection for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    switch (lastMessage.type) {
      case 'WELCOME':
        console.log('Connected to InsiderTrack Pro live feed');
        // Subscribe to trade updates
        sendMessage({ type: 'SUBSCRIBE_TRADES' });
        break;
        
      case 'NEW_TRADE':
        console.log('New trade received via WebSocket:', lastMessage.data);
        // Invalidate and refetch data (but don't spam)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.stats });
          queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
        }, 1000); // Debounce updates
        break;
        
      case 'SUBSCRIBED':
        console.log('Subscribed to', lastMessage.channel);
        break;
        
      default:
        console.log('Unknown WebSocket message:', lastMessage.type);
    }
  }, [lastMessage, sendMessage, queryClient]);
  
  // Initialize trades list (only on first load, not on WebSocket updates)
  useEffect(() => {
    if (trades && currentOffset === 0) {
      setAllTrades(trades);
      // Set hasMoreData based on first page size
      setHasMoreData(trades.length >= 20);
    }
  }, [trades, currentOffset]);
  
  const handleLoadMore = async () => {
    console.log('Load more clicked');
    console.log('Loading more trades...');

    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      const newOffset = currentOffset + 20;
      const rawMoreTrades = await apiClient.getInsiderTrades(20, newOffset, dateRange.fromDate, dateRange.toDate, sortBy);

      // 🚨 추가 데이터도 검증
      const validation = dataValidator.validateTrades(rawMoreTrades);
      const validMoreTrades = validation.validTrades;

      if (validation.invalidTrades.length > 0) {
        console.warn(`🚨 Dashboard: Filtered out ${validation.invalidTrades.length} invalid trades from load more`);
      }

      if (validMoreTrades.length === 0) {
        setHasMoreData(false);
      } else {
        setAllTrades(prev => [...prev, ...validMoreTrades]);
        setCurrentOffset(newOffset);

        // If we got less than requested amount, probably no more data
        if (validMoreTrades.length < 20) {
          setHasMoreData(false);
        }
      }
    } catch (error) {
      console.error('Failed to load more trades:', error);
      alert(t('dashboard.loadMoreTradesError'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDateRangeChange = (fromDate?: Date, toDate?: Date) => {
    setDateRange({ fromDate, toDate });
    setCurrentOffset(0);
    setAllTrades([]);
    setHasMoreData(true);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentOffset(0);
    setAllTrades([]);
    setHasMoreData(true);
  };
  
  // No AI analysis - just pass trades directly
  // For TradeList display, limit to 20 initially (will load more with button)
  const tradesData = allTrades.length > 0 ? allTrades.slice(0, 20) : trades.slice(0, 20);

  // Calculate top stocks by grouping trades by ticker symbol
  const topStocks = useMemo(() => {
    // Use ALL trades (100) for better Top Stocks calculation, not just the 20 displayed
    console.log('🔍 Top Stocks - Using', trades.length, 'trades for calculation');

    if (!trades || trades.length === 0) {
      console.log('❌ Top Stocks - No data available');
      return [];
    }

    // Group trades by ticker symbol
    const stockGroups = trades.reduce((acc, trade) => {
      const key = trade.tickerSymbol;
      if (!acc[key]) {
        acc[key] = {
          symbol: trade.tickerSymbol,
          companyName: trade.companyName,
          trades: []
        };
      }
      acc[key].trades.push(trade);
      return acc;
    }, {} as Record<string, { symbol: string; companyName: string; trades: InsiderTrade[] }>);

    // Convert to array and sort by number of trades (most active stocks)
    const topStocksResult = Object.values(stockGroups)
      .sort((a, b) => b.trades.length - a.trades.length)
      .slice(0, 3); // Top 3 stocks

    console.log('✅ Top Stocks calculated:', topStocksResult.map(s => `${s.symbol} (${s.trades.length} trades)`));
    return topStocksResult;
  }, [trades]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-3 sm:space-y-6 p-3 sm:p-6" data-testid="dashboard">
      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert className={isConnected ? 'border-chart-2/50 bg-chart-2/10' : 'border-destructive/50 bg-destructive/10'}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-chart-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={isConnected ? 'text-chart-2' : 'text-destructive'}>
              {isConnected ? t('connection.liveFeedActive') : t('connection.connectionLost')}
            </AlertDescription>
          </div>
        </Alert>

        {/* Data Validation Status */}
        <Alert className={validatedData.isValid ? 'border-blue-500/50 bg-blue-50' : 'border-yellow-500/50 bg-yellow-50'}>
          <div className="flex items-center gap-2">
            {validatedData.isValid ? (
              <Shield className="h-4 w-4 text-blue-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={validatedData.isValid ? 'text-blue-700' : 'text-yellow-700'}>
              {t('liveTrading.validatedData')}: {validatedData.validCount || 0}/{validatedData.totalCount || 0}{t('liveTrading.count')}
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {/* Data Quality Warning */}
      {validatedData.issues && validatedData.issues.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <div className="font-semibold mb-1">데이터 품질 주의사항:</div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validatedData.issues.slice(0, 3).map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
              {validatedData.issues.length > 3 && (
                <li className="text-xs text-yellow-600">그 외 {validatedData.issues.length - 3}개 문제</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="page-title">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('page.dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-md animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <DashboardStats stats={stats} />
      ) : (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {t('stats.failedLoad')} {statsError ? `Error: ${statsError.message}` : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          {tradesLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted/50 rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <TradeList 
              trades={tradesData}
              loading={false}
              loadingMore={loadingMore}
              hasMoreData={hasMoreData}
              onLoadMore={handleLoadMore}
              onDateRangeChange={handleDateRangeChange}
              onSortChange={handleSortChange}
            />
          )}
        </Card>
        
        <div className="space-y-4">
          {/* Trading Summary */}
          <Card data-testid="trading-summary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                {t('stats.tradingSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-chart-2/10 rounded-md border border-chart-2/20">
                <div className="text-sm font-medium text-chart-2 mb-1">{t('dashboardStats.recentActivity')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('dashboardStats.monitoring')}
                </div>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-md border border-chart-3/20">
                <div className="text-sm font-medium text-chart-3 mb-1">{t('dashboardStats.marketCoverage')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('dashboardStats.realTimeAnalysis')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Stocks */}
          <Card data-testid="top-stocks">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboardStats.topStocks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStocks.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    {t('dashboardStats.noData')}
                  </div>
                ) : (
                  topStocks.map((stock) => (
                    <div key={stock.symbol} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                      {/* Stock Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div>
                          <div className="font-mono text-sm font-semibold">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">{stock.companyName}</div>
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {stock.trades.length} {t('dashboardStats.trades')}
                        </div>
                      </div>

                      {/* Individual Trades */}
                      <div className="space-y-2">
                        {stock.trades.slice(0, 3).map((trade, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded p-2 space-y-1">
                            {/* Name and Position */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{trade.insiderName}</div>
                                <div className="text-xs text-muted-foreground truncate">{trade.insiderPosition}</div>
                              </div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(trade.filedDate).toLocaleDateString(t('locale'), { month: 'short', day: 'numeric' })}
                              </div>
                            </div>

                            {/* Trade Details */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">{t('dashboardStats.shares')}</div>
                                <div className="font-medium">{trade.shares?.toLocaleString() || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">{t('dashboardStats.price')}</div>
                                <div className="font-medium">${trade.price?.toFixed(2) || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">{t('dashboardStats.total')}</div>
                                <div className="font-medium text-amber-600 dark:text-amber-500">
                                  ${((trade.shares || 0) * (trade.price || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show more indicator */}
                        {stock.trades.length > 3 && (
                          <div className="text-xs text-center text-muted-foreground pt-1">
                            +{stock.trades.length - 3} {t('dashboardStats.moreTrades')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}