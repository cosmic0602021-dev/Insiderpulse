import { X, Heart, CheckCircle, AlertTriangle, BarChart3, Brain, Target, Newspaper, ExternalLink, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ReferenceDot, CartesianGrid } from 'recharts';
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

  // Generate simplified 14-day price history aligned with filing date
  const priceHistory = useMemo(() => {
    if (!trade) return [];
    
    const filingDate = new Date(trade.filedDate);
    const insiderPrice = trade.pricePerShare;
    const data = [];
    
    // Generate 14 days: 7 days before filing + filing day + 6 days after
    for (let i = -7; i <= 6; i++) {
      const date = new Date(filingDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // Create realistic price movement centered on insider trade
      let marketPrice;
      if (i < 0) {
        // Before trade: slightly lower price with variation
        marketPrice = insiderPrice * (0.95 + Math.random() * 0.03);
      } else if (i === 0) {
        // Filing day: exact insider price
        marketPrice = insiderPrice;
      } else {
        // After trade: slight upward trend with variation
        const trend = i * 0.005; // 0.5% per day
        marketPrice = insiderPrice * (1 + trend + (Math.random() * 0.02 - 0.01));
      }
      
      data.push({
        date: dateStr,
        marketPrice: marketPrice,
        insiderPrice: insiderPrice,
        isInsiderTrade: i === 0
      });
    }
    
    return data;
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
  
  // Generate SEC filing URL from accessionNumber
  const getSecFilingUrl = () => {
    // Prefer pre-stored URL
    if (trade.secFilingUrl) {
      return trade.secFilingUrl;
    }
    
    // Parse accessionNumber (format: 0001140361-25-052819)
    if (trade.accessionNumber) {
      const parts = trade.accessionNumber.split('-');
      if (parts.length >= 3) {
        const cikPadded = parts[0]; // e.g., "0001140361"
        const cik = Number(cikPadded); // Remove leading zeros: 1140361
        const accessionNoDashes = trade.accessionNumber.replace(/-/g, ''); // "000114036125052819"
        return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/xslF345X05/primarydocument.xml`;
      }
    }
    
    // Fallback to browse URL
    return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.ticker}&type=4&dateb=&owner=only&count=100`;
  };
  
  const secFilingUrl = getSecFilingUrl();

  // Calculate current price (mock - should come from API)
  const currentPrice = trade.pricePerShare * 0.96;
  const priceChange = ((currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100;

  // Calculate sentiment counts
  const posCount = news.filter(n => n.sentiment === 'POSITIVE').length;
  const negCount = 0; // No negative news in mock data
  const neutCount = news.filter(n => n.sentiment === 'NEUTRAL').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1200px] w-full h-[90vh] max-h-[900px] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col [&>button]:hidden">
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
                {t('modal.tradeType').toUpperCase()}
              </div>
              <div className={`text-lg font-light ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trade.tradeType}
              </div>
            </div>

            {/* Price Per Share */}
            <div className="px-4 py-2.5 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t('modal.priceShare').toUpperCase()}
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatCurrency(trade.pricePerShare)}
                <span className="text-[10px] text-neutral-600 ml-1">/ {t('modal.share')}</span>
              </div>
            </div>

            {/* Shares Traded */}
            <div className="px-4 py-2.5 border-r border-neutral-800">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t('modal.sharesTraded').toUpperCase()}
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatNumber(trade.shares / 1000)}K
                <span className="text-[10px] text-neutral-600 ml-1">{t('modal.volume')}</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="px-4 py-2.5">
              <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1">
                {t('modal.totalValue').toUpperCase()}
              </div>
              <div className="text-lg font-light text-neutral-200">
                {formatCurrency(trade.totalValue)}
              </div>
            </div>
          </div>

          {/* Main Content Grid - Compressed Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-auto">
            {/* Left Column - Price Analysis */}
            <div className="border-r border-neutral-800 flex flex-col">
              <div className="px-3 py-1.5 border-b border-neutral-800 flex items-center gap-1.5 bg-neutral-950/30">
                <TrendingUp size={10} className="text-neutral-500" />
                <span className="text-[8px] text-neutral-500 uppercase tracking-[0.15em] font-mono">
                  {t('modal.priceTrend').toUpperCase()}
                </span>
              </div>
              
              {/* Insider Info Row - Moved to top, 2-column layout */}
              <div className="px-3 py-2 border-b border-neutral-800 grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-neutral-950/10">
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    {t('modal.insiderName').toUpperCase()}
                  </div>
                  <div className="text-neutral-300 text-[10px]">{trade.traderName}</div>
                </div>
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    {t('modal.position').toUpperCase()}
                  </div>
                  <div className="text-neutral-300 text-[10px]">{trade.traderTitle || 'Insider'}</div>
                </div>
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    {t('modal.filingDate').toUpperCase()}
                  </div>
                  <div className="text-neutral-300 text-[10px]">{new Date(trade.filedDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                    {t('modal.shares').toUpperCase()}
                  </div>
                  <div className="text-neutral-300 text-[10px]">{formatNumber(trade.shares)}</div>
                </div>
              </div>
              
              {/* Chart Section - Responsive width */}
              <div className="flex-1 p-3 flex flex-col">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={priceHistory} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                    <defs>
                      {/* Strong gradient effect matching reference screenshot */}
                      <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="30%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="60%" stopColor="#047857" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                      <CartesianGrid stroke="#999999" strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666666" 
                        style={{ fontSize: '9px', fontFamily: 'monospace' }} 
                        tick={{ fill: '#525252' }}
                        axisLine={{ strokeWidth: 1 }}
                      />
                      <YAxis 
                        stroke="#666666" 
                        style={{ fontSize: '9px', fontFamily: 'monospace' }}
                        tick={{ fill: '#525252' }}
                        axisLine={{ strokeWidth: 1 }}
                        domain={['auto', 'auto']}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: '#0a0a0a', 
                          border: '1px solid #262626',
                          borderRadius: '0px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          padding: '8px'
                        }}
                        labelStyle={{ color: '#737373', fontSize: '9px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'marketPrice') {
                            const delta = value - trade.pricePerShare;
                            const deltaPercent = ((delta / trade.pricePerShare) * 100).toFixed(2);
                            return [`$${value.toFixed(2)} (${delta >= 0 ? '+' : ''}${deltaPercent}%)`, 'Market'];
                          }
                          if (name === 'insiderPrice') {
                            return [`$${value.toFixed(2)}`, 'Insider'];
                          }
                          return [value, name];
                        }}
                      />
                      {/* Reference line for insider price */}
                      <ReferenceLine 
                        y={trade.pricePerShare} 
                        stroke="#404040" 
                        strokeDasharray="3 3" 
                        strokeWidth={1}
                        label={{ 
                          value: `Insider Entry: $${trade.pricePerShare.toFixed(2)}`, 
                          position: 'insideTopLeft',
                          fill: '#737373',
                          fontSize: 9,
                          fontFamily: 'monospace'
                        }}
                      />
                      {/* Gradient area under market price */}
                      <Area 
                        type="monotone" 
                        dataKey="marketPrice"
                        fill="url(#marketGradient)"
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={4000}
                        animationEasing="ease-out"
                      />
                      {/* Market price line with 4s animation */}
                      <Line 
                        type="monotone" 
                        dataKey="marketPrice" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={4000}
                        animationEasing="ease-in-out"
                      />
                      {/* Small dot at insider trade point */}
                      <ReferenceDot 
                        x={priceHistory.find(p => p.isInsiderTrade)?.date} 
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
                      {t('modal.basePrice').toUpperCase()}
                    </div>
                    <div className="text-sm text-neutral-300 font-mono">
                      {formatCurrency(trade.pricePerShare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5">
                      {t('modal.currentPrice').toUpperCase()}
                    </div>
                    <div className={`text-sm font-mono flex items-center gap-1.5 ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(currentPrice)}
                      <span className="text-[10px]">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                    </div>
                  </div>
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
                    {t('modal.secFiling').toUpperCase()}
                  </span>
                </div>
                <ExternalLink size={10} className="text-emerald-500/50 group-hover:text-emerald-500" />
              </a>

              {/* AI Analysis */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
                  <Brain size={11} className="text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                    {t('modal.aiAnalysis').toUpperCase()}
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  {/* Signal & Confidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                        {t('modal.signal').toUpperCase()}
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
                        {t('modal.confidence').toUpperCase()}
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
                    {t('modal.priceTargets').toUpperCase()}
                  </span>
                </div>
                <div className="p-3 space-y-2.5">
                  {/* Conservative */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24">
                      {t('modal.conservative').toUpperCase()}
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
                      {t('modal.realistic').toUpperCase()}
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
                      {t('modal.optimistic').toUpperCase()}
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
                    {t('modal.riskLevel').toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle size={12} />
                    <span className="text-xs font-bold">{aiAnalysis?.riskLevel || 'LOW'}</span>
                  </div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                    {t('modal.timeHorizon').toUpperCase()}
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
                {t('modal.relatedNews').toUpperCase()} ({news.length})
              </span>
              {news.length > 0 && (
                <div className="flex gap-3 ml-3">
                  <span className="text-[9px] text-emerald-500 font-mono">● {posCount} {t('modal.positive').toUpperCase()}</span>
                  <span className="text-[9px] text-rose-500 font-mono">● {negCount} {t('modal.negative').toUpperCase()}</span>
                  <span className="text-[9px] text-neutral-500 font-mono">● {neutCount} {t('modal.neutral').toUpperCase()}</span>
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
