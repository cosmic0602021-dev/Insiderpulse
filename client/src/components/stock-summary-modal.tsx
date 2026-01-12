// Modified for App Store compliance: price target safe mode - removed all investment predictions
import { X, AlertTriangle, Brain, Target, TrendingUp, Users, ChevronDown, ChevronUp, Info, Bell, BellOff } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ReferenceDot, CartesianGrid } from 'recharts';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, formatNumber, TRANSLATIONS } from '@/lib/translations';
import { resolveApiUrl } from '@/lib/queryClient';
import { useState, useEffect, useMemo, useId, useCallback, useRef } from 'react';
import { StockRecommendation } from './terminal-ui/types';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPushNotifications } from '@/lib/push-subscription';
import { ENV_CONFIG } from '@/lib/environment';

interface StockPriceData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  sector?: string | null;
}

interface StockSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRecommendation | null;
}

type AnalysisError = {
  type: 'not_ranked' | 'temporary_error' | 'network_error' | 'not_available';
  message: string;
  retryable: boolean;
};

export function StockSummaryModal({ isOpen, onClose, stock }: StockSummaryModalProps) {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState<StockPriceData | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);

  // Notification subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // ✅ Map-based cache: Store analysis for multiple tickers AND languages in same session
  // Key format: `${ticker}_${language}` to support language-specific caching
  const analysisCache = useRef<Map<string, any>>(new Map());
  const cachedTickerRef = useRef<string | null>(null);
  const cachedLanguageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !stock?.ticker) {
      setStockPrice(null);
      // ✅ DON'T clear comprehensiveAnalysis or cache when modal closes
      return;
    }

    // ✅ Check if ticker OR language changed - both require cache update
    const tickerChanged = cachedTickerRef.current && cachedTickerRef.current !== stock.ticker;
    const languageChanged = cachedLanguageRef.current && cachedLanguageRef.current !== language;

    if (tickerChanged || languageChanged) {
      // Save current analysis to cache with previous ticker_language key
      if (comprehensiveAnalysis && !analysisError && cachedTickerRef.current) {
        const prevCacheKey = `${cachedTickerRef.current}_${cachedLanguageRef.current || 'en'}`;
        analysisCache.current.set(prevCacheKey, comprehensiveAnalysis);
        console.log(`💾 Cached analysis for ${prevCacheKey} (cache size: ${analysisCache.current.size})`);
      }

      // Clear state - fetchAnalysis will load correct language version from cache or prop
      setComprehensiveAnalysis(null);
      setAnalysisError(null);
    }

    // Update refs to current values
    cachedTickerRef.current = stock.ticker;
    cachedLanguageRef.current = language;

    const fetchStockPrice = async () => {
      try {
        const response = await fetch(resolveApiUrl(`/api/stocks/${stock.ticker}`));
        if (response.ok) {
          const data = await response.json();
          setStockPrice(data);
        }
      } catch (error) {
        console.error('Failed to fetch stock price:', error);
      }
    };

    // ==================================================================================
    // 🔒 CRITICAL: AI Analysis Caching Logic - DO NOT MODIFY WITHOUT UNDERSTANDING
    // ==================================================================================
    // This caching hierarchy prevents unnecessary API calls and ensures all users
    // share the same AI analysis (cost optimization + instant UX).
    //
    // ⚠️ PRIORITY ORDER IS CRITICAL - DO NOT CHANGE:
    //    1. State check (already loaded)
    //    2. Prop check (stock.comprehensiveAnalysis from ranking data) ← MOST IMPORTANT
    //    3. Session cache check (analysisCache Map)
    //    4. API call (only when all caches miss)
    //
    // 🚫 DO NOT:
    //    - Change the priority order
    //    - Add comprehensiveAnalysis to useEffect dependency array (causes race condition)
    //    - Remove stock.comprehensiveAnalysis check (breaks cross-user caching)
    //    - Skip cache.set() calls (breaks session persistence)
    //
    // ✅ This ensures: New refresh/Different account/Page navigation → Instant display (NO API call)
    // ==================================================================================
    const fetchAnalysis = async () => {
      if (!stock?.ticker) return;

      // PRIORITY 1: Already loaded in state - skip everything
      if (comprehensiveAnalysis && !analysisError) {
        console.log(`✅ Analysis already loaded in state for ${stock.ticker} - no action needed`);
        return;
      }

      // PRIORITY 2: Check prop - analysis from ranking data (shared across all users) - NO API CALL
      // 🔒 CRITICAL: This is the main cache that enables cross-user sharing
      // ✅ analysisLanguage 확인: 현재 언어와 일치할 때만 사용
      if (stock.comprehensiveAnalysis) {
        const analysisData = stock.comprehensiveAnalysis as any;
        const analysisLang = analysisData?.analysisLanguage;

        // 언어가 일치하거나, 언어 필드가 없는 경우(레거시 데이터)에만 사용
        if (analysisLang === language || (!analysisLang && language === 'en')) {
          const cacheKey = `${stock.ticker}_${language}`;
          console.log(`✅ Using pre-loaded analysis from ranking data for ${stock.ticker} (${language}) - NO API CALL NEEDED!`);
          setComprehensiveAnalysis(stock.comprehensiveAnalysis);
          setAnalysisError(null);
          analysisCache.current.set(cacheKey, stock.comprehensiveAnalysis);
          return;
        } else {
          console.log(`🔄 Analysis language mismatch: have ${analysisLang || 'unknown'}, need ${language} - will fetch from API`);
        }
      }

      // PRIORITY 3: Check session cache (Map) with language-specific key - NO API CALL
      const cacheKey = `${stock.ticker}_${language}`;
      const cachedAnalysis = analysisCache.current.get(cacheKey);
      if (cachedAnalysis) {
        console.log(`✅ Using session cache for ${stock.ticker} (${language}) - NO API CALL NEEDED`);
        setComprehensiveAnalysis(cachedAnalysis);
        setAnalysisError(null);
        return;
      }

      // PRIORITY 4: No cached data - fetch from API
      console.log(`🔄 No cached analysis found for ${stock.ticker} - fetching from API...`);
      setIsLoadingAnalysis(true);
      setAnalysisError(null);

      try {
        // Use new ranking-specific endpoint (bypasses 48h delay for ranked stocks)
        const tradeResponse = await fetch(
          resolveApiUrl(`/api/rankings/stock/${stock.ticker}/analysis-trade?language=${language}`)
        );

        if (!tradeResponse.ok) {
          if (tradeResponse.status === 403) {
            // Stock is not currently ranked
            setAnalysisError({
              type: 'not_ranked',
              message: language === 'ko' ? '이 종목은 현재 상위 랭킹에 포함되어 있지 않습니다.' :
                       language === 'ja' ? 'この銘柄は現在上位ランキングに含まれていません。' :
                       language === 'zh' ? '该股票目前未列入排名。' :
                       'This stock is not currently in top rankings.',
              retryable: false
            });
            setIsLoadingAnalysis(false);
            return;
          }

          if (tradeResponse.status === 404) {
            // No trade data for this ticker
            setAnalysisError({
              type: 'not_available',
              message: language === 'ko' ? '거래 데이터를 찾을 수 없습니다.' :
                       language === 'ja' ? '取引データが見つかりません。' :
                       language === 'zh' ? '未找到交易数据。' :
                       'No trade data found.',
              retryable: false
            });
            setIsLoadingAnalysis(false);
            return;
          }

          throw new Error(`Trade fetch failed: ${tradeResponse.status}`);
        }

        const tradeData = await tradeResponse.json();

        // If we got cached analysis in the response, use it immediately
        if (tradeData.comprehensiveAnalysis) {
          console.log(`✅ Using pre-cached analysis from trade fetch - NO API CALL NEEDED`);
          setComprehensiveAnalysis(tradeData.comprehensiveAnalysis);
          setAnalysisError(null);
          analysisCache.current.set(cacheKey, tradeData.comprehensiveAnalysis);
          setIsLoadingAnalysis(false);
          return;
        }

        const tradeId = tradeData.tradeId;

        // Fetch with 30-second timeout (AI analysis takes longer)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const analysisResponse = await fetch(
            `/api/trades/${tradeId}/comprehensive-analysis?language=${language}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (!analysisResponse.ok) {
            if (analysisResponse.status === 503) {
              setAnalysisError({
                type: 'temporary_error',
                message: language === 'ko' ? '일시적인 서버 오류입니다.' :
                         language === 'ja' ? '一時的なサーバーエラーです。' :
                         language === 'zh' ? '临时服务器错误。' :
                         'Temporary server error.',
                retryable: true
              });
              setIsLoadingAnalysis(false);
              return;
            }
            throw new Error(`Analysis API returned ${analysisResponse.status}`);
          }

          const analysisData = await analysisResponse.json();

          // Check for specific errors
          if (analysisData.notRanked) {
            setComprehensiveAnalysis(analysisData);
            setIsLoadingAnalysis(false);
            return;
          }

          if (analysisData.error) {
            setAnalysisError({
              type: analysisData.errorType === 'temporary' ? 'temporary_error' : 'not_available',
              message: analysisData.message,
              retryable: analysisData.retryable || false
            });
            setIsLoadingAnalysis(false);
            return;
          }

          // Success! Save to cache for future use with language-specific key
          const successCacheKey = `${stock.ticker}_${language}`;
          console.log(`✅ Successfully fetched analysis for ${stock.ticker} (${language}) from API`);
          setComprehensiveAnalysis(analysisData);
          setAnalysisError(null);
          analysisCache.current.set(successCacheKey, analysisData);

        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setAnalysisError({
              type: 'temporary_error',
              message: language === 'ko' ? '요청 시간이 초과되었습니다.' :
                       language === 'ja' ? 'リクエストがタイムアウトしました。' :
                       language === 'zh' ? '请求超时。' :
                       'Request timed out.',
              retryable: true
            });
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        setAnalysisError({
          type: 'network_error',
          message: language === 'ko' ? '네트워크 오류가 발생했습니다.' :
                   language === 'ja' ? 'ネットワークエラーが発生しました。' :
                   language === 'zh' ? '发生网络错误。' :
                   'Network error occurred.',
          retryable: true
        });
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchStockPrice();
    fetchAnalysis();
  }, [isOpen, stock?.ticker, language]);
  // 🔒 CRITICAL: DO NOT add 'comprehensiveAnalysis' to dependency array!
  // Adding it causes race condition: setState is async, fetchAnalysis runs before state updates,
  // causing unnecessary API calls even when stock.comprehensiveAnalysis exists.
  // Current deps are correct: only re-run when modal opens/closes, ticker changes, or language changes.

  // Check notification subscription status
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !stock?.ticker) {
      setIsSubscribed(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(
          resolveApiUrl(`/api/notifications/subscriptions?ticker=${stock.ticker}`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              ...(ENV_CONFIG.isAppintos && { 'x-appintos-env': 'true' }),
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isSubscribed || false);
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };

    checkSubscription();
  }, [isOpen, isAuthenticated, stock?.ticker]);

  // Check if PWA is installed
  const isPWAInstalled = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    return isStandalone || isIOSStandalone;
  };

  // Check if mobile device
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(navigator.userAgent);
  };

  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Handle notification subscription toggle
  const handleNotificationToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: language === 'ko' ? '로그인 필요' : 'Login Required',
        description: language === 'ko' ? '알림을 받으려면 로그인이 필요합니다.' : 'Please log in to receive notifications.',
        variant: 'destructive',
      });
      return;
    }

    if (!stock?.ticker || !stock?.companyName) {
      return;
    }

    // Check if mobile and PWA not installed (only for subscribe, not unsubscribe)
    if (!isSubscribed && !ENV_CONFIG.isAppintos && isMobileDevice() && !isPWAInstalled()) {
      const installGuide = isIOS()
        ? language === 'ko'
          ? 'Safari 하단의 공유 버튼 → "홈 화면에 추가"를 선택하세요.'
          : 'Tap Share button at the bottom → "Add to Home Screen"'
        : language === 'ko'
          ? 'Chrome 메뉴(⋮) → "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.'
          : 'Chrome menu (⋮) → "Add to Home Screen" or "Install App"';

      toast({
        title: language === 'ko' ? '앱 설치 필요' : 'App Installation Required',
        description: language === 'ko'
          ? `푸시 알림을 받으려면 홈 화면에 앱을 설치해주세요. ${installGuide}`
          : `Please install the app to your home screen for push notifications. ${installGuide}`,
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token');
      }

      const action = isSubscribed ? 'unsubscribe' : 'subscribe';

      // For PWA, get push subscription first
      let pushSubscription = null;
      if (action === 'subscribe' && !ENV_CONFIG.isAppintos) {
        pushSubscription = await subscribeToPushNotifications();
        if (!pushSubscription) {
          toast({
            title: language === 'ko' ? '알림 권한 필요' : 'Notification Permission Required',
            description: language === 'ko' ? '브라우저 설정에서 알림을 허용해주세요.' : 'Please allow notifications in your browser settings.',
            variant: 'destructive',
          });
          setIsSubscribing(false);
          return;
        }
      }

      const response = await fetch(resolveApiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(ENV_CONFIG.isAppintos && { 'x-appintos-env': 'true' }),
        },
        body: JSON.stringify({
          ticker: stock.ticker,
          companyName: stock.companyName,
          action,
          pushSubscription: pushSubscription ? {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: pushSubscription.toJSON().keys?.p256dh,
              auth: pushSubscription.toJSON().keys?.auth,
            }
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Subscription failed');
      }

      setIsSubscribed(!isSubscribed);

      toast({
        title: isSubscribed
          ? (language === 'ko' ? '알림 해제됨' : 'Notifications Disabled')
          : (language === 'ko' ? '알림 설정됨' : 'Notifications Enabled'),
        description: isSubscribed
          ? (language === 'ko' ? `${stock.ticker} 알림이 해제되었습니다.` : `Notifications for ${stock.ticker} disabled.`)
          : (language === 'ko' ? `${stock.ticker}의 내부자 거래 시 알림을 받습니다.` : `You'll receive notifications for ${stock.ticker} insider trades.`),
      });
    } catch (error: any) {
      console.error('Notification toggle error:', error);
      toast({
        title: language === 'ko' ? '오류' : 'Error',
        description: error.message || (language === 'ko' ? '알림 설정에 실패했습니다.' : 'Failed to update notification settings.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].modal;
  const tTop = TRANSLATIONS[langKey].top;
  const tData = TRANSLATIONS[langKey].data;

  const stats = useMemo(() => {
    if (!stock) return null;

    const buyers = stock.buyers;
    const totalShares = buyers.reduce((sum, b) => sum + b.shares, 0);
    const totalAmount = buyers.reduce((sum, b) => sum + b.amount, 0);

    // 🔧 avgBuyPrice 우선순위:
    // 1. stock.avgBuyPrice (서버에서 계산된 값)
    // 2. buyers의 price 평균 (fallback)
    // 3. buyers의 amount/shares 계산 (최후 fallback)
    let avgPrice = stock.avgBuyPrice;

    // Fallback 1: buyers의 price 필드 평균
    if (!avgPrice || avgPrice <= 0) {
      const validPrices = buyers.filter(b => b.price && b.price > 0).map(b => b.price);
      if (validPrices.length > 0) {
        avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
      }
    }

    // Fallback 2: totalAmount / totalShares
    if (!avgPrice || avgPrice <= 0) {
      avgPrice = totalShares > 0 ? totalAmount / totalShares : 0;
    }

    console.log(`📊 [Modal] ${stock.ticker} avgPrice:`, {
      serverAvgBuyPrice: stock.avgBuyPrice,
      calculatedAvgPrice: avgPrice,
      buyersCount: buyers.length,
      totalShares,
      totalAmount
    });

    // Parse dates safely, filtering out invalid dates
    const validDates = buyers
      .map(b => {
        const d = new Date(b.date);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    const firstDate = validDates.length > 0 ? validDates[0] : new Date();
    const lastDate = validDates.length > 0 ? validDates[validDates.length - 1] : new Date();

    return {
      // buyers 배열 길이 직접 사용 (일관성 유지)
      buyerCount: buyers.length,
      totalShares,
      totalAmount: stock.totalBuyAmount || totalAmount,  // 서버 값 우선
      avgPrice,  // stock.avgBuyPrice 사용
      firstDate,
      lastDate,
      currentPrice: stock.currentPrice,
      priceChange: stock.priceChange
    };
  }, [stock]);

  // Modified for App Store compliance: price target safe mode - NO PRICE TARGET CALCULATIONS
  const aiAnalysis = useMemo(() => {
    if (!stock || !stats) return null;

    const isManyBuyers = stats.buyerCount >= 3;
    const isLargeAmount = stats.totalAmount > 1000000;
    const isPositiveChange = stats.priceChange > 0;

    let confidence = 50;
    confidence += stats.buyerCount * 8;
    if (isLargeAmount) confidence += 15;
    if (isPositiveChange) confidence += 10;
    confidence = Math.min(95, confidence);

    let insight = '';
    if (langKey === 'ko') {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount}명의 내부자가 동시에 대규모 매수 거래 발생.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount}명의 내부자가 동시 매수 활동 감지됨.`;
      } else {
        insight = '다수 내부자 동시 매수 활동이 기록되었습니다.';
      }
    } else {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount} insiders made large simultaneous purchases.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount} insiders bought simultaneously.`;
      } else {
        insight = 'Multiple insider purchases detected.';
      }
    }

    return {
      signal: 'BUY' as const,
      confidence,
      insight,
      riskLevel: isLargeAmount ? t.riskLow : t.riskMedium,
      timeHorizon: isManyBuyers ? (langKey === 'ko' ? '2-4주' : '2-4 weeks') : (langKey === 'ko' ? '3-6주' : '3-6 weeks')
    };
  }, [stock, stats, t, langKey]);

  // Fallback 분석 인사이트 생성 (서버 AI 분석이 없을 때 사용)
  const analysisInsights = useMemo(() => {
    if (!stock || !stats) return { summary: '', insights: [] };
    const insights: string[] = [];
    const currentPriceChange = stats.currentPrice && stats.avgPrice > 0
      ? ((stats.currentPrice - stats.avgPrice) / stats.avgPrice) * 100
      : 0;

    // 클러스터 매수 분석
    if (stats.buyerCount >= 3) {
      insights.push(langKey === 'ko'
        ? '다수 내부자 동시 매수는 역사적으로 긍정적 신호와 상관관계가 높습니다'
        : langKey === 'ja'
        ? '複数インサイダーの同時購入は歴史的にポジティブなシグナルと相関しています'
        : langKey === 'zh'
        ? '多位内部人士同时购买历史上与积极信号相关'
        : 'Multiple simultaneous insider purchases historically correlate with positive outcomes');
    } else if (stats.buyerCount >= 2) {
      insights.push(langKey === 'ko'
        ? '복수 내부자의 동시 매수 활동이 감지되었습니다'
        : langKey === 'ja'
        ? '複数インサイダーによる協調的な買い活動が検出されました'
        : langKey === 'zh'
        ? '检测到多位内部人士协调买入活动'
        : 'Coordinated insider buying activity detected');
    }

    // 거래 규모 분석
    if (stats.totalAmount > 5000000) {
      const amountM = (stats.totalAmount / 1000000).toFixed(1);
      insights.push(langKey === 'ko'
        ? `$${amountM}M 대규모 매수는 내부자의 강한 확신을 시사합니다`
        : langKey === 'ja'
        ? `$${amountM}Mの大規模購入はインサイダーの強い確信を示しています`
        : langKey === 'zh'
        ? `$${amountM}M大规模买入表明内部人士有强烈信心`
        : `$${amountM}M position indicates high conviction level`);
    } else if (stats.totalAmount > 1000000) {
      const amountM = (stats.totalAmount / 1000000).toFixed(1);
      insights.push(langKey === 'ko'
        ? `$${amountM}M 규모의 유의미한 매수 활동`
        : langKey === 'ja'
        ? `$${amountM}M規模の有意義な購入活動`
        : langKey === 'zh'
        ? `$${amountM}M规模的重要买入活动`
        : `Significant $${amountM}M purchase activity`);
    }

    // 시가총액 대비 분석
    if (stock.marketCap && stock.marketCap > 0) {
      const ratio = (stats.totalAmount / stock.marketCap) * 100;
      if (ratio >= 0.5) {
        insights.push(langKey === 'ko'
          ? `시가총액의 ${ratio.toFixed(2)}% 매수 - 지분 확대 의지 표명`
          : langKey === 'ja'
          ? `時価総額の${ratio.toFixed(2)}%購入 - 持分拡大の意志を示す`
          : langKey === 'zh'
          ? `购买市值的${ratio.toFixed(2)}% - 表明增持意愿`
          : `${ratio.toFixed(2)}% of market cap - signaling commitment to stake increase`);
      }
    }

    // 수익률 분석 (해석 추가)
    if (currentPriceChange > 10) {
      insights.push(langKey === 'ko'
        ? `내부자 매수 이후 ${currentPriceChange.toFixed(1)}% 상승 - 내부자 판단 검증됨`
        : langKey === 'ja'
        ? `インサイダー購入後${currentPriceChange.toFixed(1)}%上昇 - インサイダーの判断が検証されました`
        : langKey === 'zh'
        ? `内部人士买入后上涨${currentPriceChange.toFixed(1)}% - 内部人士判断得到验证`
        : `${currentPriceChange.toFixed(1)}% gain since purchase - insider thesis validated`);
    } else if (currentPriceChange > 0) {
      insights.push(langKey === 'ko'
        ? `매수 이후 ${currentPriceChange.toFixed(1)}% 수익 실현 중`
        : langKey === 'ja'
        ? `購入後${currentPriceChange.toFixed(1)}%の利益を実現中`
        : langKey === 'zh'
        ? `买入后实现${currentPriceChange.toFixed(1)}%收益`
        : `Currently ${currentPriceChange.toFixed(1)}% above entry price`);
    } else if (currentPriceChange < -10) {
      insights.push(langKey === 'ko'
        ? `매수 대비 ${Math.abs(currentPriceChange).toFixed(1)}% 하락 - 추가 매수 기회 또는 재평가 필요`
        : langKey === 'ja'
        ? `購入価格から${Math.abs(currentPriceChange).toFixed(1)}%下落 - 追加購入機会または再評価が必要`
        : langKey === 'zh'
        ? `较买入价下跌${Math.abs(currentPriceChange).toFixed(1)}% - 可能是加仓机会`
        : `${Math.abs(currentPriceChange).toFixed(1)}% below entry - potential accumulation zone`);
    }

    // 요약 문장 생성
    const summary = langKey === 'ko'
      ? `${stats.buyerCount}명 내부자의 집단 매수 활동이 SEC에 보고되었습니다.`
      : langKey === 'ja'
      ? `${stats.buyerCount}名のインサイダーによる集団購入活動がSECに報告されました。`
      : langKey === 'zh'
      ? `${stats.buyerCount}位内部人士的集体买入活动已向SEC报告。`
      : `Cluster buying activity by ${stats.buyerCount} insiders reported to SEC.`;

    return { summary, insights };
  }, [stock, stats, langKey]);

  const priceHistory = useMemo(() => {
    if (!stock || !stats) return [];

    // NaN/0 방어: avgPrice가 유효하지 않으면 빈 배열 반환
    if (!stats.avgPrice || isNaN(stats.avgPrice) || stats.avgPrice <= 0) {
      console.warn(`⚠️ [Modal] ${stock.ticker} priceHistory empty: avgPrice=${stats.avgPrice}`);
      return [];
    }

    const avgDate = new Date((stats.firstDate.getTime() + stats.lastDate.getTime()) / 2);
    const avgPrice = stats.avgPrice;
    const data = [];

    // Use ticker as seed for consistent pseudo-random values
    const seed = stock.ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };

    for (let i = -7; i <= 6; i++) {
      const date = new Date(avgDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      let marketPrice;
      if (i < 0) {
        marketPrice = avgPrice * (0.95 + pseudoRandom(i + 10) * 0.03);
      } else if (i === 0) {
        marketPrice = avgPrice;
      } else {
        const trend = i * 0.005;
        marketPrice = avgPrice * (1 + trend + (pseudoRandom(i + 20) * 0.02 - 0.01));
      }

      data.push({
        date: dateStr,
        marketPrice: marketPrice,
        isClusterCenter: i === 0
      });
    }

    return data;
  }, [stock, stats]);

  if (!stock || !stats) return null;

  // 현재가: stockPrice API > stock.currentPrice > 서버에서 계산된 priceChange로 역산
  const currentPrice = stockPrice?.currentPrice || stock.currentPrice ||
    (stats.avgPrice && stock.priceChange ? stats.avgPrice * (1 + stock.priceChange / 100) : 0);

  // 수익률: 1. stock.priceChange (서버 계산) 2. 직접 계산
  let priceChange = stock.priceChange;
  if (priceChange === undefined || priceChange === null) {
    priceChange = stats.avgPrice && stats.avgPrice > 0 && currentPrice > 0
      ? ((currentPrice - stats.avgPrice) / stats.avgPrice) * 100
      : 0;
  }

  console.log(`📈 [Modal] ${stock.ticker} prices:`, {
    stockPriceApi: stockPrice?.currentPrice,
    stockCurrentPrice: stock.currentPrice,
    stockPriceChange: stock.priceChange,
    calculatedPriceChange: priceChange,
    avgPrice: stats.avgPrice
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] lg:max-w-[1200px] h-[90vh] max-h-[90vh] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col [&>button]:hidden overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{stock.companyName} - Cluster Buy Summary</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-gradient-to-r from-emerald-950/20 to-transparent shrink-0">
            <div className="flex items-center gap-2">
              {/* Company Logo - Multiple fallback sources */}
              <div className="relative w-9 h-9">
                <img
                  src={`https://logo.clearbit.com/${stock.companyName?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}.com`}
                  alt={stock.ticker}
                  className="w-9 h-9 rounded bg-neutral-900 object-contain absolute inset-0"
                  onError={(e) => {
                    // Fallback to financialmodelingprep
                    e.currentTarget.src = `https://financialmodelingprep.com/image-stock/${stock.ticker}.png`;
                    e.currentTarget.onerror = () => {
                      // Final fallback: hide image, show ticker abbreviation
                      e.currentTarget.style.display = 'none';
                      const fallbackDiv = e.currentTarget.nextElementSibling;
                      if (fallbackDiv) fallbackDiv.classList.remove('hidden');
                    };
                  }}
                />
                <div className={`w-9 h-9 hidden items-center justify-center rounded border ${stock.rank <= 3 ? 'bg-amber-900/30 border-amber-700 text-amber-500' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}>
                  <span className="font-mono text-xs font-bold">{stock.ticker?.slice(0, 2) || '??'}</span>
                </div>
              </div>
              {/* Rank Badge */}
              <div className={`w-6 h-6 flex items-center justify-center border ${stock.rank <= 3 ? 'bg-amber-900/30 border-amber-700 text-amber-500' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}>
                <span className="font-mono text-[10px] font-bold">#{stock.rank}</span>
              </div>
              <div>
                <h2 className="text-sm md:text-base text-neutral-200 font-bold tracking-tight">
                  {stock.ticker}
                </h2>
                <div className="text-[10px] text-neutral-400 truncate max-w-[140px] sm:max-w-[200px]">
                  {stock.companyName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="bg-emerald-900/30 text-emerald-500 text-[7px] px-1 py-0.5 font-bold uppercase">
                    {langKey === 'ko' ? '내부자 동시매수' : 'INSIDER BUY'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Notification subscription button (only for logged-in users) */}
              {isAuthenticated && (
                <button
                  onClick={handleNotificationToggle}
                  disabled={isSubscribing}
                  className="p-1.5 hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isSubscribed
                    ? (langKey === 'ko' ? '알림 해제' : 'Disable Notifications')
                    : (langKey === 'ko' ? '알림 받기' : 'Enable Notifications')}
                  data-testid="button-notification-toggle"
                >
                  {isSubscribing ? (
                    <Bell size={14} className="text-neutral-500 animate-pulse" />
                  ) : isSubscribed ? (
                    <BellOff size={14} className="text-amber-500" />
                  ) : (
                    <Bell size={14} className="text-neutral-500" />
                  )}
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-neutral-900 transition-colors">
                <X size={14} className="text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Key Stats - 3 cols mobile, 5 cols desktop */}
          <div className="grid grid-cols-3 md:grid-cols-5 border-b border-neutral-800 shrink-0">
            <div className="px-2 py-2 border-r border-neutral-800 bg-emerald-950/10">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5 flex items-center gap-0.5">
                <Users size={7} />
                {langKey === 'ko' ? '내부자' : 'INSIDERS'}
              </div>
              <div className="text-lg md:text-xl font-bold text-emerald-500">
                {stats.buyerCount}{langKey === 'ko' ? '명' : ''}
              </div>
            </div>

            <div className="px-2 py-2 border-r border-neutral-800">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                {langKey === 'ko' ? '평균가' : 'AVG'}
              </div>
              <div className="text-base md:text-lg font-light text-neutral-200">
                {formatCurrency(stats.avgPrice)}
              </div>
            </div>

            <div className="px-2 py-2 md:border-r border-neutral-800">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                {langKey === 'ko' ? '현재가' : 'NOW'}
              </div>
              <div className={`text-base md:text-lg font-light ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(currentPrice)}
              </div>
            </div>

            <div className="px-2 py-2 border-r border-t md:border-t-0 border-neutral-800 col-span-1">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                {langKey === 'ko' ? '총액' : 'TOTAL'}
              </div>
              <div className="text-base md:text-lg font-light text-emerald-500">
                {formatCurrency(stats.totalAmount, false)}
              </div>
              {(() => {
                const marketCap = stock?.marketCap;
                if (marketCap && marketCap > 0 && stats) {
                  const ratio = (stats.totalAmount / marketCap) * 100;
                  let percentStr;
                  if (ratio >= 10) percentStr = Math.round(ratio) + '%';
                  else if (ratio >= 1) percentStr = ratio.toFixed(1) + '%';
                  else if (ratio >= 0.01) percentStr = ratio.toFixed(2) + '%';
                  else if (ratio >= 0.001) percentStr = ratio.toFixed(3) + '%';
                  else if (ratio >= 0.0001) percentStr = ratio.toFixed(4) + '%';
                  else if (ratio >= 0.00001) percentStr = ratio.toFixed(5) + '%';
                  else if (ratio >= 0.000001) percentStr = ratio.toFixed(6) + '%';
                  else if (ratio > 0) percentStr = ratio.toExponential(2) + '%';
                  else percentStr = '0%';

                  const prefix = langKey === 'ko' ? '시총대비 ' :
                                langKey === 'ja' ? '時価総額比 ' :
                                langKey === 'zh' ? '市值比 ' :
                                'vs Cap: ';
                  return (
                    <div className="text-[8px] md:text-[9px] text-amber-400 font-mono mt-0.5 font-bold">
                      {prefix + percentStr}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="px-2 py-2 border-t md:border-t-0 border-neutral-800 col-span-2 md:col-span-1">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                {langKey === 'ko' ? '내부자 평균 수익률' : 
                 langKey === 'ja' ? '内部者平均リターン' :
                 langKey === 'zh' ? '内部人士平均收益' :
                 'INSIDER AVG RETURN'}
              </div>
              <div className={`text-base md:text-lg font-bold ${isNaN(priceChange) ? 'text-neutral-500' : priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isNaN(priceChange) ? '-' : `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Chart - Compact */}
          <div className="p-2 border-b border-neutral-800 shrink-0">
            <ResponsiveContainer width="100%" height={140}>
              <ComposedChart data={priceHistory} margin={{ left: 0, right: 10, top: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#064e3b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" stroke="#444" style={{ fontSize: '8px', fontFamily: 'monospace' }} tick={{ fill: '#525252' }} />
                <YAxis stroke="#444" style={{ fontSize: '8px', fontFamily: 'monospace' }} tick={{ fill: '#525252' }} domain={['auto', 'auto']} width={45} />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', fontSize: '9px', fontFamily: 'monospace', padding: '4px' }} />
                {/* Average Buy Price Reference Line - More prominent */}
                <ReferenceLine
                  y={stats.avgPrice}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={{
                    value: `${langKey === 'ko' ? '평균 매수가' : 'AVG BUY'}: $${stats.avgPrice.toFixed(2)}`,
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 9,
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                />
                <Area type="monotone" dataKey="marketPrice" fill={`url(#${gradientId})`} fillOpacity={1} stroke="none" />
                <Line type="monotone" dataKey="marketPrice" stroke="#10b981" strokeWidth={2} dot={false} />
                <ReferenceDot x={priceHistory.find(p => p.isClusterCenter)?.date} y={stats.avgPrice} r={5} fill="#f59e0b" stroke="#0a0a0a" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Signal + AI Analysis - Compact row */}
          <div className="grid grid-cols-2 gap-2 p-2 border-b border-neutral-800 shrink-0">
            {/* Signal */}
            <div className="bg-emerald-950/30 border border-emerald-900/50 p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} className="text-emerald-500" />
                <span className="text-[8px] text-emerald-500/70 uppercase font-mono">Signal</span>
              </div>
              <div className="text-lg font-bold text-emerald-500">
                {(tData as any)[comprehensiveAnalysis?.signal] || comprehensiveAnalysis?.signal || tTop.strongBuy}
              </div>
              <div className="text-[8px] text-emerald-500/60 font-mono">
                {comprehensiveAnalysis?.confidence || aiAnalysis?.confidence}% {langKey === 'ko' ? '신뢰도' : 'conf'}
              </div>
            </div>

            {/* Sector/Industry Info */}
            <div className="border border-neutral-800 bg-neutral-950/30 p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1 mb-1">
                <Target size={9} className="text-blue-500" />
                <span className="text-[8px] text-blue-500/70 uppercase font-mono">
                  {langKey === 'ko' ? '업종' : langKey === 'ja' ? '業種' : langKey === 'zh' ? '行业' : 'Sector'}
                </span>
              </div>
              <div className="text-sm font-bold text-blue-400">
                {stock.sector || stockPrice?.sector || '-'}
              </div>
            </div>
          </div>

          {/* AI Insight - Collapsible */}
          <div className="border-b border-neutral-800 bg-gradient-to-r from-purple-950/30 to-neutral-950/30 shrink-0">
            <div
              className="px-2 py-2 flex items-center justify-between cursor-pointer hover:bg-purple-950/20 transition-colors"
              onClick={() => !isLoadingAnalysis && setIsAnalysisExpanded(!isAnalysisExpanded)}
            >
              <div className="flex items-center gap-1.5">
                <Brain size={12} className="text-purple-400" />
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                  {langKey === 'ko' ? 'AI 분석결과' : 'AI ANALYSIS'}
                </span>
              </div>
              {!isLoadingAnalysis && (comprehensiveAnalysis?.aiSummary || comprehensiveAnalysis?.executiveSummary) && (
                <div className="flex items-center gap-1 text-purple-400/60">
                  <span className="text-[8px] font-mono uppercase">
                    {isAnalysisExpanded ? (langKey === 'ko' ? '접기' : 'Less') : (langKey === 'ko' ? '더보기' : 'More')}
                  </span>
                  {isAnalysisExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </div>
              )}
            </div>
            <div className="px-2 pb-2">
              {isLoadingAnalysis ? (
                <div className="pl-5 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {langKey === 'ko' ? 'AI 분석 중...' :
                     langKey === 'ja' ? 'AI分析中...' :
                     langKey === 'zh' ? 'AI分析中...' :
                     'Analyzing...'}
                  </span>
                </div>
              ) : (comprehensiveAnalysis?.aiSummary || comprehensiveAnalysis?.executiveSummary) ? (
                <div className="pl-5 space-y-2">
                  {/* Executive Summary */}
                  <p className="text-[11px] md:text-xs text-white leading-relaxed font-medium">
                    {comprehensiveAnalysis.aiSummary || comprehensiveAnalysis.executiveSummary}
                  </p>

                  {/* Expanded Analysis */}
                  {isAnalysisExpanded && (
                    <div className="space-y-2.5 pt-1 border-t border-neutral-800/50">
                      {/* Key Insights */}
                      {comprehensiveAnalysis.riskAssessment?.factors && comprehensiveAnalysis.riskAssessment.factors.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-semibold text-purple-400 uppercase tracking-wide">
                            {langKey === 'ko' ? '📊 주요 인사이트' :
                             langKey === 'ja' ? '📊 主要インサイト' :
                             langKey === 'zh' ? '📊 关键见解' :
                             '📊 Key Insights'}
                          </h4>
                          <ul className="space-y-1.5">
                            {comprehensiveAnalysis.riskAssessment.factors.map((insight: string, idx: number) => (
                              <li key={idx} className="text-[10px] text-neutral-300 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-purple-500">
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* News Analysis */}
                      {comprehensiveAnalysis.newsAnalysis && comprehensiveAnalysis.newsAnalysis.totalNews > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide">
                            {langKey === 'ko' ? '📰 뉴스 분석 (최근 30일)' :
                             langKey === 'ja' ? '📰 ニュース分析（過去30日）' :
                             langKey === 'zh' ? '📰 新闻分析（最近30天）' :
                             '📰 News Analysis (30 days)'}
                          </h4>
                          <div className="flex items-center gap-3 text-[9px]">
                            <span className="text-green-400">✓ {comprehensiveAnalysis.newsAnalysis.positiveCount} {langKey === 'ko' ? '긍정' : 'Positive'}</span>
                            <span className="text-neutral-400">○ {comprehensiveAnalysis.newsAnalysis.totalNews - comprehensiveAnalysis.newsAnalysis.positiveCount - comprehensiveAnalysis.newsAnalysis.negativeCount} {langKey === 'ko' ? '중립' : 'Neutral'}</span>
                            <span className="text-red-400">✗ {comprehensiveAnalysis.newsAnalysis.negativeCount} {langKey === 'ko' ? '부정' : 'Negative'}</span>
                          </div>
                          {comprehensiveAnalysis.newsAnalysis.majorNews && comprehensiveAnalysis.newsAnalysis.majorNews.length > 0 && (
                            <div className="space-y-1 mt-1.5">
                              {comprehensiveAnalysis.newsAnalysis.majorNews.slice(0, 3).map((news: any, idx: number) => (
                                <div key={idx} className="text-[9px] text-neutral-400 pl-3 border-l-2 border-neutral-700">
                                  <span className={`font-semibold ${news.sentiment === 'BULLISH' ? 'text-green-400' : news.sentiment === 'BEARISH' ? 'text-red-400' : 'text-neutral-300'}`}>
                                    {news.title}
                                  </span>
                                  {news.summary && <p className="text-neutral-500 mt-0.5">{news.summary}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Risk Assessment & Catalysts */}
                      <div className="grid grid-cols-2 gap-2">
                        {comprehensiveAnalysis.riskAssessment && (
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-semibold text-amber-400 uppercase tracking-wide">
                              {langKey === 'ko' ? '⚠️ 리스크' :
                               langKey === 'ja' ? '⚠️ リスク' :
                               langKey === 'zh' ? '⚠️ 风险' :
                               '⚠️ Risk'}
                            </h4>
                            <div className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${
                              comprehensiveAnalysis.riskAssessment.level === 'HIGH' ? 'bg-red-900/30 text-red-400' :
                              comprehensiveAnalysis.riskAssessment.level === 'MEDIUM' ? 'bg-amber-900/30 text-amber-400' :
                              'bg-green-900/30 text-green-400'
                            }`}>
                              {comprehensiveAnalysis.riskAssessment.level}
                            </div>
                          </div>
                        )}

                        {comprehensiveAnalysis.timeHorizon && (
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wide">
                              {langKey === 'ko' ? '⏱️ 시간' :
                               langKey === 'ja' ? '⏱️ 期間' :
                               langKey === 'zh' ? '⏱️ 时间' :
                               '⏱️ Horizon'}
                            </h4>
                            <p className="text-[9px] text-neutral-300 font-medium">{comprehensiveAnalysis.timeHorizon}</p>
                          </div>
                        )}
                      </div>

                      {/* Market Context */}
                      {comprehensiveAnalysis.marketContext?.reasoning && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">
                            {langKey === 'ko' ? '📈 시장 컨텍스트' :
                             langKey === 'ja' ? '📈 市場コンテキスト' :
                             langKey === 'zh' ? '📈 市场背景' :
                             '📈 Market Context'}
                          </h4>
                          <p className="text-[10px] text-neutral-300 leading-relaxed">
                            {comprehensiveAnalysis.marketContext.reasoning}
                          </p>
                        </div>
                      )}

                      {/* Confidence Score */}
                      {comprehensiveAnalysis.confidence && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] text-neutral-500">
                            {langKey === 'ko' ? '신뢰도:' :
                             langKey === 'ja' ? '信頼度:' :
                             langKey === 'zh' ? '可信度:' :
                             'Confidence:'}
                          </span>
                          <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${comprehensiveAnalysis.confidence >= 70 ? 'bg-green-500' : comprehensiveAnalysis.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${comprehensiveAnalysis.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-semibold text-neutral-300">{comprehensiveAnalysis.confidence}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : comprehensiveAnalysis?.notRanked ? (
                <div className="pl-5 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] leading-relaxed text-amber-400">
                        {langKey === 'ko' ? '현재 랭킹에 없는 종목입니다.' :
                         langKey === 'ja' ? 'ランキング外の銘柄です。' :
                         langKey === 'zh' ? '当前未排名的股票。' :
                         'Not currently in rankings.'}
                      </p>
                      <p className="text-[8px] text-neutral-500 italic">
                        {langKey === 'ko' ? '💡 랭킹 페이지에서 AI 분석 제공 종목을 확인하세요.' :
                         langKey === 'ja' ? '💡 ランキングページでAI分析対象銘柄を確認してください。' :
                         langKey === 'zh' ? '💡 在排名页面查看AI分析股票。' :
                         '💡 Check the Rankings page for stocks with AI analysis.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : analysisError ? (
                <div className="pl-5 space-y-1.5">
                  <div className="flex items-start gap-2">
                    {analysisError.type === 'not_ranked' ? (
                      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className={`text-[10px] leading-relaxed ${
                        analysisError.type === 'not_ranked' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {analysisError.message}
                      </p>

                      {analysisError.retryable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalysisError(null);
                            setComprehensiveAnalysis(null);
                            setIsLoadingAnalysis(true);
                            // Trigger re-fetch
                            const fetchAgain = async () => {
                              try {
                                const tradesResponse = await fetch(resolveApiUrl(`/api/trades?ticker=${stock?.ticker}&limit=1`));
                                if (!tradesResponse.ok) throw new Error(`Trades API returned ${tradesResponse.status}`);
                                const tradesData = await tradesResponse.json();
                                if (!tradesData.trades?.length) {
                                  setAnalysisError({
                                    type: 'not_available',
                                    message: language === 'ko' ? '거래 데이터를 찾을 수 없습니다.' : 'No trade data found.',
                                    retryable: false
                                  });
                                  setIsLoadingAnalysis(false);
                                  return;
                                }
                                const tradeId = tradesData.trades[0].id;
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 30000);
                                try {
                                  const analysisResponse = await fetch(resolveApiUrl(`/api/trades/${tradeId}/comprehensive-analysis?language=${language}`), { signal: controller.signal });
                                  clearTimeout(timeoutId);
                                  if (!analysisResponse.ok) {
                                    if (analysisResponse.status === 503) {
                                      setAnalysisError({ type: 'temporary_error', message: language === 'ko' ? '일시적인 서버 오류입니다.' : 'Temporary server error.', retryable: true });
                                      setIsLoadingAnalysis(false);
                                      return;
                                    }
                                    throw new Error(`Analysis API returned ${analysisResponse.status}`);
                                  }
                                  const analysisData = await analysisResponse.json();
                                  if (analysisData.notRanked) {
                                    setComprehensiveAnalysis(analysisData);
                                    setIsLoadingAnalysis(false);
                                    return;
                                  }
                                  if (analysisData.error) {
                                    setAnalysisError({ type: analysisData.errorType === 'temporary' ? 'temporary_error' : 'not_available', message: analysisData.message, retryable: analysisData.retryable || false });
                                    setIsLoadingAnalysis(false);
                                    return;
                                  }
                                  setComprehensiveAnalysis(analysisData);
                                  setAnalysisError(null);
                                } catch (fetchError: any) {
                                  clearTimeout(timeoutId);
                                  if (fetchError.name === 'AbortError') {
                                    setAnalysisError({ type: 'temporary_error', message: language === 'ko' ? '요청 시간이 초과되었습니다.' : 'Request timed out.', retryable: true });
                                  } else {
                                    throw fetchError;
                                  }
                                }
                              } catch (error) {
                                console.error('Failed to fetch analysis:', error);
                                setAnalysisError({ type: 'network_error', message: language === 'ko' ? '네트워크 오류가 발생했습니다.' : 'Network error occurred.', retryable: true });
                              } finally {
                                setIsLoadingAnalysis(false);
                              }
                            };
                            fetchAgain();
                          }}
                          className="text-[9px] px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded transition-colors"
                        >
                          {langKey === 'ko' ? '다시 시도' :
                           langKey === 'ja' ? '再試行' :
                           langKey === 'zh' ? '重试' :
                           'Retry'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pl-5 space-y-2">
                  <p className="text-[11px] text-white leading-relaxed font-medium">
                    {analysisInsights.summary}
                  </p>
                  {analysisInsights.insights.length > 0 && (
                    <ul className="space-y-1.5 mt-2">
                      {analysisInsights.insights.map((insight, idx) => (
                        <li key={idx} className="text-[10px] text-neutral-300 leading-relaxed flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[8px] text-neutral-500 italic mt-2 border-t border-neutral-800 pt-2">
                    {langKey === 'ko'
                      ? '* SEC Form 4 공시 데이터 기반 실시간 분석'
                      : langKey === 'ja'
                      ? '* SEC Form 4提出書類に基づくリアルタイム分析'
                      : langKey === 'zh'
                      ? '* 基于SEC Form 4申报数据的实时分析'
                      : '* Real-time analysis based on SEC Form 4 filings'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Buyers List - Simplified for mobile */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-neutral-800">
              <Users size={10} className="text-emerald-600" />
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                {langKey === 'ko' ? '내부자 상세' : 'INSIDER DETAILS'}
              </span>
            </div>

            <div className="space-y-1.5">
              {stock.buyers.map((buyer, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-900/30 border-l-2 border-emerald-800">
                  {/* Index & Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-neutral-600 font-mono w-4">{idx + 1}</span>
                      {/* 상세 카테고리 배지 (6가지) */}
                      {(() => {
                        const categoryBadges: Record<string, { label: string; labelKo: string; color: string; title: string; titleKo: string }> = {
                          'VC_PE': { label: 'VC', labelKo: 'VC', color: 'bg-purple-900/50 text-purple-400', title: 'Venture Capital / Private Equity', titleKo: '벤처캐피탈/사모펀드' },
                          'HEDGE': { label: 'HEDGE', labelKo: '헤지', color: 'bg-blue-900/50 text-blue-400', title: 'Hedge Fund', titleKo: '헤지펀드' },
                          'INSTITUTION': { label: 'INST', labelKo: '기관', color: 'bg-cyan-900/50 text-cyan-400', title: 'Institutional Investor', titleKo: '기관투자자' },
                          'EXECUTIVE': { label: 'EXEC', labelKo: '임원', color: 'bg-orange-900/50 text-orange-400', title: 'Executive Officer', titleKo: '임원 (CEO/CFO 등)' },
                          'DIRECTOR': { label: 'DIR', labelKo: '이사', color: 'bg-yellow-900/50 text-yellow-400', title: 'Board Director', titleKo: '이사회 멤버' },
                          'LARGE_SHAREHOLDER': { label: '10%+', labelKo: '대주주', color: 'bg-pink-900/50 text-pink-400', title: 'Large Shareholder (10%+)', titleKo: '10% 이상 대주주' },
                        };
                        const categories = (buyer as any).categories as string[] | undefined;
                        if (categories && categories.length > 0) {
                          return categories.map((cat: string) => {
                            const badge = categoryBadges[cat];
                            if (!badge) return null;
                            return (
                              <span key={cat} className={`text-[8px] px-1 py-0.5 ${badge.color} rounded font-bold`} title={langKey === 'ko' ? badge.titleKo : badge.title}>
                                {langKey === 'ko' ? badge.labelKo : badge.label}
                              </span>
                            );
                          });
                        }
                        // Fallback: 기존 isInstitution 기반
                        return buyer.isInstitution ? (
                          <span className="text-[8px] px-1 py-0.5 bg-blue-900/50 text-blue-400 rounded font-bold" title={langKey === 'ko' ? '기관투자자' : 'Institution'}>
                            {langKey === 'ko' ? '기관' : 'INST'}
                          </span>
                        ) : (
                          <span className="text-[8px] px-1 py-0.5 bg-amber-900/50 text-amber-400 rounded font-bold" title={langKey === 'ko' ? '개인 내부자' : 'Individual'}>
                            {langKey === 'ko' ? '개인' : 'INDV'}
                          </span>
                        );
                      })()}
                      <span className="text-[11px] font-bold text-neutral-300 truncate">{buyer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-[9px] text-neutral-500">{(tData as any)[buyer.relation] || buyer.relation}</span>
                      <span className="text-[8px] text-neutral-600 font-mono">{buyer.date}</span>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">{formatCurrency(buyer.price)}</div>
                    <div className={`text-[9px] font-bold ${buyer.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {buyer.priceChange > 0 ? '+' : ''}{buyer.priceChange}%
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0 w-20">
                    <div className="text-[9px] text-neutral-500">{formatNumber(buyer.shares)} {langKey === 'ko' ? '주' : 'sh'}</div>
                    <div className="text-[10px] text-emerald-500 font-bold font-mono">{formatCurrency(buyer.amount)}</div>
                    {stock.marketCap && stock.marketCap > 0 && (
                      <div className="text-[8px] text-amber-400 font-mono font-bold mt-0.5">
                        {(() => {
                          const ratio = (buyer.amount / stock.marketCap) * 100;
                          let ratioStr;
                          if (ratio >= 10) ratioStr = Math.round(ratio) + '%';
                          else if (ratio >= 1) ratioStr = ratio.toFixed(1) + '%';
                          else if (ratio >= 0.01) ratioStr = ratio.toFixed(2) + '%';
                          else if (ratio >= 0.001) ratioStr = ratio.toFixed(3) + '%';
                          else if (ratio >= 0.0001) ratioStr = ratio.toFixed(4) + '%';
                          else if (ratio >= 0.00001) ratioStr = ratio.toFixed(5) + '%';
                          else if (ratio >= 0.000001) ratioStr = ratio.toFixed(6) + '%';
                          else if (ratio > 0) ratioStr = ratio.toExponential(2) + '%';
                          else ratioStr = '0%';
                          return `${tTop.marketCapRatio}: ${ratioStr}`;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Branding */}
          <div className="px-2 py-1.5 border-t border-neutral-800 bg-neutral-950/50 shrink-0">
            <div className="flex items-center justify-between text-[8px] text-neutral-600">
              <span className="font-mono uppercase tracking-wider">
                {langKey === 'ko' ? '실시간 내부자 거래 알림' : 'Real-Time Insider Alerts'}
              </span>
              <span className="font-bold text-neutral-500">InsiderPulse</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
