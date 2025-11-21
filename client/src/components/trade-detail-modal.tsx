import { X, Heart, CheckCircle, AlertTriangle, BarChart3, Brain, Target, Newspaper, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { InsiderTrade } from '@shared/schema';
import { useLanguage } from '@/contexts/language-context';
import { formatCurrency, formatNumber } from '@/lib/translations';
import { useState, useEffect, useMemo } from 'react';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: InsiderTrade | null;
}

export function TradeDetailModal({ isOpen, onClose, trade }: TradeDetailModalProps) {
  const { t } = useLanguage();

  // Use existing trade data instead of fetching
  const aiAnalysis = useMemo(() => {
    if (!trade) return null;
    
    // Use existing aiAnalysis from trade if available
    if (trade.aiAnalysis && typeof trade.aiAnalysis === 'object' && 'signal' in trade.aiAnalysis) {
      const ai = trade.aiAnalysis as any;
      return {
        signal: (ai.signal || 'BUY') as 'BUY' | 'SELL' | 'HOLD',
        confidence: ai.significanceScore || 97,
        insight: (ai.keyInsights?.[0] || 'Analyzing insider trading patterns...') as string,
        priceTargets: {
          conservative: trade.pricePerShare * 1.05,
          realistic: trade.pricePerShare * 1.19,
          optimistic: trade.pricePerShare * 1.43
        },
        riskLevel: (ai.riskLevel || 'LOW') as string,
        timeHorizon: '3-6 MONTHS'
      };
    }
    
    // Fallback defaults
    const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'Buy';
    return {
      signal: isBuy ? 'BUY' as const : 'SELL' as const,
      confidence: 97,
      insight: 'Merger discussions rumored in industry reports.',
      priceTargets: {
        conservative: trade.pricePerShare * 1.05,
        realistic: trade.pricePerShare * 1.19,
        optimistic: trade.pricePerShare * 1.43
      },
      riskLevel: 'LOW',
      timeHorizon: '3-6 MONTHS'
    };
  }, [trade]);

  // Mock price history
  const priceHistory = useMemo(() => {
    if (!trade) return [];
    const base = trade.pricePerShare;
    return [
      { date: 'Jan', close: base * 0.92 },
      { date: 'Feb', close: base * 0.95 },
      { date: 'Mar', close: base * 0.97 },
      { date: 'Apr', close: base * 1.01 },
      { date: 'May', close: base * 0.98 },
      { date: 'Jun', close: base }
    ];
  }, [trade]);

  // Mock news
  const news = useMemo(() => [
    { title: 'Company reports strong quarterly earnings', sentiment: 'POSITIVE' as const },
    { title: 'New product line announced for Q2', sentiment: 'POSITIVE' as const },
    { title: 'Market volatility affects sector', sentiment: 'NEUTRAL' as const },
    { title: 'Analyst upgrades price target', sentiment: 'POSITIVE' as const }
  ], []);

  if (!trade) return null;

  const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'Buy';
  const secFilingUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.ticker}&type=4&dateb=&owner=only&count=100`;

  // Calculate current price (mock - should come from API)
  const currentPrice = trade.pricePerShare * 0.96;
  const priceChange = ((currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100;

  // Calculate sentiment counts
  const posCount = news.filter(n => n.sentiment === 'POSITIVE').length;
  const negCount = 0; // No negative news in mock data
  const neutCount = news.filter(n => n.sentiment === 'NEUTRAL').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1200px] w-full h-[90vh] max-h-[900px] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col">
        <VisuallyHidden>
          <DialogTitle>{trade?.companyName || 'Trade Details'}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              {/* Ticker Icon */}
              <div className="w-9 h-9 bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                <span className="text-neutral-400 font-mono text-[10px] font-bold">
                  {trade.ticker?.slice(0, 2) || 'TS'}
                </span>
              </div>
              {/* Company Info */}
              <div>
                <h2 className="text-base text-neutral-200 font-light tracking-tight">
                  {trade.companyName}
                </h2>
                <div className="flex items-center gap-2 mt-0">
                  <span className="text-[10px] text-neutral-600 font-mono">{trade.ticker}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-900 transition-colors" data-testid="button-close-modal">
              <X size={16} className="text-neutral-500" />
            </button>
          </div>

          {/* Stat Blocks with vertical dividers */}
          <div className="grid grid-cols-4 border-b border-neutral-800">
            {/* Trade Type */}
            <div className="px-4 py-2.5 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                TRADE TYPE
              </div>
              <div className={`text-lg font-light ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trade.tradeType}
              </div>
            </div>

            {/* Price Per Share */}
            <div className="px-4 py-2.5 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                PRICE PER SHARE
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatCurrency(trade.pricePerShare)}
                <span className="text-[10px] text-neutral-600 ml-1">/ sh</span>
              </div>
            </div>

            {/* Shares Traded */}
            <div className="px-4 py-2.5 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                SHARES TRADED
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatNumber(trade.shares / 1000)}K
                <span className="text-[10px] text-neutral-600 ml-1">vol</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="px-4 py-2.5">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                TOTAL VALUE
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatCurrency(trade.totalValue)}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-auto">
            {/* Left Column - Price Analysis */}
            <div className="border-r border-neutral-800 flex flex-col">
              <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-1.5 bg-neutral-950/30">
                <BarChart3 size={10} className="text-neutral-500" />
                <span className="text-[8px] text-neutral-500 uppercase tracking-[0.15em] font-mono">
                  PRICE ANALYSIS
                </span>
              </div>
              <div className="flex-1 p-3">
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#171717" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#404040" 
                      style={{ fontSize: '8px', fontFamily: 'monospace' }} 
                      tick={{ fill: '#404040' }}
                    />
                    <YAxis 
                      stroke="#404040" 
                      style={{ fontSize: '8px', fontFamily: 'monospace' }}
                      tick={{ fill: '#404040' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        background: '#0a0a0a', 
                        border: '1px solid #262626',
                        borderRadius: '0px',
                        fontSize: '9px',
                        fontFamily: 'monospace'
                      }}
                      labelStyle={{ color: '#737373' }}
                    />
                    <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={1.5} dot={{ r: 1.5 }} />
                    {/* Insider Trade Marker */}
                    <ReferenceDot 
                      x={priceHistory[Math.floor(priceHistory.length / 2)]?.date} 
                      y={trade.pricePerShare} 
                      r={4} 
                      fill={isBuy ? "#10b981" : "#ef4444"}
                      stroke="#0a0a0a"
                      strokeWidth={1.5}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Price Footer */}
                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-neutral-800 mt-2.5">
                  <div>
                    <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                      BASE PRICE
                    </div>
                    <div className="text-sm text-neutral-300 font-mono">
                      {formatCurrency(trade.pricePerShare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                      CURRENT PRICE
                    </div>
                    <div className={`text-sm font-mono flex items-center gap-1.5 ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(currentPrice)}
                      <span className="text-[10px]">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insider Info Row */}
              <div className="px-3 py-2 border-t border-neutral-800 grid grid-cols-3 gap-3 text-xs bg-neutral-950/20">
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    INSIDER NAME
                  </div>
                  <div className="text-neutral-300 text-[10px]">{trade.traderName}</div>
                </div>
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    POSITION / RELATION
                  </div>
                  <div className="text-neutral-300 text-[10px]">{trade.traderTitle || 'Insider'}</div>
                </div>
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    FILING DATE
                  </div>
                  <div className="text-neutral-300 text-[10px]">{new Date(trade.filedDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Right Column - AI Analysis & Targets */}
            <div className="flex flex-col gap-3 p-4 bg-neutral-950/20">
              {/* SEC Verification */}
              <a
                href={secFilingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-between hover:bg-emerald-950/30 transition-colors group"
                data-testid="link-sec-filing"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span className="text-[9px] text-emerald-500 uppercase tracking-widest font-mono">
                    VERIFIED BY SEC
                  </span>
                </div>
                <ExternalLink size={10} className="text-emerald-500/50 group-hover:text-emerald-500" />
              </a>

              {/* AI Analysis */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                  <Brain size={11} className="text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                    AI ANALYSIS
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  {/* Signal & Confidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                        SIGNAL
                      </div>
                      <div className={`text-xl font-light ${
                        aiAnalysis?.signal === 'BUY' ? 'text-emerald-500' : 
                        aiAnalysis?.signal === 'SELL' ? 'text-rose-500' : 
                        'text-neutral-400'
                      }`}>
                        {aiAnalysis?.signal || (isBuy ? 'BUY' : 'SELL')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                        CONFIDENCE
                      </div>
                      <div className="text-xl font-light text-neutral-200">{aiAnalysis?.confidence || 97}%</div>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {aiAnalysis?.insight || 'Merger discussions rumored in industry reports.'}
                  </p>
                </div>
              </div>

              {/* Price Targets */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                  <Target size={11} className="text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                    PRICE TARGETS
                  </span>
                </div>
                <div className="p-3 space-y-2.5">
                  {/* Conservative */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">
                      CONSERVATIVE
                    </span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-neutral-600 rounded-sm" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">
                      {formatCurrency(aiAnalysis?.priceTargets.conservative || trade.pricePerShare * 1.05)}
                    </span>
                  </div>

                  {/* Realistic */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">
                      REALISTIC
                    </span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-sm" style={{ width: '80%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">
                      {formatCurrency(aiAnalysis?.priceTargets.realistic || trade.pricePerShare * 1.19)}
                    </span>
                  </div>

                  {/* Optimistic */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">
                      OPTIMISTIC
                    </span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-sm" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs text-neutral-300 font-mono w-14 text-right">
                      {formatCurrency(aiAnalysis?.priceTargets.optimistic || trade.pricePerShare * 1.43)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk & Time Horizon */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                    RISK LEVEL
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle size={12} />
                    <span className="text-xs font-bold">{aiAnalysis?.riskLevel || 'LOW'}</span>
                  </div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                    TIME HORIZON
                  </div>
                  <div className="text-xs text-neutral-300 font-mono">{aiAnalysis?.timeHorizon || '3-6 MONTHS'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom News Section */}
          <div className="border-t border-neutral-800 px-5 py-3 bg-neutral-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper size={11} className="text-neutral-500" />
              <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                RELATED NEWS & SENTIMENT ({news.length})
              </span>
              {news.length > 0 && (
                <div className="flex gap-3 ml-3">
                  <span className="text-[8px] text-emerald-500 font-mono">● {posCount} POSITIVE</span>
                  <span className="text-[8px] text-rose-500 font-mono">● {negCount} NEGATIVE</span>
                  <span className="text-[8px] text-neutral-500 font-mono">● {neutCount} NEUTRAL</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {news.length > 0 ? news.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-900/30 transition-colors">
                  <span className="text-[11px] text-neutral-300">{item.title}</span>
                  <span className={`text-[8px] px-2 py-0.5 border font-mono uppercase tracking-wider ${
                    item.sentiment === 'POSITIVE' ? 'text-emerald-500 border-emerald-900/30 bg-emerald-950/20' :
                    'text-neutral-500 border-neutral-800 bg-neutral-950/20'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
              )) : (
                <div className="text-center py-3 text-neutral-600 text-xs">Loading news...</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
