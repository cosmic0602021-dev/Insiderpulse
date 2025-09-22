import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardStats from '@/components/dashboard-stats';
import TradeList from '@/components/trade-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
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
  
  const { data: trades, isLoading: tradesLoading, refetch: refetchTrades, error: tradesError } = useQuery({
    queryKey: queryKeys.trades.list({ 
      limit: 20, 
      offset: 0, 
      from: dateRange.fromDate?.toISOString().split('T')[0],
      to: dateRange.toDate?.toISOString().split('T')[0],
      sortBy 
    }),
    queryFn: () => apiClient.getInsiderTrades(20, 0, dateRange.fromDate, dateRange.toDate, sortBy),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
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
      const moreTrades = await apiClient.getInsiderTrades(20, newOffset, dateRange.fromDate, dateRange.toDate, sortBy);
      
      if (moreTrades.length === 0) {
        setHasMoreData(false);
      } else {
        setAllTrades(prev => [...prev, ...moreTrades]);
        setCurrentOffset(newOffset);
        
        // If we got less than requested amount, probably no more data
        if (moreTrades.length < 20) {
          setHasMoreData(false);
        }
      }
    } catch (error) {
      console.error('Failed to load more trades:', error);
      // TODO: Show user-friendly error notification
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
  const tradesData = allTrades || [];

  return (
    <div className="space-y-6 p-6" data-testid="dashboard">
      {/* Connection Status */}
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

          {/* Top Movers */}
          <Card data-testid="top-movers">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboardStats.topMovers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { symbol: 'NVDA', name: 'NVIDIA Corp', change: '+3.2%', volume: '$7.0M', positive: true },
                  { symbol: 'MSFT', name: 'Microsoft Corp', change: '+1.8%', volume: '$6.3M', positive: true },
                  { symbol: 'AAPL', name: 'Apple Inc', change: '+2.1%', volume: '$4.6M', positive: true }
                ].map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2 rounded hover-elevate cursor-pointer"
                       onClick={() => console.log(`Top mover ${stock.symbol} clicked`)}
                       data-testid={`top-mover-${stock.symbol.toLowerCase()}`}>
                    <div>
                      <div className="font-mono text-sm font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        stock.positive ? 'text-chart-2' : 'text-destructive'
                      }`}>
                        {stock.change}
                      </div>
                      <div className="text-xs text-muted-foreground">{stock.volume}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}