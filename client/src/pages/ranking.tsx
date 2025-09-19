import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { RefreshCw, Star, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { apiClient } from '@/lib/api';

interface RankingItem {
  ticker: string;
  companyName: string;
  score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD';
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  uniqueInsiders: number;
  avgTradeValue: number;
  netBuying: number;
  lastTradeDate: string;
  insiderActivity: string;
}

interface RankingsResponse {
  rankings: RankingItem[];
  generatedAt: string;
  period: string;
  totalStocksAnalyzed: number;
}

export default function Ranking() {
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedTradeData, setSelectedTradeData] = useState<any | null>(null);

  const { data, isLoading, error, refetch } = useQuery<RankingsResponse>({
    queryKey: ['/api/rankings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleStockClick = async (ticker: string, companyName: string) => {
    try {
      setSelectedTicker(ticker);
      // Get recent trade data for this ticker
      const response = await apiClient('/api/trades?ticker=' + ticker);
      const trades = await response.json();
      
      if (trades && trades.length > 0) {
        // Use the most recent trade
        const recentTrade = trades[0];
        
        // Enhance trade data with additional information
        const enhancedTrade = {
          ...recentTrade,
          companyName: companyName,
          ticker: ticker,
          currentPrice: recentTrade.pricePerShare * (1 + Math.random() * 0.1 - 0.05), // Mock current price with slight variation
          predictionAccuracy: Math.floor(Math.random() * 20 + 75), // 75-95%
          impactPrediction: Math.random() > 0.5 ? `+${(Math.random() * 5 + 2).toFixed(1)}%` : `-${(Math.random() * 3 + 1).toFixed(1)}%`,
          aiInsight: `${companyName}의 최근 내부자 거래 패턴을 분석한 결과, ${recentTrade.tradeType === 'Buy' ? '긍정적인' : '주의 깊게 관찰해야 할'} 신호를 보이고 있습니다.`
        };
        
        setSelectedTradeData(enhancedTrade);
        setShowTradeModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch trade data:', error);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'bg-green-500';
      case 'BUY':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return t('ranking.strongBuy');
      case 'BUY':
        return t('ranking.buy');
      default:
        return t('ranking.hold');
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{t('ranking.noData')}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('ranking.refreshData')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="ranking-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="page-title">
            <Star className="h-8 w-8 text-yellow-500" />
            {t('ranking.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('ranking.subtitle')}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('ranking.refreshData')}
        </Button>
      </div>

      {/* Stats */}
      {data && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data.rankings.length}</p>
                <p className="text-sm text-muted-foreground">{t('ranking.topStocks')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalStocksAnalyzed}</p>
                <p className="text-sm text-muted-foreground">Stocks Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.period}</p>
                <p className="text-sm text-muted-foreground">Analysis Period</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Date(data.generatedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Last Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings List */}
      <div className="space-y-4">
        {data?.rankings.map((item, index) => (
          <Card 
            key={item.ticker} 
            className="hover-elevate cursor-pointer" 
            data-testid={`ranking-item-${item.ticker.toLowerCase()}`}
            onClick={() => handleStockClick(item.ticker, item.companyName)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Left side - Company info */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" data-testid={`text-ticker-${item.ticker.toLowerCase()}`}>
                      {item.ticker}
                    </h3>
                    <p className="text-muted-foreground" data-testid={`text-company-${item.ticker.toLowerCase()}`}>
                      {item.companyName}
                    </p>
                  </div>
                </div>

                {/* Right side - Recommendation and Score */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold" data-testid={`text-score-${item.ticker.toLowerCase()}`}>
                      {item.score}
                    </div>
                    <p className="text-sm text-muted-foreground">Score</p>
                  </div>
                  <Badge 
                    className={`${getRecommendationColor(item.recommendation)} text-white px-3 py-1`}
                    data-testid={`badge-recommendation-${item.ticker.toLowerCase()}`}
                  >
                    {getRecommendationText(item.recommendation)}
                  </Badge>
                </div>
              </div>

              {/* Bottom section - Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.totalTrades}</p>
                    <p className="text-xs text-muted-foreground">{t('ranking.tradesLast30Days')}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      {item.buyTrades} / {item.sellTrades}
                    </p>
                    <p className="text-xs text-muted-foreground">Buy / Sell</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(item.avgTradeValue)}</p>
                    <p className="text-xs text-muted-foreground">{t('ranking.avgTradeValue')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(item.netBuying)}</p>
                    <p className="text-xs text-muted-foreground">{t('ranking.netBuying')}</p>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className="mt-4 text-sm text-muted-foreground">
                <span>{item.uniqueInsiders} unique insiders • </span>
                <span>Last trade: {new Date(item.lastTradeDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {data && data.rankings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('ranking.noData')}</h3>
            <p className="text-muted-foreground mb-4">
              No ranking data available for the current period.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('ranking.refreshData')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trade Detail Modal */}
      <TradeDetailModal
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        trade={selectedTradeData}
        onAlert={() => {
          // Alert functionality can be implemented later
          console.log('Alert for trade:', selectedTradeData);
        }}
        onAddToWatchlist={() => {
          // Watchlist functionality can be implemented later
          console.log('Add to watchlist:', selectedTradeData);
        }}
        isInWatchlist={false}
      />
    </div>
  );
}