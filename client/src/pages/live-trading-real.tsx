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
import type { InsiderTrade } from '@shared/schema';

interface DataQualityStatus {
  isValid: boolean;
  isFresh: boolean;
  validTradeCount: number;
  totalTradeCount: number;
  lastUpdateAge: number;
  issues: string[];
}

export default function LiveTradingReal() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dataQuality, setDataQuality] = useState<DataQualityStatus | null>(null);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);

  // 실제 데이터만 가져오기 - 가짜 데이터 완전 차단
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
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <p>실제 내부자 거래 데이터 로딩 중...</p>
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
            데이터 로딩 실패: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 데이터 품질 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 연결 상태 */}
        <Alert className={isConnected ? 'border-green-500/50 bg-green-50' : 'border-red-500/50 bg-red-50'}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={isConnected ? 'text-green-700' : 'text-red-700'}>
              {isConnected ? '실시간 연결 활성' : '연결 끊김'}
            </AlertDescription>
          </div>
        </Alert>

        {/* 데이터 신선도 */}
        <Alert className={dataQuality?.isFresh ? 'border-green-500/50 bg-green-50' : 'border-orange-500/50 bg-orange-50'}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertDescription className={dataQuality?.isFresh ? 'text-green-700' : 'text-orange-700'}>
              {dataQuality?.isFresh ? '최신 데이터' : '데이터 업데이트 필요'}
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {/* 데이터 품질 경고 */}
      {dataQuality?.issues && dataQuality.issues.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <div className="font-semibold mb-1">데이터 품질 주의사항:</div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {dataQuality.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">실시간 내부자 거래</h1>
          <p className="text-muted-foreground">
            검증된 실제 데이터만 표시 • 마지막 검증: {lastValidationTime?.toLocaleTimeString('ko-KR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            실제 데이터
          </Badge>
        </div>
      </div>

      {/* 통계 카드 삭제됨 */}

      {/* 거래 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            검증된 내부자 거래 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validatedData.trades.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">검증된 거래 데이터가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                데이터 수집기가 실행 중이거나 새로운 거래를 기다리고 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {validatedData.trades.slice(0, 50).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-muted ${getTradeTypeColor(trade.tradeType)}`}>
                      {getTradeTypeIcon(trade.tradeType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trade.companyName}</span>
                        <Badge variant="outline">{trade.ticker}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trade.traderName} • {trade.traderTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getTradeTypeColor(trade.tradeType)}`}>
                        {formatCurrency(Math.abs(trade.totalValue))}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {trade.shares?.toLocaleString()} 주
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(trade.filedDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}