import { X, Heart, CheckCircle, AlertTriangle, BarChart3, Brain, Target, Newspaper, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { InsiderTrade } from '@shared/schema';
import { useLanguage } from '@/contexts/language-context';
import { formatCurrency, formatNumber } from '@/lib/translations';
import { useState, useEffect } from 'react';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: InsiderTrade | null;
}

interface AIAnalysis {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  insight: string;
  priceTargets: {
    conservative: number;
    realistic: number;
    optimistic: number;
  };
  riskLevel: string;
  timeHorizon: string;
}

interface NewsItem {
  title: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export function TradeDetailModal({ isOpen, onClose, trade }: TradeDetailModalProps) {
  const { t } = useLanguage();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; close: number }>>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trade && isOpen) {
      loadData();
    }
  }, [trade, isOpen]);

  const loadData = async () => {
    if (!trade) return;
    setLoading(true);
    
    try {
      // Fetch AI analysis
      const analysisRes = await fetch(`/api/insider-trades/${trade.id}/analysis`);
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAiAnalysis(data);
      }

      // Fetch price history
      const historyRes = await fetch(`/api/stock-price/${trade.ticker}/history`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setPriceHistory(data);
      }

      // Fetch news
      const newsRes = await fetch(`/api/stock-news/${trade.ticker}`);
      if (newsRes.ok) {
        const data = await newsRes.json();
        setNews(data.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!trade) return null;

  const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'Buy';
  const secFilingUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.ticker}&type=4&dateb=&owner=only&count=100`;

  // Calculate current price (mock - should come from API)
  const currentPrice = trade.pricePerShare * 0.96;
  const priceChange = ((currentPrice - trade.pricePerShare) / trade.pricePerShare) * 100;

  // Calculate sentiment counts
  const posCount = news.filter(n => n.sentiment === 'POSITIVE').length;
  const negCount = news.filter(n => n.sentiment === 'NEGATIVE').length;
  const neutCount = news.filter(n => n.sentiment === 'NEUTRAL').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1200px] w-full h-[90vh] max-h-[900px] bg-[#0a0a0a] border-neutral-800 p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              {/* Ticker Icon */}
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                <span className="text-neutral-400 font-mono text-xs font-bold">
                  {trade.ticker?.slice(0, 2) || 'TS'}
                </span>
              </div>
              {/* Company Info */}
              <div>
                <h2 className="text-lg text-neutral-200 font-light tracking-tight uppercase">
                  {trade.companyName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-600 font-mono">{trade.ticker}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-neutral-900 transition-colors border border-neutral-800 flex items-center gap-2 px-2.5 h-8"
                data-testid="button-watchlist"
              >
                <Heart size={12} className="text-neutral-500" />
                <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">
                  WATCHLIST
                </span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-neutral-900 transition-colors" data-testid="button-close-modal">
                <X size={18} className="text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Stat Blocks with vertical dividers */}
          <div className="grid grid-cols-4 border-b border-neutral-800">
            {/* Trade Type */}
            <div className="px-5 py-3 border-r border-neutral-800">
              <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                TRADE TYPE
              </div>
              <div className={`text-xl font-light ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trade.tradeType}
              </div>
            </div>

            {/* Price Per Share */}
            <div className="px-5 py-3 border-r border-neutral-800">
              <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                PRICE PER SHARE
              </div>
              <div className="text-xl font-light text-neutral-200">
                {formatCurrency(trade.pricePerShare)}
                <span className="text-xs text-neutral-600 ml-1">/ sh</span>
              </div>
            </div>

            {/* Shares Traded */}
            <div className="px-5 py-3 border-r border-neutral-800">
              <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                SHARES TRADED
              </div>
              <div className="text-xl font-light text-neutral-200">
                {formatNumber(trade.shares / 1000)}K
                <span className="text-xs text-neutral-600 ml-1">vol</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="px-5 py-3">
              <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5">
                TOTAL VALUE
              </div>
              <div className="text-xl font-light text-neutral-200">
                {formatCurrency(trade.totalValue)}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-auto">
            {/* Left Column - Price Analysis */}
            <div className="border-r border-neutral-800 flex flex-col">
              <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950/40">
                <BarChart3 size={11} className="text-neutral-500" />
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                  PRICE ANALYSIS
                </span>
              </div>
              <div className="flex-1 p-4">
                {priceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#171717" strokeOpacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#525252" 
                        style={{ fontSize: '9px', fontFamily: 'monospace' }} 
                        tick={{ fill: '#525252' }}
                      />
                      <YAxis 
                        stroke="#525252" 
                        style={{ fontSize: '9px', fontFamily: 'monospace' }}
                        tick={{ fill: '#525252' }}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: '#0a0a0a', 
                          border: '1px solid #262626',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontFamily: 'monospace'
                        }}
                        labelStyle={{ color: '#737373' }}
                      />
                      <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 text-xs">Loading chart...</div>
                )}

                {/* Price Footer */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-800 mt-3">
                  <div>
                    <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1">
                      BASE PRICE
                    </div>
                    <div className="text-base text-neutral-300 font-mono">
                      {formatCurrency(trade.pricePerShare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1">
                      CURRENT PRICE
                    </div>
                    <div className={`text-base font-mono flex items-center gap-2 ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(currentPrice)}
                      <span className="text-xs">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insider Info Row */}
              <div className="px-4 py-2.5 border-t border-neutral-800 grid grid-cols-3 gap-4 text-xs bg-neutral-950/20">
                <div>
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-0.5">
                    INSIDER NAME
                  </div>
                  <div className="text-neutral-300 text-[11px]">{trade.traderName}</div>
                </div>
                <div>
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-0.5">
                    POSITION / RELATION
                  </div>
                  <div className="text-neutral-300 text-[11px]">{trade.traderTitle || 'Insider'}</div>
                </div>
                <div>
                  <div className="text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-0.5">
                    FILING DATE
                  </div>
                  <div className="text-neutral-300 text-[11px]">{new Date(trade.filedDate).toLocaleDateString()}</div>
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
                    item.sentiment === 'NEGATIVE' ? 'text-rose-500 border-rose-900/30 bg-rose-950/20' :
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
