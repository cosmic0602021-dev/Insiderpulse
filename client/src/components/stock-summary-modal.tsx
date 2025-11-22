import { X, AlertTriangle, Brain, Target, TrendingUp, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ReferenceDot, CartesianGrid } from 'recharts';
import { useLanguage } from '@/contexts/language-context';
import { formatCurrency, formatNumber, TRANSLATIONS } from '@/lib/translations';
import { useState, useEffect, useMemo, useId } from 'react';
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

export function StockSummaryModal({ isOpen, onClose, stock }: StockSummaryModalProps) {
  const { language } = useLanguage();
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState<StockPriceData | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (!isOpen || !stock?.ticker) {
      setStockPrice(null);
      setComprehensiveAnalysis(null);
      return;
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

    // Fetch comprehensive AI analysis
    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        // First get the latest trade for this ticker
        const tradesResponse = await fetch(`/api/trades?ticker=${stock.ticker}&limit=1`);
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          if (tradesData.trades && tradesData.trades.length > 0) {
            const tradeId = tradesData.trades[0].id;
            // Get comprehensive analysis for this trade
            const analysisResponse = await fetch(`/api/trades/${tradeId}/comprehensive-analysis?language=${language}`);
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              setComprehensiveAnalysis(analysisData);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchStockPrice();
    fetchAnalysis();
  }, [isOpen, stock?.ticker, language]);

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
        insight = `${stats.buyerCount}명의 내부자가 동시에 대규모 매수. 강력한 확신 신호.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount}명의 내부자가 동시 매수. 긍정적 전망 공유.`;
      } else {
        insight = '다수 내부자 동시 매수는 회사에 대한 확신을 나타냄.';
      }
    } else {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount} insiders made large simultaneous buys. Strong conviction.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount} insiders bought simultaneously. Positive outlook.`;
      } else {
        insight = 'Multiple insider buys indicate confidence.';
      }
    }

    const multiplier = 1 + (stats.buyerCount * 0.02);
    const priceTargets = {
      conservative: stats.avgPrice * (1.03 * multiplier),
      realistic: stats.avgPrice * (1.08 * multiplier),
      optimistic: stats.avgPrice * (1.15 * multiplier)
    };

    return {
      signal: 'BUY' as const,
      confidence,
      insight,
      priceTargets,
      riskLevel: isLargeAmount ? t.riskLow : t.riskMedium,
      timeHorizon: isManyBuyers ? '2-4w' : '3-6w'
    };
  }, [stock, stats, t, langKey]);

  const priceHistory = useMemo(() => {
    if (!stock || !stats) return [];

    const avgDate = new Date((stats.firstDate.getTime() + stats.lastDate.getTime()) / 2);
    const avgPrice = stats.avgPrice;
    const data = [];

    for (let i = -7; i <= 6; i++) {
      const date = new Date(avgDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      let marketPrice;
      if (i < 0) {
        marketPrice = avgPrice * (0.95 + Math.random() * 0.03);
      } else if (i === 0) {
        marketPrice = avgPrice;
      } else {
        const trend = i * 0.005;
        marketPrice = avgPrice * (1 + trend + (Math.random() * 0.02 - 0.01));
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
                    {langKey === 'ko' ? '클러스터 매수' : 'CLUSTER BUY'}
                  </span>
                  <span className="text-[8px] text-neutral-600 font-mono">
                    {stats.buyerCount}{langKey === 'ko' ? '명' : ' buyers'}
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
                {langKey === 'ko' ? '매수자' : 'BUYERS'}
              </div>
              <div className="text-lg md:text-xl font-bold text-emerald-500">
                {stats.buyerCount}
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
            </div>

            <div className="px-2 py-2 border-t md:border-t-0 border-neutral-800 col-span-2 md:col-span-1">
              <div className="text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                {langKey === 'ko' ? '수익률' : 'RETURN'}
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
                {comprehensiveAnalysis?.signal || tTop.strongBuy}
              </div>
              <div className="text-[8px] text-emerald-500/60 font-mono">
                {comprehensiveAnalysis?.confidence || aiAnalysis?.confidence}% {langKey === 'ko' ? '신뢰도' : 'conf'}
              </div>
            </div>

            {/* Price Targets Compact */}
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="flex items-center gap-1 mb-1">
                <Target size={9} className="text-neutral-500" />
                <span className="text-[8px] text-neutral-500 uppercase font-mono">{langKey === 'ko' ? '목표가' : 'Targets'}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-neutral-600">{langKey === 'ko' ? '보수' : 'Low'}</span>
                  <span className="text-neutral-400 font-mono">{formatCurrency(comprehensiveAnalysis?.priceTargets?.conservative || aiAnalysis?.priceTargets.conservative || 0)}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-emerald-600">{langKey === 'ko' ? '현실' : 'Mid'}</span>
                  <span className="text-emerald-400 font-mono font-bold">{formatCurrency(comprehensiveAnalysis?.priceTargets?.realistic || aiAnalysis?.priceTargets.realistic || 0)}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-amber-600">{langKey === 'ko' ? '낙관' : 'High'}</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(comprehensiveAnalysis?.priceTargets?.optimistic || aiAnalysis?.priceTargets.optimistic || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight - Prominent display */}
          <div className="px-2 py-2 border-b border-neutral-800 bg-gradient-to-r from-purple-950/30 to-neutral-950/30 shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain size={12} className="text-purple-400" />
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                {langKey === 'ko' ? 'AI 분석결과' : 'AI ANALYSIS'}
              </span>
              {isLoadingAnalysis && (
                <span className="text-[8px] text-purple-400/60 ml-1">
                  {langKey === 'ko' ? '분석중...' : 'Analyzing...'}
                </span>
              )}
            </div>
            <p className="text-[11px] md:text-xs text-white leading-relaxed pl-5 font-medium">
              {comprehensiveAnalysis?.executiveSummary || aiAnalysis?.insight}
            </p>
            {comprehensiveAnalysis?.actionableRecommendation && (
              <p className="text-[10px] text-purple-300 leading-relaxed pl-5 mt-1.5 border-t border-purple-900/30 pt-1.5">
                <span className="font-bold">{langKey === 'ko' ? '추천: ' : 'Action: '}</span>
                {comprehensiveAnalysis.actionableRecommendation}
              </p>
            )}
          </div>

          {/* Risk & Time Horizon */}
          <div className="grid grid-cols-2 gap-2 p-2 border-b border-neutral-800 shrink-0">
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                {langKey === 'ko' ? '위험도' : 'RISK'}
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <AlertTriangle size={10} />
                <span className="text-[10px] font-bold">{aiAnalysis?.riskLevel || t.riskLow}</span>
              </div>
            </div>
            <div className="border border-neutral-800 bg-neutral-950/30 p-2">
              <div className="text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                {langKey === 'ko' ? '예측 시기' : 'TIME HORIZON'}
              </div>
              <div className="text-[10px] text-neutral-200 font-mono font-bold">
                {aiAnalysis?.timeHorizon || '2-4w'}
              </div>
            </div>
          </div>

          {/* Buyers List - Simplified for mobile */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-neutral-800">
              <Users size={10} className="text-emerald-600" />
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                {langKey === 'ko' ? '매수자 상세' : 'BUYER DETAILS'}
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
                    <span className="text-[9px] text-neutral-500 ml-5">{(tData as any)[buyer.relation] || buyer.relation}</span>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">{formatCurrency(buyer.price)}</div>
                    <div className={`text-[9px] font-bold ${buyer.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {buyer.priceChange > 0 ? '+' : ''}{buyer.priceChange}%
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0 w-16">
                    <div className="text-[9px] text-neutral-500">{formatNumber(buyer.shares)} {langKey === 'ko' ? '주' : 'sh'}</div>
                    <div className="text-[10px] text-emerald-500 font-bold font-mono">{formatCurrency(buyer.amount)}</div>
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
