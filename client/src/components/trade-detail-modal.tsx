import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, DollarSign, User, Calendar, BarChart3, Calculator,
  X, Mail, Bookmark, Brain, Check, Bell, Star, Lightbulb, Target, Loader2
} from 'lucide-react';
import logoLight from '@assets/Gemini_Generated_Image_wdqi0fwdqi0fwdqi-Photoroom_1757888880167.png';
import logoDark from '@assets/inverted_with_green_1757888880166.png';
import type { InsiderTrade } from '@shared/schema';
import { useLanguage } from '@/contexts/language-context';

interface EnhancedTrade extends InsiderTrade {
  predictionAccuracy?: number;
  recommendedBuyPrice?: number;
  currentPrice?: number;
  similarTrades?: number;
  avgReturnAfterSimilar?: number;
  aiInsight?: string;
  impactPrediction?: string;
  comprehensiveAnalysis?: {
    executiveSummary: string;
    actionableRecommendation: string;
    priceTargets: {
      conservative: number;
      realistic: number;
      optimistic: number;
      timeHorizon: string;
    };
    riskAssessment: {
      level: 'LOW' | 'MEDIUM' | 'HIGH';
      factors: string[];
      mitigation: string;
    };
    marketContext: {
      sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      reasoning: string;
    };
    catalysts: string[];
    timeHorizon: string;
    confidence: number;
    newsAnalysis?: {
      totalNews: number;
      positiveCount: number;
      negativeCount: number;
      majorNews: Array<{
        title: string;
        summary: string;
        sentiment: string;
        published: Date;
        relevanceScore: number;
        source?: string;
      }>;
    };
  };
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
  const { t } = useLanguage();

  if (!isOpen || !trade) return null;

  // 시장 개장 시간 확인 (미국 동부 시간 기준)
  const isMarketOpen = () => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    const currentTime = hour * 60 + minute;

    // 주말 제외 (월-금)
    if (day === 0 || day === 6) return false;

    // 시장 시간: 9:30 AM - 4:00 PM ET
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    return currentTime >= marketOpen && currentTime <= marketClose;
  };

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

  const getTradeTypeColor = (tradeType: string) => {
    switch (tradeType?.toUpperCase()) {
      case 'BUY':
      case 'PURCHASE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL':
      case 'SALE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
          {/* {t('tradeDetail.basicInfo')} */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('liveTrading.tradeType')}</p>
              <Badge className={`btn-professional font-semibold flex items-center gap-1 w-fit ${getTradeTypeColor(trade.tradeType)}`}>
                {getTradeTypeIcon(trade.tradeType)}
                {trade.tradeType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('liveTrading.totalValue')}</p>
              <p className="font-bold">{formatCurrency(trade.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('tradeDetail.shareCount')}</p>
              <p className="font-bold">{trade.shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('tradeDetail.pricePerShare')}</p>
              <p className="font-bold">${trade.pricePerShare.toFixed(2)}</p>
            </div>
          </div>

          {/* {t('tradeDetail.insiderInfo')} */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('tradeDetail.insiderInfo')}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('tradeDetail.name')}</p>
                <p className="font-medium">{trade.traderName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tradeDetail.position')}</p>
                <p className="font-medium">{trade.traderTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('tradeDetail.reportDate')}</p>
                <p className="font-medium">{formatDate(trade.filedDate)}</p>
              </div>
            </div>
          </div>

          {/* {t('tradeDetail.priceAnalysisDashboard')} */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              {t('tradeDetail.priceAnalysis')}
            </h4>

            {/* {t('tradeDetail.keyMetrics')} */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* {t('tradeDetail.insiderTradePrice')} */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('tradeDetail.insiderTradePrice')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(trade.filedDate)}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 value-change-up">
                  ${trade.pricePerShare.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('tradeDetail.actualTradePrice')}</p>
              </div>

              {/* {t('tradeDetail.insiderAvgTradePrice')} */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('tradeDetail.insiderAvgPrice')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('tradeDetail.last30DaysAvg')}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${(trade.recommendedBuyPrice || trade.pricePerShare * 0.98).toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('tradeDetail.sameTicker')}</p>
              </div>

              {/* {t('tradeDetail.currentMarketPrice')} */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('tradeDetail.currentMarketPrice')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isMarketOpen() ? t('tradeDetail.realtimeEstimate') : t('tradeDetail.marketClosed')}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${trade.currentPrice?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isMarketOpen() ? t('tradeDetail.realtimePrice') : t('tradeDetail.lastClosePrice')}
                </p>
              </div>
            </div>

          </div>

          {/* {t('tradeDetail.integratedAiAnalysis')} */}
          <div className="border-t pt-4" data-testid="section-ai-analysis">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">{t('tradeDetail.aiAnalysisResults')}</h4>
                  <div className="space-y-3 text-sm leading-relaxed text-blue-800 dark:text-blue-200" data-testid="text-ai-analysis">
                    {trade.comprehensiveAnalysis ? (
                      // 실제 AI 분석 결과 표시
                      <>
                        <div className="mb-4">
                          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 AI 종합 분석</h5>
                          <p className="text-sm">{trade.comprehensiveAnalysis.executiveSummary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <h6 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              목표가격 분석
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>보수적:</span>
                                <span className="font-medium">${trade.comprehensiveAnalysis.priceTargets.conservative.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>현실적:</span>
                                <span className="font-medium">${trade.comprehensiveAnalysis.priceTargets.realistic.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>낙관적:</span>
                                <span className="font-medium">${trade.comprehensiveAnalysis.priceTargets.optimistic.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <h6 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
                              <Calculator className="h-3 w-3" />
                              리스크 평가
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span>위험도:</span>
                                <Badge className={`text-xs px-2 py-0.5 ${
                                  trade.comprehensiveAnalysis.riskAssessment.level === 'LOW' ? 'bg-green-100 text-green-800' :
                                  trade.comprehensiveAnalysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {trade.comprehensiveAnalysis.riskAssessment.level}
                                </Badge>
                              </div>
                              <p className="text-xs">{trade.comprehensiveAnalysis.riskAssessment.mitigation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 mb-4">
                          <h6 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            투자 권고사항
                          </h6>
                          <p className="text-sm text-blue-700 dark:text-blue-300">{trade.comprehensiveAnalysis.actionableRecommendation}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-blue-200/50">
                          <div className="text-center">
                            <p className="text-xs text-blue-600/80 mb-1">AI 신뢰도</p>
                            <p className="text-lg font-bold text-green-600">{trade.comprehensiveAnalysis.confidence}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-blue-600/80 mb-1">분석 기간</p>
                            <p className="text-sm font-medium">{trade.comprehensiveAnalysis.timeHorizon}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-blue-600/80 mb-1">시장 심리</p>
                            <Badge className={`text-xs px-2 py-1 ${
                              trade.comprehensiveAnalysis.marketContext.sentiment === 'BULLISH' ? 'bg-green-100 text-green-800' :
                              trade.comprehensiveAnalysis.marketContext.sentiment === 'BEARISH' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trade.comprehensiveAnalysis.marketContext.sentiment}
                            </Badge>
                          </div>
                        </div>

                        {trade.comprehensiveAnalysis.catalysts?.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">주요 촉매 요인</p>
                            <ul className="text-xs list-disc list-inside space-y-1">
                              {trade.comprehensiveAnalysis.catalysts.map((catalyst, index) => (
                                <li key={index}>{catalyst}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 뉴스 분석 섹션 */}
                        {trade.comprehensiveAnalysis.newsAnalysis && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-red-50 dark:from-green-950/20 dark:to-red-950/20 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                              <Newspaper className="h-4 w-4 text-blue-600" />
                              📰 최신 뉴스 분석 ({trade.comprehensiveAnalysis.newsAnalysis.totalNews}건)
                            </h6>

                            {/* 뉴스 감정 요약 */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                  {trade.comprehensiveAnalysis.newsAnalysis.positiveCount}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">호재</div>
                              </div>
                              <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                                <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                  {trade.comprehensiveAnalysis.newsAnalysis.negativeCount}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">악재</div>
                              </div>
                              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                  {trade.comprehensiveAnalysis.newsAnalysis.totalNews - trade.comprehensiveAnalysis.newsAnalysis.positiveCount - trade.comprehensiveAnalysis.newsAnalysis.negativeCount}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">중립</div>
                              </div>
                            </div>

                            {/* 주요 뉴스 목록 */}
                            {trade.comprehensiveAnalysis.newsAnalysis.majorNews.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">🔥 주요 뉴스</p>
                                {trade.comprehensiveAnalysis.newsAnalysis.majorNews.map((news, index) => (
                                  <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-start justify-between mb-2">
                                      <h7 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                                        {news.title}
                                      </h7>
                                      <Badge className={`ml-2 text-xs px-2 py-1 ${
                                        news.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        news.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {news.sentiment === 'positive' ? '📈 호재' :
                                         news.sentiment === 'negative' ? '📉 악재' : '⚖️ 중립'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                      {news.summary.slice(0, 120)}...
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                      <span>관련도: {Math.round(news.relevanceScore * 100)}%</span>
                                      <span>{news.source || 'Market Analysis'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // AI 분석이 없을 때 기본 메시지
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-600">AI 분석이 진행 중입니다...</p>
                        <p className="text-xs text-blue-500 mt-1">고급 AI 분석 결과를 준비하고 있습니다</p>
                      </div>
                    )}
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
                {t('liveTrading.alert')}
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
                {isInWatchlist ? t('liveTrading.added') : t('liveTrading.watchlist')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}