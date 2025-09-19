import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, DollarSign, User, Calendar, BarChart3, Calculator,
  X, Mail, Bookmark, Brain, Check, Bell, Star
} from 'lucide-react';
import type { InsiderTrade } from '@shared/schema';

interface EnhancedTrade extends InsiderTrade {
  predictionAccuracy?: number;
  recommendedBuyPrice?: number;
  currentPrice?: number;
  similarTrades?: number;
  avgReturnAfterSimilar?: number;
  aiInsight?: string;
  impactPrediction?: string;
}

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: EnhancedTrade | null;
  onAlert?: (trade: EnhancedTrade) => void;
  onAddToWatchlist?: (trade: EnhancedTrade) => void;
  isInWatchlist?: boolean;
}

export function TradeDetailModal({
  isOpen,
  onClose,
  trade,
  onAlert,
  onAddToWatchlist,
  isInWatchlist = false
}: TradeDetailModalProps) {
  if (!isOpen || !trade) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompanyInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 1);
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const getTradeTypeIcon = (tradeType: string) => {
    const iconClass = `h-4 w-4 ${getTradeTypeIconColor(tradeType)}`;
    
    switch (tradeType?.toUpperCase()) {
      case 'BUY':
      case 'PURCHASE':
        return <TrendingUp className={iconClass} />;
      case 'SELL':
      case 'SALE':
        return <TrendingUp className={`${iconClass} rotate-180`} />;
      default:
        return <DollarSign className={iconClass} />;
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
    <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="modal-content card-professional max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {getCompanyInitials(trade.companyName)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{trade.companyName}</h3>
                <p className="text-sm text-muted-foreground">{trade.ticker}</p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="btn-professional"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">거래 유형</p>
              <Badge variant={getTradeTypeVariant(trade.tradeType)} className="btn-professional font-semibold flex items-center gap-1 w-fit">
                {getTradeTypeIcon(trade.tradeType)}
                {trade.tradeType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 거래액</p>
              <p className="font-bold">{formatCurrency(trade.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">주식 수</p>
              <p className="font-bold">{trade.shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">주당 가격</p>
              <p className="font-bold">${trade.pricePerShare.toFixed(2)}</p>
            </div>
          </div>

          {/* 내부자 정보 */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              내부자 정보
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">이름</p>
                <p className="font-medium">{trade.traderName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">직책</p>
                <p className="font-medium">{trade.traderTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">신고 일자</p>
                <p className="font-medium">{formatDate(trade.filedDate)}</p>
              </div>
            </div>
          </div>

          {/* 가격 분석 대시보드 */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              가격 분석 & 투자 인사이트
            </h4>

            {/* 핵심 지표 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 내부자 거래가 카드 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">내부자 거래가</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(trade.filedDate)}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 value-change-up">
                  ${trade.pricePerShare.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">실제 거래 가격</p>
              </div>

              {/* 현재 시장가 카드 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">현재 시장가</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">실시간 추정</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${trade.currentPrice?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">시장 예상 가격</p>
              </div>

              {/* 가격 차이 카드 */}
              {trade.currentPrice && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">가격 차이</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {trade.currentPrice > trade.pricePerShare ? '내부자가 저가에 매수' : '내부자가 고가에 매수'}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {trade.currentPrice > trade.pricePerShare ? '+' : ''}
                    {(
                      ((trade.currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100
                    ).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    ${Math.abs(trade.currentPrice - trade.pricePerShare).toFixed(2)} 차이
                  </p>
                </div>
              )}
            </div>

            {/* 수익 예측 카드 - 수익일 때만 표시 */}
            {trade.currentPrice && trade.currentPrice > trade.pricePerShare && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <p className="text-sm font-semibold text-white/80">예상 수익</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      +${(trade.currentPrice - trade.pricePerShare).toFixed(2)}
                    </p>
                    <p className="text-sm font-medium text-green-300">
                      ({((trade.currentPrice - trade.pricePerShare) / trade.pricePerShare * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>

                {/* 투자 시뮬레이션 */}
                <div className="pt-3 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">100주 투자 시:</span>
                      <span className="font-bold text-green-300">
                        +${((trade.currentPrice - trade.pricePerShare) * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">1000주 투자 시:</span>
                      <span className="font-bold text-green-300">
                        +${((trade.currentPrice - trade.pricePerShare) * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI 분석 정보 */}
          {trade.predictionAccuracy && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                AI 분석 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">예측 정확도</p>
                  <p className="text-lg font-bold text-green-600 value-change-up">
                    {trade.predictionAccuracy}%
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">예상 영향</p>
                  <p className={`text-lg font-bold value-change-${trade.impactPrediction?.startsWith('+') ? 'up' : 'down'} ${
                    trade.impactPrediction?.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.impactPrediction}
                  </p>
                </div>
              </div>

              {trade.aiInsight && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm">{trade.aiInsight}</p>
                </div>
              )}
            </div>
          )}

          {/* AI 분석 결과 */}
          <div className="border-t pt-4" data-testid="section-ai-analysis">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200" data-testid="text-ai-analysis">
                    AI 분석결과: {trade.companyName}의 최근 내부자 거래 패턴을 분석한 결과, 주의 깊게 관찰해야 할 신호를 보이고 있습니다. 
                    {(() => {
                      const tradeTypeUpper = (trade.tradeType || '').toUpperCase();
                      return tradeTypeUpper === 'SELL' || tradeTypeUpper === 'SALE' 
                        ? ' 내부자 매도는 회사의 단기적 전망에 대한 우려를 시사할 수 있으며, 투자자들은 신중한 접근이 필요합니다.'
                        : ' 내부자 매수는 회사의 향후 성장에 대한 긍정적 전망을 나타낼 수 있으며, 이는 투자 기회로 해석될 수 있습니다.';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-2 pt-4 border-t">
            {onAlert && (
              <Button
                size="sm"
                onClick={() => onAlert(trade)}
                className="btn-professional"
              >
                <Mail className="h-4 w-4 mr-1" />
                알림
              </Button>
            )}
            {onAddToWatchlist && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToWatchlist(trade)}
                disabled={isInWatchlist}
                className="btn-professional"
              >
                <Bookmark className="h-4 w-4 mr-1" />
                {isInWatchlist ? '추가됨' : '워치리스트'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}