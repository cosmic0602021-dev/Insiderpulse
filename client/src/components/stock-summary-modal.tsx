import { X, CheckCircle, AlertTriangle, Brain, Target, Newspaper, ExternalLink, TrendingUp, ChevronDown, ChevronUp, Users, DollarSign, BarChart3, Calendar } from 'lucide-react';
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
  const [newsExpanded, setNewsExpanded] = useState(true);
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState<StockPriceData | null>(null);

  useEffect(() => {
    if (!isOpen || !stock?.ticker) {
      setStockPrice(null);
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

    fetchStockPrice();
  }, [isOpen, stock?.ticker]);

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
    const avgPriceChange = buyers.reduce((sum, b) => sum + b.priceChange, 0) / buyers.length;

    const dates = buyers.map(b => new Date(b.date)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    return {
      buyerCount: buyers.length,
      totalShares,
      totalAmount,
      avgPrice,
      avgPriceChange,
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
        insight = `${stats.buyerCount}명의 내부자가 동시에 대규모 매수를 진행했습니다. 강력한 확신 신호입니다.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount}명의 내부자가 동시에 매수했습니다. 내부적으로 긍정적인 전망을 공유하고 있습니다.`;
      } else {
        insight = '여러 내부자의 동시 매수는 회사에 대한 확신을 나타냅니다.';
      }
    } else {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount} insiders made large simultaneous purchases. Strong conviction signal.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount} insiders bought simultaneously. Sharing positive internal outlook.`;
      } else {
        insight = 'Multiple insider buys indicate confidence in the company.';
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
      timeHorizon: isManyBuyers ? '2-4 weeks' : '3-6 weeks'
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
        avgBuyPrice: avgPrice,
        isClusterCenter: i === 0
      });
    }

    return data;
  }, [stock, stats]);

  const news = useMemo(() => [
    { title: t.newsEarnings, sentiment: 'POSITIVE' as const },
    { title: t.newsProduct, sentiment: 'POSITIVE' as const },
    { title: t.newsVolatility, sentiment: 'NEUTRAL' as const },
    { title: t.newsAnalyst, sentiment: 'POSITIVE' as const }
  ], [t]);

  if (!stock || !stats) return null;

  const currentPrice = stockPrice?.currentPrice || stock.currentPrice;
  const priceChange = ((currentPrice - stats.avgPrice) / stats.avgPrice) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1400px] w-full h-[95vh] max-h-[950px] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{stock.companyName} - Cluster Buy Summary</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-gradient-to-r from-emerald-950/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center border ${stock.rank <= 3 ? 'bg-amber-900/30 border-amber-700 text-amber-500' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}>
                <span className="font-mono text-lg font-bold">#{stock.rank}</span>
              </div>
              <div>
                <h2 className="text-lg text-neutral-200 font-bold tracking-tight flex items-center gap-2">
                  {stock.ticker}
                  <span className="text-sm font-normal text-neutral-500">•</span>
                  <span className="text-sm font-normal text-neutral-400">{stock.companyName}</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="bg-emerald-900/30 text-emerald-500 text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                    {langKey === 'ko' ? '클러스터 매수' : 'CLUSTER BUY'}
                  </span>
                  <span className="text-[10px] text-neutral-600 font-mono">
                    {stats.buyerCount} {langKey === 'ko' ? '명 동시매수' : 'SIMULTANEOUS BUYERS'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-900 transition-colors">
              <X size={16} className="text-neutral-500" />
            </button>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-5 border-b border-neutral-800">
            <div className="px-4 py-3 border-r border-neutral-800 bg-emerald-950/10">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1 flex items-center gap-1">
                <Users size={9} />
                {langKey === 'ko' ? '동시 매수자' : 'BUYERS'}
              </div>
              <div className="text-2xl font-bold text-emerald-500">
                {stats.buyerCount}
              </div>
            </div>

            <div className="px-4 py-3 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {tTop.avgPrice.toUpperCase()}
              </div>
              <div className="text-xl font-light text-neutral-200">
                {formatCurrency(stats.avgPrice)}
              </div>
            </div>

            <div className="px-4 py-3 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t.sharesTraded.toUpperCase()}
              </div>
              <div className="text-xl font-light text-neutral-200">
                {formatNumber(stats.totalShares)}
              </div>
            </div>

            <div className="px-4 py-3 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t.totalValue.toUpperCase()}
              </div>
              <div className="text-xl font-light text-emerald-500">
                {formatCurrency(stats.totalAmount, false)}
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t.currentPrice.toUpperCase()}
              </div>
              <div className={`text-xl font-light flex items-center gap-1.5 ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(currentPrice)}
                <span className="text-xs">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-auto">
            {/* Left Column */}
            <div className="border-r border-neutral-800 flex flex-col overflow-hidden">
              {/* Chart */}
              <div className="p-3 border-b border-neutral-800">
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={priceHistory} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#999999" strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="date" stroke="#666666" style={{ fontSize: '9px', fontFamily: 'monospace' }} tick={{ fill: '#525252' }} />
                    <YAxis stroke="#666666" style={{ fontSize: '9px', fontFamily: 'monospace' }} tick={{ fill: '#525252' }} domain={['auto', 'auto']} width={50} />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: '0px', fontSize: '10px', fontFamily: 'monospace', padding: '8px' }}
                      labelStyle={{ color: '#737373', fontSize: '9px' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'marketPrice') {
                          const delta = value - stats.avgPrice;
                          const deltaPercent = ((delta / stats.avgPrice) * 100).toFixed(2);
                          return [`$${value.toFixed(2)} (${delta >= 0 ? '+' : ''}${deltaPercent}%)`, 'Market'];
                        }
                        return [value, name];
                      }}
                    />
                    <ReferenceLine y={stats.avgPrice} stroke="#404040" strokeDasharray="3 3" strokeWidth={1} label={{ value: `Avg Entry: $${stats.avgPrice.toFixed(2)}`, position: 'insideTopLeft', fill: '#737373', fontSize: 9, fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="marketPrice" fill={`url(#${gradientId})`} fillOpacity={1} stroke="none" isAnimationActive={true} animationDuration={4000} />
                    <Line type="monotone" dataKey="marketPrice" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={4000} />
                    <ReferenceDot x={priceHistory.find(p => p.isClusterCenter)?.date} y={stats.avgPrice} r={4} fill="#10b981" stroke="#0a0a0a" strokeWidth={1.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Buyers List */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-800">
                  <Users size={12} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {langKey === 'ko' ? '동시 매수자 상세' : 'SIMULTANEOUS BUYER DETAILS'}
                  </span>
                  <span className="ml-auto text-[9px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full font-mono">
                    {stats.buyerCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {stock.buyers.map((buyer, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center gap-3 p-3 bg-neutral-900/30 border-l-2 border-emerald-800 hover:bg-neutral-900/50 transition-colors">
                      <div className="col-span-1">
                        <span className="text-xs text-neutral-600 font-mono">{idx + 1}</span>
                      </div>
                      <div className="col-span-4">
                        <div className="text-sm font-bold text-neutral-300 truncate">{buyer.name}</div>
                        <span className="text-[10px] text-neutral-500">{(tData as any)[buyer.relation] || buyer.relation}</span>
                      </div>
                      <div className="col-span-3 bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                        <div className="text-[8px] text-neutral-500 uppercase mb-0.5">{tTop.buyPrice}</div>
                        <div className="text-sm text-emerald-400 font-mono font-bold">{formatCurrency(buyer.price)}</div>
                        <div className={`text-[9px] font-bold ${buyer.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {buyer.priceChange > 0 ? '+' : ''}{buyer.priceChange}%
                        </div>
                      </div>
                      <div className="col-span-2 bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                        <div className="text-[8px] text-neutral-500 uppercase mb-0.5">{tTop.shareCount}</div>
                        <div className="text-sm text-white font-mono font-bold">{formatNumber(buyer.shares)}</div>
                      </div>
                      <div className="col-span-2 bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                        <div className="text-[8px] text-neutral-500 uppercase mb-0.5">{tTop.totalAmount}</div>
                        <div className="text-sm text-emerald-500 font-bold font-mono">{formatCurrency(buyer.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3 p-4 bg-neutral-950/20 overflow-y-auto">
              {/* Signal Badge */}
              <div className="px-3 py-3 bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-sm text-emerald-500 font-bold uppercase tracking-wider">{tTop.strongBuy}</span>
                </div>
                <span className="text-[10px] text-emerald-500/70 font-mono">
                  {langKey === 'ko' ? '클러스터 매수 감지' : 'CLUSTER BUY DETECTED'}
                </span>
              </div>

              {/* AI Analysis */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                  <Brain size={11} className="text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">{t.aiAnalysis.toUpperCase()}</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">{t.signal.toUpperCase()}</div>
                      <div className="text-xl font-light text-emerald-500">{aiAnalysis?.signal || 'BUY'}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">{t.confidence.toUpperCase()}</div>
                      <div className="text-xl font-light text-neutral-200">{aiAnalysis?.confidence || 85}%</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed italic border-l-2 border-emerald-700 pl-2">
                    {aiAnalysis?.insight}
                  </p>
                </div>
              </div>

              {/* Price Targets */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                  <Target size={11} className="text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">{t.priceTargets.toUpperCase()}</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">{t.conservative.toUpperCase()}</span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-neutral-600 rounded-sm" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">{formatCurrency(aiAnalysis?.priceTargets.conservative || stats.avgPrice * 1.05)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">{t.realistic.toUpperCase()}</span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-sm" style={{ width: '80%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">{formatCurrency(aiAnalysis?.priceTargets.realistic || stats.avgPrice * 1.12)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">{t.optimistic.toUpperCase()}</span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-sm" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">{formatCurrency(aiAnalysis?.priceTargets.optimistic || stats.avgPrice * 1.2)}</span>
                  </div>
                </div>
              </div>

              {/* Risk & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">{t.riskLevel.toUpperCase()}</div>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <AlertTriangle size={12} />
                    <span className="text-xs font-bold">{aiAnalysis?.riskLevel || t.riskLow}</span>
                  </div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">{t.timeHorizon.toUpperCase()}</div>
                  <div className="text-xs text-neutral-300 font-mono">{aiAnalysis?.timeHorizon || '2-4 weeks'}</div>
                </div>
              </div>

              {/* News */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2 cursor-pointer hover:bg-neutral-900/50 transition-colors" onClick={() => setNewsExpanded(!newsExpanded)}>
                  <Newspaper size={11} className="text-amber-500" />
                  <span className="text-[9px] text-amber-500 uppercase tracking-widest font-mono font-bold">{t.relatedNews.toUpperCase()}</span>
                  <div className="ml-auto flex items-center gap-1 text-neutral-500">
                    <span className="text-[8px] font-mono uppercase">{newsExpanded ? t.hideDetails : t.showDetails}</span>
                    {newsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </div>
                </div>
                {newsExpanded && (
                  <div className="p-3 space-y-1">
                    {news.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1.5 border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-900/30 transition-colors">
                        <span className="text-[10px] text-neutral-300 truncate flex-1 mr-2">{item.title}</span>
                        <span className={`text-[7px] px-1.5 py-0.5 border font-mono uppercase tracking-wider shrink-0 ${item.sentiment === 'POSITIVE' ? 'text-emerald-500 border-emerald-900/30 bg-emerald-950/20' : 'text-neutral-500 border-neutral-800 bg-neutral-950/20'}`}>
                          {item.sentiment}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[9px] text-neutral-600">
                  <span className="font-mono uppercase tracking-wider">
                    {langKey === 'ko' ? '실시간 내부자 거래 알림' : 'Real-Time Insider Trade Alerts'}
                  </span>
                  <span className="font-bold text-neutral-500">InsiderPulse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
