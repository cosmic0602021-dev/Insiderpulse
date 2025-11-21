import { X, Heart, CheckCircle, AlertTriangle, BarChart3, Brain, Target, Newspaper } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { InsiderTrade } from '@shared/schema';
import { useLanguage } from '@/contexts/language-context';
import { formatCurrency, formatNumber } from '@/lib/translations';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: InsiderTrade | null;
}

export function TradeDetailModal({ isOpen, onClose, trade }: TradeDetailModalProps) {
  if (!trade) return null;

  const { t } = useLanguage();
  const isBuy = trade.tradeType === 'BUY' || trade.tradeType === 'Buy';

  // Mock data for demonstration - replace with real data later
  const priceHistory = [
    { date: '11/15', close: 8.5 },
    { date: '11/18', close: 9.0 },
    { date: '11/20', close: 9.37 },
    { date: '11/21', close: 9.65 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] bg-[#0a0a0a] border-neutral-800 p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-4">
              {/* Ticker Icon */}
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                <span className="text-neutral-400 font-mono text-sm font-bold">
                  {trade.ticker?.slice(0, 2) || 'TS'}
                </span>
              </div>
              {/* Company Info */}
              <div>
                <h2 className="text-xl text-neutral-200 font-light tracking-tight uppercase">
                  {trade.companyName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-neutral-600 font-mono">{trade.ticker}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-neutral-900 transition-colors border border-neutral-800 flex items-center gap-2 px-3"
                data-testid="button-watchlist"
              >
                <Heart size={14} className="text-neutral-500" />
                <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider">
                  WATCHLIST
                </span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-neutral-900 transition-colors" data-testid="button-close-modal">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Stat Blocks */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-neutral-800">
            {/* Trade Type */}
            <div>
              <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                TRADE TYPE
              </div>
              <div className={`text-2xl font-light ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trade.tradeType}
              </div>
            </div>

            {/* Price Per Share */}
            <div>
              <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                PRICE PER SHARE
              </div>
              <div className="text-2xl font-light text-neutral-200">
                {formatCurrency(trade.pricePerShare)}
                <span className="text-sm text-neutral-600 ml-1">/ sh</span>
              </div>
            </div>

            {/* Shares Traded */}
            <div>
              <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                SHARES TRADED
              </div>
              <div className="text-2xl font-light text-neutral-200">
                {formatNumber(trade.shares / 1000)}K
                <span className="text-sm text-neutral-600 ml-1">vol</span>
              </div>
            </div>

            {/* Total Value */}
            <div>
              <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                TOTAL VALUE
              </div>
              <div className="text-2xl font-light text-neutral-200">
                {formatCurrency(trade.totalValue)}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-[1fr_400px] gap-4 px-6 py-4 overflow-auto">
            {/* Left Column - Price Analysis */}
            <div className="border border-neutral-800 bg-neutral-950/30">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <BarChart3 size={12} className="text-neutral-500" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  PRICE ANALYSIS
                </span>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#737373" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#737373" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #262626' }}
                      labelStyle={{ color: '#a3a3a3' }}
                    />
                    <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>

                {/* Price Footer */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-800">
                  <div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                      BASE PRICE
                    </div>
                    <div className="text-lg text-neutral-300 font-mono">
                      {formatCurrency(trade.pricePerShare)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                      CURRENT PRICE
                    </div>
                    <div className="text-lg text-rose-500 font-mono flex items-center gap-2">
                      {formatCurrency(trade.pricePerShare * 0.96)}
                      <span className="text-sm">-4.47%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insider Info Row */}
              <div className="px-4 py-3 border-t border-neutral-800 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                    INSIDER NAME
                  </div>
                  <div className="text-neutral-300">{trade.traderName}</div>
                </div>
                <div>
                  <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                    POSITION / RELATION
                  </div>
                  <div className="text-neutral-300">{trade.traderTitle || 'CEO'}</div>
                </div>
                <div>
                  <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
                    FILING DATE
                  </div>
                  <div className="text-neutral-300">{new Date(trade.filedDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Right Column - AI Analysis & Targets */}
            <div className="flex flex-col gap-4">
              {/* SEC Verification */}
              <div className="px-3 py-2 bg-emerald-950/20 border border-emerald-900/30 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-mono">
                  VERIFIED BY SEC
                </span>
              </div>

              {/* AI Analysis */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                  <Brain size={12} className="text-neutral-500" />
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    AI ANALYSIS
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Signal & Confidence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                        SIGNAL
                      </div>
                      <div className={`text-2xl font-light ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                        CONFIDENCE
                      </div>
                      <div className="text-2xl font-light text-neutral-200">97%</div>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Merger discussions rumored in industry reports.
                  </p>
                </div>
              </div>

              {/* Price Targets */}
              <div className="border border-neutral-800 bg-neutral-950/30">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                  <Target size={12} className="text-neutral-500" />
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    PRICE TARGETS
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {/* Conservative */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                      CONSERVATIVE
                    </span>
                    <div className="flex-1 mx-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-600 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm text-neutral-300 font-mono">{formatCurrency(9.85)}</span>
                  </div>

                  {/* Realistic */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                      REALISTIC
                    </span>
                    <div className="flex-1 mx-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <span className="text-sm text-neutral-300 font-mono">{formatCurrency(11.19)}</span>
                  </div>

                  {/* Optimistic */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                      OPTIMISTIC
                    </span>
                    <div className="flex-1 mx-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-sm text-neutral-300 font-mono">{formatCurrency(13.43)}</span>
                  </div>
                </div>
              </div>

              {/* Risk & Time Horizon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-neutral-800 bg-neutral-950/30 p-4">
                  <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                    RISK LEVEL
                  </div>
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertTriangle size={14} />
                    <span className="text-sm font-bold">LOW</span>
                  </div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950/30 p-4">
                  <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
                    TIME HORIZON
                  </div>
                  <div className="text-sm text-neutral-300 font-mono">3-6 MONTHS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom News Section */}
          <div className="border-t border-neutral-800 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper size={12} className="text-neutral-500" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                RELATED NEWS & SENTIMENT (4)
              </span>
              <div className="flex gap-2 ml-4">
                <span className="text-[9px] text-emerald-500 font-mono">● 7 POSITIVE</span>
                <span className="text-[9px] text-rose-500 font-mono">● 3 NEGATIVE</span>
                <span className="text-[9px] text-neutral-500 font-mono">● 2 NEUTRAL</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { title: 'Q3 2025 Earnings Call Transcript', sentiment: 'NEUTRAL' },
                { title: 'Company to Announce Third Quarter 2025 Financial Results', sentiment: 'NEUTRAL' },
                { title: 'Appoints William Plavanic to Board of Directors', sentiment: 'NEUTRAL' },
                { title: 'Market Growth Trends and Forecast Report 2025-2033', sentiment: 'POSITIVE' },
              ].map((news, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2 border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-900/30 transition-colors">
                  <span className="text-xs text-neutral-300">{news.title}</span>
                  <span className={`text-[9px] px-2 py-1 border font-mono uppercase tracking-wider ${
                    news.sentiment === 'POSITIVE' ? 'text-emerald-500 border-emerald-900/30 bg-emerald-950/20' :
                    news.sentiment === 'NEGATIVE' ? 'text-rose-500 border-rose-900/30 bg-rose-950/20' :
                    'text-neutral-500 border-neutral-800 bg-neutral-950/20'
                  }`}>
                    {news.sentiment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
