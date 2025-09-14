import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardStats from '@/components/dashboard-stats';
import TradeList from '@/components/trade-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import type { TradingStats, InsiderTrade, AIAnalysis } from '@shared/schema';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [currentOffset, setCurrentOffset] = useState(0);
  const [allTrades, setAllTrades] = useState<InsiderTrade[]>([]);
  
  // Real API data queries
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: trades, isLoading: tradesLoading, refetch: refetchTrades, error: tradesError } = useQuery({
    queryKey: queryKeys.trades.list({ limit: 20, offset: 0 }),
    queryFn: () => apiClient.getInsiderTrades(20, 0),
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
  
  // Initialize trades list
  useEffect(() => {
    if (trades) {
      setAllTrades(trades);
    }
  }, [trades]);
  
  const handleLoadMore = async () => {
    console.log('Loading more trades...');
    try {
      const newOffset = currentOffset + 20;
      const moreTrades = await apiClient.getInsiderTrades(20, newOffset);
      setAllTrades(prev => [...prev, ...moreTrades]);
      setCurrentOffset(newOffset);
    } catch (error) {
      console.error('Failed to load more trades:', error);
    }
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
            {isConnected ? 'Live data feed active - Real-time SEC filing monitoring' : 'Connection lost - Attempting to reconnect...'}
          </AlertDescription>
        </div>
      </Alert>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time insider trading monitoring and market intelligence
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
            Failed to load trading statistics. {statsError ? `Error: ${statsError.message}` : 'Please refresh the page.'}
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
              onLoadMore={handleLoadMore}
            />
          )}
        </Card>
        
        <div className="space-y-4">
          {/* Trading Summary */}
          <Card data-testid="trading-summary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Trading Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-chart-2/10 rounded-md border border-chart-2/20">
                <div className="text-sm font-medium text-chart-2 mb-1">Recent Activity</div>
                <div className="text-xs text-muted-foreground">
                  Monitoring insider trades across all major exchanges
                </div>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-md border border-chart-3/20">
                <div className="text-sm font-medium text-chart-3 mb-1">Market Coverage</div>
                <div className="text-xs text-muted-foreground">
                  Real-time SEC filing analysis and trade classification
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Movers */}
          <Card data-testid="top-movers">
            <CardHeader>
              <CardTitle className="text-base">Top Movers Today</CardTitle>
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