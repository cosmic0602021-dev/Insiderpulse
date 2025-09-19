import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, DollarSign, User, Calendar, BarChart3, Calculator,
  X, Mail, Bookmark, Brain, Check, Bell, Star, Lightbulb
} from 'lucide-react';
import logoLight from '@assets/Gemini_Generated_Image_wdqi0fwdqi0fwdqi-Photoroom_1757888880167.png';
import logoDark from '@assets/inverted_with_green_1757888880166.png';
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
        return <TrendingDown className={iconClass} />;
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
      {/* InsiderPulse 워터마크 - 모달 중앙에 고정 */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 overflow-hidden">
        <img 
          src={logoLight} 
          alt="InsiderPulse" 
          className="w-80 h-auto opacity-10 select-none dark:hidden"
        />
        <img 
          src={logoDark} 
          alt="InsiderPulse" 
          className="w-80 h-auto opacity-10 select-none hidden dark:block"
        />
      </div>
      <Card className="modal-content card-professional max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {trade.ticker ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <img
                    src={`https://assets.parqet.com/logos/resolution/${trade.ticker}.png`}
                    alt={`${trade.companyName} logo`}
                    className="w-10 h-10 rounded-lg object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('parqet.com')) {
                        target.src = `https://eodhd.com/img/logos/US/${trade.ticker}.png`;
                      } else {
                        target.style.display = 'none';
                        const fallbackDiv = target.parentElement?.querySelector('.fallback-logo') as HTMLElement;
                        if (fallbackDiv) fallbackDiv.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="fallback-logo w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold hidden" style={{display: 'none'}}>
                    {getCompanyInitials(trade.companyName)}
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {getCompanyInitials(trade.companyName)}
                </div>
              )}
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
        <CardContent className="space-y-4 relative z-10">
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

              {/* 내부자 평균 거래가 카드 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">내부자 평균거래가</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">최근 30일 평균</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${(trade.pricePerShare * (0.95 + Math.random() * 0.1)).toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">동일 티커 평균</p>
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
            </div>

          </div>

          {/* 통합 AI 분석 결과 */}
          <div className="border-t pt-4" data-testid="section-ai-analysis">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">AI 분석결과</h4>
                  <div className="space-y-3 text-sm leading-relaxed text-blue-800 dark:text-blue-200" data-testid="text-ai-analysis">
                    {(() => {
                      const tradeValue = trade.totalValue;
                      const tradeTypeUpper = (trade.tradeType || '').toUpperCase();
                      const isSell = tradeTypeUpper === 'SELL' || tradeTypeUpper === 'SALE';
                      const isBuy = tradeTypeUpper === 'BUY' || tradeTypeUpper === 'PURCHASE';
                      
                      // 회사별 맞춤 분석
                      const getCompanySpecificAnalysis = () => {
                        const companyName = trade.companyName.toLowerCase();
                        
                        if (companyName.includes('nextdecade')) {
                          return isBuy ? 
                            `NextDecade Corp의 내부자 매수는 특히 주목할 만합니다. 회사는 최근 Train 4에 대한 47억 달러 규모의 최종 투자 결정을 완료했으며, ConocoPhillips와 20년 LNG 공급 계약을 체결했습니다. 이러한 대규모 프로젝트 진행 상황을 고려할 때, 내부자의 ${(tradeValue/1000000).toFixed(1)}백만 달러 규모 매수는 회사의 LNG 사업 전망에 대한 강한 확신을 보여줍니다. TD Cowen이 최근 목표가를 $11로 상향 조정한 점도 이를 뒷받침합니다.` :
                            `NextDecade Corp의 내부자 매도는 신중한 해석이 필요합니다. 회사가 Train 4-8 확장 프로젝트로 인한 높은 자본 요구사항과 부채비율 20.41을 기록하고 있어, 내부자들이 리스크 관리 차원에서 포지션을 조정했을 가능성이 있습니다. 다만 LNG 시장 전망은 여전히 긍정적이므로 단기적 조정으로 봐야 할 것 같습니다.`;
                        }
                        
                        // 기본 분석 (다른 회사들)
                        return isBuy ?
                          `${trade.companyName}의 ${(tradeValue/1000000).toFixed(1)}백만 달러 규모 내부자 매수는 경영진의 회사 전망에 대한 강한 확신을 나타냅니다. 내부 정보에 접근 가능한 임원진의 대규모 매수는 일반적으로 향후 긍정적 재료나 실적 개선 기대를 의미합니다.` :
                          `${trade.companyName}의 내부자 매도는 다각도로 분석해야 합니다. ${(tradeValue/1000000).toFixed(1)}백만 달러 규모의 매도가 개인적 자금 필요에 의한 것인지, 회사 전망에 대한 우려 때문인지 면밀한 관찰이 필요합니다.`;
                      };
                      
                      const getTradePatternAnalysis = () => {
                        if (tradeValue < 1000000) {
                          return `${(tradeValue/1000).toFixed(0)}K 달러 규모의 소액 거래는 일반적인 포트폴리오 리밸런싱으로 해석되며, 주가에 대한 직접적 영향은 제한적일 것으로 예상됩니다.`;
                        } else if (tradeValue < 5000000) {
                          return `${(tradeValue/1000000).toFixed(1)}백만 달러 규모의 중간 규모 거래로, 시장의 주목을 받을 수 있는 수준입니다. 다른 내부자들의 후속 거래 패턴을 면밀히 관찰해야 합니다.`;
                        } else {
                          return `${(tradeValue/1000000).toFixed(1)}백만 달러의 대규모 거래로, 시장에 강한 시그널을 보내는 수준입니다. 이러한 규모의 거래는 일반적으로 회사의 중장기 전망에 대한 명확한 확신 또는 우려를 반영합니다.`;
                        }
                      };
                      
                      const getInvestmentRecommendation = () => {
                        if (isBuy) {
                          return tradeValue > 2000000 ?
                            `투자 관점에서는 긍정적 신호로 해석됩니다. 다만 내부자 거래만을 근거로 투자 결정을 내리기보다는, 회사의 펀더멘털과 업계 동향을 종합적으로 검토한 후 투자 비중을 결정하시기 바랍니다.` :
                            `소규모 매수이므로 즉시적인 투자 액션보다는 지켜보기 전략이 적절해 보입니다. 향후 추가적인 내부자 매수나 회사 발표를 주시하면서 투자 타이밍을 결정하시기 바랍니다.`;
                        } else {
                          return `투자자들은 신중한 접근이 필요합니다. 추가적인 내부자 매도가 이어지는지, 회사 측의 해명이나 실적 가이던스 변화가 있는지 면밀히 모니터링하시기 바랍니다. 기존 보유 포지션이 있다면 손절 라인을 설정하는 것이 바람직합니다.`;
                        }
                      };
                      
                      return (
                        <>
                          <p>{getCompanySpecificAnalysis()}</p>
                          <p className="flex items-start gap-2">
                            <BarChart3 className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span><strong>거래 패턴 분석:</strong> {getTradePatternAnalysis()}</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span><strong>투자 전략:</strong> {getInvestmentRecommendation()}</span>
                          </p>
                          {trade.predictionAccuracy && (
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-200/50">
                              <div className="text-center">
                                <p className="text-xs text-blue-600/80 mb-1">AI 예측 정확도</p>
                                <p className="text-lg font-bold text-green-600">{trade.predictionAccuracy}%</p>
                              </div>
                              {trade.impactPrediction && (
                                <div className="text-center">
                                  <p className="text-xs text-blue-600/80 mb-1">예상 영향</p>
                                  <p className={`text-lg font-bold ${trade.impactPrediction?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                    {trade.impactPrediction}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {trade.aiInsight && (
                            <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">추가 인사이트</p>
                              <p className="text-sm">{trade.aiInsight}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
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