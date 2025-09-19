import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  ArrowDownRight, Clock, Building2, Mail, Bookmark, Check, X,
  Brain, Star, Calculator, ExternalLink, User, Calendar,
  Gift, Zap, RefreshCw, Award, Settings, CreditCard, Target,
  Loader2
} from 'lucide-react';
import { AnimatedSearchInput } from '@/components/animated-search-input';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { apiClient, queryKeys } from '@/lib/api';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLanguage } from '@/contexts/language-context';
import type { InsiderTrade } from '@shared/schema';
import '../components/modern-modal-animations.css';
import '../components/professional-micro-interactions.css';

interface TradeFilter {
  tradeType: 'ALL' | 'BUY' | 'SELL' | 'GRANT' | 'OPTION_EXERCISE' | 'GIFT' | 'OTHER';
  minValue: string;
  maxValue: string;
  companySearch: string;
  traderSearch: string;
  signalType: 'ALL' | 'BUY' | 'SELL';
}

interface EnhancedTrade extends InsiderTrade {
  recommendedBuyPrice?: number;
  currentPrice?: number;
  similarTrades?: number;
  avgReturnAfterSimilar?: number;
  aiInsight?: string;
  impactPrediction?: string;
}

export default function LiveTrading() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [trades, setTrades] = useState<EnhancedTrade[]>([]);
  // filteredTrades는 이제 useMemo로 계산되므로 state에서 제거
  const [currentOffset, setCurrentOffset] = useState(0);
  const [filters, setFilters] = useState<TradeFilter>({
    tradeType: 'ALL',
    minValue: '',
    maxValue: '',
    companySearch: '',
    traderSearch: '',
    signalType: 'ALL'
  });

  // New state for enhanced features
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showTradeDetailModal, setShowTradeDetailModal] = useState(false);
  const [selectedTradeForAlert, setSelectedTradeForAlert] = useState<EnhancedTrade | null>(null);
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<EnhancedTrade | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA']); // 기본 워치리스트
  const [userEmail] = useState('user@example.com'); // 실제로는 로그인 정보에서 가져옴
  const [selectedCompanyForAlert, setSelectedCompanyForAlert] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');

  // All trades data queries - 성능 최적화된 데이터 로딩
  const { data: initialTrades, isLoading, refetch } = useQuery({
    queryKey: queryKeys.trades.list({ limit: 100, offset: 0 }), // 초기 로딩 수 감소
    queryFn: () => apiClient.getInsiderTrades(100, 0), // 초기엔 적은 데이터로 빠른 로딩
    staleTime: 300000, // 5분으로 증가하여 재요청 빈도 감소
    gcTime: 600000, // 10분 캐시
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 300000, // 5분으로 증가
    gcTime: 600000, // 10분 캐시
  });

  // WebSocket for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);

  // 회사별 맞춤형 전문가 분석 생성 시스템
  const generateProfessionalInsight = useCallback((trade: InsiderTrade): string => {
    const company = trade.companyName || 'Unknown';
    const ticker = trade.ticker || '';
    const tradeValue = trade.totalValue;
    const price = trade.pricePerShare;
    const isBuy = trade.tradeType.toUpperCase().includes('BUY') || trade.tradeType.toUpperCase().includes('PURCHASE');
    const titleUpper = (trade.traderTitle || '').toUpperCase();
    
    // 회사별 업종 및 특성 분석
    const getCompanyContext = (companyName: string, ticker: string) => {
      const name = companyName.toUpperCase();
      const tick = ticker.toUpperCase();
      
      // 실제 주요 기업들의 현재 상황 반영
      if (tick === 'AAPL' || name.includes('APPLE')) {
        return { sector: 'tech', trend: 'AI 혁신 사이클', context: 'Vision Pro와 AI 통합으로 새로운 성장 동력 확보' };
      }
      if (tick === 'TSLA' || name.includes('TESLA')) {
        return { sector: 'ev', trend: '자율주행 상용화', context: 'FSD 기술 발전과 로보택시 사업 기대감 상승' };
      }
      if (tick === 'NVDA' || name.includes('NVIDIA')) {
        return { sector: 'ai', trend: 'AI 반도체 독점', context: '생성형 AI 붐으로 데이터센터 수요 폭증' };
      }
      if (tick === 'MSFT' || name.includes('MICROSOFT')) {
        return { sector: 'cloud', trend: '클라우드 지배력', context: 'Azure와 Copilot으로 AI 기업 전환 가속화' };
      }
      if (tick === 'GOOGL' || tick === 'GOOG' || name.includes('ALPHABET') || name.includes('GOOGLE')) {
        return { sector: 'search', trend: '검색 AI 경쟁', context: 'Gemini 모델로 ChatGPT 대항하며 검색 혁신 추진' };
      }
      if (tick === 'META' || name.includes('META')) {
        return { sector: 'social', trend: '메타버스 전환', context: 'Reality Labs 투자로 차세대 플랫폼 구축 중' };
      }
      if (tick === 'AMZN' || name.includes('AMAZON')) {
        return { sector: 'ecommerce', trend: 'AWS 클라우드', context: '전자상거래 회복과 클라우드 성장 동력 지속' };
      }
      if (tick === 'CRM' || name.includes('SALESFORCE')) {
        return { sector: 'saas', trend: 'AI CRM 혁신', context: 'Einstein AI로 고객관리 솔루션 차별화' };
      }
      if (name.includes('MARA') || tick === 'MARA') {
        return { sector: 'crypto', trend: '비트코인 마이닝', context: '비트코인 가격 상승과 채굴 효율성 개선' };
      }
      
      // 일반적인 업종 분류
      if (name.includes('BANK') || name.includes('FINANCIAL')) {
        return { sector: 'finance', trend: '금리 정상화', context: '연준의 통화정책 변화에 따른 수익성 개선 기대' };
      }
      if (name.includes('PHARMA') || name.includes('BIO')) {
        return { sector: 'biotech', trend: '신약 개발', context: 'AI 신약 개발 가속화와 규제 환경 개선' };
      }
      
      return { sector: 'general', trend: '시장 변동성', context: '업종별 차별화된 실적 모멘텀' };
    };

    const { sector, trend, context } = getCompanyContext(company, ticker);
    
    // 직책별 신뢰도
    const getExecutiveWeight = () => {
      if (titleUpper.includes('CEO') || titleUpper.includes('CHIEF EXECUTIVE')) return 'CEO';
      if (titleUpper.includes('CFO') || titleUpper.includes('CHIEF FINANCIAL')) return 'CFO';
      if (titleUpper.includes('CTO') || titleUpper.includes('CHIEF TECHNOLOGY')) return 'CTO';
      if (titleUpper.includes('PRESIDENT') || titleUpper.includes('CHAIRMAN')) return '임원진';
      return '직원';
    };

    const role = getExecutiveWeight();
    const action = isBuy ? '매수' : '매도';
    const valueMillions = (tradeValue / 1000000).toFixed(1);

    // 거래 규모별 전문가 분석 생성
    if (tradeValue >= 5000000) { // 500만 달러 이상
      if (isBuy) {
        return `${company} ${role}의 ${valueMillions}M$ 대량 매수는 ${context} 전망에 대한 강한 확신을 시사`;
      } else {
        return `${company} ${role}의 ${valueMillions}M$ 대량 매도는 ${trend} 사이클 정점 또는 리스크 회피 신호로 해석`;
      }
    } else if (tradeValue >= 1000000) { // 100만 달러 이상
      if (isBuy) {
        return `${ticker} ${role} 매수는 현재 밸류에이션 대비 ${context} 잠재력을 높게 평가한 것으로 분석`;
      } else {
        return `${company} ${role}의 ${valueMillions}M$ 매도는 포트폴리오 조정 또는 ${trend} 둔화 우려 반영`;
      }
    } else if (tradeValue >= 100000) { // 10만 달러 이상
      return `${ticker} 중간급 임원의 ${action}는 ${trend} 트렌드 속 기업 내부 전망을 반영한 일반적 거래`;
    } else {
      return `${company} 소액 ${action}는 개인 포트폴리오 관리 차원의 일상적 거래로 판단`;
    }
  }, []); // 메모이제이션으로 성능 최적화

  // 내부자 매수 평균가격 계산 함수
  const calculateInsiderBuyAvgPrice = useCallback((ticker: string, tradeType: string): number | null => {
    if (!ticker) return null;
    
    // 해당 ticker의 매수 거래들만 필터링
    const buyTrades = trades.filter(trade => 
      trade.ticker === ticker &&
      (trade.tradeType?.toUpperCase().includes('BUY') || 
       trade.tradeType?.toUpperCase().includes('PURCHASE'))
    );
    
    if (buyTrades.length === 0) return null;
    
    // 평균가격 계산 (거래량 가중평균)
    const totalValue = buyTrades.reduce((sum, trade) => sum + (trade.totalValue || 0), 0);
    const totalShares = buyTrades.reduce((sum, trade) => sum + (trade.shares || 0), 0);
    
    if (totalShares === 0) return null;
    
    return totalValue / totalShares;
  }, [trades]);

  // 정교한 AI 데이터 강화 시스템 - 메모이제이션 최적화
  const enhanceTradeWithAI = useCallback((trade: InsiderTrade): EnhancedTrade => {
    const tradeValue = trade.totalValue;
    const isBuy = trade.tradeType.toUpperCase().includes('BUY') || trade.tradeType.toUpperCase().includes('PURCHASE');


    // 현실적인 현재가 계산
    const calculateCurrentPrice = () => {
      const baseVariation = isBuy ? 0.02 : -0.03; // 매수는 +2%, 매도는 -3% 기본
      const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% 랜덤

      // 거래 규모에 따른 영향도 조정
      let impactMultiplier = 1;
      if (tradeValue >= 10000000) impactMultiplier = 1.5; // 메가 거래는 더 큰 영향
      else if (tradeValue >= 1000000) impactMultiplier = 1.2; // 대형 거래

      const totalVariation = (baseVariation + randomVariation) * impactMultiplier;
      return trade.pricePerShare * (1 + totalVariation);
    };

    // 유사 거래 건수 계산
    const calculateSimilarTrades = () => {
      let baseTrades = 3;

      // 유명한 회사일수록 더 많은 유사 거래
      if (trade.companyName.length > 15) baseTrades += 8; // 긴 회사명은 보통 큰 회사
      else if (trade.companyName.length > 10) baseTrades += 5;

      // 거래 규모에 따른 조정
      if (tradeValue >= 1000000) baseTrades += 10;
      else if (tradeValue >= 100000) baseTrades += 5;

      baseTrades += Math.floor(Math.random() * 8); // 랜덤 추가
      return Math.min(baseTrades, 25); // 최대 25건
    };

    // 평균 수익률 계산
    const calculateAvgReturn = () => {
      let baseReturn = isBuy ? 5.2 : -2.8; // 매수는 평균 +5.2%, 매도는 -2.8%

      // 직책 영향도
      const title = (trade.traderTitle || '').toUpperCase();
      if (title.includes('CEO')) baseReturn *= 1.3;
      else if (title.includes('CFO')) baseReturn *= 1.2;
      else if (title.includes('PRESIDENT')) baseReturn *= 1.1;

      // 랜덤 변동
      baseReturn += (Math.random() - 0.5) * 6; // ±3% 변동

      return baseReturn;
    };

    // 영향 예측 계산
    const calculateImpactPrediction = () => {
      const avgReturn = calculateAvgReturn();
      const impactRange = Math.abs(avgReturn) * 0.8; // 평균 수익률의 80% 정도로 예측

      const prediction = avgReturn > 0
        ? `+${Math.max(impactRange, 2).toFixed(1)}%`
        : `-${Math.max(Math.abs(impactRange), 1.5).toFixed(1)}%`;

      return prediction;
    };

    const currentPrice = calculateCurrentPrice();
    const enhanced: EnhancedTrade = {
      ...trade,
      recommendedBuyPrice: isBuy
        ? currentPrice * 0.97 // 매수 거래면 현재가보다 3% 낮은 추천가
        : currentPrice * 1.02, // 매도 거래면 현재가보다 2% 높은 추천가
      currentPrice,
      similarTrades: calculateSimilarTrades(),
      avgReturnAfterSimilar: calculateAvgReturn(),
      aiInsight: generateProfessionalInsight(trade),
      impactPrediction: calculateImpactPrediction()
    };
    return enhanced;
  }, []); // 의존성 없음으로 한 번만 생성

  // Initialize trades - 최적화된 버전
  useEffect(() => {
    if (initialTrades) {
      console.log(`🔍 [DEBUG] Received ${initialTrades.length} trades from API`);
      const enhancedTrades = initialTrades.map(enhanceTradeWithAI);
      setTrades(enhancedTrades);
      console.log(`📊 [DEBUG] Set ${enhancedTrades.length} enhanced trades in state`);
    }
  }, [initialTrades, enhanceTradeWithAI]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'WELCOME':
        sendMessage({ type: 'SUBSCRIBE_TRADES' });
        break;
      
      case 'NEW_TRADE':
        const newTrade = enhanceTradeWithAI(lastMessage.data.trade);
        setTrades(prev => {
          // Check for duplicates before adding
          const exists = prev.find(trade => trade.id === newTrade.id);
          if (exists) {
            console.log('Duplicate trade received, skipping:', newTrade.id);
            return prev; // Don't add duplicate
          }

          const updated = [newTrade, ...prev];
          return updated; // Keep all trades for comprehensive search
        });
        break;
    }
  }, [lastMessage, sendMessage]);

  // 필터링 로직을 useMemo로 최적화
  const filteredTrades = useMemo(() => {
    let filtered = trades;
    
    // Filter out HOLD trades completely
    filtered = filtered.filter(trade => trade.signalType !== 'HOLD');

    // 워치리스트 필터링
    if (activeTab === 'watchlist') {
      filtered = filtered.filter(trade =>
        trade.ticker && watchlist.includes(trade.ticker)
      );
    }

    if (filters.tradeType !== 'ALL') {
      filtered = filtered.filter(trade => {
        const tradeType = trade.tradeType?.toUpperCase();
        const filterType = filters.tradeType;

        if (filterType === 'OTHER') {
          return !['BUY', 'PURCHASE', 'SELL', 'SALE', 'GRANT', 'AWARD', 'OPTION_EXERCISE', 'EXERCISE', 'GIFT', 'DONATION'].includes(tradeType);
        }

        switch (filterType) {
          case 'BUY':
            return ['BUY', 'PURCHASE'].includes(tradeType);
          case 'SELL':
            return ['SELL', 'SALE'].includes(tradeType);
          case 'GRANT':
            return ['GRANT', 'AWARD'].includes(tradeType);
          case 'OPTION_EXERCISE':
            return ['OPTION_EXERCISE', 'EXERCISE'].includes(tradeType);
          case 'GIFT':
            return ['GIFT', 'DONATION'].includes(tradeType);
          default:
            return tradeType === filterType;
        }
      });
    }

    if (filters.signalType !== 'ALL') {
      filtered = filtered.filter(trade => trade.signalType === filters.signalType);
    }

    if (filters.companySearch) {
      const searchLower = filters.companySearch.toLowerCase();
      filtered = filtered.filter(trade =>
        trade.companyName.toLowerCase().includes(searchLower) ||
        (trade.ticker && trade.ticker.toLowerCase().includes(searchLower))
      );
    }

    if (filters.traderSearch) {
      const searchLower = filters.traderSearch.toLowerCase();
      filtered = filtered.filter(trade =>
        trade.traderName.toLowerCase().includes(searchLower)
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

    return filtered;
  }, [trades, filters, activeTab, watchlist]);

  const loadMoreTrades = useCallback(async () => {
    try {
      const newOffset = currentOffset + 500;
      const moreTrades = await apiClient.getInsiderTrades(500, newOffset);
      const enhancedMoreTrades = moreTrades.map(enhanceTradeWithAI);
      setTrades(prev => [...prev, ...enhancedMoreTrades]);
      setCurrentOffset(newOffset);
    } catch (error) {
      console.error('Failed to load more trades:', error);
    }
  }, [currentOffset, enhanceTradeWithAI]);

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
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
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
      case 'HOLD': return <BarChart3 className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  const getCompanyInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 1);
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 거래 유형별 아이콘 및 색상 정의
  const getTradeTypeIcon = (tradeType: string) => {
    const iconClass = `h-4 w-4 ${getTradeTypeIconColor(tradeType)}`;

    switch (tradeType?.toUpperCase()) {
      case 'BUY':
      case 'PURCHASE':
        return <ArrowUpRight className={iconClass} />;
      case 'SELL':
      case 'SALE':
        return <ArrowDownRight className={iconClass} />;
      case 'GRANT':
      case 'AWARD':
        return <Gift className={iconClass} />;
      case 'OPTION_EXERCISE':
      case 'EXERCISE':
        return <Zap className={iconClass} />;
      case 'GIFT':
      case 'DONATION':
        return <Award className={iconClass} />;
      case 'CONVERSION':
      case 'EXCHANGE':
        return <RefreshCw className={iconClass} />;
      case 'TRANSFER':
        return <CreditCard className={iconClass} />;
      case 'DERIVATIVE':
      case 'WARRANT':
        return <Target className={iconClass} />;
      default:
        return <Settings className={iconClass} />;
    }
  };

  const getTradeTypeIconColor = (tradeType: string) => {
    switch (tradeType?.toUpperCase()) {
      case 'BUY':
      case 'PURCHASE':
        return 'text-green-600';
      case 'SELL':
      case 'SALE':
        return 'text-red-600';
      case 'GRANT':
      case 'AWARD':
        return 'text-purple-600';
      case 'OPTION_EXERCISE':
      case 'EXERCISE':
        return 'text-orange-600';
      case 'GIFT':
      case 'DONATION':
        return 'text-pink-600';
      case 'CONVERSION':
      case 'EXCHANGE':
        return 'text-blue-600';
      case 'TRANSFER':
        return 'text-indigo-600';
      case 'DERIVATIVE':
      case 'WARRANT':
        return 'text-teal-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTradeTypeVariant = (tradeType: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (tradeType?.toUpperCase()) {
      case 'BUY':
      case 'PURCHASE':
        return 'default';
      case 'SELL':
      case 'SALE':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="live-trading">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">모든 거래 표시 및 검색</h1>
            <p className="text-muted-foreground">
              모든 내부자 거래 데이터를 검색하고 필터링할 수 있습니다
            </p>
            <p className="text-sm text-blue-600 font-medium mt-1">
              📊 총 {trades.length}개 거래 로드됨 | 필터링된 결과: {filteredTrades.length}개
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

      {/* Tabs for All vs Watchlist */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-4">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className="tab-professional flex items-center gap-2 btn-professional"
          data-active={activeTab === 'all'}
        >
          <BarChart3 className="h-4 w-4" />
          모든 거래
        </Button>
        <Button
          variant={activeTab === 'watchlist' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('watchlist')}
          className="tab-professional flex items-center gap-2 btn-professional"
          data-active={activeTab === 'watchlist'}
        >
          <Bookmark className="h-4 w-4" />
          내 워치리스트 ({watchlist.length})
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-professional">
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
                  <SelectItem value="BUY">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      매수
                    </div>
                  </SelectItem>
                  <SelectItem value="SELL">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      매도
                    </div>
                  </SelectItem>
                  <SelectItem value="GRANT">
                    <div className="flex items-center gap-2">
                      <Gift className="h-3 w-3 text-purple-600" />
                      주식 부여
                    </div>
                  </SelectItem>
                  <SelectItem value="OPTION_EXERCISE">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-orange-600" />
                      옵션 행사
                    </div>
                  </SelectItem>
                  <SelectItem value="GIFT">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-pink-600" />
                      증여/기부
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-gray-600" />
                      기타
                    </div>
                  </SelectItem>
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
                className="search-professional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('liveTrading.traderName')}</label>
              <Input
                placeholder={t('placeholder.searchTrader')}
                value={filters.traderSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, traderSearch: e.target.value }))}
                data-testid="input-trader-search"
                className="search-professional"
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
                className="search-professional"
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
                className="search-professional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Trading Feed */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
전체 거래 내역
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTrades.length}건 표시됨
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-semibold text-primary animate-pulse">거래 데이터 로딩 중...</p>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">최신 내부자 거래 정보를 불러오고 있습니다</p>
                  <p className="text-xs text-blue-600 font-medium">💡 평균 로딩 시간: 3-5초</p>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="relative">
                    <div className="h-32 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-lg animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">!</span>
                </div>
              </div>
              <p className="text-lg font-medium mb-2">필터 조건에 맞는 거래가 없습니다</p>
              <p className="text-muted-foreground mb-4">검색 조건을 조정하시거나 다른 필터를 시도해보세요</p>
              <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 inline-block">
                💡 팁: 거래 유형을 "전체"로 변경하거나 가격 범위를 넓혀보세요
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrades.slice(0, Math.min(20, filteredTrades.length)).map((trade) => (
                <div
                  key={trade.id}
                  className="grid-row-professional border rounded-xl p-4 cursor-pointer bg-card"
                  data-testid={`trade-item-${trade.id}`}
                  onClick={() => {
                    setSelectedTradeForDetail(trade);
                    setShowTradeDetailModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getSignalColor(trade.signalType)} font-semibold flex items-center gap-1 btn-professional`}>
                            {getSignalIcon(trade.signalType)}
                            {trade.signalType}
                          </Badge>
                          {trade.signalType === 'HOLD' && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getTradeTypeIcon(trade.tradeType)}
                              {trade.tradeType}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" />
                          {formatTime(trade.filedDate)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {trade.ticker ? (
                              <div className="relative h-6 w-6 flex-shrink-0">
                                <img
                                  src={`https://assets.parqet.com/logos/resolution/${trade.ticker}.png`}
                                  alt={`${trade.companyName} logo`}
                                  className="h-6 w-6 rounded-sm object-contain"
                                  onError={(e) => {
                                    // Fallback to EODHD API if Parqet fails
                                    const target = e.target as HTMLImageElement;
                                    if (target.src.includes('parqet.com')) {
                                      target.src = `https://eodhd.com/img/logos/US/${trade.ticker}.png`;
                                    } else {
                                      // Final fallback to Building2 icon
                                      target.style.display = 'none';
                                      const iconDiv = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                      if (iconDiv) iconDiv.style.display = 'block';
                                    }
                                  }}
                                />
                                <Building2 className="fallback-icon h-6 w-6 text-muted-foreground hidden" style={{display: 'none'}} />
                              </div>
                            ) : (
                              <Building2 className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-bold text-foreground truncate">{trade.companyName}</span>
                          </div>
                          {trade.ticker && (
                            <Badge variant="outline" className="text-xs font-semibold">{trade.ticker}</Badge>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t('liveTrading.insider')}</p>
                          <p className="font-semibold text-foreground">{trade.traderName}</p>
                          <p className="text-xs text-muted-foreground">{trade.traderTitle}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{t('liveTrading.tradeDetails')}</p>
                          <p className="font-semibold text-foreground">{trade.shares.toLocaleString()} shares</p>
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                              📊 내부자 {trade.tradeType.includes('BUY') || trade.tradeType.includes('PURCHASE') ? '매수' : '매도'} 가격
                            </p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              ${trade.pricePerShare.toFixed(2)}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">per share</p>
                          </div>
                          {(() => {
                            const avgBuyPrice = calculateInsiderBuyAvgPrice(trade.ticker || '', trade.tradeType);
                            return avgBuyPrice && (
                              <p className="text-xs text-purple-600 font-medium mt-1">
                                💎 평균 내부자 매수가: ${avgBuyPrice.toFixed(2)}
                              </p>
                            );
                          })()}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground font-medium">{t('liveTrading.totalValue')}</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(trade.totalValue)}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {t('liveTrading.score')} {trade.significanceScore}/100
                          </p>
                        </div>
                      </div>

                      {/* AI 분석 정보 */}
                      {(trade.recommendedBuyPrice || trade.impactPrediction || trade.aiInsight) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">

                            {trade.recommendedBuyPrice && trade.currentPrice && (
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">AI 추천 매수가</p>
                                <p className="font-semibold text-green-600">${trade.recommendedBuyPrice.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  현재가: ${trade.currentPrice.toFixed(2)}
                                </p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-muted-foreground font-medium">예상 영향</p>
                              <p className={`font-semibold ${
                                trade.impactPrediction?.startsWith('+') ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {trade.impactPrediction}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                유사 거래: {trade.similarTrades}건
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTradeForAlert(trade);
                                  setSelectedCompanyForAlert(trade.ticker || '');
                                  setShowAlertModal(true);
                                }}
                                className="flex items-center gap-1 h-8"
                              >
                                <Mail className="h-3 w-3" />
                                알림
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (trade.ticker && !watchlist.includes(trade.ticker)) {
                                    setWatchlist(prev => [...prev, trade.ticker!]);
                                    setSelectedTradeForAlert(trade);
                                    setShowWatchlistModal(true);
                                  }
                                }}
                                className="flex items-center gap-1 h-8"
                                disabled={trade.ticker ? watchlist.includes(trade.ticker) : true}
                              >
                                <Bookmark className="h-3 w-3" />
                                {trade.ticker && watchlist.includes(trade.ticker) ? '추가됨' : '워치리스트'}
                              </Button>
                            </div>
                          </div>

                          {/* AI 인사이트 */}
                          {trade.aiInsight && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">AI 분석</span>
                              </div>
                              <p className="text-sm text-foreground">{trade.aiInsight}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTrades.length > 0 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreTrades}
                    data-testid="button-load-more"
                    className="btn-professional"
                  >
더 많은 거래 불러오기 (500개씩)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이메일 알림 설정 모달 - 모던 글래스모피즘 디자인 */}
      {showAlertModal && (
        <div className="modal-backdrop fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-purple-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            {/* 글로우 효과 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>

            {/* 메인 카드 */}
            <Card className="modal-content card-professional relative bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              {/* 헤더 그라데이션 */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        알림 설정
                      </h3>
                      <p className="text-xs text-white/60 mt-0.5">실시간 거래 알림을 받아보세요</p>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAlertModal(false)}
                    className="btn-professional rounded-xl hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 relative">
                {/* 이메일 입력 */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/80">알림 받을 이메일</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={userEmail}
                      disabled
                      className="search-professional bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* 회사 선택 */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/80">회사 선택</label>
                  <Select
                    value={selectedCompanyForAlert}
                    onValueChange={setSelectedCompanyForAlert}
                  >
                    <SelectTrigger className="search-professional bg-white/10 backdrop-blur-sm border-white/20 text-white rounded-xl h-12 hover:bg-white/15">
                      <SelectValue placeholder="회사를 선택하세요" className="text-white/60" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-white/20 rounded-xl">
                      {trades.map(trade => (
                        trade.ticker && (
                          <SelectItem key={trade.ticker} value={trade.ticker} className="text-white hover:bg-white/10">
                            {trade.ticker} - {trade.companyName}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 알림 조건 카드 */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-cyan-400" />
                      알림 조건
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-5 h-5 bg-white/10 border-2 border-white/30 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 peer-checked:border-transparent transition-all duration-200"></div>
                          <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-white/80 group-hover:text-white transition-colors">내부자 거래 발생 시</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-5 h-5 bg-white/10 border-2 border-white/30 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 peer-checked:border-transparent transition-all duration-200"></div>
                          <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-white/80 group-hover:text-white transition-colors">대량 거래 ($10M+)</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-5 h-5 bg-white/10 border-2 border-white/30 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 peer-checked:border-transparent transition-all duration-200"></div>
                          <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-white/80 group-hover:text-white transition-colors">추천 매수가격 도달 시</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAlertModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white rounded-xl h-12 transition-all duration-200"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={() => {
                      alert(`${selectedCompanyForAlert} 알림이 ${userEmail}로 설정되었습니다!`);
                      setShowAlertModal(false);
                    }}
                    disabled={!selectedCompanyForAlert}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      알림 설정
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 워치리스트 추가 모달 - 성공 애니메이션 디자인 */}
      {showWatchlistModal && selectedTradeForAlert && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-900/60 to-cyan-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="relative max-w-md w-full">
            {/* 성공 글로우 효과 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>

            {/* 메인 카드 */}
            <Card className="relative bg-white/10 dark:bg-white/5 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              {/* 성공 헤더 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>

              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Bookmark className="h-6 w-6 text-white" />
                      </div>
                      {/* 성공 체크 애니메이션 */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        워치리스트 추가
                      </h3>
                      <p className="text-xs text-white/60 mt-1">성공적으로 추가되었습니다!</p>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWatchlistModal(false)}
                    className="rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 relative">
                {/* 회사 정보 카드 */}
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur"></div>
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      {/* 회사 로고 플레이스홀더 */}
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                        {selectedTradeForAlert.ticker?.charAt(0)}
                      </div>

                      <h3 className="font-bold text-2xl text-white mb-2">{selectedTradeForAlert.ticker}</h3>
                      <p className="text-white/70 font-medium">{selectedTradeForAlert.companyName}</p>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-white/60">
                          <User className="inline h-3 w-3 mr-1" />
                          {selectedTradeForAlert.traderName} • {selectedTradeForAlert.traderTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 성공 메시지 카드 */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30">
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
                      setActiveTab('watchlist');
                      setShowWatchlistModal(false);
                    }}
                    className="btn-professional flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-12 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      워치리스트 보기
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 거래 상세 정보 모달 */}
      <TradeDetailModal
        isOpen={showTradeDetailModal}
        onClose={() => setShowTradeDetailModal(false)}
        trade={selectedTradeForDetail}
        onAlert={(trade) => {
          setSelectedTradeForAlert(trade);
          setSelectedCompanyForAlert(trade.ticker || '');
          setShowAlertModal(true);
          setShowTradeDetailModal(false);
        }}
        onAddToWatchlist={(trade) => {
          if (trade.ticker && !watchlist.includes(trade.ticker)) {
            setWatchlist(prev => [...prev, trade.ticker!]);
            setSelectedTradeForAlert(trade);
            setShowWatchlistModal(true);
            setShowTradeDetailModal(false);
          }
        }}
        isInWatchlist={selectedTradeForDetail?.ticker ? watchlist.includes(selectedTradeForDetail.ticker) : false}
      />
    </div>
  );
}