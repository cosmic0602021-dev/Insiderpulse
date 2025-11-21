import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Lock, Clock, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { TRANSLATIONS, formatCurrency, formatNumber, formatPercent, type Language } from '@/lib/translations';
import type { InsiderTrade } from '@shared/schema';
import { apiClient, queryKeys } from '@/lib/api';
import { useAccess } from '@/contexts/access-context';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useLocation } from 'wouter';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { formatDistanceToNow } from 'date-fns';
import { ko, ja, zhCN, enUS } from 'date-fns/locale';

// Map InsiderTrade to terminal UI Trade interface
interface TerminalTrade {
  id: string;
  ticker: string;
  companyName: string;
  insider: string;
  relation: string;
  type: 'Buy' | 'Sell';
  shares: number;
  price: number;
  value: number;
  date: string;
  priceChange: number;
  isVerified: boolean;
}

function mapInsiderTradeToTerminal(trade: InsiderTrade): TerminalTrade {
  return {
    id: trade.id,
    ticker: trade.ticker || 'N/A',
    companyName: trade.companyName,
    insider: trade.traderName,
    relation: trade.traderTitle || 'Unknown',
    type: trade.tradeType === 'BUY' ? 'Buy' : 'Sell',
    shares: trade.shares,
    price: trade.pricePerShare,
    value: trade.totalValue,
    date: new Date(trade.filedDate).toISOString(),
    priceChange: trade.priceVariance || 0,
    isVerified: trade.isVerified || false,
  };
}

export default function LiveTradingTerminal() {
  const { language } = useLanguage();
  const { accessLevel, setAccessLevel } = useAccess();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<'All' | 'Buy' | 'Sell'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(100);

  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].live;
  const tData = TRANSLATIONS[langKey].data;
  const tCommon = TRANSLATIONS[langKey].common;

  const isPro = accessLevel?.hasRealtimeAccess || false;

  // Fetch trades with access level
  const { data: tradesResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: loadedCount,
      offset: 0,
      sortBy: 'createdAt'
    }),
    queryFn: async () => {
      const response = await apiClient.getInsiderTradesWithAccess(loadedCount, 0, undefined, undefined, 'createdAt');
      if (response.accessLevel) {
        setAccessLevel(response.accessLevel);
      }
      return response;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const allTrades = useMemo(() => tradesResponse?.trades || [], [tradesResponse?.trades]);

  // WebSocket connection for real-time updates
  const wsUrl = getWebSocketUrl();
  const { isConnected } = useWebSocket(wsUrl);

  // Map to terminal format and apply filters
  const terminalTrades = useMemo(() => {
    return allTrades.map(mapInsiderTradeToTerminal);
  }, [allTrades]);

  const filteredData = useMemo(() => {
    let result = terminalTrades;

    // Apply type filter
    if (filter !== 'All') {
      result = result.filter(t => t.type === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.ticker.toLowerCase().includes(query) ||
        t.companyName.toLowerCase().includes(query) ||
        t.insider.toLowerCase().includes(query)
      );
    }

    return result;
  }, [terminalTrades, filter, searchQuery]);

  const realTimeItems = isPro ? filteredData.slice(0, 3) : [];
  const historicalItems = isPro ? filteredData.slice(3) : filteredData;

  const handleSelectTrade = (trade: TerminalTrade) => {
    // Find original InsiderTrade
    const original = allTrades.find(t => t.id === trade.id);
    if (original) {
      setSelectedTrade(original);
      setIsModalOpen(true);
    }
  };

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate('/signup');
    } else {
      navigate('/premium-checkout');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
      <style>{`
        @keyframes stripe-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animate-stripe-scroll {
          animation: stripe-scroll 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>

      {/* Header */}
      <div className="p-6 border-b border-neutral-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight flex items-center gap-3">
              {t.header}
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/20 text-amber-500 border border-amber-900/30 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] whitespace-nowrap">
                  {t.delayedBadge}
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2">
              {isPro ? (
                <>
                  <Zap size={10} className="text-emerald-500" /> {t.realtime}
                  {isConnected && <span className="text-emerald-500">● CONNECTED</span>}
                </>
              ) : (
                <>
                  <Clock size={10} className="text-amber-600" /> {t.delayed}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-3 items-center self-end">
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
              {language === 'ko' ? '업데이트됨' : language === 'ja' ? '更新' : language === 'zh' ? '更新时间' : 'UPDATED'}: {new Date().toLocaleTimeString(language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              className="p-2 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors bg-neutral-900/30"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder={t.query}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] text-xs text-neutral-300 border border-neutral-800 pl-10 pr-4 py-2.5 focus:outline-none focus:border-neutral-600 font-mono placeholder:text-neutral-800 transition-colors"
              data-testid="input-search"
            />
          </div>
          <div className="flex bg-[#0a0a0a] border border-neutral-800 p-1 gap-1 w-full md:w-auto overflow-x-auto">
            {[
              { key: 'All', label: t.filter.all },
              { key: 'Buy', label: t.filter.buy },
              { key: 'Sell', label: t.filter.sell }
            ].map((f) => (
              <button 
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${
                  (filter === f.key) && f.key === 'All' ? 'bg-neutral-800 text-white' :
                  (filter === f.key) && f.key === 'Buy' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-900/30' :
                  (filter === f.key) && f.key === 'Sell' ? 'bg-rose-900/20 text-rose-500 border border-rose-900/30' :
                  'text-neutral-600 hover:text-neutral-400'
                }`}
                data-testid={`button-filter-${f.key.toLowerCase()}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

        {/* Table Header */}
        <div className="sticky top-0 bg-[#050505] border-b border-neutral-800 z-30 grid grid-cols-5 md:grid-cols-8 text-[10px] text-neutral-600 uppercase tracking-widest font-mono px-4 py-3">
          <div className="pl-2">{t.table.ticker}</div>
          <div className="hidden md:block">{t.table.insider}</div>
          <div className="hidden md:block">{t.table.relation}</div>
          <div className="text-right">{t.table.action}</div>
          <div className="text-right hidden md:block">{t.table.volume}</div>
          <div className="text-right">{t.table.value}</div>
          <div className="text-right">{t.table.impact}</div>
          <div className="text-right pr-2">{t.table.time}</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center text-neutral-600 text-sm font-mono">
            LOADING_TRADE_DATA...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
            <p className="text-neutral-400 text-sm">ERROR: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}

        {/* Real-Time Zone (Pro Only) */}
        {!isLoading && !error && isPro && realTimeItems.length > 0 && (
          <div>
            <div className="sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2 bg-emerald-900/10 border-b-emerald-900/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-emerald-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">{t.realtimeZone}</span>
              </div>
              <span className="text-[8px] text-neutral-600 font-mono">LIVE_STREAM_ACTIVE</span>
            </div>
            {realTimeItems.map((trade) => (
              <TradeRow 
                key={trade.id} 
                trade={trade} 
                onClick={() => handleSelectTrade(trade)}
                tData={tData}
              />
            ))}
          </div>
        )}

        {/* Locked Zone (Free Users) - Simplified like og1.png */}
        {!isLoading && !error && !isPro && filteredData.length > 0 && (
          <div className="relative border-b border-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="sticky top-[45px] bg-[#050505] border-b border-amber-900/20 z-30 px-4 py-2 bg-amber-900/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-amber-600" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600">{t.realtimeZone}</span>
              </div>
              <span className="text-[8px] text-neutral-600 font-mono">{t.encrypted}</span>
            </div>

            {/* Blurred content underneath to show data exists */}
            <div className="blur-sm opacity-30 pointer-events-none select-none">
              {filteredData.slice(0, 3).map((trade) => (
                <TradeRow 
                  key={trade.id} 
                  trade={trade} 
                  onClick={() => {}}
                  tData={tData}
                />
              ))}
            </div>

            {/* Overlay with animated diagonal stripes (like og1.png) */}
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-gradient-to-b from-amber-900/10 to-amber-950/20">
              {/* Base amber tint overlay */}
              <div className="absolute inset-0 bg-amber-600/8"></div>
              
              {/* Animated diagonal stripe pattern */}
              <div 
                className="absolute inset-0 animate-stripe-scroll"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(245, 158, 11, 0.12) 15px, rgba(245, 158, 11, 0.12) 30px)',
                }}
              ></div>
              
              {/* Inner shadow effect */}
              <div className="absolute inset-0 shadow-[inset_0_2px_20px_rgba(0,0,0,0.4)]"></div>
              
              <button 
                onClick={handleUpgrade}
                className="px-10 py-4 bg-gradient-to-b from-neutral-900 to-black border-[3px] border-amber-500 text-amber-500 text-sm font-black uppercase tracking-[0.2em] hover:from-black hover:to-neutral-900 hover:border-amber-400 hover:text-amber-400 transition-all flex items-center gap-3 relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(245,158,11,0.3)]"
                data-testid="button-upgrade"
                style={{
                  textShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                }}
              >
                🔓 {t.upgradeAction}
              </button>
            </div>
          </div>
        )}

        {/* Historical Data */}
        {!isLoading && !error && historicalItems.length > 0 && (
          <div>
            {isPro && (
              <div className="sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">Historical Records</span>
              </div>
            )}
            {historicalItems.map((trade) => (
              <TradeRow 
                key={trade.id} 
                trade={trade} 
                onClick={() => handleSelectTrade(trade)}
                tData={tData}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && filteredData.length === 0 && (
          <div className="p-8 text-center text-neutral-600 text-sm font-mono">
            {t.noRecords}
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade as any}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// Trade Row Component
interface TradeRowProps {
  trade: TerminalTrade;
  onClick: () => void;
  tData: Record<string, string>;
}

function TradeRow({ trade, onClick, tData }: TradeRowProps) {
  const { language } = useLanguage();
  const isBuy = trade.type === 'Buy';
  const typeClass = isBuy ? 'text-emerald-500' : 'text-rose-500';
  const typeBg = isBuy ? 'bg-emerald-900/20 border-emerald-900/30' : 'bg-rose-900/20 border-rose-900/30';
  
  // Format time ago based on language
  const dateLocale = language === 'ko' ? ko : language === 'ja' ? ja : language === 'zh' ? zhCN : enUS;
  const timeAgo = formatDistanceToNow(new Date(trade.date), {
    addSuffix: true,
    locale: dateLocale
  });

  return (
    <div 
      onClick={onClick}
      className="grid grid-cols-5 md:grid-cols-8 text-xs border-b border-neutral-900 hover:bg-neutral-900/30 transition-colors cursor-pointer px-4 py-3"
      data-testid={`trade-row-${trade.ticker}`}
    >
      {/* Ticker */}
      <div className="flex items-center gap-2 pl-2">
        <span className="font-mono font-bold text-neutral-200">{trade.ticker}</span>
        {trade.isVerified && (
          <span className="text-[8px] text-emerald-600">✓</span>
        )}
      </div>

      {/* Insider (Hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <span className="text-neutral-400 truncate">{trade.insider}</span>
      </div>

      {/* Relation (Hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <span className="text-neutral-600 text-[10px] truncate">{trade.relation}</span>
      </div>

      {/* Action */}
      <div className="flex items-center justify-end">
        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${typeBg} ${typeClass} rounded`}>
          {tData[trade.type] || trade.type}
        </span>
      </div>

      {/* Volume (Hidden on mobile) */}
      <div className="hidden md:flex items-center justify-end">
        <span className="text-neutral-400 font-mono">{formatNumber(trade.shares)}</span>
      </div>

      {/* Value */}
      <div className="flex items-center justify-end">
        <span className="text-neutral-300 font-mono">{formatCurrency(trade.value)}</span>
      </div>

      {/* Impact */}
      <div className="flex items-center justify-end">
        {trade.priceChange !== 0 && (
          <span className={`flex items-center gap-1 font-mono ${trade.priceChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trade.priceChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPercent(trade.priceChange)}
          </span>
        )}
        {trade.priceChange === 0 && (
          <span className="text-neutral-600 text-[10px]">—</span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center justify-end pr-2">
        <span className="text-neutral-600 text-[10px] font-mono">{timeAgo}</span>
      </div>
    </div>
  );
}
