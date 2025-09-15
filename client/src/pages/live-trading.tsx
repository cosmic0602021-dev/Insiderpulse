import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Search, 
  Filter, Wifi, WifiOff, Bell, BarChart3, ArrowUpRight,
  ArrowDownRight, Clock, Building2
} from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
import type { InsiderTrade } from '@shared/schema';

interface TradeFilter {
  tradeType: 'ALL' | 'BUY' | 'SELL';
  minValue: string;
  maxValue: string;
  companySearch: string;
  traderSearch: string;
  signalType: 'ALL' | 'BUY' | 'SELL' | 'HOLD';
}

export default function LiveTrading() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<InsiderTrade[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [filters, setFilters] = useState<TradeFilter>({
    tradeType: 'ALL',
    minValue: '',
    maxValue: '',
    companySearch: '',
    traderSearch: '',
    signalType: 'ALL'
  });

  // Real-time data queries
  const { data: initialTrades, isLoading, refetch } = useQuery({
    queryKey: queryKeys.trades.list({ limit: 50, offset: 0 }),
    queryFn: () => apiClient.getInsiderTrades(50, 0),
    staleTime: 30000, // 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 60000, // 1 minute
  });

  // WebSocket for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);

  // Initialize trades
  useEffect(() => {
    if (initialTrades) {
      setTrades(initialTrades);
      setFilteredTrades(initialTrades);
    }
  }, [initialTrades]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'WELCOME':
        sendMessage({ type: 'SUBSCRIBE_TRADES' });
        break;
      
      case 'NEW_TRADE':
        const newTrade = lastMessage.data.trade;
        setTrades(prev => {
          // Check for duplicates before adding
          const exists = prev.find(trade => trade.id === newTrade.id);
          if (exists) {
            console.log('Duplicate trade received, skipping:', newTrade.id);
            return prev; // Don't add duplicate
          }
          
          const updated = [newTrade, ...prev];
          return updated.slice(0, 100); // Keep latest 100 trades
        });
        break;
    }
  }, [lastMessage, sendMessage]);

  // Apply filters
  useEffect(() => {
    let filtered = [...trades];

    if (filters.tradeType !== 'ALL') {
      filtered = filtered.filter(trade => trade.tradeType === filters.tradeType);
    }

    if (filters.signalType !== 'ALL') {
      filtered = filtered.filter(trade => trade.signalType === filters.signalType);
    }

    if (filters.companySearch) {
      filtered = filtered.filter(trade =>
        trade.companyName.toLowerCase().includes(filters.companySearch.toLowerCase()) ||
        (trade.ticker && trade.ticker.toLowerCase().includes(filters.companySearch.toLowerCase()))
      );
    }

    if (filters.traderSearch) {
      filtered = filtered.filter(trade =>
        trade.traderName.toLowerCase().includes(filters.traderSearch.toLowerCase())
      );
    }

    if (filters.minValue) {
      const minVal = parseFloat(filters.minValue);
      filtered = filtered.filter(trade => trade.totalValue >= minVal);
    }

    if (filters.maxValue) {
      const maxVal = parseFloat(filters.maxValue);
      filtered = filtered.filter(trade => trade.totalValue <= maxVal);
    }

    setFilteredTrades(filtered);
  }, [trades, filters]);

  const loadMoreTrades = async () => {
    try {
      const newOffset = currentOffset + 50;
      const moreTrades = await apiClient.getInsiderTrades(50, newOffset);
      setTrades(prev => [...prev, ...moreTrades]);
      setCurrentOffset(newOffset);
    } catch (error) {
      console.error('Failed to load more trades:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'text-chart-2 bg-chart-2/10 border-chart-2/20';
      case 'SELL': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return <TrendingUp className="h-3 w-3" />;
      case 'SELL': return <TrendingDown className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="live-trading">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">{t('page.livetrading.title')}</h1>
            <p className="text-muted-foreground">
              {t('page.livetrading.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Alert className={`px-3 py-2 ${isConnected ? 'border-chart-2/50 bg-chart-2/10' : 'border-destructive/50 bg-destructive/10'}`}>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-chart-2" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription className={`text-xs ${isConnected ? 'text-chart-2' : 'text-destructive'}`}>
                  {isConnected ? t('connection.liveFeed') : t('connection.disconnected')}
                </AlertDescription>
              </div>
            </Alert>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.todayTrades')}</p>
                  <p className="text-2xl font-bold">{stats.todayTrades}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalVolume')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('liveTrading.activeNow')}</p>
                  <p className="text-2xl font-bold">{filteredTrades.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('liveTrading.alertsSet')}</p>
                  <p className="text-2xl font-bold">—</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('liveTrading.filtersAndSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.tradeType')}</label>
              <Select value={filters.tradeType} onValueChange={(value: any) => 
                setFilters(prev => ({ ...prev, tradeType: value }))}>
                <SelectTrigger data-testid="select-trade-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('filter.allTypes')}</SelectItem>
                  <SelectItem value="BUY">{t('filter.buyOrders')}</SelectItem>
                  <SelectItem value="SELL">{t('filter.sellOrders')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.aiSignal')}</label>
              <Select value={filters.signalType} onValueChange={(value: any) => 
                setFilters(prev => ({ ...prev, signalType: value }))}>
                <SelectTrigger data-testid="select-signal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('filter.allSignals')}</SelectItem>
                  <SelectItem value="BUY">{t('filter.buySignal')}</SelectItem>
                  <SelectItem value="SELL">{t('filter.sellSignal')}</SelectItem>
                  <SelectItem value="HOLD">{t('filter.holdSignal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.companyTicker')}</label>
              <Input
                placeholder={t('placeholder.searchCompany')}
                value={filters.companySearch}
                onChange={(e) => setFilters(prev => ({ ...prev, companySearch: e.target.value }))}
                data-testid="input-company-search"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.traderName')}</label>
              <Input
                placeholder={t('placeholder.searchTrader')}
                value={filters.traderSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, traderSearch: e.target.value }))}
                data-testid="input-trader-search"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.minValue')}</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                data-testid="input-min-value"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.maxValue')}</label>
              <Input
                type="number"
                placeholder={t('placeholder.noLimit')}
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                data-testid="input-max-value"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Trading Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('liveTrading.liveFeed')}
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTrades.length} {t('liveTrading.tradesShown')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{t('liveTrading.noTrades')}</p>
              <p className="text-muted-foreground">{t('liveTrading.adjustFilters')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <div 
                  key={trade.id}
                  className="border rounded-lg p-4 hover-elevate cursor-pointer"
                  data-testid={`trade-item-${trade.id}`}
                  onClick={() => window.open(`/trade/${trade.id}`, '_blank')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {trade.tradeType === 'BUY' ? (
                            <ArrowUpRight className="h-4 w-4 text-chart-2" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                          )}
                          <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'destructive'}>
                            {trade.tradeType}
                          </Badge>
                        </div>
                        <Badge className={getSignalColor(trade.signalType)}>
                          {getSignalIcon(trade.signalType)}
                          {trade.signalType}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(trade.filedDate)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold truncate">{trade.companyName}</span>
                          </div>
                          {trade.ticker && (
                            <Badge variant="outline" className="text-xs">{trade.ticker}</Badge>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">{t('liveTrading.insider')}</p>
                          <p className="font-medium">{trade.traderName}</p>
                          <p className="text-xs text-muted-foreground">{trade.traderTitle}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">{t('liveTrading.tradeDetails')}</p>
                          <p className="font-medium">{trade.shares.toLocaleString()} shares</p>
                          <p className="text-xs text-muted-foreground">
                            ${trade.pricePerShare.toFixed(2)} per share
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('liveTrading.totalValue')}</p>
                          <p className="text-lg font-bold">{formatCurrency(trade.totalValue)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('liveTrading.score')} {trade.significanceScore}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTrades.length >= 50 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreTrades}
                    data-testid="button-load-more"
                  >
                    {t('liveTrading.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}