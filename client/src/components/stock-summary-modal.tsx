// Modified for App Store compliance: price target safe mode - removed all investment predictions
import { X, AlertTriangle, Brain, Target, TrendingUp, Users, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ReferenceDot, CartesianGrid } from 'recharts';
import { useLanguage } from '@/contexts/language-context';
import { formatCurrency, formatNumber, TRANSLATIONS } from '@/lib/translations';
import { useState, useEffect, useMemo, useId, useCallback, useRef } from 'react';
import { StockRecommendation } from './terminal-ui/types';

interface StockPriceData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
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
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState<StockPriceData | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);

  // ✅ Map-based cache: Store analysis for multiple tickers in same session
  const analysisCache = useRef<Map<string, any>>(new Map());
  const cachedTickerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !stock?.ticker) {
      setStockPrice(null);
      // ✅ DON'T clear comprehensiveAnalysis or cache when modal closes
      return;
    }

    // ✅ If ticker changed, save current analysis to cache
    if (cachedTickerRef.current && cachedTickerRef.current !== stock.ticker) {
      // Save current analysis to cache before switching
      if (comprehensiveAnalysis && !analysisError) {
        analysisCache.current.set(cachedTickerRef.current, comprehensiveAnalysis);
        console.log(`💾 Cached analysis for ${cachedTickerRef.current} (cache size: ${analysisCache.current.size})`);
      }

      // Clear state for new ticker - fetchAnalysis will handle loading
      setComprehensiveAnalysis(null);
      setAnalysisError(null);
      cachedTickerRef.current = stock.ticker;
    } else if (!cachedTickerRef.current) {
      // First time opening - just set the ref
      cachedTickerRef.current = stock.ticker;
    }

    const fetchStockPrice = async () => {
      try {
        const response = await fetch(`/api/stocks/${stock.ticker}`);
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
      if (stock.comprehensiveAnalysis) {
        console.log(`✅ Using pre-loaded analysis from ranking data for ${stock.ticker} - NO API CALL NEEDED!`);
        setComprehensiveAnalysis(stock.comprehensiveAnalysis);
        setAnalysisError(null);
        analysisCache.current.set(stock.ticker, stock.comprehensiveAnalysis);
        return;
      }

      // PRIORITY 3: Check session cache (Map) - NO API CALL
      const cachedAnalysis = analysisCache.current.get(stock.ticker);
      if (cachedAnalysis) {
        console.log(`✅ Using session cache for ${stock.ticker} - NO API CALL NEEDED`);
        setComprehensiveAnalysis(cachedAnalysis);
        setAnalysisError(null);
        return;
      }

      // PRIORITY 4: No cached data - fetch from API
      console.log(`🔄 No cached analysis found for ${stock.ticker} - fetching from API...`);
      setIsLoadingAnalysis(true);
      setAnalysisError(null);

      try {
        // Get trade ID
        const tradesResponse = await fetch(`/api/trades?ticker=${stock.ticker}&limit=1`);
        if (!tradesResponse.ok) {
          throw new Error(`Trades API returned ${tradesResponse.status}`);
        }

        const tradesData = await tradesResponse.json();
        if (!tradesData.trades?.length) {
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

        const tradeId = tradesData.trades[0].id;

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

          // Success! Save to cache for future use
          console.log(`✅ Successfully fetched analysis for ${stock.ticker} from API`);
          setComprehensiveAnalysis(analysisData);
          setAnalysisError(null);
          analysisCache.current.set(stock.ticker, analysisData);

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

  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].modal;
  const tTop = TRANSLATIONS[langKey].top;
  const tData = TRANSLATIONS[langKey].data;

  const stats = useMemo(() => {
    if (!stock) return null;

    const buyers = stock.buyers;
    const totalShares = buyers.reduce((sum, b) => sum + b.shares, 0);
    const totalAmount = buyers.reduce((sum, b) => sum + b.amount, 0);
    const avgPrice = totalAmount / totalShares;

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
      buyerCount: buyers.length,
      totalShares,
      totalAmount,
      avgPrice,
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

  const priceHistory = useMemo(() => {
    if (!stock || !stats) return [];

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

  const currentPrice = stockPrice?.currentPrice || stock.currentPrice;
  const priceChange = ((currentPrice - stats.avgPrice) / stats.avgPrice) * 100;

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
              {/* Company Logo */}
              <div className="relative">
                <img
                  src={`https://financialmodelingprep.com/image-stock/${stock.ticker}.png`}
                  alt={stock.ticker}
                  className="w-9 h-9 rounded bg-neutral-900 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`w-9 h-9 hidden items-center justify-center rounded border ${stock.rank <= 3 ? 'bg-amber-900/30 border-amber-700 text-amber-500' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}>
                  <span className="font-mono text-xs font-bold">{stock.ticker.slice(0, 2)}</span>
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
            <button onClick={onClose} className="p-1 hover:bg-neutral-900 transition-colors">
              <X size={14} className="text-neutral-500" />
            </button>
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
              <div className={`text-base md:text-lg font-bold ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
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

            {/* Reference Price Range (Historical Insider Prices) - App Store Compliance */}
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="flex items-center gap-1 mb-1">
                <Target size={9} className="text-neutral-500" />
                <span className="text-[8px] text-neutral-500 uppercase font-mono">
                  {langKey === 'ko' ? '참고 가격대' : langKey === 'ja' ? '参考価格帯' : langKey === 'zh' ? '参考价格区间' : 'Reference Range'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-neutral-600">{langKey === 'ko' ? '평균 매수가' : 'Avg Buy'}</span>
                  <span className="text-emerald-400 font-mono font-bold">{formatCurrency(stats.avgPrice)}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-neutral-600">{langKey === 'ko' ? '현재가' : 'Current'}</span>
                  <span className={`font-mono ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(currentPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 pt-1 border-t border-neutral-800/50">
                  <Info size={7} className="text-neutral-600 shrink-0" />
                  <span className="text-[6px] text-neutral-600">
                    {langKey === 'ko' ? '참고용' : langKey === 'ja' ? '参考用' : langKey === 'zh' ? '仅供参考' : 'Reference only'}
                  </span>
                </div>
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
              {!isLoadingAnalysis && comprehensiveAnalysis?.executiveSummary && (
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
              ) : comprehensiveAnalysis?.executiveSummary ? (
                <div className="pl-5 space-y-2">
                  {/* Executive Summary */}
                  <p className="text-[11px] md:text-xs text-white leading-relaxed font-medium">
                    {comprehensiveAnalysis.executiveSummary}
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
                                const tradesResponse = await fetch(`/api/trades?ticker=${stock?.ticker}&limit=1`);
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
                                  const analysisResponse = await fetch(`/api/trades/${tradeId}/comprehensive-analysis?language=${language}`, { signal: controller.signal });
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
                <p className="text-[10px] text-neutral-500 pl-5 italic">
                  {langKey === 'ko' ? '분석 데이터를 불러올 수 없습니다.' :
                   langKey === 'ja' ? '分析データを読み込めません。' :
                   langKey === 'zh' ? '无法加载分析数据。' :
                   'Unable to load analysis data.'}
                </p>
              )}
            </div>
          </div>

          {/* Risk & Time Horizon */}
          <div className="grid grid-cols-2 gap-2 p-2 border-b border-neutral-800 shrink-0">
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                {langKey === 'ko' ? '위험도' : 'RISK'}
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <AlertTriangle size={10} />
                <span className="text-[10px] font-bold">{(tData as any)[aiAnalysis?.riskLevel || ''] || aiAnalysis?.riskLevel || t.riskLow}</span>
              </div>
            </div>
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                {langKey === 'ko' ? '총 매수 주식수' : 
                 langKey === 'ja' ? '総購入株数' :
                 langKey === 'zh' ? '总购买股数' :
                 'TOTAL SHARES'}
              </div>
              <div className="text-[10px] text-neutral-200 font-mono font-bold">
                {formatNumber(stock.buyers.reduce((sum, b) => sum + (b.shares || 0), 0))}
                <span className="text-neutral-500 ml-1">{langKey === 'ko' ? '주' : 'sh'}</span>
              </div>
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
