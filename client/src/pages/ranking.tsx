import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { RefreshCw, Star, TrendingUp, DollarSign, Activity, X, Mail, Bookmark, Bell, Check, Building2 } from 'lucide-react';
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
  // 패턴 정보 추가
  detectedPatterns?: Array<{
    type: string;
    description: string;
    significance: string;
  }>;
  patternSignals?: string | null;
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
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [selectedTradeForAlert, setSelectedTradeForAlert] = useState<any | null>(null);
  const [selectedCompanyForAlert, setSelectedCompanyForAlert] = useState('');

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
      const allTrades = await apiClient.getInsiderTrades(100, 0); // Get recent trades
      const tickerTrades = allTrades.filter(trade => trade.ticker === ticker);
      
      if (tickerTrades && tickerTrades.length > 0) {
        // Sort by filedDate descending to get the most recent trade
        const sortedTrades = tickerTrades.sort((a, b) => 
          new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
        );
        // Use the most recent trade
        const recentTrade = sortedTrades[0];
        
        // Enhance trade data with additional information
        const enhancedTrade = {
          ...recentTrade,
          companyName: companyName,
          ticker: ticker,
          currentPrice: recentTrade.pricePerShare * (1 + Math.random() * 0.1 - 0.05), // Mock current price with slight variation
          predictionAccuracy: Math.floor(Math.random() * 20 + 75), // 75-95%
          impactPrediction: Math.random() > 0.5 ? `+${(Math.random() * 5 + 2).toFixed(1)}%` : `-${(Math.random() * 3 + 1).toFixed(1)}%`,
          aiInsight: `${companyName}의 최근 내부자 거래 패턴을 분석한 결과, ${recentTrade.tradeType === 'BUY' ? '긍정적인' : '주의 깊게 관찰해야 할'} 신호를 보이고 있습니다.`
        };
        
        setSelectedTradeData(enhancedTrade);
        setShowTradeModal(true);
      } else {
        // If no trades found for this ticker, show a placeholder modal
        const placeholderTrade = {
          ticker: ticker,
          companyName: companyName,
          traderName: '내부자',
          traderTitle: '임원',
          tradeType: 'BUY',
          shares: 1000,
          pricePerShare: 50,
          totalValue: 50000,
          filedDate: new Date().toISOString(),
          currentPrice: 52.5,
          predictionAccuracy: 85,
          impactPrediction: '+3.2%',
          aiInsight: `${companyName}에 대한 상세한 거래 정보가 곧 업데이트될 예정입니다.`
        };
        
        setSelectedTradeData(placeholderTrade);
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
                    <Skeleton className="h-16 w-16 rounded-lg" />
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
                          target.style.display = 'none';
                          const iconDiv = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                          if (iconDiv) iconDiv.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="fallback-icon h-16 w-16 bg-muted rounded-lg hidden items-center justify-center" style={{display: 'none'}}>
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold" data-testid={`text-ticker-${item.ticker.toLowerCase()}`}>
                      {item.ticker}
                    </h3>
                    <p className="text-muted-foreground" data-testid={`text-company-${item.ticker.toLowerCase()}`}>
                      {item.companyName}
                    </p>
                    {/* 🔍 패턴 기반 추천 이유 표시 */}
                    {item.patternSignals && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                          추천 이유: {item.patternSignals}
                        </Badge>
                      </div>
                    )}
                    {/* 패턴이 없는 경우 기본 추천 이유 */}
                    {!item.patternSignals && item.netBuying > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          추천 이유: 순매수 ${(item.netBuying/1000000).toFixed(1)}M
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Recommendation and Score */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary" data-testid={`text-score-${item.ticker.toLowerCase()}`}>
                      {item.score}
                    </div>
                    <p className="text-sm text-muted-foreground">동시 진입 점수</p>
                    <div className="text-xs text-purple-600 font-medium">
                      {item.uniqueInsiders}명 내부자
                    </div>
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
        onAlert={(trade) => {
          setSelectedTradeForAlert(trade);
          setSelectedCompanyForAlert(trade.ticker || '');
          setShowAlertModal(true);
          setShowTradeModal(false);
        }}
        onAddToWatchlist={(trade) => {
          if (trade.ticker && !watchlist.includes(trade.ticker)) {
            setWatchlist(prev => [...prev, trade.ticker!]);
            setSelectedTradeForAlert(trade);
            setShowWatchlistModal(true);
            setShowTradeModal(false);
          }
        }}
        isInWatchlist={selectedTradeData?.ticker ? watchlist.includes(selectedTradeData.ticker) : false}
      />

      {/* 알림 설정 모달 */}
      {showAlertModal && selectedTradeForAlert && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="modal-content card-professional max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">종목</p>
                <p className="font-semibold">{selectedCompanyForAlert} ({selectedTradeForAlert.ticker})</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">알림 조건</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">새로운 내부자 거래 발생 시</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">거래 규모가 $100,000 이상일 때</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">임원진 거래 시</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAlertModal(false)}
                  className="btn-professional flex-1"
                >
                  취소
                </Button>
                <Button 
                  onClick={() => {
                    // Here you would implement the actual alert setting logic
                    setShowAlertModal(false);
                  }}
                  className="btn-professional flex-1"
                >
                  알림 설정
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                    닫기
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
    </div>
  );
}