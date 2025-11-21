import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';
import {
  TrendingUp, TrendingDown, DollarSign, User, Calendar, BarChart3, Calculator,
  X, Bookmark, Brain, Check, Bell, Star, Lightbulb, Target, Loader2, Camera, Newspaper, Zap, Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea, Dot, ReferenceDot } from 'recharts';
import logoLight from '@assets/Gemini_Generated_Image_wdqi0fwdqi0fwdqi-Photoroom_1757888880167.png';
import logoDark from '@assets/inverted_with_green_1757888880166.png';
import type { InsiderTrade } from '@shared/schema';
import { useLanguage } from '@/contexts/language-context';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';

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
  const { t, language } = useLanguage();
  const [showPWAGuide, setShowPWAGuide] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<EnhancedTrade['comprehensiveAnalysis'] | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isHistoricalTrade, setIsHistoricalTrade] = useState(false);
  const [tradeAge, setTradeAge] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; close: number; }>>([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null);
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Toggle news item expansion
  const toggleNewsExpansion = (index: number) => {
    setExpandedNews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Format time ago
  const formatTimeAgo = (date: string | Date) => {
    const dateLocale = language === 'ko' ? ko : language === 'ja' ? ja : language === 'zh' ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale
    });
  };

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

  // Load historical price data when modal opens (skip for old trades)
  useEffect(() => {
    if (isOpen && trade && trade.ticker && !isHistoricalTrade) {
      loadPriceHistory();
    }
  }, [isOpen, trade?.id, isHistoricalTrade]);

  const loadComprehensiveAnalysis = async () => {
    if (!trade) return;

    try {
      setIsLoadingAnalysis(true);
      const response = await fetch(`/api/trades/${trade.id}/comprehensive-analysis?language=${language}`);

      if (response.ok) {
        const data = await response.json();

        // Check if this is a historical trade (>7 days old)
        if (data.isHistorical) {
          console.log(`📦 Historical trade detected (${data.tradeAge} days old) - showing basic info only`);
          setIsHistoricalTrade(true);
          setTradeAge(data.tradeAge);
          setComprehensiveAnalysis(null); // No AI analysis for old trades
        } else {
          setIsHistoricalTrade(false);
          setComprehensiveAnalysis(data);
        }
      } else {
        console.error('Failed to load AI analysis:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const loadPriceHistory = async () => {
    if (!trade || !trade.ticker) {
      console.warn('Cannot load price history: missing trade or ticker');
      return;
    }

    // Validate ticker
    const ticker = trade.ticker.trim();
    if (!ticker || ticker.length === 0) {
      console.error('Invalid ticker:', trade.ticker);
      setPriceHistoryError('INVALID_TICKER');
      setIsLoadingPriceHistory(false);
      return;
    }

    try {
      setIsLoadingPriceHistory(true);
      setPriceHistoryError(null);

      // Calculate date range: 7 days before trade, up to today
      const tradeDate = new Date(trade.filedDate);

      // Validate trade date
      if (isNaN(tradeDate.getTime())) {
        console.error('Invalid trade date:', trade.filedDate);
        setPriceHistoryError('INVALID_DATE');
        setPriceHistory([]);
        return;
      }

      const startDate = new Date(tradeDate);
      startDate.setDate(startDate.getDate() - 7);

      // End date: trade date + 7 days, but not beyond today
      const potentialEndDate = new Date(tradeDate);
      potentialEndDate.setDate(potentialEndDate.getDate() + 7);
      const today = new Date();
      const endDate = potentialEndDate > today ? today : potentialEndDate;

      // Format dates as YYYY-MM-DD
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];

      console.log(`📊 Loading price history for ${ticker}: ${fromDate} to ${toDate}`);

      const response = await fetch(`/api/stocks/${ticker}/history?from=${fromDate}&to=${toDate}`);

      if (response.ok) {
        const data = await response.json();

        if (!data || data.length === 0) {
          console.warn(`⚠️ No price data returned for ${ticker} in range ${fromDate} to ${toDate}`);
          setPriceHistoryError('NO_DATA');
          setPriceHistory([]);
          return;
        }

        // Transform data to include only date and close price
        const transformedData = data.map((item: any) => ({
          date: item.date,
          close: parseFloat(item.close)
        }));

        console.log(`✅ Loaded ${transformedData.length} price data points for ${ticker}`);
        setPriceHistory(transformedData);
        setPriceHistoryError(null);
      } else {
        console.error(`Failed to load price history for ${ticker}: HTTP ${response.status}`);
        setPriceHistoryError('API_ERROR');
        setPriceHistory([]);
      }
    } catch (error) {
      console.error('Error loading price history:', error);
      setPriceHistoryError('FETCH_ERROR');
      setPriceHistory([]);
    } finally {
      setIsLoadingPriceHistory(false);
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

  const getLocale = () => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      ko: 'ko-KR',
      ja: 'ja-JP',
      zh: 'zh-CN'
    };
    return localeMap[language] || 'en-US';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(getLocale(), {
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
    <div
      className="modal-backdrop fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* InsiderPulse 워터마크 - 모달 중앙에 고정 */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 overflow-hidden">
        <div className="transform -rotate-12 whitespace-nowrap">
          <h1 className="text-[8vw] font-black text-white/5 tracking-tighter uppercase leading-none text-center">
            InsiderPulse<br/>Signal
          </h1>
        </div>
      </div>
      <Card
        ref={modalRef}
        className="modal-content bg-[#080808] border border-neutral-800 max-w-[95vw] sm:max-w-3xl w-full max-h-[85vh] overflow-y-auto overflow-x-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
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
                <p className="text-xs text-muted-foreground mt-1">{t('tradeDetail.perShare')}</p>
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
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <p className="text-xs text-muted-foreground font-medium">{t('tradeDetail.transactionDate') || 'Transaction Date'}:</p>
                  <p className="font-bold text-base text-slate-900 dark:text-white">{formatDate(trade.filedDate)}</p>
                </div>
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

          {/* {t('tradeDetail.priceAnalysisDashboard')} - Hide for historical trades */}
          {!isHistoricalTrade && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {t('tradeDetail.priceAnalysis')}
            </h4>

            {/* 가격 추이 그래프 */}
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h5 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('priceChart.title')}</h5>

              {isLoadingPriceHistory ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-sm">{t('priceChart.loadingHistory') || 'Loading price history...'}</span>
                </div>
              ) : priceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={priceHistory}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`$${value.toFixed(2)}`, t('priceChart.price') || 'Price']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
                      }}
                    />

                    {/* Highlight area around trade date */}
                    <ReferenceArea
                      x1={(() => {
                        const tradeDate = new Date(trade.filedDate);
                        const dayBefore = new Date(tradeDate);
                        dayBefore.setDate(dayBefore.getDate() - 1);
                        return dayBefore.toISOString().split('T')[0];
                      })()}
                      x2={(() => {
                        const tradeDate = new Date(trade.filedDate);
                        const dayAfter = new Date(tradeDate);
                        dayAfter.setDate(dayAfter.getDate() + 1);
                        return dayAfter.toISOString().split('T')[0];
                      })()}
                      fill="#f59e0b"
                      fillOpacity={0.1}
                    />

                    {/* Vertical reference line for trade date - ENHANCED */}
                    <ReferenceLine
                      x={new Date(trade.filedDate).toISOString().split('T')[0]}
                      stroke="#f59e0b"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      label={{
                        value: `📊 ${t('tradeDetail.tradeDate') || 'Trade Date'}`,
                        position: 'top',
                        fill: '#f59e0b',
                        fontSize: 13,
                        fontWeight: 'bold',
                        style: {
                          textShadow: '0 0 3px white, 0 0 5px white'
                        }
                      }}
                    />

                    {/* Horizontal reference line for trade price - ENHANCED */}
                    <ReferenceLine
                      y={trade.pricePerShare}
                      stroke="#f59e0b"
                      strokeWidth={3}
                      label={{
                        value: `Trade Price: $${trade.pricePerShare.toFixed(2)}`,
                        position: 'insideTopRight',
                        fill: '#f59e0b',
                        fontSize: 13,
                        fontWeight: 'bold',
                        style: {
                          backgroundColor: 'rgba(251, 146, 60, 0.9)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: 'white'
                        }
                      }}
                    />

                    {/* 내부자 거래가격을 나타내는 큰 노란색 동그라미 */}
                    <ReferenceDot
                      x={new Date(trade.filedDate).toISOString().split('T')[0]}
                      y={trade.pricePerShare}
                      r={8}
                      fill="#f59e0b"
                      stroke="#fff"
                      strokeWidth={3}
                      isFront={true}
                    />
                    {/* 펄싱 효과를 위한 외부 원들 */}
                    <ReferenceDot
                      x={new Date(trade.filedDate).toISOString().split('T')[0]}
                      y={trade.pricePerShare}
                      r={14}
                      fill="#f59e0b"
                      fillOpacity={0.25}
                      stroke="none"
                    />
                    <ReferenceDot
                      x={new Date(trade.filedDate).toISOString().split('T')[0]}
                      y={trade.pricePerShare}
                      r={11}
                      fill="#f59e0b"
                      fillOpacity={0.4}
                      stroke="none"
                    />

                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name={t('priceChart.price') || 'Price'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                  {priceHistoryError === 'INVALID_TICKER' && (
                    <>
                      <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">⚠️ {t('priceChart.error.invalidTicker')}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{t('priceChart.error.invalidTickerDesc')}</p>
                    </>
                  )}
                  {priceHistoryError === 'INVALID_DATE' && (
                    <>
                      <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">⚠️ {t('priceChart.error.invalidDate')}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{t('priceChart.error.invalidDateDesc')}</p>
                    </>
                  )}
                  {(priceHistoryError === 'NO_DATA' || !priceHistoryError) && (
                    <div className="text-center">
                      <div className="mb-3">
                        <p className="text-blue-800 dark:text-blue-200 font-semibold text-base mb-1">
                          💡 {t('priceChart.error.noDataTitle')}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {priceHistoryError === 'NO_DATA'
                            ? t('priceChart.error.noDataDescDelisted')
                            : t('priceChart.error.noDataDescPending')}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-blue-950/50 rounded-lg p-4 mt-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                          ✅ {t('priceChart.error.fallbackTitle')}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {t('priceChart.error.fallbackDesc')}
                        </p>
                      </div>
                    </div>
                  )}
                  {(priceHistoryError === 'API_ERROR' || priceHistoryError === 'FETCH_ERROR') && (
                    <div className="text-center">
                      <p className="text-red-700 dark:text-red-300 font-medium mb-2">❌ {t('priceChart.error.apiFailed')}</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        {t('priceChart.error.apiFailedDesc')}
                      </p>
                      <div className="bg-white dark:bg-blue-950/50 rounded-lg p-3 mt-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          💡 {t('priceChart.error.tradeInfoAvailable')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* {t('tradeDetail.keyMetrics')} */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

              {/* 현재 시장가 + 가격 변동 */}
              <div className={`rounded-lg p-4 border-2 ${
                trade.currentPrice && trade.currentPrice !== trade.pricePerShare
                  ? (trade.currentPrice > trade.pricePerShare
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700')
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trade.currentPrice && trade.currentPrice !== trade.pricePerShare
                      ? (trade.currentPrice > trade.pricePerShare
                        ? 'bg-green-500 dark:bg-green-600'
                        : 'bg-red-500 dark:bg-red-600')
                      : 'bg-slate-600 dark:bg-slate-500'
                  }`}>
                    {trade.currentPrice && trade.currentPrice > trade.pricePerShare ? (
                      <TrendingUp className="h-4 w-4 text-white" />
                    ) : trade.currentPrice && trade.currentPrice < trade.pricePerShare ? (
                      <TrendingDown className="h-4 w-4 text-white" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('tradeDetail.currentMarketPrice')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {trade.currentPrice ? (isMarketOpen() ? t('tradeDetail.realtimeEstimate') : t('tradeDetail.lastClosePrice')) : t('priceChart.tradeTimeBase')}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    ${(trade.currentPrice || trade.pricePerShare).toFixed(2)}
                  </p>

                  {/* 가격 변동 표시 */}
                  {trade.currentPrice && trade.currentPrice !== trade.pricePerShare && (() => {
                    const priceChange = trade.currentPrice - trade.pricePerShare;
                    const percentChange = ((priceChange / trade.pricePerShare) * 100);
                    const isGain = priceChange > 0;

                    return (
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          isGain
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}>
                          {isGain ? '+' : ''}{percentChange.toFixed(2)}%
                        </p>
                        <p className={`text-sm font-semibold ${
                          isGain
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {isGain ? '+' : ''}${Math.abs(priceChange).toFixed(2)}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {trade.currentPrice && trade.currentPrice !== trade.pricePerShare
                    ? t('tradeDetail.priceChangeSinceTrade')
                    : (trade.currentPrice
                      ? (isMarketOpen() ? t('priceChart.realtimeMarketPrice') : t('priceChart.lastClosingPrice'))
                      : t('priceChart.basedOnInsiderTradePrice'))
                  }
                </p>

                {/* 가격 수집 시간 표시 */}
                {(trade as any).priceLastUpdated && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t('tradeDetail.priceUpdatedAt') || '수집 시간'}: {formatTimeAgo((trade as any).priceLastUpdated)}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
          )}

          {/* {t('tradeDetail.integratedAiAnalysis')} */}
          <div className="border-t pt-4" data-testid="section-ai-analysis">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div className="w-full">
                  <h4 className="font-semibold text-sm mb-3 text-center">{t('tradeDetail.aiAnalysisResults')}</h4>

                  <div className="space-y-3 text-sm leading-relaxed" data-testid="text-ai-analysis">
                    {isLoadingAnalysis ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3">{t('tradeDetail.aiAnalysisGenerating')}</span>
                      </div>
                    ) : isHistoricalTrade ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                        <Clock className="h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          {language === 'ko' ? '과거 거래 기록' :
                           language === 'ja' ? '過去の取引記録' :
                           language === 'zh' ? '历史交易记录' :
                           'Historical Trade Record'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {language === 'ko' ? `이 거래는 ${tradeAge}일 이상 경과했습니다.` :
                           language === 'ja' ? `この取引は${tradeAge}日以上経過しています。` :
                           language === 'zh' ? `此交易已超过${tradeAge}天。` :
                           `This trade is over ${tradeAge} days old.`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-md mt-2">
                          {language === 'ko' ? '비용 최적화를 위해 오래된 거래에는 AI 분석 및 뉴스를 제공하지 않습니다. 기본 거래 정보만 확인하실 수 있습니다.' :
                           language === 'ja' ? 'コスト最適化のため、古い取引にはAI分析とニュースを提供していません。基本的な取引情報のみご確認いただけます。' :
                           language === 'zh' ? '为优化成本，旧交易不提供AI分析和新闻。仅可查看基本交易信息。' :
                           'To optimize costs, AI analysis and news are not provided for old trades. Only basic trade information is available.'}
                        </p>
                      </div>
                    ) : (trade.comprehensiveAnalysis || comprehensiveAnalysis) ? (
                      // 실제 AI 분석 결과 표시 (통합된 종합의견 포함)
                      (() => {
                        const analysis = trade.comprehensiveAnalysis || comprehensiveAnalysis!;
                        const sentiment = analysis.marketContext?.sentiment || 'NEUTRAL';
                        const isBullish = sentiment === 'BULLISH';
                        const isBearish = sentiment === 'BEARISH';

                        return (<>
                        {/* 통합된 AI 종합 분석 헤더 */}
                        <div className={`mb-4 p-4 rounded-lg border-2 ${
                          isBullish ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                          isBearish ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                          'bg-gray-50 dark:bg-gray-900/20 border-gray-500'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-base flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              {t('tradeDetail.aiComprehensiveAnalysis')}
                            </h5>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-sm px-3 py-1 font-bold ${
                                isBullish ? 'bg-green-600 text-white' :
                                isBearish ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                                {isBullish ? t('tradeDetail.buyRecommendation') : isBearish ? t('tradeDetail.sellRecommendation') : t('tradeDetail.holdRecommendation')}
                              </Badge>
                              <div className="text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border">
                                <p className="text-xs text-muted-foreground">{t('tradeDetail.confidenceLevel')}</p>
                                <p className="text-lg font-bold text-blue-600">{analysis.confidence}%</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.executiveSummary}</p>
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
                              {t(`tradeDetail.sentiment.${analysis.marketContext.sentiment.toLowerCase()}`)}
                            </Badge>
                          </div>
                        </div>

                        {analysis.catalysts?.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {t('tradeDetail.keyCatalysts')}
                            </p>
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
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  {t('tradeDetail.majorNews')}
                                </p>
                                {analysis.newsAnalysis.majorNews.map((news, index) => {
                                  const sentimentLower = news.sentiment.toLowerCase();
                                  const isPositive = sentimentLower.includes('positive') || sentimentLower.includes('bullish');
                                  const isNegative = sentimentLower.includes('negative') || sentimentLower.includes('bearish');
                                  const isExpanded = expandedNews.has(index);

                                  return (
                                    <div
                                      key={index}
                                      className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all"
                                      onClick={() => toggleNewsExpansion(index)}
                                    >
                                      <div className="flex items-start justify-between">
                                        <h7 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex-1">
                                          {news.title}
                                        </h7>
                                        <Badge className={`ml-2 text-xs px-2 py-1 whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                                          isPositive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                          isNegative ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                          {isPositive ? <><TrendingUp className="h-3 w-3" /> {t('tradeDetail.positive')}</> :
                                           isNegative ? <><TrendingDown className="h-3 w-3" /> {t('tradeDetail.negative')}</> :
                                           <><DollarSign className="h-3 w-3" /> {t('tradeDetail.neutral')}</>}
                                        </Badge>
                                      </div>

                                      {/* Expandable details */}
                                      {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                                            {news.summary}
                                          </p>
                                          <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4" />
                                              <span className="font-medium">
                                                {new Date(news.published).toLocaleDateString(
                                                  language === 'ko' ? 'ko-KR' : 'en-US',
                                                  { year: 'numeric', month: 'short', day: 'numeric' }
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span>{t('tradeDetail.relevance')}: {Math.round(news.relevanceScore * 100)}%</span>
                                              <span>{news.source || t('tradeDetail.marketAnalysis')}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Click indicator */}
                                      <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                                        {isExpanded ? t('tradeDetail.clickToCollapse') : t('tradeDetail.clickToExpand')}
                                      </div>
                                    </div>
                                  );
                                })}
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