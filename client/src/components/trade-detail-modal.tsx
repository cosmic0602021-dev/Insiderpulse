import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';
import {
  TrendingUp, TrendingDown, DollarSign, User, Calendar, BarChart3, Calculator,
  X, Bookmark, Brain, Check, Bell, Star, Lightbulb, Target, Loader2, Camera, Newspaper
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  onAddToWatchlist?: (trade: EnhancedTrade) => void;
  isInWatchlist?: boolean;
}

export function TradeDetailModal({
  isOpen,
  onClose,
  trade,
  onAddToWatchlist,
  isInWatchlist = false
}: TradeDetailModalProps) {
  const { t } = useLanguage();
  const [showPWAGuide, setShowPWAGuide] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<EnhancedTrade['comprehensiveAnalysis'] | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // PWA 설치 여부 확인
  useEffect(() => {
    const checkPWAInstalled = () => {
      // Standalone 모드인지 확인 (홈화면에서 실행 중)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsPWAInstalled(isStandalone);
    };

    checkPWAInstalled();
  }, []);

  // Load AI analysis when modal opens
  useEffect(() => {
    if (isOpen && trade && !trade.comprehensiveAnalysis) {
      loadComprehensiveAnalysis();
    }
  }, [isOpen, trade]);

  const loadComprehensiveAnalysis = async () => {
    if (!trade) return;

    try {
      setIsLoadingAnalysis(true);
      const response = await fetch(`/api/trades/${trade.id}/comprehensive-analysis`);
      
      if (response.ok) {
        const data = await response.json();
        setComprehensiveAnalysis(data);
      } else {
        console.error('Failed to load AI analysis:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // 푸시 알림 구독 처리
  const handlePushNotification = async () => {
    // PWA 미설치 시 안내 모달 표시
    if (!isPWAInstalled) {
      setShowPWAGuide(true);
      return;
    }

    try {
      // Service Worker 등록 확인
      const registration = await navigator.serviceWorker.ready;

      // 알림 권한 요청
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        alert(t('notification.permission.required'));
        return;
      }

      // 푸시 구독
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8-fTn' +
          'G3SNvlUAF' +
          '-86p4OXyaF_a0vWvvCXd8FJvYjQdPi2ZhNY4' // 임시 VAPID 공개키 (나중에 실제 키로 교체)
        )
      });

      // 백엔드에 구독 정보 저장
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          ticker: trade.ticker,
          companyName: trade.companyName
        }),
      });

      // localStorage에 알림 정보 저장 (Alert 페이지에서 사용)
      const existingAlerts = JSON.parse(localStorage.getItem('insiderAlerts') || '[]');
      const newAlert = {
        id: Date.now().toString(),
        type: 'COMPANY',
        condition: 'equals',
        value: trade.companyName,
        ticker: trade.ticker,
        isActive: true,
        name: t('notification.tradeAlert').replace('{company}', trade.companyName).replace('{ticker}', trade.ticker),
        createdAt: new Date().toISOString()
      };

      // 중복 체크 (같은 ticker가 이미 있는지)
      const isDuplicate = existingAlerts.some((alert: any) => alert.ticker === trade.ticker);
      if (!isDuplicate) {
        existingAlerts.push(newAlert);
        localStorage.setItem('insiderAlerts', JSON.stringify(existingAlerts));
      }

      setIsSubscribed(true);
      alert(t('notification.activated').replace('{ticker}', trade.ticker));
      setShowPWAGuide(false);
    } catch (error) {
      console.error('푸시 알림 구독 실패:', error);
      alert(t('notification.failed'));
    }
  };

  // VAPID 키 변환 함수
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleScreenshot = async () => {
    if (!modalRef.current) return;

    try {
      setIsCapturing(true);

      // 약간의 딜레이를 주어 렌더링 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(modalRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');

      // 모바일 브라우저에서 공유 API 사용
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.share({
          title: `InsiderPulse: ${trade.ticker}`,
          text: t('tradeDetail.shareText').replace('{company}', trade.companyName),
          files: [
            new File([blob], `insider_trade_${trade.ticker}.png`, {
              type: 'image/png'
            })
          ]
        });
      } else {
        // 웹 브라우저의 경우 다운로드
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `insider_trade_${trade.ticker}_${new Date().getTime()}.png`;
        link.click();
      }
    } catch (error) {
      console.error('스크린샷 공유 중 오류 발생:', error);
    } finally {
      setIsCapturing(false);
    }
  };

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
      <Card ref={modalRef} className="modal-content card-professional max-w-[95vw] sm:max-w-2xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden relative">
        <CardHeader className="relative z-10 px-3 sm:px-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 sm:gap-3 min-w-0">
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
                  <div className="fallback-logo w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold hidden" style={{display: 'none'}}>
                    {getCompanyInitials(trade.companyName)}
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold">
                  {getCompanyInitials(trade.companyName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-bold truncate">{trade.companyName}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{trade.ticker}</p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {onAddToWatchlist && (
                <Button
                  size="sm"
                  variant={isInWatchlist ? "default" : "outline"}
                  onClick={() => onAddToWatchlist(trade)}
                  className="btn-professional px-2 sm:px-3"
                  title={isInWatchlist ? t('watchlist.remove') : t('liveTrading.watchlist')}
                  data-testid={isInWatchlist ? "button-remove-watchlist" : "button-add-watchlist"}
                >
                  <Bookmark className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline ml-1">{isInWatchlist ? t('watchlist.remove') : t('liveTrading.watchlist')}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleScreenshot}
                disabled={isCapturing}
                className="btn-professional"
                title={t('tradeDetail.shareScreenshot')}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="btn-professional"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10 px-3 sm:px-6">
          {/* 핵심 거래 정보 - 한눈에 보기 */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-6 rounded-lg space-y-4">
            {/* 거래 타입 & 총 금액 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('tradeDetail.tradeType')}</p>
                <Badge className={`btn-professional font-bold text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 w-fit ${getTradeTypeColor(trade.tradeType)}`}>
                  {getTradeTypeIcon(trade.tradeType)}
                  {trade.tradeType}
                </Badge>
              </div>
              <div className="sm:text-right">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('tradeDetail.totalTransactionAmount')}</p>
                <p className={`text-2xl sm:text-3xl font-black ${trade.tradeType?.toUpperCase() === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(trade.totalValue)}
                </p>
              </div>
            </div>

            {/* 주식 수 & 주당 가격 */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/50 dark:border-gray-700">
              <div className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('tradeDetail.sharesCount')}</p>
                <p className="text-2xl font-bold">{trade.shares.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('tradeDetail.shares')}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('tradeDetail.pricePerShare')}</p>
                <p className="text-2xl font-bold">${trade.pricePerShare.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">per share</p>
              </div>
            </div>
          </div>

          {/* 인사이더 정보 - 더 눈에 띄게 */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {t('tradeDetail.insiderInfo')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white dark:bg-gray-800">{t('tradeDetail.name')}</Badge>
                <p className="font-bold text-lg">{trade.traderName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white dark:bg-gray-800">{t('tradeDetail.titlePosition')}</Badge>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{trade.traderTitle}</p>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                <Calendar className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-muted-foreground">{t('tradeDetail.filingDate')}:</p>
                <p className="font-bold">{formatDate(trade.filedDate)}</p>
                <Badge variant="outline" className="text-xs">UTC</Badge>
              </div>
            </div>
          </div>

          {/* SEC 파일링 링크 */}
          {trade.secFilingUrl && (
            <div className="border-t pt-4">
              <a
                href={trade.secFilingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {t('tradeDetail.viewSecFiling')}
              </a>
              <p className="text-xs text-muted-foreground mt-1">
                ✓ {t('tradeDetail.verifiedBySec')}
              </p>
            </div>
          )}

          {/* {t('tradeDetail.priceAnalysisDashboard')} */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {t('tradeDetail.priceAnalysis')}
            </h4>

            {/* 가격 추이 그래프 */}
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h5 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('priceChart.title')}</h5>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={[
                    {
                      name: t('tradeDetail.tradeTime'),
                      [t('tradeDetail.insiderTradePrice')]: trade.pricePerShare,
                      [t('tradeDetail.averageTradePrice')]: trade.recommendedBuyPrice || trade.pricePerShare * 0.98,
                      [t('tradeDetail.referencePrice')]: trade.currentPrice || trade.pricePerShare,
                    },
                    {
                      name: t('tradeDetail.current'),
                      [t('tradeDetail.insiderTradePrice')]: trade.pricePerShare,
                      [t('tradeDetail.averageTradePrice')]: trade.recommendedBuyPrice || trade.pricePerShare * 0.98,
                      [t('tradeDetail.referencePrice')]: trade.currentPrice || trade.pricePerShare,
                    },
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => `$${value.toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey={t('tradeDetail.insiderTradePrice')}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={t('tradeDetail.averageTradePrice')}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={t('tradeDetail.referencePrice')}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* {t('tradeDetail.keyMetrics')} */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 내부자 거래 가격 */}
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
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('tradeDetail.basedOnSecFiling')}</p>
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

              {/* 현재 시장가 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('priceChart.referencePriceLabel')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {trade.currentPrice ? (isMarketOpen() ? t('tradeDetail.realtimeEstimate') : t('tradeDetail.lastClosePrice')) : t('priceChart.tradeTimeBase')}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  ${(trade.currentPrice || trade.pricePerShare).toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {trade.currentPrice
                    ? (isMarketOpen() ? t('priceChart.realtimeMarketPrice') : t('priceChart.lastClosingPrice'))
                    : t('priceChart.basedOnInsiderTradePrice')
                  }
                </p>
              </div>
            </div>

          </div>

          {/* {t('tradeDetail.integratedAiAnalysis')} */}
          <div className="border-t pt-4" data-testid="section-ai-analysis">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-3">{t('tradeDetail.aiAnalysisResults')}</h4>
                  <div className="space-y-3 text-sm leading-relaxed" data-testid="text-ai-analysis">
                    {isLoadingAnalysis ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3">{t('tradeDetail.aiAnalysisGenerating')}</span>
                      </div>
                    ) : (trade.comprehensiveAnalysis || comprehensiveAnalysis) ? (
                      // 실제 AI 분석 결과 표시
                      (() => {
                        const analysis = trade.comprehensiveAnalysis || comprehensiveAnalysis!;
                        return (<>
                        <div className="mb-4">
                          <h5 className="font-semibold mb-2">{t('tradeDetail.aiComprehensiveAnalysis')}</h5>
                          <p className="text-sm text-muted-foreground">{analysis.executiveSummary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <h6 className="font-medium mb-2 flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {t('tradeDetail.targetPriceAnalysis')}
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>{t('tradeDetail.conservative')}:</span>
                                <span className="font-medium">${analysis.priceTargets.conservative.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t('tradeDetail.realistic')}:</span>
                                <span className="font-medium">${analysis.priceTargets.realistic.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t('tradeDetail.optimistic')}:</span>
                                <span className="font-medium">${analysis.priceTargets.optimistic.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <h6 className="font-medium mb-2 flex items-center gap-1">
                              <Calculator className="h-3 w-3" />
                              {t('tradeDetail.riskAssessment')}
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span>{t('tradeDetail.riskLevel')}:</span>
                                <Badge className={`text-xs px-2 py-0.5 ${
                                  analysis.riskAssessment.level === 'LOW' ? 'bg-green-100 text-green-800' :
                                  analysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {analysis.riskAssessment.level}
                                </Badge>
                              </div>
                              <p className="text-xs">{analysis.riskAssessment.mitigation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                          <h6 className="font-medium mb-2 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-amber-600" />
                            {t('tradeDetail.investmentRecommendation')}
                          </h6>
                          <p className="text-sm">{analysis.actionableRecommendation}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">{t('tradeDetail.aiConfidence')}</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-500">{analysis.confidence}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">{t('tradeDetail.analysisTimeHorizon')}</p>
                            <p className="text-sm font-medium">{analysis.timeHorizon}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-blue-600/80 mb-1">{t('tradeDetail.marketSentiment')}</p>
                            <Badge className={`text-xs px-2 py-1 ${
                              analysis.marketContext.sentiment === 'BULLISH' ? 'bg-green-100 text-green-800' :
                              analysis.marketContext.sentiment === 'BEARISH' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {analysis.marketContext.sentiment}
                            </Badge>
                          </div>
                        </div>

                        {analysis.catalysts?.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{t('tradeDetail.keyCatalysts')}</p>
                            <ul className="text-xs list-disc list-inside space-y-1">
                              {analysis.catalysts.map((catalyst, index) => (
                                <li key={index}>{catalyst}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 뉴스 분석 섹션 */}
                        {analysis.newsAnalysis && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-red-50 dark:from-green-950/20 dark:to-red-950/20 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                              <Newspaper className="h-4 w-4 text-blue-600" />
                              {t('tradeDetail.latestNewsAnalysis')} ({analysis.newsAnalysis.totalNews})
                            </h6>

                            {/* 뉴스 감정 요약 */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                  {analysis.newsAnalysis.positiveCount}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">{t('tradeDetail.positive')}</div>
                              </div>
                              <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                                <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                  {analysis.newsAnalysis.negativeCount}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">{t('tradeDetail.negative')}</div>
                              </div>
                              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                  {analysis.newsAnalysis.totalNews - analysis.newsAnalysis.positiveCount - analysis.newsAnalysis.negativeCount}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{t('tradeDetail.neutral')}</div>
                              </div>
                            </div>

                            {/* 주요 뉴스 목록 */}
                            {analysis.newsAnalysis.majorNews.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tradeDetail.majorNews')}</p>
                                {analysis.newsAnalysis.majorNews.map((news, index) => (
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
                                        {news.sentiment === 'positive' ? `📈 ${t('tradeDetail.positive')}` :
                                         news.sentiment === 'negative' ? `📉 ${t('tradeDetail.negative')}` : `⚖️ ${t('tradeDetail.neutral')}`}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                      {news.summary.slice(0, 120)}...
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                      <span>{t('tradeDetail.relevance')}: {Math.round(news.relevanceScore * 100)}%</span>
                                      <span>{news.source || 'Market Analysis'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                      );
                      })()
                    ) : (
                      // AI 분석이 없을 때 기본 메시지
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-600">{t('tradeDetail.aiAnalysisInProgress')}</p>
                        <p className="text-xs text-blue-500 mt-1">{t('tradeDetail.preparingAdvancedAnalysis')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* PWA 설치 안내 모달 */}
      {showPWAGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                {t('notification.settings.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  📱 {t('pwa.prompt.addToHomeScreen')}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {t('pwa.notification.requirement').replace('{company}', trade.companyName)}
                </p>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">iOS (Safari):</p>
                    <ol className="list-decimal list-inside text-xs space-y-1 text-muted-foreground">
                      <li>{t('pwa.ios.step1')}</li>
                      <li>{t('pwa.ios.step2')}</li>
                      <li>{t('pwa.ios.step3')}</li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-medium mb-1">Android (Chrome):</p>
                    <ol className="list-decimal list-inside text-xs space-y-1 text-muted-foreground">
                      <li>{t('pwa.android.step1')}</li>
                      <li>{t('pwa.android.step2')}</li>
                      <li>{t('pwa.android.step3')}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200" dangerouslySetInnerHTML={{
                  __html: '✓ ' + t('pwa.afterInstall').replace('{ticker}', trade.ticker)
                }} />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPWAGuide(false)}
                  className="flex-1"
                >
                  {t('general.close')}
                </Button>
                <Button
                  onClick={() => setShowPWAGuide(false)}
                  className="flex-1"
                >
                  {t('pwa.button.understood')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}